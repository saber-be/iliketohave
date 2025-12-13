"use client";

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { addWishlistItem, fetchWishlist, updateWishlistItem, createShare } from '../../../lib/wishlists';

export default function WishlistDetailPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const id = params?.id;
  const [wishlist, setWishlist] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [note, setNote] = useState('');
  const [creating, setCreating] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [editingNoteItemId, setEditingNoteItemId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [itemWizardOpen, setItemWizardOpen] = useState(false);
  const [itemStep, setItemStep] = useState<1 | 2 | 3>(1);
  const [itemTitle, setItemTitle] = useState('');
  const [itemUrl, setItemUrl] = useState('');
  const [itemNote, setItemNote] = useState('');
  const [itemError, setItemError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const wl = await fetchWishlist(id);
        setWishlist(wl);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  useEffect(() => {
    if (!wishlist) return;
    const onboarding = searchParams?.get('onboarding');
    if (onboarding === 'items' && (!wishlist.items || wishlist.items.length === 0)) {
      setItemWizardOpen(true);
      setItemStep(1);
      setItemTitle('');
      setItemUrl('');
      setItemNote('');
      setItemError(null);
    }
  }, [wishlist, searchParams]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !title.trim()) return;
    setCreating(true);
    try {
      const item = await addWishlistItem(id, {
        title,
        link: url || undefined,
        description: note || undefined,
      });
      setWishlist((prev: any) => ({ ...prev, items: [...(prev?.items ?? []), item] }));
      setTitle('');
      setUrl('');
      setNote('');
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const handleAddItemFromWizard = async () => {
    if (!id) return;
    if (!itemTitle.trim()) {
      setItemError(t('itemWizardErrorNameRequired'));
      setItemStep(1);
      return;
    }
    setCreating(true);
    setItemError(null);
    try {
      const item = await addWishlistItem(id, {
        title: itemTitle.trim(),
        link: itemUrl.trim() || undefined,
        description: itemNote.trim() || undefined,
      });
      setWishlist((prev: any) => ({ ...prev, items: [...(prev?.items ?? []), item] }));
      setItemWizardOpen(false);
      setItemTitle('');
      setItemUrl('');
      setItemNote('');
    } catch (err) {
      console.error(err);
      setItemError(t('itemWizardErrorGeneric'));
    } finally {
      setCreating(false);
    }
  };

  const updateItemReceived = async (item: any, isReceived: boolean, receivedNote: string | undefined) => {
    if (!id) return;
    try {
      const updated = await updateWishlistItem(item.id, {
        title: item.title,
        description: item.description ?? undefined,
        link: item.link ?? undefined,
        priority: item.priority ?? undefined,
        is_received: isReceived,
        received_note: receivedNote,
      });
      setWishlist((prev: any) => ({
        ...prev,
        items: (prev?.items ?? []).map((i: any) => (i.id === item.id ? updated : i)),
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartReceived = (item: any) => {
    setEditingNoteItemId(item.id);
    setNoteDraft(item.received_note ?? '');
  };

  const handleConfirmReceived = async (item: any) => {
    await updateItemReceived(item, true, noteDraft || undefined);
    setEditingNoteItemId(null);
    setNoteDraft('');
  };

  const handleMarkNotReceived = async (item: any) => {
    await updateItemReceived(item, false, undefined);
  };

  const handleShare = async () => {
    if (!id || !wishlist) return;
    try {
      const share = await createShare(id, { is_claimable: true });
      const url = `${window.location.origin}/public/${share.token}`;
      setShareLink(url);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <p>Loading wishlist…</p>;
  }

  if (!wishlist) {
    return <p>Wishlist not found.</p>;
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{wishlist.name}</h1>
          {wishlist.description && <p className="text-base text-slate-700">{wishlist.description}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setItemWizardOpen(true);
              setItemStep(1);
              setItemTitle('');
              setItemUrl('');
              setItemNote('');
              setItemError(null);
            }}
            className="rounded-2xl border border-fuchsia-300 px-3 py-1.5 text-base font-semibold text-fuchsia-700 hover:bg-fuchsia-50"
          >
            {t('itemWizardCreate')}
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="rounded-2xl bg-fuchsia-600 px-3 py-1.5 text-base font-semibold text-white hover:bg-fuchsia-500 disabled:opacity-60"
            disabled={!!shareLink}
          >
            {shareLink ? 'Public link active' : 'Share'}
          </button>
          {shareLink && (
            <button
              type="button"
              onClick={() => setShareLink('')}
              className="rounded-2xl border border-amber-300 px-3 py-1.5 text-base font-semibold text-amber-800 hover:bg-amber-50"
            >
              Make private
            </button>
          )}
        </div>
      </div>

      {shareLink && (
        <div className="rounded-2xl border border-fuchsia-100 bg-fuchsia-50 px-3 py-2 text-sm text-slate-700">
          Public link: <a href={shareLink} className="text-fuchsia-700 hover:underline">{shareLink}</a>
        </div>
      )}

      {itemWizardOpen && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-white/40">
          <div className="w-full max-w-lg rounded-2xl border border-fuchsia-100 bg-white p-6 text-base shadow-lg">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold">
                  {itemStep === 1 && t('itemWizardTitleStep1')}
                  {itemStep === 2 && t('itemWizardTitleStep2')}
                  {itemStep === 3 && t('itemWizardTitleStep3')}
                </h2>
                <p className="mt-1 text-slate-600">{t('itemWizardIntro')}</p>
              </div>
              <button
                type="button"
                onClick={() => !creating && setItemWizardOpen(false)}
                className="text-slate-300 hover:text-white"
                disabled={creating}
              >
                ✕
              </button>
            </div>

            {itemError && <p className="mb-3 text-xs text-red-600">{itemError}</p>}

            {itemStep === 1 && (
              <div className="space-y-3">
                <label className="block space-y-1">
                  <span className="text-xs font-medium">{t('itemWizardFieldNameLabel')}</span>
                  <input
                    className="mt-1 w-full rounded-xl border border-fuchsia-200 bg-white px-3 py-2 text-base"
                    value={itemTitle}
                    onChange={(e) => setItemTitle(e.target.value)}
                    placeholder={t('itemWizardFieldNamePlaceholder')}
                  />
                </label>
                <p className="text-xs text-slate-600">{t('itemWizardFieldNameHelp')}</p>
              </div>
            )}

            {itemStep === 2 && (
              <div className="space-y-3">
                <label className="block space-y-1">
                  <span className="text-xs font-medium">{t('itemWizardFieldLinkLabel')}</span>
                  <input
                    className="mt-1 w-full rounded-xl border border-fuchsia-200 bg-white px-3 py-2 text-base text-slate-900 placeholder:text-slate-400 outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500"
                    value={itemUrl}
                    onChange={(e) => setItemUrl(e.target.value)}
                    placeholder={t('itemWizardFieldLinkPlaceholder')}
                  />
                </label>
                <p className="text-xs text-slate-600">{t('itemWizardFieldLinkHelp')}</p>
              </div>
            )}

            {itemStep === 3 && (
              <div className="space-y-3">
                <label className="block space-y-1">
                  <span className="text-xs font-medium">{t('itemWizardFieldNoteLabel')}</span>
                  <textarea
                    className="mt-1 w-full rounded-xl border border-fuchsia-200 bg-white px-3 py-2 text-base"
                    rows={3}
                    value={itemNote}
                    onChange={(e) => setItemNote(e.target.value)}
                    placeholder={t('itemWizardFieldNotePlaceholder')}
                  />
                </label>
                <p className="text-xs text-slate-600">{t('itemWizardFieldNoteHelp')}</p>
              </div>
            )}

            <div className="mt-6 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  if (itemStep === 1) return;
                  setItemError(null);
                  setItemStep((s) => (s === 3 ? 2 : 1));
                }}
                disabled={itemStep === 1 || creating}
                className="rounded-xl border border-fuchsia-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-fuchsia-50 disabled:opacity-60"
              >
                {t('itemWizardBack')}
              </button>

              {itemStep < 3 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (itemStep === 1 && !itemTitle.trim()) {
                      setItemError('Please enter a name for this item.');
                      return;
                    }
                    setItemError(null);
                    setItemStep((s) => (s === 1 ? 2 : 3));
                  }}
                  disabled={creating}
                  className="rounded-xl bg-fuchsia-600 px-4 py-2 text-sm font-semibold text-white hover:bg-fuchsia-500 disabled:opacity-60"
                >
                  {t('itemWizardNext')}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleAddItemFromWizard}
                  disabled={creating}
                  className="rounded-xl bg-fuchsia-600 px-4 py-2 text-sm font-semibold text-white hover:bg-fuchsia-500 disabled:opacity-60"
                >
                  {creating ? t('itemWizardCreating') : t('itemWizardCreate')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleAddItem} className="space-y-2 max-w-md">
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-xl border border-fuchsia-200 bg-white px-3 py-2 text-base"
            placeholder={t('itemFormTitlePlaceholder')}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <input
          className="w-full rounded-xl border border-fuchsia-200 bg-white px-3 py-2 text-base"
          placeholder={t('itemFormUrlPlaceholder')}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <textarea
          className="w-full rounded-xl border border-fuchsia-200 bg-white px-3 py-2 text-base"
          placeholder={t('itemFormNotePlaceholder')}
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <button
          type="submit"
          disabled={creating}
          className="rounded-2xl bg-fuchsia-600 px-4 py-2.5 text-base font-semibold text-white hover:bg-fuchsia-500 disabled:opacity-60"
        >
          {creating ? t('itemFormAdding') : t('itemFormAdd')}
        </button>
      </form>

      <ul className="space-y-2 text-base">
        {wishlist.items?.map((item: any) => (
          <li key={item.id} className="rounded-2xl border border-fuchsia-100 bg-white px-3 py-3 space-y-1 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-medium">{item.title}</div>
                {item.link && (
                  <div className="text-xs">
                    <span className="text-slate-500">URL: </span>
                    <a href={item.link} target="_blank" rel="noreferrer" className="text-fuchsia-700 hover:underline">
                      {item.link}
                    </a>
                  </div>
                )}
                {item.description && (
                  <div className="text-xs text-slate-600">{item.description}</div>
                )}
                {item.is_received && (
                  <div className="text-xs text-emerald-600 mt-1">
                    {item.received_note || t('itemReceivedDefaultNote')}
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                <button
                  type="button"
                  onClick={() => (item.is_received ? handleMarkNotReceived(item) : handleStartReceived(item))}
                  className="rounded-xl border border-emerald-500 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-500/10"
                >
                  {item.is_received ? t('itemReceivedToggleNotReceived') : t('itemReceivedToggleReceived')}
                </button>
                {editingNoteItemId === item.id && !item.is_received && (
                  <div className="w-full min-w-[220px] rounded-2xl border border-fuchsia-200 bg-white px-2 py-2 text-xs text-slate-900">
                    <textarea
                      className="w-full rounded-xl border border-fuchsia-200 bg-white px-2 py-1 text-xs mb-1 text-slate-900 placeholder:text-slate-500 outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500"
                      rows={2}
                      placeholder={t('itemReceivedNotePlaceholder')}
                      value={noteDraft}
                      onChange={(e) => setNoteDraft(e.target.value)}
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        className="rounded px-2 py-1 text-xs text-slate-600 hover:text-slate-900"
                        onClick={() => {
                          setEditingNoteItemId(null);
                          setNoteDraft('');
                        }}
                      >
                        {t('itemReceivedCancel')}
                      </button>
                      <button
                        type="button"
                        className="rounded-xl bg-emerald-600 px-2 py-1 text-xs font-semibold text-white hover:bg-emerald-500"
                        onClick={() => handleConfirmReceived(item)}
                      >
                        {t('itemReceivedSave')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
