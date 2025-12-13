"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { TokenResponse } from '../../../../../shared/types/api';
import { saveToken, clearToken } from '../../../../lib/auth-storage';

function parseFragment(fragment: string): Record<string, string> {
  const raw = fragment.startsWith('#') ? fragment.slice(1) : fragment;
  const params = new URLSearchParams(raw);
  const result: Record<string, string> = {};
  params.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}

export default function GoogleSsoCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const { access_token, expires_at, error: err } = parseFragment(window.location.hash);

    if (err) {
      clearToken();
      setError(err);
      return;
    }

    if (!access_token || !expires_at) {
      clearToken();
      setError('missing_token');
      return;
    }

    const token: TokenResponse = {
      access_token,
      token_type: 'bearer',
      expires_at,
    };

    saveToken(token, true);
    router.replace('/dashboard');
  }, [router]);

  if (error) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-slate-900">
        <h1 className="text-2xl font-semibold">SSO sign-in failed</h1>
        <p className="mt-2 text-sm text-slate-600">Error: {error}</p>
        <button
          type="button"
          onClick={() => router.replace('/')}
          className="mt-6 rounded-xl bg-fuchsia-600 px-4 py-2 text-base font-semibold text-white hover:bg-fuchsia-500"
        >
          Back to home
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-16 text-slate-900">
      <h1 className="text-2xl font-semibold">Signing you in…</h1>
      <p className="mt-2 text-sm text-slate-600">Please wait.</p>
    </main>
  );
}
