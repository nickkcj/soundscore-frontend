'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { MessageCircle, Trash2, ChevronDown, ChevronUp, Heart, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/common/user-avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
        depth === 0 ? 'py-4' : 'pt-3',
        depth > 0 && 'ml-3 pl-3 border-l-2 border-border/40 md:ml-5 md:pl-4'
      )}
    >
      <div className="flex gap-3">
        <UserAvatar
          username={comment.username}
          profilePicture={comment.user_profile_picture}
          size="md"
        />
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 flex-wrap min-w-0">
              <Link
                href={`/profile/${comment.username}`}
                className="font-bold text-[15px] hover:underline truncate"
              >
                {comment.username}
              </Link>
              <span className="text-muted-foreground text-[15px] truncate">
                @{comment.username}
              </span>
              <span className="text-muted-foreground text-[15px]">·</span>
              <span className="text-muted-foreground text-[15px] hover:underline cursor-pointer">
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: false })}
              </span>
              {comment.id === -1 && (
                <span className="text-muted-foreground text-sm italic ml-1">Sending...</span>
              )}
            </div>
            {isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary -mr-2"
                    disabled={comment.id === -1}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem
                    onClick={() => onDelete(comment.id)}
                    className="text-destructive focus:text-destructive cursor-pointer"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Comment Text */}
          <p className="text-[15px] mt-0.5 text-foreground whitespace-pre-wrap break-words leading-relaxed">
            {comment.text}
          </p>

          {/* Actions - Twitter Style */}
          <div className="flex items-center gap-0 mt-2 -ml-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-3 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 gap-2"
              onClick={() => onReply(comment.id)}
              disabled={comment.id === -1}
            >
              <MessageCircle className="h-4 w-4" />
              {comment.replies.length > 0 && (
                <span className="text-[13px]">{comment.replies.length}</span>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 px-3 rounded-full gap-2 transition-colors",
                comment.is_liked
                  ? "text-wine-500 hover:text-wine-600 hover:bg-wine-500/10"
                  : "text-muted-foreground hover:text-wine-500 hover:bg-wine-500/10"
              )}
              onClick={() => onToggleLike(comment.id)}
              disabled={comment.id === -1}
            >
              <Heart className={cn("h-4 w-4", comment.is_liked && "fill-current")} />
              {comment.like_count > 0 && (
                <span className="text-[13px]">{comment.like_count}</span>
              )}
            </Button>
          </div>

          {/* Inline Reply Form */}
          {isReplying && (
            <div className="mt-3 pb-2">
              <CommentForm
                onSubmit={handleReply}
                onCancel={onCancelReply}
                placeholder={`Reply to @${comment.username}`}
                autoFocus
                buttonText="Reply"
              />
            </div>
          )}
        </div>
      </div>

      {/* Nested Replies */}
      {hasReplies && (
        <div className="mt-1">
          {isCollapsed ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-3 text-sm text-primary hover:text-primary hover:bg-primary/10 rounded-full ml-12"
              onClick={() => setIsCollapsed(false)}
            >
              <ChevronDown className="h-4 w-4 mr-1" />
              Show {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
            </Button>
          ) : (
            <>
              {depth > 2 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-3 text-sm text-muted-foreground hover:text-foreground rounded-full ml-12 mb-1"
                  onClick={() => setIsCollapsed(true)}
                >
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Hide replies
                </Button>
              )}
              <div>
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
