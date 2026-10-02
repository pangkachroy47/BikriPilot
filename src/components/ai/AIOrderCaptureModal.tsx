import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AIParsedDraft, Order } from '../../types';
import { formatBDT, calculateOrderProfit } from '../../utils/calculations';
import {
  Sparkles,
  X,
  Check,
  ArrowRight,
  AlertCircle,
  Copy,
  CheckCircle2,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  Cpu,
} from 'lucide-react';
import { SUBSCRIPTION_PLANS } from '../../config/plans';
import { trackEvent } from '../../utils/analytics';
import { checkSubscriptionAccess } from '../../utils/accessControl';

interface AIOrderCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderSaved?: (order: Order) => void;
  onNavigateBilling?: () => void;
}

const SAMPLE_CHATS = [
  {
    title: 'পাঞ্জাবি অর্ডার (মিরপুর, ঢাকা)',
    text: `আসসালামু আলাইকুম ভাইয়া। আপনাদের পেইজের কটন কাশ্মীরি পাঞ্জাবি টা খুব পছন্দ হয়েছে। রয়েল ব্লু কালার XL সাইজ ২ পিস নিতে চাই। 
আমার নাম: তানভীর আহমেদ
ফোন: 01712987654
ঠিকানা: বাড়ি ১২, রোড ৪, ব্লক সি, মিরপুর ১০, ঢাকা।
দয়া করে তাড়াতাড়ি পাঠাবেন, ডেলিভারির আগে কল দিলেই হবে।`,
  },
  {
    title: 'পার্টি গাউন অর্ডার (চট্টগ্রাম - ২০০ অগ্রিম)',
    text: `হ্যালো আপু, মেরুন কালার প্রিমিয়াম জর্জেট পার্টি গাউন সাইজ L একটা বুকিং দেন।
বিকাশে ২০০ টাকা অ্যাডভান্স পাঠাচ্ছি।
নাম: নুসরাত জাহান রিয়া
মোবাইল: 01819345678
ঠিকানা: হাউজ ২১, লেন ৩, কে-ব্লক, হালিশহর হাউজিং, চট্টগ্রাম।`,
  },
  {
    title: 'সুন্দরবনের মধু অর্ডার (সিলেট)',
    text: `ভাই সুন্দরবনের ১ কেজি খাঁটি মধুর কাচের জার টা অর্ডার করতে চাই। ক্যাশ অন ডেলিভারি হবে তো? দাম ১২৫০ টাকা বলছিলেন।
নাম: শরীফুল ইসলাম
ফোন: 01911223344
ঠিকানা: মিতা কমপ্লেক্স ৩য় তলা, জিন্দাবাজার, সিলেট। জরুরি দরকার।`,
  },
];

export const AIOrderCaptureModal: React.FC<AIOrderCaptureModalProps> = ({
  isOpen,
  onClose,
  onOrderSaved,
  onNavigateBilling,
}) => {
  const { currentShop, currentUser, createOrder, products, recordAILog, aiParseLogs } = useApp();
  const access = checkSubscriptionAccess(currentShop, currentUser);

  const [step, setStep] = useState<'input' | 'review'>('input');
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usedModel, setUsedModel] = useState<string>('gemini-3.8-flash');

  // Review & Edit Form state
  const [draft, setDraft] = useState<AIParsedDraft>({
    customer_name: null,
    phone: null,
    district: null,
    thana: null,
    address: null,
    product_name: null,
    variant: null,
    quantity: 1,
    selling_price: null,
    advance_payment: 0,
    payment_method: 'Cash on Delivery',
    notes: null,
    confidence_score: 0.9,
    missing_fields: [],
  });

  // Financial fields for the order
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [deliveryCharge, setDeliveryCharge] = useState<number>(currentShop.default_delivery_inside);
  const [advancePayment, setAdvancePayment] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash on Delivery');
  const [productCost, setProductCost] = useState<number>(0);
  const [courierCost, setCourierCost] = useState<number>(currentShop.default_delivery_inside);
  const [packagingCost, setPackagingCost] = useState<number>(currentShop.default_packaging_cost);
  const [adCost, setAdCost] = useState<number>(currentShop.default_ad_cost);

  const plan = SUBSCRIPTION_PLANS.find(p => p.id === currentShop.subscription_plan) || SUBSCRIPTION_PLANS[0];
  const monthlyParsesUsed = aiParseLogs.length;
  const isLimitReached = monthlyParsesUsed >= plan.monthlyAILimit && plan.monthlyAILimit < 9999;

  if (!isOpen) return null;

  const handleParse = async () => {
    if (!inputText.trim()) {
      setError('মেসেঞ্জার চ্যাটের টেক্সট পেস্ট করুন।');
      return;
    }

    if (isLimitReached) {
      setError(`আপনার বর্তমান ${plan.nameBn} প্ল্যানের মাসিক AI ক্যাপচার সীমা (${plan.monthlyAILimit}) শেষ হয়েছে। দয়া করে প্ল্যান আপগ্রেড করুন।`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/parse-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationText: inputText,
          shopId: currentShop.id,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'চ্যাট পার্স করতে সমস্যা হয়েছে।');
      }

      const extracted: AIParsedDraft = data.draftOrder;
      setDraft(extracted);
      setUsedModel(data.model || 'gemini-3.8-flash');

      // Try matching existing product to prepopulate selling price and cost
      const matchedProd = products.find(p =>
        extracted.product_name &&
        (p.name.toLowerCase().includes(extracted.product_name.toLowerCase()) ||
         extracted.product_name.toLowerCase().includes(p.name.toLowerCase()))
      );

      if (matchedProd) {
        setSellingPrice(matchedProd.selling_price);
        setProductCost(matchedProd.cost_price);
      } else if (extracted.selling_price) {
        setSellingPrice(extracted.selling_price);
        setProductCost(Math.round(extracted.selling_price * 0.5));
      } else {
        setSellingPrice(1250);
        setProductCost(650);
      }

      // Check if address is outside Dhaka
      const isOutsideDhaka = extracted.district && !/dhaka|ঢাকা/i.test(extracted.district);
      const delivery = isOutsideDhaka ? currentShop.default_delivery_outside : currentShop.default_delivery_inside;
      setDeliveryCharge(delivery);
      setCourierCost(delivery);

      // Advance payment from Gemini structured output
      if (typeof extracted.advance_payment === 'number' && extracted.advance_payment > 0) {
        setAdvancePayment(extracted.advance_payment);
        setPaymentMethod(extracted.payment_method || 'bKash');
      } else {
        setAdvancePayment(0);
        setPaymentMethod('Cash on Delivery');
      }

      if (data.log) {
        recordAILog(data.log);
      }

      trackEvent('AIOrderCaptured', {
        shop_id: currentShop.id,
        model: data.model || 'gemini-3.8-flash',
        success: true,
        confidence_score: extracted.confidence_score || 0.9,
      }, currentShop.id);

      setStep('review');
    } catch (err: any) {
      setError(err.message || 'সার্ভার যোগাযোগে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveOrder = () => {
    if (!draft.customer_name?.trim()) {
      setError('গ্রাহকের নাম উল্লেখ করুন');
      return;
    }
    if (!draft.phone?.trim()) {
      setError('মোবাইল নম্বর উল্লেখ করুন');
      return;
    }
    if (!draft.address?.trim()) {
      setError('ডেলিভারি ঠিকানা আবশ্যক');
      return;
    }

    const saved = createOrder({
      customer_name: draft.customer_name,
      phone: draft.phone,
      district: draft.district || 'ঢাকা',
      thana: draft.thana || '',
      full_address: draft.address,
      product_name: draft.product_name || 'পণ্য',
      variant: draft.variant || '',
      quantity: draft.quantity || 1,
      selling_price: sellingPrice,
      delivery_charge: deliveryCharge,
      advance_payment: advancePayment,
      payment_method: paymentMethod,
      product_cost: productCost,
      courier_cost: courierCost,
      packaging_cost: packagingCost,
      ad_cost: adCost,
      status: 'New',
      notes: draft.notes || '',
    });

    if (onOrderSaved) {
      onOrderSaved(saved);
    }
    handleClose();
  };

  const handleClose = () => {
    setStep('input');
    setInputText('');
    setError(null);
    onClose();
  };

  // Profit simulation in review mode
  const currentQuantity = draft.quantity || 1;
  const profitCalc = calculateOrderProfit({
    selling_price: sellingPrice,
    quantity: currentQuantity,
    delivery_charge: deliveryCharge,
    product_cost: productCost,
    courier_cost: courierCost,
    packaging_cost: packagingCost,
    ad_cost: adCost,
    status: 'New',
  });

  const totalBill = sellingPrice * currentQuantity + deliveryCharge;
  const codAmount = Math.max(0, totalBill - advancePayment);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-[#1C2434] text-white p-5 flex items-center justify-between border-b border-[#2E3A4B]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold tracking-tight">AI মেসেঞ্জার অর্ডার ক্যাপচার</h3>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-mono px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Gemini Structured Output
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                চ্যাট পেস্ট করলেই Gemini AI ৩০ সেকেন্ডে সঠিক অর্ডার কাঠামো তৈরি করে
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Plan Limit Pill */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-2 flex items-center justify-between text-xs text-slate-600">
          <span>
            চলতি মাসে AI ক্যাপচার ব্যবহার: <strong>{monthlyParsesUsed}</strong> / {plan.monthlyAILimit} বার
          </span>
          <span className="font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[11px]">
            {plan.nameBn} প্ল্যান
          </span>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-rose-700 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {!access.hasAccess && (
          <div className="p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-slate-900">{access.title}</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">{access.message}</p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  handleClose();
                  if (onNavigateBilling) {
                    onNavigateBilling();
                  }
                }}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
              >
                বিলিং ও সাবস্ক্রিপশন পেজে যান
              </button>
            </div>
          </div>
        )}

        {/* STEP 1: Input Screen */}
        {access.hasAccess && step === 'input' && (
          <div className="p-6 space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                গ্রাহকের মেসেঞ্জার বা হোয়াটসঅ্যাপ চ্যাট পেস্ট করুন:
              </label>
              <textarea
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder="যেমন: ভাইয়া রয়েল ব্লু কটন কাশ্মীরি পাঞ্জাবি XL সাইজ ১ পিস নিতে চাই। বিকাশে ২০০ টাকা পাঠাচ্ছি। নাম: তানভীর, ফোন: 017xxxxxxxx, ঠিকানা: মিরপুর ১০, ঢাকা..."
                className="w-full h-36 p-3 text-sm bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-sans leading-relaxed transition"
              />
            </div>

            {/* Quick Demo Samples */}
            <div>
              <p className="text-xs font-bold text-slate-500 mb-2">
                বা ১ ক্লিকে টেস্ট করার জন্য ডেমো চ্যাট সিলেক্ট করুন:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {SAMPLE_CHATS.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setInputText(s.text)}
                    className="text-left p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 transition text-xs"
                  >
                    <div className="font-bold text-slate-800 flex items-center gap-1">
                      <Copy className="w-3 h-3 text-emerald-600" />
                      {s.title}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <Cpu className="w-3.5 h-3.5 text-emerald-600" />
                <span>Gemini 3.8 Flash দ্বারা পরিচালিত</span>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  disabled={loading || !inputText.trim()}
                  onClick={handleParse}
                  className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition active:scale-98"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Gemini AI বিশ্লেষণ করছে...</span>
                    </>
                  ) : (
                    <>
                      <span>অর্ডার সাজিয়ে দিন</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Review Screen (Structured output inspection & profit preview) */}
        {step === 'review' && (
          <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            {/* Model & Confidence Bar */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-emerald-900">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>Gemini AI সফলভাবে এক্সট্র্যাক্ট করেছে</strong> ({usedModel})
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-bold">
                <span className="bg-emerald-200/70 text-emerald-900 px-2 py-0.5 rounded-full">
                  AI আত্মবিশ্বাস: {Math.round((draft.confidence_score || 0.9) * 100)}%
                </span>
              </div>
            </div>

            {/* Missing fields alert if any */}
            {draft.missing_fields && draft.missing_fields.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 text-amber-900 text-xs p-3 rounded-2xl flex items-center gap-2 font-medium">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  কিছু তথ্য চ্যাটে পাওয়া যায়নি: <strong>{draft.missing_fields.join(', ')}</strong>। অনুগ্রহ করে নিচে পূরণ করুন।
                </span>
              </div>
            )}

            {/* Extracted Customer Fields */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                গ্রাহক ও ডেলিভারি তথ্য
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">গ্রাহকের নাম *</label>
                  <input
                    type="text"
                    value={draft.customer_name || ''}
                    onChange={e => setDraft({ ...draft, customer_name: e.target.value })}
                    placeholder="যেমন: তানভীর আহমেদ"
                    className="w-full p-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">মোবাইল নম্বর *</label>
                  <input
                    type="text"
                    value={draft.phone || ''}
                    onChange={e => setDraft({ ...draft, phone: e.target.value })}
                    placeholder="017xxxxxxxx"
                    className="w-full p-2 text-sm bg-white border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">জেলা</label>
                  <input
                    type="text"
                    value={draft.district || ''}
                    onChange={e => setDraft({ ...draft, district: e.target.value })}
                    placeholder="যেমন: ঢাকা / চট্টগ্রাম"
                    className="w-full p-2 text-sm bg-white border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">থানা / এলাকা</label>
                  <input
                    type="text"
                    value={draft.thana || ''}
                    onChange={e => setDraft({ ...draft, thana: e.target.value })}
                    placeholder="যেমন: মিরপুর ১০"
                    className="w-full p-2 text-sm bg-white border border-slate-300 rounded-xl"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block mb-1">পূর্ণাঙ্গ ঠিকানা *</label>
                  <textarea
                    rows={2}
                    value={draft.address || ''}
                    onChange={e => setDraft({ ...draft, address: e.target.value })}
                    placeholder="বাড়ি, রোড, এলাকা..."
                    className="w-full p-2 text-sm bg-white border border-slate-300 rounded-xl"
                  />
                </div>
              </div>
            </div>

            {/* Product & Pricing Fields */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                অর্ডার পণ্য ও মূল্য
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block mb-1">পণ্যের নাম *</label>
                  <input
                    type="text"
                    value={draft.product_name || ''}
                    onChange={e => setDraft({ ...draft, product_name: e.target.value })}
                    placeholder="পণ্যের নাম"
                    className="w-full p-2 text-sm bg-white border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">ভ্যারিয়েন্ট / সাইজ</label>
                  <input
                    type="text"
                    value={draft.variant || ''}
                    onChange={e => setDraft({ ...draft, variant: e.target.value })}
                    placeholder="যেমন: XL / মেরুন"
                    className="w-full p-2 text-sm bg-white border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">পরিমাণ (Qty)</label>
                  <input
                    type="number"
                    min={1}
                    value={draft.quantity || 1}
                    onChange={e => setDraft({ ...draft, quantity: parseInt(e.target.value, 10) || 1 })}
                    className="w-full p-2 text-sm bg-white border border-slate-300 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">একক বিক্রয় মূল্য (টাকা)</label>
                  <input
                    type="number"
                    min={0}
                    value={sellingPrice}
                    onChange={e => setSellingPrice(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 text-sm bg-white border border-slate-300 rounded-xl font-bold text-emerald-800"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">ডেলিভারি চার্জ (টাকা)</label>
                  <input
                    type="number"
                    min={0}
                    value={deliveryCharge}
                    onChange={e => {
                      const val = parseFloat(e.target.value) || 0;
                      setDeliveryCharge(val);
                      setCourierCost(val);
                    }}
                    className="w-full p-2 text-sm bg-white border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              {/* Advance Payment from Chat */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">অগ্রিম আদায় (৳)</label>
                  <input
                    type="number"
                    min={0}
                    value={advancePayment}
                    onChange={e => setAdvancePayment(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 text-sm bg-white border border-slate-300 rounded-xl font-bold text-blue-700"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">পেমেন্ট মেথড</label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value)}
                    className="w-full p-2 text-sm bg-white border border-slate-300 rounded-xl"
                  >
                    <option value="Cash on Delivery">ক্যাশ অন ডেলিভারি (COD)</option>
                    <option value="bKash">বিকাশ (bKash)</option>
                    <option value="Nagad">নগদ (Nagad)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Quick Profit & COD Ledger Preview */}
            <div className="bg-[#1C2434] text-white p-4 rounded-2xl border border-[#2E3A4B] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  <span>সম্ভাব্য নিট লাভ (Net Profit):</span>
                </span>
                <span className="text-base font-extrabold text-emerald-400">
                  {formatBDT(profitCalc.netProfit)} ({profitCalc.profitMarginPct}%)
                </span>
              </div>
              <div className="flex items-center justify-between text-xs pt-1 border-t border-[#2E3A4B]">
                <span className="text-slate-400">গ্রাহকের কাছ থেকে COD আদায় বাকি:</span>
                <span className="font-bold text-amber-300 font-mono">{formatBDT(codAmount)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep('input')}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                ← আবার চ্যাট পেস্ট করুন
              </button>
              <button
                type="button"
                onClick={handleSaveOrder}
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition active:scale-98"
              >
                <Check className="w-4 h-4" />
                <span>অর্ডার নিশ্চিত ও সংরক্ষণ করুন</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
