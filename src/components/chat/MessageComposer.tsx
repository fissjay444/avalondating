'use client';
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Send, Paperclip, Smile, X, Crown } from 'lucide-react';
import Link from 'next/link';
import { containsContactInfo } from '@/lib/premium/contactDetection';
import { usePremiumPaywall } from '@/contexts/PremiumPaywallContext';

interface MessageComposerProps {
  onSend: (content: string, type?: string) => Promise<boolean>;
  onTyping: () => void;
  onStopTyping: () => void;
  disabled?: boolean;
  placeholder?: string;
  premiumBlocked?: boolean;
  onContactDetected?: () => void;
}

const MAX_LENGTH = 2000;

export default function MessageComposer({
  onSend,
  onTyping,
  onStopTyping,
  disabled = false,
  placeholder = 'Type a message…',
  premiumBlocked = false,
  onContactDetected,
}: MessageComposerProps) {
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { openPremiumPaywall } = usePremiumPaywall();

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  }, [content]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    if (val.length > MAX_LENGTH) return;
    setContent(val);
    setError(null);
    if (containsContactInfo(val)) {
      onContactDetected?.();
    }
    if (val.trim()) {
      onTyping();
    } else {
      onStopTyping();
    }
  }, [onTyping, onStopTyping, onContactDetected]);

  const handleSend = useCallback(async () => {
    const trimmed = content.trim();
    if (!trimmed || sending || disabled || premiumBlocked) return;

    setSending(true);
    setError(null);
    onStopTyping();

    const success = await onSend(trimmed);
    setSending(false);

    if (success) {
      setContent('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.focus();
      }
    } else if (!premiumBlocked && !containsContactInfo(trimmed)) {
      setError('Failed to send. Tap retry on the message.');
    }
  }, [content, sending, disabled, premiumBlocked, onSend, onStopTyping]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const canSend = content.trim().length > 0 && !sending && !disabled && !premiumBlocked;
  const charCount = content.length;
  const nearLimit = charCount > MAX_LENGTH * 0.85;

  return (
    <div
      className="flex-shrink-0 px-4 py-3"
      style={{
        background: 'rgba(10,5,30,0.97)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
      }}
    >
      {premiumBlocked && (
        <Link href="/premium" className="flex items-center gap-2 mb-2 px-3 py-2.5 rounded-xl text-amber-200 text-xs font-semibold" style={{ background: 'rgba(251,191,36,0.09)', border: '1px solid rgba(251,191,36,0.18)' }}>
          <Crown size={14} />
          Free messaging limit reached — unlock Avalon Premium from $30 →
        </Link>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 mb-2 px-3 py-2 rounded-xl text-red-400 text-xs" style={{ background: 'rgba(239,68,68,0.1)' }}>
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} aria-label="Dismiss error">
            <X size={13} />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* Premium attachment action */}
        <button
          type="button"
          onClick={() => openPremiumPaywall({ reason: 'feature' })}
          className="flex-shrink-0 p-2.5 rounded-xl text-amber-300/70 hover:text-amber-200 transition-colors mb-0.5"
          aria-label="Attachments are a Premium feature"
          title="Premium feature → Unlock"
        >
          <Paperclip size={18} />
        </button>

        {/* Input area */}
        <div
          className="flex-1 flex items-end gap-2 px-3 py-2 rounded-2xl"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || premiumBlocked}
            rows={1}
            className="flex-1 bg-transparent text-white text-sm placeholder-white/30 outline-none resize-none leading-relaxed"
            style={{ maxHeight: '120px', minHeight: '24px' }}
            aria-label="Message input"
          />

          {/* Premium emoji action */}
          <button
            type="button"
            onClick={() => openPremiumPaywall({ reason: 'feature' })}
            className="flex-shrink-0 p-1 text-amber-300/70 hover:text-amber-200 transition-colors mb-0.5"
            aria-label="Emoji tools are a Premium feature"
            title="Premium feature → Unlock"
          >
            <Smile size={17} />
          </button>
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!canSend}
          className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all mb-0.5"
          style={{
            background: canSend
              ? 'linear-gradient(135deg, #7C3AED, #EC4899)'
              : 'rgba(255,255,255,0.06)',
            boxShadow: canSend ? '0 0 20px rgba(124,58,237,0.4)' : 'none',
            transform: canSend ? 'scale(1)' : 'scale(0.95)',
          }}
          aria-label="Send message"
        >
          <Send
            size={16}
            className={canSend ? 'text-white' : 'text-white/20'}
            style={{ transform: 'translateX(1px)' }}
          />
        </button>
      </div>

      {/* Character count (near limit) */}
      {nearLimit && (
        <div className="flex justify-end mt-1">
          <span className={`text-[10px] ${charCount >= MAX_LENGTH ? 'text-red-400' : 'text-white/30'}`}>
            {charCount}/{MAX_LENGTH}
          </span>
        </div>
      )}
    </div>
  );
}
