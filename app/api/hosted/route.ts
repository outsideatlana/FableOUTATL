import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/admin';
import { requireSupabaseAdmin } from '@/lib/supabase/admin';
import { getPublicHosted } from '@/lib/data/public';
import { hostedSchema, fieldErrors } from '@/lib/validation/schemas';

// GET /api/hosted — public: published hosted entries.
export async function GET() {
  const hosted = await getPublicHosted();
  return NextResponse.json({ hosted });
}

// POST /api/hosted — admin: create a hosted entry (image already uploaded
// to Vercel Blob client-side; this stores url + pathname + metadata).
export async function POST(request: Request) {
  if (!(await getSession())) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  try {
    const json = await request.json().catch(() => ({}));
    const parsed = hostedSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Please fix the highlighted fields.', fields: fieldErrors(parsed.error) },
        { status: 400 },
      );
    }
    const data = parsed.data;
    const supabase = requireSupabaseAdmin();
    const { data: entry, error } = await supabase
      .from('hosted')
      .insert({
        name: data.name,
        image_url: data.image_url,
        image_pathname: data.image_pathname,
        description: data.description,
        link_url: data.link_url,
        sort_order: data.sort_order,
        published: data.published,
      })
      .select('*')
      .single();
    if (error) {
      console.error('[hosted] insert:', error.message);
      return NextResponse.json({ error: 'Could not save the entry.' }, { status: 500 });
    }
    return NextResponse.json({ ok: true, hosted: entry }, { status: 201 });
  } catch (err) {
    console.error('[hosted] create error:', err);
    return NextResponse.json({ error: 'Could not save the entry.' }, { status: 500 });
  }
}
