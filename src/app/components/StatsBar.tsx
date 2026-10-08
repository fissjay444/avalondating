'use client';
import React, { useEffect, useRef, useState } from 'react';

const stats = [
  { id: 'stat-members', value: '2.4M', label: 'Active Members', icon: '👥' },
  { id: 'stat-matches', value: '840K', label: 'Matches Made', icon: '💞' },
  { id: 'stat-verified', value: '98%', label: 'Verified Profiles', icon: '✅' },
  { id: 'stat-countries', value: '45+', label: 'Countries', icon: '🌍' },
  { id: 'stat-online', value: '12K+', label: 'Online Right Now', icon: '🟢' },
];

export default function StatsBar() {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.3 }
    );
    if (ref?.current) observer?.observe(ref?.current);
    return () => observer?.disconnect();
  }, []);

  return (
    <div ref={ref} className="relative py-10 overflow-hidden">
      <div className="section-divider absolute top-0 left-0 right-0" />
      <div className="section-divider absolute bottom-0 left-0 right-0" />

      <div className="max-w-screen-2xl mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
          {stats?.map((s, i) => (
            <div
              key={s?.id}
              className={`text-center transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div className="text-2xl mb-1">{s?.icon}</div>
              <div className="font-display font-bold text-2xl lg:text-3xl text-gold tabular-nums">{s?.value}</div>
              <div className="text-white/60 text-sm font-medium mt-0.5">{s?.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}