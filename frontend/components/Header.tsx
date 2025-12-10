"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { AuthModal } from './AuthModal';
import { clearToken, getToken } from '../lib/auth-storage';

export function Header() {
  const [authOpen, setAuthOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setIsAuthenticated(!!getToken());
  }, []);

  const handleLogout = () => {
    clearToken();
    setIsAuthenticated(false);
  };

  return (
    <>
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="text-lg font-semibold text-slate-100">iliketohave</div>
          <div className="flex items-center gap-3">
            {isAuthenticated && (
              <Link
                href="/dashboard"
                className="text-sm font-medium text-slate-100 hover:text-sky-400"
              >
                Dashboard
              </Link>
            )}
            {isAuthenticated ? (
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-md border border-slate-700 px-3 py-1 text-sm text-slate-200 hover:bg-slate-800"
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
