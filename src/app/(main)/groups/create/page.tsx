'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Users, Lock, Globe, Check, ImagePlus, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useRequireAuth } from '@/hooks/use-auth';
import { api } from '@/lib/api';
import type { Group, GroupCreate } from '@/types';

const CATEGORIES = [
  { value: 'rock', label: 'Rock' },
  { value: 'pop', label: 'Pop' },
  { value: 'hip-hop', label: 'Hip-Hop' },
  { value: 'indie', label: 'Indie' },
  { value: 'electronic', label: 'Electronic' },
  { value: 'classical', label: 'Classical' },
  { value: 'jazz', label: 'Jazz' },
  { value: 'metal', label: 'Metal' },
  { value: 'r&b', label: 'R&B' },
  { value: 'country', label: 'Country' },
  { value: 'other', label: 'Other' },
];

export default function CreateGroupPage() {
  const router = useRouter();
  const { isLoading: authLoading } = useRequireAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  const [formData, setFormData] = useState<GroupCreate>({
    name: '',
    description: '',
    privacy: 'public',
    category: '',
  });

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    setCoverImage(file);
    setCoverPreview(URL.createObjectURL(file));
    setError(null);
  };

  const removeCover = () => {
    setCoverImage(null);
    if (coverPreview) {
      URL.revokeObjectURL(coverPreview);
      setCoverPreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('Group name is required');
      return;
    }

    setIsSubmitting(true);

    try {
      // First, create the group
      const payload: GroupCreate = {
        name: formData.name.trim(),
        privacy: formData.privacy,
      };

      if (formData.description?.trim()) {
        payload.description = formData.description.trim();
      }

      if (formData.category) {
        payload.category = formData.category;
      }

      const group = await api.post<Group>('/groups', payload);

      // Navigate immediately after group creation for instant feedback
      toast.success('Group created!');
      router.push(`/groups/${group.uuid}`);

      // Upload cover image in background (fire and forget)
      if (coverImage && group.uuid) {
        const formDataUpload = new FormData();
        formDataUpload.append('file', coverImage);
        api.postForm<Group>(`/groups/${group.uuid}/cover`, formDataUpload).catch((uploadErr) => {
          // Group was created, but image upload failed - show a toast
          console.error('Failed to upload cover image:', uploadErr);
          toast.error('Cover image upload failed. You can add it later in group settings.');
        });
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to create group. Please try again.');
      }
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-4 md:py-8">
        <Card>
          <CardContent className="py-8 md:py-12">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted rounded w-1/3" />
              <div className="h-4 bg-muted rounded w-2/3" />
              <div className="h-10 bg-muted rounded" />
              <div className="h-24 bg-muted rounded" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-4 md:py-8">
      <Button
        variant="ghost"
        className="mb-3 h-11 gap-2 px-2 md:mb-6"
        onClick={() => router.back()}
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <Card>
        <CardHeader className="gap-1 p-4 md:p-6">
          <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
            <Users className="h-5 w-5" />
            Create a New Group
          </CardTitle>
          <CardDescription>
            Create a community for music lovers to discuss and share
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {error}
              </div>
            )}

            {/* Cover Image Upload */}
            <div className="space-y-2">
              <Label>Cover Image</Label>
              <div
                className={cn(
                  'relative h-32 overflow-hidden rounded-lg border-2 border-dashed transition-colors md:h-40',
                  coverPreview ? 'border-transparent' : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                )}
              >
                {coverPreview ? (
                  <>
                    <Image
                      src={coverPreview}
                      alt="Cover preview"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/35 opacity-100 transition-opacity md:opacity-0 md:hover:opacity-100">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isSubmitting}
                        className="h-11 md:h-9"
                      >
                        Change
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={removeCover}
                        disabled={isSubmitting}
                        className="h-11 w-11 md:h-9 md:w-9"
                        aria-label="Remove cover image"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSubmitting}
                    className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 px-4 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <ImagePlus className="h-8 w-8" />
                    <span className="text-sm">Click to add a cover image</span>
                    <span className="text-center text-xs">JPG, PNG, WebP or GIF (max 5MB)</span>
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleCoverSelect}
                className="hidden"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Group Name *</Label>
              <Input
                id="name"
                placeholder="Enter group name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                maxLength={100}
                disabled={isSubmitting}
                className="h-11"
              />
              <p className="text-xs text-muted-foreground">
                {formData.name.length}/100 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="What's this group about?"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                maxLength={1000}
                rows={3}
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">
                {formData.description?.length || 0}/1000 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, category: value }))
                }
                disabled={isSubmitting}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Privacy</Label>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, privacy: 'public' }))}
                  disabled={isSubmitting}
                  className={cn(
                    'flex min-h-14 w-full cursor-pointer items-start space-x-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50',
                    formData.privacy === 'public' && 'border-primary bg-primary/5'
                  )}
                >
                  <div className={cn(
                    'mt-1 h-4 w-4 rounded-full border flex items-center justify-center',
                    formData.privacy === 'public' ? 'border-primary bg-primary' : 'border-muted-foreground'
                  )}>
                    {formData.privacy === 'public' && <Check className="h-3 w-3 text-primary-foreground" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Public</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Anyone can find and join this group
                    </p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, privacy: 'private' }))}
                  disabled={isSubmitting}
                  className={cn(
                    'flex min-h-14 w-full cursor-pointer items-start space-x-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50',
                    formData.privacy === 'private' && 'border-primary bg-primary/5'
                  )}
                >
                  <div className={cn(
                    'mt-1 h-4 w-4 rounded-full border flex items-center justify-center',
                    formData.privacy === 'private' ? 'border-primary bg-primary' : 'border-muted-foreground'
                  )}>
                    {formData.privacy === 'private' && <Check className="h-3 w-3 text-primary-foreground" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Private</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Only invited members can join this group
                    </p>
                  </div>
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-2 md:pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
                className="h-11 flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !formData.name.trim()}
                className="h-11 flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Group'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
