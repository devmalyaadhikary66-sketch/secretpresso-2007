import React from 'react';
import { HelpCircle, BookOpen, Coffee, CookingPot, Box, Sliders, Shield, Radio } from 'lucide-react';

export const HelpView: React.FC = () => {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold font-serif text-[#fae8be]">SECRETpresso Executive Operational Manual</h2>
        <p className="text-xs text-zinc-400 mt-0.5">
          Standard operating procedures (SOP), role boundaries, and control matrix guide.
        </p>
      </div>

      <div className="space-y-4 text-xs">
        {/* Module 1: Live Orders & Pipeline */}
        <div className="p-5 rounded-2xl bg-[#140c08] border border-[#2e1c12] shadow-xl space-y-2">
          <div className="flex items-center gap-2 text-[#cfa851] font-bold text-sm font-serif">
            <Radio className="w-4 h-4" />
            <h3>Live Orders & Multi-Lane Pipeline</h3>
          </div>
          <p className="text-zinc-300 leading-relaxed">
            The Live Order stream automatically chimes and renders new incoming customer tickets without page refreshes. Move tickets through <strong className="text-zinc-100">New → In Kitchen → Ready/Packed → Out for Delivery → Delivered</strong>. Each status change records a timestamped audit trail and updates the customer's live tracking view.
          </p>
        </div>

        {/* Module 2: Kitchen Display System (KDS) */}
        <div className="p-5 rounded-2xl bg-[#140c08] border border-[#2e1c12] shadow-xl space-y-2">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm font-serif">
            <CookingPot className="w-4 h-4" />
            <h3>Barista & Culinary Kitchen Display (KDS)</h3>
          </div>
          <p className="text-zinc-300 leading-relaxed">
            Designed for baristas and pastry chefs. Financial totals are hidden to maximize screen focus. Tickets show milk alternatives (Oat, Almond), sweetness tiers, extra espresso shots, and special customer preparation notes. Touch large action buttons: <strong className="text-zinc-100">ACCEPT</strong>, <strong className="text-zinc-100">START PREPARING</strong>, and <strong className="text-zinc-100">READY & PLATED</strong>. Elapsed urgency indicators automatically alert if brewing exceeds 10 minutes.
          </p>
        </div>

        {/* Module 3: Raw Materials & Auto-Deductions */}
        <div className="p-5 rounded-2xl bg-[#140c08] border border-[#2e1c12] shadow-xl space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm font-serif">
            <Box className="w-4 h-4" />
            <h3>Raw Material Inventory & Automated Stock Inflow</h3>
          </div>
          <p className="text-zinc-300 leading-relaxed">
            Whenever a customer checks out, the system automatically decrements packaging and raw coffee bean weights. If an order is cancelled or refunded, stock is automatically restored to the active catalog. Record supplier purchase orders or barista dial-in wastage under <strong className="text-zinc-100">Adjust / Restock</strong> with an audit note.
          </p>
        </div>

        {/* Module 4: Website CMS & Safe Revisions */}
        <div className="p-5 rounded-2xl bg-[#140c08] border border-[#2e1c12] shadow-xl space-y-2">
          <div className="flex items-center gap-2 text-sky-400 font-bold text-sm font-serif">
            <Sliders className="w-4 h-4" />
            <h3>Storefront CMS, Draft Previews & Revisions</h3>
          </div>
          <p className="text-zinc-300 leading-relaxed">
            Edits made in the Website Editor are safely staged in draft mode. Rearrange homepage sections (Hero, Coffee Flavours, What's Inside, Tiramisu Spotlight) using the Move Up/Down arrows. Click <strong className="text-zinc-100">Publish Changes Live</strong> to push changes immediately to the customer storefront. In case of error, restore any historical revision snapshot with a single click.
          </p>
        </div>

        {/* Module 5: Store Open / Close Control */}
        <div className="p-5 rounded-2xl bg-[#140c08] border border-[#2e1c12] shadow-xl space-y-2">
          <div className="flex items-center gap-2 text-purple-400 font-bold text-sm font-serif">
            <Coffee className="w-4 h-4" />
            <h3>Store Control & Emergency Overrides</h3>
          </div>
          <p className="text-zinc-300 leading-relaxed">
            Use the Master Override to immediately toggle <strong className="text-zinc-100">FORCE CLOSE</strong> or <strong className="text-zinc-100">FORCE OPEN</strong>. When closed, customers cannot place new orders, and an announcement banner informs them when operations resume. Schedule weekly opening and closing hours under Store Control.
          </p>
        </div>
      </div>
    </div>
  );
};
