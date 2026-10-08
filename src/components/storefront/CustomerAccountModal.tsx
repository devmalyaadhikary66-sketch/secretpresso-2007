import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  User,
  ShoppingBag,
  Radio,
  HelpCircle,
  X,
  CheckCircle2,
  Mail,
  Phone,
  MapPin,
  Clock,
  LogOut,
  LogIn,
  KeyRound,
  ArrowRight,
} from 'lucide-react';
import { OrderStatusBadge } from '../common/Badge';

interface CustomerAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTrackOrder: (orderId: string) => void;
}

export const CustomerAccountModal: React.FC<CustomerAccountModalProps> = ({
  isOpen,
  onClose,
  onTrackOrder,
}) => {
  const { orders } = useStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'help'>('orders');

  // Customer session state (simulated customer account)
  const [customerEmail, setCustomerEmail] = useState('aditi.sharma@gmail.com');
  const [customerName, setCustomerName] = useState('Aditi Sharma');
  const [customerPhone, setCustomerPhone] = useState('+91 98765 43210');
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  if (!isOpen) return null;

  // Filter orders for this customer email/phone
  const myOrders = orders.filter(
    (o) =>
      o.customerEmail.toLowerCase() === customerEmail.toLowerCase() ||
      o.customerPhone.includes(customerPhone.slice(-6))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#120b08] border border-[#382319] w-full max-w-xl rounded-2xl shadow-2xl p-6 text-zinc-100 relative max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#281810]">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#cfa851]">
              Customer Concierge Portal
            </span>
            <h3 className="text-lg font-bold font-serif text-[#fae8be]">
              MY SECRET • {isLoggedIn ? customerName : 'Sign In'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 pt-3 pb-2 border-b border-[#24150e]">
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeTab === 'orders'
                ? 'bg-[#cfa851] text-zinc-950 font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>My Orders ({myOrders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeTab === 'profile'
                ? 'bg-[#cfa851] text-zinc-950 font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Account Details</span>
          </button>

          <button
            onClick={() => setActiveTab('help')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeTab === 'help'
                ? 'bg-[#cfa851] text-zinc-950 font-bold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Help & Concierge</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="py-4 overflow-y-auto flex-1 space-y-4 text-xs">
          {activeTab === 'orders' && (
            <div className="space-y-3">
              {myOrders.length === 0 ? (
                <div className="py-12 text-center text-zinc-500">
                  <ShoppingBag className="w-10 h-10 text-zinc-700 mx-auto mb-2" />
                  <p className="font-serif text-sm text-zinc-400">No active orders yet.</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Order handcrafted coffee or Venetian Tiramisu to start collecting.
                  </p>
                </div>
              ) : (
                myOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-4 rounded-xl bg-[#180f0b] border border-[#2b1910] space-y-2 hover:border-[#cfa851]/40 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-[#fae8be]">
                          #{ord.orderNumber}
                        </span>
                        <OrderStatusBadge status={ord.orderStatus} size="sm" />
                      </div>
                      <span className="font-mono font-bold text-sm text-zinc-200">
                        ₹{ord.finalAmount}
                      </span>
                    </div>

                    <p className="text-[11px] text-zinc-400">
                      {ord.items.map((i) => `${i.quantity}× ${i.productName}`).join(', ')}
                    </p>

                    <div className="pt-2 border-t border-[#261710] flex items-center justify-between">
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {new Date(ord.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>

                      <button
                        onClick={() => {
                          onTrackOrder(ord.id);
                          onClose();
                        }}
                        className="flex items-center gap-1 text-[11px] font-bold text-[#cfa851] hover:underline"
                      >
                        <Radio className="w-3.5 h-3.5" />
                        <span>Track Live Delivery →</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="space-y-4">
              {isLoggedIn ? (
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-[#180f0b] border border-[#281810] space-y-2">
                    <p className="text-sm font-bold text-zinc-100">{customerName}</p>
                    <div className="space-y-1 text-zinc-300 text-[11px]">
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-zinc-500" />
                        <span>{customerEmail}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-zinc-500" />
                        <span>{customerPhone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                        <span>Apt 402, Prestige Hermitage, Lavelle Road, Bengaluru</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#180f0b] border border-[#281810] flex items-center justify-between">
                    <div>
                      <p className="font-bold text-zinc-200">SECRET Collector Status</p>
                      <p className="text-[11px] text-zinc-400">Series 01 Miniature Collector Member</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#cfa851]/15 text-[#e6ca85] border border-[#cfa851]/30">
                      VIP COLLECTOR
                    </span>
                  </div>

                  <button
                    onClick={() => setIsLoggedIn(false)}
                    className="w-full py-2.5 rounded-xl bg-[#22140d] text-zinc-300 hover:text-red-300 font-semibold border border-[#382319] transition flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out of Customer Account</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-zinc-300">
                    Sign in with your email to quickly access order history and collectibles tracking.
                  </p>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="your.email@gmail.com"
                    className="w-full px-3 py-2 bg-[#180f0b] border border-[#352116] rounded-xl text-zinc-100"
                  />
                  <button
                    onClick={() => setIsLoggedIn(true)}
                    className="w-full py-2.5 rounded-xl bg-[#cfa851] text-zinc-950 font-bold hover:bg-[#dbb660] transition"
                  >
                    Sign In
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'help' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-[#180f0b] border border-[#281810] space-y-1">
                <p className="font-bold text-zinc-200">Roastery Concierge Desk</p>
                <p className="text-zinc-400">Direct helpline: +91 80 4965 2200 (08:00 – 23:00)</p>
                <p className="text-zinc-400">Concierge Email: concierge@secretpresso.com</p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#180f0b] border border-[#281810] space-y-1">
                <p className="font-bold text-[#cfa851]">How the Collectible Chamber Works</p>
                <p className="text-zinc-400 leading-relaxed">
                  Every SECRETpresso coffee cup features a food-grade sealed secret bottom chamber housing a collectible figurine from our active series. No figurine touches the hot brew.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
