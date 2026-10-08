import React from 'react';
import { useStore } from '../../context/StoreContext';
import {
  X,
  PlusCircle,
  Box,
  Tag,
  Store,
  Radio,
  FileText,
  CookingPot,
  Sparkles,
} from 'lucide-react';

interface QuickActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (module: string) => void;
  onOpenAddProduct: () => void;
  onOpenAdjustStock: () => void;
  onOpenCreateCoupon: () => void;
}

export const QuickActionsModal: React.FC<QuickActionsModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onOpenAddProduct,
  onOpenAdjustStock,
  onOpenCreateCoupon,
}) => {
  const { isStoreOpen, setStoreOpenManualOverride } = useStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#120b08] border border-[#382319] w-full max-w-xl rounded-2xl shadow-2xl p-6 text-zinc-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200 p-1 rounded-lg hover:bg-white/5"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-[#cfa851]" />
          <h3 className="text-lg font-bold font-serif text-[#fae8be]">Operational Quick Actions</h3>
        </div>
        <p className="text-xs text-zinc-400 mb-6">
          Execute high-frequency store commands without leaving your current workspace.
        </p>

        <div className="grid grid-cols-2 gap-3">
          {/* Add Product */}
          <button
            onClick={() => {
              onClose();
              onOpenAddProduct();
            }}
            className="flex items-start gap-3 p-3.5 rounded-xl bg-[#180f0b] hover:bg-[#251610] border border-[#2e1c13] hover:border-[#cfa851]/40 text-left transition group"
          >
            <div className="p-2 rounded-lg bg-[#cfa851]/10 text-[#cfa851] group-hover:bg-[#cfa851]/20">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-100">+ Add Product</p>
              <p className="text-[11px] text-zinc-400 mt-0.5">New roast, coffee, or merchandise</p>
            </div>
          </button>

          {/* Restock Inventory */}
          <button
            onClick={() => {
              onClose();
              onOpenAdjustStock();
            }}
            className="flex items-start gap-3 p-3.5 rounded-xl bg-[#180f0b] hover:bg-[#251610] border border-[#2e1c13] hover:border-[#cfa851]/40 text-left transition group"
          >
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-100">+ Restock / Adjust</p>
              <p className="text-[11px] text-zinc-400 mt-0.5">Beans, dairy, syrups, packaging</p>
            </div>
          </button>

          {/* Create Coupon */}
          <button
            onClick={() => {
              onClose();
              onOpenCreateCoupon();
            }}
            className="flex items-start gap-3 p-3.5 rounded-xl bg-[#180f0b] hover:bg-[#251610] border border-[#2e1c13] hover:border-[#cfa851]/40 text-left transition group"
          >
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-100">+ Create Coupon</p>
              <p className="text-[11px] text-zinc-400 mt-0.5">Discount code or free delivery</p>
            </div>
          </button>

          {/* Store Toggle */}
          <button
            onClick={() => {
              setStoreOpenManualOverride(!isStoreOpen);
              onClose();
            }}
            className="flex items-start gap-3 p-3.5 rounded-xl bg-[#180f0b] hover:bg-[#251610] border border-[#2e1c13] hover:border-[#cfa851]/40 text-left transition group"
          >
            <div className={`p-2 rounded-lg ${isStoreOpen ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
              <Store className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-100">
                {isStoreOpen ? 'Close Store Now' : 'Open Store Now'}
              </p>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Current status: {isStoreOpen ? 'Online Orders Active' : 'Orders Halted'}
              </p>
            </div>
          </button>

          {/* Live Orders View */}
          <button
            onClick={() => {
              onClose();
              onNavigate('live_orders');
            }}
            className="flex items-start gap-3 p-3.5 rounded-xl bg-[#180f0b] hover:bg-[#251610] border border-[#2e1c13] hover:border-[#cfa851]/40 text-left transition group"
          >
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 group-hover:bg-sky-500/20">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-100">Live Orders Board</p>
              <p className="text-[11px] text-zinc-400 mt-0.5">Real-time order pipeline</p>
            </div>
          </button>

          {/* Kitchen Display */}
          <button
            onClick={() => {
              onClose();
              onNavigate('kitchen');
            }}
            className="flex items-start gap-3 p-3.5 rounded-xl bg-[#180f0b] hover:bg-[#251610] border border-[#2e1c13] hover:border-[#cfa851]/40 text-left transition group"
          >
            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400 group-hover:bg-orange-500/20">
              <CookingPot className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-100">Kitchen Display (KDS)</p>
              <p className="text-[11px] text-zinc-400 mt-0.5">Barista queue & prep notes</p>
            </div>
          </button>
        </div>

        <div className="mt-5 pt-4 border-t border-[#261710] flex items-center justify-between">
          <button
            onClick={() => {
              onClose();
              onNavigate('website');
            }}
            className="text-xs text-[#cfa851] hover:underline flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Edit Website Hero & Sections</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
