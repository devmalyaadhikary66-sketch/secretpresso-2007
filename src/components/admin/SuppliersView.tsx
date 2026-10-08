import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Supplier } from '../../types';
import {
  Truck,
  Plus,
  Phone,
  Mail,
  MapPin,
  FileText,
  DollarSign,
  Package,
  Calendar,
  X,
  Edit2,
  CheckCircle2,
} from 'lucide-react';

export const SuppliersView: React.FC = () => {
  const { suppliers, addSupplier, updateSupplier, inventory, createRestockRecord } = useStore();

  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // New Purchase Order / Restock Modal
  const [isRestockOpen, setIsRestockOpen] = useState(false);
  const [selectedSupplierForPO, setSelectedSupplierForPO] = useState<Supplier | null>(null);
  const [poItemId, setPoItemId] = useState(inventory[0]?.id || '');
  const [poQuantity, setPoQuantity] = useState(20);
  const [poNotes, setPoNotes] = useState('Quarterly supply restock batch');

  // Supplier Form
  const [supplierForm, setSupplierForm] = useState<Omit<Supplier, 'id'>>({
    name: '',
    company: '',
    phone: '',
    email: '',
    address: '',
    gstNumber: '',
    productsSupplied: [],
    paymentTerms: 'Net 30 Days',
    notes: '',
  });
  const [productsSuppliedText, setProductsSuppliedText] = useState('');

  const openAddModal = () => {
    setEditingSupplier(null);
    setSupplierForm({
      name: '',
      company: '',
      phone: '',
      email: '',
      address: '',
      gstNumber: '',
      productsSupplied: [],
      paymentTerms: 'Net 30 Days',
      notes: '',
    });
    setProductsSuppliedText('');
    setIsAddSupplierOpen(true);
  };

  const openEditModal = (s: Supplier) => {
    setEditingSupplier(s);
    setSupplierForm({ ...s });
    setProductsSuppliedText(s.productsSupplied.join(', '));
    setIsAddSupplierOpen(true);
  };

  const handleSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const prepared = {
      ...supplierForm,
      productsSupplied: productsSuppliedText.split(',').map((p) => p.trim()).filter(Boolean),
    };

    if (editingSupplier) {
      updateSupplier(editingSupplier.id, prepared);
    } else {
      addSupplier(prepared);
    }
    setIsAddSupplierOpen(false);
  };

  const handlePoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierForPO || !poItemId) return;

    createRestockRecord(
      selectedSupplierForPO.id,
      [{ itemId: poItemId, quantity: Number(poQuantity) }],
      poNotes
    );

    setIsRestockOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-serif text-[#fae8be]">Supplier Directory & Procurement</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Partner contacts, contracts, GST credentials, and restock purchase orders.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-[#fae8be] via-[#cfa851] to-[#b3883b] text-zinc-950 text-xs font-bold transition shadow-lg shadow-[#cfa851]/20 hover:brightness-110"
        >
          <Plus className="w-4 h-4" />
          <span>Onboard New Supplier</span>
        </button>
      </div>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {suppliers.map((supplier) => (
          <div
            key={supplier.id}
            className="rounded-2xl bg-[#140c08] border border-[#2e1c12] hover:border-[#cfa851]/40 shadow-xl p-5 flex flex-col justify-between transition"
          >
            <div>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-base font-bold text-[#fae8be]">{supplier.company}</h3>
                  <p className="text-xs text-zinc-400">Rep: {supplier.name}</p>
                </div>
                <button
                  onClick={() => openEditModal(supplier)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-[#20140e] transition"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-1.5 text-xs text-zinc-300 py-3 border-y border-[#261710]">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                  <a href={`tel:${supplier.phone}`} className="hover:text-[#cfa851]">
                    {supplier.phone}
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                  <a href={`mailto:${supplier.email}`} className="hover:text-[#cfa851] truncate">
                    {supplier.email}
                  </a>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-zinc-500 mt-0.5 shrink-0" />
                  <span className="text-[11px] leading-relaxed text-zinc-400 truncate">
                    {supplier.address}
                  </span>
                </div>
              </div>

              {/* Products Supplied Pills */}
              <div className="mt-3">
                <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 block mb-1.5">
                  Supplied Materials
                </span>
                <div className="flex flex-wrap gap-1">
                  {supplier.productsSupplied.map((prod, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-[#20130c] border border-[#382216] text-[10px] text-[#e6ca85]"
                    >
                      {prod}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-3 text-[11px] text-zinc-400 space-y-0.5">
                <p>GSTIN: <span className="font-mono text-zinc-300">{supplier.gstNumber}</span></p>
                <p>Terms: <span className="text-[#cfa851]">{supplier.paymentTerms}</span></p>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-[#261710]">
              <button
                onClick={() => {
                  setSelectedSupplierForPO(supplier);
                  setIsRestockOpen(true);
                }}
                className="w-full py-2 px-3 rounded-xl bg-[#261710] hover:bg-[#341f15] border border-[#3e271c] text-xs font-semibold text-[#f5ebd9] transition flex items-center justify-center gap-2"
              >
                <Package className="w-3.5 h-3.5 text-[#cfa851]" />
                <span>Issue Restock PO</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Supplier Modal */}
      {isAddSupplierOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#120b08] border border-[#382319] w-full max-w-lg rounded-2xl shadow-2xl p-6 text-zinc-100 relative">
            <button
              onClick={() => setIsAddSupplierOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold font-serif text-[#fae8be]">
              {editingSupplier ? `Edit Supplier: ${editingSupplier.company}` : 'Onboard Supply Partner'}
            </h3>

            <form onSubmit={handleSupplierSubmit} className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={supplierForm.company}
                    onChange={(e) => setSupplierForm({ ...supplierForm, company: e.target.value })}
                    placeholder="e.g. Highland Estate Growers"
                    className="w-full px-3 py-2 bg-[#180f0b] border border-[#382319] rounded-xl text-zinc-100 focus:border-[#cfa851] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                    Contact Person *
                  </label>
                  <input
                    type="text"
                    required
                    value={supplierForm.name}
                    onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                    placeholder="e.g. Kavitha Rao"
                    className="w-full px-3 py-2 bg-[#180f0b] border border-[#382319] rounded-xl text-zinc-100 focus:border-[#cfa851] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                    Phone *
                  </label>
                  <input
                    type="text"
                    required
                    value={supplierForm.phone}
                    onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                    placeholder="+91 94480 11223"
                    className="w-full px-3 py-2 bg-[#180f0b] border border-[#382319] rounded-xl text-zinc-100 focus:border-[#cfa851] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={supplierForm.email}
                    onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                    placeholder="orders@supplier.in"
                    className="w-full px-3 py-2 bg-[#180f0b] border border-[#382319] rounded-xl text-zinc-100 focus:border-[#cfa851] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                  Physical Address
                </label>
                <input
                  type="text"
                  value={supplierForm.address}
                  onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
                  placeholder="Estate or Warehouse address"
                  className="w-full px-3 py-2 bg-[#180f0b] border border-[#382319] rounded-xl text-zinc-100 focus:border-[#cfa851] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                    GSTIN / Tax ID
                  </label>
                  <input
                    type="text"
                    value={supplierForm.gstNumber}
                    onChange={(e) => setSupplierForm({ ...supplierForm, gstNumber: e.target.value })}
                    placeholder="29ABCDE1234F1Z5"
                    className="w-full px-3 py-2 bg-[#180f0b] border border-[#382319] rounded-xl font-mono text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                    Payment Terms
                  </label>
                  <input
                    type="text"
                    value={supplierForm.paymentTerms}
                    onChange={(e) => setSupplierForm({ ...supplierForm, paymentTerms: e.target.value })}
                    placeholder="Net 30 Days"
                    className="w-full px-3 py-2 bg-[#180f0b] border border-[#382319] rounded-xl text-zinc-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                  Supplied Materials (Comma-separated)
                </label>
                <input
                  type="text"
                  value={productsSuppliedText}
                  onChange={(e) => setProductsSuppliedText(e.target.value)}
                  placeholder="Arabica Beans, Whole Milk, Glass Jars..."
                  className="w-full px-3 py-2 bg-[#180f0b] border border-[#382319] rounded-xl text-zinc-100 focus:border-[#cfa851] focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddSupplierOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#cfa851] text-zinc-950 hover:bg-[#dbb660]"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Restock Purchase Order Modal */}
      {isRestockOpen && selectedSupplierForPO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#120b08] border border-[#382319] w-full max-w-md rounded-2xl shadow-2xl p-6 text-zinc-100 relative">
            <button
              onClick={() => setIsRestockOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold font-serif text-[#fae8be]">
              Create Purchase Order & Inbound Restock
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Supplier: <span className="font-semibold text-zinc-200">{selectedSupplierForPO.company}</span>
            </p>

            <form onSubmit={handlePoSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                  Select Material from Catalog *
                </label>
                <select
                  value={poItemId}
                  onChange={(e) => setPoItemId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#180f0b] border border-[#382319] rounded-xl text-zinc-100 focus:border-[#cfa851] focus:outline-none"
                >
                  {inventory.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.name} (Current: {inv.currentStock} {inv.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                  Quantity to Inflow *
                </label>
                <input
                  type="number"
                  required
                  value={poQuantity}
                  onChange={(e) => setPoQuantity(Number(e.target.value))}
                  placeholder="20"
                  className="w-full px-3 py-2 bg-[#180f0b] border border-[#382319] rounded-xl font-mono text-zinc-100 focus:border-[#cfa851] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                  PO Reference / Delivery Note
                </label>
                <input
                  type="text"
                  value={poNotes}
                  onChange={(e) => setPoNotes(e.target.value)}
                  placeholder="PO #2026-SP-91"
                  className="w-full px-3 py-2 bg-[#180f0b] border border-[#382319] rounded-xl text-zinc-100 focus:border-[#cfa851] focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRestockOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#cfa851] text-zinc-950 hover:bg-[#dbb660]"
                >
                  Execute Inflow & Update Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
