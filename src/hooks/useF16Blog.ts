"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface F16BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  slug: string;
  status: string;
  featured_image_url: string;
  project_id: string;
  tags: string[];
  published_at: string;
  created_at: string;
  updated_at: string;
  author_id?: string;
  author_name?: string;
  author_email?: string;
  f16_blog_comments?: F16BlogComment[];
}

export interface F16BlogComment {
  id: string;
  post_id: string;
  author_name: string;
  author_email?: string;
  author_avatar_url?: string;
  content: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export function useF16Blog() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<F16BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchPosts = async (search = '') => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      params.append('limit', '20');
      
      const response = await fetch(`/api/zepta/f16/blog/posts?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }
      
      const data = await response.json();
      setPosts(data.posts || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const addComment = async (postId: string, comment: Omit<F16BlogComment, 'id' | 'post_id' | 'status' | 'created_at' | 'updated_at'>) => {
    try {
      // Hole Autoren-Info aus der auth_allowlist
      let authorName = comment.author_name || 'Anonym';
      if (user?.email) {
        try {
          const allowlistResponse = await fetch(`/api/auth/allowlist/user?email=${encodeURIComponent(user.email)}`);
          if (allowlistResponse.ok) {
            const allowlistData = await allowlistResponse.json();
            authorName = allowlistData.name || user.email.split('@')[0];
          } else {
            authorName = user.email.split('@')[0];
          }
        } catch (err) {
          authorName = user.email.split('@')[0];
        }
      }

      const response = await fetch('/api/zepta/f16/blog/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          post_id: postId,
          ...comment,
          author_name: authorName,
          author_email: user?.email || comment.author_email || null
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add comment');
      }

      // Add comment to local state instead of refreshing all posts
      const newComment = {
        id: `temp-${Date.now()}`, // Temporary ID
        post_id: postId,
        author_name: authorName,
        author_email: user?.email || comment.author_email || null,
        author_avatar_url: null,
        content: comment.content,
        status: 'approved',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Update local state
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? { 
                ...post, 
                f16_blog_comments: [...(post.f16_blog_comments || []), newComment]
              }
            : post
        )
      );
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add comment');
      return false;
    }
  };

  const createPost = async (post: {
    title: string;
    content: string;
    excerpt: string;
    featured_image_url: string;
    tags: string[];
  }) => {
    try {
      // Hole Autoren-Info aus der auth_allowlist
      let authorName = 'Anonym';
      if (user?.email) {
        try {
          const allowlistResponse = await fetch(`/api/auth/allowlist/user?email=${encodeURIComponent(user.email)}`);
          if (allowlistResponse.ok) {
            const allowlistData = await allowlistResponse.json();
            authorName = allowlistData.name || user.email.split('@')[0];
          } else {
            authorName = user.email.split('@')[0];
          }
        } catch (err) {
          authorName = user.email.split('@')[0];
        }
      }

      const response = await fetch('/api/zepta/f16/blog/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...post,
          author_id: user?.id || null,
          author_name: authorName,
          author_email: user?.email || null
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create post');
      }

      // Refresh posts to show the new post
      await fetchPosts(searchQuery);
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create post');
      return false;
    }
  };

  const searchPosts = (query: string) => {
    setSearchQuery(query);
    fetchPosts(query);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  return {
    posts,
    loading,
    error,
    searchQuery,
    user,
    fetchPosts,
    addComment,
    createPost,
    searchPosts
  };
}
