'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/inventory');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-pulse flex items-center gap-2 text-violet-600">
        <div className="w-3 h-3 bg-violet-600 rounded-full" />
        <div className="w-3 h-3 bg-violet-600 rounded-full" />
        <div className="w-3 h-3 bg-violet-600 rounded-full" />
      </div>
    </div>
  );
}