import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CouponRecord } from '../../types';
import { formatBDT } from '../../utils/calculations';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import {
  Tag,
  Plus,
  Trash2,
  Check,
  X,
  Clock,
  CheckCircle2,
  Calendar,
} from 'lucide-react';

export const AdminCouponsPage: React.FC = () => {
  const { coupons, createCoupon, toggleCoupon, deleteCoupon } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState(50);
  const [maxUses, setMaxUses] = useState(100);
  const [expiresAt, setExpiresAt] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    await createCoupon({
      code: code.trim().toUpperCase(),
      discount_type: discountType,
      discount_value: discountValue,
      max_uses: maxUses,
      expires_at: new Date(expiresAt).toISOString(),
      is_active: true,
    });

    setIsModalOpen(false);
    setCode('');
  };

  return (
    <div className="space-y-6">
      <Breadcrumb pageName="কুপন ও প্রোমো কোড" parentName="Admin Control" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">কুপন ও ডিসকাউন্ট কোড</h1>
          <p className="text-sm text-slate-500">
            মার্চেন্টদের জন্য ডিসকাউন্ট অফার, সর্বোচ্চ ব্যবহার সীমা ও মেয়াদ নির্ধারণ করুন
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>নতুন কুপন তৈরি করুন</span>
        </button>
      </div>

      {/* Coupons Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {coupons.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            এখনও কোনো কুপন তৈরি করা হয়নি।
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">কুপন কোড</th>
                  <th className="py-3.5 px-4">ছাড়ের ধরন ও পরিমাণ</th>
                  <th className="py-3.5 px-4">ব্যবহার হয়েছে</th>
                  <th className="py-3.5 px-4">মেয়াদ শেষ</th>
                  <th className="py-3.5 px-4">স্ট্যাটাস</th>
                  <th className="py-3.5 px-4 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {coupons.map(c => {
                  const isExpired = new Date(c.expires_at).getTime() < Date.now();
                  const isLimitReached = c.used_count >= c.max_uses;

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-sm">
                        <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-lg">
                          {c.code}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        {c.discount_type === 'percentage' ? `${c.discount_value}% ছাড়` : `৳${c.discount_value} ফ্ল্যাট ছাড়`}
                      </td>

                      <td className="py-3.5 px-4 text-slate-700">
                        <span className="font-bold">{c.used_count}</span> / {c.max_uses} বার
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 font-mono">
                        {new Date(c.expires_at).toLocaleDateString('bn-BD')}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                            !c.is_active || isExpired || isLimitReached
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isExpired
                            ? 'মেয়াদ শেষ'
                            : isLimitReached
                            ? 'কোটা শেষ'
                            : c.is_active
                            ? 'সক্রিয়'
                            : 'নিষ্ক্রিয়'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => toggleCoupon(c.id)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition"
                          >
                            {c.is_active ? 'বন্ধ করুন' : 'চালু করুন'}
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteCoupon(c.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Create Coupon */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4 text-left animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900">নতুন কুপন কোড তৈরি করুন</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">কুপন কোড (যেমন: WELCOME50) *</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  placeholder="PROMO2026"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">ছাড়ের ধরন</label>
                  <select
                    value={discountType}
                    onChange={e => setDiscountType(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  >
                    <option value="percentage">শতকরা (% Percentage)</option>
                    <option value="fixed">নির্দিষ্ট টাকা (Fixed BDT)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">ছাড়ের পরিমাণ *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={discountValue}
                    onChange={e => setDiscountValue(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">সর্বোচ্চ ব্যবহার সংখ্যা</label>
                  <input
                    type="number"
                    min="1"
                    value={maxUses}
                    onChange={e => setMaxUses(parseInt(e.target.value, 10) || 100)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">মেয়াদ শেষ তারিখ</label>
                  <input
                    type="date"
                    required
                    value={expiresAt}
                    onChange={e => setExpiresAt(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold"
                >
                  কুপন তৈরি করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
