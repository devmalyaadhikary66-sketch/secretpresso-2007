import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { Order, OrderStatus } from '../../types';
import {
  CookingPot,
  Flame,
  Clock,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Coffee,
  CheckCheck,
  Play,
  RotateCw,
} from 'lucide-react';

export const KitchenView: React.FC = () => {
  const { orders, updateOrderStatus } = useStore();
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Timer refresh for elapsed minutes
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 10000);
    return () => clearInterval(interval);
  }, []);

  const getElapsedMinutes = (dateStr: string) => {
    const orderTime = new Date(dateStr).getTime();
    return Math.max(0, Math.floor((currentTime - orderTime) / 60000));
  };

  const getUrgency = (minutes: number) => {
    if (minutes > 30) return { label: 'CRITICAL DELAY', color: 'bg-red-600 text-white animate-pulse' };
    if (minutes > 20) return { label: 'DELAYED', color: 'bg-orange-600 text-white' };
    if (minutes > 10) return { label: 'WAITING', color: 'bg-amber-600 text-white' };
    return { label: 'NORMAL', color: 'bg-zinc-800 text-zinc-300' };
  };

  // Kitchen relevant orders
  const newOrders = orders.filter((o) => o.orderStatus === 'NEW' || o.orderStatus === 'CONFIRMED');
  const preparingOrders = orders.filter((o) => o.orderStatus === 'ACCEPTED' || o.orderStatus === 'PREPARING');
  const readyOrders = orders.filter((o) => o.orderStatus === 'READY' || o.orderStatus === 'PACKED');

  return (
    <div className="space-y-6">
      {/* KDS Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-5 rounded-2xl bg-[#140c08] border border-[#2e1c12]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#4d2d19] to-[#25150c] text-[#cfa851] border border-[#cfa851]/30">
            <CookingPot className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-serif text-[#fae8be] tracking-wide">
              Barista & Chef Kitchen Display System (KDS)
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Live preparation tickets. High-contrast recipes, allergen highlights, and urgency status.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3 sm:mt-0 font-mono text-xs">
          <span className="px-3 py-1.5 rounded-xl bg-[#1d120a] border border-[#3b2518] text-[#e6ca85]">
            Ticket Queue: {newOrders.length + preparingOrders.length} Orders Active
          </span>
        </div>
      </div>

      {/* 3 Main KDS Stages: NEW ORDERS, PREPARING, READY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Stage 1: NEW ORDERS */}
        <div className="rounded-2xl bg-[#100a06] border border-[#261710] p-4 flex flex-col min-h-[550px]">
          <div className="flex items-center justify-between pb-3 border-b border-[#261710] mb-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></span>
              <h3 className="text-sm font-bold font-serif uppercase tracking-wider text-zinc-100">
                1. New Orders ({newOrders.length})
              </h3>
            </div>
          </div>

          <div className="space-y-4 flex-1 overflow-y-auto">
            {newOrders.length === 0 ? (
              <div className="py-16 text-center text-zinc-600 text-xs">
                No tickets waiting in queue.
              </div>
            ) : (
              newOrders.map((order) => {
                const elapsed = getElapsedMinutes(order.createdAt);
                const urgency = getUrgency(elapsed);

                return (
                  <div
                    key={order.id}
                    className="p-4 rounded-2xl bg-[#180f0b] border-2 border-blue-500/30 shadow-lg space-y-3"
                  >
                    {/* Ticket Header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-mono text-base font-black text-[#fae8be]">
                          #{order.orderNumber}
                        </span>
                        <p className="text-xs font-semibold text-zinc-200 mt-0.5">
                          {order.customerName}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${urgency.color}`}>
                          {urgency.label} ({elapsed}m)
                        </span>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="space-y-2 py-2 border-y border-[#281810]">
                      {order.items.map((it) => (
                        <div key={it.id} className="text-xs">
                          <div className="flex items-baseline justify-between font-bold text-zinc-100">
                            <span>
                              <span className="text-amber-400 font-mono text-sm mr-1.5">
                                {it.quantity}×
                              </span>
                              {it.productName}
                            </span>
                          </div>
                          {it.customization && (
                            <div className="mt-1 p-2 rounded-lg bg-[#22150e] border border-[#362116] text-[11px] text-[#e6ca85] space-y-0.5">
                              {it.customization.temperature && <p>• Temp: {it.customization.temperature}</p>}
                              {it.customization.milk && <p>• Milk: {it.customization.milk}</p>}
                              {it.customization.sweetness && <p>• Sweetness: {it.customization.sweetness}</p>}
                              {it.customization.extraShots ? (
                                <p className="font-bold text-red-300">• +{it.customization.extraShots} Extra Espresso Shot</p>
                              ) : null}
                              {it.customization.specialInstructions && (
                                <p className="text-amber-200 font-semibold italic">
                                  Note: "{it.customization.specialInstructions}"
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {order.notes && (
                      <div className="p-2 rounded bg-amber-950/40 border border-amber-500/30 text-[11px] text-amber-200">
                        <span className="font-bold">Customer Note: </span>
                        {order.notes}
                      </div>
                    )}

                    {/* Large Touch Button: ACCEPT */}
                    <button
                      onClick={() => updateOrderStatus(order.id, 'ACCEPTED', 'Accepted by kitchen station')}
                      className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm tracking-wide transition shadow-lg flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-5 h-5" />
                      <span>ACCEPT ORDER</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Stage 2: PREPARING (In Active Brew) */}
        <div className="rounded-2xl bg-[#100a06] border border-[#261710] p-4 flex flex-col min-h-[550px]">
          <div className="flex items-center justify-between pb-3 border-b border-[#261710] mb-4">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-[#cfa851] animate-pulse" />
              <h3 className="text-sm font-bold font-serif uppercase tracking-wider text-[#fae8be]">
                2. In Prep / Brewing ({preparingOrders.length})
              </h3>
            </div>
          </div>

          <div className="space-y-4 flex-1 overflow-y-auto">
            {preparingOrders.length === 0 ? (
              <div className="py-16 text-center text-zinc-600 text-xs">
                No orders currently in brew.
              </div>
            ) : (
              preparingOrders.map((order) => {
                const elapsed = getElapsedMinutes(order.createdAt);
                const urgency = getUrgency(elapsed);

                return (
                  <div
                    key={order.id}
                    className="p-4 rounded-2xl bg-[#1a100a] border-2 border-[#cfa851]/60 shadow-xl space-y-3"
                  >
                    {/* Ticket Header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-mono text-base font-black text-[#fae8be]">
                          #{order.orderNumber}
                        </span>
                        <p className="text-xs font-semibold text-zinc-200 mt-0.5">
                          {order.customerName}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${urgency.color}`}>
                          {urgency.label} ({elapsed}m)
                        </span>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="space-y-2 py-2 border-y border-[#2d1b11]">
                      {order.items.map((it) => (
                        <div key={it.id} className="text-xs">
                          <div className="flex items-baseline justify-between font-bold text-zinc-100">
                            <span>
                              <span className="text-[#cfa851] font-mono text-base mr-1.5 font-black">
                                {it.quantity}×
                              </span>
                              {it.productName}
                            </span>
                          </div>
                          {it.customization && (
                            <div className="mt-1 p-2 rounded-lg bg-[#261710] border border-[#3e271a] text-[11px] text-[#e6ca85] space-y-0.5">
                              {it.customization.temperature && <p>• Temp: {it.customization.temperature}</p>}
                              {it.customization.milk && <p>• Milk: {it.customization.milk}</p>}
                              {it.customization.sweetness && <p>• Sweetness: {it.customization.sweetness}</p>}
                              {it.customization.extraShots ? (
                                <p className="font-bold text-red-300">• +{it.customization.extraShots} Extra Espresso Shot</p>
                              ) : null}
                              {it.customization.specialInstructions && (
                                <p className="text-amber-200 font-semibold italic">
                                  Note: "{it.customization.specialInstructions}"
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {order.notes && (
                      <div className="p-2 rounded bg-amber-950/40 border border-amber-500/30 text-[11px] text-amber-200">
                        <span className="font-bold">Customer Note: </span>
                        {order.notes}
                      </div>
                    )}

                    {/* Prep Actions: Start Preparing / Mark Ready */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {order.orderStatus === 'ACCEPTED' ? (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'PREPARING', 'Grinding & espresso pull initiated')}
                          className="col-span-2 py-3 px-4 rounded-xl bg-[#cfa851] hover:bg-[#dbb660] text-zinc-950 font-bold text-sm tracking-wide transition shadow-lg flex items-center justify-center gap-2"
                        >
                          <Play className="w-5 h-5 fill-current" />
                          <span>START PREPARING</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'READY', 'Poured, sealed, and ready for dispatch')}
                          className="col-span-2 py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm tracking-wide transition shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 animate-bounce-short"
                        >
                          <CheckCheck className="w-5 h-5" />
                          <span>READY & PLATED</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Stage 3: READY / PLATED */}
        <div className="rounded-2xl bg-[#100a06] border border-[#261710] p-4 flex flex-col min-h-[550px]">
          <div className="flex items-center justify-between pb-3 border-b border-[#261710] mb-4">
            <div className="flex items-center gap-2">
              <CheckCheck className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold font-serif uppercase tracking-wider text-emerald-300">
                3. Ready for Packaging ({readyOrders.length})
              </h3>
            </div>
          </div>

          <div className="space-y-4 flex-1 overflow-y-auto">
            {readyOrders.length === 0 ? (
              <div className="py-16 text-center text-zinc-600 text-xs">
                No orders waiting on pickup counter.
              </div>
            ) : (
              readyOrders.map((order) => {
                const elapsed = getElapsedMinutes(order.createdAt);

                return (
                  <div
                    key={order.id}
                    className="p-4 rounded-2xl bg-[#14120a] border-2 border-emerald-500/40 shadow-lg space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-mono text-base font-black text-emerald-300">
                          #{order.orderNumber}
                        </span>
                        <p className="text-xs font-semibold text-zinc-200 mt-0.5">
                          {order.customerName}
                        </p>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                        READY ({elapsed}m)
                      </span>
                    </div>

                    <div className="text-xs text-zinc-300 space-y-1 py-1">
                      {order.items.map((it) => (
                        <p key={it.id}>
                          <span className="font-mono font-bold text-emerald-400 mr-1">
                            {it.quantity}×
                          </span>
                          {it.productName}
                        </p>
                      ))}
                    </div>

                    {order.deliveryPartnerName && (
                      <p className="text-[11px] text-zinc-400">
                        Assigned Courier: <span className="text-zinc-100 font-semibold">{order.deliveryPartnerName}</span>
                      </p>
                    )}

                    <button
                      onClick={() => updateOrderStatus(order.id, 'PACKED', 'Packaged in insulated thermal carrier')}
                      className="w-full py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs transition"
                    >
                      Mark Packaged & Sealed
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
