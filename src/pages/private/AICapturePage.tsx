import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AIParsedDraft } from '../../types';
import { calculateOrderProfit, formatBDT } from '../../utils/calculations';
import { SUBSCRIPTION_PLANS } from '../../config/plans';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import {
  Sparkles,
  ArrowRight,
  Check,
  AlertCircle,
  Copy,
  RefreshCw,
  CheckCircle2,
  DollarSign,
  Package,
} from 'lucide-react';

interface AICapturePageProps {
  onOrderSaved: () => void;
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
    title: 'পার্টি গাউন অর্ডার (চট্টগ্রাম)',
    text: `হ্যালো আপু, মেরুন কালার প্রিমিয়াম জর্জেট পার্টি গাউন সাইজ L একটা বুকিং দেন।
বিকাশে ২০০ টাকা অ্যাডভান্স পাঠাচ্ছি।
নাম: নুসরাত জাহান রিয়া
মোবাইল: 01819345678
ঠিকানা: হাউজ ২১, লেন ৩, কে-ব্লক, হালিশহর হাউজিং, চট্টগ্রাম।`,
  },
  {
    title: 'সুন্দরবনের মধু অর্ডার (সিলেট)',
    text: `ভাই সুন্দরবনের ১ কেজি খাঁটি মধুর কাচের জার টা অর্ডার করতে চাই। ক্যাশ অন ডেলিভারি হবে তো?
নাম: শরীফুল ইসলাম
ফোন: 01911223344
ঠিকানা: মিতা কমপ্লেক্স ৩য় তলা, জিন্দাবাজার, সিলেট। জরুরি দরকার।`,
  },
];

export const AICapturePage: React.FC<AICapturePageProps> = ({ onOrderSaved }) => {
  const { currentShop, createOrder, products, recordAILog, aiParseLogs } = useApp();

  const [step, setStep] = useState<'input' | 'review'>('input');
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Review fields
  const [draft, setDraft] = useState<AIParsedDraft>({
    customer_name: null,
    phone: null,
    district: null,
    thana: null,
    address: null,
    product_name: null,
    variant: null,
    quantity: 1,
    notes: null,
  });

  const [sellingPrice, setSellingPrice] = useState<number>(1200);
  const [deliveryCharge, setDeliveryCharge] = useState<number>(currentShop.default_delivery_inside);
  const [advancePayment, setAdvancePayment] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash on Delivery');
  const [productCost, setProductCost] = useState<number>(600);
  const [courierCost, setCourierCost] = useState<number>(currentShop.default_delivery_inside);
  const [packagingCost, setPackagingCost] = useState<number>(currentShop.default_packaging_cost);
  const [adCost, setAdCost] = useState<number>(currentShop.default_ad_cost);

  const plan = SUBSCRIPTION_PLANS.find(p => p.id === currentShop.subscription_plan) || SUBSCRIPTION_PLANS[0];

  const handleParse = async () => {
    if (!inputText.trim()) {
      setError('মেসেঞ্জার চ্যাটের টেক্সট পেস্ট করুন।');
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
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'অর্ডার পার্স করতে সমস্যা হয়েছে।');
      }

      const extracted: AIParsedDraft = data.draftOrder;
      setDraft(extracted);

      const matchedProd = products.find(p =>
        extracted.product_name && p.name.toLowerCase().includes(extracted.product_name.toLowerCase())
      );
      if (matchedProd) {
        setSellingPrice(matchedProd.selling_price);
        setProductCost(matchedProd.cost_price);
      } else if (extracted.selling_price) {
        setSellingPrice(extracted.selling_price);
        setProductCost(Math.round(extracted.selling_price * 0.5));
      }

      if (typeof extracted.advance_payment === 'number' && extracted.advance_payment > 0) {
        setAdvancePayment(extracted.advance_payment);
        setPaymentMethod(extracted.payment_method || 'bKash');
      }

      const isOutsideDhaka = extracted.district && !/dhaka|ঢাকা/i.test(extracted.district);
      const delivery = isOutsideDhaka ? currentShop.default_delivery_outside : currentShop.default_delivery_inside;
      setDeliveryCharge(delivery);
      setCourierCost(delivery);

      if (data.log) {
        recordAILog(data.log);
      }

      setStep('review');
    } catch (err: any) {
      setError(err.message || 'সার্ভার যোগাযোগে সমস্যা হয়েছে।');
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

    createOrder({
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
      notes: draft.notes || '',
      status: 'New',
    });

    onOrderSaved();
  };

  const previewProfit = calculateOrderProfit({
    selling_price: sellingPrice,
    quantity: draft.quantity || 1,
    delivery_charge: deliveryCharge,
    product_cost: productCost,
    courier_cost: courierCost,
    packaging_cost: packagingCost,
    ad_cost: adCost,
    status: 'New',
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* TailAdmin Breadcrumb */}
      <Breadcrumb
        pageName="AI মেসেঞ্জার অর্ডার ক্যাপচার"
        parentName="BikriPilot"
      />

      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-800 text-white rounded-3xl p-6 shadow-md flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-300" />
            <h1 className="text-xl font-bold">AI মেসেঞ্জার অর্ডার ক্যাপচার</h1>
          </div>
          <p className="text-xs text-emerald-100">
            গ্রাহকের পাঠানো মেসেঞ্জার চ্যাট পেস্ট করলেই Gemini AI অর্ডার তৈরি করে দেবে
          </p>
        </div>
        <div className="text-right text-xs bg-white/10 px-3 py-1.5 rounded-2xl">
          <span>ব্যবহার: </span>
          <strong>{aiParseLogs.length}</strong> / {plan.monthlyAILimit} বার
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl flex items-center gap-2 text-sm font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {step === 'input' ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div>
            <label className="text-sm font-bold text-slate-800 block mb-2">
              মেসেঞ্জার বা হোয়াটসঅ্যাপের চ্যাট টেক্সট পেস্ট করুন:
            </label>
            <textarea
              rows={6}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder="গ্রাহকের সম্পূর্ণ চ্যাট এখানে পেস্ট করুন..."
              className="w-full p-4 bg-slate-50 border border-slate-300 rounded-2xl text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              অথবা ১ ক্লিকে ডেমো টেস্ট করুন:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {SAMPLE_CHATS.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setInputText(s.text)}
                  className="p-3 text-left bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 rounded-2xl transition text-xs space-y-1"
                >
                  <div className="font-bold text-slate-800 flex items-center gap-1">
                    <Copy className="w-3 h-3 text-emerald-600" />
                    <span>{s.title}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 line-clamp-2">{s.text}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <button
              type="button"
              disabled={loading || !inputText.trim()}
              onClick={handleParse}
              className="flex items-center gap-2 px-8 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-2xl shadow-md transition active:scale-98"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>AI বিশ্লেষণ করছে...</span>
                </>
              ) : (
                <>
                  <span>AI দিয়ে অর্ডার বের করুন</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* Review Screen */
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-xs text-amber-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>যাচাই করুন:</strong> AI তথ্যগুলো বের করেছে। আপনি প্রতিটি ফিল্ড চেক ও এডিট করে চূড়ান্ত সংরক্ষণ করুন।
            </span>
          </div>

          {/* Customer fields */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              গ্রাহক ও ডেলিভারি বিবরণ
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">গ্রাহকের নাম *</label>
                <input
                  type="text"
                  value={draft.customer_name || ''}
                  onChange={e => setDraft({ ...draft, customer_name: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">মোবাইল নম্বর *</label>
                <input
                  type="text"
                  value={draft.phone || ''}
                  onChange={e => setDraft({ ...draft, phone: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">জেলা</label>
                <input
                  type="text"
                  value={draft.district || ''}
                  onChange={e => setDraft({ ...draft, district: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">থানা / এলাকা</label>
                <input
                  type="text"
                  value={draft.thana || ''}
                  onChange={e => setDraft({ ...draft, thana: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 block mb-1">পূর্ণ ঠিকানা *</label>
                <textarea
                  rows={2}
                  value={draft.address || ''}
                  onChange={e => setDraft({ ...draft, address: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm"
                />
              </div>
            </div>
          </div>

          {/* Pricing fields */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              পণ্য ও মূল্যের হিসাব
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 block mb-1">পণ্যের নাম *</label>
                <input
                  type="text"
                  value={draft.product_name || ''}
                  onChange={e => setDraft({ ...draft, product_name: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">ভ্যারিয়েন্ট</label>
                <input
                  type="text"
                  value={draft.variant || ''}
                  onChange={e => setDraft({ ...draft, variant: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">পরিমাণ</label>
                <input
                  type="number"
                  min={1}
                  value={draft.quantity || 1}
                  onChange={e => setDraft({ ...draft, quantity: parseInt(e.target.value, 10) || 1 })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">বিক্রয় মূল্য (টাকা)</label>
                <input
                  type="number"
                  value={sellingPrice}
                  onChange={e => setSellingPrice(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold text-emerald-800"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">ডেলিভারি চার্জ (টাকা)</label>
                <input
                  type="number"
                  value={deliveryCharge}
                  onChange={e => setDeliveryCharge(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">অগ্রিম টাকা</label>
                <input
                  type="number"
                  value={advancePayment}
                  onChange={e => setAdvancePayment(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold text-blue-700"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">পেমেন্ট মেথড</label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm"
                >
                  <option value="Cash on Delivery">Cash on Delivery</option>
                  <option value="bKash">bKash</option>
                  <option value="Nagad">Nagad</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">পণ্যের ক্রয় খরচ</label>
                <input
                  type="number"
                  value={productCost}
                  onChange={e => setProductCost(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm"
                />
              </div>
            </div>
          </div>

          {/* Profit Preview */}
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-emerald-800 block">আনুমানিক নিট প্রফিট:</span>
              <span className="text-2xl font-black text-emerald-800">{formatBDT(previewProfit.netProfit)}</span>
              <span className="text-xs text-emerald-600 ml-2 font-semibold">(মার্জিন {previewProfit.profitMarginPct}%)</span>
            </div>
            <div className="text-xs text-slate-500 text-right">
              রেভিনিউ: {formatBDT(previewProfit.revenue)} | খরচ: {formatBDT(previewProfit.totalExpenses)}
            </div>
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setStep('input')}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              ← পেছনে যান
            </button>
            <button
              type="button"
              onClick={handleSaveOrder}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md"
            >
              <Check className="w-4 h-4" />
              <span>অর্ডার ফাইনাল সেভ করুন</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
