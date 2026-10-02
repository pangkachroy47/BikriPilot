import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { UserProfile, Shop } from '../../types';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import {
  Users,
  Search,
  Filter,
  Eye,
  ShieldCheck,
  AlertTriangle,
  Clock,
  MoreVertical,
  Plus,
  Edit2,
  Calendar,
  Lock,
  Unlock,
  CheckCircle,
  XCircle,
  FileText,
} from 'lucide-react';

interface AdminUsersPageProps {
  onSelectUser: (userId: string) => void;
}

export const AdminUsersPage: React.FC<AdminUsersPageProps> = ({ onSelectUser }) => {
  const {
    adminUsers,
    shops,
    adminSubscriptions,
    suspendUser,
    reactivateUser,
    extendSubscription,
    activateSubscription,
    cancelSubscription,
    changeUserPlan,
    addUserNote,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'trial' | 'pending' | 'expired' | 'suspended'>('all');

  // Action modals state
  const [selectedUserForNote, setSelectedUserForNote] = useState<UserProfile | null>(null);
  const [noteText, setNoteText] = useState('');

  const [selectedUserForExtend, setSelectedUserForExtend] = useState<{ user: UserProfile; shop: Shop } | null>(null);
  const [extendDays, setExtendDays] = useState(30);
  const [extendReason, setExtendReason] = useState('ম্যানুয়াল কাস্টমার সাপোর্ট এক্সটেনশন');

  const [selectedUserForPlan, setSelectedUserForPlan] = useState<{ user: UserProfile; shop: Shop } | null>(null);
  const [newPlanChoice, setNewPlanChoice] = useState('founder');

  // Filter users based on query and status
  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return adminUsers.filter(u => {
      // Find matching shop for this user
      const userShop = shops.find(s => s.owner_id === u.id) || shops[0];
      const matchSearch =
        u.full_name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone && u.phone.includes(q)) ||
        (userShop && userShop.name.toLowerCase().includes(q));

      if (!matchSearch) return false;

      if (statusFilter === 'all') return true;
      if (statusFilter === 'suspended') return u.account_status === 'suspended';
      if (statusFilter === 'active') return userShop.subscription_status === 'active' && u.account_status !== 'suspended';
      if (statusFilter === 'trial') return userShop.subscription_plan === 'free_trial' && u.account_status !== 'suspended';
      if (statusFilter === 'pending') return userShop.subscription_status === 'pending_approval';
      if (statusFilter === 'expired') return userShop.subscription_status === 'expired';

      return true;
    });
  }, [adminUsers, shops, searchQuery, statusFilter]);

  const handleSaveNote = async () => {
    if (!selectedUserForNote) return;
    await addUserNote(selectedUserForNote.id, noteText);
    setSelectedUserForNote(null);
    setNoteText('');
  };

  const handleConfirmExtend = async () => {
    if (!selectedUserForExtend) return;
    await extendSubscription(selectedUserForExtend.shop.id, extendDays, extendReason);
    setSelectedUserForExtend(null);
  };

  const handleConfirmChangePlan = async () => {
    if (!selectedUserForPlan) return;
    await changeUserPlan(selectedUserForPlan.shop.id, newPlanChoice);
    setSelectedUserForPlan(null);
  };

  return (
    <div className="space-y-6">
      <Breadcrumb pageName="ব্যবহারকারী ও মার্চেন্ট তালিকা" parentName="Admin Control" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">ব্যবহারকারী ও মার্চেন্ট পরিচালনা</h1>
          <p className="text-sm text-slate-500">
            সকল রেজিস্টার্ড সেলারদের সাবস্ক্রিপশন স্ট্যাটাস, প্ল্যান পরিবর্তন ও সাসপেনশন কন্ট্রোল
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="নাম, ইমেইল, মোবাইল অথবা শপের নাম দিয়ে খুঁজুন..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 text-xs">
          {(['all', 'active', 'trial', 'pending', 'expired', 'suspended'] as const).map(tab => (
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
                : tab === 'pending'
                ? 'পেন্ডিং'
                : tab === 'expired'
                ? 'মেয়াদোত্তীর্ণ'
                : 'স্থগিত'}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            কোনো ব্যবহারকারী পাওয়া যায়নি।
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">নাম ও ইমেইল</th>
                  <th className="py-3.5 px-4">ফোন নম্বর</th>
                  <th className="py-3.5 px-4">শপ / পেজ</th>
                  <th className="py-3.5 px-4">প্ল্যান</th>
                  <th className="py-3.5 px-4">সাবস্ক্রিপশন</th>
                  <th className="py-3.5 px-4">যোগদানের তারিখ</th>
                  <th className="py-3.5 px-4">মেয়াদ শেষ</th>
                  <th className="py-3.5 px-4">অ্যাকাউন্ট</th>
                  <th className="py-3.5 px-4 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map(u => {
                  const userShop = shops.find(s => s.owner_id === u.id) || shops[0];
                  const isSuspended = u.account_status === 'suspended';

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{u.full_name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{u.email}</div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-700">
                        {u.phone || userShop?.phone || '-'}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{userShop?.name || 'N/A'}</div>
                        <div className="text-[11px] text-slate-400">{userShop?.fb_page_name || 'Personal Store'}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                          {userShop?.subscription_plan || 'free_trial'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            userShop?.subscription_status === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : userShop?.subscription_status === 'pending_approval'
                              ? 'bg-amber-100 text-amber-800'
                              : userShop?.subscription_status === 'cancelled'
                              ? 'bg-slate-200 text-slate-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {userShop?.subscription_status === 'active'
                            ? 'সক্রিয়'
                            : userShop?.subscription_status === 'pending_approval'
                            ? 'পেন্ডিং'
                            : userShop?.subscription_status === 'cancelled'
                            ? 'বাতিল'
                            : 'মেয়াদোত্তীর্ণ'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString('bn-BD') : '-'}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                        {userShop?.subscription_expires_at
                          ? new Date(userShop.subscription_expires_at).toLocaleDateString('bn-BD')
                          : '-'}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            isSuspended ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isSuspended ? 'স্থগিত' : 'সক্রিয়'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* View details */}
                          <button
                            type="button"
                            title="ইউজার বিস্তারিত দেখুন"
                            onClick={() => onSelectUser(u.id)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Quick Activate */}
                          {userShop?.subscription_status !== 'active' && (
                            <button
                              type="button"
                              title="সাবস্ক্রিপশন চালু করুন (Activate)"
                              onClick={async () => {
                                if (confirm(`${u.full_name}-এর সাবস্ক্রিপশন অ্যাক্টিভ করতে চান?`)) {
                                  await activateSubscription(userShop.id);
                                }
                              }}
                              className="p-1.5 text-emerald-700 hover:bg-emerald-100 rounded-lg transition"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}

                          {/* Extend subscription */}
                          <button
                            type="button"
                            title="মেয়াদ বৃদ্ধি করুন"
                            onClick={() => setSelectedUserForExtend({ user: u, shop: userShop })}
                            className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                          >
                            <Calendar className="w-4 h-4" />
                          </button>

                          {/* Change plan */}
                          <button
                            type="button"
                            title="প্ল্যান পরিবর্তন"
                            onClick={() => setSelectedUserForPlan({ user: u, shop: userShop })}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Cancel subscription */}
                          {userShop?.subscription_status === 'active' && (
                            <button
                              type="button"
                              title="সাবস্ক্রিপশন বাতিল করুন"
                              onClick={async () => {
                                const reason = prompt('সাবস্ক্রিপশন বাতিলের কারণ লিখুন:');
                                if (reason) await cancelSubscription(userShop.id, reason);
                              }}
                              className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}

                          {/* Suspend / Reactivate */}
                          {isSuspended ? (
                            <button
                              type="button"
                              title="অ্যাকাউন্ট পুনর্বহাল"
                              onClick={() => reactivateUser(u.id)}
                              className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                            >
                              <Unlock className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              title="অ্যাকাউন্ট স্থগিত করুন"
                              onClick={() => {
                                const reason = prompt('সাসপেনশনের কারণ লিখুন:', 'নিয়ম লঙ্ঘনের কারণে স্থগিত');
                                if (reason) suspendUser(u.id, reason);
                              }}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            >
                              <Lock className="w-4 h-4" />
                            </button>
                          )}

                          {/* Add Note */}
                          <button
                            type="button"
                            title="নোট লিখুন"
                            onClick={() => {
                              setSelectedUserForNote(u);
                              setNoteText(u.admin_notes || '');
                            }}
                            className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition"
                          >
                            <FileText className="w-4 h-4" />
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

      {/* Modal: Extend Subscription */}
      {selectedUserForExtend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4 text-left animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-bold text-base text-slate-900">ম্যানুয়াল সাবস্ক্রিপশন মেয়াদ বৃদ্ধি</h3>
            <p className="text-xs text-slate-500">
              ইউজার: <strong>{selectedUserForExtend.user.full_name}</strong> ({selectedUserForExtend.shop.name})
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">কত দিন বৃদ্ধি করতে চান? *</label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={extendDays}
                  onChange={e => setExtendDays(parseInt(e.target.value, 10) || 30)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">কারণ বা রেফারেন্স (ঐচ্ছিক)</label>
                <input
                  type="text"
                  value={extendReason}
                  onChange={e => setExtendReason(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedUserForExtend(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleConfirmExtend}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl"
              >
                মেয়াদ বৃদ্ধি নিশ্চিত করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Change Plan */}
      {selectedUserForPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4 text-left animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-bold text-base text-slate-900">সাবস্ক্রিপশন প্ল্যান পরিবর্তন</h3>
            <p className="text-xs text-slate-500">
              ইউজার: <strong>{selectedUserForPlan.user.full_name}</strong>
            </p>

            <div className="space-y-3 text-xs">
              <label className="font-bold text-slate-700 block">নতুন প্ল্যান নির্ধারণ করুন *</label>
              <select
                value={newPlanChoice}
                onChange={e => setNewPlanChoice(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
              >
                <option value="free_trial">Free Trial (ফ্রি ট্রায়াল)</option>
                <option value="founder">Founder (ফাউন্ডার - ৬০ দিন)</option>
                <option value="standard">Standard (স্ট্যান্ডার্ড - ৩০ দিন)</option>
                <option value="growth">Growth (গ্রোথ প্রো - ৩০ দিন)</option>
              </select>
              <p className="text-[11px] text-slate-400">প্ল্যান পরিবর্তন অবিলম্বে কার্যকর হবে।</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedUserForPlan(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleConfirmChangePlan}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl"
              >
                প্ল্যান পরিবর্তন করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Admin Note */}
      {selectedUserForNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4 text-left animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-bold text-base text-slate-900">অ্যাডমিন নোট যুক্ত করুন</h3>
            <p className="text-xs text-slate-500">
              ইউজার: <strong>{selectedUserForNote.full_name}</strong>
            </p>

            <textarea
              rows={4}
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              placeholder="এই কাস্টমার সম্পর্কিত বিশেষ নির্দেশনা বা পর্যবেক্ষণ লিখুন..."
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs"
            />

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedUserForNote(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleSaveNote}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl"
              >
                নোট সংরক্ষণ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
