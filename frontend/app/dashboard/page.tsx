"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { createWishlist, fetchMyWishlists } from '../../lib/wishlists';

export default function DashboardPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [wishlists, setWishlists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [wizardOpen, setWizardOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'private' | 'public'>('private');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchMyWishlists();
        setWishlists(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const openWizard = () => {
    setError(null);
    setStep(1);
    setName('');
    setDescription('');
    setVisibility('private');
    setWizardOpen(true);
  };

  const closeWizard = () => {
    if (creating) return;
    setWizardOpen(false);
  };

  const nextStep = () => {
    if (step === 1) {
      if (!name.trim()) {
        setError(t('wizardErrorNameRequired'));
        return;
      }
      setError(null);
      setStep(2);
      return;
    }
    if (step === 2) {
      setError(null);
      setStep(3);
      return;
    }
  };

  const prevStep = () => {
    if (step === 1) return;
    setError(null);
    setStep((s) => (s === 3 ? 2 : 1));
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      setError(t('wizardErrorNameRequired'));
      setStep(1);
      return;
    }

    setCreating(true);
    setError(null);
    try {
      const wl = await createWishlist({
        name: name.trim(),
        description: description.trim() || undefined,
        visibility,
      });
      setWishlists((prev) => [...prev, wl]);
      setWizardOpen(false);
      setName('');
      setDescription('');
      setVisibility('private');
      router.push(`/wishlists/${wl.id}?onboarding=items`);
    } catch (err) {
      console.error(err);
      setError(t('wizardErrorGeneric'));
    } finally {
      setCreating(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t('dashboardTitle')}</h1>
        <button
          type="button"
          onClick={openWizard}
          className="rounded-2xl bg-fuchsia-600 px-4 py-2.5 text-base font-semibold text-white hover:bg-fuchsia-500 disabled:opacity-60"
        >
          {t('dashboardNewWishlist')}
        </button>
      </div>

      {wizardOpen && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-2xl border border-fuchsia-100 bg-white p-6 text-base shadow-lg">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold">
                  {step === 1 && t('wizardTitleStep1')}
                  {step === 2 && t('wizardTitleStep2')}
                  {step === 3 && t('wizardTitleStep3')}
                </h2>
                <p className="mt-1 text-slate-600">{t('wizardIntro')}</p>
              </div>
              <button
                type="button"
                onClick={closeWizard}
                className="text-slate-300 hover:text-white"
                disabled={creating}
              >
                ✕
              </button>
            </div>

            {error && <p className="mb-3 text-xs text-red-600">{error}</p>}

            {step === 1 && (
              <div className="space-y-3">
                <label className="block space-y-1">
                  <span className="text-xs font-medium">{t('wizardFieldNameLabel')}</span>
                  <input
                    className="mt-1 w-full rounded-xl border border-fuchsia-200 bg-white px-3 py-2 text-base"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('wizardFieldNamePlaceholder')}
                  />
                </label>
                <p className="text-xs text-slate-600">{t('wizardFieldNameHelp')}</p>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                <label className="block space-y-1">
                  <span className="text-xs font-medium">{t('wizardFieldDescriptionLabel')}</span>
                  <textarea
                    className="mt-1 w-full rounded-xl border border-fuchsia-200 bg-white px-3 py-2 text-base"
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t('wizardFieldDescriptionPlaceholder')}
                  />
                </label>
                <p className="text-xs text-slate-600">{t('wizardFieldDescriptionHelp')}</p>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-3">
                <p className="text-xs text-slate-600">{t('wizardVisibilityHelp')}</p>
                <div className="space-y-2">
                  <label className="flex cursor-pointer items-start gap-2 rounded-2xl border border-fuchsia-200 bg-fuchsia-50 px-3 py-2">
                    <input
                      type="radio"
                      className="mt-1"
                      checked={visibility === 'private'}
                      onChange={() => setVisibility('private')}
                    />
                    <div>
                      <div className="text-xs font-medium">{t('wizardVisibilityPrivateTitle')}</div>
                      <div className="text-xs text-slate-600">{t('wizardVisibilityPrivateDesc')}</div>
                    </div>
                  </label>
                  <label className="flex cursor-pointer items-start gap-2 rounded border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100">
                    <input
                      type="radio"
                      className="mt-1"
                      checked={visibility === 'public'}
                      onChange={() => setVisibility('public')}
                    />
                    <div>
                      <div className="text-xs font-medium text-slate-50">{t('wizardVisibilityPublicTitle')}</div>
                      <div className="text-xs text-slate-300">{t('wizardVisibilityPublicDesc')}</div>
                    </div>
                  </label>
                </div>
              </div>
            )}

            <div className="mt-6 flex items-center justify-between">
              <button
                type="button"
                onClick={prevStep}
                disabled={step === 1 || creating}
                className="rounded-xl border border-fuchsia-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-fuchsia-50 disabled:opacity-60"
              >
                {t('wizardBack')}
              </button>

              {step < 3 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={creating}
                  className="rounded-xl bg-fuchsia-600 px-4 py-2 text-sm font-semibold text-white hover:bg-fuchsia-500 disabled:opacity-60"
                >
                  {t('wizardNext')}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={creating}
                  className="rounded-xl bg-fuchsia-600 px-4 py-2 text-sm font-semibold text-white hover:bg-fuchsia-500 disabled:opacity-60"
                >
                  {creating ? t('wizardCreating') : t('wizardCreate')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <p>Loading…</p>
      ) : wishlists.length === 0 ? (
        <p className="text-base text-slate-700">
          {t('dashboardEmpty', { button: t('dashboardNewWishlist') })}
        </p>
      ) : (
        <ul className="space-y-2">
          {wishlists.map((wl) => (
            <li
              key={wl.id}
              className="rounded-2xl border border-fuchsia-100 bg-white px-3 py-3 text-base flex items-center justify-between gap-3 shadow-sm"
            >
              <Link href={`/wishlists/${wl.id}`} className="font-medium text-fuchsia-700 hover:underline">
                {wl.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
