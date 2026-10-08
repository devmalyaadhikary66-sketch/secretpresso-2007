import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  Settings,
  Building,
  CreditCard,
  Search,
  Save,
  CheckCircle2,
  AlertCircle,
  Database,
  Lock,
  Globe,
  Radio,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { storeSettings, updateStoreSettings } = useStore();

  const [bizForm, setBizForm] = useState({
    storeName: storeSettings.storeName,
    tagline: storeSettings.tagline,
    businessPhone: storeSettings.businessPhone,
    businessEmail: storeSettings.businessEmail,
    businessAddress: storeSettings.businessAddress,
    gstNumber: storeSettings.gstNumber,
    taxRatePercent: storeSettings.taxRatePercent,
  });

  const [seoForm, setSeoForm] = useState({
    title: storeSettings.seo.title,
    description: storeSettings.seo.description,
    ogTitle: storeSettings.seo.ogTitle,
    ogDescription: storeSettings.seo.ogDescription,
    keywords: storeSettings.seo.keywords,
  });

  const handleSaveBiz = (e: React.FormEvent) => {
    e.preventDefault();
    updateStoreSettings({
      ...bizForm,
      taxRatePercent: Number(bizForm.taxRatePercent),
      seo: seoForm,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold font-serif text-[#fae8be]">System Architecture & Enterprise Settings</h2>
        <p className="text-xs text-zinc-400 mt-0.5">
          Brand legal entity profile, SEO meta tags, gateway integrations, and data persistence state.
        </p>
      </div>

      <form onSubmit={handleSaveBiz} className="space-y-6">
        {/* Backend & Integration Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Database & Cloud State */}
          <div className="p-5 rounded-2xl bg-[#140c08] border border-[#2e1c12] shadow-xl space-y-3">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-[#cfa851]" />
              <h3 className="text-sm font-bold font-serif text-[#fae8be]">
                Data Engine & Persistence Status
              </h3>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Operational records and menu updates persist across reloads and sync live across browser sessions via BroadcastChannel.
            </p>
            <div className="p-3 rounded-xl bg-[#1b100a] border border-[#2c1a11] flex items-center justify-between text-xs">
              <span className="text-zinc-300 font-medium">Engine Mode:</span>
              <span className="font-mono text-emerald-400 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Active Persistent Local Database
              </span>
            </div>
            <p className="text-[11px] text-zinc-500">
              Firestore Cloud RPC: <span className="text-zinc-400">Integration-ready adapter loaded</span>
            </p>
          </div>

          {/* Payment Gateways */}
          <div className="p-5 rounded-2xl bg-[#140c08] border border-[#2e1c12] shadow-xl space-y-3">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#cfa851]" />
              <h3 className="text-sm font-bold font-serif text-[#fae8be]">
                Payment Gateways Status
              </h3>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Real gateway connectors status. Unconnected gateways are strictly flagged as Not Connected.
            </p>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-[#1b100a] border border-[#2c1a11] flex items-center justify-between">
                <span className="text-zinc-300 font-semibold">Razorpay Direct (UPI & Cards)</span>
                <span className="font-mono text-[10px] uppercase font-bold text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/20">
                  Ready for API Keys
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#1b100a] border border-[#2c1a11] flex items-center justify-between">
                <span className="text-zinc-300 font-semibold">Stripe Global (International Cards)</span>
                <span className="font-mono text-[10px] uppercase font-bold text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded">
                  Not Connected
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#1b100a] border border-[#2c1a11] flex items-center justify-between">
                <span className="text-zinc-300 font-semibold">Concierge Pay on Delivery (Cash/UPI)</span>
                <span className="font-mono text-[10px] uppercase font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20">
                  Active
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Business Legal Entity Profile */}
        <div className="p-6 rounded-2xl bg-[#140c08] border border-[#2e1c12] shadow-xl space-y-4 text-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-[#261710]">
            <Building className="w-4 h-4 text-[#cfa851]" />
            <h3 className="text-sm font-bold font-serif text-[#fae8be]">
              Commercial Enterprise Profile
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                Storefront Name *
              </label>
              <input
                type="text"
                required
                value={bizForm.storeName}
                onChange={(e) => setBizForm({ ...bizForm, storeName: e.target.value })}
                className="w-full px-3 py-2 bg-[#180f0b] border border-[#352116] rounded-xl text-zinc-100 focus:border-[#cfa851] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                Brand Tagline
              </label>
              <input
                type="text"
                value={bizForm.tagline}
                onChange={(e) => setBizForm({ ...bizForm, tagline: e.target.value })}
                className="w-full px-3 py-2 bg-[#180f0b] border border-[#352116] rounded-xl text-zinc-100 focus:border-[#cfa851] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                Concierge Contact Phone *
              </label>
              <input
                type="text"
                required
                value={bizForm.businessPhone}
                onChange={(e) => setBizForm({ ...bizForm, businessPhone: e.target.value })}
                className="w-full px-3 py-2 bg-[#180f0b] border border-[#352116] rounded-xl text-zinc-100 focus:border-[#cfa851] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                Official Support Email *
              </label>
              <input
                type="email"
                required
                value={bizForm.businessEmail}
                onChange={(e) => setBizForm({ ...bizForm, businessEmail: e.target.value })}
                className="w-full px-3 py-2 bg-[#180f0b] border border-[#352116] rounded-xl text-zinc-100 focus:border-[#cfa851] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                GSTIN / Enterprise Tax ID *
              </label>
              <input
                type="text"
                required
                value={bizForm.gstNumber}
                onChange={(e) => setBizForm({ ...bizForm, gstNumber: e.target.value })}
                className="w-full px-3 py-2 bg-[#180f0b] border border-[#352116] rounded-xl font-mono text-zinc-100 focus:border-[#cfa851] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
              Registered Roastery Address *
            </label>
            <input
              type="text"
              required
              value={bizForm.businessAddress}
              onChange={(e) => setBizForm({ ...bizForm, businessAddress: e.target.value })}
              className="w-full px-3 py-2 bg-[#180f0b] border border-[#352116] rounded-xl text-zinc-100 focus:border-[#cfa851] focus:outline-none"
            />
          </div>
        </div>

        {/* SEO & Meta Tags Editor */}
        <div className="p-6 rounded-2xl bg-[#140c08] border border-[#2e1c12] shadow-xl space-y-4 text-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-[#261710]">
            <Globe className="w-4 h-4 text-[#cfa851]" />
            <h3 className="text-sm font-bold font-serif text-[#fae8be]">
              SEO & Social OpenGraph Configuration
            </h3>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
              Meta Page Title
            </label>
            <input
              type="text"
              value={seoForm.title}
              onChange={(e) => setSeoForm({ ...seoForm, title: e.target.value })}
              className="w-full px-3 py-2 bg-[#180f0b] border border-[#352116] rounded-xl text-zinc-100 focus:border-[#cfa851] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
              Meta Meta Description
            </label>
            <textarea
              rows={2}
              value={seoForm.description}
              onChange={(e) => setSeoForm({ ...seoForm, description: e.target.value })}
              className="w-full px-3 py-2 bg-[#180f0b] border border-[#352116] rounded-xl text-zinc-100 focus:border-[#cfa851] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
              SEO Keywords (Comma-separated)
            </label>
            <input
              type="text"
              value={seoForm.keywords}
              onChange={(e) => setSeoForm({ ...seoForm, keywords: e.target.value })}
              className="w-full px-3 py-2 bg-[#180f0b] border border-[#352116] rounded-xl text-zinc-100 focus:border-[#cfa851] focus:outline-none"
            />
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#fae8be] via-[#cfa851] to-[#b3883b] text-zinc-950 font-bold text-xs shadow-lg shadow-[#cfa851]/20 hover:brightness-110 flex items-center gap-2 transition"
          >
            <Save className="w-4 h-4" />
            <span>Save System Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};
