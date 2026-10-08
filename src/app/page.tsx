import React from 'react';
import Navbar from '@/components/Navbar';
import HeroSection from '@/app/components/HeroSection';
import StatsBar from '@/app/components/StatsBar';
import FeaturesSection from '@/app/components/FeaturesSection';
import TestimonialsSection from '@/app/components/TestimonialsSection';
import CtaSection from '@/app/components/CtaSection';
import Footer from '@/app/components/Footer';

export default function HomePage() {
  return (
    <main className="min-h-screen gradient-hero overflow-x-hidden">
      <Navbar />
      <HeroSection />
      <StatsBar />
      <FeaturesSection />
      <TestimonialsSection />
      <CtaSection />
      <Footer />
    </main>
  );
}