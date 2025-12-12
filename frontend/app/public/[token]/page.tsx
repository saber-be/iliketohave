"use client";

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { fetchPublicWishlist, fetchPublicWishlistComments, createPublicItemComment, createPublicCommentReply } from '../../../lib/wishlists';
import { getToken } from '../../../lib/auth-storage';
import type { WishlistItemCommentResponse } from '../../../../shared/types/api';

export default function PublicWishlistPage() {
  const params = useParams<{ token: string }>();
  const token = params?.token;
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<WishlistItemCommentResponse[]>([]);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [activeReplyFor, setActiveReplyFor] = useState<string | null>(null);
  const [activeCommentItemId, setActiveCommentItemId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setIsAuthenticated(!!getToken());
  }, []);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const [wishlistRes, commentsRes] = await Promise.all([
          fetchPublicWishlist(token),
          fetchPublicWishlistComments(token),
        ]);
        setData(wishlistRes);
        setComments(commentsRes);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const groupedComments = new Map<string, { roots: WishlistItemCommentResponse[]; repliesByParent: Record<string, WishlistItemCommentResponse[]> }>();
  comments.forEach((c) => {
    const key = c.item_id;
    if (!groupedComments.has(key)) {
      groupedComments.set(key, { roots: [], repliesByParent: {} });
    }
    const entry = groupedComments.get(key)!;
    if (!c.parent_id) {
      entry.roots.push(c);
    } else {
      if (!entry.repliesByParent[c.parent_id]) {
        entry.repliesByParent[c.parent_id] = [];
      }
      entry.repliesByParent[c.parent_id].push(c);
    }
  });

  async function handleAddComment(itemId: string) {
    const content = commentInputs[itemId]?.trim();
    if (!content) return;
    try {
      const created = await createPublicItemComment(itemId, { content });
      setComments((prev) => [...prev, created]);
      setCommentInputs((prev) => ({ ...prev, [itemId]: '' }));
      setActiveCommentItemId(null);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleAddReply(parentId: string) {
    const content = replyInputs[parentId]?.trim();
    if (!content) return;
    try {
      const created = await createPublicCommentReply(parentId, { content });
      setComments((prev) => [...prev, created]);
      setReplyInputs((prev) => ({ ...prev, [parentId]: '' }));
      setActiveReplyFor(null);
    } catch (err) {
      console.error(err);
    }
  }

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
          const entry = groupedComments.get(item.id) ?? { roots: [], repliesByParent: {} };
          return (
          <li
            key={item.id}
            className={`rounded px-3 py-2 space-y-1 border ${
              isGifted
                ? 'border-emerald-700 bg-emerald-950/40 text-emerald-50'
                : 'border-slate-800 bg-slate-900 text-slate-100'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-medium text-slate-50">{item.title}</div>
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
              <div className="text-xs text-emerald-200 mt-1">
                {item.received_note || 'This item has been received as a gift.'}
              </div>
            )}
            <div className="mt-2 flex items-center justify-between gap-2">
              <div className="text-[11px] text-slate-400">
                {entry.roots.length > 0 ? `${entry.roots.length} comment${entry.roots.length > 1 ? 's' : ''}` : 'No comments yet'}
              </div>
              {isAuthenticated && (
                <button
                  type="button"
                  className="text-[11px] text-sky-400 hover:underline"
                  onClick={() => {
                    setActiveCommentItemId((prev) => (prev === item.id ? null : item.id));
                    setActiveReplyFor(null);
                  }}
                >
                  {activeCommentItemId === item.id ? 'Cancel' : 'Comment'}
                </button>
              )}
            </div>
            <div className="mt-2 space-y-2 border-t border-slate-800 pt-2">
              {entry.roots.map((c) => (
                <div key={c.id} className="text-xs space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-medium text-slate-100">Comment</div>
                      <div className="text-slate-200 whitespace-pre-line">{c.content}</div>
                    </div>
                    {isAuthenticated && (
                      <button
                        type="button"
                        className="text-[11px] text-sky-400 hover:underline"
                        onClick={() => {
                          setActiveReplyFor(c.id);
                          setActiveCommentItemId(null);
                        }}
                      >
                        Reply
                      </button>
                    )}
                  </div>
                  {(entry.repliesByParent[c.id] ?? []).map((r) => (
                    <div key={r.id} className="ml-4 border-l border-slate-700 pl-2 text-slate-200 whitespace-pre-line">
                      {r.content}
                    </div>
                  ))}
                  {isAuthenticated && activeReplyFor === c.id && (
                    <div className="mt-1 flex gap-2">
                      <input
                        className="flex-1 rounded bg-slate-900 border border-slate-700 px-2 py-1 text-[11px] text-slate-100 placeholder:text-slate-500"
                        placeholder="Write a reply..."
                        value={replyInputs[c.id] ?? ''}
                        onChange={(e) =>
                          setReplyInputs((prev) => ({
                            ...prev,
                            [c.id]: e.target.value,
                          }))
                        }
                      />
                      <button
                        type="button"
                        className="text-[11px] px-2 py-1 rounded bg-sky-600 text-white"
                        onClick={() => handleAddReply(c.id)}
                      >
                        Send
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {isAuthenticated && activeCommentItemId === item.id && (
                <div className="mt-2 flex gap-2">
                  <input
                    className="flex-1 rounded bg-slate-900 border border-slate-700 px-2 py-1 text-[11px] text-slate-100 placeholder:text-slate-500"
                    placeholder="Add a comment"
                    value={commentInputs[item.id] ?? ''}
                    onChange={(e) =>
                      setCommentInputs((prev) => ({
                        ...prev,
                        [item.id]: e.target.value,
                      }))
                    }
                  />
                  <button
                    type="button"
                    className="text-[11px] px-2 py-1 rounded bg-sky-600 text-white"
                    onClick={() => handleAddComment(item.id)}
                  >
                    Send
                  </button>
                </div>
              )}
            </div>
          </li>
        )})}
      </ul>
    </section>
  );
}
