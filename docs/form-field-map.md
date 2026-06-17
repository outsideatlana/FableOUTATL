# OutsideAtl — Form → Airtable Field Map

Complete, verified field-level mapping of every site form to its Airtable
table and **exact** column in base `appfq5XK6vJpwDCyg`.

- **Single source of truth (code):** [`lib/airtable/form-field-maps.ts`](../lib/airtable/form-field-maps.ts)
- **Submission logic (server-only):** [`lib/airtable/client.ts`](../lib/airtable/client.ts)
- **Architecture:** Airtable stores **all form submissions**. Supabase stores
  **only** photos, event records, recaps/recap photos, and "Who We've Hosted".
  No Vercel Blob. `AIRTABLE_API_KEY` is server-only and never reaches the browser.
- **Tested:** Each table received a live test record using these exact columns
  (via the Airtable API, `typecast: true`); every field landed in its column,
  then the test records were deleted (no fake data left behind).

> Field names are **case-sensitive** and intentionally inconsistent across
> tables (e.g. `Social Media` vs `Social Media Handle`, and Interns' `Phone `
> has a trailing space). The mappings below match the real columns exactly —
> do not "tidy" them.

Columns created during this audit are marked **(created)**.

---

## RSVP

Frontend component: `components/forms/rsvp-form.tsx`
API route: `app/api/rsvp/route.ts`
Airtable table: `RSVPs` (`tblMsYOvmcZ3GkxAU`)
Also persisted to Supabase `rsvps` (admin dashboard source of truth).

| User-facing Label | Input Name | State Key | API Payload Key | Airtable Field | Airtable Type | Required | Transform | Tested |
|---|---|---|---|---|---|---|---|---|
| Full name | name | name | name | Attendee Name (+ Name) | Single line text | Yes | Trim | Yes |
| Email | email | email | email | Attendee Email | Email | Yes | Trim | Yes |
| Phone | phone | phone | phone | Phone | Phone | No | Trim | Yes |
| @instagram | instagram | instagram | instagram | Social Media | Single line text | No | Trim | Yes |
| Interested in: (event) | event_id | event_id | event_id | Event Name **(created)** | Single line text | No | event_id → event title (server lookup) | Yes |
| Anything else? | notes | notes | notes | Notes | Long text | No | Trim | Yes |

---

## Newsletter / Join the List

Frontend component: `components/forms/newsletter-form.tsx`
API route: `app/api/signups/route.ts`
Airtable table: `Signups` (`tblHVZAqfwVeiI9NE`)
Also persisted to Supabase `signups`.

| User-facing Label | Input Name | State Key | API Payload Key | Airtable Field | Airtable Type | Required | Transform | Tested |
|---|---|---|---|---|---|---|---|---|
| Email address | email | email | email | Attendee Email (+ Name) | Email | Yes | Trim | Yes |
| — (system) | — | — | — | Source = "Website" | Single select | n/a | Constant | Yes |

---

## Gauge My Interest / What Should We Throw Next

Frontend component: `components/home/gauge-interest-form.tsx`
API route: `app/api/interest/route.ts`
Airtable table: `INTEREST FORMS` → real name `Interest Forms` (`tblxF8FH9U0tANlUu`)
Airtable-only (never written to Supabase).

| User-facing Label | Input Name | State Key | API Payload Key | Airtable Field | Airtable Type | Required | Transform | Tested |
|---|---|---|---|---|---|---|---|---|
| Name | name | name | name | Attendee Name (+ Name) | Single line text | Yes | Trim | Yes |
| Email | email | email | email | Attendee Email | Email* | Yes | Trim | Yes |
| Phone | phone | phone | phone | Phone | Phone | No | Trim | Yes |
| @instagram (optional) | instagram | instagram | instagram | Social Media | Single line text | No | Trim | Yes |
| Your event idea (title) | idea_title | idea_title | idea_title | Suggested Event/Activity | Long text | Yes | Trim | Yes |
| Describe the vibe… | idea_description | idea_description | idea_description | Reason for Suggestion | Long text | Yes | Trim | Yes |
| Preferred vibe / day (optional) | preferred_vibe | preferred_vibe | preferred_vibe | Preferred Vibe/Day **(created)** | Single line text | No | Trim | Yes |
| I agree to be contacted… | consent | consent | consent | Consent To Contact | Single select | No | boolean → "Yes"/"No" | Yes |
| — (system) | — | — | — | Source = "Website" | Single select | n/a | Constant | Yes |

\* `Attendee Email` in Interest Forms is a single-line-text column in the base; it stores the email string.

---

## General Application (fallback)

Frontend component: `components/forms/application-form.tsx`
API route: `app/api/applications/route.ts`
Airtable table: `Applications` (`tbl2r0WCwcH9H6zxJ`)
Also persisted to Supabase `applications`.

| User-facing Label | Input Name | State Key | API Payload Key | Airtable Field | Airtable Type | Required | Transform | Tested |
|---|---|---|---|---|---|---|---|---|
| Full Name | name | name | name | Applicant Name (+ Name) | Single line text | Yes | Trim | Yes |
| Email | email | email | email | Applicant Email | Email | Yes | Trim | Yes |
| (application type) | — | type | type | Role | Single select | Yes | type → Role (typecast) | Yes |
| Phone (optional) | phone | phone | phone | Phone | Phone | No | Trim | Yes |
| Instagram (optional) | instagram | instagram | instagram | Instagram **(created)** | Single line text | No | Trim | Yes |
| Portfolio / Links (optional) | portfolio_url | portfolio_url | portfolio_url | Portfolio **(created)** | URL | No | Trim | Yes |
| Experience (optional) | experience | experience | experience | Experience **(created)** | Long text | No | Trim | Yes |
| Message / Bio (optional) | message | message | message | Application Notes | Long text | No | Trim | Yes |

---

## Intern Application

Frontend component: `components/forms/application-form.tsx` (type `intern`, via `/apply/intern`)
API route: `app/api/applications/interns/route.ts`
Airtable table: `INTERNS` → real name `Interns` (`tbl3zQWwu4kUxw95E`)
Also persisted to Supabase `applications` (type `intern`).

| User-facing Label | Input Name | State Key | API Payload Key | Airtable Field | Airtable Type | Required | Transform | Tested |
|---|---|---|---|---|---|---|---|---|
| Full Name | name | name | name | Name | Single line text | Yes | Trim | Yes |
| Email | email | email | email | Email **(created)** | Email | Yes | Trim | Yes |
| Phone (optional) | phone | phone | phone | `Phone ` (trailing space) | Phone | No | Trim | Yes |
| Instagram (optional) | instagram | instagram | instagram | Instagram | Single line text | No | Trim | Yes |
| Portfolio / Links (optional) | portfolio_url | portfolio_url | portfolio_url | Portfolio | URL | No | Trim | Yes |
| Experience (optional) | experience | experience | experience | Experience | Long text | No | Trim | Yes |
| Message / Bio (optional) | message | message | message | Notes | Long text | No | Trim | Yes |

---

## Vendor Application

Frontend component: `components/forms/application-form.tsx` (type `vendor`, via `/apply/vendor`)
API route: `app/api/applications/vendors/route.ts`
Airtable table: `VENDORS` → real name `Vendors` (`tblHwCW43Nzf0iNHi`)
Also persisted to Supabase `applications` (type `vendor`).

| User-facing Label | Input Name | State Key | API Payload Key | Airtable Field | Airtable Type | Required | Transform | Tested |
|---|---|---|---|---|---|---|---|---|
| Full Name | name | name | name | Name | Single line text | Yes | Trim | Yes |
| Email | email | email | email | Email | Email | Yes | Trim | Yes |
| Phone (optional) | phone | phone | phone | Phone | Phone | No | Trim | Yes |
| Instagram (optional) | instagram | instagram | instagram | Instagram **(created)** | Single line text | No | Trim | Yes |
| Portfolio / Links (optional) | portfolio_url | portfolio_url | portfolio_url | Portfolio | URL | No | Trim | Yes |
| Experience (optional) | experience | experience | experience | Experience **(created)** | Long text | No | Trim | Yes |
| Message / Bio (optional) | message | message | message | Notes | Long text | No | Trim | Yes |

---

## DJ Application

Frontend component: `components/forms/application-form.tsx` (type `dj`, via `/dj`)
API route: `app/api/applications/dj/route.ts`
Airtable table: `DJ` → real name `Dj` (`tblBQJ9lOtCFzlLu0`)
Also persisted to Supabase `applications` (type `dj`).

| User-facing Label | Input Name | State Key | API Payload Key | Airtable Field | Airtable Type | Required | Transform | Tested |
|---|---|---|---|---|---|---|---|---|
| Full Name | name | name | name | Name | Single line text | Yes | Trim | Yes |
| Email | email | email | email | Email | Single line text | Yes | Trim | Yes |
| Phone (optional) | phone | phone | phone | Phone | Phone | No | Trim | Yes |
| Instagram (optional) | instagram | instagram | instagram | Social Media Handle | Single line text | No | Trim | Yes |
| Mix / Portfolio Link | portfolio_url | portfolio_url | portfolio_url | Portfolio/Media link | URL | No | Trim | Yes |
| Tell us about your sound | message | message | message | Notes | Long text | No | Trim | Yes |
| Experience (optional) | experience | experience | experience | Experience/ Messages | Long text | No | Trim | Yes |

---

## Sponsor Application / Inquiry

Frontend component: _none yet_ (route ready for a future sponsor form)
API route: `app/api/applications/sponsors/route.ts`
Airtable table: `SPONSORS` → real name `Sponsors` (`tbl76EBA5bnLJGswo`)
Airtable-only (no `sponsor` Supabase application type).

| User-facing Label | Input Name | State Key | API Payload Key | Airtable Field | Airtable Type | Required | Transform | Tested |
|---|---|---|---|---|---|---|---|---|
| Full Name | name | name | name | Name | Single line text | Yes | Trim | Yes |
| Email | email | email | email | Email | Single line text | Yes | Trim | Yes |
| Phone | phone | phone | phone | Phone | Phone | No | Trim | Yes |
| Instagram | instagram | instagram | instagram | Social Media Handle | Single line text | No | Trim | Yes |
| Portfolio / Media link | portfolio_url | portfolio_url | portfolio_url | Portfolio/Media link | URL | No | Trim | Yes |
| Experience / Message | experience | experience | experience | Experience/ Messages | Long text | No | Trim | Yes |
| Message | message | message | message | Notes | Long text | No | Trim | Yes |

---

## Freelancer Application

Frontend component: `components/forms/application-form.tsx` (type `freelancer`, via `/apply/freelancer`)
API route: `app/api/applications/freelance/route.ts`
Airtable table: `FREELANCE` → real name `Freelance` (`tblgJlCIUCwCDlZIO`)
Also persisted to Supabase `applications` (type `freelancer`).

| User-facing Label | Input Name | State Key | API Payload Key | Airtable Field | Airtable Type | Required | Transform | Tested |
|---|---|---|---|---|---|---|---|---|
| Full Name | name | name | name | Name | Single line text | Yes | Trim | Yes |
| Email | email | email | email | Email | Single line text | Yes | Trim | Yes |
| Phone (optional) | phone | phone | phone | Phone | Phone | No | Trim | Yes |
| Instagram (optional) | instagram | instagram | instagram | Instagram **(created)** | Single line text | No | Trim | Yes |
| Portfolio / Links (optional) | portfolio_url | portfolio_url | portfolio_url | Portfolio | URL | No | Trim | Yes |
| Experience (optional) | experience | experience | experience | Experience **(created)** | Long text | No | Trim | Yes |
| Message / Bio (optional) | message | message | message | Notes | Long text | No | Trim | Yes |

---

## Airtable fields created during this audit

| Table | Field | Type |
|---|---|---|
| RSVPs | Phone | Phone |
| RSVPs | Event Name | Single line text |
| Interest Forms | Preferred Vibe/Day | Single line text |
| Applications | Instagram | Single line text |
| Applications | Portfolio | URL |
| Applications | Experience | Long text |
| Interns | Email | Email |
| Vendors | Instagram | Single line text |
| Vendors | Experience | Long text |
| Freelance | Instagram | Single line text |
| Freelance | Experience | Long text |

All other inputs mapped to columns that already existed. No input is dropped.

## Schema inconsistencies to be aware of (recommended cleanup, not blocking)

- **Interns `Phone ` has a trailing space.** The code targets the exact name; consider renaming the column to `Phone`.
- **RSVPs has both `Phone` (created, phone type) and a legacy numeric `Phone Number`.** Forms write to `Phone`; `Phone Number` is unused and can be removed.
- **Instagram column naming varies** (`Social Media`, `Social Media Handle`, `Instagram`) across tables. Harmless; mappings match each table's real name.
- **Dj/Sponsors `Email` columns are single-line-text** (not the Email type). They still store the email string fine.

## Environment variables (Vercel)

`AIRTABLE_API_KEY` is required (server-only). The base id and each `*_TABLE`
value have safe built-in fallbacks (the stable Airtable **table IDs**), so a
missing or mis-cased table-name var can never break a form.

```env
AIRTABLE_API_KEY=                       # required, server-only
AIRTABLE_BASE_ID=appfq5XK6vJpwDCyg
# Optional overrides — must be the EXACT case-sensitive name or a table id.
AIRTABLE_RSVP_TABLE=RSVPs
AIRTABLE_SIGNUPS_TABLE=Signups
AIRTABLE_APPLICATIONS_TABLE=Applications
AIRTABLE_INTEREST_TABLE=Interest Forms
AIRTABLE_INTERNS_TABLE=Interns
AIRTABLE_VENDORS_TABLE=Vendors
AIRTABLE_DJ_TABLE=Dj
AIRTABLE_SPONSORS_TABLE=Sponsors
AIRTABLE_FREELANCE_TABLE=Freelance
```

> ⚠️ The case-sensitive Airtable table names are `RSVPs`, `Signups`,
> `Interest Forms`, `Dj` — **not** `RSVPS` / `SIGNUPS` / `INTEREST FORMS` / `DJ`.
> If you set the `*_TABLE` vars, use the exact names above (or omit them to use
> the built-in table IDs).
