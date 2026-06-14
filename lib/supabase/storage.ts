import 'server-only';
import { requireSupabaseAdmin, STORAGE_BUCKET } from './admin';

/**
 * Image upload helpers for Supabase Storage (admin-only paths).
 * Validates type + size, generates a safe random name (never trusts the
 * original filename), and returns the public URL.
 */

const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export type UploadFolder = 'events' | 'recaps';

export class UploadError extends Error {}

export async function uploadImage(file: File, folder: UploadFolder): Promise<string> {
  if (!file || typeof file === 'string') throw new UploadError('No image file provided.');
  const ext = EXT_BY_MIME[file.type];
  if (!ext) throw new UploadError('Unsupported file type. Upload a JPG, PNG, or WEBP image.');
  if (file.size > MAX_BYTES) throw new UploadError('Image is too large. Maximum size is 5MB.');

  const supabase = requireSupabaseAdmin();
  const name = `${folder}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(name, buffer, { contentType: file.type, upsert: false });
  if (error) throw new UploadError(error.message);

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(name);
  return data.publicUrl;
}

/** Best-effort delete of a previously uploaded public image. Never throws. */
export async function deleteImageByUrl(url: string | null): Promise<void> {
  try {
    if (!url) return;
    const marker = `/storage/v1/object/public/${STORAGE_BUCKET}/`;
    const idx = url.indexOf(marker);
    if (idx === -1) return;
    const path = decodeURIComponent(url.slice(idx + marker.length));
    const supabase = requireSupabaseAdmin();
    await supabase.storage.from(STORAGE_BUCKET).remove([path]);
  } catch (err) {
    console.error('[storage] delete failed (continuing):', err);
  }
}
