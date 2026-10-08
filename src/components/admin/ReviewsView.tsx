import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { Review } from '../../types';
import {
  Star,
  CheckCircle2,
  XCircle,
  EyeOff,
  Trash2,
  Filter,
  Check,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react';

export const ReviewsView: React.FC = () => {
  const { reviews, moderateReview } = useStore();
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => filterStatus === 'ALL' || r.status === filterStatus);
  }, [reviews, filterStatus]);

  // Statistics
  const ratingStats = useMemo(() => {
    const total = reviews.length;
    if (total === 0) return { avg: 5.0, counts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } };

    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    const avg = parseFloat((sum / total).toFixed(1));
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      const star = Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
      counts[star]++;
    });

    return { avg, counts };
  }, [reviews]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-serif text-[#fae8be]">Customer Reviews & Tasting Notes Moderation</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Approve verified buyer testimonials, audit feedback, and monitor product satisfaction.
          </p>
        </div>
      </div>

      {/* Rating Breakdown & Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-5 rounded-2xl bg-[#140c08] border border-[#2e1c12] shadow-xl flex items-center gap-6">
          <div className="text-center">
            <span className="text-4xl font-extrabold font-serif text-[#fae8be]">{ratingStats.avg}</span>
            <div className="flex items-center justify-center gap-1 text-[#cfa851] mt-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-current" />
              ))}
            </div>
            <p className="text-[10px] text-zinc-500 font-mono mt-1">
              Based on {reviews.length} ratings
            </p>
          </div>

          <div className="flex-1 space-y-1.5 text-[11px] font-mono">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = ratingStats.counts[star as 1 | 2 | 3 | 4 | 5];
              const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-2">
                  <span className="w-7 text-zinc-400">{star} ★</span>
                  <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div style={{ width: `${pct}%` }} className="h-full bg-[#cfa851] rounded-full"></div>
                  </div>
                  <span className="w-5 text-right text-zinc-500">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="md:col-span-2 p-5 rounded-2xl bg-[#140c08] border border-[#2e1c12] shadow-xl flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold font-serif text-[#fae8be]">Editorial & Authenticity Policy</h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-lg leading-relaxed">
              SECRETpresso upholds culinary authenticity. Reviews marked "APPROVED" immediately render under their respective products on the customer storefront.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-[#1c110a] p-1 rounded-xl border border-[#301d14]">
            {['ALL', 'APPROVED', 'PENDING', 'REJECTED', 'HIDDEN'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase transition ${
                  filterStatus === st
                    ? 'bg-[#cfa851] text-zinc-950 font-bold shadow'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-3">
        {filteredReviews.length === 0 ? (
          <div className="py-16 text-center text-zinc-500 text-xs rounded-2xl bg-[#140c08] border border-[#2e1c12]">
            No reviews match the selected filter.
          </div>
        ) : (
          filteredReviews.map((rev) => (
            <div
              key={rev.id}
              className="p-5 rounded-2xl bg-[#140c08] border border-[#2e1c12] hover:border-[#cfa851]/30 transition shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-3">
                  <div className="flex items-center text-[#cfa851]">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < rev.rating ? 'fill-current text-[#cfa851]' : 'text-zinc-700'
                        }`}
                      />
                    ))}
                  </div>
                  <h4 className="text-xs font-bold text-zinc-100">{rev.productName}</h4>
                  {rev.verifiedPurchase && (
                    <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                      <ShieldCheck className="w-3 h-3" />
                      Verified Order
                    </span>
                  )}
                </div>

                <p className="text-xs text-zinc-300 italic font-serif leading-relaxed">
                  "{rev.comment}"
                </p>

                <div className="flex items-center gap-2 text-[11px] text-zinc-500 font-mono">
                  <span>Author: {rev.customerName}</span>
                  <span>•</span>
                  <span>{rev.customerEmail}</span>
                  <span>•</span>
                  <span>{rev.createdAt}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => moderateReview(rev.id, 'APPROVED')}
                  title="Approve for live website"
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                    rev.status === 'APPROVED'
                      ? 'bg-emerald-500 text-zinc-950 font-bold'
                      : 'bg-emerald-950/50 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-900/60'
                  }`}
                >
                  Approve
                </button>
                <button
                  onClick={() => moderateReview(rev.id, 'HIDDEN')}
                  title="Hide from store"
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                    rev.status === 'HIDDEN'
                      ? 'bg-zinc-700 text-zinc-100'
                      : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Hide
                </button>
                <button
                  onClick={() => moderateReview(rev.id, 'REJECTED')}
                  title="Reject"
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                    rev.status === 'REJECTED'
                      ? 'bg-red-600 text-white font-bold'
                      : 'bg-red-950/50 text-red-300 border border-red-500/30 hover:bg-red-900/60'
                  }`}
                >
                  Reject
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
