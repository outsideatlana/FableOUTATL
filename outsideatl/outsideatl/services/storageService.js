/**
 * services/storageService.js
 * ---------------------------------------------------------------
 * Swappable image storage. The rest of the app calls two functions
 * and never cares WHERE the bytes actually go:
 *
 *     uploadImage(file, folder)  ->  returns a public URL/path string
 *     deleteImage(imageUrl)      ->  best-effort removal
 *
 * The active backend is chosen by STORAGE_PROVIDER in .env:
 *
 *     local     local ./uploads folder, served at /uploads (default)
 *     netlify   same on-disk behaviour as local (the Express server
 *               writes wherever it is hosted). NOTE: a pure Netlify
 *               Functions deploy has an EPHEMERAL filesystem — use
 *               'supabase' there so images actually persist.
 *     supabase  Supabase Storage bucket; stores the public URL in DB
 *     airtable  Airtable is NOT a blob store. Falls back to local disk
 *               and stores the URL. (Use airtable for metadata SYNC,
 *               not for image bytes — see services/airtableService.js.)
 *
 * `file` is a multer in-memory file: { buffer, originalname, mimetype }.
 * `folder` is a logical sub-folder, e.g. 'events' or 'recaps'.
 *
 * SECURITY: the original filename is never used. We always generate a
 * random, extension-checked name to avoid path traversal and clobbering.
 * ---------------------------------------------------------------
 */

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const PROVIDER = (process.env.STORAGE_PROVIDER || 'local').toLowerCase();
const ALLOWED_FOLDERS = new Set(['events', 'recaps']);

// Map MIME type -> file extension (fallback when the original name lacks one).
const MIME_EXT = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const UPLOADS_ROOT = path.join(__dirname, '..', 'uploads');

/** Pick a safe folder name; reject anything unexpected. */
function safeFolder(folder) {
  const f = String(folder || '').toLowerCase();
  return ALLOWED_FOLDERS.has(f) ? f : 'misc';
}

/** Derive a safe extension from the original name, falling back to MIME. */
function safeExt(file) {
  const ext = path.extname(file.originalname || '').toLowerCase();
  if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) return ext === '.jpeg' ? '.jpg' : ext;
  return MIME_EXT[file.mimetype] || '.bin';
}

/** Random, collision-resistant, traversal-proof file name. */
function randomName(file) {
  return `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${safeExt(file)}`;
}

/* ============================================================
 * Local / Netlify (on-disk) backend
 * ============================================================ */
function localUpload(file, folder) {
  const dir = path.join(UPLOADS_ROOT, folder);
  fs.mkdirSync(dir, { recursive: true });
  const name = randomName(file);
  fs.writeFileSync(path.join(dir, name), file.buffer);
  // Served by express.static at /uploads (see server.js).
  return `/uploads/${folder}/${name}`;
}

function localDelete(imageUrl) {
  if (typeof imageUrl !== 'string' || !imageUrl.startsWith('/uploads/')) return;
  const rel = imageUrl.replace(/^\/uploads\//, '');
  const target = path.normalize(path.join(UPLOADS_ROOT, rel));
  // Defence in depth: never delete outside the uploads root.
  if (!target.startsWith(UPLOADS_ROOT)) return;
  fs.promises.unlink(target).catch(() => { /* already gone — fine */ });
}

/* ============================================================
 * Supabase Storage backend
 * ============================================================ */
let _supabase = null;
function getSupabase() {
  if (_supabase) return _supabase;
  // SECURITY: the SERVICE ROLE key bypasses Row Level Security and must
  // live ONLY on the server. Never ship it to frontend JavaScript.
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Supabase storage selected but SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set.');
  }
  const { createClient } = require('@supabase/supabase-js'); // lazy: only loaded when used
  _supabase = createClient(url, key, { auth: { persistSession: false } });
  return _supabase;
}

async function supabaseUpload(file, folder) {
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'outsideatl-uploads';
  const objectPath = `${folder}/${randomName(file)}`;
  const supabase = getSupabase();
  const { error } = await supabase.storage
    .from(bucket)
    .upload(objectPath, file.buffer, { contentType: file.mimetype, upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(objectPath);
  return data.publicUrl;
}

async function supabaseDelete(imageUrl) {
  if (typeof imageUrl !== 'string' || !imageUrl.includes('/storage/v1/object/public/')) return;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'outsideatl-uploads';
  // Public URL looks like: <url>/storage/v1/object/public/<bucket>/<objectPath>
  const marker = `/storage/v1/object/public/${bucket}/`;
  const idx = imageUrl.indexOf(marker);
  if (idx === -1) return;
  const objectPath = decodeURIComponent(imageUrl.slice(idx + marker.length));
  try {
    await getSupabase().storage.from(bucket).remove([objectPath]);
  } catch (err) {
    console.error('[storage] Supabase delete failed (continuing):', err.message);
  }
}

/* ============================================================
 * Public API
 * ============================================================ */
let warnedAirtable = false;

/** Store an uploaded image; resolves to the public URL/path string. */
async function uploadImage(file, folder) {
  if (!file || !file.buffer) throw new Error('No image file provided.');
  const f = safeFolder(folder);

  if (PROVIDER === 'supabase') return supabaseUpload(file, f);

  if (PROVIDER === 'airtable' && !warnedAirtable) {
    warnedAirtable = true;
    console.warn('[storage] STORAGE_PROVIDER=airtable: Airtable is not a blob store; ' +
      'saving images to local disk instead. Use supabase for hosted persistence.');
  }
  // local, netlify, airtable-fallback all use on-disk storage.
  return localUpload(file, f);
}

/** Best-effort delete of a previously stored image. Never throws. */
async function deleteImage(imageUrl) {
  try {
    if (!imageUrl) return;
    if (PROVIDER === 'supabase') return await supabaseDelete(imageUrl);
    return localDelete(imageUrl);
  } catch (err) {
    console.error('[storage] deleteImage failed (continuing):', err.message);
  }
}

module.exports = { uploadImage, deleteImage, PROVIDER, UPLOADS_ROOT };
