import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { rsvpSchema, fieldErrors } from '@/lib/validation/schemas';
import { submitRsvp, isAirtableConfigured } from '@/lib/airtable/client';

export async function POST(request: Request) {
  try {
    const json = await request.json().catch(() => ({}));
    const parsed = rsvpSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Please fix the highlighted fields.', fields: fieldErrors(parsed.error) },
        { status: 400 },
      );
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Submissions are temporarily unavailable.' },
        { status: 503 },
      );
    }

    const data = parsed.data;
    const { error } = await supabase.from('rsvps').insert({
      event_id: data.event_id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      instagram: data.instagram,
      notes: data.notes,
    });
    if (error) {
      console.error('[rsvp] insert:', error.message);
      return NextResponse.json({ error: 'Could not save your RSVP. Try again.' }, { status: 500 });
    }

    // Optional CRM mirror — looks up the event title for a friendlier record.
    let eventTitle: string | null = null;
    if (data.event_id) {
      const { data: ev } = await supabase
        .from('events')
        .select('title')
        .eq('id', data.event_id)
        .maybeSingle();
      eventTitle = ev?.title ?? null;
    }

    // Form submission → Airtable RSVPs. Supabase above is the source of truth
    // for the admin dashboard; an Airtable hiccup must not lose the RSVP.
    if (isAirtableConfigured()) {
      try {
        await submitRsvp({ ...data, event_title: eventTitle });
      } catch (err) {
        console.error('[rsvp] airtable submit failed (saved in Supabase):', err);
      }
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error('[rsvp] error:', err);
    return NextResponse.json({ error: 'Could not save your RSVP. Try again.' }, { status: 500 });
  }
}
