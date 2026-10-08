import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { Product, ProductCustomization, OrderItem } from '../../types';
import { Plus, X } from 'lucide-react';
import { SafeImage } from '../common/SafeImage';

interface StorefrontProductsProps {
  onOpenCart: () => void;
  onOpenProductDetail?: (product: Product) => void;
}

export const StorefrontProducts: React.FC<StorefrontProductsProps> = ({
  onOpenCart,
  onOpenProductDetail,
}) => {
  const { products, addToCart, isStoreOpen } = useStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Customization modal state for coffee beverages
  const [customizingProduct, setCustomizingProduct] = useState<Product | null>(null);
  const [customization, setCustomization] = useState<ProductCustomization>({
    milk: 'Whole',
    sweetness: 'Normal',
    temperature: 'Hot',
    size: 'Regular (250ml)',
    extraShots: 0,
    specialInstructions: '',
  });

  const categories = [
    'ALL',
    'Espresso & Hot',
    'Iced & Cold Brew',
    'Signature Tiramisu',
    'Beans & Roast',
  ];

  // Dynamically fed from Admin Panel products
  const visibleProducts = useMemo(() => {
    return products.filter((p) => {
      const isVisible = p.isAvailable && !p.isArchived;
      const isCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
      return isVisible && isCategory;
    });
  }, [products, selectedCategory]);

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
    <section id="coffee-menu" className="w-full bg-[#FAF7F2] text-[#1E140E] pt-12 sm:pt-16 pb-16 px-4 sm:px-8 lg:px-12 transition-colors">
      <div className="max-w-7xl mx-auto">
        {/* Section Header: Matching Reference Image 2 visual hierarchy */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 sm:mb-8">
          {/* Left Title */}
          <div className="space-y-1 max-w-md">
            <span className="text-[10px] font-mono tracking-[0.25em] uppercase text-[#735A4B] font-bold block">
              OUR MENU
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-black tracking-tight text-[#1A110B]">
              Coffee Flavours
            </h2>
          </div>

          {/* Right Description & View All */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 md:max-w-md md:text-right md:justify-end">
            <p className="text-xs text-[#5C4A3E] font-light leading-relaxed">
              From classic favourites to exciting new blends, choose your perfect cup. Each one comes with a surprise inside.
            </p>
            <button
              onClick={() => setSelectedCategory('ALL')}
              className="text-xs font-mono font-bold tracking-wider text-[#1A110B] hover:text-[#8C6D3B] transition-colors flex items-center gap-1 shrink-0 self-start sm:self-auto cursor-pointer"
            >
              <span>View All</span>
              <span className="text-sm">→</span>
            </button>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-6 sm:mb-8 no-scrollbar text-[11px] font-mono">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full whitespace-nowrap transition-all duration-200 cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#1E140E] text-white font-bold shadow-xs'
                  : 'bg-white/80 text-[#5C4A3E] hover:text-[#1E140E] border border-[#DDD3C1]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* 
          ONE UNIFIED COMPACT PRODUCT COLLECTION / GRID
          - Desktop: 5 compact products in one row (lg:grid-cols-5)
          - Tablet: 3 to 4 products per row (sm:grid-cols-3 md:grid-cols-4)
          - Mobile: 2 products per row (grid-cols-2)
          - Sizing is compact and balanced matching Reference Image 2
        */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-3.5 sm:gap-x-4 lg:gap-x-5 gap-y-6 sm:gap-y-8">
          {visibleProducts.map((product) => {
            const isSoldOut = product.stock <= 0;
            const hasSale = !!product.salePrice && product.salePrice < product.price;
            const currentPrice = hasSale ? product.salePrice! : product.price;

            return (
              <div
                key={product.id}
                onClick={() => onOpenProductDetail && onOpenProductDetail(product)}
                className="group flex flex-col justify-between cursor-pointer transition-transform duration-300 hover:-translate-y-1"
              >
                <div>
                  {/* Compact Arched Portrait Frame */}
                  <div className="relative w-full aspect-[3/4] rounded-t-[38px] sm:rounded-t-[44px] rounded-b-xl overflow-hidden bg-[#ECE4D8] border border-[#DDD3C1] group-hover:border-[#1E140E]/40 transition-colors shadow-xs">
                    <SafeImage
                      src={product.imageUrl}
                      imageId={product.imageId || product.mainImageId}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      fallbackSrc="https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?auto=format&fit=crop&w=800&q=80"
                    />

                    {/* Subtle badge if present */}
                    {product.badge && (
                      <span className="absolute top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[8px] font-mono font-bold uppercase tracking-wider bg-black/65 text-white backdrop-blur-xs shadow-xs whitespace-nowrap">
                        {product.badge}
                      </span>
                    )}

                    {/* Sold out overlay */}
                    {isSoldOut && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
                        <span className="px-2 py-0.5 rounded-full bg-zinc-900 text-white font-mono text-[8px] font-bold uppercase tracking-wider">
                          Sold Out
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Minimal Typography: Name and Tasting Notes */}
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

                {/* Price & Small Circular + Button */}
                <div className="pt-1.5 mt-1 flex items-center justify-between">
                  <div className="flex items-baseline gap-1.5 font-mono">
                    <span className="font-serif font-bold text-xs sm:text-sm text-[#1E140E]">
                      ₹{currentPrice}
                    </span>
                    {hasSale && (
                      <span className="text-[10px] text-[#9E8B7A] line-through">
                        ₹{product.price}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={(e) => handleQuickAdd(e, product)}
                    disabled={isSoldOut || !isStoreOpen}
                    title={isSoldOut ? 'Sold Out' : 'Add to Bag'}
                    className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border border-[#9E8B7A] flex items-center justify-center transition-all duration-200 cursor-pointer ${
                      isSoldOut || !isStoreOpen
                        ? 'opacity-40 cursor-not-allowed'
                        : 'text-[#1E140E] hover:bg-[#1E140E] hover:text-white hover:border-[#1E140E]'
                    }`}
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {visibleProducts.length === 0 && (
          <div className="py-12 text-center rounded-2xl bg-white/60 border border-[#E8DEC9]">
            <p className="text-xs sm:text-sm font-serif text-[#735A4B]">No products found in this category.</p>
            <button
              onClick={() => setSelectedCategory('ALL')}
              className="mt-2 text-xs font-mono font-bold text-[#1E140E] underline cursor-pointer"
            >
              Show All Products
            </button>
          </div>
        )}
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
                className="p-1 rounded-lg text-zinc-400 hover:text-white cursor-pointer"
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
                    className="w-7 h-7 rounded-lg bg-[#271810] text-zinc-300 flex items-center justify-center font-mono font-bold cursor-pointer"
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
                    className="w-7 h-7 rounded-lg bg-[#271810] text-zinc-300 flex items-center justify-center font-mono font-bold cursor-pointer"
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
