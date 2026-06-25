import type { Metadata } from 'next';
import { Anton, Inter, JetBrains_Mono } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { OUTSIDEATL_LOGO_URL } from '@/lib/media';
import './globals.css';

const display = Anton({ subsets: ['latin'], weight: '400', variable: '--font-display' });
const sans = Inter({ subsets: ['latin'], variable: '--font-sans' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: {
    default: "OutsideAtl — The Sound of Atlanta's After-Hours",
    template: '%s · OutsideAtl',
  },
  description:
    'OutsideAtl produces parties, festivals, concerts, raves, pop-ups, and social events across Atlanta. Live music, nightlife, culture.',
  metadataBase: new URL('https://outsideatl.co'),
  // Browser tab / favicon — the OutsideAtl mark, served from Supabase Storage.
  icons: {
    icon: OUTSIDEATL_LOGO_URL,
    shortcut: OUTSIDEATL_LOGO_URL,
    apple: OUTSIDEATL_LOGO_URL,
  },
  openGraph: {
    title: "OutsideAtl — The Sound of Atlanta's After-Hours",
    description: 'Parties, festivals, concerts, raves, and pop-ups across Atlanta.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
