import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { DeliveryZone, DeliveryPartner } from '../../types';
import {
  Truck,
  Plus,
  MapPin,
  Phone,
  Clock,
  CheckCircle,
  X,
  Edit2,
  DollarSign,
  UserCheck,
} from 'lucide-react';

export const DeliveryView: React.FC = () => {
  const {
    deliveryZones,
    deliveryPartners,
    updateDeliveryZone,
    addDeliveryZone,
    updateDeliveryPartnerStatus,
    addDeliveryPartner,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'zones' | 'fleet'>('zones');

  // Zone Modal
  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
  const [newZone, setNewZone] = useState<Omit<DeliveryZone, 'id'>>({
    name: '',
    pincodes: [],
    deliveryFee: 50,
    freeDeliveryAbove: 599,
    estimatedTimeMin: 30,
    isActive: true,
  });
  const [pincodesText, setPincodesText] = useState('');

  // Partner Modal
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
  const [newPartner, setNewPartner] = useState<Omit<DeliveryPartner, 'id' | 'activeOrdersCount'>>({
    name: '',
    phone: '',
    vehicle: 'Electric Scooter (KA-01-EQ-...)',
    status: 'AVAILABLE',
  });

  const handleCreateZone = (e: React.FormEvent) => {
    e.preventDefault();
    const codes = pincodesText.split(',').map((p) => p.trim()).filter(Boolean);
    addDeliveryZone({
      ...newZone,
      pincodes: codes,
      deliveryFee: Number(newZone.deliveryFee),
      freeDeliveryAbove: Number(newZone.freeDeliveryAbove),
      estimatedTimeMin: Number(newZone.estimatedTimeMin),
    });
    setIsZoneModalOpen(false);
    setPincodesText('');
  };

  const handleCreatePartner = (e: React.FormEvent) => {
    e.preventDefault();
    addDeliveryPartner(newPartner);
    setIsPartnerModalOpen(false);
    setNewPartner({
      name: '',
      phone: '',
      vehicle: 'Electric Scooter',
      status: 'AVAILABLE',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-serif text-[#fae8be]">Delivery Logistics & Fleet Dispatch</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Territory pincodes, zone fee surcharges, driver roster, and active dispatch status.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'zones' ? (
            <button
              onClick={() => setIsZoneModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-[#fae8be] via-[#cfa851] to-[#b3883b] text-zinc-950 text-xs font-bold transition shadow-lg shadow-[#cfa851]/20 hover:brightness-110"
            >
              <Plus className="w-4 h-4" />
              <span>Add Delivery Zone</span>
            </button>
          ) : (
            <button
              onClick={() => setIsPartnerModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-[#fae8be] via-[#cfa851] to-[#b3883b] text-zinc-950 text-xs font-bold transition shadow-lg shadow-[#cfa851]/20 hover:brightness-110"
            >
              <Plus className="w-4 h-4" />
              <span>Register Courier Partner</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#281810] pb-2">
        <button
          onClick={() => setActiveTab('zones')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'zones'
              ? 'bg-[#cfa851] text-zinc-950 font-bold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Delivery Zones & Pincodes ({deliveryZones.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('fleet')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'fleet'
              ? 'bg-[#cfa851] text-zinc-950 font-bold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Courier Fleet & Drivers ({deliveryPartners.length})</span>
        </button>
      </div>

      {/* Zones View */}
      {activeTab === 'zones' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {deliveryZones.map((zone) => (
            <div
              key={zone.id}
              className="rounded-2xl bg-[#140c08] border border-[#2e1c12] p-5 shadow-xl flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-sm font-bold text-[#fae8be]">{zone.name}</h3>
                  <button
                    onClick={() => updateDeliveryZone(zone.id, { isActive: !zone.isActive })}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      zone.isActive
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {zone.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </button>
                </div>

                <div className="space-y-1.5 py-3 border-y border-[#261710] text-xs">
                  <div className="flex justify-between text-zinc-300">
                    <span className="text-zinc-500">Zone Delivery Fee:</span>
                    <span className="font-mono font-bold text-zinc-100">₹{zone.deliveryFee}</span>
                  </div>
                  <div className="flex justify-between text-zinc-300">
                    <span className="text-zinc-500">Free Delivery Over:</span>
                    <span className="font-mono text-emerald-400">₹{zone.freeDeliveryAbove}</span>
                  </div>
                  <div className="flex justify-between text-zinc-300">
                    <span className="text-zinc-500">Transit Estimate:</span>
                    <span className="font-mono text-[#cfa851]">~{zone.estimatedTimeMin} mins</span>
                  </div>
                </div>

                <div className="mt-3">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block mb-1.5">
                    Serviced Postal Codes ({zone.pincodes.length})
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {zone.pincodes.map((pin) => (
                      <span
                        key={pin}
                        className="px-2 py-0.5 rounded bg-[#22150e] border border-[#382319] font-mono text-[11px] text-zinc-300"
                      >
                        {pin}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Fleet View */}
      {activeTab === 'fleet' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {deliveryPartners.map((partner) => (
            <div
              key={partner.id}
              className="rounded-2xl bg-[#140c08] border border-[#2e1c12] p-5 shadow-xl flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-100">{partner.name}</h3>
                    <p className="text-[11px] text-zinc-400">{partner.vehicle}</p>
                  </div>

                  <select
                    value={partner.status}
                    onChange={(e) => updateDeliveryPartnerStatus(partner.id, e.target.value as DeliveryPartner['status'])}
                    className="px-2 py-1 bg-[#1e130c] border border-[#382319] rounded-lg text-[10px] font-mono font-bold text-[#cfa851]"
                  >
                    <option value="AVAILABLE">AVAILABLE</option>
                    <option value="ON_DELIVERY">ON DELIVERY</option>
                    <option value="OFF_DUTY">OFF DUTY</option>
                  </select>
                </div>

                <div className="space-y-1 text-xs text-zinc-300 py-3 border-y border-[#261710]">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-zinc-500" />
                    <span>{partner.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Active Dispatches: {partner.activeOrdersCount} orders</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Zone Modal */}
      {isZoneModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#120b08] border border-[#382319] w-full max-w-md rounded-2xl shadow-2xl p-6 text-zinc-100 relative">
            <button
              onClick={() => setIsZoneModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold font-serif text-[#fae8be]">
              Add Delivery Territory Zone
            </h3>

            <form onSubmit={handleCreateZone} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                  Zone Title *
                </label>
                <input
                  type="text"
                  required
                  value={newZone.name}
                  onChange={(e) => setNewZone({ ...newZone, name: e.target.value })}
                  placeholder="e.g. Koramangala & HSR Hub"
                  className="w-full px-3 py-2 bg-[#180f0b] border border-[#382319] rounded-xl text-zinc-100 focus:border-[#cfa851] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                  Pincodes (Comma-separated) *
                </label>
                <input
                  type="text"
                  required
                  value={pincodesText}
                  onChange={(e) => setPincodesText(e.target.value)}
                  placeholder="560034, 560095, 560102"
                  className="w-full px-3 py-2 bg-[#180f0b] border border-[#382319] rounded-xl font-mono text-zinc-100 focus:border-[#cfa851] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                    Delivery Fee (₹)
                  </label>
                  <input
                    type="number"
                    value={newZone.deliveryFee}
                    onChange={(e) => setNewZone({ ...newZone, deliveryFee: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#180f0b] border border-[#382319] rounded-xl font-mono text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                    Free Threshold (₹)
                  </label>
                  <input
                    type="number"
                    value={newZone.freeDeliveryAbove}
                    onChange={(e) => setNewZone({ ...newZone, freeDeliveryAbove: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#180f0b] border border-[#382319] rounded-xl font-mono text-zinc-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                  Estimated Delivery Time (Mins)
                </label>
                <input
                  type="number"
                  value={newZone.estimatedTimeMin}
                  onChange={(e) => setNewZone({ ...newZone, estimatedTimeMin: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-[#180f0b] border border-[#382319] rounded-xl font-mono text-zinc-100"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsZoneModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#cfa851] text-zinc-950 hover:bg-[#dbb660]"
                >
                  Save Zone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Partner Modal */}
      {isPartnerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#120b08] border border-[#382319] w-full max-w-md rounded-2xl shadow-2xl p-6 text-zinc-100 relative">
            <button
              onClick={() => setIsPartnerModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold font-serif text-[#fae8be]">
              Register Delivery Fleet Courier
            </h3>

            <form onSubmit={handleCreatePartner} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={newPartner.name}
                  onChange={(e) => setNewPartner({ ...newPartner, name: e.target.value })}
                  placeholder="e.g. Ramesh Gowda"
                  className="w-full px-3 py-2 bg-[#180f0b] border border-[#382319] rounded-xl text-zinc-100 focus:border-[#cfa851] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                  Phone Number *
                </label>
                <input
                  type="text"
                  required
                  value={newPartner.phone}
                  onChange={(e) => setNewPartner({ ...newPartner, phone: e.target.value })}
                  placeholder="+91 98860 12345"
                  className="w-full px-3 py-2 bg-[#180f0b] border border-[#382319] rounded-xl text-zinc-100 focus:border-[#cfa851] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                  Vehicle Details *
                </label>
                <input
                  type="text"
                  required
                  value={newPartner.vehicle}
                  onChange={(e) => setNewPartner({ ...newPartner, vehicle: e.target.value })}
                  placeholder="e.g. Ather 450X (KA-01-EQ-1234)"
                  className="w-full px-3 py-2 bg-[#180f0b] border border-[#382319] rounded-xl text-zinc-100 focus:border-[#cfa851] focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPartnerModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#cfa851] text-zinc-950 hover:bg-[#dbb660]"
                >
                  Register Courier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
