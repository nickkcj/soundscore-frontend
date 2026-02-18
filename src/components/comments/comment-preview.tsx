'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { MessageCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { UserAvatar } from '@/components/common/user-avatar';
import { Skeleton } from '@/components/ui/skeleton';
import type { Comment, CommentListResponse } from '@/types';

interface CommentPreviewProps {
  reviewUuid: string;
  commentCount: number;
}

export function CommentPreview({ reviewUuid, commentCount }: CommentPreviewProps) {
  const [previewComments, setPreviewComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPreview = async () => {
      try {
        const response = await api.get<CommentListResponse>(
          `/reviews/${reviewUuid}/comments?page=1&per_page=3`
        );
        setPreviewComments(response.comments.slice(0, 3));
      } catch {
        // Fail silently for preview
      } finally {
        setIsLoading(false);
      }
    };

    if (commentCount > 0) {
      fetchPreview();
    } else {
      setIsLoading(false);
    }
  }, [reviewUuid, commentCount]);

  if (commentCount === 0) return null;

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="flex gap-2">
            <Skeleton className="h-6 w-6 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Preview Comments */}
      {previewComments.map((comment) => (
        <div key={comment.id} className="flex gap-2">
          <UserAvatar
            username={comment.username}
            profilePicture={comment.user_profile_picture}
            size="sm"
            className="h-6 w-6"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <Link
                href={`/profile/${comment.username}`}
                className="font-medium text-xs hover:underline"
              >
                {comment.username}
              </Link>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
              </span>
            </div>
            <p className="text-sm text-foreground/90 line-clamp-2">{comment.text}</p>
          </div>
        </div>
      ))}

      {/* View More Link - only show when there are more comments than previewed */}
      {commentCount > 3 && (
        <Link
          href={`/reviews/${reviewUuid}`}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          View {commentCount - 3} more {commentCount - 3 === 1 ? 'comment' : 'comments'}
        </Link>
      )}
    </div>
  );
}
