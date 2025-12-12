"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthModal } from './AuthModal';
import { clearToken, getToken } from '../lib/auth-storage';

export function Header() {
  const [authOpen, setAuthOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { t, i18n } = useTranslation();

  useEffect(() => {
    setIsAuthenticated(!!getToken());
  }, []);

  const handleLogout = () => {
    clearToken();
    setIsAuthenticated(false);
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
      <header className="border-b border-sky-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <div className="text-lg font-semibold text-slate-900">{t('appName')}</div>

            <div className="flex items-center gap-1 rounded-full border border-sky-100 bg-sky-50 px-1 text-xs">
              <button
                type="button"
                onClick={() => switchLanguage('en')}
                className={`px-2 py-0.5 rounded-full ${
                  currentLang === 'en'
                    ? 'bg-sky-600 text-white'
                    : 'text-slate-500 hover:text-sky-600'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => switchLanguage('fa')}
                className={`px-2 py-0.5 rounded-full ${
                  currentLang === 'fa'
                    ? 'bg-sky-600 text-white'
                    : 'text-slate-300 hover:text-sky-400'
                }`}
              >
                FA
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated && (
              <Link
                href="/dashboard"
                className="text-sm font-medium text-slate-700 hover:text-sky-600"
              >
                Dashboard
              </Link>
            )}
            {isAuthenticated ? (
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-md border border-sky-200 px-3 py-1 text-sm text-slate-700 hover:bg-sky-50"
              >
                Logout
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setAuthOpen(true)}
                className="rounded-md bg-sky-600 px-3 py-1 text-sm font-medium text-white hover:bg-sky-500"
              >
                Sign in / Sign up
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
