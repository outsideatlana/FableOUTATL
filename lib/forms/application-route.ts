import 'server-only';
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { roleApplicationSchema, fieldErrors } from '@/lib/validation/schemas';
import {
  submitRoleApplication,
  isAirtableConfigured,
  type AirtableTableKey,
} from '@/lib/airtable/client';
import type { ApplicationType } from '@/types/database';

type RoleKey = Extract<
  AirtableTableKey,
  'interns' | 'vendors' | 'dj' | 'sponsors' | 'freelance'
>;

/**
 * Builds a POST handler for a role-specific application form. The form's
 * PRIMARY destination is its dedicated Airtable table (Interns / Vendors / Dj
 * / Sponsors / Freelance). When a matching Supabase application_type exists we
 * also mirror to the Supabase `applications` table (best-effort) so the record
 * keeps showing in the existing admin dashboard.
 *
 * Shared Airtable logic comes from lib/airtable/client.ts — never inlined here
 * and never imported into a client component (AIRTABLE_API_KEY stays server-side).
 */
export function makeRoleApplicationRoute(opts: {
  tableKey: RoleKey;
  label: string;
  /** Omit for Sponsors — there is no 'sponsor' application_type enum value. */
  supabaseType?: ApplicationType;
}) {
  return async function POST(request: Request) {
    try {
      const json = await request.json().catch(() => ({}));
      const parsed = roleApplicationSchema.safeParse(json);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Please fix the highlighted fields.', fields: fieldErrors(parsed.error) },
          { status: 400 },
        );
      }
      const data = parsed.data;

      // Best-effort mirror to Supabase for admin visibility.
      if (opts.supabaseType) {
        const supabase = getSupabaseAdmin();
        if (supabase) {
          const { error } = await supabase.from('applications').insert({
            type: opts.supabaseType,
            name: data.name,
            email: data.email,
            phone: data.phone,
            instagram: data.instagram,
            portfolio_url: data.portfolio_url,
            experience: data.experience,
            message: data.message,
          });
          if (error) {
            console.error(`[applications:${opts.tableKey}] supabase insert:`, error.message);
          }
        }
      }

      // Primary destination → dedicated Airtable table.
      if (!isAirtableConfigured()) {
        return NextResponse.json(
          { error: `${opts.label} applications are temporarily unavailable.` },
          { status: 503 },
        );
      }
      try {
        await submitRoleApplication(opts.tableKey, data);
      } catch (err) {
        console.error(`[applications:${opts.tableKey}] airtable submit failed:`, err);
        return NextResponse.json(
          { error: 'Could not submit your application. Try again.' },
          { status: 500 },
        );
      }

      return NextResponse.json({ ok: true }, { status: 201 });
    } catch (err) {
      console.error(`[applications:${opts.tableKey}] error:`, err);
      return NextResponse.json(
        { error: 'Could not submit your application. Try again.' },
        { status: 500 },
      );
    }
  };
}
