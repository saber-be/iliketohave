"use client";

import { useEffect, useState } from 'react';
import { fetchProfile, upsertProfile } from '../../lib/wishlists';

export default function ProfilePage() {
  const [name, setName] = useState('');
  const [birthday, setBirthday] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const profile = await fetchProfile();
        if (profile) {
          setName(profile.name);
          setBirthday(profile.birthday ?? '');
          setPhotoUrl(profile.photo_url ?? '');
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await upsertProfile({
        name,
        birthday: birthday || null,
        photo_url: photoUrl || null,
      });
      setMessage('Profile saved');
    } catch (err) {
      console.error(err);
      setMessage('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p>Loading profile…</p>;
  }

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Profile</h1>
      {message && <p className="text-sm text-slate-600">{message}</p>}
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <div>
          <label className="mb-1 block text-sm" htmlFor="name">
            Name
          </label>
          <input
            id="name"
            className="w-full rounded border border-sky-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm" htmlFor="birthday">
            Birthday
          </label>
          <input
            id="birthday"
            type="date"
            className="w-full rounded border border-sky-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm" htmlFor="photo">
            Photo URL
          </label>
          <input
            id="photo"
            className="w-full rounded border border-sky-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            value={photoUrl}
            onChange={(e) => setPhotoUrl(e.target.value)}
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="rounded bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </form>
    </section>
  );
}
