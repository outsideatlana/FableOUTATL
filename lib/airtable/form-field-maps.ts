import 'server-only';

/**
 * SINGLE SOURCE OF TRUTH for how every site form maps onto Airtable.
 *
 * Each entry pins a form to one Airtable table and maps each logical input key
 * to the EXACT column name in base appfq5XK6vJpwDCyg (verified live — names are
 * case-sensitive and intentionally vary per table, e.g. "Social Media" vs
 * "Social Media Handle", "Phone " has a trailing space on Interns). Do not
 * "tidy" these strings to match a guess — they must equal the real columns.
 *
 * `tableId` is the casing-proof identifier used in the REST URL; `tableEnv`
 * may override it (must be an exact table name or a table id); `table` is the
 * human name for docs/logs. `primaryFrom` is the logical key whose value also
 * fills the table's primary column. `constants` are non-input values we always
 * write (e.g. Source = "Website"). `consentField`/`phoneField` flag special
 * handling done in client.ts (select Yes/No, etc.).
 */

export interface FormFieldMap {
  table: string;
  tableId: string;
  tableEnv: string;
  /** logical input key -> exact Airtable column name */
  fields: Record<string, string>;
  /** Airtable primary column + which logical key feeds it. */
  primary: { field: string; from: string };
  /** Constant (non-input) columns always written. */
  constants?: Record<string, string>;
}

export const AIRTABLE_FORM_MAPS = {
  // RSVP form  →  RSVPs
  rsvp: {
    table: 'RSVPs',
    tableId: 'tblMsYOvmcZ3GkxAU',
    tableEnv: 'AIRTABLE_RSVP_TABLE',
    primary: { field: 'Name', from: 'name' },
    fields: {
      name: 'Attendee Name',
      email: 'Attendee Email',
      phone: 'Phone',
      instagram: 'Social Media',
      event: 'Event Name',
      notes: 'Notes',
    },
  },

  // Newsletter / join-the-list form  →  Signups
  signup: {
    table: 'Signups',
    tableId: 'tblHVZAqfwVeiI9NE',
    tableEnv: 'AIRTABLE_SIGNUPS_TABLE',
    primary: { field: 'Name', from: 'email' },
    fields: {
      email: 'Attendee Email',
    },
    constants: { Source: 'Website' },
  },

  // Gauge My Interest / "What should we throw next?"  →  Interest Forms
  interest: {
    table: 'Interest Forms',
    tableId: 'tblxF8FH9U0tANlUu',
    tableEnv: 'AIRTABLE_INTEREST_TABLE',
    primary: { field: 'Name', from: 'name' },
    fields: {
      name: 'Attendee Name',
      email: 'Attendee Email',
      phone: 'Phone',
      instagram: 'Social Media',
      ideaTitle: 'Suggested Event/Activity',
      description: 'Reason for Suggestion',
      preferredVibe: 'Preferred Vibe/Day',
      consent: 'Consent To Contact', // singleSelect → "Yes"/"No"
    },
    constants: { Source: 'Website' },
  },

  // General application fallback  →  Applications
  application: {
    table: 'Applications',
    tableId: 'tbl2r0WCwcH9H6zxJ',
    tableEnv: 'AIRTABLE_APPLICATIONS_TABLE',
    primary: { field: 'Name', from: 'name' },
    fields: {
      name: 'Applicant Name',
      email: 'Applicant Email',
      role: 'Role',
      phone: 'Phone',
      instagram: 'Instagram',
      portfolio: 'Portfolio',
      experience: 'Experience',
      message: 'Application Notes',
    },
  },

  // Intern application  →  Interns
  interns: {
    table: 'Interns',
    tableId: 'tbl3zQWwu4kUxw95E',
    tableEnv: 'AIRTABLE_INTERNS_TABLE',
    primary: { field: 'Name', from: 'name' },
    fields: {
      email: 'Email',
      phone: 'Phone ', // NOTE: trailing space — that is the real column name.
      instagram: 'Instagram',
      portfolio: 'Portfolio',
      experience: 'Experience',
      message: 'Notes',
    },
  },

  // Vendor application  →  Vendors
  vendors: {
    table: 'Vendors',
    tableId: 'tblHwCW43Nzf0iNHi',
    tableEnv: 'AIRTABLE_VENDORS_TABLE',
    primary: { field: 'Name', from: 'name' },
    fields: {
      email: 'Email',
      phone: 'Phone',
      instagram: 'Instagram',
      portfolio: 'Portfolio',
      experience: 'Experience',
      message: 'Notes',
    },
  },

  // DJ application  →  Dj
  dj: {
    table: 'Dj',
    tableId: 'tblBQJ9lOtCFzlLu0',
    tableEnv: 'AIRTABLE_DJ_TABLE',
    primary: { field: 'Name', from: 'name' },
    fields: {
      email: 'Email',
      phone: 'Phone',
      instagram: 'Social Media Handle',
      portfolio: 'Portfolio/Media link',
      experience: 'Experience/ Messages',
      message: 'Notes',
    },
  },

  // Sponsor application / inquiry  →  Sponsors
  sponsors: {
    table: 'Sponsors',
    tableId: 'tbl76EBA5bnLJGswo',
    tableEnv: 'AIRTABLE_SPONSORS_TABLE',
    primary: { field: 'Name', from: 'name' },
    fields: {
      email: 'Email',
      phone: 'Phone',
      instagram: 'Social Media Handle',
      portfolio: 'Portfolio/Media link',
      experience: 'Experience/ Messages',
      message: 'Notes',
    },
  },

  // Freelancer application  →  Freelance
  freelance: {
    table: 'Freelance',
    tableId: 'tblgJlCIUCwCDlZIO',
    tableEnv: 'AIRTABLE_FREELANCE_TABLE',
    primary: { field: 'Name', from: 'name' },
    fields: {
      email: 'Email',
      phone: 'Phone',
      instagram: 'Instagram',
      portfolio: 'Portfolio',
      experience: 'Experience',
      message: 'Notes',
    },
  },
} satisfies Record<string, FormFieldMap>;

export type FormKey = keyof typeof AIRTABLE_FORM_MAPS;
