'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Loader2, Upload, X, Check, GripVertical } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const TOTAL_STEPS = 9;
const BIO_MAX_CHARS = 300;

const GENDERS = [
  { value: 'woman', label: 'Woman', emoji: '👩' },
  { value: 'man', label: 'Man', emoji: '👨' },
];

const LOOKING_FOR = [
  { value: 'men', label: 'Men', emoji: '👨' },
  { value: 'women', label: 'Women', emoji: '👩' },
];

const RELATIONSHIP_INTENTIONS = [
  'Long-term relationship',
  'Casual dating',
  'Friendship',
  'Marriage',
  'Not sure yet',
];

interface PhotoItem {
  id: string;
  file: File;
  previewUrl: string;
  isPrimary: boolean;
  uploading: boolean;
  storagePath?: string;
}

interface Interest {
  id: string;
  name: string;
}

function calculateAge(dob: string): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export default function OnboardingPage() {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();
  const supabase = createClient();

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Step data
  const [firstName, setFirstName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [ageError, setAgeError] = useState('');
  const [gender, setGender] = useState('');
  const [lookingFor, setLookingFor] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [bio, setBio] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [availableInterests, setAvailableInterests] = useState<Interest[]>([]);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [minAge, setMinAge] = useState(18);
  const [maxAge, setMaxAge] = useState(45);
  const [maxDistance, setMaxDistance] = useState(50);
  const [preferredGender, setPreferredGender] = useState('');
  const [relationshipIntention, setRelationshipIntention] = useState('');
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Avalon is currently a straight dating platform: women discover men and men discover women.
  useEffect(() => {
    if (gender === 'woman') {
      setLookingFor('men');
      setPreferredGender('men');
    } else if (gender === 'man') {
      setLookingFor('women');
      setPreferredGender('women');
    }
  }, [gender]);

  // Load interests from Supabase
  useEffect(() => {
    const loadInterests = async () => {
      const { data } = await supabase.from('interests').select('id, name').order('name');
      if (data) setAvailableInterests(data);
    };
    loadInterests();
  }, [supabase]);

  // Load existing profile data
  useEffect(() => {
    if (!user) return;
    const loadProfile = async () => {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
      const metadata = user.user_metadata || {};

      if (data) {
        if (data.first_name) setFirstName(data.first_name);
        if (data.date_of_birth) setDateOfBirth(data.date_of_birth);
        if (data.gender) setGender(data.gender);
        if (data.looking_for) setLookingFor(data.looking_for);
        if (data.country) setCountry(data.country);
        if (data.city) setCity(data.city);
        if (data.bio) setBio(data.bio);
      }

      // Carry the signup information forward after email verification.
      // Prefer the profile values when available, then fall back to Supabase Auth metadata.
      if (!data?.first_name && metadata.first_name) {
        setFirstName(String(metadata.first_name));
      }
      if (!data?.date_of_birth && metadata.date_of_birth) {
        setDateOfBirth(String(metadata.date_of_birth));
      }
    };
    loadProfile();
  }, [user, supabase]);

  const validateStep = (): boolean => {
    setError('');
    switch (step) {
      case 1:
        if (!firstName.trim()) { setError('First name is required.'); return false; }
        return true;
      case 2:
        if (!dateOfBirth) { setError('Date of birth is required.'); return false; }
        let age = calculateAge(dateOfBirth);
        if (age < 18) { setAgeError('You must be at least 18 years old to use Avalon Dating.'); return false; }
        setAgeError('');
        return true;
      case 3:
        if (!gender) { setError('Please select your gender.'); return false; }
        return true;
      case 4:
        if (!lookingFor) { setError('Please select who you are looking for.'); return false; }
        return true;
      case 5:
        if (!country.trim()) { setError('Country is required.'); return false; }
        if (!city.trim()) { setError('City is required.'); return false; }
        return true;
      case 6:
        if (!bio.trim()) { setError('Please write a short bio.'); return false; }
        if (bio.length > BIO_MAX_CHARS) { setError(`Bio must be under ${BIO_MAX_CHARS} characters.`); return false; }
        return true;
      case 7:
        if (selectedInterests.length === 0) { setError('Please select at least one interest.'); return false; }
        return true;
      case 8:
        if (!preferredGender) { setError('Please select your preferred gender.'); return false; }
        if (!relationshipIntention) { setError('Please select your relationship intention.'); return false; }
        return true;
      case 9:
        if (photos.length < 3) { setError('Please upload at least 3 profile photos.'); return false; }
        return true;
      default:
        return true;
    }
  };

  const saveCurrentStep = async () => {
    if (!user) return;
    setSaving(true);
    setError('');
    try {
      if (step <= 6) {
        const updates: Record<string, unknown> = {};
        if (step === 1) updates.first_name = firstName.trim();
        if (step === 2) updates.date_of_birth = dateOfBirth;
        if (step === 3) updates.gender = gender;
        if (step === 4) updates.looking_for = lookingFor;
        if (step === 5) { updates.country = country.trim(); updates.city = city.trim(); }
        if (step === 6) updates.bio = bio.trim();

        const { error: updateError } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', user.id);
        if (updateError) throw updateError;
      }

      if (step === 7) {
        // Save interests
        await supabase.from('user_interests').delete().eq('user_id', user.id);
        if (selectedInterests.length > 0) {
          const inserts = selectedInterests.map(id => ({ user_id: user.id, interest_id: id }));
          const { error: intError } = await supabase.from('user_interests').insert(inserts);
          if (intError) throw intError;
        }
      }

      if (step === 8) {
        const { error: prefError } = await supabase
          .from('dating_preferences')
          .upsert({
            user_id: user.id,
            min_age: minAge,
            max_age: maxAge,
            max_distance_km: maxDistance,
            preferred_gender: preferredGender,
            relationship_intention: relationshipIntention,
          }, { onConflict: 'user_id' });
        if (prefError) throw prefError;
      }
    } catch (err: unknown) {
      const e = err as Error;
      setError(e?.message || 'Failed to save. Please try again.');
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async () => {
    if (!validateStep()) return;
    try {
      await saveCurrentStep();
      setStep(s => s + 1);
    } catch {
      // error already set
    }
  };

  const handleBack = () => {
    setError('');
    setStep(s => Math.max(s - 1, 1));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !user) return;
    const remaining = 6 - photos.length;
    const filesToAdd = Array.from(files).slice(0, remaining);

    const newPhotos: PhotoItem[] = filesToAdd.map(file => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      previewUrl: URL.createObjectURL(file),
      isPrimary: photos.length === 0,
      uploading: true,
    }));

    setPhotos(prev => [...prev, ...newPhotos]);

    // Upload each photo
    for (const photo of newPhotos) {
      try {
        const ext = photo.file.name.split('.').pop() || 'jpg';
        const storagePath = `${user.id}/${photo.id}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('profile-photos')
          .upload(storagePath, photo.file, { upsert: false });

        if (uploadError) throw uploadError;

        setPhotos(prev => prev.map(p =>
          p.id === photo.id ? { ...p, uploading: false, storagePath } : p
        ));
      } catch (err: unknown) {
        const e = err as Error;
        setPhotos(prev => prev.filter(p => p.id !== photo.id));
        setError(`Failed to upload photo: ${e?.message || 'Unknown error'}`);
      }
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePhoto = async (photoId: string) => {
    const photo = photos.find(p => p.id === photoId);
    if (!photo) return;

    if (photo.storagePath) {
      await supabase.storage.from('profile-photos').remove([photo.storagePath]);
    }

    const remaining = photos.filter(p => p.id !== photoId);
    // If removed was primary, make first remaining primary
    if (photo.isPrimary && remaining.length > 0) {
      remaining[0].isPrimary = true;
    }
    setPhotos(remaining);
  };

  const setPrimaryPhoto = (photoId: string) => {
    setPhotos(prev => prev.map(p => ({ ...p, isPrimary: p.id === photoId })));
  };

  const handleDragStart = (index: number) => setDragIndex(index);
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    const reordered = [...photos];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(index, 0, moved);
    setPhotos(reordered);
    setDragIndex(index);
  };
  const handleDragEnd = () => setDragIndex(null);

  const handleCompleteOnboarding = async () => {
    if (!validateStep()) return;
    if (!user) return;
    setSaving(true);
    setError('');
    try {
      // Save profile_photos records
      await supabase.from('profile_photos').delete().eq('user_id', user.id);
      const photoInserts = photos
        .filter(p => p.storagePath)
        .map((p, idx) => ({
          user_id: user.id,
          storage_path: p.storagePath!,
          display_order: idx,
          is_primary: p.isPrimary,
        }));
      if (photoInserts.length > 0) {
        const { error: photoError } = await supabase.from('profile_photos').insert(photoInserts);
        if (photoError) throw photoError;
      }

      await refreshProfile();
      router.push('/discover');
    } catch (err: unknown) {
      const e = err as Error;
      setError(e?.message || 'Failed to complete onboarding. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const progressPct = ((step - 1) / (TOTAL_STEPS - 1)) * 100;

  const stepTitles = [
    'Your Name',
    'Date of Birth',
    'Your Gender',
    'Looking For',
    'Your Location',
    'About You',
    'Your Interests',
    'Dating Preferences',
    'Profile Photos',
  ];

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <svg viewBox="0 0 40 40" className="w-8 h-8" fill="none">
              <defs>
                <radialGradient id="hgOb2" cx="50%" cy="30%" r="70%">
                  <stop offset="0%" stopColor="#9333EA" />
                  <stop offset="100%" stopColor="#4C1D95" />
                </radialGradient>
              </defs>
              <path d="M20 34 C20 34 4 24 4 13 C4 8 8 4 13 4 C16 4 19 6 20 9 C21 6 24 4 27 4 C32 4 36 8 36 13 C36 24 20 34 20 34Z" fill="url(#hgOb2)" />
            </svg>
            <span className="font-display font-bold text-white text-xl">Avalon Dating</span>
          </Link>
          <p className="text-white/50 text-sm">Step {step} of {TOTAL_STEPS} — {stepTitles[step - 1]}</p>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 rounded-full mb-8 overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%`, background: 'linear-gradient(90deg, #EC4899, #7C3AED)' }}
          />
        </div>

        {/* Card */}
        <div className="glass rounded-3xl p-8">
          {error && (
            <div className="rounded-xl p-3 text-sm text-white font-medium mb-5"
              style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
              {error}
            </div>
          )}

          {/* STEP 1: First Name */}
          {step === 1 && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="font-display font-bold text-white text-2xl mb-1">What&apos;s your first name? 👋</h2>
                <p className="text-white/50 text-sm">This is how you&apos;ll appear to other members</p>
              </div>
              <input
                type="text"
                className="input-field text-lg"
                placeholder="Enter your first name"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                maxLength={50}
              />
            </div>
          )}

          {/* STEP 2: Date of Birth */}
          {step === 2 && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="font-display font-bold text-white text-2xl mb-1">When were you born? 🎂</h2>
                <p className="text-white/50 text-sm">You must be 18 or older to use Avalon Dating</p>
              </div>
              <input
                type="date"
                className="input-field text-lg"
                value={dateOfBirth}
                onChange={e => { setDateOfBirth(e.target.value); setAgeError(''); }}
                max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
              />
              {ageError && (
                <div className="rounded-xl p-3 text-sm text-white font-medium"
                  style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
                  🔞 {ageError}
                </div>
              )}
              {dateOfBirth && !ageError && (
                <p className="text-white/60 text-sm">
                  Age: <span className="text-white font-semibold">{calculateAge(dateOfBirth)} years old</span>
                </p>
              )}
            </div>
          )}

          {/* STEP 3: Gender */}
          {step === 3 && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="font-display font-bold text-white text-2xl mb-1">Are you a man or a woman? 💜</h2>
                <p className="text-white/50 text-sm">Avalon is currently for straight dating</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {GENDERS.map(g => (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => setGender(g.value)}
                    className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all duration-200 ${
                      gender === g.value
                        ? 'border-accent bg-accent/20 shadow-glow-pink'
                        : 'border-white/20 glass hover:border-white/40'
                    }`}
                  >
                    <span className="text-2xl">{g.emoji}</span>
                    <span className="text-white text-sm font-medium">{g.label}</span>
                    {gender === g.value && <Check size={16} className="text-accent" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: Looking For */}
          {step === 4 && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="font-display font-bold text-white text-2xl mb-1">Who are you looking for? 💕</h2>
                <p className="text-white/50 text-sm">Avalon will show you compatible people of the opposite gender</p>
              </div>
              <div className="flex flex-col gap-3">
                {LOOKING_FOR.filter(l => (gender === 'woman' ? l.value === 'men' : gender === 'man' ? l.value === 'women' : true)).map(l => (
                  <button
                    key={l.value}
                    type="button"
                    onClick={() => setLookingFor(l.value)}
                    className={`p-4 rounded-2xl border-2 flex items-center gap-4 transition-all duration-200 ${
                      lookingFor === l.value
                        ? 'border-accent bg-accent/20 shadow-glow-pink'
                        : 'border-white/20 glass hover:border-white/40'
                    }`}
                  >
                    <span className="text-2xl">{l.emoji}</span>
                    <span className="text-white text-base font-medium flex-1 text-left">{l.label}</span>
                    {lookingFor === l.value && <Check size={18} className="text-accent" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 5: Location */}
          {step === 5 && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="font-display font-bold text-white text-2xl mb-1">Where are you based? 📍</h2>
                <p className="text-white/50 text-sm">Help us find matches near you</p>
              </div>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-white/80 text-sm font-medium">Country</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. United States"
                    value={country}
                    onChange={e => setCountry(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-white/80 text-sm font-medium">City</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. New York"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: Bio */}
          {step === 6 && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="font-display font-bold text-white text-2xl mb-1">Tell us about yourself ✍️</h2>
                <p className="text-white/50 text-sm">Write a short bio that shows your personality</p>
              </div>
              <div className="flex flex-col gap-1.5">
                <textarea
                  className="input-field resize-none"
                  rows={5}
                  placeholder="I love exploring new places, trying different cuisines, and having deep conversations..."
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  maxLength={BIO_MAX_CHARS}
                />
                <div className="flex justify-end">
                  <span className={`text-xs ${bio.length > BIO_MAX_CHARS * 0.9 ? 'text-accent' : 'text-white/40'}`}>
                    {bio.length}/{BIO_MAX_CHARS}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: Interests */}
          {step === 7 && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="font-display font-bold text-white text-2xl mb-1">Your interests 🎯</h2>
                <p className="text-white/50 text-sm">Select all that apply — helps find compatible matches</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {availableInterests.map(interest => (
                  <button
                    key={interest.id}
                    type="button"
                    onClick={() => {
                      setSelectedInterests(prev =>
                        prev.includes(interest.id)
                          ? prev.filter(i => i !== interest.id)
                          : [...prev, interest.id]
                      );
                    }}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${
                      selectedInterests.includes(interest.id)
                        ? 'border-accent bg-accent/20 text-white shadow-glow-pink'
                        : 'border-white/20 text-white/70 hover:border-white/40 hover:text-white glass'
                    }`}
                  >
                    {interest.name}
                  </button>
                ))}
              </div>
              <p className="text-white/40 text-xs">{selectedInterests.length} selected</p>
            </div>
          )}

          {/* STEP 8: Dating Preferences */}
          {step === 8 && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="font-display font-bold text-white text-2xl mb-1">Dating Preferences 💫</h2>
                <p className="text-white/50 text-sm">Customize who you&apos;d like to meet</p>
              </div>

              <div className="flex flex-col gap-5">
                {/* Age Range */}
                <div className="flex flex-col gap-2">
                  <label className="text-white/80 text-sm font-medium">Age Range: <span className="text-white">{minAge} – {maxAge}</span></label>
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col gap-1 flex-1">
                      <span className="text-white/50 text-xs">Min: {minAge}</span>
                      <input type="range" min={18} max={maxAge - 1} value={minAge}
                        onChange={e => setMinAge(Number(e.target.value))}
                        className="w-full accent-purple-500" />
                    </div>
                    <div className="flex flex-col gap-1 flex-1">
                      <span className="text-white/50 text-xs">Max: {maxAge}</span>
                      <input type="range" min={minAge + 1} max={100} value={maxAge}
                        onChange={e => setMaxAge(Number(e.target.value))}
                        className="w-full accent-purple-500" />
                    </div>
                  </div>
                </div>

                {/* Max Distance */}
                <div className="flex flex-col gap-2">
                  <label className="text-white/80 text-sm font-medium">Max Distance: <span className="text-white">{maxDistance} km</span></label>
                  <input type="range" min={5} max={500} step={5} value={maxDistance}
                    onChange={e => setMaxDistance(Number(e.target.value))}
                    className="w-full accent-purple-500" />
                </div>

                {/* Preferred Gender */}
                <div className="flex flex-col gap-2">
                  <label className="text-white/80 text-sm font-medium">Show me</label>
                  <div className="flex gap-2 flex-wrap">
                    {LOOKING_FOR.filter(l => (gender === 'woman' ? l.value === 'men' : gender === 'man' ? l.value === 'women' : true)).map(l => (
                      <button key={l.value} type="button"
                        onClick={() => setPreferredGender(l.value)}
                        className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                          preferredGender === l.value
                            ? 'border-accent bg-accent/20 text-white' :'border-white/20 text-white/60 glass hover:border-white/40'
                        }`}>
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Relationship Intention */}
                <div className="flex flex-col gap-2">
                  <label className="text-white/80 text-sm font-medium">I&apos;m looking for</label>
                  <div className="flex flex-col gap-2">
                    {RELATIONSHIP_INTENTIONS.map(ri => (
                      <button key={ri} type="button"
                        onClick={() => setRelationshipIntention(ri)}
                        className={`px-4 py-3 rounded-xl text-sm font-medium border text-left transition-all ${
                          relationshipIntention === ri
                            ? 'border-accent bg-accent/20 text-white' :'border-white/20 text-white/60 glass hover:border-white/40'
                        }`}>
                        {ri}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 9: Photos */}
          {step === 9 && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="font-display font-bold text-white text-2xl mb-1">Add your photos 📸</h2>
                <p className="text-white/50 text-sm">Upload 3–6 photos. Drag to reorder. Tap ⭐ to set primary.</p>
              </div>

              {/* Photo grid */}
              <div className="grid grid-cols-3 gap-3">
                {photos.map((photo, idx) => (
                  <div
                    key={photo.id}
                    draggable
                    onDragStart={() => handleDragStart(idx)}
                    onDragOver={e => handleDragOver(e, idx)}
                    onDragEnd={handleDragEnd}
                    className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all cursor-grab ${
                      photo.isPrimary ? 'border-gold shadow-glow-gold' : 'border-white/20'
                    } ${dragIndex === idx ? 'opacity-50 scale-95' : ''}`}
                  >
                    <img src={photo.previewUrl} alt={`Profile photo ${idx + 1}`} className="w-full h-full object-cover" />
                    {photo.uploading && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Loader2 size={20} className="animate-spin text-white" />
                      </div>
                    )}
                    {!photo.uploading && (
                      <>
                        <button
                          type="button"
                          onClick={() => removePhoto(photo.id)}
                          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600 transition-colors"
                        >
                          <X size={12} className="text-white" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPrimaryPhoto(photo.id)}
                          className={`absolute bottom-1 left-1 px-2 py-0.5 rounded-full text-xs font-bold transition-all ${
                            photo.isPrimary ? 'bg-gold text-black' : 'bg-black/50 text-white hover:bg-gold hover:text-black'
                          }`}
                        >
                          {photo.isPrimary ? '⭐ Main' : '⭐'}
                        </button>
                        <div className="absolute top-1 left-1 cursor-grab">
                          <GripVertical size={14} className="text-white/60" />
                        </div>
                      </>
                    )}
                  </div>
                ))}

                {/* Upload slot */}
                {photos.length < 6 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-2xl border-2 border-dashed border-white/30 flex flex-col items-center justify-center gap-2 hover:border-accent hover:bg-accent/10 transition-all"
                  >
                    <Upload size={24} className="text-white/50" />
                    <span className="text-white/50 text-xs">Add Photo</span>
                  </button>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={handlePhotoUpload}
              />

              <p className="text-white/40 text-xs text-center">
                {photos.length}/6 photos • {photos.filter(p => !p.uploading).length} uploaded
                {photos.length < 3 && ` • Need ${3 - photos.length} more`}
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center gap-3 mt-8">
            {step > 1 && (
              <button
                type="button"
                onClick={handleBack}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-3 rounded-xl glass border border-white/20 text-white font-medium text-sm hover:bg-white/10 transition-all disabled:opacity-50"
              >
                <ChevronLeft size={18} />
                Back
              </button>
            )}

            {step < TOTAL_STEPS ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={saving}
                className="flex-1 btn-primary py-3 font-bold text-base flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {saving ? (
                  <><Loader2 size={18} className="animate-spin" /><span>Saving...</span></>
                ) : (
                  <><span>Continue</span><ChevronRight size={18} /></>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCompleteOnboarding}
                disabled={saving || photos.some(p => p.uploading)}
                className="flex-1 btn-primary py-3 font-bold text-base flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {saving ? (
                  <><Loader2 size={18} className="animate-spin" /><span>Completing profile...</span></>
                ) : (
                  <><Check size={18} /><span>Complete Profile 🎉</span></>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
