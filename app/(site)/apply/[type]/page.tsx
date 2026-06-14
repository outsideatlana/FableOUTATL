import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { ApplicationType } from '@/types/database';
import { APPLICATION_TYPE_META } from '@/types/applications';
import { ApplyView } from '@/components/public/apply-view';

const VALID: ApplicationType[] = ['intern', 'freelancer', 'vendor', 'dj'];

type Props = { params: Promise<{ type: string }> };

export function generateStaticParams() {
  // dj has its own dedicated route at /dj
  return [{ type: 'intern' }, { type: 'freelancer' }, { type: 'vendor' }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { type } = await params;
  if (!VALID.includes(type as ApplicationType)) return { title: 'Apply' };
  return { title: `Apply — ${APPLICATION_TYPE_META[type as ApplicationType].label}` };
}

export default async function ApplyPage({ params }: Props) {
  const { type } = await params;
  if (!VALID.includes(type as ApplicationType)) notFound();
  return <ApplyView type={type as ApplicationType} />;
}
