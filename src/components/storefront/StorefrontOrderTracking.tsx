import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { Order, OrderStatus } from '../../types';
import {
  Radio,
  Search,
  CheckCircle2,
  Clock,
  Truck,
  Phone,
  MapPin,
  CookingPot,
  Package,
  Home,
  Navigation,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';
import { OrderStatusBadge } from '../common/Badge';

interface StorefrontOrderTrackingProps {
  initialOrderId?: string;
  onBackToMenu: () => void;
}

export const StorefrontOrderTracking: React.FC<StorefrontOrderTrackingProps> = ({
  initialOrderId,
  onBackToMenu,
}) => {
  const { orders } = useStore();
  const [searchOrderNumber, setSearchOrderNumber] = useState('');

  // Default to initialOrderId or most recent order
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(() => {
    if (initialOrderId) {
      return orders.find((o) => o.id === initialOrderId || o.orderNumber === initialOrderId) || orders[0] || null;
    }
    return orders[0] || null;
  });

  useEffect(() => {
    if (initialOrderId) {
      const match = orders.find((o) => o.id === initialOrderId || o.orderNumber === initialOrderId);
      if (match) {
        setSelectedOrder(match);
      }
    }
  }, [initialOrderId, orders]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = searchOrderNumber.trim().toUpperCase();
    const found = orders.find((o) => o.orderNumber.toUpperCase() === clean || o.id === clean);
    if (found) {
      setSelectedOrder(found);
    }
  };

  // Sync selected order in case status changed live in context
  const activeOrder = selectedOrder ? orders.find((o) => o.id === selectedOrder.id) || selectedOrder : null;

  // Status step progression map matching user specifications
  const statusSteps: { key: OrderStatus; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: 'CONFIRMED', label: 'Order Confirmed', icon: CheckCircle2 },
    { key: 'PREPARING', label: 'Preparing', icon: CookingPot },
    { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', icon: Truck },
    { key: 'DELIVERED', label: 'Delivered', icon: Home },
  ];

  const getStepStatus = (stepKey: OrderStatus) => {
    if (!activeOrder) return 'upcoming';
    const hierarchy: OrderStatus[] = [
      'NEW',
      'CONFIRMED',
      'ACCEPTED',
      'PREPARING',
      'READY',
      'PACKED',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
    ];

    const currentIndex = hierarchy.indexOf(activeOrder.orderStatus);
    const stepIndex = hierarchy.indexOf(stepKey);

    if (activeOrder.orderStatus === 'CANCELLED' || activeOrder.orderStatus === 'REFUNDED') {
      return 'cancelled';
    }

    if (currentIndex >= stepIndex) return 'completed';
    if (currentIndex === stepIndex - 1) return 'current';
    return 'upcoming';
  };

  return (
    <div className="py-12 px-4 sm:px-8 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300 text-zinc-100">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToMenu}
          className="flex items-center gap-1.5 text-xs text-[#cfa851] hover:underline font-mono uppercase"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Menu</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Live Roastery Dispatch Sync</span>
        </div>
      </div>

      {/* Order Search Box */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchOrderNumber}
            onChange={(e) => setSearchOrderNumber(e.target.value)}
            placeholder="Track another order (e.g. SP-1042)..."
            className="w-full pl-9 pr-4 py-2.5 bg-[#140c08] border border-[#352116] rounded-xl font-mono text-xs text-zinc-100 placeholder-zinc-500 focus:border-[#cfa851] focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="px-5 py-2.5 rounded-xl bg-[#261710] hover:bg-[#341f15] border border-[#3e271c] text-[#fae8be] font-bold text-xs"
        >
          Lookup Order
        </button>
      </form>

      {activeOrder ? (
        <div className="space-y-6">
          {/* Main Status Hero */}
          <div className="p-6 rounded-3xl bg-[#140c08] border border-[#2e1c12] shadow-2xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#281810]">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-2xl font-black text-[#fae8be]">
                    #{activeOrder.orderNumber}
                  </span>
                  <OrderStatusBadge status={activeOrder.orderStatus} size="md" />
                </div>
                <p className="text-xs text-zinc-400 mt-1 font-mono">
                  Placed at {new Date(activeOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Est. Delivery: {activeOrder.estimatedDeliveryTime || '25 mins'}
                </p>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-xs text-zinc-400 font-mono block">Order Amount:</span>
                <span className="text-xl font-bold font-mono text-[#f5ebd9]">
                  ₹{activeOrder.finalAmount}
                </span>
              </div>
            </div>

            {/* Stepper Timeline */}
            <div className="py-8">
              <div className="grid grid-cols-4 gap-2 relative">
                {statusSteps.map((step, idx) => {
                  const state = getStepStatus(step.key);
                  const Icon = step.icon;

                  const isDone = state === 'completed';
                  const isCurrent = state === 'current';

                  return (
                    <div key={step.key} className="flex flex-col items-center text-center group">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center transition shadow-lg ${
                          isDone
                            ? 'bg-emerald-500 text-zinc-950 font-bold shadow-emerald-500/20'
                            : isCurrent
                            ? 'bg-[#cfa851] text-zinc-950 font-bold animate-pulse shadow-[#cfa851]/30'
                            : 'bg-[#1e130c] border border-[#301c12] text-zinc-600'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <span
                        className={`text-[10px] sm:text-xs font-semibold mt-2.5 font-mono ${
                          isDone || isCurrent ? 'text-zinc-100' : 'text-zinc-500'
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Map-ready Courier Live Tracking Architecture */}
            <div className="p-4 rounded-2xl bg-[#1a100a] border border-[#332015] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold font-serif text-[#fae8be]">
                  <Navigation className="w-4 h-4 text-[#cfa851]" />
                  <span>Real-Time Courier Telemetry</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20">
                  GPS Transit Active
                </span>
              </div>

              {/* Visual Map Canvas Placeholder */}
              <div className="relative h-44 rounded-xl bg-[#110905] border border-[#2a170e] overflow-hidden flex items-center justify-center p-4">
                {/* Stylized vector map grid */}
                <div className="absolute inset-0 bg-[radial-gradient(#3a2318_1px,transparent_1px)] [background-size:16px_16px] opacity-40"></div>

                <div className="relative z-10 flex flex-col items-center text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-[#cfa851]/20 border border-[#cfa851] flex items-center justify-center text-[#cfa851] animate-bounce-short">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-200">
                      {activeOrder.deliveryPartnerName
                        ? `Courier ${activeOrder.deliveryPartnerName} is en route`
                        : 'Barista team is preparing your beverage at roastery'}
                    </p>
                    <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                      Delivery to: {activeOrder.customerAddress}
                    </p>
                  </div>
                </div>
              </div>

              {/* Delivery Partner Details */}
              {activeOrder.deliveryPartnerName && (
                <div className="pt-2 flex items-center justify-between text-xs text-zinc-300">
                  <div>
                    <span className="text-zinc-500">Dedicated Partner:</span>{' '}
                    <span className="font-semibold text-zinc-100">{activeOrder.deliveryPartnerName}</span>
                  </div>
                  {activeOrder.deliveryPartnerPhone && (
                    <a
                      href={`tel:${activeOrder.deliveryPartnerPhone}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#251710] hover:bg-[#341f15] text-[#fae8be] font-mono text-xs border border-[#3e271c]"
                    >
                      <Phone className="w-3.5 h-3.5 text-[#cfa851]" />
                      <span>Call Driver</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Items in this order */}
          <div className="p-6 rounded-3xl bg-[#140c08] border border-[#2e1c12] shadow-xl space-y-3">
            <h3 className="text-sm font-bold font-serif text-[#fae8be]">
              Items in Delivery ({activeOrder.items.length})
            </h3>
            <div className="divide-y divide-[#24150e]">
              {activeOrder.items.map((it) => (
                <div key={it.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    {it.image ? (
                      <img src={it.image} alt="" className="w-10 h-10 rounded-lg object-cover" />
                    ) : null}
                    <div>
                      <p className="font-semibold text-zinc-200">
                        {it.quantity}× {it.productName}
                      </p>
                      {it.customization && (
                        <p className="text-[10px] text-[#cfa851]">
                          {[
                            it.customization.milk ? `${it.customization.milk} milk` : null,
                            it.customization.sweetness,
                            it.customization.temperature,
                          ]
                            .filter(Boolean)
                            .join(' • ')}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="font-mono font-bold text-zinc-300">₹{it.subtotal}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="py-20 text-center text-zinc-500 text-xs">
          Enter an order number to monitor status.
        </div>
      )}
    </div>
  );
};
