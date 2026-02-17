'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, User, Lock, Trash2, Settings, Camera, AlertTriangle, Eye } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useRequireAuth } from '@/hooks/use-auth';
import { useAuthStore } from '@/stores/auth-store';
import { api } from '@/lib/api';
import type { User as UserType } from '@/types';

const profileSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be at most 50 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
    .optional(),
  email: z.string().email('Please enter a valid email').optional(),
  bio: z.string().max(500, 'Bio must be at most 500 characters').optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

export default function AccountPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useRequireAuth();
  const { setUser, logout } = useAuthStore();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeSection, setActiveSection] = useState<'profile' | 'password' | 'privacy' | 'danger'>('profile');
  const [libraryPublic, setLibraryPublic] = useState(user?.library_public ?? true);
  const [isUpdatingPrivacy, setIsUpdatingPrivacy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: user?.username || '',
      bio: user?.bio || '',
    },
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    // Create local preview URL for optimistic update
    const previewUrl = URL.createObjectURL(file);
    const previousPicture = user.profile_picture;

    // Optimistic update - show preview immediately
    setUser({ ...user, profile_picture: previewUrl });
    toast.success('Profile picture updated!');

    // Upload in background
    setIsUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const updatedUser = await api.postForm<UserType>('/users/profile/picture', formData);
      if (updatedUser) {
        // Replace preview with actual URL from server
        URL.revokeObjectURL(previewUrl);
        setUser(updatedUser);
      }
    } catch (err) {
      // Revert on error
      URL.revokeObjectURL(previewUrl);
      setUser({ ...user, profile_picture: previousPicture });
      toast.error(err instanceof Error ? err.message : 'Failed to upload photo');
    } finally {
      setIsUploadingPhoto(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const onProfileSubmit = async (data: ProfileForm) => {
    if (!user) return;

    // Save previous state for rollback
    const previousUser = { ...user };

    // Optimistic update - update immediately
    const optimisticUser = {
      ...user,
      username: data.username || user.username,
      bio: data.bio ?? user.bio,
    };
    setUser(optimisticUser);
    toast.success('Profile updated!');

    // API call in background
    setIsUpdating(true);
    try {
      const updatedUser = await api.patch<UserType>('/users/profile', {
        username: data.username,
        bio: data.bio,
      });
      if (updatedUser) {
        // Sync with server response
        setUser(updatedUser);
      }
    } catch (err) {
      // Revert on error
      setUser(previousUser);
      toast.error(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordForm) => {
    setIsChangingPassword(true);
    try {
      await api.post('/auth/change-password', {
        current_password: data.currentPassword,
        new_password: data.newPassword,
      });
      toast.success('Password changed successfully');
      passwordForm.reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await api.delete('/users/account');
      logout();
      toast.success('Account deleted successfully');
      router.push('/');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete account');
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const handlePrivacyToggle = async (checked: boolean) => {
    if (!user) return;

    const previousValue = libraryPublic;

    // Optimistic update
    setLibraryPublic(checked);
    toast.success(checked ? 'Library is now public' : 'Library is now private');

    setIsUpdatingPrivacy(true);
    try {
      const updatedUser = await api.patch<UserType>('/users/profile', {
        library_public: checked,
      });
      if (updatedUser) {
        setUser(updatedUser);
      }
    } catch (err) {
      // Revert on error
      setLibraryPublic(previousValue);
      toast.error(err instanceof Error ? err.message : 'Failed to update privacy settings');
    } finally {
      setIsUpdatingPrivacy(false);
    }
  };

  if (authLoading || !user) {
    return <AccountSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto max-w-4xl px-4 py-12 md:py-20">
        {/* Page Header */}
        <header className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground flex items-center">
            <Settings className="w-8 h-8 mr-3 text-wine-500" />
            Account Settings
          </h1>
          <p className="text-muted-foreground mt-2">Manage your profile and security settings</p>
        </header>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <aside className="lg:w-64 flex-shrink-0">
            <nav className="bg-card rounded-xl shadow-sm border border-border overflow-hidden sticky top-28">
              <div className="p-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-wine-200">
                      <Image
                        src={user.profile_picture || '/images/default.jpg'}
                        alt={user.username}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate">{user.username}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                </div>
              </div>
              <div className="p-2">
                <button
                  onClick={() => setActiveSection('profile')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeSection === 'profile'
                      ? 'bg-wine-50 dark:bg-wine-950/30 text-wine-600 dark:text-wine-400'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <User className="w-5 h-5" />
                  <span className="font-medium">Profile</span>
                </button>
                <button
                  onClick={() => setActiveSection('password')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeSection === 'password'
                      ? 'bg-wine-50 dark:bg-wine-950/30 text-wine-600 dark:text-wine-400'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <Lock className="w-5 h-5" />
                  <span className="font-medium">Password</span>
                </button>
                <button
                  onClick={() => setActiveSection('privacy')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeSection === 'privacy'
                      ? 'bg-wine-50 dark:bg-wine-950/30 text-wine-600 dark:text-wine-400'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <Eye className="w-5 h-5" />
                  <span className="font-medium">Privacy</span>
                </button>
                <button
                  onClick={() => setActiveSection('danger')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeSection === 'danger'
                      ? 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-medium">Danger Zone</span>
                </button>
              </div>
            </nav>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Profile Section */}
            {activeSection === 'profile' && (
              <section className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                <div className="px-6 py-5 border-b border-border bg-gradient-to-r from-wine-50 to-wine-100 dark:from-wine-950/20 dark:to-wine-950/20">
                  <h2 className="text-xl font-bold text-foreground flex items-center">
                    <User className="w-5 h-5 mr-2 text-wine-500" />
                    Profile Information
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">Update your public profile information</p>
                </div>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="p-6 space-y-6">
                  {/* Profile Picture */}
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-wine-100 shadow-lg">
                        <Image
                          src={user.profile_picture || '/images/default.jpg'}
                          alt={user.username}
                          width={96}
                          height={96}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {/* Hidden file input */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                        id="profile-picture-input"
                      />
                      {/* Camera button */}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingPhoto}
                        className="absolute bottom-0 right-0 p-2 bg-wine-500 text-white rounded-full shadow-md hover:bg-wine-600 transition-colors disabled:opacity-50"
                        title="Change profile picture"
                      >
                        {isUploadingPhoto ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Camera className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{user.username}</p>
                      <p className="text-sm text-muted-foreground">Click the camera icon to upload a new photo</p>
                      <p className="text-xs text-muted-foreground/70 mt-1">JPG, PNG, GIF or WebP. Max 5MB.</p>
                    </div>
                  </div>

                  {/* Username */}
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-foreground font-medium">Username</Label>
                    <Input
                      id="username"
                      {...profileForm.register('username')}
                      defaultValue={user.username}
                      className="border-input focus:border-wine-400 focus:ring-wine-400"
                    />
                    {profileForm.formState.errors.username && (
                      <p className="text-sm text-red-500">
                        {profileForm.formState.errors.username.message}
                      </p>
                    )}
                  </div>

                  {/* Bio */}
                  <div className="space-y-2">
                    <Label htmlFor="bio" className="text-foreground font-medium">Bio</Label>
                    <Textarea
                      id="bio"
                      placeholder="Tell us about yourself and your music taste..."
                      {...profileForm.register('bio')}
                      defaultValue={user.bio || ''}
                      rows={4}
                      className="border-input focus:border-wine-400 focus:ring-wine-400 resize-none"
                    />
                    {profileForm.formState.errors.bio && (
                      <p className="text-sm text-red-500">
                        {profileForm.formState.errors.bio.message}
                      </p>
                    )}
                  </div>

                  <div className="pt-4">
                    <Button
                      type="submit"
                      disabled={isUpdating}
                      className="bg-wine-600 hover:bg-wine-700 text-white px-6"
                    >
                      {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save Changes
                    </Button>
                  </div>
                </form>
              </section>
            )}

            {/* Password Section */}
            {activeSection === 'password' && (
              <section className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                <div className="px-6 py-5 border-b border-border bg-gradient-to-r from-wine-50 to-wine-100 dark:from-wine-950/20 dark:to-wine-950/20">
                  <h2 className="text-xl font-bold text-foreground flex items-center">
                    <Lock className="w-5 h-5 mr-2 text-wine-500" />
                    Change Password
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">Keep your account secure with a strong password</p>
                </div>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="p-6 space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword" className="text-foreground font-medium">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      {...passwordForm.register('currentPassword')}
                      className="border-input focus:border-wine-400 focus:ring-wine-400"
                    />
                    {passwordForm.formState.errors.currentPassword && (
                      <p className="text-sm text-red-500">
                        {passwordForm.formState.errors.currentPassword.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="text-foreground font-medium">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      {...passwordForm.register('newPassword')}
                      className="border-input focus:border-wine-400 focus:ring-wine-400"
                    />
                    {passwordForm.formState.errors.newPassword && (
                      <p className="text-sm text-red-500">
                        {passwordForm.formState.errors.newPassword.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-foreground font-medium">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      {...passwordForm.register('confirmPassword')}
                      className="border-input focus:border-wine-400 focus:ring-wine-400"
                    />
                    {passwordForm.formState.errors.confirmPassword && (
                      <p className="text-sm text-red-500">
                        {passwordForm.formState.errors.confirmPassword.message}
                      </p>
                    )}
                  </div>

                  <div className="pt-4">
                    <Button
                      type="submit"
                      disabled={isChangingPassword}
                      className="bg-wine-600 hover:bg-wine-700 text-white px-6"
                    >
                      {isChangingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Change Password
                    </Button>
                  </div>
                </form>
              </section>
            )}

            {/* Privacy Section */}
            {activeSection === 'privacy' && (
              <section className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                <div className="px-6 py-5 border-b border-border bg-gradient-to-r from-wine-50 to-wine-100 dark:from-wine-950/20 dark:to-wine-950/20">
                  <h2 className="text-xl font-bold text-foreground flex items-center">
                    <Eye className="w-5 h-5 mr-2 text-wine-500" />
                    Privacy Settings
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">Control what others can see on your profile</p>
                </div>
                <div className="p-6 space-y-6">
                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div className="space-y-1">
                      <Label htmlFor="library-public" className="text-foreground font-medium">
                        Public Library
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Show your library stats, top artists and tracks on your public profile
                      </p>
                    </div>
                    <Switch
                      id="library-public"
                      checked={libraryPublic}
                      onCheckedChange={handlePrivacyToggle}
                      disabled={isUpdatingPrivacy}
                      className="data-[state=checked]:bg-wine-500"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    When enabled, visitors to your profile will see a summary of your listening activity,
                    including your top artists and most played tracks. When disabled, only you can see your library.
                  </p>
                </div>
              </section>
            )}

            {/* Danger Zone Section */}
            {activeSection === 'danger' && (
              <section className="bg-card rounded-xl shadow-sm border border-red-200 dark:border-red-900 overflow-hidden">
                <div className="px-6 py-5 border-b border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30">
                  <h2 className="text-xl font-bold text-red-700 dark:text-red-400 flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    Danger Zone
                  </h2>
                  <p className="text-sm text-red-600 dark:text-red-400/80 mt-1">Irreversible and destructive actions</p>
                </div>
                <div className="p-6">
                  <div className="border border-red-200 dark:border-red-900 rounded-lg p-5 bg-red-50/50 dark:bg-red-950/20">
                    <h3 className="font-semibold text-red-800 dark:text-red-300 mb-2">Delete Account</h3>
                    <p className="text-sm text-red-700 dark:text-red-400/80 mb-4">
                      Once you delete your account, there is no going back. All your reviews, comments, and data will be permanently deleted.
                    </p>
                    <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="destructive" className="bg-red-500 hover:bg-red-600">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Account
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="rounded-2xl max-w-md">
                        <DialogHeader>
                          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-950/30 mb-4">
                            <Trash2 className="h-10 w-10 text-red-500" />
                          </div>
                          <DialogTitle className="text-center text-xl font-bold text-foreground">Delete Account</DialogTitle>
                          <DialogDescription className="text-center text-muted-foreground">
                            Are you sure you want to delete your account? This action cannot be undone. All your reviews, comments, and data will be permanently deleted.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="flex justify-center gap-4 sm:justify-center">
                          <Button
                            variant="outline"
                            onClick={() => setDeleteDialogOpen(false)}
                            className="rounded-xl flex-1 border-border"
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={handleDeleteAccount}
                            disabled={isDeleting}
                            className="rounded-xl flex-1 bg-red-500 hover:bg-red-600"
                          >
                            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Delete Account
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function AccountSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background">
      <main className="container mx-auto max-w-4xl px-4 py-12 md:py-20">
        <div className="h-10 w-64 bg-muted rounded mb-10 animate-pulse" />
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-64">
            <div className="bg-card rounded-xl shadow-sm border border-border p-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-muted animate-pulse" />
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-32 bg-muted rounded animate-pulse" />
                </div>
              </div>
              <div className="space-y-2 pt-2">
                <div className="h-10 bg-muted rounded-lg animate-pulse" />
                <div className="h-10 bg-muted rounded-lg animate-pulse" />
                <div className="h-10 bg-muted rounded-lg animate-pulse" />
              </div>
            </div>
          </aside>
          <div className="flex-1">
            <div className="bg-card rounded-xl shadow-sm border border-border">
              <div className="px-6 py-5 border-b border-border">
                <div className="h-6 w-48 bg-muted rounded animate-pulse" />
              </div>
              <div className="p-6 space-y-6">
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 rounded-full bg-muted animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-5 w-32 bg-muted rounded animate-pulse" />
                    <div className="h-4 w-48 bg-muted rounded animate-pulse" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                  <div className="h-10 bg-muted rounded animate-pulse" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-16 bg-muted rounded animate-pulse" />
                  <div className="h-32 bg-muted rounded animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
