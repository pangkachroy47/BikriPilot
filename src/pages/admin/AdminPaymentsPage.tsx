import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { PaymentVerification, PaymentStatus } from '../../types';
import { formatBDT } from '../../utils/calculations';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import {
  CreditCard,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Check,
  X,
  Eye,
  AlertTriangle,
  Calendar,
  DollarSign,
} from 'lucide-react';

export const AdminPaymentsPage: React.FC = () => {
  const { adminPayments, approvePayment, rejectPayment } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // Modal states
  const [approvingPayment, setApprovingPayment] = useState<PaymentVerification | null>(null);
  const [rejectingPayment, setRejectingPayment] = useState<PaymentVerification | null>(null);
  const [rejectionReason, setRejectionReason] = useState('ট্রানজ্যাকশন আইডি সঠিক নয় (Invalid TrxID)');
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Filtered payments
  const filteredPayments = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return adminPayments.filter(p => {
      const matchSearch =
        p.transaction_id.toLowerCase().includes(q) ||
        p.sender_phone.includes(q) ||
        p.shop_id.toLowerCase().includes(q) ||
        p.plan_name.toLowerCase().includes(q);

      if (!matchSearch) return false;
      if (statusFilter === 'all') return true;
      return p.status === statusFilter;
    });
  }, [adminPayments, searchQuery, statusFilter]);

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
      setActionError(err?.message || 'অনুমোদন করতে সমস্যা হয়েছে।');
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
      setRejectionReason('ট্রানজ্যাকশন আইডি সঠিক নয় (Invalid TrxID)');
      setActionSuccess('পেমেন্ট রিকোয়েস্ট বাতিল করা হয়েছে।');
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      setActionError(err?.message || 'বাতিল করতে সমস্যা হয়েছে।');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Breadcrumb pageName="পেমেন্ট রিকোয়েস্ট ও অনুমোদন" parentName="Admin Control" />

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

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">পেমেন্ট রিকোয়েস্ট ও যাচাইকরণ</h1>
        <p className="text-sm text-slate-500">
          গ্রাহকদের সাবমিট করা বিকাশ ও নগদ ট্রানজ্যাকশন আইডি যাচাই ও অ্যাকাউন্ট সক্রিয় করুন
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
            placeholder="TrxID, মোবাইল নম্বর অথবা শপ আইডি দিয়ে খুঁজুন..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 text-xs">
          {(['all', 'pending', 'approved', 'rejected'] as const).map(tab => (
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
                : tab === 'pending'
                ? 'অপেক্ষমান (Pending)'
                : tab === 'approved'
                ? 'অনুমোদিত'
                : 'বাতিল'}
            </button>
          ))}
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredPayments.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            কোনো পেমেন্ট রিকোয়েস্ট পাওয়া যায়নি।
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">জমার সময়</th>
                  <th className="py-3.5 px-4">শপ / ইউজার</th>
                  <th className="py-3.5 px-4">প্ল্যান</th>
                  <th className="py-3.5 px-4">টাকা</th>
                  <th className="py-3.5 px-4">মেথড ও নম্বর</th>
                  <th className="py-3.5 px-4">TrxID</th>
                  <th className="py-3.5 px-4">স্ক্রিনশট</th>
                  <th className="py-3.5 px-4">স্ট্যাটাস</th>
                  <th className="py-3.5 px-4 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayments.map(pay => {
                  return (
                    <tr key={pay.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 text-slate-500">
                        {new Date(pay.created_at).toLocaleString('bn-BD')}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{pay.shop_id}</div>
                        <div className="text-[10px] text-slate-400">{pay.user_id}</div>
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

                      <td className="py-3.5 px-4 font-mono font-bold text-amber-800 bg-amber-50/60 px-2.5 py-1 rounded-lg inline-block my-2">
                        {pay.transaction_id}
                      </td>

                      <td className="py-3.5 px-4">
                        {pay.screenshot_url ? (
                          <button
                            type="button"
                            onClick={() => setScreenshotPreview(pay.screenshot_url!)}
                            className="text-emerald-700 hover:underline flex items-center gap-1 font-semibold"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>দেখুন</span>
                          </button>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                            pay.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : pay.status === 'rejected'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {pay.status === 'approved' && <CheckCircle2 className="w-3 h-3" />}
                          {pay.status === 'pending' && <Clock className="w-3 h-3" />}
                          {pay.status === 'rejected' && <XCircle className="w-3 h-3" />}
                          <span>
                            {pay.status === 'approved' ? 'অনুমোদিত' : pay.status === 'rejected' ? 'বাতিল' : 'পেন্ডিং'}
                          </span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {pay.status === 'pending' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setApprovingPayment(pay)}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition shadow-xs"
                            >
                              অনুমোদন
                            </button>
                            <button
                              type="button"
                              onClick={() => setRejectingPayment(pay)}
                              className="px-3 py-1 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 font-bold rounded-lg text-xs transition"
                            >
                              বাতিল
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">প্রসেসড</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Screenshot Preview */}
      {screenshotPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs">
          <div className="relative max-w-lg w-full bg-white rounded-3xl p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="font-bold text-xs text-slate-900">পেমেন্ট স্ক্রিনশট প্রিভিউ</span>
              <button
                onClick={() => setScreenshotPreview(null)}
                className="p-1 text-slate-400 hover:text-slate-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <img
              src={screenshotPreview}
              alt="Payment proof"
              className="w-full max-h-[70vh] object-contain rounded-2xl border border-slate-200"
            />
          </div>
        </div>
      )}

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
                <span className="text-slate-500">টাকার পরিমাণ:</span>
                <span className="font-bold text-emerald-700">{formatBDT(approvingPayment.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">TrxID:</span>
                <span className="font-mono font-bold text-slate-900">{approvingPayment.transaction_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">প্রেরক নম্বর:</span>
                <span className="font-mono text-slate-700">{approvingPayment.sender_phone}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              অনুমোদন সম্পন্ন হলে স্বয়ংক্রিয়ভাবে অডিট লগ তৈরি হবে এবং বর্তমান সাবস্ক্রিপশনের মেয়াদ বৃদ্ধি করা হবে।
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setApprovingPayment(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                বাতিল
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleConfirmApprove}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs"
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
                <p className="text-xs text-slate-500">বাতিল করার সুনির্দিষ্ট কারণ উল্লেখ করুন</p>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="font-bold text-slate-700 block">বাতিল করার কারণ *</label>
              <select
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
              >
                <option value="ট্রানজ্যাকশন আইডি সঠিক নয় (Invalid TrxID)">ট্রানজ্যাকশন আইডি সঠিক পাওয়া যায়নি</option>
                <option value="টাকার পরিমাণ ভুল বা অপর্যাপ্ত (Amount incorrect)">টাকার পরিমাণ ভুল বা অপর্যাপ্ত</option>
                <option value="পেমেন্ট আমাদের অ্যাকাউন্টে জমা হয়নি (Payment not received)">পেমেন্ট জমা হয়নি</option>
                <option value="ডুপ্লিকেট ট্রানজ্যাকশন আইডি (Duplicate TrxID)">ডুপ্লিকেট ট্রানজ্যাকশন সাবমিশন</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setRejectingPayment(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                বন্ধ করুন
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleConfirmReject}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs"
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
