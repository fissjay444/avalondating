import React from 'react';
import AppImage from '@/components/ui/AppImage';

const messages = [
{ id: 'msg-1', text: "Hey, Lizzie it'd be cool to see you around sometime 🙂", time: '10:24 AM', isOut: false },
{ id: 'msg-2', text: 'Definitely!', time: '10:25 AM', isOut: true },
{ id: 'msg-3', text: 'I live nearby, do you want to grab some Pizza around 7pm?', time: '10:26 AM', isOut: false },
{ id: 'msg-4', text: "Yes, can't wait! 🍕🍕", time: '10:27 AM', isOut: true }];


export default function PhoneMockupRight() {
  return (
    <div className="phone-frame w-[200px] sm:w-[220px] lg:w-[240px] h-[400px] sm:h-[440px] lg:h-[480px] flex flex-col">
      {/* Notch */}
      <div className="flex justify-center pt-3 pb-1">
        <div className="phone-notch" />
      </div>
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2">
        <div className="w-6 h-1 bg-white/30 rounded" />
        <div className="flex items-center gap-1">
          <span className="text-gold text-xs font-bold">Z+</span>
          <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center">
            <span className="text-white/70 text-xs">★</span>
          </div>
          <div className="relative w-5 h-5 rounded-full bg-white/10 flex items-center justify-center">
            <span className="text-white/70 text-xs">🔔</span>
            <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-accent rounded-full" />
          </div>
        </div>
      </div>

      {/* Profile header */}
      <div className="flex flex-col items-center py-2 px-3 border-b border-white/10">
        <div className="relative">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary">
            <AppImage
              src="https://images.unsplash.com/photo-1726722065037-0f5394808a85"
              alt="Lizzie, woman with glasses and hair up, Seattle"
              width={48}
              height={48}
              className="object-cover w-full h-full" />
            
          </div>
          <div className="absolute bottom-0 right-0 online-dot" />
        </div>
        <p className="text-white font-bold text-sm mt-1">Lizzie</p>
        <div className="flex items-center gap-1 text-white/60 text-xs">
          <span>📍</span>
          <span>Seattle, USA</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-2">
        {messages?.map((m) =>
        <div key={m?.id} className={`flex ${m?.isOut ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-3 py-2 ${m?.isOut ? 'message-out' : 'message-in'}`}>
              <p className="text-white text-xs leading-snug">{m?.text}</p>
              <p className="text-white/50 text-right mt-0.5" style={{ fontSize: '9px' }}>{m?.time}</p>
            </div>
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="flex items-center gap-2 px-3 py-2 border-t border-white/10">
        <button className="text-primary/80 hover:text-primary transition-colors">
          <span className="text-base">+</span>
        </button>
        <div className="flex-1 rounded-full px-3 py-1.5 text-white/40 text-xs"
        style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}>
          Type a message...
        </div>
        <button className="w-7 h-7 rounded-full flex items-center justify-center text-white"
        style={{ background: 'linear-gradient(135deg, #7C3AED, #EC4899)' }}>
          <span className="text-xs">→</span>
        </button>
      </div>
    </div>);

}