import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { PaymentMethod, Order } from '../../types';
import {
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Lock,
  CreditCard,
  QrCode,
  Banknote,
  Building,
  AlertCircle,
  Truck,
  Coffee,
  Sparkles,
} from 'lucide-react';

interface StorefrontCheckoutPageProps {
  onBackToCart: () => void;
  onOrderSuccess: (orderId: string) => void;
  onContinueShopping: () => void;
}

export const StorefrontCheckoutPage: React.FC<StorefrontCheckoutPageProps> = ({
  onBackToCart,
  onOrderSuccess,
  onContinueShopping,
}) => {
  const {
    cart,
    clearCart,
    placeOrder,
    storeSettings,
    isStoreOpen,
    showToast,
  } = useStore();

  // Form Fields
  const [formData, setFormData] = useState({
    name: 'Aditi Sharma',
    phone: '+91 98765 43210',
    email: 'aditi.sharma@gmail.com',
    address: 'Apt 402, Prestige Hermitage, Lavelle Road',
    pincode: '560001',
    notes: 'Please ring bell twice and include chilled tasting spoons.',
    paymentMethod: 'UPI' as PaymentMethod,
  });

  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);

  // Financial Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const deliveryFee =
    subtotal >= storeSettings.freeDeliveryThreshold ? 0 : storeSettings.defaultDeliveryFee;
  const taxableAmount = subtotal;
  const taxes = parseFloat(((taxableAmount * storeSettings.taxRatePercent) / 100).toFixed(2));
  const finalAmount = parseFloat((taxableAmount + deliveryFee + taxes).toFixed(2));

  // If cart is empty and no order has been placed, redirect back
  if (cart.length === 0 && !placedOrder) {
    return (
      <div className="pt-24 pb-16 px-4 max-w-lg mx-auto text-center text-zinc-100">
        <h2 className="text-xl font-serif font-bold mb-4">Your bag is empty</h2>
        <p className="text-xs text-zinc-400 mb-6">
          Add some delicious coffee or tiramisu before proceeding to checkout.
        </p>
        <button
          onClick={onContinueShopping}
          className="px-6 py-2.5 rounded-full bg-[#cfa851] text-zinc-950 font-bold text-xs uppercase"
        >
          Explore Menu
        </button>
      </div>
    );
  }

  // Handle Form Validation
  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    if (!formData.name.trim()) errors.name = 'Full name is required';
    if (!formData.phone.trim()) errors.phone = 'Phone number is required';
    if (!formData.email.trim() || !formData.email.includes('@')) {
      errors.email = 'A valid email address is required';
    }
    if (!formData.address.trim()) errors.address = 'Delivery address is required';
    if (!formData.pincode.trim()) errors.pincode = 'PIN Code is required';
    return errors;
  };

  // Place Order submission handler
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent submission if already submitting
    if (isSubmitting) return;

    if (!isStoreOpen) {
      showToast({
        type: 'warning',
        title: 'Store Currently Closed',
        message: storeSettings.closedAnnouncementMessage || 'We are currently not accepting new orders.',
      });
      return;
    }

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      showToast({
        type: 'error',
        title: 'Incomplete Details',
        message: 'Please fill in all required delivery and contact fields.',
      });
      return;
    }

    setFormErrors({});
    setIsSubmitting(true);

    try {
      // 1. Create order synchronously in StoreContext (deducts stock, updates CRM, adds to orders)
      const order = placeOrder({
        customerName: formData.name.trim(),
        customerPhone: formData.phone.trim(),
        customerEmail: formData.email.trim(),
        customerAddress: formData.address.trim(),
        pincode: formData.pincode.trim(),
        items: [...cart],
        notes: formData.notes.trim() || undefined,
        paymentMethod: formData.paymentMethod,
      });

      // 2. Persist order to server backend API
      try {
        await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(order),
        }).catch((err) => {
          console.warn('Backend sync warning (order already saved in context):', err);
        });
      } catch (apiErr) {
        console.warn('Backend order call finished with client fallback:', apiErr);
      }

      // 3. Clear the purchased items from cart
      clearCart();

      // 4. Show success state
      setPlacedOrder(order);
      setIsSubmitting(false);

      showToast({
        type: 'success',
        title: 'Order Confirmed!',
        message: `Order #${order.orderNumber} placed successfully.`,
      });
    } catch (error) {
      console.error('Failed to submit order:', error);
      setIsSubmitting(false);
      showToast({
        type: 'error',
        title: 'Order Submission Failed',
        message: 'Could not complete order. Please check your connection and try again.',
      });
    }
  };

  // SUCCESS CONFIRMATION MODAL / SCREEN
  if (placedOrder) {
    return (
      <div className="pt-24 pb-20 px-4 max-w-2xl mx-auto text-zinc-100 animate-in zoom-in-95 duration-300">
        <div className="p-8 sm:p-10 rounded-3xl bg-[#140c08] border border-[#3e271c] shadow-[0_20px_60px_rgba(0,0,0,0.85)] text-center relative overflow-hidden">
          {/* Subtle Golden Glow Accent */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full bg-[#cfa851]/15 blur-3xl pointer-events-none" />

          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto mb-6 shadow-xl animate-bounce-short">
            <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>

          <span className="text-[11px] font-mono tracking-[0.25em] uppercase text-[#cfa851] font-bold block mb-1">
            ORDER CONFIRMED
          </span>

          <h2 className="text-2xl sm:text-4xl font-serif font-black text-white mb-2">
            Order #{placedOrder.orderNumber}
          </h2>

          <p className="text-xs sm:text-sm text-zinc-300 max-w-md mx-auto mb-6 leading-relaxed">
            Your Secretpresso order has been placed successfully. Our baristas are freshly preparing your handcrafted brews and surprise toy.
          </p>

          <div className="p-4 rounded-2xl bg-[#1c110b] border border-[#321e14] max-w-md mx-auto mb-8 text-left space-y-2 text-xs">
            <div className="flex justify-between text-zinc-400">
              <span>Delivery To:</span>
              <span className="text-white font-medium truncate max-w-[200px]">
                {placedOrder.customerName}
              </span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Address:</span>
              <span className="text-white font-medium truncate max-w-[200px]">
                {placedOrder.customerAddress}
              </span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Estimated Delivery:</span>
              <span className="text-emerald-400 font-mono font-bold">
                {placedOrder.estimatedDeliveryTime || '25 mins'}
              </span>
            </div>
            <div className="flex justify-between text-zinc-400 pt-2 border-t border-[#291810]">
              <span>Total Paid:</span>
              <span className="text-[#fae8be] font-mono font-bold">
                ₹{placedOrder.finalAmount.toFixed(2)} ({placedOrder.paymentMethod})
              </span>
            </div>
          </div>

          {/* Action to Return to Normal Website & View Active Order Floating Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => onOrderSuccess(placedOrder.id)}
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#cfa851] hover:bg-[#dfb962] text-zinc-950 font-sans font-bold text-xs uppercase tracking-wider transition-all duration-300 shadow-xl hover:scale-[1.02] cursor-pointer"
            >
              Continue Browsing Store
            </button>

            <button
              onClick={() => onOrderSuccess(placedOrder.id)}
              className="w-full sm:w-auto px-6 py-3 rounded-full bg-transparent hover:bg-white/5 border border-[#442a1d] text-zinc-300 hover:text-white font-sans text-xs transition cursor-pointer"
            >
              Track Order Live →
            </button>
          </div>

          <p className="text-[11px] font-mono text-zinc-500 mt-6">
            A real-time Active Order floating bar is now live at the bottom of your screen.
          </p>
        </div>
      </div>
    );
  }

  // DEDICATED CHECKOUT VIEW
  return (
    <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto animate-in fade-in duration-300 text-zinc-100">
      {/* Header & Back Link */}
      <div className="mb-8 pb-4 border-b border-[#281810]">
        <button
          onClick={onBackToCart}
          className="inline-flex items-center gap-1.5 text-xs text-[#cfa851] hover:text-[#fae8be] font-mono uppercase tracking-wider mb-2 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Cart</span>
        </button>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white flex items-center gap-3">
          <span>Checkout & Secure Dispatch</span>
          <span className="text-xs font-mono px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-400">
            Encrypted Order
          </span>
        </h1>
      </div>

      <form onSubmit={handlePlaceOrder}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Customer & Delivery Details */}
          <div className="lg:col-span-7 space-y-6">
            {/* Customer Details Section */}
            <div className="p-6 rounded-3xl bg-[#140c08] border border-[#2e1b11] shadow-xl space-y-4">
              <h2 className="text-base font-serif font-bold text-[#fae8be] flex items-center gap-2">
                <span>1. Customer Information</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1.5">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#1c110b] border border-[#3b2318] text-xs text-white focus:border-[#cfa851] focus:outline-none"
                  />
                  {formErrors.name && (
                    <p className="text-[11px] text-red-400 mt-1">{formErrors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1.5">
                    Phone Number (for Courier SMS/Call) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#1c110b] border border-[#3b2318] text-xs text-white focus:border-[#cfa851] focus:outline-none font-mono"
                  />
                  {formErrors.phone && (
                    <p className="text-[11px] text-red-400 mt-1">{formErrors.phone}</p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1.5">
                    Email Address (for Receipt & Order Updates) *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#1c110b] border border-[#3b2318] text-xs text-white focus:border-[#cfa851] focus:outline-none"
                  />
                  {formErrors.email && (
                    <p className="text-[11px] text-red-400 mt-1">{formErrors.email}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Delivery Address Section */}
            <div className="p-6 rounded-3xl bg-[#140c08] border border-[#2e1b11] shadow-xl space-y-4">
              <h2 className="text-base font-serif font-bold text-[#fae8be] flex items-center gap-2">
                <span>2. Delivery Address</span>
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1.5">
                    Street Address, Flat / House No., Landmark *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#1c110b] border border-[#3b2318] text-xs text-white focus:border-[#cfa851] focus:outline-none resize-none"
                  />
                  {formErrors.address && (
                    <p className="text-[11px] text-red-400 mt-1">{formErrors.address}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1.5">
                      PIN Code *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.pincode}
                      onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#1c110b] border border-[#3b2318] text-xs text-white focus:border-[#cfa851] focus:outline-none font-mono"
                    />
                    {formErrors.pincode && (
                      <p className="text-[11px] text-red-400 mt-1">{formErrors.pincode}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase text-zinc-400 mb-1.5">
                      Delivery Notes / Instructions
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Leave with security, ring bell"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#1c110b] border border-[#3b2318] text-xs text-white focus:border-[#cfa851] focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method Section */}
            <div className="p-6 rounded-3xl bg-[#140c08] border border-[#2e1b11] shadow-xl space-y-4">
              <h2 className="text-base font-serif font-bold text-[#fae8be] flex items-center gap-2">
                <span>3. Payment Method</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    id: 'UPI' as PaymentMethod,
                    label: 'UPI (GPay / PhonePe / Paytm)',
                    desc: 'Instant QR & Direct UPI App',
                    icon: QrCode,
                  },
                  {
                    id: 'CARD' as PaymentMethod,
                    label: 'Credit / Debit Card',
                    desc: 'Visa, Mastercard, RuPay',
                    icon: CreditCard,
                  },
                  {
                    id: 'NET_BANKING' as PaymentMethod,
                    label: 'Net Banking',
                    desc: 'All major Indian banks',
                    icon: Building,
                  },
                  {
                    id: 'CASH' as PaymentMethod,
                    label: 'Cash on Delivery',
                    desc: 'Pay at your doorstep',
                    icon: Banknote,
                  },
                ].map((m) => {
                  const Icon = m.icon;
                  const isSelected = formData.paymentMethod === m.id;
                  return (
                    <div
                      key={m.id}
                      onClick={() => setFormData({ ...formData, paymentMethod: m.id })}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                        isSelected
                          ? 'bg-[#25150d] border-[#cfa851] shadow-md shadow-[#cfa851]/10'
                          : 'bg-[#180e08] border-[#341f14] hover:border-[#4c2d1d]'
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                          isSelected
                            ? 'bg-[#cfa851] text-zinc-950 font-bold'
                            : 'bg-[#22130b] text-zinc-400'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-xs font-semibold ${
                            isSelected ? 'text-white' : 'text-zinc-200'
                          }`}
                        >
                          {m.label}
                        </p>
                        <p className="text-[10px] text-zinc-400">{m.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Final Order Summary & Place Order Button */}
          <div className="lg:col-span-5 space-y-5">
            <div className="p-6 rounded-3xl bg-[#140c08] border border-[#2e1b11] shadow-2xl space-y-5">
              <h2 className="text-lg font-serif font-bold text-white pb-3 border-b border-[#25150e]">
                Final Order Summary
              </h2>

              {/* Items List Preview */}
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-xs gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt=""
                          className="w-10 h-10 rounded-lg object-cover bg-zinc-900 border border-[#2d1a0f] shrink-0"
                        />
                      ) : null}
                      <div className="min-w-0">
                        <p className="font-semibold text-white truncate">
                          {item.quantity}× {item.productName}
                        </p>
                        {item.customization && (
                          <p className="text-[10px] text-zinc-400">
                            {[item.customization.size, item.customization.milk]
                              .filter(Boolean)
                              .join(' • ')}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="font-mono text-zinc-200 shrink-0">
                      ₹{item.subtotal.toFixed(0)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Price Calculation */}
              <div className="space-y-2 text-xs text-zinc-300 pt-3 border-t border-[#25150e]">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-mono text-white">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Charges</span>
                  <span className="font-mono text-white">
                    {deliveryFee === 0 ? (
                      <span className="text-emerald-400 font-bold uppercase text-[10px]">
                        FREE
                      </span>
                    ) : (
                      `₹${deliveryFee.toFixed(2)}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Taxes ({storeSettings.taxRatePercent}%)</span>
                  <span className="font-mono text-white">₹{taxes.toFixed(2)}</span>
                </div>
                <div className="pt-3 border-t border-[#2b180f] flex justify-between items-baseline">
                  <span className="text-sm font-serif font-bold text-white">Total Amount</span>
                  <span className="text-2xl font-mono font-black text-[#fae8be]">
                    ₹{finalAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Place Order CTA Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-4 px-6 rounded-full font-sans font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-300 shadow-xl ${
                    isSubmitting
                      ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
                      : 'bg-[#cfa851] hover:bg-[#dfb962] text-zinc-950 hover:scale-[1.01] cursor-pointer'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                      <span>Securing Your Order...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Place Order • ₹{finalAmount.toFixed(0)}</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-center gap-2 text-[10.5px] font-mono text-zinc-400 pt-2">
                <Truck className="w-3.5 h-3.5 text-[#cfa851]" />
                <span>Estimated Delivery: {storeSettings.estimatedDeliveryTimeMinutes} mins</span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
