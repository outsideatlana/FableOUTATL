/**
 * middleware/upload.js
 * ---------------------------------------------------------------
 * Image upload handling (multipart/form-data) via multer.
 *
 * Files are kept in memory (never written to a temp path) and then
 * handed to services/storageService.js, which decides where the bytes
 * actually live (local disk, Supabase Storage, etc.). This keeps the
 * "how do we receive the file" concern separate from the "where does
 * the file live" concern.
 *
 * SECURITY:
 *  - Only jpg / jpeg / png / webp are accepted. We check BOTH the MIME
 *    type the browser sent AND the file extension — never trust just one.
 *  - 5 MB hard size limit (enforced by multer; a malicious client can't
 *    stream an unbounded body into memory).
 *  - The original filename is NEVER used on disk. storageService
 *    generates a random, safe name. Original names can contain path
 *    traversal (../) or shell metacharacters.
 * ---------------------------------------------------------------
 */

const path = require('node:path');
const multer = require('multer');

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

// Allowed types: extension -> the MIME types a browser may legitimately send.
const ALLOWED = {
  '.jpg': ['image/jpeg'],
  '.jpeg': ['image/jpeg'],
  '.png': ['image/png'],
  '.webp': ['image/webp'],
};

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname || '').toLowerCase();
  const allowedMimes = ALLOWED[ext];
  if (allowedMimes && allowedMimes.includes(file.mimetype)) {
    return cb(null, true);
  }
  // Reject: surface a clean, user-facing reason (handled below).
  const err = new Error('Unsupported file type. Upload a .jpg, .jpeg, .png, or .webp image.');
  err.code = 'UNSUPPORTED_FILE_TYPE';
  return cb(err);
}

const multerUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
  fileFilter,
});

/**
 * Returns middleware that accepts ONE optional image under `fieldName`
 * and converts any multer error into a safe 400 JSON response so route
 * handlers never see raw multer exceptions.
 *
 * Requests that aren't multipart (e.g. a JSON body) pass straight
 * through — multer simply leaves req.file undefined.
 */
function uploadSingle(fieldName) {
  const handler = multerUpload.single(fieldName);
  return (req, res, next) => {
    handler(req, res, (err) => {
      if (!err) return next();
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'Image is too large. Maximum size is 5MB.' });
      }
      if (err.code === 'UNSUPPORTED_FILE_TYPE') {
        return res.status(400).json({ error: err.message });
      }
      if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({ error: 'Only a single image upload is allowed.' });
      }
      console.error('[upload] Unexpected multer error:', err);
      return res.status(400).json({ error: 'Could not process the uploaded file.' });
    });
  };
}

module.exports = { uploadSingle, MAX_FILE_SIZE, ALLOWED };
