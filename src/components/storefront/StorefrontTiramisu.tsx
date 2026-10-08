import React from 'react';
import { useStore } from '../../context/StoreContext';
import { ArrowRight } from 'lucide-react';
import { OrderItem } from '../../types';
import { SafeImage } from '../common/SafeImage';

interface StorefrontTiramisuProps {
  onOpenCart: () => void;
}

export const StorefrontTiramisu: React.FC<StorefrontTiramisuProps> = ({ onOpenCart }) => {
  const { sections, products, addToCart, isStoreOpen } = useStore();

  const tiramisuConfig = sections.find((s) => s.sectionKey === 'tiramisuSpotlight');
  if (tiramisuConfig && !tiramisuConfig.isVisible) return null;

  // Real-time product sync from Admin Panel
  const tiramisuProduct =
    products.find((p) => p.sku === 'SP-TIR-001') ||
    products.find((p) => p.category === 'Signature Tiramisu') ||
    products[5];

  const handleOrderTiramisu = () => {
    if (!tiramisuProduct || !isStoreOpen) return;
    const price = tiramisuProduct.salePrice || tiramisuProduct.price;
    const item: OrderItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      productId: tiramisuProduct.id,
      productName: tiramisuProduct.name,
      price,
      quantity: 1,
      image: tiramisuProduct.imageUrl,
      customization: {
        specialInstructions: 'Prepared fresh in morning micro-batch with extra cocoa dusting',
      },
      subtotal: price,
    };
    addToCart(item);
    onOpenCart();
  };

  return (
    <section
      id="tiramisu-section"
      className="w-full py-20 sm:py-24 px-6 sm:px-12 bg-[#FAF7F2] text-[#1E140E] relative overflow-hidden transition-colors"
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Column: Large Gourmet Tiramisu Photography (Matching Reference Image 2) */}
          <div className="lg:col-span-6 relative">
            <div className="relative aspect-[4/3] sm:aspect-[1/1] lg:aspect-[4/3] rounded-3xl overflow-hidden shadow-xl border border-[#DDD3C1] group">
              <SafeImage
                src={
                  tiramisuConfig?.imageUrl ||
                  tiramisuProduct?.imageUrl ||
                  'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=1200&q=80'
                }
                imageId={tiramisuConfig?.imageId || tiramisuProduct?.imageId}
                alt="SECRETpresso Signature Tiramisu"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
          </div>

          {/* Right Column: Editorial Copy with Hand-Drawn Annotation & Leaf (Matching Reference Image 2) */}
          <div className="lg:col-span-6 relative space-y-6">
            {/* Hand-drawn annotation & botanical sprig in top right (Reference Image 2) */}
            <div className="absolute -top-12 sm:-top-8 right-0 sm:right-6 max-w-[150px] text-right pointer-events-none">
              <p className="font-hand text-lg sm:text-xl text-[#735A4B] leading-tight rotate-[-4deg]">
                A little
                <br />
                more sweetness
                <br />
                to your day
              </p>
              {/* Curved doodle arrow and sprig SVG */}
              <div className="flex items-center justify-end gap-1 mt-1">
                <svg
                  className="w-9 h-7 text-[#735A4B] rotate-[-10deg]"
                  viewBox="0 0 50 40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M 10 10 Q 25 15 35 28" />
                  <path d="M 28 28 L 35 28 L 33 22" />
                </svg>
                {/* Botanical leaf icon */}
                <svg
                  className="w-6 h-6 text-[#735A4B] opacity-70"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d="M12 2C6.5 2 2 6.5 2 12c0 5 4 9 9 10 5.5 0 10-4.5 10-10C21 6.5 16.5 2 12 2zM12 2v20M2 12c5 0 9-4 10-9" />
                </svg>
              </div>
            </div>

            {/* Eyebrow & Headline */}
            <div className="space-y-1.5 pt-4">
              <span className="text-[10px] font-mono tracking-[0.25em] uppercase text-[#735A4B] font-bold block">
                {tiramisuConfig?.subheading || 'SWEET INDULGENCE'}
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-serif font-bold tracking-tight text-[#1A110B] leading-tight">
                {tiramisuConfig?.heading || 'Our Signature Tiramisu'}
              </h2>
            </div>

            {/* Description */}
            <p className="text-xs sm:text-[13px] text-[#5C4A3E] font-light leading-relaxed max-w-lg">
              {tiramisuConfig?.description ||
                'Layers of rich mascarpone, coffee-soaked biscuits and a hint of cocoa. A timeless classic, now part of your SECRETpresso experience.'}
            </p>

            {/* Order Now Pill Button (Reference Image 2) */}
            <div className="pt-2">
              <button
                onClick={handleOrderTiramisu}
                disabled={!isStoreOpen}
                className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-mono font-bold tracking-wider transition-all duration-300 border cursor-pointer shadow-xs ${
                  !isStoreOpen
                    ? 'border-zinc-300 text-zinc-400 bg-zinc-100 cursor-not-allowed'
                    : 'border-[#1E140E] text-[#1E140E] hover:bg-[#1E140E] hover:text-white'
                }`}
              >
                <span>{tiramisuConfig?.ctaText || 'Order Now'}</span>
                <span className="text-sm">→</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
