import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Product, ProductCustomization, OrderItem } from '../../types';
import {
  X,
  Plus,
  Star,
  Clock,
  Sparkles,
  ShieldCheck,
  Coffee,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { SafeImage } from '../common/SafeImage';

interface StorefrontProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export const StorefrontProductModal: React.FC<StorefrontProductModalProps> = ({
  product,
  isOpen,
  onClose,
}) => {
  const { addToCart, reviews, isStoreOpen } = useStore();

  const [customization, setCustomization] = useState<ProductCustomization>({
    milk: 'Whole',
    sweetness: 'Normal',
    temperature: 'Hot',
    size: 'Regular (250ml)',
    extraShots: 0,
    specialInstructions: '',
  });

  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  if (!isOpen || !product) return null;

  const allImages = [product.imageUrl, ...(product.additionalImages || [])].filter(Boolean);
  const currentDisplayImage = allImages[selectedImageIndex] || product.imageUrl;

  const isSoldOut = product.stock <= 0;
  const hasSale = !!product.salePrice && product.salePrice < product.price;
  const basePrice = product.salePrice || product.price;
  const extraShotCost = (customization.extraShots || 0) * 50;
  const itemPrice = basePrice + extraShotCost;

  const discountPercent = product.discountPercent || (hasSale ? Math.round(((product.price - product.salePrice!) / product.price) * 100) : null);

  // Reviews for this product
  const productReviews = reviews.filter((r) => r.productId === product.id && r.status === 'APPROVED');

  const handleAddToCart = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSoldOut || !isStoreOpen) return;

    const isBeverage = product.category === 'Espresso & Hot' || product.category === 'Iced & Cold Brew';

    const item: OrderItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      productId: product.id,
      productName: product.name,
      price: itemPrice,
      quantity,
      image: currentDisplayImage,
      customization: isBeverage ? customization : undefined,
      subtotal: itemPrice * quantity,
    };

    addToCart(item);
    onClose();
  };

  const isDrink = product.category === 'Espresso & Hot' || product.category === 'Iced & Cold Brew';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#120b08] border border-[#382319] w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-zinc-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/60 hover:bg-black/80 text-zinc-300 hover:text-white transition backdrop-blur-sm cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="overflow-y-auto flex-1">
          {/* Hero Image */}
          <div className="relative h-64 sm:h-72 w-full bg-[#180f0a] overflow-hidden">
            {currentDisplayImage ? (
              <SafeImage
                src={currentDisplayImage}
                alt={product.name}
                className="w-full h-full object-cover transition-all duration-300"
              />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-t from-[#120b08] via-transparent to-black/30 pointer-events-none"></div>

            <div className="absolute top-4 left-4 flex flex-wrap gap-2 z-10">
              {product.badge && (
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#cfa851] text-zinc-950 shadow-lg">
                  {product.badge}
                </span>
              )}
              {discountPercent && discountPercent > 0 && (
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#A43B27] text-white shadow-lg">
                  {discountPercent}% OFF
                </span>
              )}
            </div>

            {/* Gallery thumbnails on image */}
            {allImages.length > 1 && (
              <div className="absolute bottom-12 left-6 right-6 flex items-center gap-2 z-10 overflow-x-auto pb-1">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`w-10 h-10 rounded-lg overflow-hidden border-2 transition shrink-0 cursor-pointer ${
                      selectedImageIndex === idx ? 'border-[#cfa851] scale-105' : 'border-black/60 opacity-70 hover:opacity-100'
                    }`}
                  >
                    {img ? (
                      <SafeImage src={img} alt="" className="w-full h-full object-cover" />
                    ) : null}
                  </button>
                ))}
              </div>
            )}

            <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between text-xs font-mono">
              <span className="text-[#cfa851] uppercase tracking-wider bg-black/60 px-2.5 py-1 rounded backdrop-blur-sm">
                {product.category}
              </span>
              <span className="text-zinc-300 bg-black/60 px-2.5 py-1 rounded backdrop-blur-sm">
                {isSoldOut ? 'Sold Out' : `Stock: ${product.stock} units`}
              </span>
            </div>
          </div>

          {/* Details Content */}
          <div className="p-6 sm:p-8 space-y-6">
            <div>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[#fae8be]">
                  {product.name}
                </h2>
                <div className="flex items-baseline gap-2 font-mono">
                  <span className="text-2xl font-bold text-[#fae8be]">₹{basePrice}</span>
                  {hasSale && (
                    <span className="text-sm text-zinc-500 line-through">₹{product.price}</span>
                  )}
                  {discountPercent && discountPercent > 0 && (
                    <span className="text-xs text-[#cfa851] font-bold">Save {discountPercent}%</span>
                  )}
                </div>
              </div>

              <p className="text-xs sm:text-sm text-zinc-300 mt-3 leading-relaxed font-light">
                {product.description}
              </p>
            </div>

            {/* Ingredients & Allergens badge bar */}
            <div className="p-4 rounded-2xl bg-[#180f0b] border border-[#2b1910] space-y-2 text-xs">
              <div>
                <span className="text-[10px] uppercase font-mono font-bold text-zinc-500">
                  Ingredients
                </span>
                <p className="text-zinc-200 mt-0.5">{product.ingredients?.join(', ') || '100% Specialty Arabica'}</p>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#261710] text-[11px] text-zinc-400">
                <span>Allergens: <strong className="text-zinc-300">{product.allergens?.join(', ') || 'None'}</strong></span>
                <span>Prep Time: ~{product.preparationTimeMinutes} mins</span>
              </div>
            </div>

            {/* Customization Options (if beverage) */}
            {isDrink && (
              <form onSubmit={handleAddToCart} className="space-y-4 pt-2 border-t border-[#261710] text-xs">
                <h4 className="font-bold font-serif text-sm text-[#fae8be]">
                  Custom Barista Formulation
                </h4>

                {/* Milk selection */}
                {product.category !== 'Iced & Cold Brew' && (
                  <div>
                    <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1.5">
                      Milk Type
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {['Whole', 'Oat', 'Almond', 'Skim'].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setCustomization({ ...customization, milk: m as ProductCustomization['milk'] })}
                          className={`p-2 rounded-xl border text-center font-mono transition ${
                            customization.milk === m
                              ? 'bg-[#2a1a12] border-[#cfa851] text-[#fae8be] font-bold shadow'
                              : 'bg-[#180f0b] border-[#2c1b12] text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sweetness */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1.5">
                    Sweetness Level
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {['No Sugar', 'Less Sugar', 'Normal', 'Extra Sweet'].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setCustomization({ ...customization, sweetness: s as ProductCustomization['sweetness'] })}
                        className={`p-2 rounded-xl border text-center font-mono text-[11px] transition ${
                          customization.sweetness === s
                            ? 'bg-[#2a1a12] border-[#cfa851] text-[#fae8be] font-bold'
                            : 'bg-[#180f0b] border-[#2c1b12] text-zinc-400'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Extra Shot */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1.5">
                    Extra 9-Bar Ristretto Shot (+₹50)
                  </label>
                  <div className="flex items-center gap-3">
                    {[0, 1, 2].map((cnt) => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => setCustomization({ ...customization, extraShots: cnt })}
                        className={`px-4 py-2 rounded-xl border font-mono transition ${
                          customization.extraShots === cnt
                            ? 'bg-[#2a1a12] border-[#cfa851] text-[#fae8be] font-bold'
                            : 'bg-[#180f0b] border-[#2c1b12] text-zinc-400'
                        }`}
                      >
                        {cnt === 0 ? 'Standard Shot' : `+${cnt} Shot`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Special Instructions */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                    Special Preparation Notes
                  </label>
                  <input
                    type="text"
                    value={customization.specialInstructions || ''}
                    onChange={(e) => setCustomization({ ...customization, specialInstructions: e.target.value })}
                    placeholder="e.g. Extra hot, light foam, no chocolate..."
                    className="w-full px-3 py-2 bg-[#180f0b] border border-[#352116] rounded-xl text-zinc-100 focus:border-[#cfa851] focus:outline-none"
                  />
                </div>
              </form>
            )}

            {/* Customer Reviews Section */}
            {productReviews.length > 0 && (
              <div className="pt-4 border-t border-[#261710] space-y-3">
                <h4 className="font-bold font-serif text-sm text-[#fae8be]">
                  Connoisseur Tasting Notes ({productReviews.length})
                </h4>
                <div className="space-y-2">
                  {productReviews.map((rev) => (
                    <div key={rev.id} className="p-3 rounded-xl bg-[#180f0b] border border-[#261710] text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-zinc-200">{rev.customerName}</span>
                        <div className="flex text-[#cfa851]">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${i < rev.rating ? 'fill-current' : 'text-zinc-700'}`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-zinc-400 italic">"{rev.comment}"</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Sticky Action Bar */}
        <div className="p-5 border-t border-[#281810] bg-[#160d09] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-400 font-mono">Total:</span>
            <span className="text-xl font-bold font-mono text-[#fae8be]">
              ₹{itemPrice * quantity}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Quantity */}
            <div className="flex items-center gap-2 bg-[#1c110a] rounded-xl p-1 border border-[#382319]">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-2 py-0.5 text-zinc-300 hover:text-[#cfa851]"
              >
                -
              </button>
              <span className="font-mono text-xs font-bold px-1.5">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="px-2 py-0.5 text-zinc-300 hover:text-[#cfa851]"
              >
                +
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={isSoldOut || !isStoreOpen}
              className={`px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition flex items-center gap-2 shadow-xl ${
                isSoldOut
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  : !isStoreOpen
                  ? 'bg-[#251710] text-zinc-500 border border-[#3e271c] cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#fae8be] via-[#cfa851] to-[#b3883b] text-zinc-950 hover:brightness-110 shadow-[#cfa851]/20'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>
                {isSoldOut ? 'Sold Out' : !isStoreOpen ? 'Store Closed' : 'Add to Order'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
