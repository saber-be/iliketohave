"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import type { PublicUserProfileResponse } from '../../../../shared/types/api';
import { fetchPublicUserProfile } from '../../../lib/wishlists';

export default function PublicUserPage() {
  const params = useParams<{ userId: string }>();
  const userId = params?.userId;
  const [data, setData] = useState<PublicUserProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        const res = await fetchPublicUserProfile(userId);
        setData(res);
      } catch (e) {
        console.error(e);
        setError('User not found');
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  if (loading) {
    return <p>Loading…</p>;
  }

  if (error || !data) {
    return <p>{error ?? 'User not found'}</p>;
  }

  const { profile, wishlists } = data;

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">{profile.name}</h1>
        {profile.photo_url && (
          <div className="mt-2">
            <img
              src={profile.photo_url}
              alt={profile.name}
              className="h-24 w-24 rounded-full object-cover border border-slate-700"
            />
          </div>
        )}
        {profile.birthday && (
          <p className="mt-2 text-sm text-slate-400">Birthday: {profile.birthday}</p>
        )}
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Public wishlists</h2>
        {wishlists.length === 0 ? (
          <p className="text-sm text-slate-400">This user has no public wishlists yet.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {wishlists.map((wl) => (
              <li
                key={wl.id}
                className="rounded border border-slate-800 bg-slate-900 px-3 py-2 space-y-1"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium text-slate-50">{wl.name}</div>
                    {wl.description && (
                      <div className="text-xs text-slate-300">{wl.description}</div>
                    )}
                  </div>
                  <Link
                    href={`/public/${wl.id}`}
                    className="text-xs text-sky-400 hover:underline"
                  >
                    View wishlist
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
