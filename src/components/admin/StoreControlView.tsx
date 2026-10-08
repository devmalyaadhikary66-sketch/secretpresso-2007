import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { StoreHoursDay } from '../../types';
import {
  Store,
  Clock,
  AlertCircle,
  Save,
  CheckCircle2,
  Calendar,
  Lock,
  Unlock,
  Radio,
  Power,
  RotateCcw,
} from 'lucide-react';

export const StoreControlView: React.FC = () => {
  const { storeSettings, updateStoreSettings, setStoreOpenManualOverride, isStoreOpen } = useStore();

  const [hours, setHours] = useState<StoreHoursDay[]>(storeSettings.businessHours);
  const [closedMessage, setClosedMessage] = useState(storeSettings.closedAnnouncementMessage);
  const [prepTime, setPrepTime] = useState(storeSettings.estimatedDeliveryTimeMinutes);
  const [freeThreshold, setFreeThreshold] = useState(storeSettings.freeDeliveryThreshold);
  const [deliveryFee, setDeliveryFee] = useState(storeSettings.defaultDeliveryFee);

  const handleHourToggle = (day: StoreHoursDay['day']) => {
    setHours((prev) =>
      prev.map((h) => (h.day === day ? { ...h, isOpen: !h.isOpen } : h))
    );
  };

  const handleHourChange = (day: StoreHoursDay['day'], field: 'openTime' | 'closeTime', val: string) => {
    setHours((prev) =>
      prev.map((h) => (h.day === day ? { ...h, [field]: val } : h))
    );
  };

  const handleSaveOperationalRules = (e: React.FormEvent) => {
    e.preventDefault();
    updateStoreSettings({
      businessHours: hours,
      closedAnnouncementMessage: closedMessage,
      estimatedDeliveryTimeMinutes: Number(prepTime),
      freeDeliveryThreshold: Number(freeThreshold),
      defaultDeliveryFee: Number(deliveryFee),
    });
  };

  return (
    <div className="space-y-6">
      {/* Master Override Bar */}
      <div className={`p-6 rounded-2xl border transition shadow-2xl ${
        isStoreOpen
          ? 'bg-gradient-to-r from-[#141d13] via-[#10140e] to-[#141d13] border-emerald-500/40 shadow-emerald-950/20'
          : 'bg-gradient-to-r from-[#200f0a] via-[#160c07] to-[#200f0a] border-red-500/40 shadow-red-950/20'
      }`}>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border ${
              isStoreOpen
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}>
              <Power className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold font-serif text-zinc-100">
                  Store Status: {isStoreOpen ? 'ONLINE & ACCEPTING ORDERS' : 'STORE CURRENTLY CLOSED'}
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                  isStoreOpen ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                }`}>
                  {storeSettings.isOpenManualOverride === null
                    ? 'AUTO SCHEDULE ACTIVE'
                    : 'MANUAL OVERRIDE LOCKED'}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1 max-w-xl leading-relaxed">
                {isStoreOpen
                  ? 'Customers can browse menu, customize brews, and complete online checkout.'
                  : 'Customer storefront prominently shows "Currently Closed" with custom notice. No new orders can be placed.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setStoreOpenManualOverride(true)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                storeSettings.isOpenManualOverride === true
                  ? 'bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/30'
                  : 'bg-[#18110b] hover:bg-[#22160e] text-zinc-300 border border-[#362216]'
              }`}
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>Force Open</span>
            </button>

            <button
              onClick={() => setStoreOpenManualOverride(false)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                storeSettings.isOpenManualOverride === false
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                  : 'bg-[#18110b] hover:bg-[#22160e] text-zinc-300 border border-[#362216]'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Force Close</span>
            </button>

            <button
              onClick={() => setStoreOpenManualOverride(null)}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                storeSettings.isOpenManualOverride === null
                  ? 'bg-[#cfa851] text-zinc-950 font-bold'
                  : 'bg-[#18110b] hover:bg-[#22160e] text-zinc-300 border border-[#362216]'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Follow Schedule</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSaveOperationalRules} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Weekly Hours (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl bg-[#140c08] border border-[#2e1c12] p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#261710]">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#cfa851]" />
              <h3 className="text-sm font-bold font-serif text-[#fae8be]">
                Weekly Operating Schedule
              </h3>
            </div>
            <span className="text-xs text-zinc-400 font-mono">Auto Open/Close Rules</span>
          </div>

          <div className="divide-y divide-[#20140d]">
            {hours.map((h) => (
              <div key={h.day} className="py-3 flex items-center justify-between gap-4 text-xs">
                <div className="w-28 flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={h.isOpen}
                    onChange={() => handleHourToggle(h.day)}
                    className="accent-[#cfa851] w-4 h-4 rounded"
                  />
                  <span className={`font-semibold ${h.isOpen ? 'text-zinc-100' : 'text-zinc-500'}`}>
                    {h.day}
                  </span>
                </div>

                {h.isOpen ? (
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-400">Open:</span>
                    <input
                      type="time"
                      value={h.openTime}
                      onChange={(e) => handleHourChange(h.day, 'openTime', e.target.value)}
                      className="px-2.5 py-1 bg-[#1e130c] border border-[#382319] rounded-lg font-mono text-zinc-200"
                    />
                    <span className="text-zinc-500">to</span>
                    <input
                      type="time"
                      value={h.closeTime}
                      onChange={(e) => handleHourChange(h.day, 'closeTime', e.target.value)}
                      className="px-2.5 py-1 bg-[#1e130c] border border-[#382319] rounded-lg font-mono text-zinc-200"
                    />
                  </div>
                ) : (
                  <span className="font-mono text-xs text-red-400/80 uppercase">Closed All Day</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Closed Announcement & Fulfillment Settings (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Announcement Card */}
          <div className="rounded-2xl bg-[#140c08] border border-[#2e1c12] p-5 shadow-xl space-y-4">
            <h3 className="text-sm font-bold font-serif text-[#fae8be]">
              Closed Announcement Notice
            </h3>
            <p className="text-xs text-zinc-400">
              This message appears in a prominent golden banner across the customer storefront whenever the store is closed.
            </p>
            <textarea
              rows={3}
              value={closedMessage}
              onChange={(e) => setClosedMessage(e.target.value)}
              className="w-full p-3 bg-[#1b100a] border border-[#352116] rounded-xl text-xs text-zinc-200 focus:border-[#cfa851] focus:outline-none"
            />
          </div>

          {/* Delivery & Prep Timing */}
          <div className="rounded-2xl bg-[#140c08] border border-[#2e1c12] p-5 shadow-xl space-y-3 text-xs">
            <h3 className="text-sm font-bold font-serif text-[#fae8be]">
              Fulfillment Parameters
            </h3>

            <div>
              <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                Estimated Delivery Duration (Mins)
              </label>
              <input
                type="number"
                value={prepTime}
                onChange={(e) => setPrepTime(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#1b100a] border border-[#352116] rounded-xl font-mono text-zinc-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                  Default Delivery Fee (₹)
                </label>
                <input
                  type="number"
                  value={deliveryFee}
                  onChange={(e) => setDeliveryFee(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#1b100a] border border-[#352116] rounded-xl font-mono text-zinc-100"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                  Free Delivery Over (₹)
                </label>
                <input
                  type="number"
                  value={freeThreshold}
                  onChange={(e) => setFreeThreshold(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#1b100a] border border-[#352116] rounded-xl font-mono text-zinc-100"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-4 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#fae8be] via-[#cfa851] to-[#b3883b] text-zinc-950 font-bold text-xs tracking-wide transition shadow-lg shadow-[#cfa851]/15 hover:brightness-110 flex items-center justify-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Save Operational Parameters</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
