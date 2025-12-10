'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Reply, Trash2, ChevronDown, ChevronUp, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/common/user-avatar';
import { CommentForm } from './comment-form';
import { cn } from '@/lib/utils';
import type { Comment } from '@/types';

interface CommentItemProps {
  comment: Comment;
  depth?: number;
  activeReplyId: number | null;
  onReply: (commentId: number) => void;
  onCancelReply: () => void;
  onAddReply: (text: string, parentId: number) => Promise<void>;
  onDelete: (commentId: number) => void;
  onToggleLike: (commentId: number) => void;
  currentUserId?: number;
}

export function CommentItem({
  comment,
  depth = 0,
  activeReplyId,
  onReply,
  onCancelReply,
  onAddReply,
  onDelete,
  onToggleLike,
  currentUserId,
}: CommentItemProps) {
  const [isCollapsed, setIsCollapsed] = useState(depth > 2 && comment.replies.length > 0);
  const isOwner = currentUserId === comment.user_id;
  const hasReplies = comment.replies.length > 0;
  const isReplying = activeReplyId === comment.id;

  const handleReply = async (text: string) => {
    await onAddReply(text, comment.id);
  };

  return (
    <div
      className={cn(
        'relative',
        depth > 0 && 'ml-3 pl-3 border-l-2 border-border/50 md:ml-4 md:pl-4'
      )}
    >
      <div className="flex gap-3">
        <UserAvatar
          username={comment.username}
          profilePicture={comment.user_profile_picture}
          size="sm"
        />
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/profile/${comment.username}`}
              className="font-medium text-sm hover:underline"
            >
              {comment.username}
            </Link>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
            </span>
            {comment.id === -1 && (
              <span className="text-xs text-muted-foreground italic">Sending...</span>
            )}
          </div>

          {/* Comment Text */}
          <p className="text-sm mt-1 text-foreground/90 whitespace-pre-wrap break-words">
            {comment.text}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-1 mt-1.5">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-7 px-2 text-xs",
                comment.is_liked
                  ? "text-pink-500 hover:text-pink-600"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => onToggleLike(comment.id)}
              disabled={comment.id === -1}
            >
              <Heart className={cn("h-3.5 w-3.5 mr-1", comment.is_liked && "fill-current")} />
              {comment.like_count > 0 ? comment.like_count : ''}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => onReply(comment.id)}
              disabled={comment.id === -1}
            >
              <Reply className="h-3.5 w-3.5 mr-1" />
              Reply
            </Button>
            {isOwner && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                onClick={() => onDelete(comment.id)}
                disabled={comment.id === -1}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Delete
              </Button>
            )}
          </div>

          {/* Inline Reply Form */}
          {isReplying && (
            <div className="mt-3">
              <CommentForm
                onSubmit={handleReply}
                onCancel={onCancelReply}
                placeholder={`Reply to ${comment.username}...`}
                autoFocus
                buttonText="Reply"
              />
            </div>
          )}
        </div>
      </div>

      {/* Nested Replies */}
      {hasReplies && (
        <div className="mt-3">
          {isCollapsed ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-primary ml-11"
              onClick={() => setIsCollapsed(false)}
            >
              <ChevronDown className="h-3.5 w-3.5 mr-1" />
              Show {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
            </Button>
          ) : (
            <>
              {depth > 2 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-muted-foreground ml-11 mb-2"
                  onClick={() => setIsCollapsed(true)}
                >
                  <ChevronUp className="h-3.5 w-3.5 mr-1" />
                  Hide replies
                </Button>
              )}
              <div className="space-y-3">
                {comment.replies.map((reply) => (
                  <CommentItem
                    key={reply.id}
                    comment={reply}
                    depth={depth + 1}
                    activeReplyId={activeReplyId}
                    onReply={onReply}
                    onCancelReply={onCancelReply}
                    onAddReply={onAddReply}
                    onDelete={onDelete}
                    onToggleLike={onToggleLike}
                    currentUserId={currentUserId}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
