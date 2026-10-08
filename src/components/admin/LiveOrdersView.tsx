import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { Order, OrderStatus } from '../../types';
import {
  Radio,
  Volume2,
  VolumeX,
  Clock,
  ArrowRight,
  CheckCircle2,
  CookingPot,
  Truck,
  PackageCheck,
  AlertTriangle,
  Flame,
} from 'lucide-react';
import { OrderStatusBadge } from '../common/Badge';

export const LiveOrdersView: React.FC = () => {
  const { orders, updateOrderStatus, soundEnabled, setSoundEnabled } = useStore();
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Keep live elapsed time ticking every 15 seconds
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 15000);
    return () => clearInterval(timer);
  }, []);

  const getElapsedMinutes = (dateStr: string) => {
    const orderTime = new Date(dateStr).getTime();
    return Math.max(0, Math.floor((currentTime - orderTime) / 60000));
  };

  // Group active orders into Kanban columns
  const activeOrders = orders.filter((o) => o.orderStatus !== 'DELIVERED' && o.orderStatus !== 'CANCELLED' && o.orderStatus !== 'REFUNDED');

  const newOrders = activeOrders.filter((o) => o.orderStatus === 'NEW' || o.orderStatus === 'CONFIRMED');
  const kitchenOrders = activeOrders.filter((o) => o.orderStatus === 'ACCEPTED' || o.orderStatus === 'PREPARING');
  const readyOrders = activeOrders.filter((o) => o.orderStatus === 'READY' || o.orderStatus === 'PACKED');
  const deliveryOrders = activeOrders.filter((o) => o.orderStatus === 'OUT_FOR_DELIVERY');

  const renderOrderCard = (order: Order, nextStatus?: OrderStatus, nextLabel?: string) => {
    const elapsed = getElapsedMinutes(order.createdAt);
    const isCritical = elapsed > 25;
    const isDelayed = elapsed > 15 && !isCritical;

    return (
      <div
        key={order.id}
        className={`p-4 rounded-2xl bg-[#160d09] border transition shadow-lg ${
          isCritical
            ? 'border-red-500/50 shadow-red-950/20'
            : isDelayed
            ? 'border-amber-500/40 shadow-amber-950/15'
            : 'border-[#301f16] hover:border-[#cfa851]/40'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-[#fae8be]">
              #{order.orderNumber}
            </span>
            <OrderStatusBadge status={order.orderStatus} size="sm" />
          </div>

          <div className={`flex items-center gap-1 font-mono text-[11px] px-2 py-0.5 rounded-full ${
            isCritical
              ? 'bg-red-500/20 text-red-300 font-bold animate-pulse'
              : isDelayed
              ? 'bg-amber-500/20 text-amber-300 font-bold'
              : 'bg-zinc-800 text-zinc-400'
          }`}>
            <Clock className="w-3 h-3" />
            <span>{elapsed}m ago</span>
          </div>
        </div>

        {/* Customer & address */}
        <div className="mb-3">
          <p className="text-xs font-semibold text-zinc-100">{order.customerName}</p>
          <p className="text-[11px] text-zinc-400 truncate">{order.customerAddress}</p>
        </div>

        {/* Items List */}
        <div className="space-y-1.5 py-2 border-y border-[#261710] mb-3">
          {order.items.map((it) => (
            <div key={it.id} className="text-xs flex items-start justify-between">
              <span className="text-zinc-200">
                <span className="font-bold text-[#cfa851] mr-1.5">{it.quantity}×</span>
                {it.productName}
              </span>
              {it.customization && (
                <span className="text-[10px] text-zinc-400 font-mono">
                  {it.customization.milk ? `${it.customization.milk} milk` : ''}
                </span>
              )}
            </div>
          ))}
        </div>

        {order.notes && (
          <div className="mb-3 p-2 rounded-lg bg-[#22150e] border border-[#3b2317] text-[10px] text-amber-200">
            <span className="font-semibold">Note:</span> {order.notes}
          </div>
        )}

        {/* Action Button to advance status */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs font-mono font-bold text-zinc-300">
            ₹{order.finalAmount}
          </span>

          {nextStatus && (
            <button
              onClick={() => updateOrderStatus(order.id, nextStatus)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#fae8be] to-[#cfa851] hover:brightness-110 text-zinc-950 text-xs font-semibold transition shadow-md shadow-[#cfa851]/10"
            >
              <span>{nextLabel}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Controller */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#140c08] border border-[#2e1c12]">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-bold font-serif text-[#fae8be]">
              Live Real-Time Order Stream
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Instant multi-lane dispatch with live elapsed time tracking and audio alerts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
              soundEnabled
                ? 'bg-[#2a1a12] text-[#cfa851] border-[#cfa851]/30'
                : 'bg-zinc-800 text-zinc-400 border-zinc-700'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span>Audio Chime: {soundEnabled ? 'ON' : 'MUTED'}</span>
          </button>
          <span className="text-xs font-mono text-zinc-400 bg-[#1e130c] px-3 py-1.5 rounded-xl border border-[#301c13]">
            Active Pipeline: {activeOrders.length} Orders
          </span>
        </div>
      </div>

      {/* 4-Lane Real-time Kanban */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 items-start">
        {/* Lane 1: Incoming & New */}
        <div className="rounded-2xl bg-[#120b07] border border-[#2a1a11] p-4 flex flex-col min-h-[500px]">
          <div className="flex items-center justify-between pb-3 border-b border-[#261710] mb-4">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse"></div>
              <h3 className="text-xs font-bold font-serif uppercase tracking-wider text-zinc-200">
                New Incoming
              </h3>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 font-bold">
              {newOrders.length}
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto">
            {newOrders.length === 0 ? (
              <div className="py-12 text-center text-zinc-500 text-xs">
                No pending incoming orders
              </div>
            ) : (
              newOrders.map((ord) => renderOrderCard(ord, 'ACCEPTED', 'Accept to Kitchen'))
            )}
          </div>
        </div>

        {/* Lane 2: In Kitchen & Brewing */}
        <div className="rounded-2xl bg-[#120b07] border border-[#2a1a11] p-4 flex flex-col min-h-[500px]">
          <div className="flex items-center justify-between pb-3 border-b border-[#261710] mb-4">
            <div className="flex items-center gap-2">
              <CookingPot className="w-3.5 h-3.5 text-[#cfa851]" />
              <h3 className="text-xs font-bold font-serif uppercase tracking-wider text-[#fae8be]">
                Brewing / Kitchen
              </h3>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#cfa851]/15 text-[#e6ca85] font-bold">
              {kitchenOrders.length}
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto">
            {kitchenOrders.length === 0 ? (
              <div className="py-12 text-center text-zinc-500 text-xs">
                Barista station clear
              </div>
            ) : (
              kitchenOrders.map((ord) => renderOrderCard(ord, 'READY', 'Mark Ready'))
            )}
          </div>
        </div>

        {/* Lane 3: Ready & Packaged */}
        <div className="rounded-2xl bg-[#120b07] border border-[#2a1a11] p-4 flex flex-col min-h-[500px]">
          <div className="flex items-center justify-between pb-3 border-b border-[#261710] mb-4">
            <div className="flex items-center gap-2">
              <PackageCheck className="w-3.5 h-3.5 text-emerald-400" />
              <h3 className="text-xs font-bold font-serif uppercase tracking-wider text-emerald-300">
                Ready / Packaged
              </h3>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 font-bold">
              {readyOrders.length}
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto">
            {readyOrders.length === 0 ? (
              <div className="py-12 text-center text-zinc-500 text-xs">
                No orders waiting on pickup
              </div>
            ) : (
              readyOrders.map((ord) => renderOrderCard(ord, 'OUT_FOR_DELIVERY', 'Hand to Courier'))
            )}
          </div>
        </div>

        {/* Lane 4: Out for Delivery */}
        <div className="rounded-2xl bg-[#120b07] border border-[#2a1a11] p-4 flex flex-col min-h-[500px]">
          <div className="flex items-center justify-between pb-3 border-b border-[#261710] mb-4">
            <div className="flex items-center gap-2">
              <Truck className="w-3.5 h-3.5 text-amber-400" />
              <h3 className="text-xs font-bold font-serif uppercase tracking-wider text-amber-300">
                Out for Delivery
              </h3>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 font-bold">
              {deliveryOrders.length}
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto">
            {deliveryOrders.length === 0 ? (
              <div className="py-12 text-center text-zinc-500 text-xs">
                No transit orders right now
              </div>
            ) : (
              deliveryOrders.map((ord) => renderOrderCard(ord, 'DELIVERED', 'Confirm Delivered'))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
