# OutsideAtl

Live music & social events platform for Atlanta — parties, festivals, concerts, raves, pop-ups. A public landing page with RSVP/signup/application forms, plus a protected admin dashboard for managing events. Built with vanilla HTML/CSS/JS on the front and Node + Express + SQLite on the back.

---

## Folder structure

```
outsideatl/
├── server.js                 # Express entry point — sessions, routes, static files
├── database.js               # SQLite setup, table creation, default event seeding
├── validators.js             # Shared backend validation helpers
├── middleware/
│   └── requireAdmin.js       # Session check for admin-only routes
├── routes/
│   ├── auth.js               # POST login/logout, GET me
│   ├── events.js             # Public GET + admin CRUD for events
│   └── forms.js              # POST rsvps / signups / applications
├── public/
│   ├── index.html            # Landing page
│   ├── styles.css            # Design system + landing page styles
│   ├── script.js             # Events rendering + all public forms
│   ├── admin.html            # Login + dashboard (one page, two views)
│   ├── admin.css             # Dashboard styles
│   └── admin.js              # Auth flow + event CRUD UI
├── scripts/
│   └── hash-password.js      # Generates the bcrypt hash for .env
├── .env.example              # Environment variable template
├── package.json
└── outsideatl.db             # SQLite database (created on first run)
```

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
| `ADMIN_USERNAME` | Admin login username |
| `ADMIN_PASSWORD_HASH` | **bcrypt hash** of the admin password (never the password itself) |
| `DB_PATH` | Optional custom path for the SQLite file |

Generate a session secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Admin login setup

1. Pick a strong password.
2. Generate its bcrypt hash:

   ```bash
   npm run hash-password -- "yourStrongPassword"
   ```

3. Paste the printed `ADMIN_PASSWORD_HASH=...` line into `.env`.
4. Set `ADMIN_USERNAME` in `.env`.
5. Restart the server and sign in at `/admin`.

The plaintext password is never stored anywhere. Login is verified server-side with `bcrypt.compare()`, and a successful login creates an `httpOnly` session cookie.

## Database setup

Nothing to do manually. On boot, `database.js`:

1. Opens (or creates) `outsideatl.db`
2. Creates the `events`, `rsvps`, `signups`, and `applications` tables if missing
3. Seeds three default events (**Silent Disco**, **Rooftop Game Night**, **Artist Pop-Up**) — only if the events table is empty, so your edits are never overwritten

To reset everything, stop the server and delete `outsideatl.db*` (including the `-wal`/`-shm` files).

## API routes

### Public

| Method | Route | Purpose |
|---|---|---|
| `GET`  | `/api/events` | List events (homepage reads this) |
| `POST` | `/api/rsvps` | `{ name, email, phone, event_name }` |
| `POST` | `/api/signups` | `{ email, phone }` — the 5%-off list |
| `POST` | `/api/applications` | `{ application_type: career\|internship\|vendor, name, email, role_interest, message }` |

### Auth

| Method | Route | Purpose |
|---|---|---|
| `POST` | `/api/auth/login` | `{ username, password }` → session cookie |
| `POST` | `/api/auth/logout` | Destroys the session |
| `GET`  | `/api/auth/me` | `{ authenticated, username }` |

### Admin-only (require a logged-in session)

| Method | Route | Purpose |
|---|---|---|
| `POST`   | `/api/events` | Create an event |
| `PUT`    | `/api/events/:id` | Update an event |
| `DELETE` | `/api/events/:id` | Delete an event |

Validation errors return `400` with `{ error, fields: { fieldName: message } }`. Auth failures return `401`. Unknown IDs return `404`. Server faults return `500` with a generic message (details are logged server-side only).

## Frontend ↔ backend integration notes

- The landing page fetches events from `GET /api/events` at load — event cards are **not** hardcoded in HTML.
- All form submissions go to the API and persist in SQLite. `localStorage` is not used for any data that matters.
- All dynamic text is rendered with `textContent`/`createElement`, never `innerHTML`, so user- or admin-entered content can't inject markup.
- The dashboard checks `GET /api/auth/me` on load to decide whether to show login or the dashboard. If a session expires mid-use, a `401` from any write route bounces the admin back to login.
- Frontend validation is a UX nicety only; the backend re-validates every request.

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
