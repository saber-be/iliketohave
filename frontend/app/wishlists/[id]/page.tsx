"use client";

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { addWishlistItem, fetchWishlist, updateWishlistItem, createShare } from '../../../lib/wishlists';

export default function WishlistDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [wishlist, setWishlist] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [note, setNote] = useState('');
  const [creating, setCreating] = useState(false);
  const [shareLink, setShareLink] = useState('');

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

  const handleToggleReceived = async (item: any) => {
    if (!id) return;
    const nextReceived = !item.is_received;
    let received_note = item.received_note ?? '';

    if (nextReceived) {
      const input = window.prompt('Add a note about this gift (optional):', received_note || '');
      if (input === null) {
        return; // user cancelled
      }
      received_note = input || '';
    }

    try {
      const updated = await updateWishlistItem(item.id, {
        title: item.title,
        description: item.description ?? undefined,
        link: item.link ?? undefined,
        priority: item.priority ?? undefined,
        is_received: nextReceived,
        received_note: received_note || undefined,
      });
      setWishlist((prev: any) => ({
        ...prev,
        items: (prev?.items ?? []).map((i: any) => (i.id === item.id ? updated : i)),
      }));
    } catch (err) {
      console.error(err);
    }
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
          {wishlist.description && <p className="text-sm text-slate-300">{wishlist.description}</p>}
        </div>
        <button
          type="button"
          onClick={handleShare}
          className="rounded bg-sky-600 px-3 py-1 text-sm font-semibold text-white hover:bg-sky-500"
        >
          Share
        </button>
      </div>

      {shareLink && (
        <div className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-200">
          Public link: <a href={shareLink} className="text-sky-400 hover:underline">{shareLink}</a>
        </div>
      )}

      <form onSubmit={handleAddItem} className="space-y-2 max-w-md">
        <div className="flex gap-2">
          <input
            className="flex-1 rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
            placeholder="Item title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <input
          className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          placeholder="URL (optional)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <textarea
          className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          placeholder="Note (optional)"
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <button
          type="submit"
          disabled={creating}
          className="rounded bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-60"
        >
          {creating ? 'Adding…' : 'Add item'}
        </button>
      </form>

      <ul className="space-y-2 text-sm">
        {wishlist.items?.map((item: any) => (
          <li key={item.id} className="rounded border border-slate-800 bg-slate-900 px-3 py-2 space-y-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-medium">{item.title}</div>
                {item.link && (
                  <div className="text-xs">
                    <span className="text-slate-400">URL: </span>
                    <a href={item.link} target="_blank" rel="noreferrer" className="text-sky-400 hover:underline">
                      {item.link}
                    </a>
                  </div>
                )}
                {item.description && (
                  <div className="text-xs text-slate-300">{item.description}</div>
                )}
                {item.is_received && (
                  <div className="text-xs text-emerald-400 mt-1">
                    {item.received_note || 'This item has been received as a gift.'}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleToggleReceived(item)}
                className="rounded border border-emerald-500 px-2 py-1 text-xs font-medium text-emerald-300 hover:bg-emerald-500/10"
              >
                {item.is_received ? 'Mark as not received' : 'Mark as received'}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
