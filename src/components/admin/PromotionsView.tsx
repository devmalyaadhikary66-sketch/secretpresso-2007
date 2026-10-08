import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Coupon } from '../../types';
import {
  Tag,
  Plus,
  Percent,
  DollarSign,
  Truck,
  Check,
  Calendar,
  Trash2,
  X,
  Power,
  Sparkles,
} from 'lucide-react';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface PromotionsViewProps {
  isCreateOpenInitially?: boolean;
}

export const PromotionsView: React.FC<PromotionsViewProps> = ({
  isCreateOpenInitially = false,
}) => {
  const { coupons, createCoupon, toggleCouponStatus, deleteCoupon } = useStore();

  const [isModalOpen, setIsModalOpen] = useState(isCreateOpenInitially);
  const [deleteTargetCoupon, setDeleteTargetCoupon] = useState<Coupon | null>(null);

  const [newCoupon, setNewCoupon] = useState<Omit<Coupon, 'id' | 'usageCount'>>({
    code: '',
    discountType: 'PERCENTAGE',
    discountValue: 15,
    minimumOrder: 499,
    maximumDiscount: 200,
    usageLimit: 500,
    perUserLimit: 2,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '2026-12-31',
    isActive: true,
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCoupon({
      ...newCoupon,
      code: newCoupon.code.trim().toUpperCase(),
      discountValue: Number(newCoupon.discountValue),
      minimumOrder: Number(newCoupon.minimumOrder),
      maximumDiscount: newCoupon.maximumDiscount ? Number(newCoupon.maximumDiscount) : undefined,
      usageLimit: Number(newCoupon.usageLimit),
      perUserLimit: Number(newCoupon.perUserLimit),
    });
    setIsModalOpen(false);
    setNewCoupon({
      code: '',
      discountType: 'PERCENTAGE',
      discountValue: 15,
      minimumOrder: 499,
      maximumDiscount: 200,
      usageLimit: 500,
      perUserLimit: 2,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '2026-12-31',
      isActive: true,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-serif text-[#fae8be]">Promotions, Coupons & Offers</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Configure discount codes, cart threshold incentives, free delivery rules, and usage caps.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-[#fae8be] via-[#cfa851] to-[#b3883b] text-zinc-950 text-xs font-bold transition shadow-lg shadow-[#cfa851]/20 hover:brightness-110"
        >
          <Plus className="w-4 h-4" />
          <span>Create Coupon Code</span>
        </button>
      </div>

      {/* Coupon Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {coupons.map((coupon) => {
          const isExpired = new Date(coupon.endDate) < new Date();
          const percentUsed = Math.min(100, Math.round((coupon.usageCount / coupon.usageLimit) * 100));

          return (
            <div
              key={coupon.id}
              className={`rounded-2xl bg-[#140c08] border transition p-5 flex flex-col justify-between shadow-xl ${
                !coupon.isActive || isExpired
                  ? 'border-zinc-800 opacity-60'
                  : 'border-[#2e1c12] hover:border-[#cfa851]/40'
              }`}
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-[#261710] border border-[#3e2619] text-[#cfa851]">
                      {coupon.discountType === 'PERCENTAGE' ? (
                        <Percent className="w-4 h-4" />
                      ) : coupon.discountType === 'FLAT' ? (
                        <DollarSign className="w-4 h-4" />
                      ) : (
                        <Truck className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-mono text-base font-extrabold tracking-wider text-[#fae8be]">
                        {coupon.code}
                      </h3>
                      <p className="text-[10px] uppercase font-mono text-zinc-400">
                        {coupon.discountType.replace('_', ' ')}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleCouponStatus(coupon.id)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold transition ${
                      coupon.isActive
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {coupon.isActive ? 'ACTIVE' : 'PAUSED'}
                  </button>
                </div>

                <div className="space-y-2 py-3 border-y border-[#261710] text-xs">
                  <div className="flex justify-between text-zinc-300">
                    <span className="text-zinc-500">Benefit:</span>
                    <span className="font-bold text-[#cfa851] font-mono">
                      {coupon.discountType === 'PERCENTAGE'
                        ? `${coupon.discountValue}% OFF (Max ₹${coupon.maximumDiscount})`
                        : coupon.discountType === 'FLAT'
                        ? `₹${coupon.discountValue} OFF Flat`
                        : 'Free Delivery'}
                    </span>
                  </div>

                  <div className="flex justify-between text-zinc-300">
                    <span className="text-zinc-500">Min Order:</span>
                    <span className="font-mono">₹{coupon.minimumOrder}</span>
                  </div>

                  <div className="flex justify-between text-zinc-300">
                    <span className="text-zinc-500">Validity:</span>
                    <span className="font-mono text-[11px] text-zinc-400">
                      {coupon.startDate} to {coupon.endDate}
                    </span>
                  </div>
                </div>

                {/* Usage meter */}
                <div className="mt-3">
                  <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
                    <span>Usage: {coupon.usageCount} / {coupon.usageLimit}</span>
                    <span className="font-mono">{percentUsed}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${percentUsed}%` }}
                      className="h-full bg-gradient-to-r from-[#a87a2a] to-[#cfa851] rounded-full"
                    ></div>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-[#261710] flex justify-end">
                <button
                  onClick={() => setDeleteTargetCoupon(coupon)}
                  className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-white/5 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Coupon Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#120b08] border border-[#382319] w-full max-w-lg rounded-2xl shadow-2xl p-6 text-zinc-100 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold font-serif text-[#fae8be]">
              Create Promotional Coupon
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Valid codes apply directly during customer cart checkout.
            </p>

            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                  Coupon Code *
                </label>
                <input
                  type="text"
                  required
                  value={newCoupon.code}
                  onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. ESPRESSO20"
                  className="w-full px-3 py-2 bg-[#180f0b] border border-[#382319] rounded-xl font-mono text-zinc-100 uppercase focus:border-[#cfa851] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                    Discount Type *
                  </label>
                  <select
                    value={newCoupon.discountType}
                    onChange={(e) => setNewCoupon({ ...newCoupon, discountType: e.target.value as Coupon['discountType'] })}
                    className="w-full px-3 py-2 bg-[#180f0b] border border-[#382319] rounded-xl text-zinc-100"
                  >
                    <option value="PERCENTAGE">Percentage Discount (%)</option>
                    <option value="FLAT">Flat Cash Discount (₹)</option>
                    <option value="FREE_DELIVERY">Free Shipping / Delivery</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                    Value (% or ₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={newCoupon.discountValue}
                    onChange={(e) => setNewCoupon({ ...newCoupon, discountValue: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#180f0b] border border-[#382319] rounded-xl font-mono text-zinc-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                    Minimum Cart Order (₹)
                  </label>
                  <input
                    type="number"
                    required
                    value={newCoupon.minimumOrder}
                    onChange={(e) => setNewCoupon({ ...newCoupon, minimumOrder: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#180f0b] border border-[#382319] rounded-xl font-mono text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                    Max Discount Cap (₹)
                  </label>
                  <input
                    type="number"
                    value={newCoupon.maximumDiscount || ''}
                    onChange={(e) => setNewCoupon({ ...newCoupon, maximumDiscount: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="Optional"
                    className="w-full px-3 py-2 bg-[#180f0b] border border-[#382319] rounded-xl font-mono text-zinc-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                    Total Redemption Limit
                  </label>
                  <input
                    type="number"
                    required
                    value={newCoupon.usageLimit}
                    onChange={(e) => setNewCoupon({ ...newCoupon, usageLimit: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#180f0b] border border-[#382319] rounded-xl font-mono text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                    Limit Per Customer
                  </label>
                  <input
                    type="number"
                    required
                    value={newCoupon.perUserLimit}
                    onChange={(e) => setNewCoupon({ ...newCoupon, perUserLimit: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#180f0b] border border-[#382319] rounded-xl font-mono text-zinc-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={newCoupon.startDate}
                    onChange={(e) => setNewCoupon({ ...newCoupon, startDate: e.target.value })}
                    className="w-full px-3 py-2 bg-[#180f0b] border border-[#382319] rounded-xl text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={newCoupon.endDate}
                    onChange={(e) => setNewCoupon({ ...newCoupon, endDate: e.target.value })}
                    className="w-full px-3 py-2 bg-[#180f0b] border border-[#382319] rounded-xl text-zinc-100"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#cfa851] text-zinc-950 hover:bg-[#dbb660]"
                >
                  Save & Activate Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Coupon Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTargetCoupon}
        title={`Delete Coupon: ${deleteTargetCoupon?.code}`}
        message="Are you sure you want to delete this promotional coupon? Any customer currently attempting to apply this will be blocked."
        confirmLabel="Yes, Delete"
        isDestructive={true}
        onConfirm={() => {
          if (deleteTargetCoupon) {
            deleteCoupon(deleteTargetCoupon.id);
            setDeleteTargetCoupon(null);
          }
        }}
        onCancel={() => setDeleteTargetCoupon(null)}
      />
    </div>
  );
};
