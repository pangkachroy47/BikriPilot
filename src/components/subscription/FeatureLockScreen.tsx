import React from 'react';
import { useApp } from '../../context/AppContext';
import { checkSubscriptionAccess } from '../../utils/accessControl';
import { Lock, Clock, AlertTriangle, RefreshCw, Zap, Phone, MessageSquare } from 'lucide-react';

interface FeatureLockScreenProps {
  featureName?: string;
  onNavigateBilling?: () => void;
}

export const FeatureLockScreen: React.FC<FeatureLockScreenProps> = ({
  featureName = 'এই ফিচারটি',
  onNavigateBilling,
}) => {
  const { currentShop, currentUser, paymentVerifications } = useApp();
  const access = checkSubscriptionAccess(currentShop, currentUser);

  const pendingPayment = paymentVerifications.find(
    p => p.shop_id === currentShop.id && p.status === 'pending'
  );

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xl text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Status Icon */}
        <div
          className={`w-16 h-16 rounded-3xl flex items-center justify-center mx-auto shadow-inner ${
            access.isPending
              ? 'bg-amber-50 text-amber-600 border border-amber-200'
              : access.isSuspended
              ? 'bg-red-50 text-red-600 border border-red-200'
              : 'bg-rose-50 text-rose-600 border border-rose-200'
          }`}
        >
          {access.isPending ? (
            <Clock className="w-8 h-8 animate-pulse" />
          ) : access.isSuspended ? (
            <AlertTriangle className="w-8 h-8" />
          ) : (
            <Lock className="w-8 h-8" />
          )}
        </div>

        {/* Status Badge */}
        <div>
          <span
            className={`inline-block text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${access.badgeColor}`}
          >
            {access.title}
          </span>
          <h2 className="text-xl font-black text-slate-900 mt-2">
            {access.isPending
              ? 'পেমেন্ট ভেরিফিকেশন অপেক্ষমান'
              : access.isSuspended
              ? 'অ্যাকাউন্ট স্থগিত রয়েছে'
              : `${featureName} আনলক করতে সাবস্ক্রিপশন প্রয়োজন`}
          </h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            {access.message}
          </p>
        </div>

        {/* Pending payment notification card */}
        {pendingPayment && (
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-left text-xs space-y-1">
            <div className="font-bold text-amber-900 flex items-center justify-between">
              <span>জমা দেওয়া ট্রানজ্যাকশন:</span>
              <span className="font-mono bg-amber-200/70 px-2 py-0.5 rounded text-[11px]">
                {pendingPayment.transaction_id}
              </span>
            </div>
            <div className="text-amber-800 text-[11px]">
              প্ল্যান: <strong>{pendingPayment.plan_name}</strong> | টাকা: ৳{pendingPayment.amount} | মেথড: {pendingPayment.payment_method}
            </div>
            <div className="text-[10px] text-amber-700/80 pt-1">
              অ্যাডমিন যাচাই করার সাথে সাথে নোটিফিকেশন পাবেন এবং স্বয়ংক্রিয়ভাবে অ্যাকাউন্ট সচল হবে।
            </div>
          </div>
        )}

        {/* Expiry details */}
        {access.isExpired && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
            মেয়াদ উত্তীর্ণ হয়েছে: <strong>{new Date(currentShop.subscription_expires_at).toLocaleDateString('bn-BD')}</strong>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-2 flex flex-col gap-2.5">
          {!access.isSuspended && (
            <button
              onClick={onNavigateBilling}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition active:scale-98 flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>{pendingPayment ? 'পেমেন্ট হিস্ট্রি ও স্ট্যাটাস দেখুন' : 'প্ল্যান রিনিউ বা সাবস্ক্রাইব করুন'}</span>
            </button>
          )}

          <div className="text-[11px] text-slate-400 pt-1">
            কোনো সহায়তার জন্য কল বা হোয়াটসঅ্যাপ করুন: <strong className="text-slate-700">01700000000</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
