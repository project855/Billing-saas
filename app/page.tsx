'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function HomePage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [status, router]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-green-500 rounded-lg flex items-center justify-center text-white font-bold text-3xl mx-auto mb-4">
          BF
        </div>
        <h1 className="text-white text-2xl font-bold">Augfox</h1>
        <p className="text-gray-400 mt-2">Loading...</p>
      </div>
    </div>
  );
}
