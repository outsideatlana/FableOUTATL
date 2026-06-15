import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/admin';
import { requireSupabaseAdmin } from '@/lib/supabase/admin';
import { getPublishedEvents } from '@/lib/data/public';
import { eventSchema, fieldErrors } from '@/lib/validation/schemas';
import { airtable } from '@/lib/airtable/sync';
import { slugify } from '@/lib/utils';

// GET /api/events — public: published events only.
export async function GET() {
  const events = await getPublishedEvents();
  return NextResponse.json({ events });
}

// POST /api/events — admin: create an event.
export async function POST(request: Request) {
  if (!(await getSession())) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  try {
    const json = await request.json().catch(() => ({}));
    const parsed = eventSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Please fix the highlighted fields.', fields: fieldErrors(parsed.error) },
        { status: 400 },
      );
    }
    const supabase = requireSupabaseAdmin();
    const data = parsed.data;

    // Derive a unique slug from the title when none was provided.
    const base = (data.slug && slugify(data.slug)) || slugify(data.title) || 'event';
    let slug = base;
    for (let i = 2; i < 50; i++) {
      const { data: clash } = await supabase
        .from('events')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();
      if (!clash) break;
      slug = `${base}-${i}`;
    }

    const { data: event, error } = await supabase
      .from('events')
      .insert({
        title: data.title,
        slug,
        description: data.description,
        event_date: data.event_date,
        location: data.location,
        status: data.status,
        hero_image_url: data.hero_image_url,
        hero_image_pathname: data.hero_image_pathname,
        flyer_image_url: data.flyer_image_url,
        flyer_image_pathname: data.flyer_image_pathname,
      })
      .select('*')
      .single();
    if (error) {
      console.error('[events] create:', error.message);
      return NextResponse.json({ error: 'Could not create the event.' }, { status: 500 });
    }

    await airtable.event(event);
    return NextResponse.json({ ok: true, event }, { status: 201 });
  } catch (err) {
    console.error('[events] create error:', err);
    return NextResponse.json({ error: 'Could not create the event.' }, { status: 500 });
  }
}
