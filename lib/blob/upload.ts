import 'server-only';
import { put, del, type PutBlobResult } from '@vercel/blob';

/**
 * Vercel Blob upload helper. SERVER-ONLY — `put`/`del` use
 * BLOB_READ_WRITE_TOKEN, which must never reach the browser. Call this
 * from Route Handlers / Server Actions only, after auth checks.
 */

export type BlobFolder = 'events' | 'recaps' | 'applications' | 'articles';
export type BlobAccess = 'public' | 'private';

export interface BlobUploadOptions {
  folder: BlobFolder;
  filename: string;
  body: File | Blob | ArrayBuffer | Buffer | string;
  contentType?: string;
  access?: BlobAccess;
}

/** Validation limits shared by the upload routes. */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const DOC_TYPES = ['application/pdf'];

export class UploadValidationError extends Error {}

/**
 * Validate a browser File against a size limit and an allowed MIME list.
 * Throws UploadValidationError with a clean, user-facing message.
 */
export function assertValidUpload(
  file: File,
  allowedTypes: string[],
  maxBytes: number = MAX_UPLOAD_BYTES,
): void {
  if (file.size > maxBytes) {
    throw new UploadValidationError(
      `File is too large. Max size is ${Math.round(maxBytes / (1024 * 1024))}MB.`,
    );
  }
  if (!allowedTypes.includes(file.type)) {
    throw new UploadValidationError('Unsupported file type.');
  }
}

/** Sanitize a filename and upload to Vercel Blob under `folder/<ts>-<name>`. */
export async function uploadToBlob({
  folder,
  filename,
  body,
  contentType,
  access = 'public',
}: BlobUploadOptions): Promise<PutBlobResult> {
  // Never trust the original filename — strip everything unsafe.
  const safeFilename = filename
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '') || 'file';

  const pathname = `${folder}/${Date.now()}-${safeFilename}`;

  return put(pathname, body, { access, contentType, addRandomSuffix: false });
}

/** Best-effort delete of a blob by its URL or pathname. Never throws. */
export async function deleteFromBlob(urlOrPathname: string | null | undefined): Promise<void> {
  try {
    if (!urlOrPathname) return;
    await del(urlOrPathname);
  } catch (err) {
    console.error('[blob] delete failed (continuing):', err instanceof Error ? err.message : err);
  }
}
