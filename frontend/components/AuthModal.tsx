"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login, signUp } from '../lib/api';
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl border border-sky-100">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`px-3 py-1 text-sm font-medium rounded-full ${
                mode === 'login' ? 'bg-sky-600 text-white' : 'bg-sky-50 text-slate-700'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`px-3 py-1 text-sm font-medium rounded-full ${
                mode === 'signup' ? 'bg-sky-600 text-white' : 'bg-sky-50 text-slate-700'
              }`}
            >
              Sign up
            </button>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-200"
          >
            ✕
          </button>
        </div>

        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          {mode === 'login' ? 'Welcome back' : 'Create your account'}
        </h2>

        {error && (
          <div className="mb-3 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-slate-700" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              className="w-full rounded-md border border-sky-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-700" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="inline-flex items-center gap-2 text-slate-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-sky-300 bg-white text-sky-600"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              <span>Remember me</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 inline-flex w-full items-center justify-center rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-60"
          >
            {loading ? 'Please wait…' : mode === 'login' ? 'Login' : 'Sign up'}
          </button>
        </form>
      </div>
    </div>
  );
}
