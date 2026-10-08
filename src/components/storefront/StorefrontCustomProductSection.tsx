import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useStore } from '../../context/StoreContext';
import { Product, OrderItem, WebsiteSectionConfig } from '../../types';
import { ChevronLeft, ChevronRight, Plus, Minus, Check, Sparkles } from 'lucide-react';
import { SafeImage } from '../common/SafeImage';

interface StorefrontCustomProductSectionProps {
  sectionConfig: WebsiteSectionConfig;
  onOpenCart: () => void;
  onOpenProductDetail?: (product: Product) => void;
}

export const StorefrontCustomProductSection: React.FC<StorefrontCustomProductSectionProps> = ({
  sectionConfig,
  onOpenCart,
  onOpenProductDetail,
}) => {
  const { products, cart, addToCart, updateCartQuantity, isStoreOpen } = useStore();

  const sliderRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftStart, setScrollLeftStart] = useState(0);
  const [hasMoved, setHasMoved] = useState(false);

  if (sectionConfig.isVisible === false) return null;

  // Retrieve products assigned to this section
  const sectionProducts = products
    .filter((p) => {
      if (p.isArchived || !p.isAvailable) return false;
      if (p.sectionId && (p.sectionId === sectionConfig.id || p.sectionId === sectionConfig.sectionKey)) return true;
      if (sectionConfig.targetProductIds && sectionConfig.targetProductIds.includes(p.id)) return true;
      if (sectionConfig.products && sectionConfig.products.includes(p.id)) return true;
      if (p.category && sectionConfig.name && p.category.toLowerCase().trim() === sectionConfig.name.toLowerCase().trim()) return true;
      if (p.categoryId && sectionConfig.categoryIds && sectionConfig.categoryIds.includes(p.categoryId)) return true;
      return false;
    })
    .sort((a, b) => (a.displayOrder || 99) - (b.displayOrder || 99));

  const isSlider = sectionConfig.displayStyle !== 'grid'; // Default is 'slider'

  const checkScroll = useCallback(() => {
    if (!sliderRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 4);
  }, []);

  useEffect(() => {
    if (isSlider) {
      checkScroll();
      window.addEventListener('resize', checkScroll);
      return () => window.removeEventListener('resize', checkScroll);
    }
  }, [isSlider, checkScroll, sectionProducts.length]);

  const scroll = (direction: 'left' | 'right') => {
    if (!sliderRef.current) return;
    const container = sliderRef.current;
    const cardWidth = container.clientWidth > 768 ? 280 : 220;
    const scrollAmount = direction === 'left' ? -cardWidth * 2 : cardWidth * 2;
    container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    setTimeout(checkScroll, 350);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!sliderRef.current) return;
    setIsDragging(true);
    setHasMoved(false);
    setStartX(e.pageX - sliderRef.current.offsetLeft);
    setScrollLeftStart(sliderRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !sliderRef.current) return;
    e.preventDefault();
    const x = e.pageX - sliderRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    if (Math.abs(walk) > 5) setHasMoved(true);
    sliderRef.current.scrollLeft = scrollLeftStart - walk;
    checkScroll();
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    checkScroll();
  };

  const getItemCartQuantity = (productId: string) => {
    const item = cart.find((c) => c.productId === productId);
    return item ? item.quantity : 0;
  };

  const handleAdd = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    if (!isStoreOpen || product.stock <= 0) return;

    const existingCartItem = cart.find((c) => c.productId === product.id);
    if (existingCartItem) {
      updateCartQuantity(existingCartItem.id, existingCartItem.quantity + 1);
    } else {
      const item: OrderItem = {
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        productId: product.id,
        productName: product.name,
        price: product.salePrice || product.price,
        quantity: 1,
        image: product.imageUrl,
        subtotal: product.salePrice || product.price,
      };
      addToCart(item);
    }
  };

  const handleMinus = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    const existingCartItem = cart.find((c) => c.productId === product.id);
    if (existingCartItem) {
      updateCartQuantity(existingCartItem.id, existingCartItem.quantity - 1);
    }
  };

  return (
    <section
      id={sectionConfig.sectionKey || sectionConfig.id}
      className="w-full bg-[#FAF7F2] text-[#1E140E] pt-10 sm:pt-14 pb-16 px-4 sm:px-8 lg:px-12 border-t border-[#EAE2D5] transition-colors overflow-hidden"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 sm:mb-8">
          <div className="space-y-1 max-w-xl">
            {sectionConfig.subheading && (
              <span className="text-[10px] font-mono tracking-[0.25em] uppercase text-[#735A4B] font-bold block">
                {sectionConfig.subheading}
              </span>
            )}
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-black tracking-tight text-[#1A110B]">
              {sectionConfig.heading || sectionConfig.name}
            </h2>
            {sectionConfig.description && (
              <p className="text-xs text-[#5C4A3E] font-light leading-relaxed max-w-lg mt-1">
                {sectionConfig.description}
              </p>
            )}
          </div>

          {/* Slider Controls if Slider display mode */}
          {isSlider && (
            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <button
                type="button"
                onClick={() => scroll('left')}
                disabled={!canScrollLeft}
                aria-label="Previous products"
                className="w-9 h-9 rounded-full bg-[#EDE4D6] hover:bg-[#DDD2C0] disabled:opacity-30 disabled:pointer-events-none text-[#1A110B] flex items-center justify-center border border-[#DDD3C1] transition shadow-xs cursor-pointer active:scale-95"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scroll('right')}
                disabled={!canScrollRight}
                aria-label="Next products"
                className="w-9 h-9 rounded-full bg-[#EDE4D6] hover:bg-[#DDD2C0] disabled:opacity-30 disabled:pointer-events-none text-[#1A110B] flex items-center justify-center border border-[#DDD3C1] transition shadow-xs cursor-pointer active:scale-95"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Display Style: Slider or Grid */}
        {isSlider ? (
          <div
            ref={sliderRef}
            onScroll={checkScroll}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className={`flex gap-3.5 sm:gap-4 lg:gap-5 overflow-x-auto no-scrollbar scroll-smooth pb-3 pt-1 -mx-4 px-4 sm:-mx-8 sm:px-8 lg:-mx-12 lg:px-12 ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {sectionProducts.map((product) => {
              const isSoldOut = product.stock <= 0;
              const hasSale = !!product.salePrice && product.salePrice < product.price;
              const currentPrice = hasSale ? product.salePrice! : product.price;
              const cartQty = getItemCartQuantity(product.id);

              return (
                <div
                  key={product.id}
                  onClick={() => {
                    if (!hasMoved && onOpenProductDetail) {
                      onOpenProductDetail(product);
                    }
                  }}
                  className="group flex flex-col justify-between shrink-0 cursor-pointer transition-transform duration-300 hover:-translate-y-1 w-[72vw] sm:w-[220px] md:w-[240px] lg:w-[250px] xl:w-[260px]"
                >
                  <div>
                    <div className="relative w-full aspect-[3/4] rounded-t-[38px] sm:rounded-t-[44px] rounded-b-xl overflow-hidden bg-[#ECE4D8] border border-[#DDD3C1] group-hover:border-[#1E140E]/40 transition-colors shadow-xs">
                      <SafeImage
                        src={product.imageUrl}
                        imageId={product.imageId || product.mainImageId}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 pointer-events-none"
                        fallbackSrc="https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=800&q=80"
                      />
                      {product.badge && (
                        <span className="absolute top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[8px] font-mono font-bold uppercase tracking-wider bg-black/70 text-white backdrop-blur-xs shadow-xs whitespace-nowrap z-10">
                          {product.badge}
                        </span>
                      )}
                      {isSoldOut && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-20">
                          <span className="px-2 py-0.5 rounded-full bg-zinc-900 text-white font-mono text-[8px] font-bold uppercase tracking-wider">
                            Sold Out
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-2.5 space-y-0.5 text-left">
                      <h3 className="font-serif font-bold text-xs sm:text-[13px] text-[#1E140E] leading-snug line-clamp-1 group-hover:text-[#8C6D3B] transition-colors">
                        {product.name}
                      </h3>
                      {product.shortDescription && (
                        <p className="text-[9.5px] sm:text-[10px] text-[#735A4B] font-light line-clamp-1">
                          {product.shortDescription}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 pt-2 border-t border-[#EAE2D5] flex items-center justify-between">
                    <div className="flex items-baseline gap-1">
                      <span className="text-[10px] font-mono text-[#8C6D3B]">₹</span>
                      <span className="font-serif font-bold text-sm text-[#1E140E]">{currentPrice}</span>
                      {hasSale && (
                        <span className="text-[10px] text-zinc-400 line-through">₹{product.price}</span>
                      )}
                    </div>

                    {cartQty > 0 ? (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1.5 bg-[#EDE4D6] rounded-full p-0.5 border border-[#DDD3C1]"
                      >
                        <button
                          type="button"
                          onClick={(e) => handleMinus(e, product)}
                          className="w-5 h-5 rounded-full bg-white text-[#1E140E] flex items-center justify-center hover:bg-zinc-100 transition shadow-xs text-xs cursor-pointer"
                        >
                          <Minus className="w-2.5 h-2.5" />
                        </button>
                        <span className="font-mono text-[10px] font-bold px-1 min-w-[14px] text-center text-[#1E140E]">
                          {cartQty}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleAdd(e, product)}
                          disabled={isSoldOut || (product.stock > 0 && cartQty >= product.stock)}
                          className="w-5 h-5 rounded-full bg-[#1E140E] text-white flex items-center justify-center hover:bg-[#341F14] transition shadow-xs text-xs disabled:opacity-40 cursor-pointer"
                        >
                          <Plus className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={isSoldOut || !isStoreOpen}
                        onClick={(e) => handleAdd(e, product)}
                        className="px-2.5 py-1 rounded-full bg-[#EDE4D6] hover:bg-[#1E140E] text-[#1E140E] hover:text-white border border-[#DDD3C1] hover:border-[#1E140E] text-[10px] font-mono font-bold uppercase tracking-wider transition-all duration-200 flex items-center gap-1 shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <Plus className="w-2.5 h-2.5" />
                        <span>Add</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Grid Display Style */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-x-3.5 sm:gap-x-4 lg:gap-x-5 gap-y-6 sm:gap-y-8">
            {sectionProducts.map((product) => {
              const isSoldOut = product.stock <= 0;
              const hasSale = !!product.salePrice && product.salePrice < product.price;
              const currentPrice = hasSale ? product.salePrice! : product.price;
              const cartQty = getItemCartQuantity(product.id);

              return (
                <div
                  key={product.id}
                  onClick={() => onOpenProductDetail && onOpenProductDetail(product)}
                  className="group flex flex-col justify-between cursor-pointer transition-transform duration-300 hover:-translate-y-1"
                >
                  <div>
                    <div className="relative w-full aspect-[3/4] rounded-t-[38px] sm:rounded-t-[44px] rounded-b-xl overflow-hidden bg-[#ECE4D8] border border-[#DDD3C1] group-hover:border-[#1E140E]/40 transition-colors shadow-xs">
                      <SafeImage
                        src={product.imageUrl}
                        imageId={product.imageId || product.mainImageId}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        fallbackSrc="https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=800&q=80"
                      />
                      {product.badge && (
                        <span className="absolute top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[8px] font-mono font-bold uppercase tracking-wider bg-black/65 text-white backdrop-blur-xs shadow-xs whitespace-nowrap z-10">
                          {product.badge}
                        </span>
                      )}
                      {isSoldOut && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-20">
                          <span className="px-2 py-0.5 rounded-full bg-zinc-900 text-white font-mono text-[8px] font-bold uppercase tracking-wider">
                            Sold Out
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-2.5 space-y-0.5 text-left">
                      <h3 className="font-serif font-bold text-xs sm:text-[13px] text-[#1E140E] leading-snug line-clamp-1 group-hover:text-[#8C6D3B] transition-colors">
                        {product.name}
                      </h3>
                      {product.shortDescription && (
                        <p className="text-[9.5px] sm:text-[10px] text-[#735A4B] font-light line-clamp-1">
                          {product.shortDescription}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 pt-2 border-t border-[#EAE2D5] flex items-center justify-between">
                    <div className="flex items-baseline gap-1">
                      <span className="text-[10px] font-mono text-[#8C6D3B]">₹</span>
                      <span className="font-serif font-bold text-sm text-[#1E140E]">{currentPrice}</span>
                      {hasSale && (
                        <span className="text-[10px] text-zinc-400 line-through">₹{product.price}</span>
                      )}
                    </div>

                    {cartQty > 0 ? (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1.5 bg-[#EDE4D6] rounded-full p-0.5 border border-[#DDD3C1]"
                      >
                        <button
                          type="button"
                          onClick={(e) => handleMinus(e, product)}
                          className="w-5 h-5 rounded-full bg-white text-[#1E140E] flex items-center justify-center hover:bg-zinc-100 transition shadow-xs text-xs cursor-pointer"
                        >
                          <Minus className="w-2.5 h-2.5" />
                        </button>
                        <span className="font-mono text-[10px] font-bold px-1 min-w-[14px] text-center text-[#1E140E]">
                          {cartQty}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleAdd(e, product)}
                          disabled={isSoldOut || (product.stock > 0 && cartQty >= product.stock)}
                          className="w-5 h-5 rounded-full bg-[#1E140E] text-white flex items-center justify-center hover:bg-[#341F14] transition shadow-xs text-xs disabled:opacity-40 cursor-pointer"
                        >
                          <Plus className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={isSoldOut || !isStoreOpen}
                        onClick={(e) => handleAdd(e, product)}
                        className="px-2.5 py-1 rounded-full bg-[#EDE4D6] hover:bg-[#1E140E] text-[#1E140E] hover:text-white border border-[#DDD3C1] hover:border-[#1E140E] text-[10px] font-mono font-bold uppercase tracking-wider transition-all duration-200 flex items-center gap-1 shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <Plus className="w-2.5 h-2.5" />
                        <span>Add</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
