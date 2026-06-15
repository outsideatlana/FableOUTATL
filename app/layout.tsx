import type { Metadata } from 'next';
import { Anton, Inter, JetBrains_Mono } from 'next/font/google';
import { SpeedInsights } from '@vercel/speed-insights/next';
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
  metadataBase: new URL('https://outsideatl.com'),
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
        <SpeedInsights />
      </body>
    </html>
  );
}
