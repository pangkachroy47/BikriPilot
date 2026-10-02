import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ORDER_STATUS_MAP, Order, OrderStatus } from '../../types';
import { formatBDT, calculateOrderProfit, calculateReturnLoss } from '../../utils/calculations';
import { generateInvoicePdf, downloadPdfBlob, printInvoiceSlip } from '../../services/invoiceGenerator';
import {
  X,
  FileText,
  Printer,
  Copy,
  Check,
  Phone,
  MapPin,
  Clock,
  Trash2,
  AlertTriangle,
  Download,
  Share2,
} from 'lucide-react';

interface OrderDetailsModalProps {
  order: Order | null;
  onClose: () => void;
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  order,
  onClose,
}) => {
  const { currentShop, updateOrderStatus, deleteOrder } = useApp();
  const [copiedCourier, setCopiedCourier] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  if (!order) return null;

  const statusInfo = ORDER_STATUS_MAP[order.status] || ORDER_STATUS_MAP.New;
  const isReturned = order.status === 'Returned';
  const returnLoss = calculateReturnLoss(order);
  const total = order.selling_price * order.quantity + order.delivery_charge;
  const dueOnDelivery = Math.max(0, total - order.advance_payment);

  const handleDownloadInvoice = async () => {
    setGeneratingPdf(true);
    setPdfError(null);
    try {
      const pdfBytes = await generateInvoicePdf(order, currentShop);
      downloadPdfBlob(pdfBytes, `Invoice_${order.order_number}_${order.customer_name}.pdf`);
    } catch (err) {
      console.error('Invoice generation failed:', err);
      setPdfError('ইনভয়েস তৈরি করতে সমস্যা হয়েছে।');
      setTimeout(() => setPdfError(null), 4000);
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleCopyCourier = () => {
    const courierText = `নাম: ${order.customer_name}
মোবাইল: ${order.phone}
ঠিকানা: ${order.full_address}, ${order.thana ? order.thana + ', ' : ''}${order.district}
পণ্য: ${order.product_name} (${order.variant || 'Standard'}) x ${order.quantity}
কালেকশন টাকা (COD): ${dueOnDelivery} টাকা
বিশেষ নোট: ${order.notes || 'N/A'}`;

    navigator.clipboard.writeText(courierText);
    setCopiedCourier(true);
    setTimeout(() => setCopiedCourier(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-base">{order.order_number}</span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${statusInfo.bg} ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              তারিখ: {new Date(order.created_at).toLocaleString('bn-BD')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Quick Actions Row */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDownloadInvoice}
              disabled={generatingPdf}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
            >
              <Download className="w-4 h-4" />
              <span>{generatingPdf ? 'তৈরি হচ্ছে...' : 'PDF মেমো ডাউনলোড'}</span>
            </button>

            <button
              onClick={() => printInvoiceSlip(order, currentShop)}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>প্রিন্ট স্লিপ</span>
            </button>

            <button
              onClick={handleCopyCourier}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition"
            >
              {copiedCourier ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copiedCourier ? 'কপি হয়েছে!' : 'কুরিয়ার টেক্সট কপি'}</span>
            </button>

            <div className="ml-auto flex items-center gap-2">
              <label className="text-xs text-slate-500 font-semibold">স্ট্যাটাস পরিবর্তন:</label>
              <select
                value={order.status}
                onChange={e => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                className={`text-xs font-bold px-2.5 py-1.5 rounded-xl border ${statusInfo.bg} ${statusInfo.color}`}
              >
                {(Object.keys(ORDER_STATUS_MAP) as OrderStatus[]).map(st => (
                  <option key={st} value={st}>
                    {ORDER_STATUS_MAP[st].label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Customer Details Card */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              প্রাপকের বিবরণ
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-xs text-slate-400 block">গ্রাহকের নাম:</span>
                <span className="font-bold text-slate-900">{order.customer_name}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">মোবাইল নম্বর:</span>
                <span className="font-bold text-slate-900 font-mono flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  {order.phone}
                </span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-xs text-slate-400 block">ডেলিভারি ঠিকানা:</span>
                <span className="text-slate-800 font-medium">
                  {order.full_address}
                  {order.thana ? `, ${order.thana}` : ''}
                  {order.district ? `, ${order.district}` : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Product & Payment Summary */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-bold uppercase">
                <tr>
                  <th className="p-3">পণ্য</th>
                  <th className="p-3">ভ্যারিয়েন্ট</th>
                  <th className="p-3 text-center">পরিমাণ</th>
                  <th className="p-3 text-right">একক মূল্য</th>
                  <th className="p-3 text-right">মোট</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="p-3 font-bold text-slate-900">{order.product_name}</td>
                  <td className="p-3 text-slate-600">{order.variant || '-'}</td>
                  <td className="p-3 text-center font-bold">{order.quantity}</td>
                  <td className="p-3 text-right">{formatBDT(order.selling_price)}</td>
                  <td className="p-3 text-right font-bold text-slate-900">
                    {formatBDT(order.selling_price * order.quantity)}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Financial Summary */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between text-slate-600">
                <span>পণ্যের সাবটোটাল:</span>
                <span>{formatBDT(order.selling_price * order.quantity)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>ডেলিভারি চার্জ:</span>
                <span>{formatBDT(order.delivery_charge)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200">
                <span>সর্বমোট বিল:</span>
                <span>{formatBDT(total)}</span>
              </div>
              {order.advance_payment > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>অগ্রিম পরিশোধ (-):</span>
                  <span>{formatBDT(order.advance_payment)}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-sm text-emerald-800 pt-1 border-t border-slate-200">
                <span>ডেলিভারিতে ক্যাশ কালেকশন (COD):</span>
                <span>{formatBDT(dueOnDelivery)}</span>
              </div>
            </div>
          </div>

          {/* Profit Calculation Breakdown Box */}
          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2">
            <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
              নিট লাভ ও খরচের বিশ্লেষণ
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div>
                <span className="text-slate-500 block">পণ্যের খরচ:</span>
                <span className="font-semibold text-slate-800">{formatBDT(order.product_cost * order.quantity)}</span>
              </div>
              <div>
                <span className="text-slate-500 block">কুরিয়ার খরচ:</span>
                <span className="font-semibold text-slate-800">{formatBDT(order.courier_cost)}</span>
              </div>
              <div>
                <span className="text-slate-500 block">প্যাকেজিং খরচ:</span>
                <span className="font-semibold text-slate-800">{formatBDT(order.packaging_cost)}</span>
              </div>
              <div>
                <span className="text-slate-500 block">বিজ্ঞাপন খরচ:</span>
                <span className="font-semibold text-slate-800">{formatBDT(order.ad_cost)}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-emerald-200 flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900">অর্জিত নিট প্রফিট:</span>
              <div className="text-right">
                <span className={`text-base font-black ${order.calculated_profit >= 0 ? 'text-emerald-800' : 'text-rose-600'}`}>
                  {formatBDT(order.calculated_profit)}
                </span>
                <span className="text-xs text-emerald-700 ml-2">
                  (মার্জিন {order.profit_margin_pct}%)
                </span>
              </div>
            </div>
          </div>

          {/* Return Loss Warning Box if Returned */}
          {isReturned && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>রিটার্ন লস ক্ষতি বিশ্লেষণ</span>
              </div>
              <div className="text-xs text-rose-700 space-y-1">
                <div className="flex justify-between">
                  <span>আউটবাউন্ড কুরিয়ার চার্জ:</span>
                  <span>{formatBDT(returnLoss.outboundCourierCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span>রিটার্ন কুরিয়ার চার্জ:</span>
                  <span>{formatBDT(returnLoss.returnCourierCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span>নষ্ট প্যাকেজিং ও অ্যাড কস্ট:</span>
                  <span>{formatBDT(returnLoss.packagingCost + Number(order.ad_cost))}</span>
                </div>
                <div className="flex justify-between font-bold pt-1 border-t border-rose-200 text-rose-900">
                  <span>মোট রিটার্ন লোকসান:</span>
                  <span>{formatBDT(returnLoss.totalReturnLoss)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Order Notes */}
          {order.notes && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
              <strong>বিশেষ নোট:</strong> {order.notes}
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={() => {
              if (confirm('আপনি কি নিশ্চিত যে এই অর্ডারটি মুছে ফেলতে চান?')) {
                deleteOrder(order.id);
                onClose();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-semibold transition"
          >
            <Trash2 className="w-4 h-4" />
            <span>অর্ডার মুছুন</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
