import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { Order, OrderStatus } from '../../types';
import {
  Search,
  Filter,
  Printer,
  XCircle,
  RotateCcw,
  Truck,
  Eye,
  CheckCircle2,
  Clock,
  ChevronDown,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  Download,
} from 'lucide-react';
import { OrderStatusBadge } from '../common/Badge';
import { InvoiceModal } from './InvoiceModal';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface OrdersViewProps {
  initialOrderId?: string;
}

export const OrdersView: React.FC<OrdersViewProps> = ({ initialOrderId }) => {
  const { orders, updateOrderStatus, cancelOrder, refundOrder, assignDeliveryPartner, deliveryPartners } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(() => {
    return initialOrderId ? orders.find((o) => o.id === initialOrderId) || orders[0] : orders[0] || null;
  });

  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  // Dialogs
  const [cancelTargetOrder, setCancelTargetOrder] = useState<Order | null>(null);
  const [refundTargetOrder, setRefundTargetOrder] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState('Customer requested cancellation prior to brew.');
  const [refundReason, setRefundReason] = useState('Beverage dissatisfaction or delivery delay.');

  // Assign delivery partner modal
  const [showAssignPartner, setShowAssignPartner] = useState(false);
  const [selectedPartnerId, setSelectedPartnerId] = useState(deliveryPartners[0]?.id || '');

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchQuery =
        o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.customerPhone.includes(searchQuery) ||
        o.pincode.includes(searchQuery);

      const matchStatus = statusFilter === 'ALL' || o.orderStatus === statusFilter;
      return matchQuery && matchStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  // Keep selected order in sync with orders list
  const activeOrder = useMemo(() => {
    if (!selectedOrder) return null;
    return orders.find((o) => o.id === selectedOrder.id) || selectedOrder;
  }, [orders, selectedOrder]);

  const handleExportCSV = () => {
    const headers = ['Order Number', 'Date', 'Customer Name', 'Phone', 'Address', 'Status', 'Payment Method', 'Final Amount'];
    const rows = filteredOrders.map((o) => [
      o.orderNumber,
      new Date(o.createdAt).toLocaleDateString(),
      `"${o.customerName}"`,
      o.customerPhone,
      `"${o.customerAddress}"`,
      o.orderStatus,
      o.paymentMethod,
      o.finalAmount,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SECRETpresso_Orders_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAssignPartnerConfirm = () => {
    if (!activeOrder) return;
    const partner = deliveryPartners.find((p) => p.id === selectedPartnerId);
    if (partner) {
      assignDeliveryPartner(activeOrder.id, partner.name, partner.phone);
      if (activeOrder.orderStatus !== 'OUT_FOR_DELIVERY') {
        updateOrderStatus(activeOrder.id, 'OUT_FOR_DELIVERY', `Dispatched with ${partner.name}`);
      }
    }
    setShowAssignPartner(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Search Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-serif text-[#fae8be]">Customer Orders Directory</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Full transaction history, live state transitions, invoicing, and fulfillment dispatch.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1c120c] hover:bg-[#281810] border border-[#3d271c] text-xs font-semibold text-[#f0e2d0] transition shadow"
          >
            <Download className="w-3.5 h-3.5 text-[#cfa851]" />
            <span>Export Orders CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center gap-3 p-3.5 rounded-2xl bg-[#140c08] border border-[#2e1c12]">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by order # (e.g. SP-1042), customer name, phone number, pincode..."
            className="w-full pl-9 pr-4 py-2 bg-[#1b100a] border border-[#382319] focus:border-[#cfa851] rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none"
          />
        </div>

        {/* Status Pills Selector */}
        <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          {['ALL', 'NEW', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'].map(
            (status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono uppercase whitespace-nowrap transition ${
                  statusFilter === status
                    ? 'bg-[#cfa851] text-zinc-950 font-bold shadow-md shadow-[#cfa851]/15'
                    : 'bg-[#1b100a] text-zinc-400 hover:text-zinc-200 border border-[#2c1b12]'
                }`}
              >
                {status.replace('_', ' ')}
              </button>
            )
          )}
        </div>
      </div>

      {/* Main Split: Orders Table on Left, Live Detail Drawer on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Orders Table (7 cols on lg) */}
        <div className="lg:col-span-7 rounded-2xl bg-[#140c08] border border-[#2e1c12] shadow-xl overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-[#261710] flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Orders Found ({filteredOrders.length})
            </span>
          </div>

          <div className="overflow-x-auto divide-y divide-[#22150f] flex-1">
            {filteredOrders.length === 0 ? (
              <div className="py-16 text-center text-zinc-500 text-xs">
                No orders match your filter criteria.
              </div>
            ) : (
              filteredOrders.map((ord) => {
                const isSelected = activeOrder?.id === ord.id;
                return (
                  <div
                    key={ord.id}
                    onClick={() => setSelectedOrder(ord)}
                    className={`p-4 transition cursor-pointer flex items-center justify-between gap-4 ${
                      isSelected
                        ? 'bg-[#22140d] border-l-4 border-l-[#cfa851]'
                        : 'hover:bg-[#1a100a]'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs font-bold text-[#fae8be]">
                          #{ord.orderNumber}
                        </span>
                        <OrderStatusBadge status={ord.orderStatus} size="sm" />
                        <span className="text-[10px] text-zinc-500 font-mono">
                          {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-zinc-200 truncate">{ord.customerName}</p>
                      <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                        {ord.items.map((i) => `${i.quantity}x ${i.productName}`).join(', ')}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-xs font-mono font-bold text-[#f5ebd9]">₹{ord.finalAmount}</p>
                      <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded ${
                        ord.paymentStatus === 'PAID'
                          ? 'text-emerald-400 bg-emerald-950/40'
                          : ord.paymentStatus === 'REFUNDED'
                          ? 'text-red-400 bg-red-950/40'
                          : 'text-amber-400 bg-amber-950/40'
                      }`}>
                        {ord.paymentStatus}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Selected Order Detailed Workspace (5 cols on lg) */}
        <div className="lg:col-span-5 rounded-2xl bg-[#140c08] border border-[#2e1c12] shadow-xl overflow-hidden flex flex-col">
          {activeOrder ? (
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="p-5 border-b border-[#261710] bg-[#180f0b]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-bold text-[#fae8be]">
                      #{activeOrder.orderNumber}
                    </span>
                    <OrderStatusBadge status={activeOrder.orderStatus} size="md" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setInvoiceOrder(activeOrder);
                        setIsInvoiceOpen(true);
                      }}
                      title="Print / View Invoice"
                      className="p-2 rounded-lg bg-[#261710] hover:bg-[#341f15] text-[#cfa851] border border-[#3e271c] transition"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setCancelTargetOrder(activeOrder)}
                      disabled={activeOrder.orderStatus === 'CANCELLED' || activeOrder.orderStatus === 'DELIVERED'}
                      title="Cancel Order"
                      className="p-2 rounded-lg bg-red-950/30 hover:bg-red-900/50 text-red-400 border border-red-500/20 disabled:opacity-30 disabled:pointer-events-none transition"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setRefundTargetOrder(activeOrder)}
                      disabled={activeOrder.paymentStatus === 'REFUNDED'}
                      title="Issue Refund"
                      className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 disabled:opacity-30 disabled:pointer-events-none transition"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* State Transition Actions */}
                <div className="mt-3 pt-3 border-t border-[#261710]">
                  <label className="block text-[10px] uppercase font-bold tracking-wider text-zinc-400 mb-1.5">
                    Advance Operational Status
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'CONFIRMED',
                      'ACCEPTED',
                      'PREPARING',
                      'READY',
                      'PACKED',
                      'OUT_FOR_DELIVERY',
                      'DELIVERED',
                    ].map((status) => (
                      <button
                        key={status}
                        onClick={() => updateOrderStatus(activeOrder.id, status as OrderStatus)}
                        className={`text-[10px] font-mono uppercase px-2.5 py-1 rounded-lg border transition ${
                          activeOrder.orderStatus === status
                            ? 'bg-[#cfa851] text-zinc-950 border-[#cfa851] font-bold'
                            : 'bg-[#1e130c] text-zinc-300 border-[#382319] hover:border-[#cfa851]/50'
                        }`}
                      >
                        {status.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Order Body Details */}
              <div className="p-5 overflow-y-auto space-y-5 flex-1 text-xs">
                {/* Customer Information Card */}
                <div className="p-3.5 rounded-xl bg-[#180f0b] border border-[#281810] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold uppercase tracking-wider text-[10px] text-[#cfa851]">
                      Customer Details
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500">
                      ID: {activeOrder.id}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-zinc-100">{activeOrder.customerName}</p>
                  <div className="space-y-1 text-zinc-300 text-[11px]">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-zinc-500" />
                      <a href={`tel:${activeOrder.customerPhone}`} className="hover:text-[#cfa851]">
                        {activeOrder.customerPhone}
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-zinc-500" />
                      <a href={`mailto:${activeOrder.customerEmail}`} className="hover:text-[#cfa851]">
                        {activeOrder.customerEmail}
                      </a>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-zinc-500 mt-0.5 shrink-0" />
                      <span>
                        {activeOrder.customerAddress} (PIN: {activeOrder.pincode})
                      </span>
                    </div>
                  </div>
                  {activeOrder.notes && (
                    <div className="mt-2 p-2 rounded bg-[#20130d] border border-[#382015] text-[11px] text-amber-200">
                      <span className="font-bold">Customer Notes: </span>
                      {activeOrder.notes}
                    </div>
                  )}
                </div>

                {/* Delivery Logistics */}
                <div className="p-3.5 rounded-xl bg-[#180f0b] border border-[#281810]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold uppercase tracking-wider text-[10px] text-[#cfa851] flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5" />
                      Fulfillment Logistics
                    </span>
                    <button
                      onClick={() => setShowAssignPartner(true)}
                      className="text-[10px] text-[#cfa851] hover:underline"
                    >
                      Assign Courier →
                    </button>
                  </div>
                  <div className="text-[11px] text-zinc-300 space-y-1">
                    <p>
                      <span className="text-zinc-500">Delivery Partner:</span>{' '}
                      <span className="font-semibold text-zinc-100">
                        {activeOrder.deliveryPartnerName || 'Unassigned'}
                      </span>
                    </p>
                    {activeOrder.deliveryPartnerPhone && (
                      <p>
                        <span className="text-zinc-500">Contact:</span>{' '}
                        {activeOrder.deliveryPartnerPhone}
                      </p>
                    )}
                    <p>
                      <span className="text-zinc-500">Estimated Delivery:</span>{' '}
                      {activeOrder.estimatedDeliveryTime || '30 mins'}
                    </p>
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <h4 className="font-bold uppercase tracking-wider text-[10px] text-zinc-400 mb-2">
                    Beverages & Confectionery ({activeOrder.items.length})
                  </h4>
                  <div className="space-y-2">
                    {activeOrder.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start gap-3 p-2.5 rounded-xl bg-[#180f0b] border border-[#281810]"
                      >
                        {item.image ? (
                          <img
                            src={item.image}
                            alt=""
                            className="w-12 h-12 rounded-lg object-cover border border-[#3e271c] shrink-0"
                          />
                        ) : null}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-zinc-100 truncate">{item.productName}</p>
                            <span className="font-mono font-bold text-zinc-200">
                              ₹{item.subtotal}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-400">
                            {item.quantity} × ₹{item.price}
                          </p>
                          {item.customization && (
                            <p className="text-[10px] text-[#cfa851] mt-1 bg-[#251710] px-2 py-0.5 rounded inline-block">
                              {[
                                item.customization.milk ? `${item.customization.milk} Milk` : null,
                                item.customization.sweetness,
                                item.customization.temperature,
                                item.customization.extraShots ? `+${item.customization.extraShots} Shot` : null,
                                item.customization.specialInstructions,
                              ]
                                .filter(Boolean)
                                .join(' • ')}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bill Breakdown */}
                <div className="p-3.5 rounded-xl bg-[#180f0b] border border-[#281810] space-y-1.5">
                  <div className="flex justify-between text-zinc-400">
                    <span>Subtotal:</span>
                    <span className="font-mono">₹{activeOrder.subtotal.toFixed(2)}</span>
                  </div>
                  {activeOrder.discount > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Discount ({activeOrder.couponCode || 'Coupon'}):</span>
                      <span className="font-mono">-₹{activeOrder.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-zinc-400">
                    <span>Delivery Charge:</span>
                    <span className="font-mono">
                      {activeOrder.deliveryFee === 0 ? 'FREE' : `₹${activeOrder.deliveryFee.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Taxes & GST (5%):</span>
                    <span className="font-mono">₹{activeOrder.taxes.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-[#332016] text-sm font-bold text-[#fae8be]">
                    <span>Total Net Amount:</span>
                    <span className="font-mono text-base">₹{activeOrder.finalAmount.toFixed(2)}</span>
                  </div>
                </div>

                {/* Status Timeline */}
                <div>
                  <h4 className="font-bold uppercase tracking-wider text-[10px] text-zinc-400 mb-2">
                    Audit Timeline
                  </h4>
                  <div className="space-y-2 border-l border-[#3a2418] ml-2 pl-3">
                    {activeOrder.timeline.map((event, idx) => (
                      <div key={idx} className="relative">
                        <div className="absolute -left-[17px] top-1 w-2 h-2 rounded-full bg-[#cfa851]"></div>
                        <p className="font-mono text-[11px] font-bold text-zinc-200">
                          {event.status} •{' '}
                          <span className="text-[10px] text-zinc-500 font-normal">
                            {new Date(event.timestamp).toLocaleTimeString()} ({event.actor || 'Admin'})
                          </span>
                        </p>
                        {event.note && (
                          <p className="text-[10px] text-zinc-400 italic mt-0.5">{event.note}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-16 text-center text-zinc-500 text-xs">
              Select an order on the left to inspect details.
            </div>
          )}
        </div>
      </div>

      {/* Invoice Modal */}
      <InvoiceModal
        order={invoiceOrder}
        isOpen={isInvoiceOpen}
        onClose={() => {
          setIsInvoiceOpen(false);
          setInvoiceOrder(null);
        }}
      />

      {/* Cancel Order Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!cancelTargetOrder}
        title={`Cancel Order #${cancelTargetOrder?.orderNumber}`}
        message="Are you sure you want to cancel this order? This will immediately restore the product inventory and log this event."
        confirmLabel="Yes, Cancel Order"
        isDestructive={true}
        onConfirm={() => {
          if (cancelTargetOrder) {
            cancelOrder(cancelTargetOrder.id, cancelReason);
            setCancelTargetOrder(null);
          }
        }}
        onCancel={() => setCancelTargetOrder(null)}
      />

      {/* Refund Order Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!refundTargetOrder}
        title={`Refund Order #${refundTargetOrder?.orderNumber}`}
        message={`Issue full refund of ₹${refundTargetOrder?.finalAmount}? Payment status will be marked REFUNDED and customer notified.`}
        confirmLabel="Process Refund"
        isDestructive={true}
        onConfirm={() => {
          if (refundTargetOrder) {
            refundOrder(refundTargetOrder.id, refundReason);
            setRefundTargetOrder(null);
          }
        }}
        onCancel={() => setRefundTargetOrder(null)}
      />

      {/* Assign Delivery Partner Modal */}
      {showAssignPartner && activeOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#140e0a] border border-[#382319] w-full max-w-md rounded-2xl p-6 text-zinc-100 shadow-2xl">
            <h3 className="text-base font-bold font-serif text-[#fae8be]">
              Assign Delivery Partner
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Select a courier fleet partner to dispatch order #{activeOrder.orderNumber}.
            </p>

            <div className="mt-4 space-y-2">
              {deliveryPartners.map((partner) => (
                <label
                  key={partner.id}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                    selectedPartnerId === partner.id
                      ? 'bg-[#2a1a12] border-[#cfa851]'
                      : 'bg-[#180f0b] border-[#2c1b12] hover:bg-[#20140e]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="partner"
                      checked={selectedPartnerId === partner.id}
                      onChange={() => setSelectedPartnerId(partner.id)}
                      className="accent-[#cfa851]"
                    />
                    <div>
                      <p className="text-xs font-semibold text-zinc-100">{partner.name}</p>
                      <p className="text-[10px] text-zinc-400">
                        {partner.vehicle} • {partner.phone}
                      </p>
                    </div>
                  </div>
                  <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded ${
                    partner.status === 'AVAILABLE'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    {partner.status}
                  </span>
                </label>
              ))}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowAssignPartner(false)}
                className="px-4 py-2 text-xs rounded-xl bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignPartnerConfirm}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#cfa851] text-zinc-950 hover:bg-[#dbb660]"
              >
                Confirm Dispatch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
