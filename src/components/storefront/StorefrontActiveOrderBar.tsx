import React from 'react';
import { Coffee, ArrowRight, X, Clock, CheckCircle2, Truck, CookingPot, Package } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { OrderStatus } from '../../types';

interface StorefrontActiveOrderBarProps {
  activeOrderId: string | null;
  onOpenTracking: (orderId: string) => void;
  onDismiss?: () => void;
  hasCartItems?: boolean;
}

export const StorefrontActiveOrderBar: React.FC<StorefrontActiveOrderBarProps> = ({
  activeOrderId,
  onOpenTracking,
  onDismiss,
  hasCartItems = false,
}) => {
  const { orders } = useStore();

  if (!activeOrderId) return null;

  // Find order in live StoreContext orders list (automatically reflects updates by admin)
  const currentOrder = orders.find(
    (o) => o.id === activeOrderId || o.orderNumber === activeOrderId
  );

  if (!currentOrder) return null;

  // Map status to user-friendly label and icon
  const getStatusDisplay = (status: OrderStatus) => {
    switch (status) {
      case 'NEW':
      case 'CONFIRMED':
      case 'ACCEPTED':
        return {
          label: 'Order Confirmed',
          desc: 'Roastery confirmed your order',
          icon: CheckCircle2,
          color: 'text-emerald-400',
          badgeBg: 'bg-emerald-500/15 border-emerald-500/30',
        };
      case 'PREPARING':
        return {
          label: 'Preparing your order',
          desc: 'Freshly pulling espresso & craft',
          icon: CookingPot,
          color: 'text-[#cfa851]',
          badgeBg: 'bg-[#cfa851]/15 border-[#cfa851]/30',
        };
      case 'READY':
      case 'PACKED':
        return {
          label: 'Ready for Dispatch',
          desc: 'Sealed with secret toy & ready',
          icon: Package,
          color: 'text-amber-400',
          badgeBg: 'bg-amber-500/15 border-amber-500/30',
        };
      case 'OUT_FOR_DELIVERY':
        return {
          label: 'Out for Delivery',
          desc: 'Driver heading to your location',
          icon: Truck,
          color: 'text-sky-400',
          badgeBg: 'bg-sky-500/15 border-sky-500/30',
        };
      case 'DELIVERED':
        return {
          label: 'Delivered',
          desc: 'Enjoy your Secretpresso!',
          icon: CheckCircle2,
          color: 'text-emerald-400',
          badgeBg: 'bg-emerald-500/15 border-emerald-500/30',
        };
      case 'CANCELLED':
      case 'REFUNDED':
        return {
          label: 'Order Cancelled',
          desc: 'Payment processed for refund',
          icon: Clock,
          color: 'text-red-400',
          badgeBg: 'bg-red-500/15 border-red-500/30',
        };
      default:
        return {
          label: 'Order in Progress',
          desc: 'Updating status...',
          icon: Coffee,
          color: 'text-[#cfa851]',
          badgeBg: 'bg-[#cfa851]/15 border-[#cfa851]/30',
        };
    }
  };

  const statusInfo = getStatusDisplay(currentOrder.orderStatus);
  const StatusIcon = statusInfo.icon;

  return (
    <aside
      aria-label="Active Order Status Bar"
      className={`fixed ${
        hasCartItems ? 'bottom-20 sm:bottom-22' : 'bottom-5 sm:bottom-6'
      } left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-lg animate-in slide-in-from-bottom-4 duration-300 pointer-events-auto transition-all`}
    >
      <div
        onClick={() => onOpenTracking(currentOrder.id)}
        className="group relative flex items-center justify-between gap-3 sm:gap-4 px-4 sm:px-5 py-3 rounded-full bg-[#160d08]/95 hover:bg-[#1c110b] border border-[#442b1f] hover:border-[#cfa851]/70 shadow-[0_12px_40px_rgba(0,0,0,0.75)] backdrop-blur-md text-white cursor-pointer transition-all duration-300 hover:scale-[1.01]"
      >
        {/* Subtle pulsing background glow */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#cfa851]/10 via-transparent to-amber-500/10 pointer-events-none" />

        {/* Left: Icon & Status Text */}
        <div className="flex items-center gap-3 min-w-0 relative z-10">
          <div
            className={`w-9 h-9 rounded-full ${statusInfo.badgeBg} border flex items-center justify-center ${statusInfo.color} shrink-0 transition-transform group-hover:scale-105`}
          >
            <StatusIcon className="w-4 h-4 animate-pulse" />
          </div>

          <div className="truncate">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs sm:text-sm font-black text-[#fae8be]">
                Order #{currentOrder.orderNumber}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#2a1a12] border border-[#442b1f] text-zinc-300">
                {statusInfo.label}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-sans truncate mt-0.5">
              {statusInfo.desc}
            </p>
          </div>
        </div>

        {/* Right: Track Order Button + Dismiss (if completed) */}
        <div className="flex items-center gap-2 shrink-0 relative z-10">
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white hover:bg-zinc-100 text-zinc-950 font-sans text-xs font-bold uppercase tracking-wider transition shadow">
            <span>Track Order</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </div>

          {onDismiss && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDismiss();
              }}
              title="Dismiss active order bar"
              className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
