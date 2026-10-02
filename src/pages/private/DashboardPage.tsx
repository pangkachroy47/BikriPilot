import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatBDT } from '../../utils/calculations';
import { ORDER_STATUS_MAP, Order } from '../../types';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import {
  TrendingUp,
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertOctagon,
  TrendingDown,
  Sparkles,
  Plus,
  ArrowRight,
  ExternalLink,
  Phone,
  MapPin,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Package,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

interface DashboardPageProps {
  onNavigate: (page: string) => void;
  onOpenAIModal?: () => void;
  onSelectOrder?: (order: Order) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigate,
  onOpenAIModal,
  onSelectOrder,
}) => {
  const { currentShop, orders } = useApp();
  const [chartPeriod, setChartPeriod] = useState<'7d' | '30d'>('7d');

  // Metrics calculation
  const metrics = useMemo(() => {
    const today = new Date().toDateString();

    const todayOrders = orders.filter(
      o => new Date(o.created_at).toDateString() === today
    );

    const todaySales = todayOrders.reduce(
      (sum, o) => sum + (o.status !== 'Returned' && o.status !== 'Cancelled' ? o.selling_price * o.quantity + o.delivery_charge : 0),
      0
    );

    const todayProfit = todayOrders.reduce(
      (sum, o) => sum + o.calculated_profit,
      0
    );

    const pendingOrders = orders.filter(
      o => o.status === 'New' || o.status === 'Confirmed' || o.status === 'Packed' || o.status === 'Shipped'
    ).length;

    const deliveredOrders = orders.filter(o => o.status === 'Delivered').length;
    const returnedOrders = orders.filter(o => o.status === 'Returned').length;

    const totalReturnLoss = orders
      .filter(o => o.status === 'Returned')
      .reduce((sum, o) => sum + (o.return_loss_amount || Math.abs(o.calculated_profit)), 0);

    return {
      todaySales,
      todayProfit,
      pendingOrders,
      deliveredOrders,
      returnedOrders,
      totalReturnLoss,
      totalOrders: orders.length,
    };
  }, [orders]);

  // 7-day sales and profit trends for charts
  const chartData = useMemo(() => {
    const days: { date: string; label: string; sales: number; profit: number }[] = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toDateString();
      const dayLabel = d.toLocaleDateString('bn-BD', { weekday: 'short' });

      const dayOrders = orders.filter(
        o => new Date(o.created_at).toDateString() === dateStr
      );

      const daySales = dayOrders.reduce(
        (sum, o) => sum + (o.status !== 'Returned' && o.status !== 'Cancelled' ? o.selling_price * o.quantity + o.delivery_charge : 0),
        0
      );

      const dayProfit = dayOrders.reduce(
        (sum, o) => sum + o.calculated_profit,
        0
      );

      days.push({
        date: dateStr,
        label: dayLabel,
        sales: daySales,
        profit: dayProfit,
      });
    }

    return days;
  }, [orders]);

  const recentOrders = orders.slice(0, 6);

  return (
    <div className="space-y-6">
      {/* TailAdmin Breadcrumb Header */}
      <Breadcrumb
        pageName="ড্যাশবোর্ড ও ওভারভিউ"
        parentName="BikriPilot"
        onNavigateHome={() => onNavigate('dashboard')}
      />

      {/* Top Banner / Welcome Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-600 via-teal-700 to-slate-900 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-xs font-semibold backdrop-blur-xs text-emerald-100 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Facebook F-Commerce Control Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            {currentShop.name}
          </h1>
          <p className="text-sm text-emerald-100 mt-1">
            "Facebook-এর অর্ডার, হিসাব আর লাভ—এক জায়গায়।"
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-2.5">
          <button
            onClick={onOpenAIModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-white text-emerald-800 hover:bg-emerald-50 rounded-xl font-bold text-xs sm:text-sm shadow-md transition active:scale-98"
          >
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>AI দিয়ে অর্ডার নিন</span>
          </button>
          <button
            onClick={() => onNavigate('new-order')}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900/80 hover:bg-slate-900 text-white rounded-xl font-bold text-xs sm:text-sm border border-white/20 transition active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>ম্যানুয়াল এন্ট্রি</span>
          </button>
        </div>

        {/* Decorative background shape */}
        <div className="absolute -right-10 -bottom-10 w-56 h-56 bg-white/5 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* TailAdmin 6-Card KPI Grid (Clean rounded cards with icon badges & trend indicators) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Today's Sales */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-emerald-400 transition flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <span className="flex items-center gap-0.5 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              <ArrowUpRight className="w-3 h-3" />
              <span>+১২%</span>
            </span>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">
              {formatBDT(metrics.todaySales)}
            </div>
            <div className="text-xs font-semibold text-slate-500 mt-1">
              আজকের মোট বিক্রি
            </div>
          </div>
        </div>

        {/* Today's Profit */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-emerald-400 transition flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="flex items-center gap-0.5 text-[11px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">
              <ArrowUpRight className="w-3 h-3" />
              <span>+৮%</span>
            </span>
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-700">
              {formatBDT(metrics.todayProfit)}
            </div>
            <div className="text-xs font-semibold text-slate-500 mt-1">
              আজকের আনুমানিক নিট লাভ
            </div>
          </div>
        </div>

        {/* Pending Orders */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-amber-400 transition flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
              অ্যাকশন প্রয়োজন
            </span>
          </div>
          <div>
            <div className="text-2xl font-black text-amber-600">
              {metrics.pendingOrders} টি
            </div>
            <div className="text-xs font-semibold text-slate-500 mt-1">
              অপেক্ষমান অর্ডার
            </div>
          </div>
        </div>

        {/* Delivered Orders */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-blue-400 transition flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
              সফল
            </span>
          </div>
          <div>
            <div className="text-2xl font-black text-blue-700">
              {metrics.deliveredOrders} টি
            </div>
            <div className="text-xs font-semibold text-slate-500 mt-1">
              ডেলিভার্ড পার্সেল
            </div>
          </div>
        </div>

        {/* Returned Orders */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-rose-400 transition flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
              {metrics.totalOrders > 0 ? Math.round((metrics.returnedOrders / metrics.totalOrders) * 100) : 0}% হার
            </span>
          </div>
          <div>
            <div className="text-2xl font-black text-rose-600">
              {metrics.returnedOrders} টি
            </div>
            <div className="text-xs font-semibold text-slate-500 mt-1">
              রিটার্ন অর্ডার
            </div>
          </div>
        </div>

        {/* Return Loss Estimate */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-rose-400 transition flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
              <TrendingDown className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
              কুরিয়ার ক্ষতি
            </span>
          </div>
          <div>
            <div className="text-2xl font-black text-rose-700">
              {formatBDT(metrics.totalReturnLoss)}
            </div>
            <div className="text-xs font-semibold text-slate-500 mt-1">
              রিটার্ন লস ক্ষতি
            </div>
          </div>
        </div>
      </div>

      {/* 7-Day Charts (Sales & Profit) - TailAdmin Card Container */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 7-Day Sales Chart */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">গত ৭ দিনের মোট বিক্রি</h3>
              <p className="text-xs text-slate-500">প্রতিদিনের অর্ডারের মোট বিক্রির ট্রেন্ড</p>
            </div>
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-bold text-slate-600">
              <button
                onClick={() => setChartPeriod('7d')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  chartPeriod === '7d' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                ৭ দিন
              </button>
              <button
                onClick={() => setChartPeriod('30d')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  chartPeriod === '30d' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                মাসিক
              </button>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  formatter={(val: any) => [`৳${Number(val).toLocaleString()}`, 'বিক্রি']}
                  labelFormatter={(lbl) => `দিন: ${lbl}`}
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="sales" stroke="#0d9488" strokeWidth={2.5} fillOpacity={1} fill="url(#salesGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 7-Day Profit Chart */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">গত ৭ দিনের আনুমানিক নিট লাভ</h3>
              <p className="text-xs text-slate-500">পণ্য খরচ, কুরিয়ার ও অ্যাড কস্ট বাদে নিট লাভ</p>
            </div>
            <span className="text-xs font-bold bg-teal-50 text-teal-700 px-3 py-1 rounded-full border border-teal-200">
              লাভের গ্রাফ
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  formatter={(val: any) => [`৳${Number(val).toLocaleString()}`, 'নিট লাভ']}
                  labelFormatter={(lbl) => `দিন: ${lbl}`}
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="profit" fill="#0f766e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Orders TailAdmin Table Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">সাম্প্রতিক কাস্টমার অর্ডারসমূহ</h3>
            <p className="text-xs text-slate-500">সর্বশেষ আসা কাস্টমার অর্ডার তালিকা ও বর্তমান স্ট্যাটাস</p>
          </div>
          <button
            onClick={() => onNavigate('orders')}
            className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 transition"
          >
            <span>সব অর্ডার ({orders.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentOrders.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            এখনও কোনো অর্ডার পাওয়া যায়নি। "+ নতুন অর্ডার" বা "AI ক্যাপচার" দিয়ে শুরু করুন!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F7F9FC] text-[11px] text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-5">অর্ডার আইডি</th>
                  <th className="py-3.5 px-5">গ্রাহক ও মোবাইল</th>
                  <th className="py-3.5 px-5">পণ্য ও পরিমাণ</th>
                  <th className="py-3.5 px-5">মোট বিল</th>
                  <th className="py-3.5 px-5">নিট লাভ</th>
                  <th className="py-3.5 px-5">স্ট্যাটাস</th>
                  <th className="py-3.5 px-5 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrders.map(order => {
                  const statusInfo = ORDER_STATUS_MAP[order.status] || ORDER_STATUS_MAP.New;
                  const total = order.selling_price * order.quantity + order.delivery_charge;
                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-slate-50/80 transition cursor-pointer"
                      onClick={() => onSelectOrder?.(order)}
                    >
                      <td className="py-3.5 px-5 font-bold text-slate-900 font-mono">
                        {order.order_number}
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="font-bold text-slate-800">{order.customer_name}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 font-mono">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{order.phone}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="text-slate-800 font-semibold text-xs">{order.product_name}</div>
                        <div className="text-[11px] text-slate-400">
                          {order.variant ? `${order.variant} • ` : ''}পরিমাণ: {order.quantity}
                        </div>
                      </td>
                      <td className="py-3.5 px-5 font-bold text-slate-900">
                        {formatBDT(total)}
                      </td>
                      <td className="py-3.5 px-5">
                        <span className={`font-bold ${order.calculated_profit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                          {formatBDT(order.calculated_profit)}
                        </span>
                        <div className="text-[10px] text-slate-400">
                          মার্জিন: {order.profit_margin_pct}%
                        </div>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${statusInfo.bg} ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectOrder?.(order);
                          }}
                          className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                        >
                          ডিটেইলস
                        </button>
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
