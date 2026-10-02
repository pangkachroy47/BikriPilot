import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SUBSCRIPTION_PLANS } from '../../config/plans';
import { SubscriptionPlanId } from '../../types';
import { formatBDT } from '../../utils/calculations';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import {
  checkShopLimit,
  checkAILimit,
  checkProductLimit,
  getPlanLimits,
  getDaysRemaining,
  isSubscriptionExpired,
} from '../../utils/subscriptionLimits';
import { UpgradeGateModal, GateReason } from '../../components/subscription/UpgradeGateModal';
import {
  Settings,
  Store,
  CreditCard,
  Sparkles,
  Check,
  ShieldCheck,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  Copy,
  ExternalLink,
  Lock,
  AlertTriangle,
  Package,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const {
    currentUser,
    shops,
    currentShop,
    products,
    updateShop,
    createShop,
    paymentVerifications,
    submitSubscriptionPayment,
    verifySubscriptionPayment,
    aiParseLogs,
    setNeedsOnboarding,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'shop' | 'subscription' | 'verification' | 'ai_logs'>('subscription');

  // Upgrade Gate Modal
  const [showGateModal, setShowGateModal] = useState(false);
  const [gateReason, setGateReason] = useState<GateReason>('multi_shop');
  const [paymentFormError, setPaymentFormError] = useState<string | null>(null);

  const planLimits = getPlanLimits(currentShop.subscription_plan);
  const shopLimit = checkShopLimit(currentShop, shops.length);
  const aiLimit = checkAILimit(currentShop, aiParseLogs.length);
  const productLimit = checkProductLimit(currentShop, products.length);
  const daysLeft = getDaysRemaining(currentShop);
  const isExpired = isSubscriptionExpired(currentShop);

  // Shop Profile state
  const [shopName, setShopName] = useState(currentShop.name);
  const [fbPageName, setFbPageName] = useState(currentShop.fb_page_name);
  const [fbPageUrl, setFbPageUrl] = useState(currentShop.fb_page_url);
  const [phone, setPhone] = useState(currentShop.phone);
  const [deliveryInside, setDeliveryInside] = useState(currentShop.default_delivery_inside);
  const [deliveryOutside, setDeliveryOutside] = useState(currentShop.default_delivery_outside);
  const [packagingCost, setPackagingCost] = useState(currentShop.default_packaging_cost);
  const [adCost, setAdCost] = useState(currentShop.default_ad_cost);
  const [shopSaveSuccess, setShopSaveSuccess] = useState(false);

  // Manual payment submission state
  const [selectedPlanForUpgrade, setSelectedPlanForUpgrade] = useState<SubscriptionPlanId>('founder');
  const [payMethod, setPayMethod] = useState<'bKash' | 'Nagad' | 'Rocket'>('bKash');
  const [transactionId, setTransactionId] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [trxSubmitted, setTrxSubmitted] = useState(false);

  // New Shop Creation
  const [isCreatingShop, setIsCreatingShop] = useState(false);
  const [newShopName, setNewShopName] = useState('');
  const [newShopFb, setNewShopFb] = useState('');

  const currentPlan = SUBSCRIPTION_PLANS.find(p => p.id === currentShop.subscription_plan) || SUBSCRIPTION_PLANS[0];

  const handleSaveShop = (e: React.FormEvent) => {
    e.preventDefault();
    updateShop({
      name: shopName,
      fb_page_name: fbPageName,
      fb_page_url: fbPageUrl,
      phone,
      default_delivery_inside: deliveryInside,
      default_delivery_outside: deliveryOutside,
      default_packaging_cost: packagingCost,
      default_ad_cost: adCost,
    });
    setShopSaveSuccess(true);
    setTimeout(() => setShopSaveSuccess(false), 2500);
  };

  const handleManualPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactionId.trim() || !senderPhone.trim()) {
      setPaymentFormError('ট্রানজ্যাকশন আইডি ও প্রেরকের ফোন নম্বর দিন।');
      return;
    }
    setPaymentFormError(null);

    const targetPlan = SUBSCRIPTION_PLANS.find(p => p.id === selectedPlanForUpgrade);
    submitSubscriptionPayment({
      plan_name: selectedPlanForUpgrade,
      amount: targetPlan?.priceBDT || 99,
      payment_method: payMethod,
      transaction_id: transactionId.trim().toUpperCase(),
      sender_phone: senderPhone.trim(),
    });

    setTrxSubmitted(true);
    setTransactionId('');
    setSenderPhone('');
  };

  const handleCreateNewShop = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShopName.trim()) return;

    if (!shopLimit.canCreateShop) {
      setGateReason('multi_shop');
      setShowGateModal(true);
      return;
    }

    createShop({
      name: newShopName,
      fb_page_name: newShopFb,
    });
    setIsCreatingShop(false);
    setNewShopName('');
    setNewShopFb('');
  };

  return (
    <div className="space-y-6">
      {/* TailAdmin Breadcrumb */}
      <Breadcrumb
        pageName="শপ সেটিংস ও বিলিং"
        parentName="BikriPilot"
      />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">শপ সেটিংস ও সাবস্ক্রিপশন</h1>
        <p className="text-sm text-slate-500">
          আপনার পেজের তথ্য, ডেলিভারি চার্জ, সাবস্ক্রিপশন প্ল্যান ও ম্যানুয়াল পেমেন্ট যাচাই
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('subscription')}
          className={`px-4 py-2 text-sm font-bold border-b-2 transition whitespace-nowrap ${
            activeTab === 'subscription'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          সাবস্ক্রিপশন ও আপগ্রেড
        </button>
        <button
          onClick={() => setActiveTab('verification')}
          className={`px-4 py-2 text-sm font-bold border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'verification'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>পেমেন্ট ভেরিফিকেশন (অ্যাডমিন)</span>
          {paymentVerifications.filter(v => v.status === 'pending').length > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-500" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('shop')}
          className={`px-4 py-2 text-sm font-bold border-b-2 transition whitespace-nowrap ${
            activeTab === 'shop'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          শপ প্রোফাইল ও চার্জ
        </button>
        <button
          onClick={() => setActiveTab('ai_logs')}
          className={`px-4 py-2 text-sm font-bold border-b-2 transition whitespace-nowrap ${
            activeTab === 'ai_logs'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          AI পার্স লগ ({aiParseLogs.length})
        </button>
      </div>

      {/* TAB 1: SUBSCRIPTION PLANS & UPGRADE */}
      {activeTab === 'subscription' && (
        <div className="space-y-6">
          {/* Current Status Card with Quotas */}
          <div className="bg-[#1C2434] text-white rounded-3xl p-6 shadow-md border border-[#2E3A4B] space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  বর্তমান সাবস্ক্রিপশন প্ল্যান
                </span>
                <h2 className="text-2xl font-black mt-1.5 flex items-center gap-2">
                  <span>{planLimits.nameBn}</span>
                  <span className="text-xs font-mono text-slate-400">({planLimits.name})</span>
                </h2>
                <p className="text-xs text-slate-300 mt-1">
                  শপ: <strong>{currentShop.name}</strong> | ফেক পেজ: {currentShop.fb_page_name || 'N/A'}
                </p>
              </div>

              <div className="text-left md:text-right">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                  isExpired
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : currentShop.subscription_status === 'active'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}>
                  {isExpired
                    ? 'মেয়াদ উত্তীর্ণ (Expired)'
                    : currentShop.subscription_status === 'active'
                    ? `সক্রিয় (${daysLeft} দিন বাকি)`
                    : 'যাচাই প্রক্রিয়াধীন'}
                </span>
                <div className="text-[11px] text-slate-400 mt-1">
                  মেয়াদ শেষ: {new Date(currentShop.subscription_expires_at).toLocaleDateString('bn-BD')}
                </div>
              </div>
            </div>

            {/* Quota Progress Meters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-[#2E3A4B]">
              {/* AI Quota */}
              <div className="p-3 bg-[#141B26] rounded-2xl border border-[#2E3A4B] space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>AI অর্ডার ক্যাপচার:</span>
                  </span>
                  <span className="font-bold text-white font-mono">
                    {aiParseLogs.length} / {planLimits.monthlyAILimit}
                  </span>
                </div>
                <div className="w-full bg-[#2E3A4B] h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${aiLimit.isLimitReached ? 'bg-rose-500' : 'bg-emerald-500'}`}
                    style={{ width: `${aiLimit.percentage}%` }}
                  />
                </div>
                <div className="text-[10px] text-slate-400 flex justify-between">
                  <span>ব্যবহৃত {aiLimit.percentage}%</span>
                  <span>বাকি {aiLimit.remaining} টি</span>
                </div>
              </div>

              {/* Product Quota */}
              <div className="p-3 bg-[#141B26] rounded-2xl border border-[#2E3A4B] space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Package className="w-3.5 h-3.5 text-blue-400" />
                    <span>পণ্য ইনভেন্টরি:</span>
                  </span>
                  <span className="font-bold text-white font-mono">
                    {products.length} / {planLimits.maxProducts}
                  </span>
                </div>
                <div className="w-full bg-[#2E3A4B] h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${productLimit.isLimitReached ? 'bg-rose-500' : 'bg-blue-500'}`}
                    style={{ width: `${Math.min(100, Math.round((products.length / planLimits.maxProducts) * 100))}%` }}
                  />
                </div>
                <div className="text-[10px] text-slate-400 flex justify-between">
                  <span>সর্বোচ্চ {planLimits.maxProducts} টি</span>
                  <span>{planLimits.maxProducts - products.length} টি খালি</span>
                </div>
              </div>

              {/* Multi-Shop Quota */}
              <div className="p-3 bg-[#141B26] rounded-2xl border border-[#2E3A4B] space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Store className="w-3.5 h-3.5 text-purple-400" />
                    <span>শপ / পেজ সংখ্যা:</span>
                  </span>
                  <span className="font-bold text-white font-mono">
                    {shops.length} / {planLimits.maxShops}
                  </span>
                </div>
                <div className="w-full bg-[#2E3A4B] h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${!shopLimit.canCreateShop ? 'bg-purple-500' : 'bg-purple-400'}`}
                    style={{ width: `${Math.min(100, Math.round((shops.length / planLimits.maxShops) * 100))}%` }}
                  />
                </div>
                <div className="text-[10px] text-slate-400 flex justify-between">
                  <span>অনুমোদিত: {planLimits.maxShops} টি</span>
                  <span>{!shopLimit.canCreateShop ? 'লিমিট শেষ' : 'আরো যোগ সম্ভব'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Plans Grid */}
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              প্ল্যান নির্বাচন করে আপগ্রেড করুন
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              বিকাশ বা নগদ ট্রানজ্যাকশন আইডি সাবমিট করার সাথে সাথে অ্যাক্টিভেট করা হবে
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {SUBSCRIPTION_PLANS.map(p => {
                const isCurrent = currentShop.subscription_plan === p.id;
                const isSelected = selectedPlanForUpgrade === p.id;

                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPlanForUpgrade(p.id)}
                    className={`bg-white rounded-3xl p-5 border-2 transition cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-emerald-600 shadow-md ring-2 ring-emerald-600/20'
                        : isCurrent
                        ? 'border-slate-300 bg-slate-50/50'
                        : 'border-slate-200 hover:border-emerald-300'
                    }`}
                  >
                    <div>
                      {p.badge && (
                        <span className="inline-block text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full mb-2">
                          {p.badge}
                        </span>
                      )}
                      <h4 className="font-bold text-base text-slate-900">{p.nameBn}</h4>
                      <div className="text-2xl font-black text-slate-900 mt-2">
                        {p.priceBDT === 0 ? 'সম্পূর্ণ ফ্রি' : `৳${p.priceBDT}`}
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium mb-4">
                        {p.durationLabel}
                      </div>

                      <ul className="text-xs text-slate-600 space-y-2 pt-3 border-t border-slate-100">
                        {p.features.map((f, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        className={`w-full py-2 rounded-xl text-xs font-bold transition ${
                          isSelected
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {isCurrent ? 'বর্তমান প্ল্যান' : isSelected ? 'নির্বাচিত' : 'এই প্ল্যান নিন'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Manual Payment Submission Form */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              <span>ম্যানুয়াল বিকাশ / নগদ ট্রানজ্যাকশন আইডি ভেরিফিকেশন</span>
            </h3>

            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 space-y-2">
              <div className="font-bold text-sm">পেমেন্ট করার নিয়মাবলী:</div>
              <div>
                ১. আপনার বিকাশ বা নগদ অ্যাপ থেকে{' '}
                <strong className="font-mono bg-white px-1.5 py-0.5 rounded border border-emerald-300">
                  01712-345678
                </strong>{' '}
                নম্বরে 'Send Money' করুন।
              </div>
              <div>
                ২. নির্বাচিত প্ল্যানের মূল্য (
                <strong>
                  {SUBSCRIPTION_PLANS.find(p => p.id === selectedPlanForUpgrade)?.priceBDT || 99} টাকা
                </strong>
                ) পাঠিয়ে প্রাপ্ত <strong>Transaction ID (TrxID)</strong> নিচের ফর্মে লিখুন।
              </div>
            </div>

            {trxSubmitted && (
              <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>আপনার ট্রানজ্যাকশন আইডি জমা দেওয়া হয়েছে! অ্যাডমিন দ্রুত যাচাই করে প্ল্যান চালু করবে।</span>
              </div>
            )}

            <form onSubmit={handleManualPaymentSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">পেমেন্ট মেথড</label>
                <select
                  value={payMethod}
                  onChange={e => setPayMethod(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                >
                  <option value="bKash">bKash (বিকাশ পার্সোনাল)</option>
                  <option value="Nagad">Nagad (নগদ পার্সোনাল)</option>
                  <option value="Rocket">Rocket (রকেট)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">যে নম্বর থেকে টাকা পাঠিয়েছেন *</label>
                <input
                  type="text"
                  value={senderPhone}
                  onChange={e => setSenderPhone(e.target.value)}
                  placeholder="017xxxxxxxx"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Transaction ID (TrxID) *</label>
                <input
                  type="text"
                  value={transactionId}
                  onChange={e => setTransactionId(e.target.value)}
                  placeholder="যেমন: 9N74K29LPA"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono uppercase"
                  required
                />
              </div>

              <div className="sm:col-span-3 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
                >
                  ট্রানজ্যাকশন সাবমিট করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: ADMIN PAYMENT VERIFICATION PANEL */}
      {activeTab === 'verification' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900">
                ম্যানুয়াল পেমেন্ট ভেরিফিকেশন প্যানেল (Admin View)
              </h3>
              <p className="text-xs text-slate-500">
                গ্রাহকদের প্রেরিত BDT সাবস্ক্রিপশন ট্রানজ্যাকশন আইডি অনুমোদন বা বাতিল করুন
              </p>
            </div>
            <span className="text-xs font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-full">
              মোট রেকর্ড: {paymentVerifications.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3">তারিখ</th>
                  <th className="p-3">প্ল্যান</th>
                  <th className="p-3">টাকার পরিমাণ</th>
                  <th className="p-3">মেথড ও সেন্ডার ফোন</th>
                  <th className="p-3">TrxID</th>
                  <th className="p-3">স্ট্যাটাস</th>
                  <th className="p-3 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paymentVerifications.map(v => (
                  <tr key={v.id} className="hover:bg-slate-50">
                    <td className="p-3 text-slate-500">
                      {new Date(v.created_at).toLocaleDateString('bn-BD')}
                    </td>
                    <td className="p-3 font-bold text-slate-800 uppercase">
                      {v.plan_name}
                    </td>
                    <td className="p-3 font-bold text-slate-900">
                      {formatBDT(v.amount)}
                    </td>
                    <td className="p-3">
                      <div>{v.payment_method}</div>
                      <div className="text-slate-400 font-mono">{v.sender_phone}</div>
                    </td>
                    <td className="p-3 font-mono font-bold text-emerald-800">
                      {v.transaction_id}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full font-bold ${
                        v.status === 'approved'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : v.status === 'rejected'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {v.status === 'approved' ? 'অনুমোদিত' : v.status === 'rejected' ? 'বাতিল' : 'পেন্ডিং'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {v.status === 'pending' ? (
                        currentUser.role === 'admin' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => verifySubscriptionPayment(v.id, 'approved', 'Manual bKash/Nagad verified')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold"
                            >
                              অনুমোদন
                            </button>
                            <button
                              onClick={() => verifySubscriptionPayment(v.id, 'rejected', 'Invalid TrxID')}
                              className="px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-lg font-bold"
                            >
                              বাতিল
                            </button>
                          </div>
                        ) : (
                          <span className="text-amber-600 text-[11px] font-semibold">অ্যাডমিন পর্যালোচনায়</span>
                        )
                      ) : (
                        <span className="text-slate-400 text-[11px]">সম্পন্ন</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SHOP PROFILE & CHARGES */}
      {activeTab === 'shop' && (
        <div className="space-y-6">
          <form onSubmit={handleSaveShop} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-900">শপ প্রোফাইল ও ডেলিভারি ডিফল্টস</h3>
                <p className="text-xs text-slate-500">আপনার পেজের তথ্য ও স্বয়ংক্রিয় খরচের হার</p>
              </div>
              {shopSaveSuccess && (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  সফলভাবে সংরক্ষিত!
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">শপের নাম *</label>
                <input
                  type="text"
                  value={shopName}
                  onChange={e => setShopName(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-sm"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Facebook Page নাম</label>
                <input
                  type="text"
                  value={fbPageName}
                  onChange={e => setFbPageName(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Facebook Page URL</label>
                <input
                  type="text"
                  value={fbPageUrl}
                  onChange={e => setFbPageUrl(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">শপের অফিসিয়াল ফোন</label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-sm font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">ঢাকার ভেতর ডেলিভারি চার্জ (টাকা)</label>
                <input
                  type="number"
                  value={deliveryInside}
                  onChange={e => setDeliveryInside(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">ঢাকার বাইরে ডেলিভারি চার্জ (টাকা)</label>
                <input
                  type="number"
                  value={deliveryOutside}
                  onChange={e => setDeliveryOutside(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">প্যাকেজিং খরচ (প্রতি পার্সেল)</label>
                <input
                  type="number"
                  value={packagingCost}
                  onChange={e => setPackagingCost(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">বিজ্ঞাপন খরচ (আনুমানিক গড়)</label>
                <input
                  type="number"
                  value={adCost}
                  onChange={e => setAdCost(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="submit"
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
              >
                তথ্য সংরক্ষণ করুন
              </button>
            </div>
          </form>

          {/* Multi-Shop Manager */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900">মাল্টি-শপ পরিচালনা</h3>
                <p className="text-xs text-slate-500">একই একাউন্টে একাধিক Facebook পেজ ম্যানেজ করুন</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setNeedsOnboarding(true)}
                  className="px-3.5 py-1.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>অনবোর্ডিং উইজার্ড চালান</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreatingShop(!isCreatingShop)}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>নতুন শপ তৈরি</span>
                </button>
              </div>
            </div>

            {isCreatingShop && (
              <form onSubmit={handleCreateNewShop} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">নতুন শপের নাম *</label>
                    <input
                      type="text"
                      value={newShopName}
                      onChange={e => setNewShopName(e.target.value)}
                      placeholder="যেমন: প্রিমিয়াম গ্যাজেট বিডি"
                      className="w-full p-2 border border-slate-300 rounded-xl text-sm bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Facebook Page নাম</label>
                    <input
                      type="text"
                      value={newShopFb}
                      onChange={e => setNewShopFb(e.target.value)}
                      placeholder="যেমন: Premium Gadget BD"
                      className="w-full p-2 border border-slate-300 rounded-xl text-sm bg-white"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreatingShop(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs bg-emerald-600 text-white font-bold rounded-lg"
                  >
                    শপ তৈরি করুন
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: AI PARSE LOGS */}
      {activeTab === 'ai_logs' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900">AI মেসেঞ্জার অর্ডার এক্সট্রাকশন লগ</h3>
              <p className="text-xs text-slate-500">Gemini AI দ্বারা পার্স করা পূর্ববর্তী মেসেঞ্জার চ্যাট ও আউটপুট হিস্ট্রি</p>
            </div>
            <span className="text-xs font-bold bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200">
              মডেল: gemini-3.8-flash
            </span>
          </div>

          {aiParseLogs.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              এখনও কোনো AI অর্ডার ক্যাপচার লগ সংরক্ষিত হয়নি।
            </div>
          ) : (
            <div className="space-y-3">
              {aiParseLogs.map(log => (
                <div key={log.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-2">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="font-mono">{log.id}</span>
                    <span>{new Date(log.created_at).toLocaleString('bn-BD')}</span>
                  </div>
                  <div className="font-semibold text-slate-700">ইনপুট চ্যাট টেক্সট:</div>
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-slate-600 line-clamp-2">
                    {log.input_text}
                  </div>
                  <div className="font-semibold text-slate-700">AI দ্বারা নিষ্কাশিত ডেটা:</div>
                  <pre className="p-2.5 bg-slate-900 text-emerald-400 rounded-xl text-[11px] overflow-x-auto font-mono">
                    {JSON.stringify(log.parsed_json, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Upgrade Gate Modal */}
      <UpgradeGateModal
        isOpen={showGateModal}
        onClose={() => setShowGateModal(false)}
        reason={gateReason}
      />
    </div>
  );
};
