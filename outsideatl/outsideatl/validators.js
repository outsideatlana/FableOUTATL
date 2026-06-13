/**
 * validators.js
 * ---------------------------------------------------------------
 * Tiny shared validation helpers used by every backend route.
 * Backend validation is the source of truth — frontend validation
 * is only a UX nicety and can always be bypassed.
 * ---------------------------------------------------------------
 */

/** Trim a value and guarantee a string back. */
function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

/** Required non-empty string within a sane length. */
function isPresent(value, max = 200) {
  const v = clean(value);
  return v.length > 0 && v.length <= max;
}

/** Pragmatic email check (full RFC 5322 is overkill here). */
function isEmail(value) {
  const v = clean(value);
  return v.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
}

/** Reasonable phone: 7–15 digits, allowing spaces, dashes, dots, parens, leading +. */
function isPhone(value) {
  const v = clean(value);
  if (!/^[+]?[\d\s().-]+$/.test(v)) return false;
  const digits = v.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
}

/** http(s) URL check for ticket links. Empty is allowed (optional field). */
function isOptionalUrl(value) {
  const v = clean(value);
  if (v === '') return true;
  try {
    const url = new URL(v);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/** YYYY-MM-DD */
function isDate(value) {
  const v = clean(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  return !Number.isNaN(new Date(`${v}T00:00:00`).getTime());
}

/** HH:MM (24h) */
function isTime(value) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(clean(value));
}

const APPLICATION_TYPES = ['career', 'internship', 'vendor', 'artist'];

module.exports = {
  clean,
  isPresent,
  isEmail,
  isPhone,
  isOptionalUrl,
  isDate,
  isTime,
  APPLICATION_TYPES,
};
