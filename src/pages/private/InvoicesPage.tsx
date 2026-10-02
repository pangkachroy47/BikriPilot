import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Order } from '../../types';
import { formatBDT } from '../../utils/calculations';
import { generateInvoicePdf, downloadPdfBlob, printInvoiceSlip } from '../../services/invoiceGenerator';
import { trackEvent } from '../../utils/analytics';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import {
  FileText,
  Download,
  Search,
  Printer,
  Calendar,
  Phone,
  CheckCircle,
  DollarSign,
  TrendingUp,
  Package,
} from 'lucide-react';

interface InvoicesPageProps {
  onSelectOrder: (order: Order) => void;
}

export const InvoicesPage: React.FC<InvoicesPageProps> = ({ onSelectOrder }) => {
  const { currentShop, orders } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);

  const filteredOrders = orders.filter(
    o =>
      o.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.phone.includes(searchQuery)
  );

  // Financial aggregates
  const totalBilled = orders.reduce((sum, o) => sum + (o.selling_price * o.quantity + o.delivery_charge), 0);
  const totalAdvance = orders.reduce((sum, o) => sum + o.advance_payment, 0);
  const totalCodPending = Math.max(0, totalBilled - totalAdvance);

  const handleDownload = async (order: Order) => {
    setDownloadingId(order.id);
    setInvoiceError(null);
    try {
      const pdfBytes = await generateInvoicePdf(order, currentShop);
      downloadPdfBlob(pdfBytes, `Invoice_${order.order_number}_${order.customer_name}.pdf`);
      trackEvent('InvoiceDownloaded', {
        order_number: order.order_number,
        format: 'pdf',
      }, currentShop.id);
    } catch (err) {
      console.error(err);
      setInvoiceError('ইনভয়েস তৈরি করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
      setTimeout(() => setInvoiceError(null), 4000);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* TailAdmin Breadcrumb */}
      <Breadcrumb
        pageName="মেমো ও ইনভয়েস সেন্টার"
        parentName="BikriPilot"
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">মেমো ও ইনভয়েস সেন্টার</h1>
          <p className="text-sm text-slate-500">
            প্রতিটি অর্ডারের জন্য প্রফেশনাল পিডিএফ মেমো ও প্রিন্টযোগ্য পার্সেল স্লিপ তৈরি করুন
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-1">
            <FileText className="w-4 h-4 text-emerald-600" />
            <span>মোট ইনভয়েস সংখ্যা</span>
          </div>
          <div className="text-2xl font-black text-slate-900">{orders.length} টি</div>
          <div className="text-[11px] text-slate-400 mt-1">শপ: {currentShop.name}</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-1">
            <DollarSign className="w-4 h-4 text-blue-600" />
            <span>মোট ইনভয়েস ভ্যালু</span>
          </div>
          <div className="text-2xl font-black text-slate-900">{formatBDT(totalBilled)}</div>
          <div className="text-[11px] text-blue-600 font-semibold mt-1">
            অগ্রিম জমা: {formatBDT(totalAdvance)}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-1">
            <TrendingUp className="w-4 h-4 text-amber-600" />
            <span>ক্যাশ অন ডেলিভারি (COD পাওনা)</span>
          </div>
          <div className="text-2xl font-black text-amber-700">{formatBDT(totalCodPending)}</div>
          <div className="text-[11px] text-slate-400 mt-1">কুরিয়ার থেকে আদায়যোগ্য</div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="অর্ডার আইডি (BP-1001), গ্রাহকের নাম বা মোবাইল দিয়ে মেমো খুঁজুন..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition"
          />
        </div>
      </div>

      {/* Invoices List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            কোনো ইনভয়েস পাওয়া যায়নি।
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-[11px] text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">মেমো #</th>
                  <th className="py-3 px-4">তারিখ</th>
                  <th className="py-3 px-4">গ্রাহকের নাম ও ফোন</th>
                  <th className="py-3 px-4">পণ্য ও পরিমাণ</th>
                  <th className="py-3 px-4">মোট টাকা</th>
                  <th className="py-3 px-4">COD বাকি</th>
                  <th className="py-3 px-4 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map(order => {
                  const total = order.selling_price * order.quantity + order.delivery_charge;
                  const cod = Math.max(0, total - order.advance_payment);
                  const isDownloading = downloadingId === order.id;

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-slate-50/80 transition cursor-pointer"
                      onClick={() => onSelectOrder(order)}
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {order.invoice_id || order.order_number}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500">
                        {new Date(order.created_at).toLocaleDateString('bn-BD', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{order.customer_name}</div>
                        <div className="text-xs text-slate-500 font-mono">{order.phone}</div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-800">
                        {order.product_name} ({order.quantity} টি)
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {formatBDT(total)}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-700">
                        {formatBDT(cod)}
                      </td>
                      <td className="py-3.5 px-4 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => printInvoiceSlip(order, currentShop)}
                            title="স্লিপ প্রিন্ট করুন"
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownload(order)}
                            disabled={isDownloading}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition shadow-xs"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>{isDownloading ? 'তৈরি হচ্ছে...' : 'PDF'}</span>
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
    </div>
  );
};
