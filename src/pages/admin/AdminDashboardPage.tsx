import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatBDT } from '../../utils/calculations';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import {
  Users,
  CreditCard,
  TrendingUp,
  Clock,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight,
  DollarSign,
  Calendar,
  Eye,
  Check,
  X,
  Store,
  Layers,
  FileText,
  LogOut,
} from 'lucide-react';
import { PaymentVerification } from '../../types';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface AdminDashboardPageProps {
  onNavigateAdmin: (subpage: string) => void;
  onOpenUserDetail?: (userId: string) => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  onNavigateAdmin,
  onOpenUserDetail,
}) => {
  const {
    adminUsers,
    adminPayments,
    adminSubscriptions,
    adminAuditLogs,
    adminSettings,
    approvePayment,
    rejectPayment,
    signOut,
  } = useApp();

  // Approve / Reject modal states
  const [approvingPayment, setApprovingPayment] = useState<PaymentVerification | null>(null);
  const [rejectingPayment, setRejectingPayment] = useState<PaymentVerification | null>(null);
  const [rejectionReason, setRejectionReason] = useState('ট্রানজ্যাকশন আইডি সঠিক পাওয়া যায়নি।');
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // High-level KPI Computations
  const totalUsers = adminUsers.length;
  const activeUsers = adminUsers.filter(u => u.account_status === 'active').length;
  const suspendedUsers = adminUsers.filter(u => u.account_status === 'suspended').length;
  
  const pendingPayments = adminPayments.filter(p => p.status === 'pending');
  const approvedPayments = adminPayments.filter(p => p.status === 'approved');

  // Revenue calculation: ONLY approved payments count
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const thisMonthRevenue = approvedPayments
    .filter(p => {
      const d = new Date(p.approved_at || p.created_at);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const totalAllTimeRevenue = approvedPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  // Subscriptions counts
  const activeSubscriptions = adminSubscriptions.filter(s => s.status === 'active').length;
  const trialSubscriptions = adminSubscriptions.filter(s => s.status === 'trial').length;
  const expiredSubscriptions = adminSubscriptions.filter(s => s.status === 'expired').length;

  const handleConfirmApprove = async () => {
    if (!approvingPayment) return;
    setIsProcessing(true);
    setActionError(null);
    try {
      await approvePayment(approvingPayment.id);
      setApprovingPayment(null);
      setActionSuccess('পেমেন্ট সফলভাবে অনুমোদিত হয়েছে এবং সাবস্ক্রিপশন সক্রিয় করা হয়েছে।');
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      setActionError(err?.message || 'পেমেন্ট অনুমোদন করতে সমস্যা হয়েছে।');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingPayment) return;
    setIsProcessing(true);
    setActionError(null);
    try {
      await rejectPayment(rejectingPayment.id, rejectionReason);
      setRejectingPayment(null);
      setRejectionReason('ট্রানজ্যাকশন আইডি সঠিক পাওয়া যায়নি।');
      setActionSuccess('পেমেন্ট রিকোয়েস্ট বাতিল করা হয়েছে।');
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      setActionError(err?.message || 'পেমেন্ট বাতিল করতে সমস্যা হয়েছে।');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Breadcrumb pageName="অ্যাডমিন ড্যাশবোর্ড" parentName="Admin Control" />

      {/* Action Alerts */}
      {actionError && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-2xl flex items-center justify-between animate-in fade-in duration-150">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-rose-500 hover:text-rose-800">✕</button>
        </div>
      )}
      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center justify-between animate-in fade-in duration-150">
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-500 hover:text-emerald-800">✕</button>
        </div>
      )}

      {/* Admin Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900">অ্যাডমিন কন্ট্রোল সেন্টার</h1>
            <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-200">
              HQ MASTER
            </span>
          </div>
          <p className="text-sm text-slate-500">
            সমগ্র BikriPilot অ্যাপ্লিকেশনের ব্যবহারকারী, সাবস্ক্রিপশন, পেমেন্ট অনুমোদন ও রাজস্ব অডিট
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateAdmin('admin-payments')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
          >
            <Clock className="w-4 h-4" />
            <span>পেন্ডিং পেমেন্ট ({pendingPayments.length})</span>
          </button>

          <button
            onClick={async () => {
              await signOut();
              window.location.href = '/login';
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-rose-950/80 text-rose-300 hover:text-rose-200 border border-slate-700 hover:border-rose-800 font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
            title="সিস্টেম অ্যাডমিন থেকে সম্পূর্ণ নিরাপদ লগআউট"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400" />
            <span>নিরাপদ প্রস্থান (Secure Logout)</span>
          </button>
        </div>
      </div>

      {/* 8 KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Users */}
        <div
          onClick={() => onNavigateAdmin('admin-users')}
          className="bg-white rounded-3xl border border-slate-200 p-4.5 shadow-xs hover:border-slate-300 transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">মোট ইউজার</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{totalUsers} জন</div>
          <div className="text-[11px] text-slate-400 mt-1">সর্বমোট নিবন্ধিত সেলার</div>
        </div>

        {/* Active Users */}
        <div
          onClick={() => onNavigateAdmin('admin-users')}
          className="bg-white rounded-3xl border border-slate-200 p-4.5 shadow-xs hover:border-slate-300 transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700">সক্রিয় ইউজার</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-2">{activeUsers} জন</div>
          <div className="text-[11px] text-emerald-600 mt-1">অ্যাকাউন্ট ভ্যালিড ও আনলক</div>
        </div>

        {/* Trial Users */}
        <div
          onClick={() => onNavigateAdmin('admin-subscriptions')}
          className="bg-white rounded-3xl border border-slate-200 p-4.5 shadow-xs hover:border-slate-300 transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-700">ট্রায়াল ইউজার</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-700 mt-2">{trialSubscriptions} জন</div>
          <div className="text-[11px] text-purple-600 mt-1">১৪ দিনের ফ্রি ট্রায়াল চলছে</div>
        </div>

        {/* Pending Payments */}
        <div
          onClick={() => onNavigateAdmin('admin-payments')}
          className="bg-white rounded-3xl border border-slate-200 p-4.5 shadow-xs hover:border-slate-300 transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700">পেন্ডিং পেমেন্ট</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 mt-2">{pendingPayments.length} টি</div>
          <div className="text-[11px] text-amber-700 font-semibold mt-1">অনুমোদনের অপেক্ষায়</div>
        </div>

        {/* Active Subscriptions */}
        <div
          onClick={() => onNavigateAdmin('admin-subscriptions')}
          className="bg-white rounded-3xl border border-slate-200 p-4.5 shadow-xs hover:border-slate-300 transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800">সক্রিয় সাবস্ক্রিপশন</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-800 mt-2">{activeSubscriptions} টি</div>
          <div className="text-[11px] text-emerald-700 mt-1">পেইড ও সচল লাইসেন্স</div>
        </div>

        {/* Expired Subscriptions */}
        <div
          onClick={() => onNavigateAdmin('admin-subscriptions')}
          className="bg-white rounded-3xl border border-slate-200 p-4.5 shadow-xs hover:border-slate-300 transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-700">মেয়াদোত্তীর্ণ</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600 mt-2">{expiredSubscriptions} টি</div>
          <div className="text-[11px] text-rose-500 mt-1">রিনিউয়াল প্রয়োজন</div>
        </div>

        {/* Suspended Users */}
        <div
          onClick={() => onNavigateAdmin('admin-users')}
          className="bg-white rounded-3xl border border-slate-200 p-4.5 shadow-xs hover:border-slate-300 transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-700">স্থগিত ইউজার</span>
            <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-red-700 mt-2">{suspendedUsers} জন</div>
          <div className="text-[11px] text-red-500 mt-1">নিয়ম লঙ্ঘনে সাসপেন্ডেড</div>
        </div>

        {/* Revenue This Month */}
        <div className="bg-white rounded-3xl border border-slate-200 p-4.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-teal-800">চলতি মাসের রাজস্ব</span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{formatBDT(thisMonthRevenue)}</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">
            মোট আয়: {formatBDT(totalAllTimeRevenue)}
          </div>
        </div>
      </div>

      {/* Revenue & Subscription Performance Chart */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-base text-slate-900">মাসিক রাজস্ব ও পেইড সাবস্ক্রিপশন ট্রেন্ড</h3>
            <p className="text-xs text-slate-500">অনুমোদিত পেমেন্ট এবং সক্রিয় মার্চেন্ট লাইসেন্স গ্রাফ</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5 text-emerald-700">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span>রাজস্ব (টাকা)</span>
            </div>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={[
                { month: 'মে', revenue: 99, subs: 1 },
                { month: 'জুন', revenue: 348, subs: 2 },
                { month: 'জুলাই', revenue: 597, subs: 3 },
                { month: 'আগস্ট', revenue: 846, subs: 4 },
                { month: 'সেপ্টেম্বর', revenue: 1095, subs: 5 },
                { month: 'অক্টোবর', revenue: thisMonthRevenue || 990, subs: activeSubscriptions || 4 },
              ]}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="adminRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} tickFormatter={(v) => `৳${v}`} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 12, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(val: any) => [`৳${val}`, 'রাজস্ব']}
              />
              <Area type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#adminRevenueGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Pending Payment Requests Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            <h3 className="font-bold text-sm text-slate-900">অনুমোদনের অপেক্ষায় থাকা পেমেন্ট রিকোয়েস্ট</h3>
          </div>
          <button
            onClick={() => onNavigateAdmin('admin-payments')}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            <span>সবগুলো দেখুন ({pendingPayments.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {pendingPayments.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            এই মুহূর্তে কোনো পেন্ডিং পেমেন্ট রিকোয়েস্ট নেই। সমস্ত পেমেন্ট ভেরিফাইড!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">জমার সময়</th>
                  <th className="py-3 px-4">ইউজার ও শপ</th>
                  <th className="py-3 px-4">প্ল্যান</th>
                  <th className="py-3 px-4">টাকার পরিমাণ</th>
                  <th className="py-3 px-4">মেথড ও নম্বর</th>
                  <th className="py-3 px-4">TrxID</th>
                  <th className="py-3 px-4 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingPayments.slice(0, 5).map(pay => {
                  return (
                    <tr key={pay.id} className="hover:bg-slate-50/80">
                      <td className="py-3.5 px-4 text-slate-500">
                        {new Date(pay.created_at).toLocaleString('bn-BD')}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{pay.sender_phone}</div>
                        <div className="text-[11px] text-slate-400">শপ: {pay.shop_id}</div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        {pay.plan_name}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 font-mono">
                        {formatBDT(pay.amount)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-700">{pay.payment_method}</span>
                        <div className="font-mono text-slate-500 text-[11px]">{pay.sender_phone}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-700 bg-amber-50/50 px-2 py-1 rounded">
                        {pay.transaction_id}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setApprovingPayment(pay)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition"
                          >
                            অনুমোদন
                          </button>
                          <button
                            type="button"
                            onClick={() => setRejectingPayment(pay)}
                            className="px-3 py-1 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 font-bold rounded-lg text-xs transition"
                          >
                            বাতিল
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

      {/* Two Columns: Recent Registrations & Recent Audit Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recently Registered Users */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span>সাম্প্রতিক নিবন্ধিত বিক্রেতা</span>
            </h3>
            <button
              onClick={() => onNavigateAdmin('admin-users')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700"
            >
              সবগুলো
            </button>
          </div>

          <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
            {adminUsers.slice(0, 5).map(u => (
              <div
                key={u.id}
                onClick={() => onOpenUserDetail && onOpenUserDetail(u.id)}
                className="p-4 hover:bg-slate-50 transition cursor-pointer flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900">{u.full_name}</div>
                  <div className="text-slate-500 font-mono text-[11px]">{u.email}</div>
                </div>

                <div className="text-right">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      u.account_status === 'suspended'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {u.account_status === 'suspended' ? 'স্থগিত' : 'সক্রিয়'}
                  </span>
                  <div className="text-[10px] text-slate-400 mt-1">রোল: {u.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Admin Audit Logs */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>সাম্প্রতিক অ্যাডমিন অডিট অ্যাকশন</span>
            </h3>
            <button
              onClick={() => onNavigateAdmin('admin-audit-logs')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800"
            >
              সব লগ
            </button>
          </div>

          <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto text-xs">
            {adminAuditLogs.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                কোনো অডিট লগ রেকর্ড নেই।
              </div>
            ) : (
              adminAuditLogs.slice(0, 5).map(log => (
                <div key={log.id} className="p-3.5 hover:bg-slate-50 transition space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{log.action}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(log.created_at).toLocaleTimeString('bn-BD')}
                    </span>
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    এনটিটি: <span className="font-mono text-slate-700">{log.target_entity} ({log.target_entity_id})</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Two Columns: Expiring Subscriptions & Recent Activations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expiring Subscriptions */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-600" />
              <span>শীঘ্রই মেয়াদোত্তীর্ণ হতে যাওয়া সাবস্ক্রিপশন (৭ দিন)</span>
            </h3>
            <button
              onClick={() => onNavigateAdmin('admin-subscriptions')}
              className="text-xs font-bold text-amber-700 hover:text-amber-800"
            >
              সবগুলো
            </button>
          </div>

          <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto text-xs">
            {adminSubscriptions.filter(s => {
              const diff = new Date(s.expires_at).getTime() - Date.now();
              return diff > 0 && diff <= 7 * 24 * 60 * 60 * 1000;
            }).length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                আগামী ৭ দিনের মধ্যে মেয়াদ শেষ হওয়ার কোনো সাবস্ক্রিপশন নেই।
              </div>
            ) : (
              adminSubscriptions
                .filter(s => {
                  const diff = new Date(s.expires_at).getTime() - Date.now();
                  return diff > 0 && diff <= 7 * 24 * 60 * 60 * 1000;
                })
                .map(sub => {
                  const daysRemaining = Math.max(0, Math.ceil((new Date(sub.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
                  return (
                    <div key={sub.id} className="p-3.5 hover:bg-slate-50 transition flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-900">শপ আইডি: {sub.shop_id}</div>
                        <div className="text-[11px] text-slate-500">প্ল্যান: {sub.plan_id}</div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full text-[10px] border border-amber-200">
                          আর {daysRemaining} দিন বাকি
                        </span>
                        <div className="text-[10px] text-slate-400 mt-1">
                          মেয়াদ: {new Date(sub.expires_at).toLocaleDateString('bn-BD')}
                        </div>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>

        {/* Recent Activations */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>সাম্প্রতিক সক্রিয় সাবস্ক্রিপশন</span>
            </h3>
            <button
              onClick={() => onNavigateAdmin('admin-subscriptions')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800"
            >
              সবগুলো
            </button>
          </div>

          <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto text-xs">
            {adminSubscriptions.filter(s => s.status === 'active').slice(0, 5).map(sub => (
              <div key={sub.id} className="p-3.5 hover:bg-slate-50 transition flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">{sub.shop_id}</div>
                  <div className="text-[11px] text-slate-500 font-mono">প্ল্যান: {sub.plan_id}</div>
                </div>
                <div className="text-right">
                  <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full text-[10px]">
                    সক্রিয়
                  </span>
                  <div className="text-[10px] text-slate-400 mt-1">
                    শুরু: {new Date(sub.started_at || sub.created_at).toLocaleDateString('bn-BD')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Confirmation Dialog: Approve Payment */}
      {approvingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4 text-left animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">পেমেন্ট অনুমোদন নিশ্চিতকরণ</h3>
                <p className="text-xs text-slate-500">Are you sure you want to approve this payment?</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">প্ল্যান:</span>
                <span className="font-bold text-slate-900">{approvingPayment.plan_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">টাকা:</span>
                <span className="font-bold text-emerald-700">{formatBDT(approvingPayment.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">TrxID:</span>
                <span className="font-mono font-bold text-slate-900">{approvingPayment.transaction_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">নম্বর:</span>
                <span className="font-mono text-slate-700">{approvingPayment.sender_phone}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              অনুমোদন করার সাথে সাথে ইউজারের সাবস্ক্রিপশন সচল হবে এবং বর্তমান মেয়াদের সাথে প্ল্যানের দিন যুক্ত হবে।
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setApprovingPayment(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                বাতিল
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleConfirmApprove}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
              >
                {isProcessing ? 'প্রসেসিং...' : 'হ্যাঁ, অনুমোদন করুন'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog: Reject Payment */}
      {rejectingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4 text-left animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">পেমেন্ট রিকোয়েস্ট বাতিল করুন</h3>
                <p className="text-xs text-slate-500">বাতিল করার কারণ উল্লেখ করুন যা গ্রাহককে জানানো হবে</p>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="font-bold text-slate-700 block">বাতিল করার কারণ *</label>
              <select
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs"
              >
                <option value="ট্রানজ্যাকশন আইডি সঠিক পাওয়া যায়নি।">ট্রানজ্যাকশন আইডি সঠিক পাওয়া যায়নি (Invalid TrxID)</option>
                <option value="টাকার পরিমাণ ভুল বা অপর্যাপ্ত।">টাকার পরিমাণ ভুল বা অপর্যাপ্ত (Amount incorrect)</option>
                <option value="পেমেন্ট আমাদের অ্যাকাউন্টে জমা হয়নি।">পেমেন্ট জমা হয়নি (Payment not received)</option>
                <option value="ডুপ্লিকেট ট্রানজ্যাকশন আইডি সাবমিশন।">ডুপ্লিকেট ট্রানজ্যাকশন (Duplicate TrxID)</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setRejectingPayment(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                বন্ধ করুন
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleConfirmReject}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
              >
                {isProcessing ? 'প্রসেসিং...' : 'বাতিল নিশ্চিত করুন'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
