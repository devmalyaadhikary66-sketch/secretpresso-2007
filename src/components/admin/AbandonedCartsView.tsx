import React from 'react';
import { useStore } from '../../context/StoreContext';
import { ShoppingBag, Clock, Send, CheckCircle2, Phone, Mail } from 'lucide-react';

export const AbandonedCartsView: React.FC = () => {
  const { abandonedCarts, sendCartRecoveryReminder } = useStore();

  const totalValue = abandonedCarts.reduce((sum, c) => sum + c.cartValue, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-serif text-[#fae8be]">Abandoned Cart Recovery Matrix</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Identify customers who abandoned checkout and dispatch automated recovery incentives.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-zinc-300 bg-[#160d09] px-3.5 py-2 rounded-xl border border-[#301c13]">
          <span>Unclaimed Cart Value: </span>
          <span className="font-bold text-[#cfa851]">₹{totalValue.toLocaleString('en-IN')}</span>
        </div>
      </div>

      {/* Cart Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {abandonedCarts.map((cart) => (
          <div
            key={cart.id}
            className="p-5 rounded-2xl bg-[#140c08] border border-[#2e1c12] shadow-xl flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-sm font-bold text-zinc-100">{cart.customerName}</h3>
                  <div className="flex items-center gap-3 text-zinc-400 text-xs mt-1">
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3 text-zinc-500" />
                      {cart.customerEmail}
                    </span>
                    {cart.customerPhone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-zinc-500" />
                        {cart.customerPhone}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono text-base font-bold text-[#fae8be]">₹{cart.cartValue}</span>
                  <span className="block text-[10px] text-zinc-500 font-mono">
                    {new Date(cart.abandonedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              {/* Items in Basket */}
              <div className="py-3 border-y border-[#261710] space-y-2">
                <span className="text-[10px] font-mono uppercase text-zinc-400 block mb-1">
                  Items Left Behind ({cart.items.length})
                </span>
                {cart.items.map((it) => (
                  <div key={it.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      {it.image ? (
                        <img src={it.image} alt="" className="w-8 h-8 rounded-lg object-cover" />
                      ) : null}
                      <span className="text-zinc-200">
                        {it.quantity}× {it.productName}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-zinc-300">₹{it.subtotal}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-[#261710] flex items-center justify-between">
              <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full ${
                cart.recovered ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
              }`}>
                {cart.recovered ? 'Incentive Dispatched' : 'Awaiting Recovery'}
              </span>

              <button
                onClick={() => sendCartRecoveryReminder(cart.id)}
                disabled={cart.recovered}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#fae8be] via-[#cfa851] to-[#b3883b] text-zinc-950 font-bold text-xs shadow-md shadow-[#cfa851]/15 hover:brightness-110 disabled:opacity-30 disabled:pointer-events-none transition"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{cart.recovered ? 'Dispatched' : 'Send 10% Recovery Coupon'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
