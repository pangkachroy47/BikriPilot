import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SubscriptionPlanId } from '../../types';
import { SUBSCRIPTION_PLANS } from '../../config/plans';
import { formatBDT } from '../../utils/calculations';
import { getPlanLimits } from '../../utils/subscriptionLimits';
import {
  Sparkles,
  Lock,
  X,
  Check,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  AlertTriangle,
  Zap,
} from 'lucide-react';

export type GateReason = 'ai_limit' | 'product_limit' | 'multi_shop' | 'expired' | 'csv_export';

interface UpgradeGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason: GateReason;
  onNavigateSubscription?: () => void;
}

const REASON_DETAILS: Record<
  GateReason,
  { title: string; subtitle: string; iconBg: string }
> = {
  ai_limit: {
    title: 'মাসিক AI অর্ডার ক্যাপচার সীমা শেষ!',
    subtitle: 'আপনার বর্তমান প্ল্যানের মাসিক AI ক্যাপচার কোটা পূর্ণ হয়েছে। আনলিমিটেড ব্যবহার করতে প্ল্যান আপগ্রেড করুন।',
    iconBg: 'bg-amber-500/20 text-amber-500',
  },
  product_limit: {
    title: 'পণ্য ইনভেন্টরি সীমা পূর্ণ হয়েছে',
    subtitle: 'আপনার বর্তমান প্ল্যানে সর্বোচ্চ অনুমোদিত পণ্য যোগ করা হয়ে গেছে। আরও পণ্য যোগ করতে প্ল্যান আপগ্রেড করুন।',
    iconBg: 'bg-blue-500/20 text-blue-500',
  },
  multi_shop: {
    title: 'মাল্টি-শপ সুবিধা লক করা আছে',
    subtitle: 'একাধিক ফেসবুক পেজ বা শপ একই অ্যাকাউন্ট থেকে পরিচালনা করতে স্ট্যান্ডার্ড বা গ্রোথ প্যাকেজ প্রয়োজন।',
    iconBg: 'bg-purple-500/20 text-purple-500',
  },
  expired: {
    title: 'সাবস্ক্রিপশনের মেয়াদ শেষ হয়েছে',
    subtitle: 'আপনার শপের ফ্রি ট্রায়াল বা প্ল্যানের মেয়াদ শেষ হয়েছে। নিরবচ্ছিন্ন সেবা পেতে সাবস্ক্রিপশন নবায়ন করুন।',
    iconBg: 'bg-rose-500/20 text-rose-500',
  },
  csv_export: {
    title: 'এক্সপোর্ট ফিচার প্রিমিয়াম প্ল্যানে অন্তর্ভুক্ত',
    subtitle: 'কাস্টমার ও অর্ডার ডাটা এক্সেল/CSV আকারে ডাউনলোড করতে ফাউন্ডার বা স্ট্যান্ডার্ড প্যাকেজে আপগ্রেড করুন।',
    iconBg: 'bg-emerald-500/20 text-emerald-500',
  },
};

export const UpgradeGateModal: React.FC<UpgradeGateModalProps> = ({
  isOpen,
  onClose,
  reason,
  onNavigateSubscription,
}) => {
  const { currentShop, submitSubscriptionPayment } = useApp();
  const [selectedPlanId, setSelectedPlanId] = useState<SubscriptionPlanId>('founder');
  const [payMethod, setPayMethod] = useState<'bKash' | 'Nagad'>('bKash');
  const [transactionId, setTransactionId] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentLimits = getPlanLimits(currentShop.subscription_plan);
  const details = REASON_DETAILS[reason] || REASON_DETAILS.ai_limit;
  const targetPlan = SUBSCRIPTION_PLANS.find(p => p.id === selectedPlanId) || SUBSCRIPTION_PLANS[1];

  const handleSubmitTrx = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactionId.trim() || !senderPhone.trim()) {
      setFormError('ট্রানজ্যাকশন আইডি ও প্রেরক নম্বর লিখুন।');
      return;
    }
    setFormError(null);

    submitSubscriptionPayment({
      plan_name: selectedPlanId,
      amount: targetPlan.priceBDT,
      payment_method: payMethod,
      transaction_id: transactionId.trim().toUpperCase(),
      sender_phone: senderPhone.trim(),
    });

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#1C2434] text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold shadow-md ${details.iconBg}`}>
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                সাবস্ক্রিপশন লিমিট
              </span>
              <h3 className="text-lg font-black text-white">{details.title}</h3>
            </div>
          </div>
          <p className="text-xs text-slate-300 mt-2 leading-relaxed">{details.subtitle}</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {submitted ? (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
              <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto">
                <Check className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-sm text-emerald-950">পেমেন্ট রিকোয়েস্ট জমা হয়েছে!</h4>
              <p className="text-xs text-emerald-800">
                আমাদের টিম আপনার ট্রানজ্যাকশন যাচাই করে ৩-১০ মিনিটের মধ্যে প্ল্যান চালু করে দেবে।
              </p>
            </div>
          ) : (
            <>
              {/* Plan Switcher Pills */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">
                  পছন্দের প্যাকেজ নির্বাচন করুন:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {SUBSCRIPTION_PLANS.filter(p => p.id !== 'free_trial').map(plan => (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                        selectedPlanId === plan.id
                          ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500'
                          : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                      }`}
                    >
                      <div>
                        {plan.badge && (
                          <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-md inline-block mb-1">
                            {plan.badge}
                          </span>
                        )}
                        <div className="text-xs font-bold text-slate-900">{plan.nameBn}</div>
                        <div className="text-[11px] text-slate-500">{plan.durationLabel}</div>
                      </div>
                      <div className="text-sm font-black text-emerald-700 mt-2">
                        {formatBDT(plan.priceBDT)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected Plan Features */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5 text-xs text-slate-700">
                <div className="font-bold text-slate-900 text-[11px] uppercase tracking-wider">
                  {targetPlan.nameBn} প্যাকেজে আপনি পাবেন:
                </div>
                {targetPlan.features.slice(0, 3).map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 text-[11px]">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>

              {/* Quick bKash/Nagad Payment */}
              <form onSubmit={handleSubmitTrx} className="space-y-3 pt-2 border-t border-slate-100">
                {formError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-bold rounded-xl">
                    {formError}
                  </div>
                )}
                <div className="text-xs font-bold text-slate-700">
                  বিকাশ বা নগদ সেন্ড মানি করুন (ব্যক্তিগত):
                </div>

                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 font-mono flex items-center justify-between">
                  <div>
                    <span className="font-bold">bKash/Nagad Personal:</span>
                    <div className="text-sm font-bold text-rose-700">01700000000</div>
                  </div>
                  <span className="font-sans text-[11px] bg-rose-200 px-2 py-0.5 rounded-full font-bold">
                    {formatBDT(targetPlan.priceBDT)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">মেথড</label>
                    <select
                      value={payMethod}
                      onChange={e => setPayMethod(e.target.value as any)}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs cursor-pointer"
                    >
                      <option value="bKash">bKash (বিকাশ)</option>
                      <option value="Nagad">Nagad (নগদ)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      প্রেরক মোবাইল নম্বর *
                    </label>
                    <input
                      type="text"
                      value={senderPhone}
                      onChange={e => setSenderPhone(e.target.value)}
                      placeholder="017xxxxxxxx"
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    ট্রানজ্যাকশন আইডি (TrxID) *
                  </label>
                  <input
                    type="text"
                    value={transactionId}
                    onChange={e => setTransactionId(e.target.value)}
                    placeholder="যেমন: BL89X4M9..."
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono uppercase"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition active:scale-98 flex items-center justify-center gap-1.5"
                >
                  <Zap className="w-4 h-4 text-amber-300" />
                  <span>পেমেন্ট সাবমিট করে আনলক করুন</span>
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
