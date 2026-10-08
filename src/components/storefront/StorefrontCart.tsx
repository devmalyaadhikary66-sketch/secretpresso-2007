import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  ShoppingBag,
  X,
  Trash2,
  Plus,
  Minus,
  Tag,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { PaymentMethod } from '../../types';

interface StorefrontCartProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderPlaced: (orderId: string) => void;
}

export const StorefrontCart: React.FC<StorefrontCartProps> = ({
  isOpen,
  onClose,
  onOrderPlaced,
}) => {
  const {
    cart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    placeOrder,
    storeSettings,
    isStoreOpen,
    validateCoupon,
  } = useStore();

  const [step, setStep] = useState<'cart' | 'checkout'>('cart');

  // Coupon state
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponDiscount, setCouponDiscount] = useState<number>(0);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Customer Checkout Form
  const [formData, setFormData] = useState({
    name: 'Aditi Sharma',
    phone: '+91 98765 43210',
    email: 'aditi.sharma@gmail.com',
    address: 'Apt 402, Prestige Hermitage, Lavelle Road',
    pincode: '560001',
    notes: 'Please ring bell twice and include chilled tasting spoons.',
    paymentMethod: 'UPI' as PaymentMethod,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const deliveryFee = subtotal >= storeSettings.freeDeliveryThreshold ? 0 : storeSettings.defaultDeliveryFee;
  const taxableAmount = Math.max(0, subtotal - couponDiscount);
  const taxes = parseFloat(((taxableAmount * storeSettings.taxRatePercent) / 100).toFixed(2));
  const finalAmount = parseFloat((taxableAmount + deliveryFee + taxes).toFixed(2));

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

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isStoreOpen) return;
    if (cart.length === 0) return;

    setIsSubmitting(true);
    setTimeout(() => {
      const order = placeOrder({
        customerName: formData.name,
        customerPhone: formData.phone,
        customerEmail: formData.email,
        customerAddress: formData.address,
        pincode: formData.pincode,
        items: cart,
        notes: formData.notes,
        couponCode: appliedCoupon || undefined,
        paymentMethod: formData.paymentMethod,
      });

      clearCart();
      setIsSubmitting(false);
      onClose();
      onOrderPlaced(order.id);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#120b08] border-l border-[#382319] shadow-2xl flex flex-col justify-between text-zinc-100">
          {/* Header */}
          <div className="p-5 border-b border-[#281810] flex items-center justify-between bg-[#160d09]">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#cfa851]" />
              <h2 className="text-base font-bold font-serif text-[#fae8be]">
                {step === 'cart' ? 'Your Coffee Bag' : 'Checkout & Delivery'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-5 overflow-y-auto flex-1 space-y-5 text-xs">
            {/* Store Closed Warning */}
            {!isStoreOpen && (
              <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Store is Currently Closed</p>
                  <p className="text-[11px] text-red-300 mt-0.5">
                    {storeSettings.closedAnnouncementMessage}
                  </p>
                </div>
              </div>
            )}

            {cart.length === 0 ? (
              <div className="py-24 text-center text-zinc-500 space-y-3">
                <ShoppingBag className="w-12 h-12 text-zinc-700 mx-auto" />
                <p className="text-sm font-serif text-zinc-400">Your bag is currently empty.</p>
                <p className="text-[11px]">Explore our artisanal roasts and Venetian Tiramisu.</p>
              </div>
            ) : step === 'cart' ? (
              /* Step 1: Cart Items */
              <div className="space-y-4">
                <div className="divide-y divide-[#261710]">
                  {cart.map((item) => (
                    <div key={item.id} className="py-3 flex items-start gap-3">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt=""
                          className="w-14 h-14 rounded-xl object-cover border border-[#382319] shrink-0"
                        />
                      ) : null}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <h4 className="text-xs font-semibold text-zinc-100 truncate">
                            {item.productName}
                          </h4>
                          <span className="font-mono font-bold text-zinc-200 ml-2">
                            ₹{item.subtotal}
                          </span>
                        </div>

                        {item.customization && (
                          <p className="text-[10px] text-[#cfa851] mt-0.5">
                            {[
                              item.customization.milk ? `${item.customization.milk} milk` : null,
                              item.customization.sweetness,
                              item.customization.temperature,
                              item.customization.extraShots ? `+${item.customization.extraShots} shot` : null,
                            ]
                              .filter(Boolean)
                              .join(' • ')}
                          </p>
                        )}

                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2 bg-[#1c110a] rounded-lg p-0.5 border border-[#382319]">
                            <button
                              onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                              className="p-1 hover:text-[#cfa851]"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="font-mono text-xs px-1 font-bold">{item.quantity}</span>
                            <button
                              onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                              className="p-1 hover:text-[#cfa851]"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-zinc-500 hover:text-red-400 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Coupon Code Field */}
                <div className="pt-2">
                  {appliedCoupon ? (
                    <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-emerald-400" />
                        <div>
                          <span className="font-mono font-bold text-emerald-300">{appliedCoupon}</span>
                          <p className="text-[10px] text-emerald-400">Discount of ₹{couponDiscount} applied</p>
                        </div>
                      </div>
                      <button
                        onClick={handleRemoveCoupon}
                        className="text-[10px] text-zinc-400 hover:text-red-400 underline"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleApplyCoupon} className="flex gap-2">
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        placeholder="Coupon Code (e.g. SECRETVIP)"
                        className="flex-1 px-3 py-2 bg-[#180f0b] border border-[#352116] rounded-xl font-mono text-zinc-100 placeholder-zinc-500 focus:border-[#cfa851] focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-[#261710] hover:bg-[#341f15] border border-[#3e271c] text-[#fae8be] font-bold text-xs"
                      >
                        Apply
                      </button>
                    </form>
                  )}
                  {couponError && (
                    <p className="text-[11px] text-red-400 mt-1">{couponError}</p>
                  )}
                </div>
              </div>
            ) : (
              /* Step 2: Customer Address & Details Form */
              <form id="checkout-form" onSubmit={handleCheckoutSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-[#180f0b] border border-[#352116] rounded-xl text-zinc-100 focus:border-[#cfa851] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                      Phone *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 bg-[#180f0b] border border-[#352116] rounded-xl text-zinc-100 focus:border-[#cfa851] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                      Pincode *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.pincode}
                      onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                      className="w-full px-3 py-2 bg-[#180f0b] border border-[#352116] rounded-xl font-mono text-zinc-100 focus:border-[#cfa851] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-[#180f0b] border border-[#352116] rounded-xl text-zinc-100 focus:border-[#cfa851] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                    Delivery Address *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 bg-[#180f0b] border border-[#352116] rounded-xl text-zinc-100 focus:border-[#cfa851] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                    Special Concierge Notes
                  </label>
                  <input
                    type="text"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 bg-[#180f0b] border border-[#352116] rounded-xl text-zinc-100 focus:border-[#cfa851] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {['UPI', 'CARD', 'CASH_ON_DELIVERY'].map((pm) => (
                      <button
                        key={pm}
                        type="button"
                        onClick={() => setFormData({ ...formData, paymentMethod: pm as PaymentMethod })}
                        className={`p-2 rounded-xl border text-center font-mono text-[10px] transition ${
                          formData.paymentMethod === pm
                            ? 'bg-[#2a1a12] border-[#cfa851] text-[#fae8be] font-bold'
                            : 'bg-[#180f0b] border-[#2c1b12] text-zinc-400'
                        }`}
                      >
                        {pm.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              </form>
            )}
          </div>

          {/* Footer & Totals */}
          {cart.length > 0 && (
            <div className="p-5 border-t border-[#281810] bg-[#160d09] space-y-3 text-xs">
              <div className="space-y-1.5 text-zinc-400">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-mono text-zinc-200">₹{subtotal.toFixed(2)}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Discount:</span>
                    <span className="font-mono">-₹{couponDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Delivery Fee:</span>
                  <span className="font-mono text-zinc-200">
                    {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Taxes (5% GST):</span>
                  <span className="font-mono text-zinc-200">₹{taxes.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-[#332016] text-sm font-bold text-[#fae8be]">
                  <span>Total Due:</span>
                  <span className="font-mono text-base">₹{finalAmount.toFixed(2)}</span>
                </div>
              </div>

              {step === 'cart' ? (
                <button
                  onClick={() => setStep('checkout')}
                  disabled={!isStoreOpen}
                  className={`w-full py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-widest transition flex items-center justify-center gap-2 shadow-lg ${
                    !isStoreOpen
                      ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-[#fae8be] via-[#cfa851] to-[#b3883b] text-zinc-950 hover:brightness-110 shadow-[#cfa851]/20'
                  }`}
                >
                  <span>{isStoreOpen ? 'Proceed to Delivery Address' : 'Store Currently Closed'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStep('cart')}
                    className="px-4 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs"
                  >
                    Back
                  </button>
                  <button
                    form="checkout-form"
                    type="submit"
                    disabled={isSubmitting || !isStoreOpen}
                    className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#fae8be] via-[#cfa851] to-[#b3883b] text-zinc-950 font-bold text-xs uppercase tracking-widest shadow-lg shadow-[#cfa851]/20 hover:brightness-110 transition flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Place Order (₹{finalAmount})</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
