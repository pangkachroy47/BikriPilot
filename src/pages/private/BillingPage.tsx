import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SUBSCRIPTION_PLANS } from '../../config/plans';
import { SubscriptionPlanId, PaymentVerification } from '../../types';
import { formatBDT } from '../../utils/calculations';
import { checkSubscriptionAccess } from '../../utils/accessControl';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import {
  CreditCard,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Zap,
  Check,
  Copy,
  ExternalLink,
  ShieldCheck,
  Tag,
  ArrowRight,
  Info,
} from 'lucide-react';

interface BillingPageProps {
  onNavigate?: (page: string) => void;
}

export const BillingPage: React.FC<BillingPageProps> = ({ onNavigate }) => {
  const {
    currentShop,
    currentUser,
    paymentVerifications,
    submitSubscriptionPayment,
    adminSettings,
    coupons,
  } = useApp();

  const access = checkSubscriptionAccess(currentShop, currentUser);
  const currentPlan = SUBSCRIPTION_PLANS.find(p => p.id === currentShop.subscription_plan) || SUBSCRIPTION_PLANS[0];

  // Payment form state
  const [selectedPlanId, setSelectedPlanId] = useState<SubscriptionPlanId>('founder');
  const [paymentMethod, setPaymentMethod] = useState<'bKash' | 'Nagad' | 'Rocket'>('bKash');
  const [senderPhone, setSenderPhone] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [customerNote, setCustomerNote] = useState('');
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // Coupon code state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountAmount: number } | null>(null);
  const [couponError, setCouponError] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const targetPlan = SUBSCRIPTION_PLANS.find(p => p.id === selectedPlanId) || SUBSCRIPTION_PLANS[1];

  // Calculate final payable amount
  const basePrice = targetPlan.priceBDT;
  const finalPrice = appliedCoupon ? Math.max(0, basePrice - appliedCoupon.discountAmount) : basePrice;

  // Filter payments for this user/shop
  const myPayments = paymentVerifications.filter(p => p.shop_id === currentShop.id);
  const hasPendingPayment = myPayments.some(p => p.status === 'pending');

  const handleCopyPaymentNumber = () => {
    const num = adminSettings?.payment_number || '01712345678';
    navigator.clipboard.writeText(num);
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 2000);
  };

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    if (!couponCode.trim()) return;

    const codeUpper = couponCode.trim().toUpperCase();
    const found = coupons?.find(c => c.code.toUpperCase() === codeUpper && c.is_active);

    if (!found) {
      setCouponError('কুপন কোডটি সঠিক নয় বা এর মেয়াদ শেষ।');
      return;
    }

    if (new Date(found.expires_at).getTime() < Date.now()) {
      setCouponError('এই কুপনটির মেয়াদ উত্তীর্ণ হয়েছে।');
      return;
    }

    if (found.used_count >= found.max_uses) {
      setCouponError('এই কুপনটির ব্যবহারের সর্বোচ্চ সীমা শেষ।');
      return;
    }

    let discount = 0;
    if (found.discount_type === 'percentage') {
      discount = Math.round((basePrice * found.discount_value) / 100);
    } else {
      discount = Math.min(basePrice, found.discount_value);
    }

    setAppliedCoupon({ code: found.code, discountAmount: discount });
  };

  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderPhone.trim()) {
      setFormError('যে নম্বর থেকে পেমেন্ট করেছেন তা লিখুন।');
      return;
    }
    if (!transactionId.trim()) {
      setFormError('সঠিক ট্রানজ্যাকশন আইডি (TrxID) লিখুন।');
      return;
    }
    setFormError(null);

    submitSubscriptionPayment({
      plan_name: selectedPlanId,
      amount: finalPrice,
      payment_method: paymentMethod,
      payment_number: senderPhone.trim(),
      sender_phone: senderPhone.trim(),
      transaction_id: transactionId.trim().toUpperCase(),
      screenshot_url: screenshotUrl.trim() || undefined,
      customer_note: customerNote.trim() || undefined,
    });

    setSubmittedSuccess(true);
    setTransactionId('');
    setSenderPhone('');
    setScreenshotUrl('');
    setCustomerNote('');
    setAppliedCoupon(null);
    setCouponCode('');
  };

  return (
    <div className="space-y-6">
      <Breadcrumb pageName="সাবস্ক্রিপশন ও বিলিং" parentName="BikriPilot" />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">সাবস্ক্রিপশন ও বিলিং পোর্টাল</h1>
        <p className="text-sm text-slate-500">
          আপনার প্ল্যানের স্থিতি, পেমেন্ট সাবমিশন ও ভেরিফিকেশন হিস্ট্রি
        </p>
      </div>

      {/* Current Subscription Status Card */}
      <div className="bg-[#1C2434] text-white rounded-3xl p-6 sm:p-7 border border-[#2E3A4B] shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${access.badgeColor}`}>
                {access.title}
              </span>
              {currentPlan.badge && (
                <span className="text-[11px] font-bold bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full">
                  {currentPlan.badge}
                </span>
              )}
            </div>

            <h2 className="text-2xl sm:text-3xl font-black mt-2 flex items-center gap-2">
              <span>{currentPlan.nameBn}</span>
              <span className="text-xs font-mono text-slate-400 font-normal">({currentPlan.name})</span>
            </h2>

            <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
              {access.message}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-2 bg-[#141B26]/80 p-4 rounded-2xl border border-[#2E3A4B]">
            <div className="text-xs text-slate-400">
              মেয়াদ শেষ: <strong className="text-white font-mono">{new Date(currentShop.subscription_expires_at).toLocaleDateString('bn-BD')}</strong>
            </div>
            <div className="text-xs text-slate-400">
              বাকি আছে: <strong className="text-emerald-400 font-bold">{access.daysRemaining} দিন</strong>
            </div>
            <div className="text-[11px] text-slate-500">
              শপ: {currentShop.name}
            </div>
          </div>
        </div>

        {/* Feature bullets */}
        <div className="mt-5 pt-4 border-t border-[#2E3A4B] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-xs text-slate-300">
          {currentPlan.features.slice(0, 4).map((f, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Pending Payment Alert if any */}
      {hasPendingPayment && (
        <div className="p-4 sm:p-5 bg-amber-50 border border-amber-200 rounded-3xl flex items-start gap-3.5 text-amber-900 shadow-xs">
          <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
          <div className="space-y-1 text-xs">
            <h4 className="font-bold text-sm text-amber-950">পেমেন্ট ভেরিফিকেশন প্রক্রিয়াধীন রয়েছে</h4>
            <p className="text-amber-800 leading-relaxed">
              আপনার জমা দেওয়া পেমেন্ট রিকোয়েস্টটি আমাদের অ্যাডমিন টিম যাচাই করছে। সাধারণ কার্যসময়ে ৩-১০ মিনিটের মধ্যে ভেরিফাই সম্পন্ন হয়। অনুমোদনের পর সাথে সাথে প্রিমিয়াম ফিচার আনলক হয়ে যাবে।
            </p>
          </div>
        </div>
      )}

      {/* Submission Success Banner */}
      {submittedSuccess && (
        <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-3xl flex items-start gap-3.5 text-emerald-900 shadow-xs animate-in fade-in duration-200">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
          <div className="space-y-1 text-xs">
            <h4 className="font-bold text-sm text-emerald-950">আপনার পেমেন্ট রিকোয়েস্ট সফলভাবে জমা হয়েছে!</h4>
            <p className="text-emerald-800 leading-relaxed">
              Admin verification-এর পর আপনার subscription active হবে। ট্রানজ্যাকশন স্ট্যাটাস নিচের পেমেন্ট হিস্ট্রি টেবিল থেকে দেখতে পারবেন।
            </p>
          </div>
        </div>
      )}

      {/* Payment Instructions & Submission Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Plan Selection and Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Plan Picker */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              <span>১. সাবস্ক্রিপশন প্ল্যান নির্বাচন করুন</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {SUBSCRIPTION_PLANS.filter(p => p.id !== 'free_trial').map(plan => {
                const isSelected = selectedPlanId === plan.id;
                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => {
                      setSelectedPlanId(plan.id);
                      setAppliedCoupon(null);
                    }}
                    className={`p-4 rounded-2xl border text-left transition relative flex flex-col justify-between ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                    }`}
                  >
                    <div>
                      {plan.badge && (
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full inline-block mb-1.5">
                          {plan.badge}
                        </span>
                      )}
                      <div className="font-bold text-sm text-slate-900">{plan.nameBn}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{plan.durationLabel}</div>
                    </div>
                    <div className="text-lg font-black text-emerald-700 mt-3">
                      {formatBDT(plan.priceBDT)}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Coupon Code Input */}
            <form onSubmit={handleApplyCoupon} className="pt-2 flex flex-col sm:flex-row items-stretch gap-2">
              <div className="relative flex-1">
                <Tag className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={couponCode}
                  onChange={e => setCouponCode(e.target.value)}
                  placeholder="কুপন কোড লিখুন (যেমন: WELCOME50)"
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs uppercase font-mono focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition"
              >
                কুপন প্রয়োগ করুন
              </button>
            </form>

            {couponError && <p className="text-xs text-rose-600 font-semibold">{couponError}</p>}
            {appliedCoupon && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold flex items-center justify-between">
                <span>কুপন '{appliedCoupon.code}' প্রয়োগ হয়েছে! ডিসকাউন্ট: {formatBDT(appliedCoupon.discountAmount)}</span>
                <button
                  type="button"
                  onClick={() => setAppliedCoupon(null)}
                  className="text-xs text-rose-600 underline font-normal"
                >
                  বাতিল
                </button>
              </div>
            )}
          </div>

          {/* Payment Form */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              <span>২. পেমেন্ট তথ্য প্রদান করুন</span>
            </h3>

            {hasPendingPayment && (
              <div className="p-3 bg-amber-50 text-amber-800 rounded-xl text-xs font-semibold">
                ⚠️ একটি পেমেন্ট রিকোয়েস্ট ইতিমধ্যে প্রক্রিয়াধীন আছে। নতুন রিকোয়েস্ট জমা দিলে আগেরটি বাতিল হতে পারে।
              </div>
            )}

            <form onSubmit={handleSubmitPayment} className="space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-xl flex items-center justify-between">
                  <span>{formError}</span>
                  <button type="button" onClick={() => setFormError(null)} className="text-rose-500 hover:text-rose-800">✕</button>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    পেমেন্ট মেথড *
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:bg-white"
                  >
                    <option value="bKash">bKash (বিকাশ Personal)</option>
                    <option value="Nagad">Nagad (নগদ Personal)</option>
                    <option value="Rocket">Rocket (রকেট)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    প্রেরক মোবাইল নম্বর *
                  </label>
                  <input
                    type="text"
                    required
                    value={senderPhone}
                    onChange={e => setSenderPhone(e.target.value)}
                    placeholder="যে নম্বর থেকে টাকা পাঠিয়েছেন (017...)"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    ট্রানজ্যাকশন আইডি (TrxID) *
                  </label>
                  <input
                    type="text"
                    required
                    value={transactionId}
                    onChange={e => setTransactionId(e.target.value)}
                    placeholder="যেমন: BL89X4M9K2"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono uppercase focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    স্ক্রিনশট ইমেজ লিংক (ঐচ্ছিক)
                  </label>
                  <input
                    type="url"
                    value={screenshotUrl}
                    onChange={e => setScreenshotUrl(e.target.value)}
                    placeholder="https://i.imgur.com/... (ঐচ্ছিক)"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  নোট বা বার্তা (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  value={customerNote}
                  onChange={e => setCustomerNote(e.target.value)}
                  placeholder="যেমন: ৩য় মাসের রিনিউয়াল ফি..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white"
                />
              </div>

              {/* Total Payable Summary */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <div className="text-slate-500">পরিশোধযোগ্য সর্বমোট অর্থ:</div>
                  <div className="text-xl font-black text-slate-900 mt-0.5">{formatBDT(finalPrice)}</div>
                </div>

                <button
                  type="submit"
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition active:scale-98 flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-200" />
                  <span>পেমেন্ট রিকোয়েস্ট জমা দিন</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right 1 Col: Dynamic Instructions from Admin Settings */}
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-600" />
              <span>পেমেন্ট নির্দেশনাবলী</span>
            </h4>

            {/* Payment Number Card */}
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-2">
              <div className="text-xs text-rose-800 font-bold uppercase tracking-wider">
                {adminSettings?.payment_method || 'bKash / Nagad Personal'}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-mono font-black text-rose-900">
                  {adminSettings?.payment_number || '01712345678'}
                </span>
                <button
                  type="button"
                  onClick={handleCopyPaymentNumber}
                  className="p-1.5 text-rose-700 hover:text-rose-900 hover:bg-rose-100 rounded-lg transition text-xs flex items-center gap-1 font-semibold"
                >
                  {copiedNumber ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedNumber ? 'কপি হয়েছে' : 'কপি'}</span>
                </button>
              </div>
              <div className="text-[11px] text-rose-700">
                (ব্যক্তিগত / Send Money প্রযোজ্য)
              </div>
            </div>

            <div className="text-xs text-slate-600 leading-relaxed whitespace-pre-line space-y-2">
              <p>
                {adminSettings?.payment_instructions ||
                  '১. আপনার বিকাশ বা নগদ অ্যাপ থেকে উপরোক্ত নম্বরে Send Money করুন।\n২. ট্রানজ্যাকশন সফল হলে TrxID কপি করুন।\n৩. এই ফর্মের মধ্যে প্রেরক নম্বর ও TrxID লিখে সাবমিট করুন।'}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 space-y-1">
              <div>হেল্পলাইন: <strong>{adminSettings?.support_phone || '01700000000'}</strong></div>
              <div>হোয়াটসঅ্যাপ: <strong>{adminSettings?.support_whatsapp || '01700000000'}</strong></div>
              <div>ইমেইল: <strong>{adminSettings?.support_email || 'support@bikripilot.com'}</strong></div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment History Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900">আপনার পেমেন্ট ভেরিফিকেশন হিস্ট্রি</h3>
          <span className="text-xs text-slate-500">মোট {myPayments.length}টি রেকর্ড</span>
        </div>

        {myPayments.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            এখনও কোনো পেমেন্ট রিকোয়েস্ট জমা দেওয়া হয়নি।
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">তারিখ ও সময়</th>
                  <th className="py-3 px-4">প্ল্যান</th>
                  <th className="py-3 px-4">টাকা</th>
                  <th className="py-3 px-4">মেথড ও নম্বর</th>
                  <th className="py-3 px-4">TrxID</th>
                  <th className="py-3 px-4">স্ট্যাটাস</th>
                  <th className="py-3 px-4">মন্তব্য / কারণ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {myPayments.map(p => {
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(p.created_at).toLocaleString('bn-BD')}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {p.plan_name}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 font-mono">
                        {formatBDT(p.amount)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-700">{p.payment_method}</span>
                        <div className="font-mono text-slate-500 text-[11px]">{p.sender_phone}</div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        {p.transaction_id}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                            p.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : p.status === 'rejected'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {p.status === 'approved' && <CheckCircle2 className="w-3 h-3" />}
                          {p.status === 'pending' && <Clock className="w-3 h-3" />}
                          {p.status === 'rejected' && <XCircle className="w-3 h-3" />}
                          <span>
                            {p.status === 'approved' ? 'অনুমোদিত' : p.status === 'rejected' ? 'বাতিল' : 'অপেক্ষমান'}
                          </span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {p.status === 'rejected' ? (
                          <span className="text-rose-600 font-semibold">
                            {p.rejection_reason || p.admin_notes || 'যাচাই করা সম্ভব হয়নি।'}
                          </span>
                        ) : (
                          p.admin_notes || '-'
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
    </div>
  );
};
