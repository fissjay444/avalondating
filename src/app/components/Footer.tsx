import React from 'react';
import Link from 'next/link';
import AppLogo from '@/components/ui/AppLogo';

const footerLinks = [
  {
    id: 'col-company',
    title: 'Company',
    links: [
      { id: 'f-about', label: 'About Us', href: '#' },
      { id: 'f-careers', label: 'Careers', href: '#' },
      { id: 'f-press', label: 'Press', href: '#' },
      { id: 'f-blog', label: 'Blog', href: '#' },
    ],
  },
  {
    id: 'col-product',
    title: 'Product',
    links: [
      { id: 'f-discover', label: 'Discover', href: '/discover' },
      { id: 'f-premium', label: 'Premium', href: '#' },
      { id: 'f-safety', label: 'Safety Center', href: '#' },
      { id: 'f-download', label: 'Download App', href: '#' },
    ],
  },
  {
    id: 'col-support',
    title: 'Support',
    links: [
      { id: 'f-help', label: 'Help Center', href: '#' },
      { id: 'f-contact', label: 'Contact Us', href: '#' },
      { id: 'f-community', label: 'Community', href: '#' },
      { id: 'f-trust', label: 'Trust & Safety', href: '#' },
    ],
  },
  {
    id: 'col-legal',
    title: 'Legal',
    links: [
      { id: 'f-privacy', label: 'Privacy Policy', href: '#' },
      { id: 'f-terms', label: 'Terms of Service', href: '#' },
      { id: 'f-cookies', label: 'Cookie Policy', href: '#' },
      { id: 'f-gdpr', label: 'GDPR', href: '#' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/10 py-14 px-6 lg:px-10">
      <div className="max-w-screen-2xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 mb-12">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <AppLogo size={32} />
              <div>
                <div className="font-display font-bold text-white text-base">Avalon</div>
                <div className="text-gold font-bold text-xs -mt-0.5">Dating</div>
              </div>
            </div>
            <p className="text-white/50 text-sm leading-relaxed mb-4">
              Real People. Real Connections. A Brighter Tomorrow.
            </p>
            <p className="font-script text-accent text-base">Love is closer than you think ♡</p>
          </div>

          {footerLinks?.map((col) => (
            <div key={col?.id}>
              <h4 className="text-white font-semibold text-sm mb-4 tracking-wide uppercase">{col?.title}</h4>
              <ul className="flex flex-col gap-2">
                {col?.links?.map((l) => (
                  <li key={l?.id}>
                    <Link href={l?.href} className="text-white/50 hover:text-white text-sm transition-colors">
                      {l?.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="section-divider mb-6" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-white/40 text-xs">
          <p>© 2026 Avalon Dating. All rights reserved.</p>
          <div className="flex items-center gap-1">
            <span>Made with</span>
            <span className="text-accent">❤️</span>
            <span>for real connections worldwide</span>
          </div>
        </div>
      </div>
    </footer>
  );
}