import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ORDER_STATUS_MAP, Order, OrderStatus } from '../../types';
import { formatBDT } from '../../utils/calculations';
import { exportOrdersCsv } from '../../utils/csv';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import {
  Search,
  Download,
  Plus,
  Sparkles,
  Phone,
  MapPin,
  Calendar,
  Filter,
  CheckCircle,
  Truck,
  RotateCcw,
  XCircle,
  Clock,
  Package,
} from 'lucide-react';

interface OrdersPageProps {
  onNavigateNewOrder: () => void;
  onOpenAIModal: () => void;
  onSelectOrder: (order: Order) => void;
}

export const OrdersPage: React.FC<OrdersPageProps> = ({
  onNavigateNewOrder,
  onOpenAIModal,
  onSelectOrder,
}) => {
  const { orders, updateOrderStatus, deleteOrder } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Status counts
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: orders.length };
    Object.keys(ORDER_STATUS_MAP).forEach(k => {
      counts[k] = orders.filter(o => o.status === k).length;
    });
    return counts;
  }, [orders]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchesStatus = selectedStatus === 'ALL' || o.status === selectedStatus;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        o.order_number.toLowerCase().includes(q) ||
        o.customer_name.toLowerCase().includes(q) ||
        o.phone.includes(q) ||
        o.district.toLowerCase().includes(q) ||
        o.product_name.toLowerCase().includes(q);

      return matchesStatus && matchesSearch;
    });
  }, [orders, selectedStatus, searchQuery]);

  const handleExportCsv = () => {
    exportOrdersCsv(filteredOrders);
  };

  return (
    <div className="space-y-6">
      {/* TailAdmin Breadcrumb */}
      <Breadcrumb
        pageName="অর্ডার তালিকা ও ট্র্যাকিং"
        parentName="BikriPilot"
        onNavigateHome={() => onNavigateNewOrder()}
      />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">অর্ডার ব্যবস্থাপনা</h1>
          <p className="text-sm text-slate-500">
            মোট {orders.length}টি অর্ডারের স্ট্যাটাস, লাভ ও ডেলিভারি হিসেব
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-xs transition"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>CSV এক্সপোর্ট</span>
          </button>
          <button
            onClick={onOpenAIModal}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>AI ক্যাপচার</span>
          </button>
          <button
            onClick={onNavigateNewOrder}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন অর্ডার</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="গ্রাহকের নাম, মোবাইল নম্বর (017...), জেলা বা অর্ডার আইডি দিয়ে খুঁজুন..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition"
          />
        </div>

        {/* Status Tab Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setSelectedStatus('ALL')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition ${
              selectedStatus === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            সব ({statusCounts.ALL || 0})
          </button>

          {(Object.keys(ORDER_STATUS_MAP) as OrderStatus[]).map(st => {
            const count = statusCounts[st] || 0;
            const isSelected = selectedStatus === st;
            return (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {ORDER_STATUS_MAP[st].label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Package className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-medium">কোনো অর্ডার পাওয়া যায়নি।</p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-2 text-xs text-emerald-600 font-semibold underline"
              >
                সার্চ ফিল্টার ক্লিয়ার করুন
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-[11px] text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">অর্ডার #</th>
                  <th className="py-3 px-4">গ্রাহক ও মোবাইল</th>
                  <th className="py-3 px-4">ঠিকানা</th>
                  <th className="py-3 px-4">অর্ডারকৃত পণ্য</th>
                  <th className="py-3 px-4">মোট বিল</th>
                  <th className="py-3 px-4">নিট লাভ / ক্ষতি</th>
                  <th className="py-3 px-4">বর্তমান স্ট্যাটাস</th>
                  <th className="py-3 px-4 text-right">কুইক অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map(order => {
                  const statusInfo = ORDER_STATUS_MAP[order.status] || ORDER_STATUS_MAP.New;
                  const total = order.selling_price * order.quantity + order.delivery_charge;
                  const isReturned = order.status === 'Returned';

                  return (
                    <tr
                      key={order.id}
                      onClick={() => onSelectOrder(order)}
                      className="hover:bg-slate-50/80 transition cursor-pointer"
                    >
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <div>{order.order_number}</div>
                        <div className="text-[10px] text-slate-400 font-normal">
                          {new Date(order.created_at).toLocaleDateString('bn-BD', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800">{order.customer_name}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 font-mono">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{order.phone}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 max-w-[180px]">
                        <div className="text-xs text-slate-700 truncate font-medium">
                          {order.full_address}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {order.thana ? `${order.thana}, ` : ''}{order.district}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 text-xs">
                          {order.product_name}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {order.variant ? `${order.variant} • ` : ''}পরিমাণ: {order.quantity} টি
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {formatBDT(total)}
                        {order.advance_payment > 0 && (
                          <div className="text-[10px] text-emerald-600 font-normal">
                            অগ্রিম: {formatBDT(order.advance_payment)}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className={`font-bold ${order.calculated_profit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                          {formatBDT(order.calculated_profit)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {isReturned ? 'রিটার্ন ক্ষতি' : `মার্জিন: ${order.profit_margin_pct}%`}
                        </div>
                      </td>
                      <td className="py-3.5 px-4" onClick={e => e.stopPropagation()}>
                        <select
                          value={order.status}
                          onChange={e => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                          className={`text-xs font-bold px-2 py-1 rounded-lg border ${statusInfo.bg} ${statusInfo.color} focus:outline-hidden focus:ring-1 focus:ring-emerald-500 cursor-pointer`}
                        >
                          {(Object.keys(ORDER_STATUS_MAP) as OrderStatus[]).map(st => (
                            <option key={st} value={st}>
                              {ORDER_STATUS_MAP[st].label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3.5 px-4 text-right" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => onSelectOrder(order)}
                          className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                        >
                          ইনভয়েস ও মেমো
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
