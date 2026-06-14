# OutsideAtl

Live music & social events platform for Atlanta — parties, festivals, concerts, raves, pop-ups. A public landing page with RSVP/signup/application forms, plus a protected admin dashboard for managing events **and uploading event posters + past-recap photos**. Built with vanilla HTML/CSS/JS on the front and Node + Express + SQLite on the back, with a swappable storage layer (local disk / Supabase Storage) and optional Airtable mirroring.

---

## Folder structure

```
outsideatl/
├── server.js                 # Express entry point — sessions, routes, static files, /uploads
├── database.js               # SQLite setup, migrations, default event seeding
├── validators.js             # Shared backend validation helpers
├── middleware/
│   ├── requireAdmin.js       # Session check for admin-only routes
│   └── upload.js             # multer config: type/size validation, safe names
├── services/
│   ├── storageService.js     # Swappable image storage (local | supabase | …)
│   └── airtableService.js    # Optional Airtable mirror of submissions
├── routes/
│   ├── auth.js               # POST login/logout, GET me
│   ├── events.js             # Public GET + admin CRUD (with image upload)
│   ├── recaps.js             # Public GET + admin upload/delete recap photos
│   └── forms.js              # POST rsvps / signups / applications
├── public/
│   ├── index.html            # Landing page
│   ├── styles.css            # Design system + landing page styles
│   ├── script.js             # Events + recaps rendering + all public forms
│   ├── admin.html            # Login + dashboard (events + recap sections)
│   ├── admin.css             # Dashboard styles
│   └── admin.js              # Auth flow + event/recap CRUD UI
├── scripts/
│   └── hash-password.js      # Generates the bcrypt hash for .env
├── uploads/                  # Locally stored images (gitignored, auto-created)
├── netlify.toml              # Netlify static-frontend config + deploy notes
├── .env.example              # Environment variable template (committed)
├── package.json
└── outsideatl.db             # SQLite database (created on first run)
```

## Design

The frontend is a vanilla HTML/CSS/JS port of the original Lovable design (dark brutalist: Anton display type, JetBrains Mono labels, blue `--accent` / red `--accent-hot`, zero border-radius). All design tokens live in `:root` at the top of `public/styles.css` — change colors/fonts there and both the landing page and admin portal pick them up.

## Requirements

- **Node.js 22.5 or newer.** The database layer uses Node's built-in `node:sqlite` module, so there are **no native dependencies** — nothing to compile, installs cleanly on macOS/Windows/Linux. (Node 22 is the current LTS; check with `node -v`.)

## Installation & running

```bash
npm install
cp .env.example .env     # then edit .env (see below)
npm start                # → http://localhost:3000
```

`npm run dev` starts the server with auto-restart on file changes.

- Landing page: `http://localhost:3000`
- Admin: `http://localhost:3000/admin`

## Environment variables

Copy `.env.example` to `.env` and set:

| Variable | What it is |
|---|---|
| `PORT` | Server port (default 3000) |
| `SESSION_SECRET` | Long random string that signs session cookies |
| `ADMIN_USERNAME` | Admin login username (default `OutsideAdmin`) |
| `ADMIN_PASSWORD_HASH` | **bcrypt hash** of the admin password (never the password itself) |
| `DATABASE_PROVIDER` / `DATABASE_URL` | `sqlite` + path to the DB file (only sqlite is wired up today) |
| `STORAGE_PROVIDER` | `local` (default) · `supabase` · `airtable` · `netlify` — where uploaded images go |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_STORAGE_BUCKET` | Supabase Storage config (backend-only secrets) |
| `ENABLE_AIRTABLE_SYNC` | `true`/`false` — mirror submissions to Airtable |
| `AIRTABLE_API_KEY` / `AIRTABLE_BASE_ID` / `AIRTABLE_*_TABLE` | Airtable config (backend-only secrets) |

> ⚠️ **`SUPABASE_SERVICE_ROLE_KEY` and `AIRTABLE_API_KEY` are server-only secrets.** They are read by the backend, never sent to the browser, and must never be committed. `.env` is gitignored; `.env.example` (placeholders only) is committed.

Generate a session secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Admin login setup

1. Pick a strong password.
2. Generate its bcrypt hash:

   ```bash
   npm run hash-password -- "yourStrongPassword"
   # or, directly:
   node -e "const bcrypt=require('bcryptjs'); bcrypt.hash('OutsideAtl21@', 10).then(console.log)"
   ```

3. Paste the printed hash into `.env` as `ADMIN_PASSWORD_HASH=...`.
4. Set `ADMIN_USERNAME` in `.env`.
5. Restart the server and sign in at `/admin`.

The plaintext password is never stored anywhere. Login is verified server-side with `bcrypt.compare()`, and a successful login creates an `httpOnly` session cookie.

## Database setup

Nothing to do manually. On boot, `database.js`:

1. Opens (or creates) `outsideatl.db`
2. Creates the `events`, `recap_photos`, `rsvps`, `signups`, and `applications` tables if missing
3. Runs lightweight migrations — adds the `events.image_url` column to older databases, and widens the application-type check — without dropping data
4. Seeds three default events (**Silent Disco**, **Rooftop Game Night**, **Artist Pop-Up**) — only if the events table is empty, so your edits are never overwritten

The `events` table carries an `image_url TEXT` column; `recap_photos` has `id, image_url, title, caption, event_label, created_at`.

To reset everything, stop the server and delete `outsideatl.db*` (including the `-wal`/`-shm` files). Locally stored images live in `uploads/`.

## API routes

### Public

| Method | Route | Purpose |
|---|---|---|
| `GET`  | `/api/events` | List events (homepage reads this) |
| `GET`  | `/api/recaps` | List past recap photos (homepage gallery) |
| `POST` | `/api/rsvps` | `{ name, email, phone, event_name }` |
| `POST` | `/api/signups` | `{ email, phone }` — the 5%-off list |
| `POST` | `/api/applications` | `{ application_type: career\|internship\|vendor\|artist, name, email, role_interest, message }` |

### Auth

| Method | Route | Purpose |
|---|---|---|
| `POST` | `/api/auth/login` | `{ username, password }` → session cookie |
| `POST` | `/api/auth/logout` | Destroys the session |
| `GET`  | `/api/auth/me` | `{ authenticated, username }` |

### Admin-only (require a logged-in session)

| Method | Route | Purpose |
|---|---|---|
| `POST`   | `/api/events` | Create an event (`multipart/form-data`; optional `image`) |
| `PUT`    | `/api/events/:id` | Update an event (optional `image`; `remove_image=1` to clear) |
| `DELETE` | `/api/events/:id` | Delete an event (its image too) |
| `POST`   | `/api/recaps` | Upload a recap photo (`multipart/form-data`; **`image` required**, optional `title`/`caption`/`event_label`) |
| `DELETE` | `/api/recaps/:id` | Delete a recap photo (and its image) |

Image uploads accept `.jpg`, `.jpeg`, `.png`, `.webp` up to **5 MB**; anything else returns a `400`. Event/recap create & update accept either JSON or `multipart/form-data` (the latter is required to attach a file).

Validation errors return `400` with `{ error, fields: { fieldName: message } }`. Auth failures return `401`. Unknown IDs return `404`. Server faults return `500` with a generic message (details are logged server-side only).

## Frontend ↔ backend integration notes

- The landing page fetches events from `GET /api/events` at load — event cards are **not** hardcoded in HTML.
- All form submissions go to the API and persist in SQLite. `localStorage` is not used for any data that matters.
- All dynamic text is rendered with `textContent`/`createElement`, never `innerHTML`, so user- or admin-entered content can't inject markup.
- The dashboard checks `GET /api/auth/me` on load to decide whether to show login or the dashboard. If a session expires mid-use, a `401` from any write route bounces the admin back to login.
- Frontend validation is a UX nicety only; the backend re-validates every request.

## How image uploads work

Both event posters and recap photos use the same pipeline:

1. The admin form sends `multipart/form-data`. `middleware/upload.js` (multer, in-memory) validates the file: **only `.jpg/.jpeg/.png/.webp`, max 5 MB**, single file. The original filename is never trusted.
2. The route hands the file to `services/storageService.js`, which stores the bytes according to `STORAGE_PROVIDER` and returns a public URL/path.
3. Only that URL string is saved in SQLite (`events.image_url` / `recap_photos.image_url`).
4. The public site renders the image: event cards show the poster (falling back to the original gradient placeholder when there's no image), and the **Past Recaps** gallery shows uploaded photos.

Editing an event with a new image replaces the old one (the previous file is deleted). Sending `remove_image=1` clears it. Deleting an event or recap also deletes its image file.

## How recap photos work

The admin dashboard's **Past Recap Photos** section uploads photos with an optional title, caption, and event/date label. They're stored in the `recap_photos` table and shown in the public **Past Recaps** gallery. The gallery shows uploaded recap photos first, then automatically appends any past events as fallback tiles (the original Lovable look), so the section is never empty once you have history.

## Storage providers (`STORAGE_PROVIDER`)

The backend never hardcodes a storage vendor — `services/storageService.js` exposes `uploadImage(file, folder)` and `deleteImage(imageUrl)` and picks the backend from `.env`:

| Value | Behaviour |
|---|---|
| `local` (default) | Saves to `./uploads/<folder>/…`, served at `/uploads`. Great for development. |
| `netlify` | Same on-disk behaviour. ⚠️ A pure Netlify Functions deploy has an ephemeral filesystem — use `supabase` there instead. |
| `supabase` | Uploads to a Supabase Storage bucket and stores the public URL. Recommended for hosted/production. |
| `airtable` | Airtable is **not** a blob store — this falls back to local disk. Use Airtable for metadata sync, not image bytes. |

`folder` is `events` or `recaps`. To add a new provider, implement those two functions for it — no route changes needed.

## Supabase setup

Used for image storage when `STORAGE_PROVIDER=supabase` (a future Postgres swap can reuse the same project).

1. Create a project at [supabase.com](https://supabase.com); copy the **Project URL**.
2. **Project Settings → API →** copy the **`service_role`** key. This is a powerful secret — backend only.
3. **Storage → Create bucket** named `outsideatl-uploads` (match `SUPABASE_STORAGE_BUCKET`). Make it **public** so image URLs load on the site (or add a read policy).
4. In `.env`: set `STORAGE_PROVIDER=supabase`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET`.
5. Restart. New uploads now land in Supabase and the DB stores their public URLs.

> 🔒 The service role key bypasses Row Level Security. It is used **only** in `storageService.js` on the server. Never expose it to frontend JavaScript, and never commit it.

## Airtable sync (optional)

Mirror public submissions into Airtable so non-technical teammates can browse them in a spreadsheet UI. SQLite stays the source of truth.

1. Create an Airtable base with tables matching `AIRTABLE_*_TABLE` (default `RSVPs`, `Signups`, `Applications`, `Events`, `Recaps`).
2. Create a personal access token (API key) with write scope to that base; copy the **Base ID** (from the API docs URL).
3. In `.env`: set `ENABLE_AIRTABLE_SYNC=true`, `AIRTABLE_API_KEY`, `AIRTABLE_BASE_ID`, and any table-name overrides.
4. Restart. Submissions are saved to SQLite **first**, then mirrored to Airtable. A failed sync is logged and ignored — it never breaks a visitor's submission.

> 🔒 `AIRTABLE_API_KEY` is backend-only (used in `services/airtableService.js`). Never expose it to the browser. Image binaries are never pushed to Airtable — only URLs.

## Deploying on Netlify

This is an Express + SQLite app with server-side sessions, so it does **not** run as-is on Netlify Functions (ephemeral filesystem + per-request cold starts break SQLite and the session store). Two supported options:

- **Recommended — hybrid:** Host the Express backend on a persistent host (**Railway / Render / Fly.io / a VPS**) with `STORAGE_PROVIDER=supabase`. Optionally serve the static `public/` frontend on Netlify (set the repo **Base directory** to `outsideatl/outsideatl`) and point its API calls at the backend URL. `netlify.toml` is included for this.
- **Simplest:** Skip Netlify and serve the whole app (frontend + API) from the backend host — the server already serves `public/`.

Set all secrets in **Netlify → Site settings → Environment variables** (and/or your backend host's env): `SESSION_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, `STORAGE_PROVIDER`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET`, `ENABLE_AIRTABLE_SYNC`, `AIRTABLE_API_KEY`, `AIRTABLE_BASE_ID`. Never commit `.env`.

## Deployment notes

- Run behind HTTPS (a reverse proxy like Caddy/Nginx, or a host like Render/Railway/Fly).
- Once on HTTPS, set `cookie.secure: true` in `server.js` and add `app.set('trust proxy', 1)` if behind a proxy.
- Replace the default in-memory session store with a persistent one (e.g. `better-sqlite3-session-store` or `connect-redis`) — MemoryStore forgets sessions on restart and leaks memory under load.
- The SQLite file must live on a **persistent disk**. On ephemeral hosts, set `DB_PATH` to a mounted volume.
- Set real values for `SESSION_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH` in the host's environment settings — never commit `.env`.

## Security warnings for production

This is a solid prototype, but before real money/data flows through it:

- **Client-side authentication is not authentication.** Anything in browser JS (hardcoded passwords, `isAdmin` flags in localStorage) can be flipped in DevTools. This project keeps all verification server-side — keep it that way.
- **Never expose API keys or secrets in frontend code.** Everything served from `public/` is readable by every visitor.
- **Add rate limiting** (e.g. `express-rate-limit`) on `/api/auth/login` and the public form routes to blunt brute force and spam.
- **Add CSRF protection** if you ever move beyond same-site JSON requests; `sameSite: 'lax'` cookies cover the common cases but aren't a complete defense.
- **Consider CAPTCHA/honeypots** on public forms once the site gets traffic — bots will find the RSVP form.
- Form data (names, emails, phones) is personal data — handle exports carefully and delete what you don't need.
