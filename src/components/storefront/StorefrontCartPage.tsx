import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  Tag,
  ShieldCheck,
  CheckCircle2,
  Coffee,
  Sparkles,
} from 'lucide-react';
import { SafeImage } from '../common/SafeImage';

interface StorefrontCartPageProps {
  onContinueShopping: () => void;
  onProceedToCheckout: () => void;
}

export const StorefrontCartPage: React.FC<StorefrontCartPageProps> = ({
  onContinueShopping,
  onProceedToCheckout,
}) => {
  const {
    cart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    storeSettings,
    validateCoupon,
  } = useStore();

  // Coupon state
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponDiscount, setCouponDiscount] = useState<number>(0);
  const [couponError, setCouponError] = useState<string | null>(null);

  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const deliveryFee =
    subtotal >= storeSettings.freeDeliveryThreshold ? 0 : storeSettings.defaultDeliveryFee;
  const taxableAmount = Math.max(0, subtotal - couponDiscount);
  const taxes = parseFloat(((taxableAmount * storeSettings.taxRatePercent) / 100).toFixed(2));
  const finalAmount = parseFloat((taxableAmount + deliveryFee + taxes).toFixed(2));

  const amountToFreeDelivery = Math.max(0, storeSettings.freeDeliveryThreshold - subtotal);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError(null);
    if (!couponInput.trim()) return;

    const res = validateCoupon(couponInput, subtotal);
    if (res.valid) {
      setAppliedCoupon(couponInput.trim().toUpperCase());
      setCouponDiscount(res.discount);
      setCouponError(null);
    } else {
      setCouponError(res.message);
      setAppliedCoupon(null);
      setCouponDiscount(0);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponInput('');
    setCouponError(null);
  };

  if (cart.length === 0) {
    return (
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto min-h-[65vh] flex flex-col items-center justify-center text-center animate-in fade-in duration-300">
        <div className="w-20 h-20 rounded-full bg-[#1b100a] border border-[#3e271c] flex items-center justify-center text-[#cfa851] mb-6 shadow-2xl">
          <ShoppingBag className="w-9 h-9" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#fae8be] mb-3">
          Your Secretpresso Cart is Empty
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 max-w-md mb-8 leading-relaxed">
          Looks like you haven't selected any artisan brews or handcrafted surprises yet. Explore our freshly roasted selection.
        </p>
        <button
          onClick={onContinueShopping}
          className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full bg-white hover:bg-zinc-100 text-zinc-950 font-sans font-bold text-xs uppercase tracking-wider transition-all duration-300 shadow-xl hover:scale-[1.02] cursor-pointer"
        >
          <Coffee className="w-4 h-4 text-[#cfa851]" />
          <span>Explore Our Brews</span>
        </button>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto animate-in fade-in duration-300 text-zinc-100">
      {/* Top Breadcrumb & Page Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-[#281810]">
        <div>
          <button
            onClick={onContinueShopping}
            className="inline-flex items-center gap-1.5 text-xs text-[#cfa851] hover:text-[#fae8be] font-mono uppercase tracking-wider mb-2 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Continue Shopping</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white flex items-center gap-3">
            <span>Your Coffee Cart</span>
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-[#24150e] border border-[#3e271c] text-[#cfa851]">
              {totalItems} {totalItems === 1 ? 'Item' : 'Items'}
            </span>
          </h1>
        </div>

        {cart.length > 0 && (
          <button
            onClick={clearCart}
            className="text-xs text-zinc-400 hover:text-red-400 font-mono transition flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Bag</span>
          </button>
        )}
      </div>

      {/* Main Grid: Cart Items on Left, Order Summary on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Products List */}
        <div className="lg:col-span-7 space-y-4">
          {cart.map((item) => (
            <div
              key={item.id}
              className="p-4 sm:p-5 rounded-2xl bg-[#140c08] border border-[#2b190f] hover:border-[#3a2216] transition-all duration-200 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              {/* Product Info & Thumbnail */}
              <div className="flex items-center gap-4 min-w-0 flex-1">
                {item.image ? (
                  <SafeImage
                    src={item.image}
                    alt={item.productName}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover bg-zinc-900 border border-[#301c12] shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-zinc-900 border border-[#301c12] flex items-center justify-center text-[#cfa851] shrink-0">
                    <Coffee className="w-6 h-6" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="font-serif font-bold text-sm sm:text-base text-white truncate">
                    {item.productName}
                  </h3>
                  <p className="text-xs font-mono text-[#cfa851] mt-0.5">
                    ₹{item.price.toFixed(0)} each
                  </p>

                  {/* Customization pills if applicable */}
                  {item.customization && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {item.customization.size && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#22130b] text-zinc-300 border border-[#382115]">
                          Size: {item.customization.size}
                        </span>
                      )}
                      {item.customization.milk && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#22130b] text-zinc-300 border border-[#382115]">
                          {item.customization.milk} Milk
                        </span>
                      )}
                      {item.customization.sweetness && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#22130b] text-zinc-300 border border-[#382115]">
                          {item.customization.sweetness}
                        </span>
                      )}
                      {item.customization.temperature && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#22130b] text-zinc-300 border border-[#382115]">
                          {item.customization.temperature}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Quantity Controls, Subtotal & Remove */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-[#22130b]">
                <div className="text-right">
                  <span className="text-sm sm:text-base font-bold font-mono text-[#fae8be]">
                    ₹{item.subtotal.toFixed(0)}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {/* Quantity adjustment */}
                  <div className="flex items-center rounded-full bg-[#1e110b] border border-[#3a2216] px-2 py-1">
                    <button
                      onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                      className="p-1 rounded-full hover:bg-white/10 text-zinc-300 hover:text-white transition cursor-pointer"
                      title="Decrease quantity"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-mono text-xs font-bold w-7 text-center text-white">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                      className="p-1 rounded-full hover:bg-white/10 text-zinc-300 hover:text-white transition cursor-pointer"
                      title="Increase quantity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-950/20 transition cursor-pointer"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Delivery perk banner */}
          <div className="p-3.5 rounded-xl bg-[#1b100a] border border-[#382216] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#cfa851]" />
              <span className="text-zinc-300 font-sans">
                {amountToFreeDelivery > 0 ? (
                  <>
                    Add <strong className="text-[#fae8be] font-mono">₹{amountToFreeDelivery.toFixed(0)}</strong> more for{' '}
                    <strong className="text-emerald-400 uppercase">FREE DELIVERY</strong>
                  </>
                ) : (
                  <span className="text-emerald-400 font-bold uppercase tracking-wide">
                    ✓ You have unlocked FREE DELIVERY!
                  </span>
                )}
              </span>
            </div>
            <span className="text-[10px] font-mono text-zinc-500 uppercase">
              Secretpresso Standard
            </span>
          </div>
        </div>

        {/* Right Column: Order Summary & Checkout Actions */}
        <div className="lg:col-span-5 space-y-5">
          <div className="p-6 rounded-3xl bg-[#140c08] border border-[#2e1b11] shadow-2xl space-y-6">
            <h2 className="text-lg font-serif font-bold text-white pb-3 border-b border-[#25150e]">
              Order Summary
            </h2>

            {/* Coupon Code Section */}
            <div>
              <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-2">
                Have a Secret Voucher / Promo Code?
              </label>
              {!appliedCoupon ? (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      placeholder="e.g. WELCOME50, SECRET10"
                      className="w-full pl-8 pr-3 py-2 bg-[#1d1009] border border-[#3b2318] rounded-xl text-xs font-mono text-white placeholder-zinc-500 uppercase focus:border-[#cfa851] focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#26150e] hover:bg-[#341d13] border border-[#44281b] text-[#fae8be] text-xs font-bold font-mono transition cursor-pointer"
                  >
                    Apply
                  </button>
                </form>
              ) : (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>
                      Code <strong className="font-mono">{appliedCoupon}</strong> Applied
                    </span>
                  </div>
                  <button
                    onClick={handleRemoveCoupon}
                    className="text-[11px] underline text-zinc-400 hover:text-white"
                  >
                    Remove
                  </button>
                </div>
              )}
              {couponError && (
                <p className="text-[11px] text-red-400 mt-1.5 font-mono">{couponError}</p>
              )}
            </div>

            {/* Calculation Breakdown */}
            <div className="space-y-2.5 text-xs text-zinc-300 pt-2 border-t border-[#25150e]">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="font-mono text-white">₹{subtotal.toFixed(2)}</span>
              </div>

              {couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Coupon Discount</span>
                  <span className="font-mono">-₹{couponDiscount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Delivery Charges</span>
                <span className="font-mono text-white">
                  {deliveryFee === 0 ? (
                    <span className="text-emerald-400 font-bold uppercase text-[11px]">FREE</span>
                  ) : (
                    `₹${deliveryFee.toFixed(2)}`
                  )}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Taxes & Roastery Packaging ({storeSettings.taxRatePercent}%)</span>
                <span className="font-mono text-white">₹{taxes.toFixed(2)}</span>
              </div>

              {/* Final Total */}
              <div className="pt-3 border-t border-[#2b180f] flex justify-between items-baseline">
                <span className="text-sm font-serif font-bold text-white">Total Amount</span>
                <span className="text-2xl font-mono font-black text-[#fae8be]">
                  ₹{finalAmount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              <button
                onClick={onProceedToCheckout}
                className="w-full py-3.5 px-6 rounded-full bg-[#cfa851] hover:bg-[#dfb962] text-zinc-950 font-sans font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-300 shadow-xl hover:scale-[1.01] cursor-pointer"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onContinueShopping}
                className="w-full py-2.5 px-4 rounded-full bg-transparent hover:bg-white/5 border border-[#3e271c] text-zinc-300 hover:text-white font-sans text-xs transition cursor-pointer"
              >
                ← Continue Shopping
              </button>
            </div>

            {/* Trust Badges */}
            <div className="pt-4 border-t border-[#25150e] flex items-center justify-center gap-4 text-[10.5px] text-zinc-400 font-mono">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>100% Encrypted</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1.5">
                <Coffee className="w-3.5 h-3.5 text-[#cfa851]" />
                <span>Brewed to Order</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
