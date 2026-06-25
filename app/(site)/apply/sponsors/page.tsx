import type { Metadata } from 'next';
import Link from 'next/link';
import { Section } from '@/components/public/section';
import { SponsorForm } from '@/components/forms/sponsor-form';

export const metadata: Metadata = {
  title: 'Sponsor & Partner With OutsideAtl',
  description:
    'Sponsorship packages, brand activations, in-kind partnerships, and media collabs with OutsideAtl — Atlanta nightlife, live music, and culture.',
};

export default function SponsorsPage() {
  return (
    <Section eyebrow="[ Sponsors & Partners ]" title="Partner With OutsideAtl">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <p className="max-w-md text-muted">
            Put your brand in front of Atlanta&apos;s nightlife and live-music community. We build
            custom sponsorship packages — cash, in-kind, media, and on-site activations — around the
            parties, festivals, and pop-ups we throw. Tell us what you&apos;re after and we&apos;ll
            tailor the deal.
          </p>
          <ul className="mt-8 space-y-2 font-mono text-xs uppercase tracking-[0.15em] text-muted">
            <li>— Brand activations &amp; on-site presence</li>
            <li>— In-kind &amp; product partnerships</li>
            <li>— Media &amp; content collaborations</li>
            <li>— Custom packages for every budget</li>
          </ul>
          <p className="mt-8 text-sm text-muted">
            Want to vend instead?{' '}
            <Link href="/apply/vendor" className="text-white underline underline-offset-4 hover:text-electric-400">
              Apply as a vendor
            </Link>
            .
          </p>
        </div>

        <div className="border border-line bg-ink-800 p-6 md:p-8">
          <SponsorForm />
        </div>
      </div>
    </Section>
  );
}
