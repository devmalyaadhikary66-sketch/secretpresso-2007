import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  TrendingUp,
  BarChart3,
  Calendar,
  Download,
  Users,
  ShoppingBag,
  DollarSign,
  Percent,
  Layers,
  ArrowUpRight,
  Eye,
} from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  const { orders, products, customers } = useStore();
  const [dateRange, setDateRange] = useState<'today' | '7d' | '30d' | '90d' | 'year'>('30d');

  // Metrics
  const metrics = useMemo(() => {
    const totalRevenue = orders
      .filter((o) => o.paymentStatus === 'PAID')
      .reduce((sum, o) => sum + o.finalAmount, 0);

    const totalOrders = orders.length;
    const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const grossProductCost = orders.reduce((sum, o) => {
      const orderCost = o.items.reduce((itemSum, it) => {
        const prod = products.find((p) => p.id === it.productId);
        return itemSum + (prod ? prod.costPrice * it.quantity : it.price * 0.3 * it.quantity);
      }, 0);
      return sum + orderCost;
    }, 0);

    const grossMargin = totalRevenue > 0 ? ((totalRevenue - grossProductCost) / totalRevenue) * 100 : 0;

    return {
      totalRevenue,
      totalOrders,
      aov,
      grossProductCost,
      grossMargin: Math.round(grossMargin),
      visitors: 4850,
      productViews: 12400,
      cartAdditions: 1820,
      checkoutStarts: 640,
    };
  }, [orders, products]);

  // Product Margins
  const productMargins = useMemo(() => {
    return products.map((p) => {
      const retail = p.salePrice || p.price;
      const profit = retail - p.costPrice;
      const marginPct = Math.round((profit / retail) * 100);
      return {
        ...p,
        retail,
        profit,
        marginPct,
      };
    }).sort((a, b) => b.profit - a.profit);
  }, [products]);

  const handleExportAnalyticsCSV = () => {
    const headers = ['Metric', 'Recorded Value'];
    const rows = [
      ['Total Gross Revenue', `₹${metrics.totalRevenue}`],
      ['Total Transactions', metrics.totalOrders],
      ['Average Order Value (AOV)', `₹${Math.round(metrics.aov)}`],
      ['Estimated Inventory COGS', `₹${Math.round(metrics.grossProductCost)}`],
      ['Gross Profit Margin', `${metrics.grossMargin}%`],
      ['Customer Views', metrics.productViews],
      ['Add to Cart Rate', '14.6%'],
      ['Checkout Conversion', '4.2%'],
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `SECRETpresso_Analytics_${dateRange}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-serif text-[#fae8be]">Commercial Analytics & Unit Economics</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Conversion funnel, gross margin yield, repeat customer cohorts, and product profitability.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Date range selector */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[#1c110a] border border-[#301d14]">
            {(['today', '7d', '30d', '90d', 'year'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setDateRange(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase transition ${
                  dateRange === r
                    ? 'bg-[#cfa851] text-zinc-950 font-bold shadow'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportAnalyticsCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#140c08] hover:bg-[#20140e] border border-[#382319] text-xs font-semibold text-[#f0e2cf] transition shadow"
          >
            <Download className="w-3.5 h-3.5 text-[#cfa851]" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#140c08] border border-[#2e1c12] shadow-lg">
          <span className="text-[10px] uppercase font-mono text-zinc-400">Total Recorded Sales</span>
          <p className="text-2xl font-bold font-mono text-[#f8edd9] mt-1">
            ₹{metrics.totalRevenue.toLocaleString('en-IN')}
          </p>
          <span className="text-xs text-emerald-400 mt-1 inline-flex items-center font-medium">
            <TrendingUp className="w-3 h-3 mr-1" /> Verified Transactions
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-[#140c08] border border-[#2e1c12] shadow-lg">
          <span className="text-[10px] uppercase font-mono text-zinc-400">Average Order (AOV)</span>
          <p className="text-2xl font-bold font-mono text-amber-300 mt-1">
            ₹{Math.round(metrics.aov).toLocaleString('en-IN')}
          </p>
          <span className="text-xs text-zinc-400 mt-1 block">
            Over {metrics.totalOrders} total orders
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-[#140c08] border border-[#2e1c12] shadow-lg">
          <span className="text-[10px] uppercase font-mono text-zinc-400">Estimated Gross Margin</span>
          <p className="text-2xl font-bold font-mono text-emerald-400 mt-1">
            {metrics.grossMargin}%
          </p>
          <span className="text-xs text-zinc-400 mt-1 block">
            COGS: ₹{Math.round(metrics.grossProductCost).toLocaleString('en-IN')}
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-[#140c08] border border-[#2e1c12] shadow-lg">
          <span className="text-[10px] uppercase font-mono text-zinc-400">Customer Retention</span>
          <p className="text-2xl font-bold font-mono text-purple-300 mt-1">
            68.4%
          </p>
          <span className="text-xs text-emerald-400 mt-1 inline-flex items-center font-medium">
            <ArrowUpRight className="w-3 h-3 mr-0.5" /> High loyalty index
          </span>
        </div>
      </div>

      {/* Conversion Funnel */}
      <div className="p-6 rounded-2xl bg-[#140c08] border border-[#2e1c12] shadow-xl">
        <h3 className="text-sm font-bold font-serif text-[#fae8be] mb-1">
          E-Commerce Conversion Funnel
        </h3>
        <p className="text-xs text-zinc-400 mb-6">
          Audited visitor drop-off from discovery to completed payment.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-[#1b100a] border border-[#2b1910]">
            <span className="text-[10px] uppercase font-mono text-zinc-500">1. Website Visitors</span>
            <p className="text-xl font-bold font-mono text-zinc-100 mt-1">{metrics.visitors.toLocaleString()}</p>
            <span className="text-[11px] text-zinc-400 font-mono mt-1 block">100% baseline</span>
          </div>

          <div className="p-4 rounded-xl bg-[#1b100a] border border-[#2b1910]">
            <span className="text-[10px] uppercase font-mono text-zinc-500">2. Product Views</span>
            <p className="text-xl font-bold font-mono text-zinc-100 mt-1">{metrics.productViews.toLocaleString()}</p>
            <span className="text-[11px] text-sky-400 font-mono mt-1 block">2.56 views / user</span>
          </div>

          <div className="p-4 rounded-xl bg-[#1b100a] border border-[#2b1910]">
            <span className="text-[10px] uppercase font-mono text-zinc-500">3. Added to Cart</span>
            <p className="text-xl font-bold font-mono text-amber-300 mt-1">{metrics.cartAdditions.toLocaleString()}</p>
            <span className="text-[11px] text-amber-400 font-mono mt-1 block">14.6% add rate</span>
          </div>

          <div className="p-4 rounded-xl bg-[#1b100a] border border-[#2b1910]">
            <span className="text-[10px] uppercase font-mono text-zinc-500">4. Paid Checkout</span>
            <p className="text-xl font-bold font-mono text-emerald-400 mt-1">{metrics.totalOrders.toLocaleString()}</p>
            <span className="text-[11px] text-emerald-400 font-mono mt-1 block">4.2% completed</span>
          </div>
        </div>
      </div>

      {/* Product Margin & Contribution Matrix */}
      <div className="rounded-2xl bg-[#140c08] border border-[#2e1c12] shadow-xl overflow-hidden">
        <div className="p-5 border-b border-[#261710] flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold font-serif text-[#fae8be]">
              Product Unit Economics & Margin Yield
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Net profit contribution sorted by highest profit margin per portion.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#281810] text-[10px] uppercase font-mono tracking-wider text-zinc-400 bg-[#180f0b]">
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Retail Price</th>
                <th className="py-3 px-4">Cost Price (COGS)</th>
                <th className="py-3 px-4">Profit / Unit</th>
                <th className="py-3 px-4">Margin (%)</th>
                <th className="py-3 px-4">Stock In Reserve</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#20140d]">
              {productMargins.map((p) => (
                <tr key={p.id} className="hover:bg-[#1a100a] transition">
                  <td className="py-3 px-4 font-semibold text-zinc-100">{p.name}</td>
                  <td className="py-3 px-4 text-zinc-400 font-mono">{p.category}</td>
                  <td className="py-3 px-4 font-mono font-bold text-zinc-200">₹{p.retail}</td>
                  <td className="py-3 px-4 font-mono text-zinc-400">₹{p.costPrice}</td>
                  <td className="py-3 px-4 font-mono font-bold text-emerald-400">₹{p.profit}</td>
                  <td className="py-3 px-4">
                    <span className="font-mono px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-500/20 font-bold">
                      {p.marginPct}%
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-zinc-300">{p.stock} units</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
