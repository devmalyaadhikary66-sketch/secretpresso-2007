import React from 'react';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

interface StorefrontFloatingCartBarProps {
  onOpenCartPage: () => void;
}

export const StorefrontFloatingCartBar: React.FC<StorefrontFloatingCartBarProps> = ({
  onOpenCartPage,
}) => {
  const { cart } = useStore();

  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);

  if (totalCount === 0) {
    return null;
  }

  return (
    <aside
      aria-label="Shopping Cart Bar"
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-md animate-in slide-in-from-bottom-4 duration-300 pointer-events-auto"
    >
      <div
        onClick={onOpenCartPage}
        className="group relative flex items-center justify-between gap-4 px-4 sm:px-5 py-3 rounded-full bg-[#180e09]/92 hover:bg-[#1f120c] border border-[#3e271c] hover:border-[#cfa851]/60 shadow-[0_12px_36px_rgba(0,0,0,0.65)] backdrop-blur-md text-white cursor-pointer transition-all duration-300 hover:scale-[1.01]"
      >
        {/* Glow ambient highlight */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#cfa851]/10 via-transparent to-[#cfa851]/5 pointer-events-none" />

        {/* Left: Cart Icon & Item Count */}
        <div className="flex items-center gap-3 relative z-10 min-w-0">
          <div className="w-8 h-8 rounded-full bg-[#cfa851]/15 border border-[#cfa851]/40 flex items-center justify-center text-[#cfa851] shrink-0 transition-transform group-hover:scale-105">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2.5 truncate">
            <span className="text-xs sm:text-[13px] font-medium text-zinc-100 font-sans tracking-wide">
              {totalCount} {totalCount === 1 ? 'Item' : 'Items'}
            </span>
            <span className="text-zinc-600">•</span>
            <span className="text-xs sm:text-[13px] font-bold font-mono text-[#fae8be]">
              ₹{subtotal.toFixed(0)}
            </span>
          </div>
        </div>

        {/* Right: View Cart Action */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#cfa851] text-zinc-950 font-sans text-xs font-bold uppercase tracking-wider group-hover:bg-[#dfb962] transition shadow-md shrink-0 relative z-10">
          <span>View Cart</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </aside>
  );
};
