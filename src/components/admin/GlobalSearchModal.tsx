import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { Search, X, Package, ShoppingBag, Box, Users, Tag, ArrowRight } from 'lucide-react';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (module: string, itemId?: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const { products, orders, inventory, customers, coupons } = useStore();
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return { products: [], orders: [], inventory: [], customers: [], coupons: [] };

    return {
      products: products
        .filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
        .slice(0, 4),
      orders: orders
        .filter(
          (o) =>
            o.orderNumber.toLowerCase().includes(q) ||
            o.customerName.toLowerCase().includes(q) ||
            o.customerPhone.includes(q)
        )
        .slice(0, 4),
      inventory: inventory
        .filter((i) => i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q))
        .slice(0, 4),
      customers: customers
        .filter((c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.phone.includes(q))
        .slice(0, 4),
      coupons: coupons
        .filter((cp) => cp.code.toLowerCase().includes(q))
        .slice(0, 3),
    };
  }, [query, products, orders, inventory, customers, coupons]);

  const hasResults =
    results.products.length > 0 ||
    results.orders.length > 0 ||
    results.inventory.length > 0 ||
    results.customers.length > 0 ||
    results.coupons.length > 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#120b08] border border-[#382319] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Header */}
        <div className="flex items-center px-4 py-3.5 border-b border-[#281810]">
          <Search className="w-5 h-5 text-[#cfa851] shrink-0 mr-3" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search orders, SKU, products, raw inventory, customers, coupons..."
            className="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-zinc-400 hover:text-zinc-200 mr-2"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-xs px-2.5 py-1 bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-lg"
          >
            ESC
          </button>
        </div>

        {/* Results Area */}
        <div className="p-4 overflow-y-auto space-y-5 flex-1">
          {!query && (
            <div className="py-8 text-center text-zinc-500 text-xs">
              Type to instantly query across all SECRETpresso operational records
            </div>
          )}

          {query && !hasResults && (
            <div className="py-8 text-center text-zinc-400 text-xs">
              No matching records found for "{query}"
            </div>
          )}

          {/* Orders */}
          {results.orders.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#cfa851] mb-2">
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Orders ({results.orders.length})</span>
              </div>
              <div className="space-y-1.5">
                {results.orders.map((ord) => (
                  <div
                    key={ord.id}
                    onClick={() => {
                      onNavigate('orders', ord.id);
                      onClose();
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#1a100a] hover:bg-[#261710] border border-[#2b1910] cursor-pointer transition"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#f5ebd9]">#{ord.orderNumber}</span>
                        <span className="text-xs text-zinc-400 font-sans">• {ord.customerName}</span>
                      </div>
                      <p className="text-[11px] text-zinc-500 mt-0.5">
                        {ord.items.length} items • ₹{ord.finalAmount} • Status: {ord.orderStatus}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-zinc-500" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Products */}
          {results.products.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#cfa851] mb-2">
                <Package className="w-3.5 h-3.5" />
                <span>Products ({results.products.length})</span>
              </div>
              <div className="space-y-1.5">
                {results.products.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      onNavigate('products', p.id);
                      onClose();
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#1a100a] hover:bg-[#261710] border border-[#2b1910] cursor-pointer transition"
                  >
                    <div className="flex items-center gap-3">
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt="" className="w-9 h-9 rounded-lg object-cover" />
                      ) : null}
                      <div>
                        <p className="text-xs font-semibold text-zinc-200">{p.name}</p>
                        <p className="text-[11px] text-zinc-500">
                          SKU: {p.sku} • ₹{p.salePrice || p.price} • Stock: {p.stock}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-zinc-500" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Raw Inventory */}
          {results.inventory.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#cfa851] mb-2">
                <Box className="w-3.5 h-3.5" />
                <span>Raw Inventory ({results.inventory.length})</span>
              </div>
              <div className="space-y-1.5">
                {results.inventory.map((inv) => (
                  <div
                    key={inv.id}
                    onClick={() => {
                      onNavigate('inventory', inv.id);
                      onClose();
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#1a100a] hover:bg-[#261710] border border-[#2b1910] cursor-pointer transition"
                  >
                    <div>
                      <p className="text-xs font-semibold text-zinc-200">{inv.name}</p>
                      <p className="text-[11px] text-zinc-500">
                        {inv.currentStock} {inv.unit} • {inv.category} • Supplier: {inv.supplierName}
                      </p>
                    </div>
                    <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-full ${inv.status === 'LOW_STOCK' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                      {inv.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Customers */}
          {results.customers.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#cfa851] mb-2">
                <Users className="w-3.5 h-3.5" />
                <span>Customers ({results.customers.length})</span>
              </div>
              <div className="space-y-1.5">
                {results.customers.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      onNavigate('customers', c.id);
                      onClose();
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#1a100a] hover:bg-[#261710] border border-[#2b1910] cursor-pointer transition"
                  >
                    <div>
                      <p className="text-xs font-semibold text-zinc-200">{c.name}</p>
                      <p className="text-[11px] text-zinc-500">
                        {c.email} • {c.totalOrders} Orders (₹{c.totalSpent})
                      </p>
                    </div>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#cfa851]/10 text-[#cfa851] border border-[#cfa851]/20">
                      {c.segment}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Coupons */}
          {results.coupons.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#cfa851] mb-2">
                <Tag className="w-3.5 h-3.5" />
                <span>Promotional Coupons ({results.coupons.length})</span>
              </div>
              <div className="space-y-1.5">
                {results.coupons.map((cp) => (
                  <div
                    key={cp.id}
                    onClick={() => {
                      onNavigate('coupons', cp.id);
                      onClose();
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#1a100a] hover:bg-[#261710] border border-[#2b1910] cursor-pointer transition"
                  >
                    <div>
                      <p className="text-xs font-mono font-bold text-[#e6ca85]">{cp.code}</p>
                      <p className="text-[11px] text-zinc-500">
                        {cp.discountType}: {cp.discountValue} • Min order: ₹{cp.minimumOrder}
                      </p>
                    </div>
                    <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-full ${cp.isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-zinc-800 text-zinc-400'}`}>
                      {cp.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
