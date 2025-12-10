'use client';

import { useState } from 'react';
import { Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { UserAvatar } from '@/components/common/user-avatar';
import { useAuthStore } from '@/stores/auth-store';

interface CommentFormProps {
  onSubmit: (text: string) => Promise<void>;
  onCancel?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  buttonText?: string;
}

export function CommentForm({
  onSubmit,
  onCancel,
  placeholder = 'Write a comment...',
  autoFocus = false,
  buttonText = 'Post',
}: CommentFormProps) {
  const { user } = useAuthStore();
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(text.trim());
      setText('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e);
    }
    if (e.key === 'Escape' && onCancel) {
      onCancel();
    }
  };

  if (!user) return null;

  return (
    <form onSubmit={handleSubmit} className="flex gap-3">
      <UserAvatar
        username={user.username}
        profilePicture={user.profile_picture}
        size="sm"
        showLink={false}
      />
      <div className="flex-1 space-y-2">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="min-h-[60px] resize-none text-sm"
          maxLength={2000}
        />
        <div className="flex items-center gap-2 justify-end">
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            size="sm"
            disabled={!text.trim() || isSubmitting}
            className="gap-1.5"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {buttonText}
          </Button>
        </div>
      </div>
    </form>
  );
}
