'use client';

import { useEffect, useState } from 'react';
import { MessageSquare, Users, Hash, Send } from 'lucide-react';
import { useAuthStore } from '@/state/auth/authStore';
import {
  fetchPosts, createPost, fetchForums, fetchCommunityPosts,
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
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      fetchCommunityPosts({ page: 1, limit: 20 }, token),
      fetchForums(1, 20, token),
    ])
      .then(([postsRes, forumsRes]) => {
        setPosts((postsRes.data || []).map((p: any) => ({
          ...p,
          authorName: p.authorName || p.author?.firstName + ' ' + p.author?.lastName,
          subjectName: p.subject?.name || 'General',
        })));
        setForums(forumsRes.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async () => {
    if (!newTitle.trim() || !newContent.trim() || !token) return;
    setSubmitting(true);
    try {
      const res = await createPost({
        title: newTitle,
        content: newContent,
        forumId: selectedForum,
      }, token);
      setPosts(prev => [res.post, ...prev]);
      setNewTitle('');
      setNewContent('');
      setSelectedForum('');
      setShowNewPost(false);
    } catch (err) {
      console.error('Failed to post:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading community...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Community</h1>
          <p className="text-gray-500 mt-1">Discuss, ask questions, and learn with fellow students</p>
        </div>
        <button
          onClick={() => setShowNewPost(!showNewPost)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Send className="w-4 h-4" /> New Post
        </button>
      </div>

      {/* New post form */}
      {showNewPost && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h3 className="font-semibold text-gray-900">Create a Post</h3>
          <input
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="Post title..."
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
            <select
              value={selectedForum || ''}
              onChange={e => setSelectedForum(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a forum (optional)</option>
              {forums.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          <textarea
            value={newContent}
            onChange={e => setNewContent(e.target.value)}
            placeholder="What's on your mind? Ask a question, share notes, or discuss a topic..."
            rows={5}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <div className="flex gap-3">
            <button
              onClick={() => setShowNewPost(false)}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || !newTitle.trim() || !newContent.trim()}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </div>
      )}

      {/* Forums */}
      {forums.length > 0 && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {forums.map(forum => (
            <div
              key={forum.id}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-700 whitespace-nowrap hover:border-blue-300 cursor-pointer transition-colors"
            >
              <Hash className="w-3.5 h-3.5 text-gray-400" />
              {forum.name}
              <span className="text-xs text-gray-400">({forum.postCount || 0})</span>
            </div>
          ))}
        </div>
      )}

      {/* Posts */}
      {posts.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No posts yet</h3>
          <p className="text-gray-500 text-sm">Be the first to start a discussion!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-200 transition-colors cursor-pointer"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center text-blue-700 font-semibold text-sm flex-shrink-0">
                  {(post.authorName || 'U')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">{post.authorName || 'Anonymous'}</span>
                    {post.isPinned && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Pinned</span>}
                    <span className="text-xs text-gray-400">• {new Date(post.createdAt).toLocaleDateString()}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{post.title}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2">{post.content}</p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {post.replyCount || 0} replies</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {post.likeCount || 0} likes</span>
                    <span className="flex items-center gap-1"><Hash className="w-3 h-3" /> General</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
