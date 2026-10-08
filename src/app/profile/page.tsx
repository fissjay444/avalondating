'use client';
import React from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import ProfileCompletenessWidget from '@/components/profile/ProfileCompletenessWidget';

export default function ProfilePage() {
  const { user, profile, loading, isOnboardingComplete } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router?.replace('/login');
    }
    if (!loading && user && !isOnboardingComplete) {
      router?.replace('/onboarding');
    }
  }, [loading, user, isOnboardingComplete, router]);

  if (loading) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-white" />
      </div>
    );
  }

  if (!user || !profile) return null;

  return (
    <div className="min-h-screen gradient-hero">
      <Navbar />
      <div className="pt-24 pb-16 px-6 max-w-2xl mx-auto">
        {/* Profile Card */}
        <div className="glass rounded-3xl p-8 text-center mb-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">
            {profile?.first_name?.[0]?.toUpperCase() || 'U'}
          </div>
          <h1 className="font-display font-bold text-white text-3xl mb-1">
            {profile?.first_name || 'Your Profile'}
          </h1>
          {profile?.city && profile?.country && (
            <p className="text-white/60 text-sm mb-4">📍 {profile?.city}, {profile?.country}</p>
          )}
          {profile?.bio && (
            <p className="text-white/80 text-sm leading-relaxed mb-6 max-w-md mx-auto">{profile?.bio}</p>
          )}
          <div className="flex gap-3 justify-center flex-wrap">
            <a href="/onboarding" className="btn-primary px-6 py-3 text-sm font-semibold">
              Edit Profile
            </a>
            <a href="/settings" className="btn-outline-white px-6 py-3 text-sm font-semibold">
              Settings
            </a>
            <a href="/activity" className="btn-outline-white px-6 py-3 text-sm font-semibold">
              My Activity
            </a>
          </div>
        </div>

        {/* Profile Completeness */}
        <ProfileCompletenessWidget />
      </div>
    </div>
  );
}
