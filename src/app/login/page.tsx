'use client';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import FloatingHearts from '@/app/components/FloatingHearts';
import AppLogo from '@/components/ui/AppLogo';

type LoginData = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');

  const { signIn, resetPassword } = useAuth();
  const router = useRouter();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginData>();

  const getErrorMessage = (error: Error & { message?: string }) => {
    const msg = error?.message?.toLowerCase() || '';
    if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
      return 'Incorrect email or password. Please try again.';
    }
    if (msg.includes('email not confirmed')) {
      return 'Please confirm your email address before signing in.';
    }
    if (msg.includes('user not found') || msg.includes('no user found')) {
      return 'No account found with this email. Please sign up.';
    }
    if (msg.includes('too many requests')) {
      return 'Too many attempts. Please wait a moment and try again.';
    }
    if (msg.includes('network') || msg.includes('fetch')) {
      return 'Network error. Please check your connection and try again.';
    }
    return 'Sign in failed. Please try again.';
  };

  const onSubmit = async (data: LoginData) => {
    setLoading(true);
    setAuthError('');
    try {
      await signIn(data.email, data.password);
      // After sign in, redirect to discover — middleware and auth state will handle
      // onboarding redirect if needed. Don't read isOnboardingComplete here as it
      // may not have updated yet from the auth state change.
      router.push('/discover');
    } catch (err: unknown) {
      setAuthError(getErrorMessage(err as Error & { message?: string }));
    } finally {
      setLoading(false);
    }
  };


  const handleResetPassword = async () => {
    if (!resetEmail) {
      setResetError('Please enter your email address.');
      return;
    }
    setResetLoading(true);
    setResetError('');
    try {
      await resetPassword(resetEmail);
      setResetSent(true);
    } catch {
      setResetError('Failed to send reset email. Please check the address and try again.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex gradient-hero overflow-hidden">
      {/* Left brand panel */}
      <div className="hidden lg:flex flex-col justify-center items-center w-1/2 xl:w-[55%] relative px-12 xl:px-20 py-16">
        <FloatingHearts />
        <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.2) 0%, transparent 70%)' }} />
        <div className="absolute bottom-1/3 right-1/4 w-60 h-60 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.12) 0%, transparent 70%)' }} />
        <div className="relative z-10 text-center max-w-md">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="relative w-20 h-20">
              <svg viewBox="0 0 80 80" className="w-full h-full drop-shadow-2xl" fill="none">
                <defs>
                  <radialGradient id="heartGradLogin" cx="50%" cy="30%" r="70%">
                    <stop offset="0%" stopColor="#9333EA" />
                    <stop offset="60%" stopColor="#7C3AED" />
                    <stop offset="100%" stopColor="#4C1D95" />
                  </radialGradient>
                  <radialGradient id="goldRingLogin" cx="50%" cy="30%" r="70%">
                    <stop offset="0%" stopColor="#FBBF24" />
                    <stop offset="100%" stopColor="#D4AF37" />
                  </radialGradient>
                </defs>
                <path d="M40 68 C40 68 8 48 8 26 C8 16 16 8 26 8 C32 8 38 12 40 18 C42 12 48 8 54 8 C64 8 72 16 72 26 C72 48 40 68 40 68Z" fill="url(#heartGradLogin)" />
                <path d="M40 62 C40 62 12 44 12 26 C12 18 18 12 26 12 C31 12 36 15 38 20" stroke="url(#goldRingLogin)" strokeWidth="3.5" fill="none" strokeLinecap="round" />
                <path d="M42 20 C44 15 49 12 54 12 C62 12 68 18 68 26 C68 44 40 62 40 62" stroke="url(#goldRingLogin)" strokeWidth="3.5" fill="none" strokeLinecap="round" />
                <circle cx="40" cy="10" r="2.5" fill="#FBBF24" opacity="0.9" />
              </svg>
            </div>
            <div className="text-left">
              <div className="font-display font-bold text-white leading-none" style={{ fontSize: '2.8rem' }}>Avalon</div>
              <div className="font-display font-bold text-gold leading-none" style={{ fontSize: '2.2rem' }}>Dating</div>
            </div>
          </div>
          <p className="text-white/70 text-sm tracking-[0.25em] uppercase font-medium mb-4">
            Real People · Real Connections · A Brighter Tomorrow
          </p>
          <p className="font-script text-white text-2xl mb-10">Love is closer than you think ♡</p>
          <div className="flex flex-col gap-3">
            {[
              { id: 'f-v', icon: '✅', text: '100% Verified Profiles' },
              { id: 'f-s', icon: '🛡️', text: 'Safe & Secure Platform' },
              { id: 'f-m', icon: '💞', text: '840K+ Matches Made' },
            ].map((f) => (
              <div key={f.id} className="flex items-center gap-3 glass rounded-full px-5 py-3 text-left">
                <span className="text-lg">{f.icon}</span>
                <span className="text-white/90 text-sm font-medium">{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 lg:w-1/2 xl:w-[45%] flex items-center justify-center px-6 py-16 relative">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <AppLogo size={36} />
            <div>
              <div className="font-display font-bold text-white text-xl">Avalon</div>
              <div className="text-gold font-bold text-sm -mt-1">Dating</div>
            </div>
          </div>

          {/* Tab switcher */}
          <div className="glass rounded-2xl p-1 flex mb-8">
            <Link href="/login" className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-200 btn-primary shadow-glow-pink text-center">
              Sign In
            </Link>
            <Link href="/signup" className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-200 text-white/60 hover:text-white text-center">
              Create Account
            </Link>
          </div>

          {showReset ? (
            <div className="flex flex-col gap-5">
              <div>
                <h1 className="font-display font-bold text-white text-2xl">Reset Password 🔑</h1>
                <p className="text-white/50 text-sm mt-1">Enter your email and we&apos;ll send a reset link</p>
              </div>
              {resetSent ? (
                <div className="rounded-xl p-4 text-sm text-white font-medium"
                  style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)' }}>
                  ✅ Reset link sent! Check your email inbox.
                </div>
              ) : (
                <>
                  {resetError && (
                    <div className="rounded-xl p-3 text-sm text-white font-medium"
                      style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
                      {resetError}
                    </div>
                  )}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-white/80 text-sm font-medium">Email address</label>
                    <input
                      type="email"
                      className="input-field"
                      placeholder="you@example.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                    />
                  </div>
                  <button
                    onClick={handleResetPassword}
                    disabled={resetLoading}
                    className="btn-primary py-4 font-bold text-base flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {resetLoading ? <><Loader2 size={18} className="animate-spin" /><span>Sending...</span></> : 'Send Reset Link'}
                  </button>
                </>
              )}
              <button type="button" onClick={() => setShowReset(false)} className="text-center text-accent text-sm hover:underline">
                ← Back to Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
              <div>
                <h1 className="font-display font-bold text-white text-2xl">Welcome back 💜</h1>
                <p className="text-white/50 text-sm mt-1">Sign in to continue your journey</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-white/15" />
                <span className="text-white/40 text-xs">Sign in with email</span>
                <div className="flex-1 h-px bg-white/15" />
              </div>

              {authError && (
                <div className="rounded-xl p-3 text-sm text-white font-medium"
                  style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
                  {authError}
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label htmlFor="login-email" className="text-white/80 text-sm font-medium">Email address</label>
                <input
                  id="login-email"
                  type="email"
                  className="input-field"
                  placeholder="you@example.com"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email' },
                  })}
                />
                {errors.email && <p className="text-red-400 text-xs mt-0.5">{errors.email.message}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="login-password" className="text-white/80 text-sm font-medium">Password</label>
                  <button type="button" onClick={() => setShowReset(true)} className="text-accent text-xs hover:underline">
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    className="input-field pr-12"
                    placeholder="Enter your password"
                    {...register('password', {
                      required: 'Password is required',
                      minLength: { value: 6, message: 'At least 6 characters' },
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <p className="text-red-400 text-xs mt-0.5">{errors.password.message}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary py-4 font-bold text-base flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                style={{ minHeight: '52px' }}
              >
                {loading ? (
                  <><Loader2 size={18} className="animate-spin" /><span>Signing in...</span></>
                ) : 'Sign In ✨'}
              </button>

              <p className="text-center text-white/50 text-sm">
                Don&apos;t have an account?{' '}
                <Link href="/signup" className="text-accent hover:underline font-medium">Join free</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
