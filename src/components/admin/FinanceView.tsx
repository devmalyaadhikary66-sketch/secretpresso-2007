import React, { useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { DollarSign, TrendingUp, TrendingDown, Receipt, Percent, FileText } from 'lucide-react';

export const FinanceView: React.FC = () => {
  const { orders, products } = useStore();

  const finance = useMemo(() => {
    let grossSales = 0;
    let discounts = 0;
    let taxes = 0;
    let deliveryFees = 0;
    let refunds = 0;

    orders.forEach((o) => {
      if (o.paymentStatus === 'PAID') {
        grossSales += o.subtotal;
        discounts += o.discount;
        taxes += o.taxes;
        deliveryFees += o.deliveryFee;
      } else if (o.paymentStatus === 'REFUNDED') {
        refunds += o.finalAmount;
      }
    });

    const netSales = grossSales - discounts + deliveryFees;
    const estimatedCOGS = orders
      .filter((o) => o.paymentStatus === 'PAID')
      .reduce((sum, o) => {
        return (
          sum +
          o.items.reduce((acc, it) => {
            const p = products.find((prod) => prod.id === it.productId);
            return acc + (p ? p.costPrice * it.quantity : it.price * 0.3 * it.quantity);
          }, 0)
        );
      }, 0);

    const estimatedNetProfit = netSales - estimatedCOGS;

    return {
      grossSales,
      discounts,
      taxes,
      deliveryFees,
      refunds,
      netSales,
      estimatedCOGS,
      estimatedNetProfit,
    };
  }, [orders, products]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold font-serif text-[#fae8be]">Financial Ledger & Profitability Statement</h2>
        <p className="text-xs text-zinc-400 mt-0.5">
          Audited gross revenue, customer discounts, GST collections, and net roastery yield.
        </p>
      </div>

      {/* Top Ledger Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#140c08] border border-[#2e1c12] shadow-lg">
          <span className="text-[10px] uppercase font-mono text-zinc-400">Gross Sales</span>
          <p className="text-2xl font-bold font-mono text-zinc-100 mt-1">
            ₹{finance.grossSales.toLocaleString('en-IN')}
          </p>
          <span className="text-xs text-zinc-500 mt-1 block">Before promotions & taxes</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#140c08] border border-[#2e1c12] shadow-lg">
          <span className="text-[10px] uppercase font-mono text-zinc-400">Discounts Absorbed</span>
          <p className="text-2xl font-bold font-mono text-amber-400 mt-1">
            -₹{finance.discounts.toLocaleString('en-IN')}
          </p>
          <span className="text-xs text-zinc-500 mt-1 block">Promotional codes redeemed</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#140c08] border border-[#2e1c12] shadow-lg">
          <span className="text-[10px] uppercase font-mono text-zinc-400">Net Sales Volume</span>
          <p className="text-2xl font-bold font-mono text-[#fae8be] mt-1">
            ₹{finance.netSales.toLocaleString('en-IN')}
          </p>
          <span className="text-xs text-emerald-400 mt-1 block">Realized commercial cashflow</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#140c08] border border-[#2e1c12] shadow-lg">
          <span className="text-[10px] uppercase font-mono text-zinc-400">Estimated Net Profit</span>
          <p className="text-2xl font-bold font-mono text-emerald-400 mt-1">
            ₹{Math.max(0, finance.estimatedNetProfit).toLocaleString('en-IN')}
          </p>
          <span className="text-xs text-zinc-400 mt-1 block">After deducting ingredient COGS</span>
        </div>
      </div>

      {/* Breakdown Balance Sheet */}
      <div className="p-6 rounded-2xl bg-[#140c08] border border-[#2e1c12] shadow-xl space-y-4">
        <h3 className="text-sm font-bold font-serif text-[#fae8be]">
          Consolidated Operational Accounting Table
        </h3>

        <div className="divide-y divide-[#261710] text-xs">
          <div className="py-2.5 flex justify-between text-zinc-300">
            <span>Gross Beverage & Confectionery Sales:</span>
            <span className="font-mono font-bold text-zinc-100">₹{finance.grossSales.toFixed(2)}</span>
          </div>

          <div className="py-2.5 flex justify-between text-amber-300">
            <span>Less: Promotional Coupons & Discounts:</span>
            <span className="font-mono font-bold">-₹{finance.discounts.toFixed(2)}</span>
          </div>

          <div className="py-2.5 flex justify-between text-zinc-300">
            <span>Plus: Delivery Fee Collections:</span>
            <span className="font-mono font-bold">₹{finance.deliveryFees.toFixed(2)}</span>
          </div>

          <div className="py-2.5 flex justify-between text-zinc-300">
            <span>GST Output Tax Reserve (5% Collected):</span>
            <span className="font-mono font-bold text-[#cfa851]">₹{finance.taxes.toFixed(2)}</span>
          </div>

          <div className="py-2.5 flex justify-between text-red-400">
            <span>Less: Processed Customer Refunds:</span>
            <span className="font-mono font-bold">-₹{finance.refunds.toFixed(2)}</span>
          </div>

          <div className="py-2.5 flex justify-between text-zinc-400">
            <span>Estimated Cost of Goods Sold (Green beans, dairy, packaging):</span>
            <span className="font-mono font-bold text-zinc-300">-₹{finance.estimatedCOGS.toFixed(2)}</span>
          </div>

          <div className="py-3 flex justify-between text-sm font-bold text-[#fae8be] border-t-2 border-[#382319]">
            <span>Net Operating Margin (EBITDA Estimate):</span>
            <span className="font-mono text-base text-emerald-400">
              ₹{Math.max(0, finance.estimatedNetProfit).toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
