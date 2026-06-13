/**
 * scripts/hash-password.js
 * ---------------------------------------------------------------
 * Generate a bcrypt hash for the admin password.
 *
 * Usage:
 *   npm run hash-password -- "yourStrongPassword"
 *
 * Copy the printed hash into .env as ADMIN_PASSWORD_HASH.
 * The plaintext password is never stored anywhere.
 * ---------------------------------------------------------------
 */

const bcrypt = require('bcryptjs');

const password = process.argv[2];

if (!password) {
  console.error('Usage: npm run hash-password -- "yourStrongPassword"');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 12);
console.log('\nAdd this line to your .env file:\n');
console.log(`ADMIN_PASSWORD_HASH=${hash}\n`);
