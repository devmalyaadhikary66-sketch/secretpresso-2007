import React from 'react';
import { Order } from '../../types';
import { X, Printer, Download, Coffee, CheckCircle2 } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

interface InvoiceModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ order, isOpen, onClose }) => {
  const { storeSettings } = useStore();

  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#120b08] border border-[#3d271c] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-zinc-100">
        {/* Actions Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2d1b12] bg-[#180f0b]">
          <div className="flex items-center gap-2">
            <Coffee className="w-5 h-5 text-[#cfa851]" />
            <span className="text-sm font-bold font-serif text-[#f2e2be]">
              Commercial Tax Invoice • #{order.orderNumber}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#cfa851] text-zinc-950 rounded-lg text-xs font-semibold hover:bg-[#dbb660] transition shadow"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Invoice</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 text-zinc-200 rounded-lg text-xs hover:bg-zinc-700 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-100 rounded-lg hover:bg-white/5"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Paper Container */}
        <div className="p-8 overflow-y-auto bg-white text-zinc-900 print:p-0 print:m-0" id="printable-invoice">
          {/* Brand Header */}
          <div className="flex items-start justify-between pb-6 border-b border-zinc-200">
            <div>
              <h1 className="text-2xl font-black font-serif tracking-wider text-zinc-900">
                SECRETPRESSO
              </h1>
              <p className="text-xs text-zinc-600 font-sans mt-0.5">
                Haute Specialty Coffee & Artisanal Tiramisu
              </p>
              <p className="text-[11px] text-zinc-500 mt-1 max-w-xs leading-relaxed">
                {storeSettings.businessAddress}
                <br />
                GSTIN: {storeSettings.gstNumber} • Phone: {storeSettings.businessPhone}
              </p>
            </div>

            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-amber-50 border border-amber-200 text-amber-900 rounded font-mono text-xs font-bold uppercase tracking-wider">
                TAX INVOICE
              </span>
              <p className="text-xs font-mono font-bold text-zinc-800 mt-2">
                INV-{order.orderNumber}
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">
                Date: {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
              <p className="text-xs text-zinc-500">
                Time: {new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>

          {/* Customer & Delivery Meta */}
          <div className="grid grid-cols-2 gap-6 py-5 border-b border-zinc-200 text-xs">
            <div>
              <p className="font-bold text-zinc-400 uppercase tracking-wider text-[10px]">
                Billed / Delivered To
              </p>
              <p className="font-bold text-zinc-900 text-sm mt-1">{order.customerName}</p>
              <p className="text-zinc-600 mt-0.5 leading-relaxed">
                {order.customerAddress}
                <br />
                Pincode: {order.pincode}
              </p>
              <p className="text-zinc-600 mt-1">
                Phone: {order.customerPhone} • Email: {order.customerEmail}
              </p>
            </div>

            <div className="text-right">
              <p className="font-bold text-zinc-400 uppercase tracking-wider text-[10px]">
                Fulfillment & Payment
              </p>
              <div className="mt-1 space-y-0.5">
                <p className="text-zinc-700">
                  <span className="font-semibold">Payment:</span> {order.paymentMethod} ({order.paymentStatus})
                </p>
                <p className="text-zinc-700">
                  <span className="font-semibold">Order Status:</span> {order.orderStatus}
                </p>
                {order.deliveryPartnerName && (
                  <p className="text-zinc-700">
                    <span className="font-semibold">Courier / Partner:</span> {order.deliveryPartnerName}
                  </p>
                )}
                {order.notes && (
                  <p className="text-zinc-500 italic mt-1">
                    Special notes: "{order.notes}"
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="py-4">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b-2 border-zinc-200 text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-2">Item & Customization</th>
                  <th className="py-2 text-right">Price</th>
                  <th className="py-2 text-center">Qty</th>
                  <th className="py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {order.items.map((item) => (
                  <tr key={item.id} className="py-2.5">
                    <td className="py-2.5 pr-4">
                      <p className="font-semibold text-zinc-900">{item.productName}</p>
                      {item.customization && (
                        <p className="text-[11px] text-zinc-500 mt-0.5">
                          {[
                            item.customization.milk ? `${item.customization.milk} Milk` : null,
                            item.customization.sweetness,
                            item.customization.temperature,
                            item.customization.extraShots ? `+${item.customization.extraShots} Espresso Shot` : null,
                            item.customization.specialInstructions,
                          ]
                            .filter(Boolean)
                            .join(' • ')}
                        </p>
                      )}
                    </td>
                    <td className="py-2.5 text-right font-mono">₹{item.price.toFixed(2)}</td>
                    <td className="py-2.5 text-center font-mono font-semibold">{item.quantity}</td>
                    <td className="py-2.5 text-right font-mono font-bold">₹{item.subtotal.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Subtotals & Taxes */}
          <div className="pt-4 border-t-2 border-zinc-200 flex justify-end">
            <div className="w-64 space-y-1.5 text-xs text-zinc-700">
              <div className="flex justify-between">
                <span>Items Subtotal:</span>
                <span className="font-mono">₹{order.subtotal.toFixed(2)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount ({order.couponCode || 'Applied'}):</span>
                  <span className="font-mono">-₹{order.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Delivery Charge:</span>
                <span className="font-mono">
                  {order.deliveryFee === 0 ? 'FREE' : `₹${order.deliveryFee.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span>GST (Goods & Services Tax):</span>
                <span className="font-mono">₹{order.taxes.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-zinc-300 font-bold text-zinc-950 text-sm">
                <span>Total Amount Paid:</span>
                <span className="font-mono text-base">₹{order.finalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="mt-8 pt-4 border-t border-zinc-200 text-center text-[11px] text-zinc-500 flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Thank you for indulging in SECRETpresso. Crafted with passion, roasted to perfection.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
