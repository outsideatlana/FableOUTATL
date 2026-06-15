#!/usr/bin/env node
/**
 * Generate a bcrypt hash for the admin password.
 * Usage:  npm run hash-password -- "yourStrongPassword"
 * Paste the output into .env.local as ADMIN_PASSWORD_HASH.
 */
import bcrypt from 'bcryptjs';

const password = process.argv[2];
if (!password) {
  console.error('Usage: npm run hash-password -- "yourStrongPassword"');
  process.exit(1);
}

const hash = await bcrypt.hash(password, 10);

// bcrypt hashes contain "$", which Next.js (@next/env) expands as $VAR in
// .env files — corrupting the hash. Escaping each "$" as "\$" is the only
// reliable fix (single quotes are NOT). Print a paste-ready line for
// .env.local plus the raw hash for the Vercel dashboard.
const escaped = hash.replace(/\$/g, '\\$');

console.log('\nRaw hash (paste into the Vercel dashboard env var):');
console.log(hash);
console.log('\nFor .env.local (note the escaped $ — paste this whole line):');
console.log(`ADMIN_PASSWORD_HASH=${escaped}`);
