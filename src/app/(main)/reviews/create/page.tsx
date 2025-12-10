'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Redirect to my-reviews - review creation is now done via modal there
export default function CreateReviewPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/my-reviews');
  }, [router]);

  return null;
}
