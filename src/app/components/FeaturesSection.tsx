import React from 'react';
import Link from 'next/link';

const features = [
  {
    id: 'feat-verified',
    icon: '✅',
    title: 'Verified Profiles',
    desc: 'Every profile goes through our multi-step verification — photo ID, selfie match, and activity checks. No bots, no fakes.',
    gradient: 'from-purple-600/30 to-purple-900/30',
  },
  {
    id: 'feat-match',
    icon: '💞',
    title: 'Smart Matching',
    desc: 'Our compatibility engine learns your preferences and surfaces the most meaningful connections — not just attractive faces.',
    gradient: 'from-pink-600/30 to-purple-800/30',
  },
  {
    id: 'feat-chat',
    icon: '💬',
    title: 'Premium Chat',
    desc: 'End-to-end encrypted messaging with voice notes, photo sharing, reactions, and GIFs. Conversations that feel real.',
    gradient: 'from-purple-700/30 to-pink-800/30',
  },
  {
    id: 'feat-safety',
    icon: '🛡️',
    title: 'Safety First',
    desc: 'Block, report, unmatch, and incognito mode. Our safety team monitors activity 24/7 to keep the community safe.',
    gradient: 'from-indigo-600/30 to-purple-900/30',
  },
  {
    id: 'feat-premium',
    icon: '👑',
    title: 'Premium Features',
    desc: 'See who liked you, unlimited super likes, profile boosts, and priority placement in discovery queues.',
    gradient: 'from-yellow-600/30 to-purple-800/30',
  },
  {
    id: 'feat-global',
    icon: '🌍',
    title: 'Global Community',
    desc: 'Connect across 45+ countries. Filter by distance, language, or culture. Your match might be around the corner — or across the world.',
    gradient: 'from-purple-600/30 to-indigo-900/30',
  },
];

export default function FeaturesSection() {
  return (
    <section className="py-20 px-6 lg:px-10 max-w-screen-2xl mx-auto">
      <div className="text-center mb-14">
        <p className="text-accent font-medium text-sm tracking-widest uppercase mb-3">Why Avalon Dating</p>
        <h2 className="font-display font-bold text-3xl lg:text-5xl text-white leading-tight">
          Built for Real Connections
        </h2>
        <p className="text-white/60 text-base lg:text-lg mt-4 max-w-2xl mx-auto">
          Every feature is designed to remove friction and create the conditions where real romance can grow.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 xl:gap-8">
        {features?.map((f) => (
          <div
            key={f?.id}
            className={`glass rounded-2xl p-6 lg:p-8 bg-gradient-to-br ${f?.gradient} hover:scale-[1.02] transition-all duration-300 group cursor-default`}
          >
            <div className="text-4xl mb-4">{f?.icon}</div>
            <h3 className="font-display font-semibold text-white text-xl mb-3 group-hover:text-gold transition-colors">
              {f?.title}
            </h3>
            <p className="text-white/65 text-sm leading-relaxed">{f?.desc}</p>
          </div>
        ))}
      </div>

      <div className="text-center mt-14">
        <Link href="/signup" className="btn-primary px-12 py-4 text-base font-bold inline-block">
          Start Your Journey ✨
        </Link>
      </div>
    </section>
  );
}