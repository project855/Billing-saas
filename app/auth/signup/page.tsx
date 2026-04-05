'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';

export default function SignUpPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password }),
      });
      if (!response.ok) {
        const data = await response.json();
        setError(data.message || 'Failed to create account');
        return;
      }
      const result = await signIn('credentials', { email, password, redirect: false });
      if (!result?.ok) { setError('Account created but failed to sign in'); router.push('/auth/signin'); return; }
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
            Start for free.<br />Scale as you grow.
          </h2>
          <p className="text-white/70 text-sm leading-relaxed max-w-xs">
            Join thousands of businesses who trust Augfox to handle their billing, invoicing, and expense management.
          </p>
          <div className="flex gap-6 mt-8">
            {[['Free', 'To Start'], ['5 min', 'Setup'], ['No Card', 'Required']].map(([val, label]) => (
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
          <div className="lg:hidden mb-8">
            <Image src="/augfox-logo.svg" alt="Augfox" width={130} height={34} />
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
            <p className="text-gray-500 text-sm mt-1.5">Get started with Augfox — it&apos;s free</p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-brand/8 border border-brand/20 rounded-lg text-brand text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
              <Input
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={isLoading}
                required
                className="bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus-visible:ring-brand/20 focus-visible:border-brand/40 h-10"
              />
            </div>
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
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                required
                className="bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus-visible:ring-brand/20 focus-visible:border-brand/40 h-10"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-brand hover:brightness-90 text-white font-semibold h-10 rounded-lg shadow-sm mt-2 gap-2 group"
            >
              {isLoading ? 'Creating account...' : (
                <>Create Account <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" /></>
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-gray-500 text-sm">
            Already have an account?{' '}
            <Link href="/auth/signin" className="text-brand hover:brightness-90 font-semibold">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
