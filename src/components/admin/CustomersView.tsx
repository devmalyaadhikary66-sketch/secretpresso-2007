import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { Customer } from '../../types';
import {
  Users,
  Search,
  Filter,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  ShoppingBag,
  Award,
  Save,
  Download,
  X,
  FileText,
} from 'lucide-react';

export const CustomersView: React.FC = () => {
  const { customers, orders, updateCustomerNotes, updateCustomerSegment } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSegment, setSelectedSegment] = useState<string>('ALL');
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(customers[0] || null);
  const [internalNote, setInternalNote] = useState(customers[0]?.adminNotes || '');

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.includes(searchQuery);
      const matchSegment = selectedSegment === 'ALL' || c.segment === selectedSegment;
      return matchSearch && matchSegment;
    });
  }, [customers, searchQuery, selectedSegment]);

  // Selected customer's order history
  const customerOrders = useMemo(() => {
    if (!activeCustomer) return [];
    return orders.filter(
      (o) =>
        o.customerEmail.toLowerCase() === activeCustomer.email.toLowerCase() ||
        o.customerPhone === activeCustomer.phone
    );
  }, [orders, activeCustomer]);

  const handleSelectCustomer = (c: Customer) => {
    setActiveCustomer(c);
    setInternalNote(c.adminNotes || '');
  };

  const handleSaveNotes = () => {
    if (!activeCustomer) return;
    updateCustomerNotes(activeCustomer.id, internalNote);
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Total Orders', 'Total Spent', 'Segment', 'Registered'];
    const rows = filteredCustomers.map((c) => [
      `"${c.name}"`,
      c.email,
      c.phone,
      c.totalOrders,
      c.totalSpent,
      c.segment,
      c.registrationDate,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `SECRETpresso_Customers_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-serif text-[#fae8be]">Customer Relationship Management (CRM)</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Profiles, purchase history, lifetime value (LTV), taste preferences, and internal VIP notes.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1c120c] hover:bg-[#281810] border border-[#3d271c] text-xs font-semibold text-[#f0e2d0] transition shadow"
        >
          <Download className="w-3.5 h-3.5 text-[#cfa851]" />
          <span>Export Customers CSV</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center gap-3 p-3.5 rounded-2xl bg-[#140c08] border border-[#2e1c12]">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, or contact phone..."
            className="w-full pl-9 pr-4 py-2 bg-[#1b100a] border border-[#382319] focus:border-[#cfa851] rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          {['ALL', 'VIP', 'High Value', 'Returning Customer', 'New Customer', 'Inactive'].map((seg) => (
            <button
              key={seg}
              onClick={() => setSelectedSegment(seg)}
              className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap transition ${
                selectedSegment === seg
                  ? 'bg-[#cfa851] text-zinc-950 font-bold shadow'
                  : 'bg-[#1b100a] text-zinc-400 hover:text-zinc-200 border border-[#2c1b12]'
              }`}
            >
              {seg}
            </button>
          ))}
        </div>
      </div>

      {/* Split layout: Customer list and Profile card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Customer Directory Table (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl bg-[#140c08] border border-[#2e1c12] shadow-xl overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-[#261710] flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Customers Listed ({filteredCustomers.length})
            </span>
          </div>

          <div className="divide-y divide-[#20140d] overflow-y-auto max-h-[600px]">
            {filteredCustomers.map((cust) => {
              const isSelected = activeCustomer?.id === cust.id;
              return (
                <div
                  key={cust.id}
                  onClick={() => handleSelectCustomer(cust)}
                  className={`p-4 transition cursor-pointer flex items-center justify-between gap-4 ${
                    isSelected ? 'bg-[#22140d] border-l-4 border-l-[#cfa851]' : 'hover:bg-[#1a100a]'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-zinc-100">{cust.name}</span>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#cfa851]/15 text-[#e6ca85] border border-[#cfa851]/30">
                        {cust.segment}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-0.5">{cust.email} • {cust.phone}</p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs font-mono font-bold text-[#f5ebd9]">
                      ₹{cust.totalSpent.toLocaleString('en-IN')}
                    </p>
                    <p className="text-[10px] text-zinc-500 font-mono">
                      {cust.totalOrders} {cust.totalOrders === 1 ? 'Order' : 'Orders'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Customer Detailed Profile (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl bg-[#140c08] border border-[#2e1c12] shadow-xl p-5 flex flex-col justify-between">
          {activeCustomer ? (
            <div className="space-y-5">
              <div className="flex items-start justify-between pb-3 border-b border-[#261710]">
                <div>
                  <h3 className="text-base font-bold text-[#fae8be]">{activeCustomer.name}</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Member since {activeCustomer.registrationDate}
                  </p>
                </div>
                <select
                  value={activeCustomer.segment}
                  onChange={(e) => updateCustomerSegment(activeCustomer.id, e.target.value as Customer['segment'])}
                  className="px-2.5 py-1 bg-[#1e130c] border border-[#382319] rounded-lg text-xs font-mono text-[#cfa851]"
                >
                  <option value="New Customer">New Customer</option>
                  <option value="Returning Customer">Returning Customer</option>
                  <option value="VIP">VIP</option>
                  <option value="High Value">High Value</option>
                  <option value="Inactive">Inactive</option>
                  <option value="At Risk">At Risk</option>
                </select>
              </div>

              {/* Contact meta */}
              <div className="p-3 rounded-xl bg-[#180f0b] border border-[#261710] space-y-1.5 text-xs">
                <div className="flex items-center gap-2 text-zinc-300">
                  <Phone className="w-3.5 h-3.5 text-zinc-500" />
                  <span>{activeCustomer.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-300">
                  <Mail className="w-3.5 h-3.5 text-zinc-500" />
                  <span>{activeCustomer.email}</span>
                </div>
                <div className="flex items-start gap-2 text-zinc-400">
                  <MapPin className="w-3.5 h-3.5 text-zinc-500 mt-0.5 shrink-0" />
                  <span>{activeCustomer.address} (PIN: {activeCustomer.pincode})</span>
                </div>
              </div>

              {/* Financial & Order stats */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-[#180f0b] border border-[#261710]">
                  <span className="text-[10px] uppercase font-mono text-zinc-400 block mb-1">Lifetime Volume</span>
                  <span className="text-base font-mono font-bold text-[#f5ebd9]">₹{activeCustomer.totalSpent}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#180f0b] border border-[#261710]">
                  <span className="text-[10px] uppercase font-mono text-zinc-400 block mb-1">Completed Orders</span>
                  <span className="text-base font-mono font-bold text-zinc-200">{activeCustomer.totalOrders}</span>
                </div>
              </div>

              {/* Order History */}
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
                  Order History ({customerOrders.length})
                </h4>
                <div className="space-y-1.5 max-h-40 overflow-y-auto text-xs">
                  {customerOrders.map((ord) => (
                    <div key={ord.id} className="p-2 rounded-lg bg-[#180f0b] border border-[#261710] flex justify-between items-center">
                      <div>
                        <span className="font-mono font-bold text-[#fae8be]">#{ord.orderNumber}</span>
                        <span className="text-zinc-500 text-[10px] ml-2">
                          {new Date(ord.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-zinc-200">₹{ord.finalAmount}</span>
                        <span className="text-[10px] font-mono text-[#cfa851]">{ord.orderStatus}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Internal Notes */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                    Internal Concierge Notes
                  </label>
                  <button
                    onClick={handleSaveNotes}
                    className="text-xs text-[#cfa851] hover:underline flex items-center gap-1 font-semibold"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Note</span>
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={internalNote}
                  onChange={(e) => setInternalNote(e.target.value)}
                  placeholder="Record customer preferences (e.g. loves oat milk, allergy notes, corporate orders)..."
                  className="w-full p-2.5 bg-[#180f0b] border border-[#352116] rounded-xl text-xs text-zinc-200 focus:border-[#cfa851] focus:outline-none"
                />
              </div>
            </div>
          ) : (
            <div className="py-16 text-center text-zinc-500 text-xs">
              Select a customer to inspect CRM dossier.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
