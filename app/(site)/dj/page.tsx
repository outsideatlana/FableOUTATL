import type { Metadata } from 'next';
import { ApplyView } from '@/components/public/apply-view';

export const metadata: Metadata = {
  title: 'DJ & Artist Submission',
  description: 'Send OutsideAtl your mix, your set, your sound. We are listening.',
};

export default function DjPage() {
  return <ApplyView type="dj" />;
}
