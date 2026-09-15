'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Hash, MessageSquare, Send, Users } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import { useAuthStore } from '@/state/auth/authStore';

type Forum = { id: string; name: string; post_count?: number };
type Post = {
  id: string;
  user_id: string;
  forum_id?: string | null;
  title: string;
  content: string;
  is_pinned?: boolean;
  like_count?: number;
  likes_count?: number;
  replies_count?: number;
  created_at: string;
};

export default function CommunityPage() {
  const { token } = useAuthStore();
  const [posts, setPosts] = useState<Post[]>([]);
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

  const load = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const [postRes, forumRes] = await Promise.all([
        getSupabase()
          .from('community_posts')
          .select('id,user_id,forum_id,title,content,is_pinned,like_count,likes_count,replies_count,created_at')
          .eq('status', 'published')
          .order('created_at', { ascending: false })
          .limit(50),
        getSupabase().from('forums').select('id,name,post_count').eq('is_public', true).order('name').limit(50),
      ]);
      if (postRes.error) throw postRes.error;
      if (forumRes.error) throw forumRes.error;
      setPosts(postRes.data || []);
      setForums(forumRes.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load community');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [token]);

  const handleSubmit = async () => {
    if (!newTitle.trim() || !newContent.trim() || !selectedForum || !token || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const user = (await getSupabase().auth.getUser()).data.user;
      if (!user) throw new Error('You must be signed in');
      const { data, error } = await getSupabase()
        .from('community_posts')
        .insert({
          user_id: user.id,
          forum_id: selectedForum,
          type: 'discussion',
          title: newTitle.trim(),
          content: newContent.trim(),
          status: 'published',
          tags: [],
        })
        .select('id,user_id,forum_id,title,content,is_pinned,like_count,likes_count,replies_count,created_at')
        .single();
      if (error) throw error;
      setPosts(prev => [data, ...prev]);
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

  const forumNames = useMemo(() => new Map(forums.map(forum => [forum.id, forum.name])), [forums]);
  const visiblePosts = useMemo(
    () => (activeForum === 'all' ? posts : posts.filter(post => post.forum_id === activeForum)),
    [posts, activeForum]
  );

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" /></div>;
  }

  return <div className="space-y-6">
    <div className="flex items-center justify-between gap-4">
      <div><h1 className="text-2xl font-bold text-gray-900">Community</h1><p className="mt-1 text-gray-500">Discuss, ask questions, and learn with fellow students</p></div>
      <button onClick={() => setShowNewPost(value => !value)} className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white"><Send className="h-4 w-4" />New Post</button>
    </div>

    {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

    {showNewPost && <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6">
      <h3 className="font-semibold">Create a Post</h3>
      <input value={newTitle} onChange={event => setNewTitle(event.target.value)} placeholder="Post title..." className="w-full rounded-xl border px-4 py-2.5" />
      <select value={selectedForum} onChange={event => setSelectedForum(event.target.value)} className="w-full rounded-xl border px-4 py-2.5">
        <option value="">Select a forum</option>
        {forums.map(forum => <option key={forum.id} value={forum.id}>{forum.name}</option>)}
      </select>
      <textarea value={newContent} onChange={event => setNewContent(event.target.value)} rows={5} placeholder="What's on your mind?" className="w-full rounded-xl border px-4 py-2.5" />
      <div className="flex gap-3">
        <button onClick={() => setShowNewPost(false)} className="rounded-xl border px-4 py-2 text-sm">Cancel</button>
        <button onClick={() => void handleSubmit()} disabled={submitting || !newTitle.trim() || !newContent.trim() || !selectedForum} className="rounded-xl bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50">{submitting ? 'Posting...' : 'Post'}</button>
      </div>
    </div>}

    <div className="flex gap-3 overflow-x-auto pb-2">
      <button onClick={() => setActiveForum('all')} className={`rounded-full border px-4 py-2 text-sm ${activeForum === 'all' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white'}`}><Hash className="mr-1 inline h-3.5 w-3.5" />All</button>
      {forums.map(forum => <button key={forum.id} onClick={() => setActiveForum(forum.id)} className={`rounded-full border px-4 py-2 text-sm ${activeForum === forum.id ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white'}`}><Hash className="mr-1 inline h-3.5 w-3.5" />{forum.name} <span className="text-xs text-gray-400">({forum.post_count || 0})</span></button>)}
    </div>

    {visiblePosts.length === 0 ? <div className="rounded-xl border bg-white p-12 text-center"><MessageSquare className="mx-auto mb-4 h-12 w-12 text-gray-300" /><h3 className="font-medium">No posts yet</h3><p className="text-sm text-gray-500">Be the first to start a discussion.</p></div> : <div className="space-y-3">
      {visiblePosts.map(post => {
        const expanded = expandedPost === post.id;
        return <button type="button" key={post.id} onClick={() => setExpandedPost(expanded ? null : post.id)} className="w-full rounded-xl border border-gray-200 bg-white p-5 text-left transition-colors hover:border-blue-200">
          <div className="flex items-center gap-2 text-xs text-gray-400"><span>Community member</span>{post.is_pinned && <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-yellow-700">Pinned</span>}<span>• {new Date(post.created_at).toLocaleDateString()}</span></div>
          <div className="mt-2 flex items-start justify-between gap-3"><h3 className="font-semibold text-gray-900">{post.title}</h3>{expanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}</div>
          <p className={`mt-1 text-sm text-gray-600 ${expanded ? 'whitespace-pre-wrap' : 'line-clamp-2'}`}>{post.content}</p>
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-400"><span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />{post.replies_count || 0} replies</span><span className="flex items-center gap-1"><Users className="h-3 w-3" />{post.like_count || post.likes_count || 0} likes</span><span className="flex items-center gap-1"><Hash className="h-3 w-3" />{post.forum_id ? forumNames.get(post.forum_id) || 'Forum' : 'General'}</span></div>
        </button>;
      })}
    </div>}
  </div>;
}
