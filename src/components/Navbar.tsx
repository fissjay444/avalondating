'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import AppLogo from '@/components/ui/AppLogo';
import { Bell, Menu, X, LogOut, User, Settings, Heart, MessageCircle, Search, Compass, Activity } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/useMatches';

const publicNavLinks = [
  { label: 'Discover', href: '/discover', key: 'nav-discover' },
  { label: 'Browse', href: '/browse', key: 'nav-browse' },
  { label: 'Matches', href: '/matches', key: 'nav-matches' },
  { label: 'Messages', href: '/chat', key: 'nav-messages' },
];

const authNavLinks = [
  { label: 'Discover', href: '/discover', key: 'nav-discover', icon: Compass },
  { label: 'Browse', href: '/browse', key: 'nav-browse', icon: Search },
  { label: 'Matches', href: '/matches', key: 'nav-matches', icon: Heart },
  { label: 'Chat', href: '/chat', key: 'nav-chat', icon: MessageCircle },
  { label: 'Activity', href: '/activity', key: 'nav-activity', icon: Activity },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const { user, profile, signOut, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const { unreadCount, fetchUnreadCount } = useNotifications();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch unread notification count when user is authenticated
  useEffect(() => {
    if (!user) return;
    fetchUnreadCount();
    // Poll every 60 seconds for new notifications
    const interval = setInterval(fetchUnreadCount, 60_000);
    return () => clearInterval(interval);
  }, [user, fetchUnreadCount]);

  // Close menus on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-profile-menu]')) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      setProfileMenuOpen(false);
      setMobileOpen(false);
      router.push('/');
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  const isAuthenticated = !loading && !!user;

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'glass-dark shadow-glow-purple py-2' : 'bg-transparent py-4'
        }`}
      >
        <div className="max-w-screen-2xl mx-auto px-6 lg:px-10 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <AppLogo size={36} />
            <div className="flex flex-col leading-tight">
              <span className="font-display font-bold text-white text-lg tracking-tight">Avalon</span>
              <span className="text-gold font-bold text-sm tracking-wide -mt-1">Dating</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {(isAuthenticated ? authNavLinks : publicNavLinks).map((link) => (
              <Link
                key={link.key}
                href={link.href}
                className={`nav-link${pathname === link.href ? ' nav-link-active' : ''}`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Actions */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {/* Notification bell — linked to matches page with real unread count */}
                <Link
                  href="/matches"
                  className="relative p-2 rounded-full glass text-white hover:text-gold transition-colors"
                  aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span
                      className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full flex items-center justify-center text-white text-[9px] font-bold px-0.5"
                      style={{ background: 'linear-gradient(135deg, #7C3AED, #EC4899)' }}
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>

                {/* Profile menu */}
                <div className="relative" data-profile-menu>
                  <button
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                    className="flex items-center gap-2 glass rounded-full px-3 py-2 hover:bg-white/10 transition-all"
                    data-profile-menu
                  >
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center text-white text-xs font-bold">
                      {profile?.first_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <span className="text-white text-sm font-medium max-w-[100px] truncate">
                      {profile?.first_name || 'Profile'}
                    </span>
                  </button>

                  {profileMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-52 glass-dark rounded-2xl border border-white/15 overflow-hidden shadow-2xl" data-profile-menu>
                      <Link href="/profile" onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-white/80 hover:text-white hover:bg-white/10 transition-all text-sm">
                        <User size={16} />
                        My Profile
                      </Link>
                      <Link href="/settings" onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-white/80 hover:text-white hover:bg-white/10 transition-all text-sm">
                        <Settings size={16} />
                        Settings
                      </Link>
                      <div className="h-px bg-white/10 mx-3" />
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all text-sm"
                      >
                        <LogOut size={16} />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <button className="relative p-2 rounded-full glass text-white hover:text-gold transition-colors">
                  <Bell size={18} />
                </button>
                <Link href="/login" className="btn-outline-white px-5 py-2 text-sm font-semibold">
                  Log In
                </Link>
                <Link href="/signup" className="btn-primary px-5 py-2 text-sm font-semibold">
                  Join Free ✨
                </Link>
                <Link href="/signup" className="btn-gold px-4 py-2 text-xs font-bold uppercase tracking-wider">
                  Premium
                </Link>
              </>
            )}
          </div>

          {/* Mobile Hamburger */}
          <button
            className="md:hidden p-2 rounded-xl glass text-white"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden glass-dark border-t border-border mt-2 py-4 px-6 flex flex-col gap-4">
            {(isAuthenticated ? authNavLinks : publicNavLinks).map((link) => (
              <Link
                key={link.key}
                href={link.href}
                className={`text-white font-medium text-base py-2 border-b border-border${pathname === link.href ? ' text-accent' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            {isAuthenticated ? (
              <div className="flex flex-col gap-3 pt-2">
                <Link href="/profile" onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 py-2 text-white/80 text-sm">
                  <User size={16} />
                  My Profile ({profile?.first_name || 'Profile'})
                </Link>
                <Link href="/settings" onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 py-2 text-white/80 text-sm">
                  <Settings size={16} />
                  Settings
                </Link>
                <Link href="/matches" onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 py-2 text-white/80 text-sm">
                  <Bell size={16} />
                  Notifications {unreadCount > 0 && <span className="ml-1 text-xs text-accent font-bold">({unreadCount})</span>}
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-3 py-2 text-red-400 text-sm"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3 pt-2">
                <Link href="/login" className="btn-outline-white py-3 text-center text-sm font-semibold" onClick={() => setMobileOpen(false)}>
                  Log In
                </Link>
                <Link href="/signup" className="btn-primary py-3 text-center text-sm font-semibold" onClick={() => setMobileOpen(false)}>
                  Join Free ✨
                </Link>
              </div>
            )}
          </div>
        )}
      </nav>
    </>
  );
}