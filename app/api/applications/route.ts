import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { applicationSchema, fieldErrors } from '@/lib/validation/schemas';
import { airtable } from '@/lib/airtable/sync';

export async function POST(request: Request) {
  try {
    const json = await request.json().catch(() => ({}));
    const parsed = applicationSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Please fix the highlighted fields.', fields: fieldErrors(parsed.error) },
        { status: 400 },
      );
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Applications are temporarily unavailable.' },
        { status: 503 },
      );
    }

    const data = parsed.data;
    const { error } = await supabase.from('applications').insert({
      type: data.type,
      name: data.name,
      email: data.email,
      phone: data.phone,
      instagram: data.instagram,
      portfolio_url: data.portfolio_url,
      experience: data.experience,
      message: data.message,
    });
    if (error) {
      console.error('[applications] insert:', error.message);
      return NextResponse.json({ error: 'Could not submit your application. Try again.' }, { status: 500 });
    }

    await airtable.application(data);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error('[applications] error:', err);
    return NextResponse.json({ error: 'Could not submit your application. Try again.' }, { status: 500 });
  }
}
