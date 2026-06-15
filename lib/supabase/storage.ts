import 'server-only';
import { requireSupabaseAdmin } from './admin';

/**
 * Image storage on SUPABASE STORAGE (not Vercel Blob). Server-only — uses
 * the service-role client, which must never reach the browser.
 *
 * Validates type + size, generates a safe random object path, uploads to a
 * public bucket, and returns the public URL plus the storage path (kept in
 * the DB so the object can be deleted on remove/replace).
 */

export const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'media';

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

export const IMAGE_TYPES = Object.keys(EXT_BY_MIME);
export type UploadFolder = 'events' | 'recaps' | 'hosted';

export class UploadError extends Error {}

/** Validate a File against the allowed types + size. Throws UploadError. */
export function assertValidImage(file: File): void {
  if (!file || typeof file === 'string') throw new UploadError('No image file provided.');
  if (!EXT_BY_MIME[file.type]) {
    throw new UploadError('Only JPG, PNG, WEBP, and GIF images are allowed.');
  }
  if (file.size > MAX_BYTES) {
    throw new UploadError('Image is too large. Maximum size is 5MB.');
  }
}

/** Upload an image to Supabase Storage; returns its public URL + object path. */
export async function uploadImage(
  file: File,
  folder: UploadFolder,
): Promise<{ url: string; path: string }> {
  assertValidImage(file);
  const ext = EXT_BY_MIME[file.type];
  const path = `${folder}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const supabase = requireSupabaseAdmin();
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, buffer, { contentType: file.type, upsert: false });
  if (error) throw new UploadError(error.message);

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, path };
}

/** Best-effort delete of a stored image by its object path (or public URL). Never throws. */
export async function deleteImage(pathOrUrl: string | null | undefined): Promise<void> {
  try {
    if (!pathOrUrl) return;
    let path = pathOrUrl;
    const marker = `/storage/v1/object/public/${STORAGE_BUCKET}/`;
    const idx = pathOrUrl.indexOf(marker);
    if (idx !== -1) path = decodeURIComponent(pathOrUrl.slice(idx + marker.length));
    await requireSupabaseAdmin().storage.from(STORAGE_BUCKET).remove([path]);
  } catch (err) {
    console.error('[storage] delete failed (continuing):', err instanceof Error ? err.message : err);
  }
}
