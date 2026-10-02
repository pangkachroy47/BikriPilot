import React from 'react';
import { SUBSCRIPTION_PLANS } from '../../config/plans';
import { Check, ArrowLeft, ArrowRight, Zap, ShieldCheck } from 'lucide-react';

interface PricingPageProps {
  onGoBack: () => void;
  onSelectPlan: (planId: string) => void;
  onGoToRegister: () => void;
}

export const PricingPage: React.FC<PricingPageProps> = ({
  onGoBack,
  onSelectPlan,
  onGoToRegister,
}) => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top Bar */}
      <div className="bg-white border-b border-slate-200 py-4 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={onGoBack}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>হোমে ফিরুন</span>
          </button>
          <div className="font-extrabold text-lg text-slate-900">
            Bikri<span className="text-emerald-600">Pilot</span>
          </div>
          <button
            onClick={onGoToRegister}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition"
          >
            ফ্রি শুরু করুন
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            স্বচ্ছ ও সাশ্রয়ী সাবস্ক্রিপশন প্ল্যান
          </h1>
          <p className="text-sm text-slate-600 font-medium">
            আপনার ফেসবুক ব্যবসার সাইজ অনুযায়ী সেরা প্ল্যানটি বেছে নিন। বিকাশ, নগদ ও রকেটে ট্রানজ্যাকশন আইডি ভেরিফিকেশন।
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {SUBSCRIPTION_PLANS.map(p => (
            <div
              key={p.id}
              className={`bg-white rounded-3xl p-6 border-2 flex flex-col justify-between space-y-6 shadow-sm ${
                p.id === 'founder'
                  ? 'border-emerald-600 ring-2 ring-emerald-500/20'
                  : 'border-slate-200'
              }`}
            >
              <div>
                {p.badge && (
                  <span className="inline-block text-[10px] font-bold bg-amber-100 text-amber-800 px-3 py-1 rounded-full mb-3">
                    {p.badge}
                  </span>
                )}
                <h3 className="text-lg font-bold text-slate-900">{p.nameBn}</h3>
                <div className="text-3xl font-black text-slate-900 mt-2">
                  {p.priceBDT === 0 ? 'ফ্রি' : `৳${p.priceBDT}`}
                </div>
                <div className="text-xs text-slate-500 font-medium mt-1 mb-4">
                  {p.durationLabel}
                </div>

                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 text-xs font-semibold text-emerald-800 mb-4">
                  মাসিক AI মেসেঞ্জার কোটা: {p.monthlyAILimit} টি
                </div>

                <ul className="text-xs text-slate-600 space-y-2.5 pt-3 border-t border-slate-100">
                  {p.features.map((f, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => onSelectPlan(p.id)}
                className={`w-full py-2.5 rounded-xl text-xs font-bold transition shadow-xs ${
                  p.id === 'founder'
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-slate-900 hover:bg-slate-800 text-white'
                }`}
              >
                এই প্ল্যান বেছে নিন
              </button>
            </div>
          ))}
        </div>

        {/* Guarantee Banner */}
        <div className="p-6 bg-white rounded-3xl border border-slate-200 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl shrink-0">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-slate-900 text-sm">কোনো স্বয়ংক্রিয় টাকা কাটার ভয় নেই</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              আমরা কোনো অটোমেটিক কার্ড চার্জ করি না। আপনার মেয়াদ শেষ হলে আপনি নিজের সুবিধামতো বিকাশ/নগদে নবায়ন করতে পারবেন।
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
