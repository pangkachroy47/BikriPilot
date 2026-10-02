import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatBDT } from '../../utils/calculations';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  PieChart,
  ShoppingBag,
  Truck,
  Package,
  Megaphone,
  CreditCard,
  HelpCircle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
} from 'recharts';

export const ProfitPage: React.FC = () => {
  const { orders } = useApp();

  const analytics = useMemo(() => {
    let totalProductSales = 0;
    let totalDeliveryCollected = 0;
    let totalProductCost = 0;
    let totalCourierCost = 0;
    let totalPackagingCost = 0;
    let totalAdCost = 0;
    let totalOtherCost = 0;
    let totalReturnLoss = 0;
    let totalNetProfit = 0;

    let returnedOrdersCount = 0;
    let deliveredOrdersCount = 0;

    orders.forEach(o => {
      const isReturned = o.status === 'Returned';
      const isCancelled = o.status === 'Cancelled';

      if (!isCancelled) {
        if (!isReturned) {
          totalProductSales += o.selling_price * o.quantity;
          totalDeliveryCollected += o.delivery_charge;
          totalProductCost += o.product_cost * o.quantity;
        }

        totalCourierCost += o.courier_cost;
        totalPackagingCost += o.packaging_cost;
        totalAdCost += o.ad_cost;
        totalOtherCost += o.other_cost;

        if (isReturned) {
          returnedOrdersCount++;
          const returnCourier = o.return_courier_cost || Math.round(o.courier_cost * 0.5);
          const loss = o.courier_cost + returnCourier + o.packaging_cost + o.ad_cost + o.other_cost;
          totalReturnLoss += loss;
        } else if (o.status === 'Delivered') {
          deliveredOrdersCount++;
        }

        totalNetProfit += o.calculated_profit;
      }
    });

    const totalRevenue = totalProductSales + totalDeliveryCollected;
    const totalExpenses = totalProductCost + totalCourierCost + totalPackagingCost + totalAdCost + totalOtherCost + totalReturnLoss;
    const profitMarginPct = totalRevenue > 0 ? Math.round((totalNetProfit / totalRevenue) * 1000) / 10 : 0;

    const returnRate = orders.length > 0 ? Math.round((returnedOrdersCount / orders.length) * 100) : 0;

    return {
      totalRevenue,
      totalProductSales,
      totalDeliveryCollected,
      totalProductCost,
      totalCourierCost,
      totalPackagingCost,
      totalAdCost,
      totalOtherCost,
      totalReturnLoss,
      totalNetProfit,
      profitMarginPct,
      returnedOrdersCount,
      deliveredOrdersCount,
      returnRate,
    };
  }, [orders]);

  const expenseBreakdownData = [
    { name: 'পণ্যের ক্রয় খরচ', value: analytics.totalProductCost, color: '#3b82f6' },
    { name: 'কুরিয়ার খরচ', value: analytics.totalCourierCost, color: '#6366f1' },
    { name: 'বিজ্ঞাপন (Meta Ads)', value: analytics.totalAdCost, color: '#ec4899' },
    { name: 'রিটার্ন কুরিয়ার ক্ষতি', value: analytics.totalReturnLoss, color: '#f43f5e' },
    { name: 'প্যাকেজিং ও অন্যান্য', value: analytics.totalPackagingCost + analytics.totalOtherCost, color: '#f59e0b' },
  ].filter(i => i.value > 0);

  return (
    <div className="space-y-6">
      {/* TailAdmin Breadcrumb */}
      <Breadcrumb
        pageName="নিট লাভ ও রিটার্ন লস অডিট"
        parentName="BikriPilot"
      />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">নিট লাভ ও রিটার্ন লস অডিট</h1>
        <p className="text-sm text-slate-500">
          Facebook ব্যবসার প্রতিটা খরচের সুনির্দিষ্ট হিসাব এবং প্রকৃত মুনাফার বিশ্লেষণ
        </p>
      </div>

      {/* Top Main Cards: Estimated Profit & Return Loss */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Estimated Profit Card */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-800 text-white rounded-3xl p-6 shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between text-emerald-100 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>প্রকৃত নিট মুনাফা (Estimated Profit)</span>
            <TrendingUp className="w-5 h-5 text-emerald-200" />
          </div>
          <div className="text-3xl sm:text-4xl font-black mt-1">
            {formatBDT(analytics.totalNetProfit)}
          </div>
          <div className="mt-4 flex items-center justify-between text-xs border-t border-emerald-500/30 pt-3">
            <span>নিট প্রফিট মার্জিন:</span>
            <span className="font-bold text-sm bg-white/20 px-2.5 py-0.5 rounded-full">
              {analytics.profitMarginPct}%
            </span>
          </div>
        </div>

        {/* Estimated Return Loss Card */}
        <div className="bg-gradient-to-br from-rose-600 to-rose-800 text-white rounded-3xl p-6 shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between text-rose-100 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>মোট রিটার্ন লস (Estimated Return Loss)</span>
            <AlertTriangle className="w-5 h-5 text-rose-200" />
          </div>
          <div className="text-3xl sm:text-4xl font-black mt-1">
            {formatBDT(analytics.totalReturnLoss)}
          </div>
          <div className="mt-4 flex items-center justify-between text-xs border-t border-rose-500/30 pt-3">
            <span>রিটার্ন রেট ({analytics.returnedOrdersCount}টি পার্সেল):</span>
            <span className="font-bold text-sm bg-white/20 px-2.5 py-0.5 rounded-full">
              {analytics.returnRate}%
            </span>
          </div>
        </div>

        {/* Total Revenue Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
              <span>মোট অর্জিত ক্যাশ ও রেভিনিউ</span>
              <DollarSign className="w-5 h-5 text-slate-400" />
            </div>
            <div className="text-3xl sm:text-4xl font-black text-slate-900 mt-1">
              {formatBDT(analytics.totalRevenue)}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex justify-between">
            <span>পণ্য বিক্রি: {formatBDT(analytics.totalProductSales)}</span>
            <span>ডেলিভারি চার্জ: {formatBDT(analytics.totalDeliveryCollected)}</span>
          </div>
        </div>
      </div>

      {/* Formula & Breakdown Box */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
          <span>BikriPilot নিট লাভ গণনার সূত্র</span>
          <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
            স্বচ্ছ ব্যবসার সূত্র
          </span>
        </h3>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 font-mono text-xs text-slate-700 leading-relaxed overflow-x-auto">
          <div className="font-bold text-emerald-700">
            নিট লাভ = (পণ্য বিক্রি + সংগৃহীত ডেলিভারি চার্জ)
          </div>
          <div className="text-rose-700 mt-1">
            - পণ্যের ক্রয় খরচ - কুরিয়ার চার্জ - প্যাকেজিং খরচ - বিজ্ঞাপন খরচ - রিটার্ন লস
          </div>
        </div>

        {/* Detailed Breakdown Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
            <span className="text-slate-500 block">পণ্যের খরচ</span>
            <span className="font-bold text-slate-900 text-sm">{formatBDT(analytics.totalProductCost)}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
            <span className="text-slate-500 block">কুরিয়ার খরচ</span>
            <span className="font-bold text-slate-900 text-sm">{formatBDT(analytics.totalCourierCost)}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
            <span className="text-slate-500 block">বিজ্ঞাপন খরচ</span>
            <span className="font-bold text-slate-900 text-sm">{formatBDT(analytics.totalAdCost)}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
            <span className="text-slate-500 block">প্যাকেজিং খরচ</span>
            <span className="font-bold text-slate-900 text-sm">{formatBDT(analytics.totalPackagingCost)}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
            <span className="text-slate-500 block">অন্যান্য খরচ</span>
            <span className="font-bold text-slate-900 text-sm">{formatBDT(analytics.totalOtherCost)}</span>
          </div>
          <div className="p-3 bg-rose-50 rounded-xl border border-rose-100 text-xs">
            <span className="text-rose-600 block">রিটার্ন ক্ষতি</span>
            <span className="font-bold text-rose-700 text-sm">{formatBDT(analytics.totalReturnLoss)}</span>
          </div>
        </div>
      </div>

      {/* Return Loss Analysis Detail Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-900">রিটার্ন লস হ্রাস করার কৌশল</h3>
            <p className="text-xs text-slate-500">বাংলাদেশে F-Commerce ডেলিভারি সাকসেস রেট বাড়ানোর উপায়</p>
          </div>
          <span className="text-xs font-bold bg-rose-50 text-rose-700 px-3 py-1 rounded-full border border-rose-200">
            রিটার্ন ক্ষতি {formatBDT(analytics.totalReturnLoss)}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
            <div className="font-bold text-sm text-slate-800">১. অগ্রিম ডেলিভারি চার্জ নিন</div>
            <p className="text-xs text-slate-600">
              ঢাকার বাইরে অর্ডারে অন্তত ডেলিভারি চার্জ (৳১৩০) বিকাশে অগ্রিম নিলে ফেক অর্ডার ৯০% কমে যায়।
            </p>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
            <div className="font-bold text-sm text-slate-800">২. ডেলিভারির আগে কল দিয়ে কনফার্ম</div>
            <p className="text-xs text-slate-600">
              পার্সেল পাঠানোর পূর্বে কাস্টমারের সঠিক ঠিকানা ও প্রাপ্যতা নিশ্চিত করে নিন।
            </p>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
            <div className="font-bold text-sm text-slate-800">৩. কাস্টমার হিস্ট্রি চেক</div>
            <p className="text-xs text-slate-600">
              BikriPilot কাস্টমার পেজ থেকে ফোন নম্বর সার্চ করে পূর্বের রিটার্ন রেকর্ড দেখে নিন।
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
