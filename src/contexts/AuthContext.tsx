'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface Profile {
  id: string;
  first_name: string | null;
  date_of_birth: string | null;
  gender: string | null;
  looking_for: string | null;
  city: string | null;
  country: string | null;
  bio: string | null;
  is_verified: boolean;
  is_online: boolean;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  profileLoading: boolean;
  isOnboardingComplete: boolean;
  signUp: (email: string, password: string, signupData?: { fullName: string; age: number; dateOfBirth: string }) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

function checkOnboardingComplete(profile: Profile | null, photoCount: number): boolean {
  if (!profile) return false;
  return !!(
    profile.first_name &&
    profile.date_of_birth &&
    profile.gender &&
    profile.looking_for &&
    profile.city &&
    profile.country &&
    profile.bio &&
    photoCount >= 3
  );
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const supabase = createClient();

  const fetchProfile = useCallback(async (userId: string) => {
    setProfileLoading(true);
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        console.error('Profile fetch error:', profileError.message);
        setProfile(null);
        setIsOnboardingComplete(false);
        return;
      }

      if (!profileData) {
        setProfile(null);
        setIsOnboardingComplete(false);
        return;
      }

      setProfile(profileData as Profile);

      // Check photo count
      const { count } = await supabase
        .from('profile_photos')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      setIsOnboardingComplete(checkOnboardingComplete(profileData as Profile, count ?? 0));
    } catch (err) {
      console.error('fetchProfile error:', err);
      setProfile(null);
      setIsOnboardingComplete(false);
    } finally {
      setProfileLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => {
          if (mounted) setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setIsOnboardingComplete(false);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile, supabase.auth]);

  const signUp = async (
    email: string,
    password: string,
    signupData?: { fullName: string; age: number; dateOfBirth: string }
  ) => {
    const fullName = signupData?.fullName?.trim() || '';
    const firstName = fullName.split(/\s+/)[0] || '';

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          first_name: firstName,
          age: signupData?.age ?? null,
          date_of_birth: signupData?.dateOfBirth || null,
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/auth/callback`,
      },
    });
    if (error) throw error;
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      throw new Error('User already registered');
    }

    // With email confirmation enabled, Supabase intentionally returns no session
    // until the user verifies the one-time code. The signup page therefore sends
    // the user to /verify-email instead of granting access immediately.
    if (data.user && data.session && signupData) {
      await supabase
        .from('profiles')
        .update({
          first_name: firstName,
          date_of_birth: signupData.dateOfBirth,
        })
        .eq('id', data.user.id);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    // Log sign-in activity (fire-and-forget)
    try {
      await (supabase as any).rpc('log_activity', { p_event_type: 'signed_in', p_metadata: {} });
    } catch { /* non-critical */ }
  };


  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setProfile(null);
    setIsOnboardingComplete(false);
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/auth/callback?next=/auth/reset-password`,
    });
    if (error) throw error;
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        profileLoading,
        isOnboardingComplete,
        signUp,
        signIn,
        signOut,
        resetPassword,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
