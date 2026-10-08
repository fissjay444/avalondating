'use client';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import FloatingHearts from '@/app/components/FloatingHearts';
import AppLogo from '@/components/ui/AppLogo';

type SignupData = {
  fullName: string;
  age: number;
  dateOfBirth: string;
  email: string;
  password: string;
  confirmPassword: string;
  terms: boolean;
};

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  const { signUp } = useAuth();
  const router = useRouter();

  const { register, handleSubmit, watch, formState: { errors } } = useForm<SignupData>();
  const password = watch('password');
  const dateOfBirth = watch('dateOfBirth');

  const getErrorMessage = (error: Error & { message?: string }) => {
    const msg = error?.message?.toLowerCase() || '';
    if (msg.includes('user already registered') || msg.includes('already exists')) {
      return 'An account with this email already exists. Please sign in.';
    }
    if (msg.includes('password') && msg.includes('weak')) {
      return 'Password is too weak. Use at least 8 characters with a number.';
    }
    if (msg.includes('invalid email')) {
      return 'Please enter a valid email address.';
    }
    if (msg.includes('network') || msg.includes('fetch')) {
      return 'Network error. Please check your connection and try again.';
    }
    return 'Account creation failed. Please try again.';
  };

  const calculateAge = (dob: string): number => {
    const birth = new Date(`${dob}T00:00:00`);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const onSubmit = async (data: SignupData) => {
    setLoading(true);
    setAuthError('');
    try {
      const dobAge = calculateAge(data.dateOfBirth);
      const enteredAge = Number(data.age);

      if (enteredAge < 18 || dobAge < 18) {
        setAuthError('You must be at least 18 years old to use Avalon Dating.');
        return;
      }

      if (enteredAge !== dobAge) {
        setAuthError('Your age does not match your date of birth.');
        return;
      }

      const nameParts = data.fullName.trim().split(/\s+/);
      if (nameParts.length < 2) {
        setAuthError('Please enter your full name (first and last name).');
        return;
      }

      await signUp(data.email, data.password, {
        fullName: data.fullName,
        age: enteredAge,
        dateOfBirth: data.dateOfBirth,
      });
      router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
    } catch (err: unknown) {
      setAuthError(getErrorMessage(err as Error & { message?: string }));
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex gradient-hero overflow-hidden">
      {/* Left brand panel */}
      <div className="hidden lg:flex flex-col justify-center items-center w-1/2 xl:w-[55%] relative px-12 xl:px-20 py-16">
        <FloatingHearts />
        <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.2) 0%, transparent 70%)' }} />
        <div className="absolute bottom-1/3 right-1/4 w-60 h-60 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.12) 0%, transparent 70%)' }} />
        <div className="relative z-10 text-center max-w-md">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="relative w-20 h-20">
              <svg viewBox="0 0 80 80" className="w-full h-full drop-shadow-2xl" fill="none">
                <defs>
                  <radialGradient id="heartGradSignup" cx="50%" cy="30%" r="70%">
                    <stop offset="0%" stopColor="#9333EA" />
                    <stop offset="60%" stopColor="#7C3AED" />
                    <stop offset="100%" stopColor="#4C1D95" />
                  </radialGradient>
                  <radialGradient id="goldRingSignup" cx="50%" cy="30%" r="70%">
                    <stop offset="0%" stopColor="#FBBF24" />
                    <stop offset="100%" stopColor="#D4AF37" />
                  </radialGradient>
                </defs>
                <path d="M40 68 C40 68 8 48 8 26 C8 16 16 8 26 8 C32 8 38 12 40 18 C42 12 48 8 54 8 C64 8 72 16 72 26 C72 48 40 68 40 68Z" fill="url(#heartGradSignup)" />
                <path d="M40 62 C40 62 12 44 12 26 C12 18 18 12 26 12 C31 12 36 15 38 20" stroke="url(#goldRingSignup)" strokeWidth="3.5" fill="none" strokeLinecap="round" />
                <path d="M42 20 C44 15 49 12 54 12 C62 12 68 18 68 26 C68 44 40 62 40 62" stroke="url(#goldRingSignup)" strokeWidth="3.5" fill="none" strokeLinecap="round" />
                <circle cx="40" cy="10" r="2.5" fill="#FBBF24" opacity="0.9" />
              </svg>
            </div>
            <div className="text-left">
              <div className="font-display font-bold text-white leading-none" style={{ fontSize: '2.8rem' }}>Avalon</div>
              <div className="font-display font-bold text-gold leading-none" style={{ fontSize: '2.2rem' }}>Dating</div>
            </div>
          </div>
          <p className="text-white/70 text-sm tracking-[0.25em] uppercase font-medium mb-4">
            Real People · Real Connections · A Brighter Tomorrow
          </p>
          <p className="font-script text-white text-2xl mb-10">Love is closer than you think ♡</p>
          <div className="flex flex-col gap-3">
            {[
              { id: 'f-v', icon: '✅', text: '100% Verified Profiles' },
              { id: 'f-s', icon: '🛡️', text: 'Safe & Secure Platform' },
              { id: 'f-m', icon: '💞', text: '840K+ Matches Made' },
            ].map((f) => (
              <div key={f.id} className="flex items-center gap-3 glass rounded-full px-5 py-3 text-left">
                <span className="text-lg">{f.icon}</span>
                <span className="text-white/90 text-sm font-medium">{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 lg:w-1/2 xl:w-[45%] flex items-center justify-center px-6 py-16 relative">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <AppLogo size={36} />
            <div>
              <div className="font-display font-bold text-white text-xl">Avalon</div>
              <div className="text-gold font-bold text-sm -mt-1">Dating</div>
            </div>
          </div>

          {/* Tab switcher */}
          <div className="glass rounded-2xl p-1 flex mb-8">
            <Link href="/login" className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-200 text-white/60 hover:text-white text-center">
              Sign In
            </Link>
            <Link href="/signup" className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-200 btn-primary shadow-glow-pink text-center">
              Create Account
            </Link>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <div>
              <h1 className="font-display font-bold text-white text-2xl">Create your account 💜</h1>
              <p className="text-white/50 text-sm mt-1">Join millions of singles finding real love</p>
              <div className="mt-3 inline-flex self-start rounded-full px-3 py-1.5 text-xs font-semibold text-white/80" style={{ background: 'rgba(236,72,153,0.12)', border: '1px solid rgba(236,72,153,0.22)' }}>💜 Straight dating • Women & men welcome</div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-white/15" />
              <span className="text-white/40 text-xs">Register with email</span>
              <div className="flex-1 h-px bg-white/15" />
            </div>

            {authError && (
              <div className="rounded-xl p-3 text-sm text-white font-medium"
                style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
                {authError}
              </div>
            )}

            {/* Full Name */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="signup-fullname" className="text-white/80 text-sm font-medium">Full Name</label>
              <input
                id="signup-fullname"
                type="text"
                className="input-field"
                placeholder="Your first and last name"
                autoComplete="name"
                {...register('fullName', {
                  required: 'Full name is required',
                  validate: value =>
                    value.trim().split(/\s+/).length >= 2 || 'Please enter your first and last name',
                })}
              />
              {errors.fullName && <p className="text-red-400 text-xs">{errors.fullName.message}</p>}
            </div>

            {/* Age */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="signup-age" className="text-white/80 text-sm font-medium">Age</label>
              <input
                id="signup-age"
                type="number"
                min={18}
                max={120}
                className="input-field"
                placeholder="Your age"
                {...register('age', {
                  required: 'Age is required',
                  valueAsNumber: true,
                  min: { value: 18, message: 'You must be at least 18' },
                  max: { value: 120, message: 'Please enter a valid age' },
                })}
              />
              {errors.age && <p className="text-red-400 text-xs">{errors.age.message}</p>}
            </div>

            {/* Date of Birth */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="signup-dob" className="text-white/80 text-sm font-medium">Date of Birth</label>
              <input
                id="signup-dob"
                type="date"
                className="input-field"
                max={new Date().toISOString().split('T')[0]}
                {...register('dateOfBirth', {
                  required: 'Date of birth is required',
                  validate: value => calculateAge(value) >= 18 || 'You must be at least 18 years old',
                })}
              />
              {errors.dateOfBirth && <p className="text-red-400 text-xs">{errors.dateOfBirth.message}</p>}
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="signup-email" className="text-white/80 text-sm font-medium">Email address</label>
              <input
                id="signup-email"
                type="email"
                className="input-field"
                placeholder="you@example.com"
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email' },
                })}
              />
              {errors.email && <p className="text-red-400 text-xs">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="signup-password" className="text-white/80 text-sm font-medium">Password</label>
              <p className="text-white/40 text-xs -mt-1">At least 8 characters with a number</p>
              <div className="relative">
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  className="input-field pr-12"
                  placeholder="Create a strong password"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 8, message: 'At least 8 characters' },
                    pattern: { value: /(?=.*\d)/, message: 'Must include at least one number' },
                  })}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs">{errors.password.message}</p>}
            </div>

            {/* Confirm Password */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="signup-confirm" className="text-white/80 text-sm font-medium">Confirm password</label>
              <div className="relative">
                <input
                  id="signup-confirm"
                  type={showConfirm ? 'text' : 'password'}
                  className="input-field pr-12"
                  placeholder="Repeat your password"
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: v => v === password || 'Passwords do not match',
                  })}
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
                  aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}>
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-red-400 text-xs">{errors.confirmPassword.message}</p>}
            </div>

            {/* Terms */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                className="w-4 h-4 rounded accent-purple-600 mt-0.5 flex-shrink-0"
                {...register('terms', { required: 'You must accept the terms' })}
              />
              <span className="text-white/60 text-xs leading-relaxed group-hover:text-white/80 transition-colors">
                I agree to the{' '}
                <span className="text-accent hover:underline cursor-pointer">Terms of Service</span>
                {' '}and{' '}
                <span className="text-accent hover:underline cursor-pointer">Privacy Policy</span>
              </span>
            </label>
            {errors.terms && <p className="text-red-400 text-xs -mt-3">{errors.terms.message}</p>}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary py-4 font-bold text-base flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              style={{ minHeight: '52px' }}
            >
              {loading ? (
                <><Loader2 size={18} className="animate-spin" /><span>Creating account...</span></>
              ) : "Create Account — It's Free ❤️"}
            </button>

            <p className="text-center text-white/50 text-sm">
              Already have an account?{' '}
              <Link href="/login" className="text-accent hover:underline font-medium">Sign in</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
