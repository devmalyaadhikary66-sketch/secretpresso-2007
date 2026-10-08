import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Product, ProductCustomization, OrderItem } from '../../types';
import { Plus, ArrowRight, X, Sparkles, Check } from 'lucide-react';

interface StorefrontFeaturedGridProps {
  onOpenCart: () => void;
  onOpenProductDetail: (product: Product) => void;
}

export const StorefrontFeaturedGrid: React.FC<StorefrontFeaturedGridProps> = ({
  onOpenCart,
  onOpenProductDetail,
}) => {
  const { products, sections, addToCart, isStoreOpen } = useStore();

  const sectionConfig = sections.find((s) => s.sectionKey === 'featuredCoffee');
  if (sectionConfig && !sectionConfig.isVisible) return null;

  // Customization modal state
  const [customizingProduct, setCustomizingProduct] = useState<Product | null>(null);
  const [customization, setCustomization] = useState<ProductCustomization>({
    milk: 'Whole',
    sweetness: 'Normal',
    temperature: 'Hot',
    size: 'Regular (250ml)',
    extraShots: 0,
    specialInstructions: '',
  });

  // Take available products from Admin database (e.g. reserve / featured coffees)
  const availableProducts = products.filter((p) => p.isAvailable && !p.isArchived);
  // Show a selection of 6 products in the 3-column grid
  const gridProducts = availableProducts.slice(0, 6);

  const handleQuickAdd = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    if (!isStoreOpen || product.stock <= 0) return;

    if (product.category === 'Espresso & Hot' || product.category === 'Iced & Cold Brew') {
      setCustomizingProduct(product);
      setCustomization({
        milk: product.category === 'Iced & Cold Brew' ? undefined : 'Whole',
        sweetness: 'Normal',
        temperature: product.category === 'Iced & Cold Brew' ? 'Iced' : 'Hot',
        size: 'Regular (250ml)',
        extraShots: 0,
        specialInstructions: '',
      });
      return;
    }

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
  };

  const handleAddCustomizedToCart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customizingProduct || !isStoreOpen) return;

    const basePrice = customizingProduct.salePrice || customizingProduct.price;
    const extraShotCost = (customization.extraShots || 0) * 50;
    const finalItemPrice = basePrice + extraShotCost;

    const item: OrderItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      productId: customizingProduct.id,
      productName: customizingProduct.name,
      price: finalItemPrice,
      quantity: 1,
      image: customizingProduct.imageUrl,
      customization,
      subtotal: finalItemPrice,
    };

    addToCart(item);
    setCustomizingProduct(null);
  };

  return (
    <section className="w-full bg-[#FAF7F2] text-[#1E140E] pt-6 pb-20 px-4 sm:px-8 lg:px-12 border-t border-[#E8DFC8]/60 transition-colors">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="mb-10 text-center max-w-2xl mx-auto space-y-2">
          <span className="text-[10px] font-mono tracking-[0.25em] uppercase text-[#735A4B] font-bold block">
            {sectionConfig?.subheading || 'ROASTERY RESERVE'}
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif font-black tracking-tight text-[#1A110B]">
            {sectionConfig?.heading || 'Curated Coffee Collection'}
          </h2>
          <p className="text-xs text-[#5C4A3E] font-light leading-relaxed">
            {sectionConfig?.description ||
              'Small-batch artisanal roasts and signature espresso creations crafted for discerning coffee lovers.'}
          </p>
        </div>

        {/* 
          3-COLUMN COFFEE PRODUCT GRID:
          - Desktop: 3 columns (lg:grid-cols-3)
          - Tablet: 2 columns (sm:grid-cols-2)
          - Mobile: 1 column (grid-cols-1)
        */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {gridProducts.map((product) => {
            const isSoldOut = product.stock <= 0;
            const currentPrice = product.salePrice || product.price;
            const hasDiscount = product.salePrice && product.salePrice < product.price;
            const discountPercent = hasDiscount
              ? Math.round(((product.price - product.salePrice!) / product.price) * 100)
              : null;

            return (
              <div
                key={product.id}
                onClick={() => onOpenProductDetail(product)}
                className="group bg-white rounded-3xl p-4 sm:p-5 border border-[#E5DCCF] hover:border-[#1E140E]/40 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer"
              >
                <div>
                  {/* Image container */}
                  <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-[#ECE4D8] mb-4">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : null}

                    {/* Badge & Discount */}
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
                      {product.badge && (
                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider bg-black/75 text-[#fae8be] backdrop-blur-sm shadow-xs">
                          {product.badge}
                        </span>
                      )}
                      {hasDiscount && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-[#A8382B] text-white shadow-xs">
                          -{discountPercent}%
                        </span>
                      )}
                    </div>

                    {/* Stock pill */}
                    <div className="absolute bottom-3 right-3 z-10">
                      {isSoldOut ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[8.5px] font-mono font-bold bg-zinc-900/90 text-white uppercase tracking-wider">
                          Sold Out
                        </span>
                      ) : product.stock <= 10 ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[8.5px] font-mono font-bold bg-amber-500/90 text-zinc-950 uppercase tracking-wider">
                          Only {product.stock} Left
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Typography & Details */}
                  <div className="space-y-1.5 text-left">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#8C6D3B] font-semibold block">
                      {product.category}
                    </span>
                    <h3 className="font-serif font-bold text-base text-[#1E140E] leading-snug group-hover:text-[#8C6D3B] transition-colors">
                      {product.name}
                    </h3>
                    {product.shortDescription && (
                      <p className="text-xs text-[#5C4A3E] font-light line-clamp-2 leading-relaxed">
                        {product.shortDescription}
                      </p>
                    )}
                  </div>
                </div>

                {/* Price Row & Action */}
                <div className="pt-4 mt-4 border-t border-[#F0E8DC] flex items-center justify-between">
                  <div className="flex items-baseline gap-2">
                    <span className="font-serif font-bold text-base text-[#1E140E]">
                      ₹{currentPrice}
                    </span>
                    {hasDiscount && (
                      <span className="text-xs text-[#9E8E82] line-through font-mono">
                        ₹{product.price}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenProductDetail(product);
                      }}
                      className="text-[11px] font-mono text-[#735A4B] hover:text-[#1E140E] transition-colors cursor-pointer"
                    >
                      Details
                    </button>
                    <button
                      onClick={(e) => handleQuickAdd(e, product)}
                      disabled={isSoldOut || !isStoreOpen}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                        isSoldOut || !isStoreOpen
                          ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                          : 'bg-[#1E140E] text-white hover:bg-[#735A4B] hover:scale-102 shadow-xs'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Barista Customization Modal */}
      {customizingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#120b08] border border-[#3e271c] w-full max-w-lg rounded-3xl shadow-2xl p-6 text-zinc-100 relative">
            <div className="flex items-start justify-between pb-4 border-b border-[#24150e]">
              <div className="flex items-center gap-3">
                {customizingProduct.imageUrl ? (
                  <img
                    src={customizingProduct.imageUrl}
                    alt={customizingProduct.name}
                    className="w-12 h-12 rounded-xl object-cover"
                  />
                ) : null}
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#cfa851]">
                    Barista Craft
                  </span>
                  <h3 className="font-serif text-base font-bold text-[#fae8be]">
                    {customizingProduct.name}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setCustomizingProduct(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCustomizedToCart} className="py-4 space-y-4 text-xs">
              {/* Milk Option */}
              {customizingProduct.category === 'Espresso & Hot' && (
                <div>
                  <label className="block text-zinc-400 font-mono text-[10px] uppercase mb-1.5">
                    Milk Selection
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['Whole', 'Oat', 'Almond', 'Skim'] as const).map((milkType) => (
                      <button
                        type="button"
                        key={milkType}
                        onClick={() => setCustomization({ ...customization, milk: milkType })}
                        className={`py-2 rounded-xl text-center font-medium transition cursor-pointer ${
                          customization.milk === milkType
                            ? 'bg-[#cfa851] text-zinc-950 font-bold'
                            : 'bg-[#1b110b] text-zinc-300 border border-[#342015]'
                        }`}
                      >
                        {milkType}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Sweetness */}
              <div>
                <label className="block text-zinc-400 font-mono text-[10px] uppercase mb-1.5">
                  Sweetness Calibration
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['No Sugar', 'Less Sugar', 'Normal', 'Extra Sweet'] as const).map((sweet) => (
                    <button
                      type="button"
                      key={sweet}
                      onClick={() => setCustomization({ ...customization, sweetness: sweet })}
                      className={`py-2 rounded-xl text-center font-medium transition cursor-pointer ${
                        customization.sweetness === sweet
                          ? 'bg-[#cfa851] text-zinc-950 font-bold'
                          : 'bg-[#1b110b] text-zinc-300 border border-[#342015]'
                      }`}
                    >
                      {sweet}
                    </button>
                  ))}
                </div>
              </div>

              {/* Extra Ristretto Shot */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-[#1a100a] border border-[#2b1910]">
                <div>
                  <span className="font-semibold text-zinc-200 block">Extra Espresso Shot</span>
                  <span className="text-[11px] text-zinc-400">+₹50 double extraction</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setCustomization({
                        ...customization,
                        extraShots: Math.max(0, (customization.extraShots || 0) - 1),
                      })
                    }
                    className="w-7 h-7 rounded-lg bg-[#271810] text-zinc-300 flex items-center justify-center font-mono font-bold"
                  >
                    -
                  </button>
                  <span className="w-5 text-center font-mono font-bold text-sm text-[#fae8be]">
                    {customization.extraShots || 0}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setCustomization({
                        ...customization,
                        extraShots: (customization.extraShots || 0) + 1,
                      })
                    }
                    className="w-7 h-7 rounded-lg bg-[#271810] text-zinc-300 flex items-center justify-center font-mono font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase text-zinc-400 block">Item Subtotal</span>
                  <span className="text-lg font-mono font-bold text-[#fae8be]">
                    ₹{(customizingProduct.salePrice || customizingProduct.price) + (customization.extraShots || 0) * 50}
                  </span>
                </div>

                <button
                  type="submit"
                  className="px-6 py-3 rounded-full bg-white hover:bg-[#fae8be] text-zinc-950 font-bold text-xs uppercase tracking-wider transition cursor-pointer shadow-lg"
                >
                  Add to Bag
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
