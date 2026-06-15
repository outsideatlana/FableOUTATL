# OutsideAtl

Live music & events platform for Atlanta — parties, festivals, concerts, raves, and campus
nightlife. Public site for advertising events, collecting pre-RSVPs, gauging interest in
concepts, and taking applications (interns / freelancers / vendors / DJs), plus a secure admin
dashboard for managing events, RSVPs, applications, and recap photos.

**Vercel-first · Supabase-first · Airtable-compatible.**

- **Framework:** Next.js 15 (App Router) + React 19 + TypeScript
- **Styling:** Tailwind CSS (dark nightlife brand system)
- **Database:** Supabase Postgres with Row Level Security
- **File storage:** Vercel Blob (event hero images, recap photos, files)
- **Admin auth:** env credentials verified with bcrypt → signed `httpOnly` JWT session cookie
- **CRM mirror (optional):** Airtable, server-side only, toggled by env

---

## Quick start (local)

```bash
npm install
cp .env.example .env.local      # then edit .env.local (see below)
npm run dev                     # http://localhost:3000
```

The app **builds and runs without any secrets** — pages render with empty data and submissions
return a friendly "temporarily unavailable" until Supabase is configured. To exercise the full
app locally you need a Supabase project (below).

Verify a production build at any time:

```bash
npm install
npm run lint
npm run build
```

---

## Environment variables

Copy `.env.example` → `.env.local`. Only `NEXT_PUBLIC_*` values are exposed to the browser;
everything else is server-only. **Never commit `.env.local`.**

| Variable | Scope | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | public | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public | Supabase anon key (RLS-guarded) |
| `SUPABASE_SERVICE_ROLE_KEY` | **server** | Privileged key — bypasses RLS. Server only. |
| `BLOB_READ_WRITE_TOKEN` | **server** | Vercel Blob token (auto-added when you create a Blob store). Server only. |
| `ADMIN_USERNAME` | server | Admin login username |
| `ADMIN_PASSWORD_HASH` | server | **bcrypt hash** of the admin password |
| `SESSION_SECRET` | server | Long random string signing the session JWT |
| `ENABLE_AIRTABLE_SYNC` | server | `true`/`false` — mirror submissions to Airtable |
| `AIRTABLE_API_KEY` | **server** | Airtable personal access token |
| `AIRTABLE_BASE_ID` | server | Airtable base id |
| `AIRTABLE_*_TABLE` | server | Table names (Events/RSVPs/Applications/Recaps/Signups) |

### Generate the admin password hash

```bash
npm run hash-password -- "yourStrongPassword"
```

> ⚠️ **bcrypt hashes contain `$`.** In `.env.local`, Next.js (`@next/env`) expands `$VAR`, which
> corrupts the hash. **Escape each `$` as `\$`** in `.env.local`:
> `ADMIN_PASSWORD_HASH=\$2a\$10\$....` (single quotes are **not** reliable). The
> `hash-password` script prints a ready-to-paste line. In the **Vercel dashboard**, paste the
> **raw** hash (no escaping) — it isn't parsed that way.

Generate a session secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Supabase setup (manual steps)

1. Create a project at [supabase.com](https://supabase.com). Copy the **Project URL** and the
   **anon** and **service_role** keys (Project Settings → API).
2. **Run the schema:** open the SQL editor and run `supabase/migrations/0001_init.sql`, then
   `supabase/migrations/0002_blob_pathnames.sql`. These create all tables, enable Row Level
   Security with the right policies, and add the Blob pathname columns.
3. *(Optional)* run `supabase/seed.sql` for a few sample events.
4. Put the URL + keys into `.env.local` (and later into Vercel).

That's it — no manual table or policy clicking required; it's all in the migrations.

> File storage is **Vercel Blob**, not Supabase Storage (see next section). The bucket created by
> `0001_init.sql` is harmless and unused; you can ignore or drop it.

**Security model:** the browser only ever uses the anon key (RLS lets the public read published
events + recaps and insert RSVPs/applications/signups — nothing else). All admin reads/writes go
through server routes using the service-role key, which is never sent to the client.

---

## Vercel Blob setup (file storage)

Uploaded files (event hero images, recap photos, future application attachments) live in
**Vercel Blob**. Public images are served straight from their blob URL; sensitive files can be
stored privately and streamed through an admin-only route.

1. In the Vercel dashboard: **Storage → Create → Blob**, name it (e.g. `outsideatl-media`), and
   connect it to the project.
2. Vercel adds **`BLOB_READ_WRITE_TOKEN`** to the project's env automatically. For local dev,
   copy it from the store's **`.env.local`** tab into your `.env.local`.
3. Uploads are admin-only (`/api/upload`, `/api/recaps`) and validated (type + 10MB limit);
   the returned `url`/`pathname` are saved in Supabase. No other setup needed.

**Public vs private:** event/recap images use `access: 'public'`. Use `access: 'private'` for
sensitive files (e.g. application documents) — those are not reachable by URL and must be fetched
through the admin-only `/api/blob/<pathname>` streaming route.

---

## Airtable setup (optional)

Airtable mirrors public submissions into a spreadsheet UI. It's entirely optional and off by
default. Supabase is always the source of truth; a failed Airtable sync never breaks a submission.

1. Create a base with tables matching `AIRTABLE_*_TABLE` (defaults: `Events`, `RSVPs`,
   `Applications`, `Recaps`, `Signups`).
2. Create a personal access token with write access; copy the **Base ID**.
3. Set `ENABLE_AIRTABLE_SYNC=true` plus `AIRTABLE_API_KEY` / `AIRTABLE_BASE_ID` in env.

When `ENABLE_AIRTABLE_SYNC=false`, no Airtable code runs and the keys may be left blank.

---

## Deploy to Vercel

1. Push this repo to GitHub and **Import** it in Vercel (framework auto-detected as Next.js).
   - Build command: `npm run build` · Install: `npm install` · Output: default. No `vercel.json` needed.
2. **Add environment variables** (Project → Settings → Environment Variables) — all of the
   server-side vars above. Paste the bcrypt hash **raw** (no escaping) here.
3. Connect Supabase: add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and
   `SUPABASE_SERVICE_ROLE_KEY`. Run `0001_init.sql` + `0002_blob_pathnames.sql` in your Supabase
   project if you haven't.
4. **Create a Blob store** (Storage → Create → Blob) and connect it — Vercel adds
   `BLOB_READ_WRITE_TOKEN` automatically.
5. Add Airtable vars **only if** `ENABLE_AIRTABLE_SYNC=true`.
6. **Deploy.** Visit `/admin` and sign in with your `ADMIN_USERNAME` + password.

> The legacy code in `/_archive` and `/outsideatl` is excluded from the build via `.vercelignore`.

---

## API routes

| Method | Route | Access | Purpose |
|---|---|---|---|
| `GET` | `/api/events` | public | Published events |
| `POST` | `/api/events` | admin | Create event |
| `PATCH`/`DELETE` | `/api/events/:id` | admin | Update / delete event |
| `GET` | `/api/recaps` | public | Recap gallery |
| `POST` | `/api/recaps` | admin | Upload recap (multipart) |
| `PATCH`/`DELETE` | `/api/recaps/:id` | admin | Edit / delete recap |
| `POST` | `/api/recaps/reorder` | admin | Persist gallery order |
| `POST` | `/api/rsvp` | public | Submit RSVP |
| `POST` | `/api/applications` | public | Submit application |
| `PATCH` | `/api/applications/:id` | admin | Update application status |
| `POST` | `/api/interest` | public | Concept interest signup |
| `POST` | `/api/upload` | admin | Upload a file to Vercel Blob → `{ url, pathname }` |
| `GET` | `/api/blob/<pathname>` | admin | Stream a **private** blob (e.g. sensitive files) |
| `GET` | `/api/admin/rsvps/export` | admin | Download RSVPs as CSV |
| `POST` | `/api/auth/login` / `logout` | — | Admin session |
| `GET` | `/api/airtable/sync` | admin | Report sync status |

Validation errors return `400` with `{ error, fields }`; auth failures `401`; missing config `503`.

---

## Project structure

```
app/
  (site)/            public site (nav + footer layout)
    page.tsx         homepage: hero, events, concepts, recaps, proof, RSVP
    events/          list + [slug] detail
    apply/[type]/    intern | freelancer | vendor
    dj/              DJ & artist submission
  admin/             secure dashboard (login, events, rsvps, applications, recaps)
  api/               route handlers (see table above)
components/          layout / public / admin / forms / ui
lib/
  supabase/          client (browser) · server (anon) · admin (service role)
  blob/              Vercel Blob upload/delete + validation (server-only)
  airtable/          client + sync (optional, server-only)
  auth/              session (edge-safe JWT) + admin (bcrypt, cookies)
  data/              public + admin read helpers
  validation/        zod schemas
types/               database + domain types
supabase/            migrations + seed
middleware.ts        protects /admin/*
```

---

## Security notes

- **No secrets in client code.** Only `NEXT_PUBLIC_*` reaches the browser. The service-role key,
  `BLOB_READ_WRITE_TOKEN`, and Airtable key are imported through `server-only` modules — an
  accidental client import fails the build. `put()`/`del()`/`get()` run only in route handlers.
- **Admin auth** is verified server-side with bcrypt; the session is a signed `httpOnly` cookie.
  Credentials never leave the server.
- **Row Level Security** is enabled on every table; the anon key can only do what the public needs.
- `.env.local` is gitignored; `.env.example` holds placeholders only.
- For production, consider adding rate limiting to `/api/auth/login` and the public form routes.

---

## Legacy code

The previous Express/SQLite app and the Lovable export are preserved under `/_archive` for design
and copy reference. They are not part of the build (`.vercelignore`, `.gitignore`). `/outsideatl`
is an empty leftover directory locked by a running preview process — delete it once that process
is closed.
