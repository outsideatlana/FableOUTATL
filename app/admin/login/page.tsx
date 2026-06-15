import { Suspense } from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { LoginForm } from '@/components/admin/login-form';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Admin Login', robots: { index: false } };

export default function AdminLoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-5">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(37,99,235,0.18),transparent)]" />
      <div className="relative w-full max-w-sm">
        <Link href="/" className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-muted hover:text-white">
          ← Back
        </Link>
        <h1 className="mt-4 font-display text-5xl uppercase tracking-tight">
          Outside<span className="text-hot">Atl</span>
        </h1>
        <p className="mono-label mt-1">[ Admin Portal ]</p>
        <div className="mt-6 border border-line bg-ink-800 p-6">
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
