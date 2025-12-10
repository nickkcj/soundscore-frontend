'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
  username: string;
  profilePicture?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLink?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
  xl: 'h-20 w-20',
};

// Cache global de imagens já carregadas
const loadedImages = new Set<string>();

export function UserAvatar({
  username,
  profilePicture,
  size = 'md',
  showLink = true,
  className,
}: UserAvatarProps) {
  // Verifica se a imagem já está em cache no momento da renderização inicial
  const isAlreadyCached = useMemo(
    () => (profilePicture ? loadedImages.has(profilePicture) : false),
    [profilePicture]
  );

  const [imageLoaded, setImageLoaded] = useState(isAlreadyCached);

  useEffect(() => {
    if (profilePicture && !loadedImages.has(profilePicture)) {
      const img = new window.Image();
      img.onload = () => {
        loadedImages.add(profilePicture);
        setImageLoaded(true);
      };
      img.src = profilePicture;
    } else if (profilePicture && loadedImages.has(profilePicture)) {
      setImageLoaded(true);
    }
  }, [profilePicture]);

  const avatar = (
    <Avatar className={cn(sizeClasses[size], 'ring-2 ring-primary/10', className)}>
      <AvatarImage
        src={profilePicture || undefined}
        alt={username}
        onLoadingStatusChange={(status) => {
          if (status === 'loaded' && profilePicture) {
            loadedImages.add(profilePicture);
            setImageLoaded(true);
          }
        }}
      />
      {!imageLoaded && (
        <AvatarFallback className="bg-primary/10 text-primary font-medium" delayMs={0}>
          {username.charAt(0).toUpperCase()}
        </AvatarFallback>
      )}
    </Avatar>
  );

  if (showLink) {
    return (
      <Link href={`/profile/${username}`} className="hover:opacity-80 transition-opacity">
        {avatar}
      </Link>
    );
  }

  return avatar;
}

export function UserAvatarSkeleton({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  return <Skeleton className={cn(sizeClasses[size], 'rounded-full')} />;
}
