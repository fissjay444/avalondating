'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, LogOut, Trash2, AlertTriangle, Eye, EyeOff, Bell, Shield, User, Lock, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import Navbar from '@/components/Navbar';

type SettingsTab = 'account' | 'privacy' | 'notifications';

export default function SettingsPage() {
  const { user, profile, signOut, resetPassword } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<SettingsTab>('account');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Privacy settings
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);
  const [allowMessages, setAllowMessages] = useState(true);
  const [showProfile, setShowProfile] = useState(true);

  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);

  useEffect(() => {
    if (!user) return;
    const loadSettings = async () => {
      const { data } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) {
        setShowOnlineStatus(data.show_online_status ?? true);
        setAllowMessages(data.allow_messages ?? true);
        setShowProfile(data.show_profile ?? true);
        setEmailNotifications(data.email_notifications ?? true);
        setPushNotifications(data.push_notifications ?? true);
      }
    };
    loadSettings();
  }, [user, supabase]);

  const saveSettings = async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const { error: settingsError } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          show_online_status: showOnlineStatus,
          allow_messages: allowMessages,
          show_profile: showProfile,
          email_notifications: emailNotifications,
          push_notifications: pushNotifications,
        }, { onConflict: 'user_id' });
      if (settingsError) throw settingsError;
      setMessage('Settings saved successfully.');
    } catch (err: unknown) {
      setError((err as Error)?.message || 'Failed to save settings.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await resetPassword(user.email);
      setMessage('Password reset email sent. Check your inbox.');
    } catch {
      setError('Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch {
      setError('Failed to sign out. Please try again.');
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      setError('Please type DELETE to confirm.');
      return;
    }
    setDeleting(true);
    setError('');
    try {
      // Delete profile data (cascades to related tables via FK)
      if (user) {
        // Delete storage photos
        const { data: photos } = await supabase
          .from('profile_photos')
          .select('storage_path')
          .eq('user_id', user.id);
        if (photos && photos.length > 0) {
          await supabase.storage.from('profile-photos').remove(photos.map(p => p.storage_path));
        }
        // Delete profile (cascades)
        await supabase.from('profiles').delete().eq('id', user.id);
      }
      // Sign out (auth user deletion requires server-side admin API)
      await signOut();
      router.push('/');
    } catch (err: unknown) {
      setError((err as Error)?.message || 'Failed to delete account. Please contact support.');
      setDeleting(false);
    }
  };

  const tabs: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <div className="min-h-screen gradient-hero">
      <Navbar />
      <div className="pt-24 pb-16 px-6 max-w-2xl mx-auto">
        <h1 className="font-display font-bold text-white text-3xl mb-2">Settings</h1>
        <p className="text-white/50 text-sm mb-8">Manage your account and preferences</p>

        {/* Tabs */}
        <div className="glass rounded-2xl p-1 flex mb-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                activeTab === tab.id ? 'btn-primary shadow-glow-pink' : 'text-white/60 hover:text-white'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Messages */}
        {message && (
          <div className="rounded-xl p-3 text-sm text-white font-medium mb-5"
            style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)' }}>
            ✅ {message}
          </div>
        )}
        {error && (
          <div className="rounded-xl p-3 text-sm text-white font-medium mb-5"
            style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
            {error}
          </div>
        )}

        {/* Account Tab */}
        {activeTab === 'account' && (
          <div className="flex flex-col gap-4">
            <div className="glass rounded-2xl p-6 flex flex-col gap-4">
              <h2 className="text-white font-semibold text-lg flex items-center gap-2">
                <User size={18} className="text-accent" /> Account Information
              </h2>
              <div className="flex flex-col gap-1.5">
                <label className="text-white/60 text-xs uppercase tracking-wider">Email</label>
                <div className="input-field text-white/80 cursor-not-allowed opacity-70">{user?.email}</div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-white/60 text-xs uppercase tracking-wider">Name</label>
                <div className="input-field text-white/80 cursor-not-allowed opacity-70">
                  {profile?.first_name || 'Not set'}
                </div>
              </div>
            </div>

            <div className="glass rounded-2xl p-6 flex flex-col gap-4">
              <h2 className="text-white font-semibold text-lg flex items-center gap-2">
                <Lock size={18} className="text-accent" /> Password
              </h2>
              <p className="text-white/50 text-sm">We&apos;ll send a password reset link to your email address.</p>
              <button
                onClick={handlePasswordReset}
                disabled={loading}
                className="btn-outline-white py-3 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
                Send Password Reset Email
              </button>
            </div>

            <div className="glass rounded-2xl p-6">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-between text-white/80 hover:text-white transition-colors py-2"
              >
                <div className="flex items-center gap-3">
                  <LogOut size={18} className="text-white/60" />
                  <span className="font-medium">Sign Out</span>
                </div>
                <ChevronRight size={16} className="text-white/40" />
              </button>
            </div>

            {/* Danger Zone */}
            <div className="rounded-2xl p-6 flex flex-col gap-4"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
              <h2 className="text-red-400 font-semibold text-lg flex items-center gap-2">
                <AlertTriangle size={18} /> Danger Zone
              </h2>
              <p className="text-white/50 text-sm">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-all text-sm font-semibold"
                >
                  <Trash2 size={16} />
                  Delete My Account
                </button>
              ) : (
                <div className="flex flex-col gap-3">
                  <p className="text-red-300 text-sm font-medium">
                    ⚠️ This will permanently delete your profile, photos, matches, and all data.
                  </p>
                  <p className="text-white/60 text-sm">Type <strong className="text-white">DELETE</strong> to confirm:</p>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Type DELETE here"
                    value={deleteConfirmText}
                    onChange={e => setDeleteConfirmText(e.target.value)}
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); setError(''); }}
                      className="flex-1 py-3 rounded-xl glass border border-white/20 text-white text-sm font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteAccount}
                      disabled={deleting || deleteConfirmText !== 'DELETE'}
                      className="flex-1 py-3 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                      style={{ background: 'rgba(239,68,68,0.3)', border: '1px solid rgba(239,68,68,0.5)' }}
                    >
                      {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                      {deleting ? 'Deleting...' : 'Delete Account'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Privacy Tab */}
        {activeTab === 'privacy' && (
          <div className="flex flex-col gap-4">
            <div className="glass rounded-2xl p-6 flex flex-col gap-5">
              <h2 className="text-white font-semibold text-lg flex items-center gap-2">
                <Shield size={18} className="text-accent" /> Privacy Controls
              </h2>

              {[
                { label: 'Show Online Status', desc: 'Let others see when you\'re active', value: showOnlineStatus, setter: setShowOnlineStatus, icon: Eye },
                { label: 'Allow Messages', desc: 'Allow matches to send you messages', value: allowMessages, setter: setAllowMessages, icon: Bell },
                { label: 'Show Profile', desc: 'Make your profile visible in discovery', value: showProfile, setter: setShowProfile, icon: EyeOff },
              ].map(setting => (
                <div key={setting.label} className="flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <setting.icon size={18} className="text-white/50 mt-0.5" />
                    <div>
                      <p className="text-white text-sm font-medium">{setting.label}</p>
                      <p className="text-white/50 text-xs">{setting.desc}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setting.setter(!setting.value)}
                    className={`w-12 h-6 rounded-full transition-all duration-300 relative ${
                      setting.value ? 'bg-accent' : 'bg-white/20'
                    }`}
                  >
                    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 ${
                      setting.value ? 'left-7' : 'left-1'
                    }`} />
                  </button>
                </div>
              ))}

              <button
                onClick={saveSettings}
                disabled={loading}
                className="btn-primary py-3 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-70 mt-2"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                {loading ? 'Saving...' : 'Save Privacy Settings'}
              </button>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="flex flex-col gap-4">
            <div className="glass rounded-2xl p-6 flex flex-col gap-5">
              <h2 className="text-white font-semibold text-lg flex items-center gap-2">
                <Bell size={18} className="text-accent" /> Notification Preferences
              </h2>

              {[
                { label: 'Email Notifications', desc: 'Receive updates and matches via email', value: emailNotifications, setter: setEmailNotifications },
                { label: 'Push Notifications', desc: 'Get instant alerts on your device', value: pushNotifications, setter: setPushNotifications },
              ].map(setting => (
                <div key={setting.label} className="flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm font-medium">{setting.label}</p>
                    <p className="text-white/50 text-xs">{setting.desc}</p>
                  </div>
                  <button
                    onClick={() => setting.setter(!setting.value)}
                    className={`w-12 h-6 rounded-full transition-all duration-300 relative ${
                      setting.value ? 'bg-accent' : 'bg-white/20'
                    }`}
                  >
                    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 ${
                      setting.value ? 'left-7' : 'left-1'
                    }`} />
                  </button>
                </div>
              ))}

              <button
                onClick={saveSettings}
                disabled={loading}
                className="btn-primary py-3 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-70 mt-2"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                {loading ? 'Saving...' : 'Save Notification Settings'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
