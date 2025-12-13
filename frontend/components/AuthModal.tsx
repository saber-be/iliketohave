"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL, login, signUp } from '../lib/api';
import { saveToken, clearToken } from '../lib/auth-storage';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onAuthenticated: () => void;
}

export function AuthModal({ open, onClose, onAuthenticated }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  if (!open) return null;

  const reset = () => {
    setEmail('');
    setPassword('');
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (mode === 'login') {
        const token = await login({ email, password });
        saveToken(token, remember);
      } else {
        await signUp({ email, password });
        const token = await login({ email, password });
        saveToken(token, remember);
      }
      onAuthenticated();
      handleClose();
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.detail ?? 'Authentication failed');
      clearToken();
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    if (typeof window === 'undefined') return;
    window.location.href = `${API_BASE_URL}/api/auth/sso/google/start`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-fuchsia-100">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`px-3 py-1 text-sm font-medium rounded-full ${
                mode === 'login' ? 'bg-fuchsia-600 text-white' : 'bg-fuchsia-50 text-slate-700'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`px-3 py-1 text-sm font-medium rounded-full ${
                mode === 'signup' ? 'bg-fuchsia-600 text-white' : 'bg-fuchsia-50 text-slate-700'
              }`}
            >
              Sign up
            </button>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-slate-500 hover:text-slate-900"
          >
            ✕
          </button>
        </div>

        <h2 className="mb-4 text-xl font-semibold text-slate-900">
          {mode === 'login' ? 'Welcome back' : 'Create your account'}
        </h2>

        {error && (
          <div className="mb-3 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="mb-4 inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-base font-semibold text-slate-800 hover:bg-slate-50"
        >
          Continue with Google
        </button>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-base text-slate-700" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              className="w-full rounded-xl border border-fuchsia-200 bg-white px-3 py-2 text-base text-slate-900 outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-base text-slate-700" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between text-base">
            <label className="inline-flex items-center gap-2 text-slate-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-fuchsia-300 bg-white text-fuchsia-600"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              <span>Remember me</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 inline-flex w-full items-center justify-center rounded-xl bg-fuchsia-600 px-4 py-2.5 text-base font-semibold text-white hover:bg-fuchsia-500 disabled:opacity-60"
          >
            {loading ? 'Please wait…' : mode === 'login' ? 'Login' : 'Sign up'}
          </button>
        </form>
      </div>
    </div>
  );
}
