'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Crown, Eye, MessageCircle, Phone, ShieldCheck, Sparkles, Heart, X, Zap, Diamond } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import type { PremiumPaywallReason, PremiumPlan } from '@/contexts/PremiumPaywallContext';

interface PremiumPaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlan: (plan: PremiumPlan) => void;
  selectedPlan?: string;
  reason?: PremiumPaywallReason;
  userName?: string;
  messageCount?: number;
}

const plans: Array<{
  id: PremiumPlan;
  label: string;
  price: string;
  cadence: string;
  badge?: string;
  savings?: string;
}> = [
  { id: 'week', label: '1 WEEK', price: '$30', cadence: 'per week' },
  { id: 'month', label: '1 MONTH', price: '$199', cadence: 'per month', badge: 'MOST POPULAR', savings: 'SAVE 50%' },
  { id: '3months', label: '3 MONTHS', price: '$399', cadence: 'per 3 months', savings: 'SAVE 33%' },
];

const features = [
  { icon: MessageCircle, label: 'Unlimited\nmessages' },
  { icon: Eye, label: 'See who\nliked you' },
  { icon: Phone, label: 'Share contact\ninformation' },
  { icon: Zap, label: 'Unlimited\nlikes' },
  { icon: Diamond, label: 'Premium\nbadge' },
];

export default function PremiumPaywallModal({
  isOpen,
  onClose,
  onSelectPlan,
  selectedPlan,
  reason = 'feature',
  userName = 'your match',
  messageCount = 20,
}: PremiumPaywallModalProps) {
  const { user } = useAuth();
  const [internalSelectedPlan, setInternalSelectedPlan] = useState<PremiumPlan>('month');

  useEffect(() => {
    if (!isOpen) return;
    setInternalSelectedPlan(selectedPlan === 'week' || selectedPlan === 'month' || selectedPlan === '3months' ? selectedPlan : 'month');
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, selectedPlan]);

  const currentPlan = internalSelectedPlan;

  const headline = useMemo(() => {
    switch (reason) {
      case 'message_limit':
        return "You've exhausted your free messaging credits 💬";
      case 'contact':
        return '🔒 Contact Sharing Protected';
      case 'likes':
        return 'See who likes you';
      default:
        return 'Unlock the full Avalon experience';
    }
  }, [reason]);

  const subheadline = useMemo(() => {
    switch (reason) {
      case 'message_limit':
        return `You've used ${messageCount}/20 free messages with ${userName}. Continue the conversation with Avalon Premium.`;
      case 'contact':
        return 'To keep Avalon safe, contact details are hidden for free members. Unlock Premium to reveal and continue sharing contacts.';
      case 'likes':
        return 'Unlock Avalon Premium to see who already swiped right and discover your hidden admirers.';
      default:
        return 'Unlock Avalon Premium for unlimited messages, contact sharing, likes and more.';
    }
  }, [reason, messageCount, userName]);

  const handleSelect = () => {
    if (!user) return;
    onSelectPlan(currentPlan);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="avalon-premium-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Tinder-style backdrop: the entire app underneath is darkened and blurred. */}
          <motion.button
            type="button"
            aria-label="Close premium paywall"
            className="absolute inset-0 bg-black/70 backdrop-blur-[9px]"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            className="relative w-full sm:max-w-5xl max-h-[96vh] overflow-y-auto rounded-t-[32px] sm:rounded-[32px] text-white shadow-[0_30px_100px_rgba(0,0,0,0.75)]"
            style={{
              background: 'radial-gradient(circle at 50% 0%, rgba(124,58,237,0.16), transparent 34%), linear-gradient(160deg, #10070b 0%, #08070b 55%, #050507 100%)',
              border: '1px solid rgba(251,191,36,0.22)',
            }}
            initial={{ y: '100%', opacity: 0.7 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0.7 }}
            transition={{ type: 'spring', stiffness: 280, damping: 28 }}
          >
            <div className="relative overflow-hidden px-4 pb-6 pt-5 sm:px-8 sm:pb-8 sm:pt-6">
              <div className="absolute inset-0 pointer-events-none opacity-70" style={{ background: 'radial-gradient(circle at 50% 18%, rgba(212,175,55,0.12), transparent 32%)' }} />

              <button
                type="button"
                onClick={onClose}
                className="absolute left-4 top-4 z-20 rounded-full p-2.5 text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                aria-label="Close"
              >
                <X size={25} strokeWidth={2.2} />
              </button>

              <div className="relative z-10 text-center pt-2">
                <div className="mx-auto flex h-12 w-12 items-center justify-center text-[#F7D98A]">
                  <Crown size={42} strokeWidth={1.35} />
                </div>
                <h2 id="avalon-premium-title" className="font-display text-4xl sm:text-5xl tracking-[0.12em] text-[#F7D98A] mt-1">
                  AVALON
                </h2>
                <p className="text-[#F7D98A] text-sm sm:text-base tracking-[0.45em] font-medium">PREMIUM</p>
                <p className="mt-3 text-[10px] sm:text-xs tracking-[0.38em] text-white/45">REAL PEOPLE. MEANINGFUL CONNECTIONS.</p>

                <div className="mt-6 flex justify-center items-center -space-x-3">
                  {[0, 1, 2, 3].map((item) => (
                    <div key={item} className="h-14 w-14 sm:h-16 sm:w-16 rounded-full border-2 border-white bg-gradient-to-br from-white/20 via-purple-400/20 to-rose-500/30 overflow-hidden backdrop-blur-sm">
                      <div className="h-full w-full bg-gradient-to-br from-white/20 via-amber-200/10 to-fuchsia-500/20 blur-[5px]" />
                    </div>
                  ))}
                  <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full border-2 border-white bg-[#250d18] flex items-center justify-center text-lg sm:text-xl font-semibold text-white">+99</div>
                </div>

                <h3 className="font-display text-3xl sm:text-5xl font-semibold mt-5 text-white">
                  {headline.includes('See who') ? <>See who <span className="text-[#F7D98A]">likes you</span></> : headline}
                </h3>
                <p className="mx-auto mt-2 max-w-2xl text-sm sm:text-base leading-relaxed text-white/60">{subheadline}</p>
              </div>

              <div className="relative z-10 mt-7 grid grid-cols-5 gap-2 sm:gap-4 max-w-4xl mx-auto">
                {features.map(({ icon: Icon, label }) => (
                  <div key={label} className="text-center">
                    <div className="mx-auto flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.025] text-[#F7D98A] shadow-inner">
                      <Icon size={23} strokeWidth={1.7} />
                    </div>
                    <p className="mt-2 whitespace-pre-line text-[10px] sm:text-xs leading-tight text-white/75">{label}</p>
                  </div>
                ))}
              </div>

              <div className="relative z-10 mt-7 flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 sm:grid sm:grid-cols-3 sm:overflow-visible">
                {plans.map((plan) => {
                  const selected = currentPlan === plan.id;
                  return (
                    <button
                      type="button"
                      key={plan.id}
                      onClick={() => setInternalSelectedPlan(plan.id)}
                      className="relative min-w-[210px] sm:min-w-0 snap-center rounded-3xl px-4 py-6 text-center transition-all duration-200"
                      style={{
                        background: selected ? 'linear-gradient(160deg, rgba(92,8,31,0.72), rgba(26,9,18,0.96))' : 'linear-gradient(160deg, rgba(255,255,255,0.055), rgba(255,255,255,0.018))',
                        border: selected ? '2px solid #F7D98A' : '1px solid rgba(255,255,255,0.22)',
                        boxShadow: selected ? '0 0 34px rgba(247,217,138,0.18), inset 0 0 35px rgba(247,217,138,0.05)' : 'none',
                      }}
                    >
                      {plan.badge && (
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-[#F7D98A] bg-[#12070b] px-5 py-1 text-[11px] font-bold tracking-wide text-[#F7D98A]">
                          {plan.badge}
                        </span>
                      )}
                      <p className="text-sm font-semibold tracking-[0.18em] text-white/90">{plan.label}</p>
                      <p className="mt-4 text-3xl sm:text-4xl font-semibold text-white">{plan.price}</p>
                      <p className="mt-1 text-xs text-white/70">{plan.cadence}</p>
                      <div className="h-8 mt-2 flex items-center justify-center">
                        {plan.savings && <span className="rounded-full bg-gradient-to-r from-[#7E1738] to-[#A51D4B] px-4 py-1 text-xs font-bold text-white">{plan.savings}</span>}
                      </div>
                      <div className={`mx-auto mt-3 h-5 w-5 rounded-full border-2 ${selected ? 'border-[#F7D98A] p-1' : 'border-white/65'}`}>
                        {selected && <div className="h-full w-full rounded-full bg-[#F7D98A]" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="relative z-10 mt-5 flex justify-center">
                <motion.button
                  type="button"
                  onClick={handleSelect}
                  whileTap={{ scale: 0.985 }}
                  className="w-full max-w-3xl rounded-full px-6 py-4 sm:py-5 text-base sm:text-lg font-bold text-black shadow-[0_10px_40px_rgba(247,217,138,0.25)]"
                  style={{ background: 'linear-gradient(135deg, #F7D98A 0%, #F0B83D 48%, #D99A28 100%)' }}
                >
                  Unlock Avalon Premium <span className="ml-2 text-xl">→</span>
                </motion.button>
              </div>

              <div className="relative z-10 mx-auto mt-5 grid max-w-3xl grid-cols-3 gap-3 text-center text-[10px] sm:text-xs text-white/65">
                <div className="flex flex-col items-center gap-1"><ShieldCheck size={21} className="text-white" />Secure payment</div>
                <div className="flex flex-col items-center gap-1"><Heart size={21} className="text-white" />Cancel anytime</div>
                <div className="flex flex-col items-center gap-1"><Sparkles size={21} className="text-white" />Privacy protected</div>
              </div>

              <p className="relative z-10 mx-auto mt-4 max-w-3xl text-center text-[9px] sm:text-[10px] leading-relaxed text-white/35">
                Recurring billing. Cancel anytime. You won&apos;t be charged until you confirm your purchase. By continuing, you agree to Avalon&apos;s Terms of Service and Privacy Policy.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
