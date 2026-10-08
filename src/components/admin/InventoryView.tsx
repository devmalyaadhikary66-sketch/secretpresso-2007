import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { InventoryItem, StockMovement } from '../../types';
import {
  Box,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  History,
  TrendingDown,
  TrendingUp,
  Download,
  Calendar,
  X,
  Edit,
  Trash2,
} from 'lucide-react';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface InventoryViewProps {
  initialItemId?: string;
  isAdjustModalOpenInitially?: boolean;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  initialItemId,
  isAdjustModalOpenInitially = false,
}) => {
  const {
    inventory,
    stockMovements,
    adjustStock,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    suppliers,
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'items' | 'movements'>('items');

  // Adjustment Modal
  const [isAdjustOpen, setIsAdjustOpen] = useState(isAdjustModalOpenInitially);
  const [adjustTargetItem, setAdjustTargetItem] = useState<InventoryItem | null>(() => {
    return initialItemId ? inventory.find((i) => i.id === initialItemId) || inventory[0] : inventory[0] || null;
  });
  const [adjustAmount, setAdjustAmount] = useState<number>(10);
  const [adjustReason, setAdjustReason] = useState<StockMovement['reason']>('Purchase');
  const [adjustNote, setAdjustNote] = useState('');

  // Add Item Modal
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [newItemData, setNewItemData] = useState<Omit<InventoryItem, 'id'>>({
    name: '',
    sku: `RAW-${Math.floor(100 + Math.random() * 900)}`,
    category: 'Beans',
    currentStock: 25,
    reservedStock: 0,
    availableStock: 25,
    minimumStock: 10,
    unit: 'kg',
    costPerUnit: 500,
    supplierId: suppliers[0]?.id || '',
    supplierName: suppliers[0]?.company || 'Direct Supplier',
    lastRestocked: new Date().toISOString().split('T')[0],
    batchNumber: `LOT-${Math.floor(1000 + Math.random() * 9000)}`,
    status: 'IN_STOCK',
  });

  const [deleteTargetItem, setDeleteTargetItem] = useState<InventoryItem | null>(null);

  const categories = [
    'ALL',
    'Beans',
    'Dairy & Mylk',
    'Syrups',
    'Cocoa & Chocolate',
    'Bakery & Tiramisu',
    'Packaging',
    'Merch',
  ];

  const filteredItems = useMemo(() => {
    return inventory.filter((item) => {
      const matchSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.supplierName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = selectedCategory === 'ALL' || item.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [inventory, searchQuery, selectedCategory]);

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustTargetItem) return;

    // Positive if Purchase or Return, negative if Damaged/Expired/Wastage
    let delta = Number(adjustAmount);
    if (adjustReason === 'Damaged' || adjustReason === 'Expired' || adjustReason === 'Wastage') {
      delta = -Math.abs(delta);
    }

    adjustStock(adjustTargetItem.id, delta, adjustReason, adjustNote || 'Manual admin intervention');
    setIsAdjustOpen(false);
    setAdjustNote('');
  };

  const handleAddItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sup = suppliers.find((s) => s.id === newItemData.supplierId);
    const itemToAdd = {
      ...newItemData,
      currentStock: Number(newItemData.currentStock),
      availableStock: Number(newItemData.currentStock),
      minimumStock: Number(newItemData.minimumStock),
      costPerUnit: Number(newItemData.costPerUnit),
      supplierName: sup?.company || newItemData.supplierName,
      status: Number(newItemData.currentStock) <= Number(newItemData.minimumStock) ? ('LOW_STOCK' as const) : ('IN_STOCK' as const),
    };
    addInventoryItem(itemToAdd);
    setIsAddItemOpen(false);
  };

  const handleExportCSV = () => {
    const headers = ['SKU', 'Item Name', 'Category', 'Current Stock', 'Unit', 'Min Stock', 'Cost/Unit', 'Status', 'Supplier'];
    const rows = inventory.map((i) => [
      i.sku,
      `"${i.name}"`,
      i.category,
      i.currentStock,
      i.unit,
      i.minimumStock,
      i.costPerUnit,
      i.status,
      `"${i.supplierName}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `SECRETpresso_Inventory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-serif text-[#fae8be]">Raw Material & Supply Inventory</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Real-time track of green beans, Italian mascarpone, specialty syrups, and packaging stock.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1a110a] hover:bg-[#251710] border border-[#382319] text-xs font-semibold text-[#f0e2cf] transition"
          >
            <Download className="w-3.5 h-3.5 text-[#cfa851]" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setIsAddItemOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#fae8be] via-[#cfa851] to-[#b3883b] text-zinc-950 text-xs font-bold transition shadow-lg shadow-[#cfa851]/20 hover:brightness-110"
          >
            <Plus className="w-4 h-4" />
            <span>Add Raw Material</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#281810] pb-2">
        <button
          onClick={() => setActiveTab('items')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'items'
              ? 'bg-[#cfa851] text-zinc-950 font-bold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Box className="w-4 h-4" />
          <span>Active Stock Batches ({inventory.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('movements')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'movements'
              ? 'bg-[#cfa851] text-zinc-950 font-bold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Stock Movement Audit Logs ({stockMovements.length})</span>
        </button>
      </div>

      {activeTab === 'items' ? (
        <>
          {/* Search & Category Filter */}
          <div className="flex flex-col md:flex-row items-center gap-3 p-3.5 rounded-2xl bg-[#140c08] border border-[#2e1c12]">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search raw material name, SKU, or supplier..."
                className="w-full pl-9 pr-4 py-2 bg-[#1b100a] border border-[#382319] focus:border-[#cfa851] rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap transition ${
                    selectedCategory === cat
                      ? 'bg-[#cfa851] text-zinc-950 font-bold shadow'
                      : 'bg-[#1b100a] text-zinc-400 hover:text-zinc-200 border border-[#2c1b12]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Inventory Table */}
          <div className="rounded-2xl bg-[#140c08] border border-[#2e1c12] shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#281810] text-[10px] uppercase font-mono tracking-wider text-zinc-400 bg-[#180f0b]">
                    <th className="py-3 px-4">Item & SKU</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Current Stock</th>
                    <th className="py-3 px-4">Available / Reserved</th>
                    <th className="py-3 px-4">Threshold</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Supplier</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#20140d]">
                  {filteredItems.map((item) => {
                    const isLow = item.currentStock <= item.minimumStock;
                    const isOut = item.currentStock <= 0;

                    return (
                      <tr key={item.id} className="hover:bg-[#1a100a] transition">
                        <td className="py-3 px-4">
                          <p className="font-semibold text-zinc-100">{item.name}</p>
                          <p className="text-[10px] font-mono text-[#cfa851] mt-0.5">
                            SKU: {item.sku} • Batch: {item.batchNumber}
                          </p>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono text-zinc-300">{item.category}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-sm text-zinc-100">
                            {item.currentStock} {item.unit}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono text-zinc-400">
                            {item.availableStock} {item.unit} (Res: {item.reservedStock})
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono text-zinc-400">
                            {item.minimumStock} {item.unit}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                              isOut
                                ? 'bg-red-500/20 text-red-300'
                                : isLow
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-emerald-500/20 text-emerald-300'
                            }`}
                          >
                            {isOut ? 'OUT OF STOCK' : isLow ? 'LOW STOCK' : 'IN STOCK'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-zinc-300 truncate max-w-[140px]">{item.supplierName}</p>
                          <p className="text-[10px] text-zinc-500">Last: {item.lastRestocked}</p>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setAdjustTargetItem(item);
                                setIsAdjustOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-[#251710] hover:bg-[#341f15] text-[#fae8be] font-semibold text-[11px] border border-[#3e271c] transition"
                            >
                              Adjust / Restock
                            </button>
                            <button
                              onClick={() => setDeleteTargetItem(item)}
                              className="p-1 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-white/5 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Stock Movements Audit View */
        <div className="rounded-2xl bg-[#140c08] border border-[#2e1c12] shadow-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#261710] flex justify-between items-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Historical Stock Movement Log ({stockMovements.length} Records)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#281810] text-[10px] uppercase font-mono tracking-wider text-zinc-400 bg-[#180f0b]">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Material / Item</th>
                  <th className="py-3 px-4">Quantity Delta</th>
                  <th className="py-3 px-4">Ending Stock</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Authorized Admin</th>
                  <th className="py-3 px-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#20140d]">
                {stockMovements.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-zinc-500 text-xs">
                      No manual stock movements logged yet.
                    </td>
                  </tr>
                ) : (
                  stockMovements.map((mov) => {
                    const isPositive = mov.quantityChange > 0;
                    return (
                      <tr key={mov.id} className="hover:bg-[#1a100a] transition">
                        <td className="py-3 px-4 font-mono text-zinc-400 text-[11px]">
                          {new Date(mov.timestamp).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 font-semibold text-zinc-100">
                          {mov.itemName}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold">
                          <span
                            className={`flex items-center gap-1 ${
                              isPositive ? 'text-emerald-400' : 'text-red-400'
                            }`}
                          >
                            {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                            {isPositive ? `+${mov.quantityChange}` : mov.quantityChange}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-zinc-200">
                          {mov.resultingStock}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-[#251710] text-[#e6ca85] border border-[#3e271c]">
                            {mov.reason}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-zinc-300">
                          {mov.adminName}
                        </td>
                        <td className="py-3 px-4 text-zinc-400 text-[11px]">
                          {mov.note || '—'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Manual Stock Adjust Modal */}
      {isAdjustOpen && adjustTargetItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#120b08] border border-[#382319] w-full max-w-md rounded-2xl shadow-2xl p-6 text-zinc-100 relative">
            <button
              onClick={() => setIsAdjustOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold font-serif text-[#fae8be]">
              Adjust Stock: {adjustTargetItem.name}
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Current recorded level: <span className="font-bold text-zinc-100">{adjustTargetItem.currentStock} {adjustTargetItem.unit}</span>
            </p>

            <form onSubmit={handleAdjustSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                  Reason for Adjustment *
                </label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value as StockMovement['reason'])}
                  className="w-full px-3 py-2 bg-[#180f0b] border border-[#382319] rounded-xl text-zinc-100 focus:border-[#cfa851] focus:outline-none"
                >
                  <option value="Purchase">Purchase / Supplier Inflow (+)</option>
                  <option value="Manual adjustment">Manual Audit Correction (+/-)</option>
                  <option value="Damaged">Damaged in Transit / Kitchen (-)</option>
                  <option value="Expired">Expired Goods (-)</option>
                  <option value="Wastage">Barista Dial-in Wastage (-)</option>
                  <option value="Return">Customer Return (+)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                  Quantity ({adjustTargetItem.unit}) *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(Number(e.target.value))}
                  placeholder="e.g. 10"
                  className="w-full px-3 py-2 bg-[#180f0b] border border-[#382319] rounded-xl font-mono text-zinc-100 focus:border-[#cfa851] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                  Internal Justification / PO Reference
                </label>
                <input
                  type="text"
                  value={adjustNote}
                  onChange={(e) => setAdjustNote(e.target.value)}
                  placeholder="Invoice #982 or Morning roaster calibration..."
                  className="w-full px-3 py-2 bg-[#180f0b] border border-[#382319] rounded-xl text-zinc-100 focus:border-[#cfa851] focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdjustOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#cfa851] text-zinc-950 hover:bg-[#dbb660]"
                >
                  Confirm Movement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Raw Material Modal */}
      {isAddItemOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#120b08] border border-[#382319] w-full max-w-lg rounded-2xl shadow-2xl p-6 text-zinc-100 relative">
            <button
              onClick={() => setIsAddItemOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold font-serif text-[#fae8be]">
              Add Raw Material / Packaging Batch
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Register a new trackable material for supply chain operations.
            </p>

            <form onSubmit={handleAddItemSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                  Item Name *
                </label>
                <input
                  type="text"
                  required
                  value={newItemData.name}
                  onChange={(e) => setNewItemData({ ...newItemData, name: e.target.value })}
                  placeholder="e.g. Colombian Supremo Washed Beans"
                  className="w-full px-3 py-2 bg-[#180f0b] border border-[#382319] rounded-xl text-zinc-100 focus:border-[#cfa851] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                    SKU Identifier *
                  </label>
                  <input
                    type="text"
                    required
                    value={newItemData.sku}
                    onChange={(e) => setNewItemData({ ...newItemData, sku: e.target.value })}
                    className="w-full px-3 py-2 bg-[#180f0b] border border-[#382319] rounded-xl font-mono text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                    Category *
                  </label>
                  <select
                    value={newItemData.category}
                    onChange={(e) => setNewItemData({ ...newItemData, category: e.target.value as InventoryItem['category'] })}
                    className="w-full px-3 py-2 bg-[#180f0b] border border-[#382319] rounded-xl text-zinc-100"
                  >
                    <option value="Beans">Beans</option>
                    <option value="Dairy & Mylk">Dairy & Mylk</option>
                    <option value="Syrups">Syrups</option>
                    <option value="Cocoa & Chocolate">Cocoa & Chocolate</option>
                    <option value="Bakery & Tiramisu">Bakery & Tiramisu</option>
                    <option value="Packaging">Packaging</option>
                    <option value="Merch">Merch</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                    Initial Stock
                  </label>
                  <input
                    type="number"
                    required
                    value={newItemData.currentStock}
                    onChange={(e) => setNewItemData({ ...newItemData, currentStock: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#180f0b] border border-[#382319] rounded-xl font-mono text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                    Unit
                  </label>
                  <select
                    value={newItemData.unit}
                    onChange={(e) => setNewItemData({ ...newItemData, unit: e.target.value as InventoryItem['unit'] })}
                    className="w-full px-3 py-2 bg-[#180f0b] border border-[#382319] rounded-xl text-zinc-100"
                  >
                    <option value="kg">kg</option>
                    <option value="liters">liters</option>
                    <option value="bottles">bottles</option>
                    <option value="units">units</option>
                    <option value="boxes">boxes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                    Alert Threshold
                  </label>
                  <input
                    type="number"
                    required
                    value={newItemData.minimumStock}
                    onChange={(e) => setNewItemData({ ...newItemData, minimumStock: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#180f0b] border border-[#382319] rounded-xl font-mono text-zinc-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                    Cost per Unit (₹)
                  </label>
                  <input
                    type="number"
                    value={newItemData.costPerUnit}
                    onChange={(e) => setNewItemData({ ...newItemData, costPerUnit: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#180f0b] border border-[#382319] rounded-xl font-mono text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-zinc-400 mb-1">
                    Supplier
                  </label>
                  <select
                    value={newItemData.supplierId}
                    onChange={(e) => setNewItemData({ ...newItemData, supplierId: e.target.value })}
                    className="w-full px-3 py-2 bg-[#180f0b] border border-[#382319] rounded-xl text-zinc-100"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.company}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddItemOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#cfa851] text-zinc-950 hover:bg-[#dbb660]"
                >
                  Create Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Item Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTargetItem}
        title={`Remove Material: ${deleteTargetItem?.name}`}
        message="Are you sure you want to remove this inventory item? Historical movements will remain in the audit log."
        confirmLabel="Yes, Remove"
        isDestructive={true}
        onConfirm={() => {
          if (deleteTargetItem) {
            deleteInventoryItem(deleteTargetItem.id);
            setDeleteTargetItem(null);
          }
        }}
        onCancel={() => setDeleteTargetItem(null)}
      />
    </div>
  );
};
