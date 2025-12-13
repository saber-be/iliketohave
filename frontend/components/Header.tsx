"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { AuthModal } from './AuthModal';
import { clearToken, getToken } from '../lib/auth-storage';

export function Header() {
  const [authOpen, setAuthOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { t, i18n } = useTranslation();
  const router = useRouter();

  useEffect(() => {
    setIsAuthenticated(!!getToken());
  }, []);

  const handleLogout = () => {
    clearToken();
    setIsAuthenticated(false);
    router.replace('/');
  };

  const switchLanguage = (lang: 'en' | 'fa') => {
    i18n.changeLanguage(lang);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('lang', lang);
    }
  };

  const currentLang = i18n.language === 'fa' ? 'fa' : 'en';

  return (
    <>
      <header className="border-b border-fuchsia-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <div className="text-xl font-semibold text-slate-900">{t('appName')}</div>

            <div className="flex items-center gap-1 rounded-full border border-fuchsia-100 bg-fuchsia-50 px-1 text-sm">
              <button
                type="button"
                onClick={() => switchLanguage('en')}
                className={`px-2 py-0.5 rounded-full ${
                  currentLang === 'en'
                    ? 'bg-fuchsia-600 text-white'
                    : 'text-slate-600 hover:text-fuchsia-700'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => switchLanguage('fa')}
                className={`px-2 py-0.5 rounded-full ${
                  currentLang === 'fa'
                    ? 'bg-fuchsia-600 text-white'
                    : 'text-slate-600 hover:text-fuchsia-700'
                }`}
              >
                FA
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated && (
              <>
                <Link
                  href="/dashboard"
                  className="text-base font-medium text-slate-700 hover:text-fuchsia-700"
                >
                  {t('headerDashboard')}
                </Link>
                <Link
                  href="/profile"
                  className="text-base font-medium text-slate-700 hover:text-fuchsia-700"
                >
                  {t('headerProfile')}
                </Link>
              </>
            )}
            {isAuthenticated ? (
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-xl border border-fuchsia-200 px-3 py-1.5 text-base text-slate-700 hover:bg-fuchsia-50"
              >
                {t('headerLogout')}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setAuthOpen(true)}
                className="rounded-xl bg-fuchsia-600 px-3 py-1.5 text-base font-semibold text-white hover:bg-fuchsia-500"
              >
                {t('headerAuthCta')}
              </button>
            )}
          </div>
        </div>
      </header>

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onAuthenticated={() => setIsAuthenticated(true)}
      />
    </>
  );
}
