'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import AppLogo from '@/components/ui/AppLogo';

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) setError('This password reset link is invalid or expired.');
      setLoading(false);
    });
  }, [supabase]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    if (password !== confirm) return setError('Passwords do not match.');
    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) setError(updateError.message);
    else { setDone(true); setTimeout(() => router.replace('/login'), 1200); }
    setLoading(false);
  };

  return <div className="min-h-screen gradient-hero flex items-center justify-center px-6">
    <div className="w-full max-w-md glass rounded-3xl p-8">
      <div className="flex justify-center mb-6"><AppLogo size={48} /></div>
      <h1 className="font-display text-3xl font-bold text-white text-center">Reset your password</h1>
      {loading ? <p className="text-white/60 text-center mt-4">Checking reset link…</p> : done ? <p className="text-emerald-300 text-center mt-4">Password updated. Returning to sign in…</p> : <form onSubmit={submit} className="mt-6 space-y-4">
        {error && <div className="rounded-xl p-3 bg-red-500/15 border border-red-400/30 text-white text-sm">{error}</div>}
        <input className="input-field" type="password" placeholder="New password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="new-password" />
        <input className="input-field" type="password" placeholder="Confirm new password" value={confirm} onChange={e=>setConfirm(e.target.value)} autoComplete="new-password" />
        <button className="btn-primary w-full py-4 font-bold" disabled={loading}>Update Password</button>
      </form>}
    </div>
  </div>;
}
