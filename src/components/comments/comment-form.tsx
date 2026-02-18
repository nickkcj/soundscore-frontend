'use client';

import { useState, useRef, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/common/user-avatar';
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/lib/utils';

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
  placeholder = 'Post your reply',
  autoFocus = false,
  buttonText = 'Reply',
}: CommentFormProps) {
  const { user } = useAuthStore();
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFocused, setIsFocused] = useState(autoFocus);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [text]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(text.trim());
      setText('');
      if (!onCancel) {
        setIsFocused(false);
      }
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
    <form onSubmit={handleSubmit} className={cn(
      "flex gap-3 py-3",
      !onCancel && "border-b border-border"
    )}>
      <UserAvatar
        username={user.username}
        profilePicture={user.profile_picture}
        size="md"
        showLink={false}
      />
      <div className="flex-1 min-w-0">
        <textarea
          id="comment-input"
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={cn(
            "w-full bg-transparent text-[17px] placeholder:text-muted-foreground/70",
            "resize-none outline-none border-none leading-relaxed",
            "min-h-[28px] max-h-[300px] overflow-hidden"
          )}
          maxLength={2000}
          rows={1}
        />

        {/* Actions Row */}
        {(isFocused || text.length > 0 || onCancel) && (
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
            <div className="flex items-center gap-2">
              {/* Character count */}
              {text.length > 1800 && (
                <span className={cn(
                  "text-xs",
                  text.length > 1950 ? "text-destructive" : "text-muted-foreground"
                )}>
                  {2000 - text.length}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {onCancel && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onCancel}
                  disabled={isSubmitting}
                  className="rounded-full px-4"
                >
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                size="sm"
                disabled={!text.trim() || isSubmitting}
                className="rounded-full px-4 font-bold"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  buttonText
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </form>
  );
}
