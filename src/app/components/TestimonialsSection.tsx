'use client';
import React, { useState } from 'react';
import AppImage from '@/components/ui/AppImage';

const testimonials = [
{
  id: 'test-1',
  name: 'Priya & Marcus',
  location: 'Austin, TX',
  time: 'Met 8 months ago',
  text: "I almost didn't sign up. Three weeks in, Marcus messaged me about hiking trails near Austin. We met for coffee and talked for 6 hours. We moved in together last month. Avalon changed my life.",
  avatar1: "https://img.rocket.new/generatedImages/rocket_gen_img_109d31244-1773133393044.png",
  avatar2: "https://img.rocket.new/generatedImages/rocket_gen_img_109d31244-1773133393044.png",
  alt1: 'Priya, South Asian woman smiling',
  alt2: 'Marcus, man with warm smile',
  stars: 5
},
{
  id: 'test-2',
  name: 'Elena & James',
  location: 'Chicago, IL',
  time: 'Engaged 2 months ago',
  text: "The verified badge system made me feel safe enough to actually open up. James was genuine from the first message. We got engaged at the same coffee shop where we had our first date.",
  avatar1: "https://img.rocket.new/generatedImages/rocket_gen_img_1658b37dd-1763299021458.png",
  avatar2: "https://img.rocket.new/generatedImages/rocket_gen_img_1658b37dd-1763299021458.png",
  alt1: 'Elena, woman with natural smile',
  alt2: 'James, man smiling outdoors',
  stars: 5
},
{
  id: 'test-3',
  name: 'Amara & Tyler',
  location: 'Brooklyn, NY',
  time: 'Together 14 months',
  text: "Tyler super-liked my photo of my dog. I thought it was cheesy. Then we talked for three days straight. Now our dogs have playdates every Sunday and we're planning our first trip to Portugal.",
  avatar1: "https://img.rocket.new/generatedImages/rocket_gen_img_1e91f72fe-1772071256926.png",
  avatar2: "https://img.rocket.new/generatedImages/rocket_gen_img_1e91f72fe-1772071256926.png",
  alt1: 'Amara, woman with curly hair smiling',
  alt2: 'Tyler, person with warm expression',
  stars: 5
}];


export default function TestimonialsSection() {
  const [active, setActive] = useState(0);

  return (
    <section className="py-20 px-6 lg:px-10 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none"
      style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(124,58,237,0.12) 0%, transparent 70%)' }} />

      <div className="max-w-screen-2xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-gold font-medium text-sm tracking-widest uppercase mb-3">Love Stories</p>
          <h2 className="font-display font-bold text-3xl lg:text-5xl text-white leading-tight">
            Real People, Real Results
          </h2>
        </div>

        <div className="max-w-3xl mx-auto">
          {/* Active testimonial */}
          <div className="glass rounded-3xl p-8 lg:p-10 text-center relative">
            <div className="flex justify-center gap-1 mb-6">
              {Array.from({ length: testimonials?.[active]?.stars })?.map((_, i) =>
              <span key={`star-${active}-${i}`} className="text-gold text-xl">★</span>
              )}
            </div>

            <p className="text-white/90 text-base lg:text-lg leading-relaxed font-light italic mb-8">
              &ldquo;{testimonials?.[active]?.text}&rdquo;
            </p>

            <div className="flex items-center justify-center gap-3">
              <div className="flex -space-x-2">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary">
                  <AppImage
                    src={testimonials?.[active]?.avatar1}
                    alt={testimonials?.[active]?.alt1}
                    width={48}
                    height={48}
                    className="object-cover w-full h-full" />
                  
                </div>
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-accent">
                  <AppImage
                    src={testimonials?.[active]?.avatar2}
                    alt={testimonials?.[active]?.alt2}
                    width={48}
                    height={48}
                    className="object-cover w-full h-full" />
                  
                </div>
              </div>
              <div className="text-left">
                <p className="text-white font-semibold text-sm">{testimonials?.[active]?.name}</p>
                <p className="text-white/50 text-xs">{testimonials?.[active]?.location} · {testimonials?.[active]?.time}</p>
              </div>
            </div>
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-3 mt-8">
            {testimonials?.map((_, i) =>
            <button
              key={`tdot-${i}`}
              onClick={() => setActive(i)}
              className={`transition-all duration-300 rounded-full ${i === active ? 'w-8 h-3 bg-accent' : 'w-3 h-3 bg-white/25 hover:bg-white/50'}`}
              aria-label={`View testimonial ${i + 1}`} />

            )}
          </div>
        </div>
      </div>
    </section>);

}