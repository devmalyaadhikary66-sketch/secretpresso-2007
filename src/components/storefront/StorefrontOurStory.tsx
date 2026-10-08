import React from 'react';
import { ArrowLeft, Sparkles, Coffee, Heart, Award, ShieldCheck } from 'lucide-react';

interface StorefrontOurStoryProps {
  onBackToMenu: () => void;
}

export const StorefrontOurStory: React.FC<StorefrontOurStoryProps> = ({ onBackToMenu }) => {
  return (
    <div className="py-16 px-4 sm:px-8 max-w-5xl mx-auto space-y-16 animate-in fade-in duration-300 text-zinc-100">
      {/* Top Bar */}
      <button
        onClick={onBackToMenu}
        className="flex items-center gap-2 text-xs font-mono uppercase text-[#cfa851] hover:underline"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Roastery Menu</span>
      </button>

      {/* Editorial Headline */}
      <div className="space-y-4 text-center max-w-3xl mx-auto">
        <span className="text-[11px] font-mono uppercase tracking-widest text-[#cfa851] bg-[#1a110a] px-3.5 py-1.5 rounded-full border border-[#382319]">
          The SECRETpresso Chronicle
        </span>
        <h1 className="text-4xl sm:text-6xl font-black font-serif text-[#fae8be] tracking-tight leading-tight">
          Good Coffee. Secret Surprise. A Moment Worth Collecting.
        </h1>
        <p className="text-sm sm:text-base text-zinc-300 font-light leading-relaxed">
          SECRETpresso was born from a singular passion: combining uncompromising specialty coffee extraction with the nostalgic thrill of discovering a collectible miniature tucked inside every single cup.
        </p>
      </div>

      {/* Hero Visual Collage */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="relative rounded-3xl overflow-hidden border border-[#3e271c] shadow-2xl h-80 sm:h-96">
          <img
            src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80"
            alt="SECRETpresso roasting craft"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#090503] via-transparent to-black/30"></div>
          <div className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl bg-[#120b08]/90 border border-[#352116] backdrop-blur-md">
            <p className="text-xs font-bold text-[#fae8be]">Direct Trade Micro-Lots</p>
            <p className="text-[11px] text-zinc-400 mt-0.5">Shade-grown at 1,400m elevation in Chikmagalur & Yirgacheffe</p>
          </div>
        </div>

        <div className="space-y-6 text-xs sm:text-sm text-zinc-300 font-light leading-relaxed">
          <div className="space-y-2">
            <h3 className="text-xl font-bold font-serif text-[#fae8be]">
              The Secret Collectible Chamber
            </h3>
            <p>
              Every takeaway cup engineered by SECRETpresso features a patented food-grade, airtight lower capsule. While you sip double ristretto microfoam from the top, an exclusive collectible character awaits discovery below.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold font-serif text-[#fae8be]">
              Treviso 1968 Tiramisu Craft
            </h3>
            <p>
              In our pastry lab, time stands still. Our Venetian Tiramisu follows an authentic 1968 Italian recipe. We import real Galbani mascarpone and Vicenzi ladyfingers, dipping each biscuit into freshly extracted SECRETpresso espresso and dusting with 70% Grand Cru French Valrhona cocoa.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={onBackToMenu}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#fae8be] via-[#cfa851] to-[#b3883b] text-zinc-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#cfa851]/15 hover:brightness-110 transition"
            >
              Explore Our Brews & Surprises →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
