'use client';

import { useEffect, useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useComments } from '@/hooks/use-reviews';
import { useAuthStore } from '@/stores/auth-store';
import { CommentForm } from './comment-form';
import { CommentItem } from './comment-item';
import { CommentListSkeleton } from './comment-skeleton';

interface CommentThreadProps {
  reviewUuid: string;
  onCommentCountChange?: (delta: number) => void;
}

export function CommentThread({ reviewUuid, onCommentCountChange }: CommentThreadProps) {
  const { user } = useAuthStore();
  const { comments, isLoading, hasMore, fetchComments, addComment, deleteComment, toggleCommentLike } =
    useComments(reviewUuid);
  const [activeReplyId, setActiveReplyId] = useState<number | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    fetchComments(true).then(() => setIsInitialLoad(false));
  }, [fetchComments]);

  const handleAddComment = useCallback(
    async (text: string) => {
      if (!user) return;

      const result = await addComment(
        { text },
        {
          user_id: user.id,
          username: user.username,
          user_profile_picture: user.profile_picture,
        }
      );

      if (result) {
        onCommentCountChange?.(1);
      }
    },
    [user, addComment, onCommentCountChange]
  );

  const handleAddReply = useCallback(
    async (text: string, parentId: number) => {
      if (!user) return;

      const result = await addComment(
        { text, parent_id: parentId },
        {
          user_id: user.id,
          username: user.username,
          user_profile_picture: user.profile_picture,
        }
      );

      if (result) {
        setActiveReplyId(null);
        onCommentCountChange?.(1);
      }
    },
    [user, addComment, onCommentCountChange]
  );

  const handleDelete = useCallback(
    async (commentId: number) => {
      const success = await deleteComment(commentId);
      if (success) {
        onCommentCountChange?.(-1);
      }
    },
    [deleteComment, onCommentCountChange]
  );

  const handleReply = useCallback((commentId: number) => {
    setActiveReplyId(commentId);
  }, []);

  const handleCancelReply = useCallback(() => {
    setActiveReplyId(null);
  }, []);

  const handleLoadMore = useCallback(() => {
    fetchComments(false);
  }, [fetchComments]);

  if (isInitialLoad) {
    return (
      <div className="space-y-0">
        <CommentForm onSubmit={handleAddComment} placeholder="Post your reply" />
        <CommentListSkeleton count={3} />
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {/* New Comment Form */}
      <CommentForm onSubmit={handleAddComment} placeholder="Post your reply" />

      {/* Comments List */}
      {comments.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-muted-foreground text-[15px]">
            No comments yet
          </p>
          <p className="text-muted-foreground/70 text-sm mt-1">
            Be the first to share your thoughts!
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              activeReplyId={activeReplyId}
              onReply={handleReply}
              onCancelReply={handleCancelReply}
              onAddReply={handleAddReply}
              onDelete={handleDelete}
              onToggleLike={toggleCommentLike}
              currentUserId={user?.id}
            />
          ))}
        </div>
      )}

      {/* Load More */}
      {hasMore && (
        <div className="pt-4 flex justify-center border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLoadMore}
            disabled={isLoading}
            className="text-primary hover:text-primary hover:bg-primary/10 rounded-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              'Show more replies'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
