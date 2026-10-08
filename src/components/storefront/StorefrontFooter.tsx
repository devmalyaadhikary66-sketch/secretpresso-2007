import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Coffee, ArrowRight, Instagram, Facebook, Twitter, Shield } from 'lucide-react';

interface StorefrontFooterProps {
  onOpenAdmin: () => void;
  onOpenTracking: () => void;
  onOpenOurStory: () => void;
  onOpenAccount?: () => void;
}

export const StorefrontFooter: React.FC<StorefrontFooterProps> = ({
  onOpenAdmin,
  onOpenTracking,
  onOpenOurStory,
  onOpenAccount,
}) => {
  const { storeSettings } = useStore();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setNewsletterSubscribed(true);
    setNewsletterEmail('');
    setTimeout(() => setNewsletterSubscribed(false), 4000);
  };

  return (
    <footer className="w-full bg-[#0E0805] border-t border-[#22140D] text-zinc-400 py-16 px-6 sm:px-12 text-xs">
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 pb-14 border-b border-[#20120B]">
        {/* Col 1: Brand (Reference Image 2) */}
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#20120B] border border-[#cfa851]/40 flex items-center justify-center text-[#fae8be]">
              <Coffee className="w-4 h-4" />
            </div>
            <div>
              <span className="font-serif font-black tracking-widest text-base text-white block leading-none">
                SECRETPRESSO
              </span>
              <span className="text-[7.5px] font-mono tracking-[0.25em] text-[#fae8be]/80 block mt-0.5 uppercase">
                SIP. DISCOVER. COLLECT.
              </span>
            </div>
          </div>

          <p className="text-zinc-400 font-light leading-relaxed text-xs max-w-xs">
            Premium coffee. Hidden surprises. A more joyful you.
          </p>

          {/* Social Icons */}
          <div className="flex items-center gap-3 pt-2 text-zinc-400">
            <a
              href="#instagram"
              aria-label="Instagram"
              className="w-7 h-7 rounded-full bg-[#1A0E08] hover:bg-[#cfa851] hover:text-zinc-950 flex items-center justify-center transition"
            >
              <Instagram className="w-3.5 h-3.5" />
            </a>
            <a
              href="#facebook"
              aria-label="Facebook"
              className="w-7 h-7 rounded-full bg-[#1A0E08] hover:bg-[#cfa851] hover:text-zinc-950 flex items-center justify-center transition"
            >
              <Facebook className="w-3.5 h-3.5" />
            </a>
            <a
              href="#twitter"
              aria-label="Twitter / X"
              className="w-7 h-7 rounded-full bg-[#1A0E08] hover:bg-[#cfa851] hover:text-zinc-950 flex items-center justify-center transition"
            >
              <Twitter className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Col 2: Quick Links (Reference Image 2) */}
        <div className="space-y-3">
          <span className="text-[11px] font-serif font-bold text-white block">
            Quick Links
          </span>
          <ul className="space-y-2 font-sans text-xs">
            <li>
              <a href="#top" className="hover:text-white transition">
                Home
              </a>
            </li>
            <li>
              <a href="#coffee-menu" className="hover:text-white transition">
                Menu
              </a>
            </li>
            <li>
              <a href="#whats-inside" className="hover:text-white transition">
                The Surprise
              </a>
            </li>
            <li>
              <button
                onClick={onOpenOurStory}
                className="hover:text-[#fae8be] transition text-left cursor-pointer"
              >
                Our Story
              </button>
            </li>
            <li>
              <button
                onClick={onOpenTracking}
                className="hover:text-white transition text-left cursor-pointer"
              >
                Track Order
              </button>
            </li>
          </ul>
        </div>

        {/* Col 3: Contact Us (Reference Image 2) */}
        <div className="space-y-3">
          <span className="text-[11px] font-serif font-bold text-white block">
            Contact Us
          </span>
          <div className="space-y-2 text-xs">
            <p>
              <a
                href={`mailto:${storeSettings.businessEmail || 'hello@secretpresso.in'}`}
                className="hover:text-[#fae8be] transition"
              >
                {storeSettings.businessEmail || 'hello@secretpresso.in'}
              </a>
            </p>
            <p className="text-zinc-400 font-light">
              Bengaluru & Kolkata, India
            </p>
            <p className="text-[11px] font-mono text-zinc-500 pt-1">
              Tel: {storeSettings.businessPhone}
            </p>
          </div>
        </div>

        {/* Col 4: Stay in the loop (Reference Image 2) */}
        <div className="space-y-3">
          <span className="text-[11px] font-serif font-bold text-white block">
            Stay in the loop
          </span>
          <p className="text-xs text-zinc-400 font-light leading-relaxed">
            Be the first to know about new flavours, exclusive toys and special offers.
          </p>

          <form onSubmit={handleNewsletterSubmit} className="pt-1">
            <div className="relative flex items-center">
              <input
                type="email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="Your email address"
                required
                className="w-full bg-[#180E09] border border-[#352015] rounded-full px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#fae8be] pr-10"
              />
              <button
                type="submit"
                aria-label="Subscribe to newsletter"
                className="absolute right-1.5 w-7 h-7 rounded-full bg-white hover:bg-[#fae8be] text-zinc-950 flex items-center justify-center transition cursor-pointer"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            {newsletterSubscribed && (
              <p className="text-[11px] text-emerald-400 mt-1 font-mono">
                Thank you for joining the SECRETpresso inner circle!
              </p>
            )}
          </form>
        </div>
      </div>

      {/* Bottom Bar (Reference Image 2) */}
      <div className="max-w-7xl mx-auto pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-zinc-500 text-[11px]">
        <p>© 2026 SECRETpresso. All rights reserved.</p>

        <div className="flex items-center gap-6">
          <a href="#privacy" className="hover:text-zinc-300 transition">
            Privacy Policy
          </a>
          <span>|</span>
          <a href="#terms" className="hover:text-zinc-300 transition">
            Terms & Conditions
          </a>

          {/* Admin Launcher Link */}
          <button
            onClick={onOpenAdmin}
            className="flex items-center gap-1.5 text-[#fae8be]/70 hover:text-[#fae8be] font-mono transition cursor-pointer ml-2"
          >
            <Shield className="w-3 h-3 text-[#cfa851]" />
            <span>Admin Portal</span>
          </button>
        </div>
      </div>
    </footer>
  );
};
