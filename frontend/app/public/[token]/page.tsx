"use client";

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { fetchPublicWishlist } from '../../../lib/wishlists';

export default function PublicWishlistPage() {
  const params = useParams<{ token: string }>();
  const token = params?.token;
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const res = await fetchPublicWishlist(token);
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  if (loading) {
    return <p>Loading…</p>;
  }

  if (!data || !data.wishlist) {
    return <p>Public wishlist not found.</p>;
  }

  const { wishlist, owner_name } = data;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{wishlist.name}</h1>
          {owner_name && (
            <p className="text-xs text-slate-400">Wishlist by {owner_name}</p>
          )}
          {wishlist.description && <p className="text-sm text-slate-300">{wishlist.description}</p>}
        </div>
      </div>

      <ul className="space-y-2 text-sm">
        {wishlist.items?.map((item: any) => {
          const isGifted = item.is_received;
          return (
          <li
            key={item.id}
            className={`rounded px-3 py-2 space-y-1 border ${
              isGifted
                ? 'border-emerald-700 bg-emerald-950/40'
                : 'border-slate-800 bg-slate-900'
            }`}
          >
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
              </div>
              {isGifted && (
                <div className="shrink-0 rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-300 border border-emerald-600">
                  Already gifted
                </div>
              )}
            </div>
            {isGifted && (
              <div className="text-xs text-emerald-300 mt-1">
                {item.received_note || 'This item has been received as a gift.'}
              </div>
            )}
          </li>
        )})}
      </ul>
    </section>
  );
}
