'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const result = await signIn('credentials', { email, password, redirect: false });
      if (!result?.ok) {
        setError(result?.error || 'Invalid email or password');
        return;
      }
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-[45%] bg-brand flex-col justify-between p-12 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/[0.06]" />
          <div className="absolute top-1/2 -left-10 w-48 h-48 rounded-full bg-white/[0.04]" />
          <div className="absolute bottom-10 right-20 w-32 h-32 rounded-full bg-white/[0.06]" />
        </div>
        <div className="relative">
          <Image src="/augfox-logo.svg" alt="Augfox" width={150} height={40} className="brightness-0 invert" />
        </div>
        <div className="relative">
          <h2 className="text-xl font-bold text-gray-900 leading-tight mb-4">
            Streamline your<br />billing workflow
          </h2>
          <p className="text-white/70 text-sm leading-relaxed max-w-xs">
            Manage invoices, track expenses, and get paid faster — all in one beautiful platform.
          </p>
          <div className="flex gap-6 mt-8">
            {[['10k+', 'Businesses'], ['99.9%', 'Uptime'], ['₹500Cr+', 'Processed']].map(([val, label]) => (
              <div key={label}>
                <p className="text-white font-bold text-lg">{val}</p>
                <p className="text-white/60 text-xs">{label}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="relative text-white/40 text-xs">© 2026 Augfox. All rights reserved.</p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[380px]">
          {/* Logo for mobile */}
          <div className="lg:hidden mb-8">
            <Image src="/augfox-logo.svg" alt="Augfox" width={130} height={34} />
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
            <p className="text-gray-500 text-sm mt-1.5">Sign in to your Augfox account</p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-brand/8 border border-brand/20 rounded-lg text-brand text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
              <Input
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
                className="bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus-visible:ring-brand/20 focus-visible:border-brand/40 h-10"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <Link href="/auth/forgot-password" className="text-xs text-brand hover:brightness-90 font-medium">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  className="bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus-visible:ring-brand/20 focus-visible:border-brand/40 h-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-brand hover:brightness-90 text-white font-semibold h-10 rounded-lg shadow-sm mt-2 gap-2 group"
            >
              {isLoading ? 'Signing in...' : (
                <>Sign In <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" /></>
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-gray-500 text-sm">
            Don&apos;t have an account?{' '}
            <Link href="/auth/signup" className="text-brand hover:brightness-90 font-semibold">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
