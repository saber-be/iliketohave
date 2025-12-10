"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createWishlist, fetchMyWishlists, createShare } from '../../lib/wishlists';

export default function DashboardPage() {
  const [wishlists, setWishlists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      const wl = await createWishlist({ name });
      setWishlists((prev) => [...prev, wl]);
      setName('');
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const handleShare = async (wishlistId: string) => {
    setSharingId(wishlistId);
    try {
      const res = await createShare(wishlistId, { is_claimable: true });
      const token = res.token ?? wishlistId;
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const url = `${origin}/public/${token}`;
      await navigator.clipboard.writeText(url);
      setCopiedId(wishlistId);
      setTimeout(() => {
        setCopiedId((current) => (current === wishlistId ? null : current));
      }, 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setSharingId(null);
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My wishlists</h1>
      </div>

      <form onSubmit={handleCreate} className="flex gap-2 max-w-md">
        <input
          className="flex-1 rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          placeholder="New wishlist name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button
          type="submit"
          disabled={creating}
          className="rounded bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-60"
        >
          {creating ? 'Creating…' : 'Create'}
        </button>
      </form>

      {loading ? (
        <p>Loading…</p>
      ) : wishlists.length === 0 ? (
        <p className="text-sm text-slate-300">No wishlists yet.</p>
      ) : (
        <ul className="space-y-2">
          {wishlists.map((wl) => (
            <li
              key={wl.id}
              className="rounded border border-slate-800 bg-slate-900 px-3 py-2 text-sm flex items-center justify-between gap-3"
            >
              <Link href={`/wishlists/${wl.id}`} className="font-medium text-sky-400 hover:underline">
                {wl.name}
              </Link>
              <button
                type="button"
                onClick={() => handleShare(wl.id)}
                disabled={sharingId === wl.id}
                className="rounded border border-sky-600 px-2 py-1 text-xs font-medium text-sky-200 hover:bg-sky-600/20 disabled:opacity-60"
              >
                {copiedId === wl.id ? 'Link copied' : sharingId === wl.id ? 'Sharing…' : 'Share link'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
