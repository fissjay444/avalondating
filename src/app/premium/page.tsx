'use client';

import { useEffect, useMemo, useState } from 'react';
import { Crown, Check, ShieldCheck, Sparkles } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { PremiumPlan } from '@/contexts/PremiumPaywallContext';

const plans: Array<{ id: PremiumPlan; title: string; price: string; days: number; url?: string; popular?: boolean; savings?: string }> = [
  { id: 'week', title: '7 Days', price: '$30', days: 7, url: process.env.NEXT_PUBLIC_SELAR_WEEK_URL },
  { id: 'month', title: '30 Days', price: '$199', days: 30, url: process.env.NEXT_PUBLIC_SELAR_MONTH_URL, popular: true, savings: 'SAVE 50%' },
  { id: '3months', title: '90 Days', price: '$399', days: 90, url: process.env.NEXT_PUBLIC_SELAR_3MONTHS_URL, savings: 'SAVE 33%' },
];

export default function PremiumPage() {
  const { user } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [active, setActive] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('checkout') === 'not_configured') {
      setMessage('This Premium checkout is not configured yet.');
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase.from('subscriptions').select('plan,status,expires_at').eq('user_id', user.id).maybeSingle().then(({ data }) => {
      setActive(data?.status === 'active' && data?.plan === 'premium' && (!data.expires_at || new Date(data.expires_at) > new Date()));
    });
  }, [user, supabase]);

  const checkout = (plan: PremiumPlan) => {
    if (!user) return;
    const config = plans.find(p => p.id === plan);
    if (!config?.url) {
      setMessage('This Premium checkout is not configured yet.');
      return;
    }
    try {
      const url = new URL(config.url);
      url.searchParams.set('user_id', user.id);
      if (user.email) url.searchParams.set('email', user.email);
      url.searchParams.set('plan', plan);
      window.location.assign(url.toString());
    } catch {
      setMessage('Premium checkout URL is invalid.');
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen gradient-hero text-white">
        <Navbar />
        <main className="pt-28 pb-16 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-5 text-sm font-semibold text-amber-300" style={{ background: 'rgba(212,175,55,0.14)', border: '1px solid rgba(212,175,55,0.35)' }}>
                <Crown size={16} /> Avalon Premium
              </div>
              <h1 className="font-display text-4xl sm:text-5xl font-bold mb-4">Unlock the full Avalon experience</h1>
              <p className="text-white/65 text-base sm:text-lg">Unlimited messages, contact sharing, likes and Premium features.</p>
            </div>

            {message && <div className="max-w-xl mx-auto mb-6 rounded-xl p-3 text-center text-sm bg-red-500/15 border border-red-400/30">{message}</div>}

            <div className="grid md:grid-cols-3 gap-6 items-stretch">
              {plans.map(plan => (
                <div key={plan.id} className={`relative rounded-3xl p-6 flex flex-col ${plan.popular ? 'ring-2 ring-amber-400/70' : ''}`} style={{ background: plan.popular ? 'linear-gradient(160deg, rgba(124,58,237,0.28), rgba(236,72,153,0.16), rgba(10,5,30,0.96))' : 'rgba(255,255,255,0.055)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  {plan.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold text-black bg-amber-400">MOST POPULAR</div>}
                  {plan.savings && <div className="text-xs text-amber-300 font-bold mb-2">{plan.savings}</div>}
                  <Crown size={20} className="text-amber-300" />
                  <h2 className="mt-3 text-xl font-bold">Avalon Premium</h2>
                  <p className="text-white/55 text-sm">{plan.title}</p>
                  <div className="text-4xl font-bold mt-5">{plan.price}</div>
                  <ul className="space-y-3 flex-1 mt-6">
                    {['Unlimited messages', 'Reveal contact information', 'Unlimited likes', 'See who liked you', 'No ads', 'Premium badge'].map(feature => <li key={feature} className="flex gap-2 text-sm text-white/75"><Check size={16} className="text-emerald-400 shrink-0" />{feature}</li>)}
                  </ul>
                  <button type="button" disabled={active} onClick={() => checkout(plan.id)} className="mt-7 w-full rounded-2xl px-4 py-3 text-center text-sm font-bold bg-gradient-to-r from-amber-400 to-pink-500 text-black disabled:opacity-40 disabled:cursor-not-allowed">
                    {active ? 'Premium Active' : `Unlock for ${plan.price} →`}
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-10 grid sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {[
                { Icon: ShieldCheck, title: 'Protected conversations', text: 'Contact-sharing detection helps keep conversations on Avalon.' },
                { Icon: Sparkles, title: 'Verified entitlement', text: 'Premium activates only after verified payment.' },
                { Icon: Check, title: 'Clear limits', text: 'Free members see their limits before premium actions.' },
              ].map(({ Icon, title, text }) => (
                <div key={title} className="rounded-2xl p-4 text-center" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <Icon size={20} className="mx-auto" />
                  <p className="font-semibold text-sm mt-2">{title}</p>
                  <p className="text-white/45 text-xs mt-1">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
