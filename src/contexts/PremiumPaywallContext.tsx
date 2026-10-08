'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import PremiumPaywallModal from '@/components/premium/PremiumPaywallModal';

export type PremiumPaywallReason = 'message_limit' | 'contact' | 'likes' | 'feature';
export type PremiumPlan = 'week' | 'month' | '3months';

interface PremiumPaywallOptions {
  reason?: PremiumPaywallReason;
  userName?: string;
  messageCount?: number;
}

interface PremiumPaywallContextValue {
  showPremiumModal: boolean;
  openPremiumPaywall: (options?: PremiumPaywallOptions) => void;
  closePremiumPaywall: () => void;
}

const PremiumPaywallContext = createContext<PremiumPaywallContextValue | null>(null);

export function usePremiumPaywall() {
  const context = useContext(PremiumPaywallContext);
  if (!context) {
    throw new Error('usePremiumPaywall must be used within PremiumPaywallProvider');
  }
  return context;
}

function getSelarUrl(plan: PremiumPlan, userId: string, email?: string | null): string | null {
  const envKey: Record<PremiumPlan, string | undefined> = {
    week: process.env.NEXT_PUBLIC_SELAR_WEEK_URL,
    month: process.env.NEXT_PUBLIC_SELAR_MONTH_URL,
    '3months': process.env.NEXT_PUBLIC_SELAR_3MONTHS_URL,
  };

  const rawUrl = envKey[plan];
  if (!rawUrl) return null;

  try {
    const url = new URL(rawUrl);
    url.searchParams.set('user_id', userId);
    if (email) url.searchParams.set('email', email);
    url.searchParams.set('plan', plan);
    return url.toString();
  } catch {
    return null;
  }
}

export function PremiumPaywallProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [reason, setReason] = useState<PremiumPaywallReason>('feature');
  const [userName, setUserName] = useState<string | undefined>();
  const [messageCount, setMessageCount] = useState(20);

  const openPremiumPaywall = useCallback(async (options: PremiumPaywallOptions = {}) => {
    if (!user) return;

    // Global safety net: never show a Premium wall to an active Premium/VIP user,
    // even if a trigger component has stale client-side entitlement state.
    try {
      const { data } = await supabase
        .from('subscriptions')
        .select('plan, status')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data?.status === 'active' && (data.plan === 'premium' || data.plan === 'vip')) {
        return;
      }
    } catch {
      // If entitlement lookup fails, the server-side send/feature checks remain authoritative.
    }

    setReason(options.reason || 'feature');
    setUserName(options.userName);
    setMessageCount(options.messageCount ?? 20);
    setShowPremiumModal(true);
  }, [supabase, user]);

  const closePremiumPaywall = useCallback(() => setShowPremiumModal(false), []);

  const handleSelectPlan = useCallback((plan: PremiumPlan) => {
    // The checkout link is only a navigation step. Premium entitlement must
    // be granted by verified payment-provider activation on the backend.
    const userId = user?.id || '';
    const userEmail = user?.email || '';
    const checkoutUrl = getSelarUrl(plan, userId, userEmail);

    if (checkoutUrl) {
      window.location.assign(checkoutUrl);
      return;
    }

    // Safe fallback while the production Selar URLs are not configured.
    window.location.assign(`/premium?plan=${encodeURIComponent(plan)}&checkout=not_configured`);
  }, [user]);

  const value = useMemo(() => ({
    showPremiumModal,
    openPremiumPaywall,
    closePremiumPaywall,
  }), [showPremiumModal, openPremiumPaywall, closePremiumPaywall]);

  return (
    <PremiumPaywallContext.Provider value={value}>
      {children}
      <PremiumPaywallModal
        isOpen={showPremiumModal}
        onClose={closePremiumPaywall}
        onSelectPlan={handleSelectPlan}
        reason={reason}
        userName={userName}
        messageCount={messageCount}
      />
    </PremiumPaywallContext.Provider>
  );
}
