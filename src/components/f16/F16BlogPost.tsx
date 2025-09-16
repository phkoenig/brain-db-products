"use client";

import React, { useState } from 'react';
import { Avatar } from '@/ui/components/Avatar';
import { Button } from '@/ui/components/Button';
import { IconButton } from '@/ui/components/IconButton';
import { TextField } from '@/ui/components/TextField';
import { FeatherMoreHorizontal } from '@subframe/core';
import { FeatherFileText } from '@subframe/core';
import { F16BlogPost as F16BlogPostType, F16BlogComment } from '@/hooks/useF16Blog';

interface F16BlogPostProps {
  post: F16BlogPostType;
  onAddComment: (postId: string, comment: Omit<F16BlogComment, 'id' | 'post_id' | 'status' | 'created_at' | 'updated_at'>) => Promise<boolean>;
}

export function F16BlogPost({ post, onAddComment }: F16BlogPostProps) {
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    setIsSubmittingComment(true);
    const success = await onAddComment(post.id, {
      author_name: 'Gast',
      content: newComment.trim()
    });

    if (success) {
      setNewComment('');
    }
    setIsSubmittingComment(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return 'Heute';
    } else if (diffInHours < 48) {
      return 'Gestern';
    } else {
      return date.toLocaleDateString('de-DE');
    }
  };

  return (
    <div className="flex w-full flex-col items-start gap-4 rounded-lg bg-default-background px-6 py-6 shadow-sm">
      <div className="flex w-full items-start justify-between">
        <div className="flex items-center gap-2">
          <Avatar
            size="small"
            image="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
          >
            {post.author_name ? post.author_name.charAt(0).toUpperCase() : 'A'}
          </Avatar>
          <span className="text-body font-body text-subtext-color">
            {post.author_name || 'Anonym'}
          </span>
          <span className="text-body font-body text-subtext-color">
            •
          </span>
          <span className="text-body font-body text-subtext-color">
            {formatDate(post.published_at)}
          </span>
        </div>
        <IconButton
          icon={<FeatherMoreHorizontal />}
          onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
        />
      </div>
      
      <span className="text-heading-2 font-heading-2 text-default-font">
        {post.title}
      </span>
      
      {post.featured_image_url && (
        <img
          className="w-full flex-none rounded-md object-contain"
          src={post.featured_image_url}
          alt={post.title}
        />
      )}
      
      <span className="text-body font-body text-default-font">
        {post.content}
      </span>
      
      <div className="flex w-full flex-col items-start gap-4 rounded-md bg-neutral-50 px-4 py-4">
        <span className="text-body-bold font-body-bold text-default-font">
          Kommentare ({post.f16_blog_comments?.length || 0})
        </span>
        
        {/* Existing Comments */}
        {post.f16_blog_comments?.map((comment) => (
          <div key={comment.id} className="flex w-full items-start gap-3">
            <Avatar size="small">
              {comment.author_name.charAt(0).toUpperCase()}
            </Avatar>
            <div className="flex flex-col gap-1">
              <span className="text-body-bold font-body-bold text-default-font">
                {comment.author_name}
              </span>
              <span className="text-body font-body text-default-font">
                {comment.content}
              </span>
            </div>
          </div>
        ))}
        
        {/* New Comment Input */}
        <div className="flex w-full gap-2">
          <TextField
            className="flex-1"
            label=""
            helpText=""
            value={newComment}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => setNewComment(event.target.value)}
          >
            <TextField.Input
              placeholder="Schreibe einen Kommentar..."
            />
          </TextField>
          <Button
            onClick={handleAddComment}
            disabled={!newComment.trim() || isSubmittingComment}
            size="small"
          >
            {isSubmittingComment ? '...' : 'Senden'}
          </Button>
        </div>
      </div>
    </div>
  );
}
