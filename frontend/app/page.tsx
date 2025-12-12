"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { AuthModal } from '../components/AuthModal';
import { getToken } from '../lib/auth-storage';

export default function HomePage() {
  const [authOpen, setAuthOpen] = useState(false);
  const { t } = useTranslation();
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    if (token) {
      router.replace('/dashboard');
    }
  }, [router]);

  return (
    <>
      <main className="min-h-[calc(100vh-4rem)] bg-sky-50 text-slate-900">
        <section className="mx-auto flex max-w-5xl flex-col items-center gap-10 px-4 py-16 md:flex-row md:py-24">
          <div className="flex-1 space-y-6 text-center md:text-left">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              {t('heroTitleLine1')}
              <span className="block bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text text-transparent">
                {t('heroTitleHighlight')}
              </span>
            </h1>
            <p className="mx-auto max-w-xl text-base text-slate-600 sm:text-lg">
              {t('heroSubtitle')}
            </p>
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center md:justify-start">
              <button
                type="button"
                onClick={() => setAuthOpen(true)}
                className="w-full rounded-md bg-sky-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500 sm:w-auto"
              >
                {t('heroCta')}
              </button>
            </div>
            <p className="text-xs text-slate-500">
              {t('heroNote')}
            </p>
          </div>

          <div className="flex-1 w-full max-w-md rounded-2xl border border-sky-100 bg-white p-5 shadow-md shadow-sky-100/70">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-sky-400">
                  Preview
                </p>
                <p className="text-sm text-slate-600">Your wishlist at a glance</p>
              </div>
              <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-300">
                Private by default
              </span>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-lg border border-sky-100 bg-sky-50 px-3 py-2">
                <div>
                  <p className="font-medium text-slate-900">Birthday wishlist</p>
                  <p className="text-xs text-slate-500">7 items • 3 reserved</p>
                </div>
                <span className="rounded-full bg-sky-500/20 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-sky-300">
                  Shared
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-sky-100 bg-sky-50 px-3 py-2">
                <div>
                  <p className="font-medium text-slate-900">Things to read</p>
                  <p className="text-xs text-slate-500">5 items • 1 received</p>
                </div>
                <span className="rounded-full bg-emerald-500/20 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
                  In progress
                </span>
              </div>
              <div className="rounded-lg border border-dashed border-sky-200 bg-sky-50 px-3 py-4 text-center text-xs text-slate-500">
                Add anything you'd like to have – links, notes, and more
              </div>
            </div>
          </div>
        </section>
      </main>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} onAuthenticated={() => setAuthOpen(false)} />
    </>
  );
}
