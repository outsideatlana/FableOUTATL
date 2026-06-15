'use client';

/**
 * Client helper for the server-upload route. Validates the file, then
 * streams its raw body to /api/upload (which calls Vercel Blob `put()`
 * server-side). Never touches BLOB_READ_WRITE_TOKEN.
 *
 * Server uploads are capped at 4.5 MB; for larger files switch to Vercel
 * Blob client uploads.
 */

export interface BlobUploadResult {
  success: true;
  url: string;
  pathname: string;
  contentType: string;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 4.5 * 1024 * 1024;

export async function uploadImageToBlob({
  file,
  folder,
}: {
  file: File;
  folder: 'events' | 'recaps' | 'applications' | 'interest';
}): Promise<BlobUploadResult> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Only JPG, PNG, WEBP, and GIF files are allowed.');
  }
  if (file.size > MAX_SIZE) {
    throw new Error('File is too large. Max upload size is 4.5 MB.');
  }

  const response = await fetch(
    `/api/upload?filename=${encodeURIComponent(file.name)}&folder=${folder}`,
    {
      method: 'POST',
      body: file,
      headers: { 'content-type': file.type },
    },
  );

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.error || 'Upload failed.');
  }
  return result as BlobUploadResult;
}
