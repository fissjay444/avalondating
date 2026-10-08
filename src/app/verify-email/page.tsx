'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { Loader2, ArrowLeft, MailCheck } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import AppLogo from '@/components/ui/AppLogo';

function VerifyEmailInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const email = useMemo(() => searchParams.get('email')?.trim().toLowerCase() || '', [searchParams]);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(60);

  useEffect(() => {
    if (!email) router.replace('/signup');
  }, [email, router]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => setCooldown(value => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  const friendlyError = (value: unknown) => {
    const text = value instanceof Error ? value.message : String(value ?? '');
    const lower = text.toLowerCase();
    if (lower.includes('expired') || lower.includes('invalid')) return 'That code is invalid or expired. Please request a new code.';
    if (lower.includes('rate limit') || lower.includes('too many')) return 'Please wait a moment before requesting another code.';
    return 'We could not verify that code. Please check the 6 digits and try again.';
  };

  const handleVerify = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      setError('Enter the 6-digit code from your email.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: 'email',
      });
      if (verifyError) throw verifyError;
      router.replace('/onboarding');
    } catch (err) {
      setError(friendlyError(err));
      setCode('');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resending || cooldown > 0 || !email) return;
    setResending(true);
    setError('');
    setMessage('');
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email,
      });
      if (resendError) throw resendError;
      setCooldown(60);
      setMessage('A new verification code has been sent to your email.');
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-hero px-6 py-10">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <AppLogo size={42} />
          <div>
            <div className="font-display font-bold text-white text-2xl leading-none">Avalon</div>
            <div className="text-gold font-bold text-sm">Dating</div>
          </div>
        </div>

        <div className="glass rounded-3xl p-7 sm:p-9 border border-white/10 shadow-2xl">
          <div className="flex justify-center mb-5">
            <div className="w-16 h-16 rounded-full flex items-center justify-center bg-white/10 border border-gold/30">
              <MailCheck className="text-gold" size={30} />
            </div>
          </div>

          <h1 className="font-display font-bold text-white text-3xl text-center">Verify your email</h1>
          <p className="text-white/60 text-sm text-center mt-2 leading-relaxed">
            We sent a 6-digit verification code to
          </p>
          <p className="text-gold text-sm font-semibold text-center mt-1 break-all">{email}</p>

          <form onSubmit={handleVerify} className="mt-7 flex flex-col gap-5">
            {error && (
              <div className="rounded-xl p-3 text-sm text-white font-medium bg-red-500/15 border border-red-400/30">
                {error}
              </div>
            )}
            {message && (
              <div className="rounded-xl p-3 text-sm text-white font-medium bg-emerald-500/15 border border-emerald-400/30">
                {message}
              </div>
            )}

            <div>
              <label htmlFor="verification-code" className="text-white/80 text-sm font-medium">Verification code</label>
              <input
                id="verification-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                className="input-field mt-2 text-center text-2xl tracking-[0.45em] font-bold"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="btn-primary py-4 font-bold text-base flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? <><Loader2 size={18} className="animate-spin" /> Verifying...</> : 'Verify Email & Continue →'}
            </button>
          </form>

          <div className="text-center mt-6">
            <p className="text-white/50 text-sm">Didn't receive the code?</p>
            <button
              type="button"
              onClick={handleResend}
              disabled={resending || cooldown > 0}
              className="text-accent font-semibold text-sm mt-1 disabled:text-white/30 disabled:cursor-not-allowed"
            >
              {resending ? 'Sending...' : cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
            </button>
          </div>

          <Link href="/signup" className="mt-7 flex items-center justify-center gap-2 text-white/50 hover:text-white text-sm transition-colors">
            <ArrowLeft size={16} /> Back to sign up
          </Link>
        </div>

        <p className="text-white/35 text-xs text-center mt-5">Your verification code is one-time use.</p>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen gradient-hero flex items-center justify-center text-white">Loading…</div>}>
      <VerifyEmailInner />
    </Suspense>
  );
}
