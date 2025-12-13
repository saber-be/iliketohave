"use client";

import { useEffect, useState } from 'react';
import { fetchProfile, upsertProfile } from '../../lib/wishlists';

export default function ProfilePage() {
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
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
          setUsername(profile.username ?? '');
          setFirstName(profile.first_name ?? '');
          setLastName(profile.last_name ?? '');
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
        username: username || null,
        first_name: firstName || null,
        last_name: lastName || null,
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
      {message && <p className="text-base text-slate-700">{message}</p>}
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <div>
          <label className="mb-1 block text-sm" htmlFor="username">
            Username
          </label>
          <input
            id="username"
            className="w-full rounded-xl border border-fuchsia-200 bg-white px-3 py-2 text-base text-slate-900 outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm" htmlFor="firstName">
              First name
            </label>
            <input
              id="firstName"
              className="w-full rounded-xl border border-fuchsia-200 bg-white px-3 py-2 text-base text-slate-900 outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm" htmlFor="lastName">
              Last name
            </label>
            <input
              id="lastName"
              className="w-full rounded-xl border border-fuchsia-200 bg-white px-3 py-2 text-base text-slate-900 outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm" htmlFor="birthday">
            Birthday
          </label>
          <input
            id="birthday"
            type="date"
            className="w-full rounded-xl border border-fuchsia-200 bg-white px-3 py-2 text-base text-slate-900 outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500"
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
            className="w-full rounded-xl border border-fuchsia-200 bg-white px-3 py-2 text-base text-slate-900 outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500"
            value={photoUrl}
            onChange={(e) => setPhotoUrl(e.target.value)}
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-2xl bg-fuchsia-600 px-4 py-2.5 text-base font-semibold text-white hover:bg-fuchsia-500 disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </form>
    </section>
  );
}
