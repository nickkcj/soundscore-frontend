'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authApi } from '@/lib/api';

const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
  });

  useEffect(() => {
    if (!token) {
      setError('Invalid link. Please request a new password reset.');
    }
  }, [token]);

  const onSubmit = async (data: ResetPasswordForm) => {
    if (!token) return;

    setIsLoading(true);
    try {
      await authApi.resetPassword(token, data.password);
      setIsSuccess(true);
      toast.success('Password reset successfully!');
      setTimeout(() => router.push('/login'), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reset password';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Password reset!</h1>
            <p className="text-muted-foreground">
              Your password was changed successfully. Redirecting to login...
            </p>
          </div>
        </div>

        <Button asChild className="w-full">
          <Link href="/login">Go to login</Link>
        </Button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
            <XCircle className="w-8 h-8 text-destructive" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Reset failed</h1>
            <p className="text-muted-foreground">{error}</p>
          </div>
        </div>

        <div className="space-y-4">
          <Button asChild className="w-full">
            <Link href="/forgot-password">Request a new link</Link>
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            <Link href="/login" className="text-primary hover:underline font-medium">
              Back to login
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Reset password</h1>
        <p className="text-muted-foreground">
          Enter your new password below.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Enter your new password"
            {...register('password')}
            disabled={isLoading}
          />
          {errors.password && (
            <p className="text-sm text-destructive">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Confirm your new password"
            {...register('confirmPassword')}
            disabled={isLoading}
          />
          {errors.confirmPassword && (
            <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Reset password
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Remembered your password?{' '}
        <Link href="/login" className="text-primary hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
