'use client';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireOnboarding?: boolean;
}

export default function ProtectedRoute({ children, requireOnboarding = true }: ProtectedRouteProps) {
  const { user, loading, isOnboardingComplete, profileLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading || profileLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (requireOnboarding && !isOnboardingComplete) {
      router.replace('/onboarding');
    }
  }, [loading, profileLoading, user, isOnboardingComplete, requireOnboarding, router]);

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={36} className="animate-spin text-white" />
          <p className="text-white/60 text-sm">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;
  if (requireOnboarding && !isOnboardingComplete) return null;

  return <>{children}</>;
}
