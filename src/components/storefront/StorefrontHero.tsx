import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Gift,
  Heart,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { SafeImage } from '../common/SafeImage';

interface StorefrontHeroProps {
  onOrderClick: () => void;
}

export const StorefrontHero: React.FC<StorefrontHeroProps> = ({ onOrderClick }) => {
  const { heroSlides, isStoreOpen, storeSettings } = useStore();

  // Active slides managed by Admin CMS
  const activeSlides = heroSlides.filter((s) => s.isActive);
  const slides = activeSlides.length > 0 ? activeSlides : heroSlides;

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartXRef = useRef<number | null>(null);
  const touchEndXRef = useRef<number | null>(null);

  // Auto transition approximately every 4.5 seconds
  useEffect(() => {
    if (slides.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
    }, 4500);

    return () => clearInterval(timer);
  }, [slides.length, isPaused]);

  const handlePrev = useCallback(() => {
    setCurrentSlideIndex((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const handleNext = useCallback(() => {
    setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartXRef.current || !touchEndXRef.current) return;
    const distance = touchStartXRef.current - touchEndXRef.current;
    if (distance > 50) {
      handleNext();
    } else if (distance < -50) {
      handlePrev();
    }
    touchStartXRef.current = null;
    touchEndXRef.current = null;
  };

  const currentSlide = slides[currentSlideIndex] || slides[0];

  return (
    <section
      id="top"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        width: '100%',
        maxWidth: 'none',
        margin: 0,
        borderRadius: 0,
        boxShadow: 'none',
        border: 'none',
      }}
      className="relative w-full min-h-[460px] sm:min-h-[500px] lg:h-[530px] flex flex-col justify-between overflow-hidden bg-[#0A0503] text-white select-none"
    >
      {/* 
        TRUE FULL-WIDTH HERO ARTWORK:
        - Positioned toward the LOWER / BOTTOM-RIGHT area of the hero section.
        - Naturally integrated directly into the hero background (no box, no card, no separate container).
        - Naturally sharp and clear without artificial dark overlays.
      */}
      {/* 
        HERO ARTWORK:
        - Fits 100% of the uploaded hero image completely without cropping top, bottom, or sides.
        - Preserves original aspect ratio with contain-style fitting.
        - Empty areas naturally filled with existing hero background (#0A0503).
      */}
      <div className="absolute inset-0 z-0 w-full h-full overflow-hidden bg-[#0A0503]">
        {slides.map((slide, idx) => (
          <div
            key={slide.id}
            className={`absolute inset-0 w-full h-full flex items-center justify-center bg-[#0A0503] transition-opacity duration-700 ease-in-out ${
              idx === currentSlideIndex ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            <picture className="w-full h-full flex items-center justify-center">
              {slide.mobileImageUrl ? (
                <source media="(max-width: 640px)" srcSet={slide.mobileImageUrl} />
              ) : null}
              {slide.imageUrl || slide.imageId ? (
                <SafeImage
                  src={slide.imageUrl}
                  imageId={slide.imageId}
                  alt={slide.title}
                  className="w-full h-full object-contain object-center pointer-events-none select-none"
                  fallbackSrc="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1920&q=85"
                />
              ) : null}
            </picture>
          </div>
        ))}
      </div>

      {/* Store Closed Banner Notice if closed by admin */}
      {!isStoreOpen && (
        <div className="relative z-30 pt-20 px-4">
          <div className="max-w-4xl mx-auto p-2.5 rounded-2xl bg-amber-950/90 border border-amber-500/50 text-amber-100 text-xs flex items-center justify-center gap-2 backdrop-blur-md shadow-xl text-center">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong className="text-white font-mono uppercase mr-1.5">Store Currently Resting:</strong>
              {storeSettings.closedAnnouncementMessage}
            </span>
          </div>
        </div>
      )}

      {/* Hero Content Layer: Compact, Balanced & Elegant */}
      <div className="relative z-20 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 w-full pt-20 sm:pt-24 lg:pt-26 pb-8 flex-1 flex flex-col justify-between">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center w-full my-auto">
          {/* Left Column: Eyebrow, Heading, Description, CTA, and Clean White Feature Group */}
          <div className="lg:col-span-7 space-y-4 max-w-xl">
            {/* Eyebrow */}
            <span className="text-[10px] sm:text-[11px] font-mono tracking-[0.25em] uppercase text-white/70 font-semibold block drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              {currentSlide?.subtitle || 'MORE THAN JUST COFFEE'}
            </span>

            {/* Headline: Compact, Refined Editorial Serif */}
            <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-serif font-bold tracking-tight leading-[1.12] text-white whitespace-pre-line drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">
              {currentSlide?.title || 'Good Coffee.\nGreat Surprise.'}
            </h1>

            {/* Description */}
            <p className="text-xs sm:text-[13px] text-zinc-100/90 font-light leading-relaxed max-w-md drop-shadow-[0_1px_4px_rgba(0,0,0,0.85)]">
              {currentSlide?.description ||
                'Every cup is a new adventure. Enjoy premium coffee and discover a collectible toy hidden inside.'}
            </p>

            {/* CTA Button */}
            <div className="pt-1 flex items-center gap-4">
              <a
                href={currentSlide?.buttonLink || '#coffee-menu'}
                onClick={onOrderClick}
                className="inline-flex items-center gap-2.5 px-6 py-2.5 sm:px-7 sm:py-3 rounded-full bg-white hover:bg-zinc-100 text-zinc-950 font-sans font-bold text-xs uppercase tracking-wider transition-all duration-300 shadow-xl hover:scale-[1.02] cursor-pointer group"
              >
                <span>{currentSlide?.buttonText || 'Explore Our Menu'}</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </a>
            </div>

            {/* 
              CLEAN WHITE FLOATING FEATURE GROUP (LOWER-LEFT OVER HERO BANNER)
              - White text & minimal white icons (zero strong yellow/gold)
              - No full-width strip, no background container, no border box
              - Compact with small dividers: Premium Coffee | Hidden Surprise | Collectible Toys | A Little Joy in Every Cup
            */}
            <div className="pt-4 sm:pt-6">
              <div className="inline-flex items-center flex-wrap gap-y-2 text-white/85 text-[10.5px] sm:text-[11px] font-sans font-normal tracking-wide drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                {/* Feature 1 */}
                <div className="flex items-center gap-1.5 pr-3 sm:pr-4 border-r border-white/20">
                  <Coffee className="w-3.5 h-3.5 text-white/80" />
                  <span>Premium Coffee</span>
                </div>

                {/* Feature 2 */}
                <div className="flex items-center gap-1.5 px-3 sm:px-4 border-r border-white/20">
                  <Gift className="w-3.5 h-3.5 text-white/80" />
                  <span>Hidden Surprise</span>
                </div>

                {/* Feature 3 */}
                <div className="flex items-center gap-1.5 px-3 sm:px-4 border-r border-white/20">
                  <Heart className="w-3.5 h-3.5 text-white/80" />
                  <span>Collectible Toys</span>
                </div>

                {/* Feature 4 */}
                <div className="flex items-center gap-1.5 pl-3 sm:pl-4">
                  <Sparkles className="w-3.5 h-3.5 text-white/80" />
                  <span>A Little Joy in Every Cup</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Hand-drawn cursive annotation floating naturally near the coffee visual */}
          <div className="hidden lg:flex lg:col-span-5 relative flex-col items-end justify-center pointer-events-none pb-4">
            <div className="max-w-[190px] text-right pr-4">
              <p className="font-hand text-xl sm:text-2xl text-white/85 leading-tight rotate-[-4deg] drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                Same great coffee.
                <br />
                New surprise every time.
              </p>
              {/* Hand-drawn curved doodle arrow pointing toward the collectible figurine */}
              <svg
                className="w-12 h-9 ml-auto text-white/80 rotate-12 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] mt-1"
                viewBox="0 0 50 40"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M 40 5 Q 35 25 15 28 Q 10 29 8 30" />
                <path d="M 14 24 L 8 30 L 16 34" />
              </svg>
            </div>
          </div>
        </div>

        {/* Minimal Slide Indicators (Bottom-Right / Subtle Overlay) */}
        {slides.length > 1 && (
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-1.5">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlideIndex(idx)}
                  title={`Go to slide ${idx + 1}`}
                  className={`transition-all duration-300 rounded-full cursor-pointer ${
                    idx === currentSlideIndex
                      ? 'w-5 h-1.5 bg-white'
                      : 'w-1.5 h-1.5 bg-white/40 hover:bg-white'
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handlePrev}
                title="Previous slide"
                className="w-6 h-6 rounded-full bg-black/30 hover:bg-black/70 border border-white/20 text-white flex items-center justify-center transition backdrop-blur-xs cursor-pointer"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
              <button
                onClick={handleNext}
                title="Next slide"
                className="w-6 h-6 rounded-full bg-black/30 hover:bg-black/70 border border-white/20 text-white flex items-center justify-center transition backdrop-blur-xs cursor-pointer"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
