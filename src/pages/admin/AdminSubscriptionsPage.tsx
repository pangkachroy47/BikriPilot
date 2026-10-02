import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { formatBDT } from '../../utils/calculations';
import {
  ShieldCheck,
  Search,
  Filter,
  Calendar,
  Edit2,
  Clock,
  XCircle,
  AlertTriangle,
  Layers,
} from 'lucide-react';
import { SubscriptionRecord } from '../../types';

export const AdminSubscriptionsPage: React.FC = () => {
  const { adminSubscriptions, shops, extendSubscription, changeUserPlan } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'trial' | 'expired' | 'suspended' | 'cancelled'>('all');

  const [extendingSub, setExtendingSub] = useState<SubscriptionRecord | null>(null);
  const [daysToAdd, setDaysToAdd] = useState(30);

  const [changingSub, setChangingSub] = useState<SubscriptionRecord | null>(null);
  const [targetPlanId, setTargetPlanId] = useState('founder');

  const filteredSubs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return adminSubscriptions.filter(s => {
      const matchSearch =
        s.shop_id.toLowerCase().includes(q) ||
        s.plan_id.toLowerCase().includes(q) ||
        s.status.toLowerCase().includes(q);

      if (!matchSearch) return false;
      if (statusFilter === 'all') return true;
      return s.status === statusFilter;
    });
  }, [adminSubscriptions, searchQuery, statusFilter]);

  const handleConfirmExtend = async () => {
    if (!extendingSub) return;
    await extendSubscription(extendingSub.shop_id, daysToAdd, 'Admin Subscriptions Page Extension');
    setExtendingSub(null);
  };

  const handleConfirmChangePlan = async () => {
    if (!changingSub) return;
    await changeUserPlan(changingSub.shop_id, targetPlanId);
    setChangingSub(null);
  };

  return (
    <div className="space-y-6">
      <Breadcrumb pageName="সাবস্ক্রিপশন ব্যবস্থাপনা" parentName="Admin Control" />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">সকল সাবস্ক্রিপশন ও লাইফসাইকেল</h1>
        <p className="text-sm text-slate-500">
          সক্রিয়, ট্রায়াল, এবং মেয়াদোত্তীর্ণ সাবস্ক্রিপশনের পূর্ণাঙ্গ ডাটাবেজ
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="শপ আইডি বা প্ল্যান দিয়ে খুঁজুন..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 text-xs">
          {(['all', 'active', 'trial', 'expired', 'suspended', 'cancelled'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-2 rounded-xl font-bold whitespace-nowrap transition capitalize ${
                statusFilter === tab
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab === 'all'
                ? 'সবগুলো'
                : tab === 'active'
                ? 'সক্রিয়'
                : tab === 'trial'
                ? 'ট্রায়াল'
                : tab === 'expired'
                ? 'মেয়াদোত্তীর্ণ'
                : tab === 'suspended'
                ? 'স্থগিত'
                : 'বাতিল'}
            </button>
          ))}
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredSubs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            কোনো সাবস্ক্রিপশন রেকর্ড পাওয়া যায়নি।
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">সাবস্ক্রিপশন আইডি</th>
                  <th className="py-3.5 px-4">শপ আইডি</th>
                  <th className="py-3.5 px-4">প্ল্যান</th>
                  <th className="py-3.5 px-4">স্ট্যাটাস</th>
                  <th className="py-3.5 px-4">শুরুর তারিখ</th>
                  <th className="py-3.5 px-4">মেয়াদ শেষ</th>
                  <th className="py-3.5 px-4 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSubs.map(sub => {
                  return (
                    <tr key={sub.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {sub.id}
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {sub.shop_id}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-900 capitalize">
                        {sub.plan_id}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                            sub.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : sub.status === 'trial'
                              ? 'bg-blue-100 text-blue-800'
                              : sub.status === 'expired'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {sub.status.toUpperCase()}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-500">
                        {new Date(sub.started_at).toLocaleDateString('bn-BD')}
                      </td>

                      <td className="py-3.5 px-4 text-slate-900 font-mono font-bold">
                        {new Date(sub.expires_at).toLocaleDateString('bn-BD')}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setExtendingSub(sub)}
                            className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg transition text-xs font-semibold flex items-center gap-1"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>মেয়াদ বৃদ্ধি</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setChangingSub(sub)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition text-xs font-semibold flex items-center gap-1"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>প্ল্যান বদল</span>
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

      {/* Modal: Extend */}
      {extendingSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4 text-left animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-bold text-base text-slate-900">মেয়াদ বৃদ্ধি নিশ্চিতকরণ</h3>
            <p className="text-xs text-slate-500">শপ: <strong>{extendingSub.shop_id}</strong></p>

            <div className="space-y-2 text-xs">
              <label className="font-bold text-slate-700 block">কত দিন বাড়াতে চান? *</label>
              <input
                type="number"
                min="1"
                max="365"
                value={daysToAdd}
                onChange={e => setDaysToAdd(parseInt(e.target.value, 10) || 30)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setExtendingSub(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleConfirmExtend}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl"
              >
                সংরক্ষণ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Change Plan */}
      {changingSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4 text-left animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-bold text-base text-slate-900">প্ল্যান পরিবর্তন</h3>
            <p className="text-xs text-slate-500">শপ: <strong>{changingSub.shop_id}</strong></p>

            <div className="space-y-2 text-xs">
              <label className="font-bold text-slate-700 block">নতুন প্ল্যান নির্ধারণ করুন *</label>
              <select
                value={targetPlanId}
                onChange={e => setTargetPlanId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
              >
                <option value="free_trial">Free Trial</option>
                <option value="founder">Founder Deal</option>
                <option value="standard">Standard Pack</option>
                <option value="growth">Growth Pro</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setChangingSub(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleConfirmChangePlan}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl"
              >
                পরিবর্তন করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
