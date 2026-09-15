'use client';

import { useEffect, useMemo, useState } from 'react';
import { MessageSquare, Users, Hash, Send, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuthStore } from '@/state/auth/authStore';
import {
  createPost, fetchForums, fetchCommunityPosts,
  type Post as CommunityPost, type Forum,
} from '@/services/api/communityService';

export default function CommunityPage() {
  const { token } = useAuthStore();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [forums, setForums] = useState<Forum[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewPost, setShowNewPost] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [selectedForum, setSelectedForum] = useState('');
  const [activeForum, setActiveForum] = useState('all');
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    Promise.all([
      fetchCommunityPosts({ page: 1, limit: 50 }, token),
      fetchForums(1, 50, token),
    ])
      .then(([postsRes, forumsRes]) => {
        setPosts((postsRes.data || []).map((p: any) => ({
          ...p,
          authorName: p.authorName || [p.author?.firstName, p.author?.lastName].filter(Boolean).join(' ') || 'Anonymous',
        })));
        setForums(forumsRes.data || []);
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Unable to load community'))
      .finally(() => setLoading(false));
  }, [token]);

  const forumNames = useMemo(() => new Map(forums.map(f => [f.id, f.name])), [forums]);
  const visiblePosts = activeForum === 'all' ? posts : posts.filter(post => post.forumId === activeForum);

  const handleSubmit = async () => {
    if (!newTitle.trim() || !newContent.trim() || !selectedForum || !token || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await createPost({ title: newTitle.trim(), content: newContent.trim(), forumId: selectedForum }, token);
      setPosts(prev => [res.post, ...prev]);
      setNewTitle('');
      setNewContent('');
      setSelectedForum('');
      setShowNewPost(false);
      setActiveForum('all');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create post');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><div className="text-center"><div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"/><p className="text-gray-500">Loading community...</p></div></div>;

  return <div className="space-y-6">
    <div className="flex items-center justify-between gap-4"><div><h1 className="text-2xl font-bold text-gray-900">Community</h1><p className="mt-1 text-gray-500">Discuss, ask questions, and learn with fellow students</p></div><button onClick={()=>setShowNewPost(v=>!v)} className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"><Send className="h-4 w-4"/>New Post</button></div>
    {error&&<div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

    {showNewPost&&<div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6"><h3 className="font-semibold text-gray-900">Create a Post</h3><input value={newTitle} onChange={e=>setNewTitle(e.target.value)} placeholder="Post title..." className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"/><select value={selectedForum} onChange={e=>setSelectedForum(e.target.value)} className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"><option value="">Select a forum</option>{forums.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select><textarea value={newContent} onChange={e=>setNewContent(e.target.value)} placeholder="What's on your mind? Ask a question, share notes, or discuss a topic..." rows={5} className="w-full resize-none rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"/><div className="flex gap-3"><button onClick={()=>setShowNewPost(false)} className="rounded-xl border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel</button><button onClick={()=>void handleSubmit()} disabled={submitting||!newTitle.trim()||!newContent.trim()||!selectedForum} className="rounded-xl bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50">{submitting?'Posting...':'Post'}</button></div></div>}

    {forums.length>0&&<div className="flex gap-3 overflow-x-auto pb-2"><button onClick={()=>setActiveForum('all')} className={`flex items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-sm transition-colors ${activeForum==='all'?'border-blue-600 bg-blue-50 text-blue-700':'border-gray-200 bg-white text-gray-700 hover:border-blue-300'}`}><Hash className="h-3.5 w-3.5"/>All</button>{forums.map(forum=><button key={forum.id} onClick={()=>setActiveForum(forum.id)} className={`flex items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-sm transition-colors ${activeForum===forum.id?'border-blue-600 bg-blue-50 text-blue-700':'border-gray-200 bg-white text-gray-700 hover:border-blue-300'}`}><Hash className="h-3.5 w-3.5"/>{forum.name}<span className="text-xs opacity-60">({forum.postCount||0})</span></button>)}</div>}

    {visiblePosts.length===0?<div className="rounded-xl border border-gray-200 bg-white p-12 text-center"><MessageSquare className="mx-auto mb-4 h-12 w-12 text-gray-300"/><h3 className="mb-1 text-lg font-medium text-gray-900">No posts yet</h3><p className="text-sm text-gray-500">Be the first to start a discussion in this forum.</p></div>:<div className="space-y-3">{visiblePosts.map(post=>{const expanded=expandedPost===post.id; return <button type="button" key={post.id} onClick={()=>setExpandedPost(expanded?null:post.id)} className="w-full rounded-xl border border-gray-200 bg-white p-5 text-left transition-colors hover:border-blue-200"><div className="flex items-start gap-3"><div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-indigo-200 text-sm font-semibold text-blue-700">{(post.authorName||'U')[0].toUpperCase()}</div><div className="min-w-0 flex-1"><div className="mb-1 flex items-center gap-2"><span className="text-sm font-medium text-gray-900">{post.authorName||'Anonymous'}</span>{post.isPinned&&<span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-700">Pinned</span>}<span className="text-xs text-gray-400">• {new Date(post.createdAt).toLocaleDateString()}</span></div><div className="flex items-start justify-between gap-3"><h3 className="mb-1 font-semibold text-gray-900">{post.title}</h3>{expanded?<ChevronUp className="h-4 w-4 text-gray-400"/>:<ChevronDown className="h-4 w-4 text-gray-400"/>}</div><p className={`text-sm text-gray-500 ${expanded?'whitespace-pre-wrap':'line-clamp-2'}`}>{post.content}</p><div className="mt-3 flex items-center gap-4 text-xs text-gray-400"><span className="flex items-center gap-1"><MessageSquare className="h-3 w-3"/>{post.replyCount||0} replies</span><span className="flex items-center gap-1"><Users className="h-3 w-3"/>{post.likeCount||0} likes</span><span className="flex items-center gap-1"><Hash className="h-3 w-3"/>{forumNames.get(post.forumId)||'General'}</span></div></div></div></button>;})}</div>}
  </div>;
}
