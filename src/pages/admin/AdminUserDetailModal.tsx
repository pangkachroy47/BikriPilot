import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatBDT } from '../../utils/calculations';
import { getDaysRemaining } from '../../utils/subscriptionLimits';
import {
  X,
  User,
  Store,
  CreditCard,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Layers,
  ShoppingBag,
  Package,
  Sparkles,
  Calendar,
  Lock,
  Unlock,
  Edit2,
  FileText,
  DollarSign,
} from 'lucide-react';

interface AdminUserDetailModalProps {
  userId: string | null;
  onClose: () => void;
}

export const AdminUserDetailModal: React.FC<AdminUserDetailModalProps> = ({
  userId,
  onClose,
}) => {
  const {
    adminUsers,
    shops,
    orders,
    customers,
    products,
    aiParseLogs,
    paymentVerifications,
    suspendUser,
    reactivateUser,
    extendSubscription,
    activateSubscription,
    cancelSubscription,
    changeUserPlan,
    addUserNote,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'overview' | 'payments' | 'notes'>('overview');
  const [noteInput, setNoteInput] = useState('');

  if (!userId) return null;

  const targetUser = adminUsers.find(u => u.id === userId);
  if (!targetUser) return null;

  const targetShop = shops.find(s => s.owner_id === targetUser.id) || shops[0];
  const userOrders = orders.filter(o => o.shop_id === targetShop.id);
  const userCustomers = customers.filter(c => c.shop_id === targetShop.id);
  const userProducts = products.filter(p => p.shop_id === targetShop.id);
  const userAILogs = aiParseLogs.filter(l => l.shop_id === targetShop.id);
  const userPayments = paymentVerifications.filter(p => p.shop_id === targetShop.id);

  const daysLeft = getDaysRemaining(targetShop);
  const isSuspended = targetUser.account_status === 'suspended';

  const handleSaveNote = async () => {
    if (!noteInput.trim()) return;
    await addUserNote(targetUser.id, noteInput);
    setNoteInput('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4.5 bg-[#1C2434] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow-md">
              {targetUser.full_name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-lg text-white">{targetUser.full_name}</h3>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
                  {targetUser.role.toUpperCase()}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isSuspended ? 'bg-red-500/20 text-red-300' : 'bg-emerald-500/20 text-emerald-300'
                  }`}
                >
                  {isSuspended ? 'সাসপেন্ডেড' : 'সক্রিয়'}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{targetUser.email}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-4 px-6 border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-600">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 border-b-2 transition ${
              activeTab === 'overview' ? 'border-emerald-600 text-emerald-700 font-black' : 'border-transparent'
            }`}
          >
            সারসংক্ষেপ ও রিসোর্স
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`py-3 border-b-2 transition ${
              activeTab === 'payments' ? 'border-emerald-600 text-emerald-700 font-black' : 'border-transparent'
            }`}
          >
            পেমেন্ট হিস্ট্রি ({userPayments.length})
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`py-3 border-b-2 transition ${
              activeTab === 'notes' ? 'border-emerald-600 text-emerald-700 font-black' : 'border-transparent'
            }`}
          >
            অ্যাডমিন নোটস
          </button>
        </div>

        {/* Body content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700 flex-1">
          {activeTab === 'overview' && (
            <>
              {/* Top 2 Cards: User & Shop Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* User Info */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    <span>ইউজার তথ্য</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">নাম:</span>
                    <strong className="text-slate-900">{targetUser.full_name}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">ইমেইল:</span>
                    <strong className="text-slate-900 font-mono">{targetUser.email}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">মোবাইল:</span>
                    <strong className="text-slate-900 font-mono">{targetUser.phone || 'N/A'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">রজিস্ট্রেশন:</span>
                    <span>{new Date(targetUser.created_at || Date.now()).toLocaleDateString('bn-BD')}</span>
                  </div>
                </div>

                {/* Shop Info */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5" />
                    <span>শপ তথ্য</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">শপের নাম:</span>
                    <strong className="text-slate-900">{targetShop.name}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">ক্যাটাগরি:</span>
                    <span>{targetShop.category || 'Online Shop'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">ফেসবুক পেজ:</span>
                    <span className="text-blue-600 truncate max-w-[150px]">{targetShop.fb_page_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">শপ ফোন:</span>
                    <span className="font-mono">{targetShop.phone || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Subscription Card */}
              <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>বর্তমান সাবস্ক্রিপশন প্ল্যান</span>
                  </span>
                  <span className="font-bold text-xs bg-emerald-200/80 text-emerald-900 px-2.5 py-0.5 rounded-full">
                    {targetShop.subscription_status.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px]">প্ল্যানের নাম</span>
                    <strong className="text-slate-900 capitalize">{targetShop.subscription_plan}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">মেয়াদ শেষ</span>
                    <strong className="text-slate-900 font-mono">
                      {new Date(targetShop.subscription_expires_at).toLocaleDateString('bn-BD')}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">দিন বাকি</span>
                    <strong className="text-emerald-700 font-bold">{daysLeft} দিন</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">অ্যাকাউন্ট স্ট্যাটাস</span>
                    <strong className={isSuspended ? 'text-rose-600' : 'text-emerald-600'}>
                      {isSuspended ? 'স্থগিত' : 'সক্রিয়'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Usage Metrics */}
              <div>
                <div className="font-bold text-slate-900 text-xs mb-2">রিসোর্স ও ব্যবহার পরিসংখ্যান:</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-white border border-slate-200 rounded-xl">
                    <span className="text-[11px] text-slate-500">মোট অর্ডার</span>
                    <div className="text-xl font-bold text-slate-900">{userOrders.length} টি</div>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded-xl">
                    <span className="text-[11px] text-slate-500">কাস্টমার সংখ্যা</span>
                    <div className="text-xl font-bold text-slate-900">{userCustomers.length} জন</div>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded-xl">
                    <span className="text-[11px] text-slate-500">স্টক প্রোডাক্ট</span>
                    <div className="text-xl font-bold text-slate-900">{userProducts.length} টি</div>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded-xl">
                    <span className="text-[11px] text-slate-500">AI পার্স লগ</span>
                    <div className="text-xl font-bold text-slate-900">{userAILogs.length} বার</div>
                  </div>
                </div>
              </div>

              {/* Admin Actions Row */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="font-bold text-slate-900 text-xs">অ্যাডমিন অ্যাকশন প্যানেল:</div>
                <div className="flex flex-wrap items-center gap-2">
                  {/* Activate Subscription */}
                  {targetShop.subscription_status !== 'active' && (
                    <button
                      type="button"
                      onClick={async () => {
                        if (confirm('এই ব্যবহারকারীর সাবস্ক্রিপশন অবিলম্বে সক্রিয় করতে চান?')) {
                          await activateSubscription(targetShop.id);
                        }
                      }}
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl transition flex items-center gap-1.5 text-xs shadow-xs"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                      <span>সরাসরি অ্যাক্টিভ করুন</span>
                    </button>
                  )}

                  {/* Extend Subscription */}
                  <button
                    type="button"
                    onClick={() => {
                      const days = prompt('কত দিন বৃদ্ধি করতে চান?', '30');
                      if (days) extendSubscription(targetShop.id, parseInt(days, 10), 'Admin user modal extension');
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition flex items-center gap-1.5 text-xs"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>মেয়াদ বৃদ্ধি</span>
                  </button>

                  {/* Change Plan */}
                  <button
                    type="button"
                    onClick={() => {
                      const p = prompt('নতুন প্ল্যান লিখুন (free_trial, founder, standard, growth):', targetShop.subscription_plan);
                      if (p) changeUserPlan(targetShop.id, p);
                    }}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition flex items-center gap-1.5 text-xs"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>প্ল্যান পরিবর্তন</span>
                  </button>

                  {/* Cancel Subscription */}
                  {targetShop.subscription_status === 'active' && (
                    <button
                      type="button"
                      onClick={async () => {
                        const r = prompt('সাবস্ক্রিপশন বাতিলের কারণ লিখুন:');
                        if (r) await cancelSubscription(targetShop.id, r);
                      }}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition flex items-center gap-1.5 text-xs"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>সাবস্ক্রিপশন বাতিল</span>
                    </button>
                  )}

                  {/* Suspend / Reactivate */}
                  {isSuspended ? (
                    <button
                      type="button"
                      onClick={() => reactivateUser(targetUser.id)}
                      className="px-3 py-1.5 bg-emerald-100 text-emerald-800 hover:bg-emerald-200 font-bold rounded-xl transition flex items-center gap-1.5"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      <span>অ্যাকাউন্ট সচল করুন</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        const r = prompt('সাসপেনশনের কারণ লিখুন:', 'নিয়ম লঙ্ঘনের কারণে স্থগিত');
                        if (r) suspendUser(targetUser.id, r);
                      }}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition flex items-center gap-1.5"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>অ্যাকাউন্ট স্থগিত</span>
                    </button>
                  )}
                </div>
              </div>
            </>
          )}

          {activeTab === 'payments' && (
            <div className="space-y-3">
              <div className="font-bold text-slate-900 text-xs">এই ইউজারের পেমেন্ট ইতিহাস:</div>
              {userPayments.length === 0 ? (
                <div className="p-8 text-center text-slate-400">কোনো পেমেন্ট রেকর্ড পাওয়া যায়নি।</div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                  {userPayments.map(p => (
                    <div key={p.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50">
                      <div>
                        <div className="font-bold text-slate-900">
                          {p.plan_name} — {formatBDT(p.amount)}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          TrxID: {p.transaction_id} | মেথড: {p.payment_method} ({p.sender_phone})
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            p.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : p.status === 'rejected'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {p.status}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-1">
                          {new Date(p.created_at).toLocaleDateString('bn-BD')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-4">
              <div className="font-bold text-slate-900 text-xs">অ্যাডমিন নোটস ও মন্তব্য:</div>
              {targetUser.admin_notes ? (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl whitespace-pre-line text-xs text-slate-700">
                  {targetUser.admin_notes}
                </div>
              ) : (
                <div className="p-4 text-slate-400 text-xs">এখনও কোনো নোট লেখা হয়নি।</div>
              )}

              <div className="space-y-2">
                <textarea
                  rows={3}
                  value={noteInput}
                  onChange={e => setNoteInput(e.target.value)}
                  placeholder="নতুন নোট যোগ করুন..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                />
                <button
                  type="button"
                  onClick={handleSaveNote}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl"
                >
                  নোট সেভ করুন
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
