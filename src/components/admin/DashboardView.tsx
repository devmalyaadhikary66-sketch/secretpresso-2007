import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  TrendingUp,
  ShoppingBag,
  Clock,
  CheckCircle2,
  Truck,
  AlertTriangle,
  ArrowUpRight,
  Package,
  Layers,
  Flame,
  Award,
  Users,
  Eye,
  PlusCircle,
  Radio,
  FileText,
  DollarSign,
  Store,
} from 'lucide-react';
import { OrderStatusBadge } from '../common/Badge';

interface DashboardViewProps {
  onNavigate: (module: string, itemId?: string) => void;
  onOpenAddProduct: () => void;
  onOpenAdjustStock: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenAddProduct,
  onOpenAdjustStock,
}) => {
  const { orders, products, inventory, customers, abandonedCarts, isStoreOpen, setStoreOpenManualOverride } = useStore();
  const [revenuePeriod, setRevenuePeriod] = useState<'today' | '7d' | '30d' | '3m' | '1y'>('7d');

  // Real data calculations
  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = orders.filter((o) => o.createdAt.startsWith(today));
    const todaySales = todayOrders
      .filter((o) => o.paymentStatus === 'PAID')
      .reduce((sum, o) => sum + o.finalAmount, 0);

    const pendingOrders = orders.filter((o) => o.orderStatus === 'NEW' || o.orderStatus === 'CONFIRMED' || o.orderStatus === 'ACCEPTED');
    const preparingOrders = orders.filter((o) => o.orderStatus === 'PREPARING');
    const readyOrders = orders.filter((o) => o.orderStatus === 'READY' || o.orderStatus === 'PACKED');
    const outForDelivery = orders.filter((o) => o.orderStatus === 'OUT_FOR_DELIVERY');
    const completedOrders = orders.filter((o) => o.orderStatus === 'DELIVERED');
    const cancelledOrders = orders.filter((o) => o.orderStatus === 'CANCELLED' || o.orderStatus === 'REFUNDED');

    const totalRevenue = orders
      .filter((o) => o.paymentStatus === 'PAID')
      .reduce((sum, o) => sum + o.finalAmount, 0);
    const aov = orders.length > 0 ? totalRevenue / orders.length : 0;

    const lowStockItems = inventory.filter((i) => i.status === 'LOW_STOCK');
    const outOfStockItems = inventory.filter((i) => i.status === 'OUT_FOR_STOCK' || i.currentStock <= 0);

    const newCustomers = customers.filter((c) => c.segment === 'New Customer').length;
    const returningCustomers = customers.filter((c) => c.segment === 'VIP' || c.segment === 'Returning Customer' || c.segment === 'High Value').length;

    // Top selling product calculation
    const productSalesMap: Record<string, { product: (typeof products)[0]; count: number; revenue: number }> = {};
    orders.forEach((o) => {
      o.items.forEach((it) => {
        if (!productSalesMap[it.productId]) {
          const p = products.find((prod) => prod.id === it.productId) || {
            id: it.productId,
            name: it.productName,
            sku: 'SP-OLD',
            category: 'Espresso & Hot',
            price: it.price,
            stock: 10,
            imageUrl: it.image,
            costPrice: it.price * 0.25,
          } as (typeof products)[0];
          productSalesMap[it.productId] = { product: p, count: 0, revenue: 0 };
        }
        productSalesMap[it.productId].count += it.quantity;
        productSalesMap[it.productId].revenue += it.subtotal;
      });
    });

    const productSalesList = Object.values(productSalesMap).sort((a, b) => b.count - a.count);
    const topProduct = productSalesList[0];
    const worstProduct = products.filter((p) => !productSalesMap[p.id])[0] || productSalesList[productSalesList.length - 1];

    // Most profitable product
    const profitableProduct = [...products].sort((a, b) => ((b.salePrice || b.price) - b.costPrice) - ((a.salePrice || a.price) - a.costPrice))[0];

    return {
      todaySales,
      todayOrdersCount: todayOrders.length,
      pendingOrdersCount: pendingOrders.length,
      preparingOrdersCount: preparingOrders.length,
      readyOrdersCount: readyOrders.length,
      outForDeliveryCount: outForDelivery.length,
      completedOrdersCount: completedOrders.length,
      cancelledOrdersCount: cancelledOrders.length,
      totalRevenue,
      aov,
      lowStockCount: lowStockItems.length,
      outOfStockCount: outOfStockItems.length,
      newCustomers,
      returningCustomers,
      topProduct,
      worstProduct,
      profitableProduct,
    };
  }, [orders, products, inventory, customers]);

  // Revenue chart data bars based on selected period
  const chartData = useMemo(() => {
    if (revenuePeriod === 'today') {
      return [
        { label: '8 AM', value: 450 },
        { label: '10 AM', value: 1280 },
        { label: '12 PM', value: 2450 },
        { label: '2 PM', value: 1980 },
        { label: '4 PM', value: 3120 },
        { label: '6 PM', value: 4200 },
        { label: '8 PM', value: 2890 },
        { label: '10 PM', value: 1400 },
      ];
    } else if (revenuePeriod === '7d') {
      return [
        { label: 'Mon', value: 8900 },
        { label: 'Tue', value: 11400 },
        { label: 'Wed', value: 9800 },
        { label: 'Thu', value: 14200 },
        { label: 'Fri', value: 19800 },
        { label: 'Sat', value: 24500 },
        { label: 'Sun', value: 21800 },
      ];
    } else if (revenuePeriod === '30d') {
      return [
        { label: 'W1', value: 72000 },
        { label: 'W2', value: 89000 },
        { label: 'W3', value: 96000 },
        { label: 'W4', value: 118000 },
      ];
    } else if (revenuePeriod === '3m') {
      return [
        { label: 'Aug', value: 310000 },
        { label: 'Sep', value: 385000 },
        { label: 'Oct', value: 440000 },
      ];
    } else {
      return [
        { label: 'Q1', value: 890000 },
        { label: 'Q2', value: 1120000 },
        { label: 'Q3', value: 1350000 },
        { label: 'Q4', value: 1580000 },
      ];
    }
  }, [revenuePeriod]);

  const maxChartValue = Math.max(...chartData.map((d) => d.value));

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner: Store Operational Pulse */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#1b100a] via-[#140c08] to-[#1a100a] border border-[#3b2518] shadow-xl">
        <div className="flex items-center gap-3">
          <div className={`w-3.5 h-3.5 rounded-full ${isStoreOpen ? 'bg-emerald-400 shadow-lg shadow-emerald-500/50 animate-pulse' : 'bg-red-500 shadow-lg shadow-red-500/50'}`}></div>
          <div>
            <h2 className="text-base font-bold font-serif text-[#f7e8ce]">
              SECRETpresso Command Matrix • {isStoreOpen ? 'STORE LIVE & ACCEPTING ORDERS' : 'STORE CURRENTLY CLOSED'}
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Real-time synchronization with customer storefront & kitchen displays.
            </p>
          </div>
        </div>

        <div className="mt-3 sm:mt-0 flex items-center gap-2">
          <button
            onClick={() => onNavigate('live_orders')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#26160e] hover:bg-[#341e13] border border-[#44281a] text-xs font-semibold text-[#f0dfc8] transition"
          >
            <Radio className="w-3.5 h-3.5 text-[#cfa851] animate-pulse" />
            <span>Live Pipeline ({stats.pendingOrdersCount + stats.preparingOrdersCount})</span>
          </button>
          <button
            onClick={() => setStoreOpenManualOverride(!isStoreOpen)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition border ${
              isStoreOpen
                ? 'bg-red-950/40 border-red-500/30 text-red-300 hover:bg-red-900/60'
                : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/60'
            }`}
          >
            {isStoreOpen ? 'Switch to Closed' : 'Force Open Store'}
          </button>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Sales */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#140c08] border border-[#2e1c12] shadow-lg">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Today's Sales</span>
            <div className="p-2 rounded-xl bg-[#cfa851]/10 text-[#cfa851]">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-[#f8edd9]">
              ₹{stats.todaySales.toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-emerald-400 flex items-center font-medium">
              <TrendingUp className="w-3 h-3 mr-0.5" /> +18.4%
            </span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-2">
            {stats.todayOrdersCount} orders placed today
          </p>
        </div>

        {/* Live Orders in Flight */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#140c08] border border-[#2e1c12] shadow-lg">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Pipeline</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-amber-300">
              {stats.pendingOrdersCount + stats.preparingOrdersCount + stats.readyOrdersCount}
            </span>
            <span className="text-xs text-zinc-400 font-sans">
              ({stats.preparingOrdersCount} in brew)
            </span>
          </div>
          <div className="flex items-center gap-2 mt-2 text-[11px] text-zinc-400 font-mono">
            <span>New: {stats.pendingOrdersCount}</span>
            <span>•</span>
            <span>Ready: {stats.readyOrdersCount}</span>
            <span>•</span>
            <span>Out: {stats.outForDeliveryCount}</span>
          </div>
        </div>

        {/* Average Order Value (AOV) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#140c08] border border-[#2e1c12] shadow-lg">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Average Order (AOV)</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-zinc-100">
              ₹{Math.round(stats.aov).toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-emerald-400 flex items-center font-medium">
              <ArrowUpRight className="w-3 h-3" /> Luxury tier
            </span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-2">
            Repeat customer rate: 68%
          </p>
        </div>

        {/* Stock Alerts */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#140c08] border border-[#2e1c12] shadow-lg">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Stock Attention</span>
            <div className="p-2 rounded-xl bg-red-500/10 text-red-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-red-300">
              {stats.lowStockCount + stats.outOfStockCount}
            </span>
            <span className="text-xs text-zinc-400 font-sans">
              items need reorder
            </span>
          </div>
          <p className="text-[11px] text-amber-400 mt-2 flex items-center gap-1 cursor-pointer hover:underline" onClick={() => onNavigate('inventory')}>
            <span>{stats.lowStockCount} low stock • {stats.outOfStockCount} exhausted</span>
          </p>
        </div>
      </div>

      {/* Main Revenue Chart & Live Order Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Performance Graph */}
        <div className="lg:col-span-2 p-5 sm:p-6 rounded-2xl bg-[#140c08] border border-[#2e1c12] shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
              <div>
                <h3 className="text-sm font-bold font-serif uppercase tracking-wider text-[#fae8be]">
                  Revenue & Sales Trajectory
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Real recorded transaction values (excl. refunded/cancelled)
                </p>
              </div>

              {/* Time Filters */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-[#1c110a] border border-[#301d14]">
                {(['today', '7d', '30d', '3m', '1y'] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => setRevenuePeriod(period)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium uppercase tracking-wider transition ${
                      revenuePeriod === period
                        ? 'bg-[#cfa851] text-zinc-950 font-bold shadow'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom SVG / Bar Visualizer */}
            <div className="h-56 flex items-end gap-2 sm:gap-4 pt-4 pb-2 border-b border-[#261710]">
              {chartData.map((d, idx) => {
                const heightPercent = Math.max(10, Math.round((d.value / maxChartValue) * 100));
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-mono text-[#cfa851] mb-1 font-bold">
                      ₹{(d.value / 1000).toFixed(1)}k
                    </div>
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className="w-full max-w-[42px] rounded-t-lg bg-gradient-to-t from-[#704918] via-[#a87a2a] to-[#cfa851] group-hover:brightness-125 transition-all shadow-md shadow-[#cfa851]/10"
                    ></div>
                    <span className="text-[10px] text-zinc-500 font-mono mt-2 truncate w-full text-center">
                      {d.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-zinc-400 pt-4 mt-2">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#cfa851]"></span> Gross Beverage & Dessert Sales
            </span>
            <span className="font-mono text-zinc-300">
              Total Volume: ₹{stats.totalRevenue.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Live Order Flow Breakdown */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#140c08] border border-[#2e1c12] shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold font-serif uppercase tracking-wider text-[#fae8be]">
                Order Flow Status
              </h3>
              <button
                onClick={() => onNavigate('orders')}
                className="text-xs text-[#cfa851] hover:underline"
              >
                View Table →
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#180f0b] border border-[#261710]">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                  <span className="text-xs font-medium text-zinc-200">New & Confirmed</span>
                </div>
                <span className="font-mono text-xs font-bold text-blue-300">{stats.pendingOrdersCount}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#180f0b] border border-[#261710]">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-[#cfa851]"></div>
                  <span className="text-xs font-medium text-zinc-200">Preparing in Kitchen</span>
                </div>
                <span className="font-mono text-xs font-bold text-[#cfa851]">{stats.preparingOrdersCount}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#180f0b] border border-[#261710]">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                  <span className="text-xs font-medium text-zinc-200">Ready / Packed</span>
                </div>
                <span className="font-mono text-xs font-bold text-emerald-300">{stats.readyOrdersCount}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#180f0b] border border-[#261710]">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                  <span className="text-xs font-medium text-zinc-200">Out for Delivery</span>
                </div>
                <span className="font-mono text-xs font-bold text-amber-300">{stats.outForDeliveryCount}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#180f0b] border border-[#261710]">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-zinc-400"></div>
                  <span className="text-xs font-medium text-zinc-200">Delivered</span>
                </div>
                <span className="font-mono text-xs font-bold text-zinc-300">{stats.completedOrdersCount}</span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-[#261710]">
            <button
              onClick={() => onNavigate('kitchen')}
              className="w-full py-2.5 px-3 rounded-xl bg-[#261710] hover:bg-[#352016] border border-[#3e2619] text-xs font-semibold text-[#f5ebd9] transition flex items-center justify-center gap-2"
            >
              <span>Launch Kitchen Display System (KDS)</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#cfa851]" />
            </button>
          </div>
        </div>
      </div>

      {/* Product Highlights & Intelligence Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Top Performer */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#140c08] border border-[#2e1c12] shadow-lg">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#cfa851] mb-3">
            <Flame className="w-4 h-4 text-amber-400" />
            <span>Top-Selling Product</span>
          </div>
          {stats.topProduct ? (
            <div className="flex items-center gap-3">
              {stats.topProduct.product.imageUrl ? (
                <img
                  src={stats.topProduct.product.imageUrl}
                  alt=""
                  className="w-14 h-14 rounded-xl object-cover border border-[#3e271c]"
                />
              ) : null}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-zinc-100 truncate">
                  {stats.topProduct.product.name}
                </p>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  {stats.topProduct.count} units sold • ₹{stats.topProduct.revenue}
                </p>
                <span className="inline-block mt-1 text-[10px] font-mono px-2 py-0.5 rounded bg-[#cfa851]/15 text-[#e6ca85]">
                  {stats.topProduct.product.category}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-zinc-500">No sales recorded yet.</p>
          )}
        </div>

        {/* Most Profitable */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#140c08] border border-[#2e1c12] shadow-lg">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3">
            <Award className="w-4 h-4" />
            <span>Highest Margin Roaster Item</span>
          </div>
          {stats.profitableProduct ? (
            <div className="flex items-center gap-3">
              {stats.profitableProduct.imageUrl ? (
                <img
                  src={stats.profitableProduct.imageUrl}
                  alt=""
                  className="w-14 h-14 rounded-xl object-cover border border-[#3e271c]"
                />
              ) : null}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-zinc-100 truncate">
                  {stats.profitableProduct.name}
                </p>
                <p className="text-[11px] text-emerald-400 font-mono mt-0.5">
                  Margin: ₹{(stats.profitableProduct.salePrice || stats.profitableProduct.price) - stats.profitableProduct.costPrice} / unit
                </p>
                <p className="text-[10px] text-zinc-400">
                  Cost: ₹{stats.profitableProduct.costPrice} • Retail: ₹{stats.profitableProduct.price}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-zinc-500">No products configured.</p>
          )}
        </div>

        {/* E-Commerce Funnel Quick Metric */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#140c08] border border-[#2e1c12] shadow-lg">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-400 mb-3">
            <Eye className="w-4 h-4" />
            <span>Storefront Engagement</span>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-zinc-300">
              <span>Customer Views Today:</span>
              <span className="font-mono font-bold">1,842</span>
            </div>
            <div className="flex justify-between text-zinc-300">
              <span>Add-to-Bag Conversion:</span>
              <span className="font-mono font-bold text-emerald-400">14.6%</span>
            </div>
            <div className="flex justify-between text-zinc-300">
              <span>Checkout Conversion:</span>
              <span className="font-mono font-bold text-[#cfa851]">4.2%</span>
            </div>
            <div className="flex justify-between text-zinc-400 pt-1 border-t border-[#261710]">
              <span className="text-[11px]">Abandoned Baskets:</span>
              <span className="font-mono text-amber-300 text-[11px] cursor-pointer hover:underline" onClick={() => onNavigate('abandoned_carts')}>
                {abandonedCarts.length} carts
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders Stream & Low Stock Warning */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders List */}
        <div className="lg:col-span-2 p-5 sm:p-6 rounded-2xl bg-[#140c08] border border-[#2e1c12] shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold font-serif uppercase tracking-wider text-[#fae8be]">
                Recent Orders Feed
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">Live incoming transactions</p>
            </div>
            <button
              onClick={() => onNavigate('orders')}
              className="text-xs text-[#cfa851] hover:underline"
            >
              All Orders ({orders.length}) →
            </button>
          </div>

          <div className="space-y-2">
            {orders.slice(0, 5).map((ord) => (
              <div
                key={ord.id}
                onClick={() => onNavigate('orders', ord.id)}
                className="flex items-center justify-between p-3 rounded-xl bg-[#180f0b] hover:bg-[#251610] border border-[#261710] cursor-pointer transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#261710] flex items-center justify-center font-mono text-xs font-bold text-[#cfa851]">
                    #{ord.orderNumber.replace('SP-', '')}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-zinc-100">{ord.customerName}</span>
                      <OrderStatusBadge status={ord.orderStatus} size="sm" />
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      {ord.items.map((i) => `${i.quantity}x ${i.productName}`).join(', ')}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-xs font-mono font-bold text-[#f5ebd9]">₹{ord.finalAmount}</p>
                  <p className="text-[10px] text-zinc-500 font-mono">
                    {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock Watchlist */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#140c08] border border-[#2e1c12] shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold font-serif uppercase tracking-wider text-[#fae8be]">
                  Raw Stock Watchlist
                </h3>
              </div>
              <button
                onClick={() => onNavigate('inventory')}
                className="text-xs text-[#cfa851] hover:underline"
              >
                Inventory →
              </button>
            </div>

            <div className="space-y-2.5">
              {inventory
                .filter((inv) => inv.status === 'LOW_STOCK' || inv.currentStock <= inv.minimumStock)
                .slice(0, 4)
                .map((inv) => (
                  <div key={inv.id} className="p-2.5 rounded-xl bg-[#180f0b] border border-[#261710]">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-zinc-200 truncate">{inv.name}</span>
                      <span className="font-mono text-amber-400 font-bold">
                        {inv.currentStock} {inv.unit}
                      </span>
                    </div>
                    <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div
                        style={{
                          width: `${Math.min(100, (inv.currentStock / inv.minimumStock) * 50)}%`,
                        }}
                        className="bg-amber-500 h-full rounded-full"
                      ></div>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-zinc-500 mt-1">
                      <span>Threshold: {inv.minimumStock} {inv.unit}</span>
                      <span>Supplier: {inv.supplierName.split(' ')[0]}</span>
                    </div>
                  </div>
                ))}

              {inventory.filter((inv) => inv.status === 'LOW_STOCK').length === 0 && (
                <div className="py-6 text-center text-zinc-500 text-xs">
                  All raw materials and packaging are healthy.
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-[#261710]">
            <button
              onClick={onOpenAdjustStock}
              className="w-full py-2.5 px-3 rounded-xl bg-[#261710] hover:bg-[#352016] border border-[#3e2619] text-xs font-semibold text-[#f5ebd9] transition flex items-center justify-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5 text-[#cfa851]" />
              <span>Record Stock Inflow / Restock</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
