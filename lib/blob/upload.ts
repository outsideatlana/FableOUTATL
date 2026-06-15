import 'server-only';
import { del } from '@vercel/blob';

/**
 * Vercel Blob server-side helpers. SERVER-ONLY — `put`/`del` use
 * BLOB_READ_WRITE_TOKEN, which must never reach the browser.
 *
 * Uploads use the official Next.js App Router *server upload* pattern:
 * the client streams the raw file body to /api/upload, which calls
 * `put(pathname, request.body)`. Server uploads are capped at 4.5 MB
 * (the Vercel serverless request-body limit) — for larger files, switch
 * to Vercel Blob *client uploads*.
 */

export const MAX_SERVER_UPLOAD_BYTES = 4.5 * 1024 * 1024; // 4.5 MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export const UPLOAD_FOLDERS = ['events', 'recaps', 'applications', 'interest', 'hosted'] as const;
export type UploadFolder = (typeof UPLOAD_FOLDERS)[number];

/** Sanitize a filename into a safe `folder/<ts>-<name>` pathname. */
export function buildPathname(folder: UploadFolder, filename: string): string {
  const safe =
    filename
      .toLowerCase()
      .replace(/[^a-z0-9.-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '') || 'file';
  return `${folder}/${Date.now()}-${safe}`;
}

/** Best-effort delete of a blob by URL or pathname. Never throws. */
export async function deleteFromBlob(urlOrPathname: string | null | undefined): Promise<void> {
  try {
    if (!urlOrPathname) return;
    await del(urlOrPathname);
  } catch (err) {
    console.error('[blob] delete failed (continuing):', err instanceof Error ? err.message : err);
  }
}
