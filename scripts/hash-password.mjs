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
console.log(hash);
