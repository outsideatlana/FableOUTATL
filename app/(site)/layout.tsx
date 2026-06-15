import { SiteNav } from '@/components/layout/site-nav';
import { SiteFooter } from '@/components/layout/site-footer';
import { ScrollBg } from '@/components/layout/scroll-bg';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ScrollBg />
      <SiteNav />
      <main id="main">{children}</main>
      <SiteFooter />
    </>
  );
}
