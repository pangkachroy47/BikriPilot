import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { orderFormSchema, OrderFormValues } from '../../schemas/orderSchema';
import { calculateOrderProfit, calculateReturnLoss, formatBDT } from '../../utils/calculations';
import { OrderStatus, Customer } from '../../types';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import {
  Sparkles,
  Check,
  AlertCircle,
  ArrowLeft,
  DollarSign,
  TrendingUp,
  Package,
  Truck,
  User,
  MapPin,
  CreditCard,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Plus,
  Minus,
  CheckCircle2,
  HelpCircle,
  Store,
} from 'lucide-react';

interface NewOrderPageProps {
  onNavigateOrders: () => void;
  onOpenAIModal: () => void;
}

const BD_DISTRICTS = [
  'ঢাকা (Dhaka)',
  'চট্টগ্রাম (Chittagong)',
  'সিলেট (Sylhet)',
  'রাজশাহী (Rajshahi)',
  'খুলনা (Khulna)',
  'বরিশাল (Barisal)',
  'রংপুর (Rangpur)',
  'ময়মনসিংহ (Mymensingh)',
  'গাজীপুর (Gazipur)',
  'নারায়ণগঞ্জ (Narayanganj)',
  'কুমিল্লা (Comilla)',
  'বগুড়া (Bogra)',
  'যশোর (Jessore)',
  'দিনাজপুর (Dinajpur)',
  'কক্সবাজার (Cox\'s Bazar)',
  'টাঙ্গাইল (Tangail)',
  'ফরিদপুর (Faridpur)',
  'পাবনা (Pabna)',
  'কুষ্টিয়া (Kushtia)',
  'নোয়াখালী (Noakhali)',
];

export const NewOrderPage: React.FC<NewOrderPageProps> = ({
  onNavigateOrders,
  onOpenAIModal,
}) => {
  const { currentShop, createOrder, products, customers } = useApp();

  const [formData, setFormData] = useState<OrderFormValues>({
    customer_name: '',
    phone: '',
    district: 'ঢাকা (Dhaka)',
    thana: '',
    full_address: '',
    product_name: '',
    variant: '',
    quantity: 1,
    selling_price: 0,
    delivery_charge: currentShop.default_delivery_inside,
    advance_payment: 0,
    payment_method: 'Cash on Delivery',
    product_cost: 0,
    courier_cost: currentShop.default_delivery_inside,
    packaging_cost: currentShop.default_packaging_cost,
    ad_cost: currentShop.default_ad_cost,
    other_cost: 0,
    return_courier_cost: 0,
    notes: '',
  });

  const [orderStatus, setOrderStatus] = useState<OrderStatus>('New');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  // Customer Look-up Intelligence by Phone
  const matchedCustomer: Customer | undefined = useMemo(() => {
    const cleaned = formData.phone.trim().replace(/[^0-9]/g, '');
    if (cleaned.length >= 10) {
      return customers.find(c => c.phone.includes(cleaned) || cleaned.includes(c.phone));
    }
    return undefined;
  }, [formData.phone, customers]);

  const handleApplyCustomerHistory = () => {
    if (!matchedCustomer) return;
    setFormData(prev => ({
      ...prev,
      customer_name: matchedCustomer.name || prev.customer_name,
      district: matchedCustomer.district || prev.district,
      thana: matchedCustomer.thana || prev.thana,
      full_address: matchedCustomer.full_address || prev.full_address,
    }));
  };

  // When district changes, automatically adjust default delivery charge
  const handleDistrictChange = (dist: string) => {
    const isOutside = !/dhaka|ঢাকা/i.test(dist);
    const charge = isOutside ? currentShop.default_delivery_outside : currentShop.default_delivery_inside;
    setFormData(prev => ({
      ...prev,
      district: dist,
      delivery_charge: charge,
      courier_cost: charge,
    }));
  };

  // When selecting existing product from inventory
  const handleSelectProduct = (prodId: string) => {
    setSelectedProductId(prodId);
    const prod = products.find(p => p.id === prodId);
    if (!prod) return;
    setFormData(prev => ({
      ...prev,
      product_name: prod.name,
      variant: prod.variant,
      selling_price: prod.selling_price,
      product_cost: prod.cost_price,
    }));
  };

  // Real-time Profit Engine Calculation
  const profitCalc = calculateOrderProfit({
    selling_price: formData.selling_price,
    quantity: formData.quantity,
    delivery_charge: formData.delivery_charge,
    product_cost: formData.product_cost,
    courier_cost: formData.courier_cost,
    packaging_cost: formData.packaging_cost,
    ad_cost: formData.ad_cost,
    other_cost: formData.other_cost,
    status: orderStatus,
  });

  const returnLossCalc = calculateReturnLoss({
    courier_cost: formData.courier_cost,
    packaging_cost: formData.packaging_cost,
    other_cost: formData.ad_cost, // advertising cost is lost on return
  });

  const totalBill = formData.selling_price * formData.quantity + formData.delivery_charge;
  const codAmount = Math.max(0, totalBill - formData.advance_payment);

  const handleSubmit = (e: React.FormEvent, createAnother = false) => {
    e.preventDefault();
    setErrors({});
    setSuccessMsg(null);

    const validation = orderFormSchema.safeParse(formData);

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach(err => {
        if (err.path && err.path.length > 0) {
          fieldErrors[String(err.path[0])] = err.message;
        }
      });
      setErrors(fieldErrors);
      window.scrollTo({ top: 100, behavior: 'smooth' });
      return;
    }

    try {
      createOrder({
        customer_name: formData.customer_name,
        phone: formData.phone,
        district: formData.district,
        thana: formData.thana,
        full_address: formData.full_address,
        product_name: formData.product_name,
        variant: formData.variant,
        quantity: formData.quantity,
        selling_price: formData.selling_price,
        delivery_charge: formData.delivery_charge,
        advance_payment: formData.advance_payment,
        payment_method: formData.payment_method,
        product_cost: formData.product_cost,
        courier_cost: formData.courier_cost,
        packaging_cost: formData.packaging_cost,
        ad_cost: formData.ad_cost,
        other_cost: formData.other_cost,
        return_courier_cost: formData.return_courier_cost,
        status: orderStatus,
        notes: formData.notes,
      });

      if (createAnother) {
        setSuccessMsg('অর্ডার সফলভাবে সেভ হয়েছে! পরবর্তী অর্ডারের তথ্য দিন।');
        setFormData(prev => ({
          ...prev,
          customer_name: '',
          phone: '',
          full_address: '',
          advance_payment: 0,
          notes: '',
        }));
        setSelectedProductId(null);
      } else {
        setSuccessMsg('অর্ডার তৈরি সফল হয়েছে! অর্ডার তালিকায় নিয়ে যাওয়া হচ্ছে...');
        setTimeout(() => {
          onNavigateOrders();
        }, 700);
      }
    } catch (err: any) {
      setErrors({ form: err?.message || 'অর্ডার সেভ করতে সমস্যা হয়েছে।' });
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* TailAdmin Breadcrumb */}
      <Breadcrumb
        pageName="নতুন অর্ডার তৈরি ও লাভ হিসাব"
        parentName="অর্ডারসমূহ"
        onNavigateHome={onNavigateOrders}
      />

      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={onNavigateOrders}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>অর্ডার তালিকায় ফিরুন</span>
          </button>
          <span className="text-xs text-slate-400">|</span>
          <span className="text-xs font-semibold text-slate-600">
            শপ: <strong>{currentShop.name}</strong>
          </span>
        </div>

        <button
          onClick={onOpenAIModal}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl shadow-xs text-xs font-bold transition active:scale-98"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>মেসেঞ্জার চ্যাট পেস্ট করে AI পূরণ</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-2xl flex items-center gap-3 animate-in fade-in duration-200 font-bold text-xs sm:text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errors.form && (
        <div className="p-4 bg-rose-50 border border-rose-300 text-rose-800 rounded-2xl flex items-center gap-3 text-xs sm:text-sm font-semibold">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errors.form}</span>
        </div>
      )}

      {/* Main Grid: Form Left, Sticky Profit Engine Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Form: Order Details */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          <form id="new-order-form" onSubmit={e => handleSubmit(e, false)} className="space-y-6">
            {/* 1. Customer Intelligence & Address Section */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">১. গ্রাহকের তথ্য ও ডেলিভারি ঠিকানা</h3>
                    <p className="text-[11px] text-slate-500">মোবাইল নম্বর লিখলে পূর্বের কাস্টমার হিস্ট্রি পাওয়া যাবে</p>
                  </div>
                </div>

                {matchedCustomer && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    <span>পুরাতন গ্রাহক</span>
                  </span>
                )}
              </div>

              {/* Matched Customer Intelligence Card */}
              {matchedCustomer && (
                <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                      <ShieldCheck className="w-4 h-4 text-blue-600" />
                      <span>কাস্টমার প্রোফাইল পাওয়া গেছে ({matchedCustomer.name})</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleApplyCustomerHistory}
                      className="text-xs font-bold text-blue-700 hover:text-blue-900 underline"
                    >
                      ঠিকানা স্বয়ংক্রিয় বসান
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[11px] text-blue-800">
                    <div>
                      মোট অর্ডার: <strong>{matchedCustomer.total_orders}টি</strong>
                    </div>
                    <div>
                      সফল ডেলিভারি: <strong className="text-emerald-700">{matchedCustomer.delivered_orders}টি</strong>
                    </div>
                    <div>
                      রিটার্ন: <strong className="text-rose-600">{matchedCustomer.returned_orders}টি</strong>
                    </div>
                  </div>

                  {matchedCustomer.returned_orders > 0 && (
                    <div className="text-[11px] font-semibold text-rose-700 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                      <span>সতর্কতা: এই গ্রাহকের পূর্বে রিটার্ন রেকর্ড রয়েছে! অগ্রিম ডেলিভারি নেওয়ার পরামর্শ দেওয়া হচ্ছে।</span>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    মোবাইল নম্বর (১১ ডিজিট) *
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="017xxxxxxxx"
                    className={`w-full p-2.5 bg-slate-50 border rounded-xl text-sm font-mono focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 ${
                      errors.phone ? 'border-rose-400 bg-rose-50' : 'border-slate-300'
                    }`}
                  />
                  {errors.phone && <p className="text-[11px] text-rose-600 mt-1 font-semibold">{errors.phone}</p>}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    গ্রাহকের পুরো নাম *
                  </label>
                  <input
                    type="text"
                    value={formData.customer_name}
                    onChange={e => setFormData({ ...formData, customer_name: e.target.value })}
                    placeholder="যেমন: তানভীর আহমেদ"
                    className={`w-full p-2.5 bg-slate-50 border rounded-xl text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 ${
                      errors.customer_name ? 'border-rose-400 bg-rose-50' : 'border-slate-300'
                    }`}
                  />
                  {errors.customer_name && <p className="text-[11px] text-rose-600 mt-1 font-semibold">{errors.customer_name}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    জেলা (District) *
                  </label>
                  <select
                    value={formData.district}
                    onChange={e => handleDistrictChange(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white cursor-pointer"
                  >
                    {BD_DISTRICTS.map(dist => (
                      <option key={dist} value={dist}>
                        {dist}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    থানা / উপজেলা (ঐচ্ছিক)
                  </label>
                  <input
                    type="text"
                    value={formData.thana}
                    onChange={e => setFormData({ ...formData, thana: e.target.value })}
                    placeholder="যেমন: মিরপুর, ধানমন্ডি বা সদর"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  সম্পূর্ণ ডেলিভারি ঠিকানা (বাড়ি, রোড, এলাকা) *
                </label>
                <textarea
                  rows={2}
                  value={formData.full_address}
                  onChange={e => setFormData({ ...formData, full_address: e.target.value })}
                  placeholder="বাড়ি ১২, রোড ৪, ব্লক সি, মিরপুর ১০, ঢাকা..."
                  className={`w-full p-2.5 bg-slate-50 border rounded-xl text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 ${
                    errors.full_address ? 'border-rose-400 bg-rose-50' : 'border-slate-300'
                  }`}
                />
                {errors.full_address && <p className="text-[11px] text-rose-600 mt-1 font-semibold">{errors.full_address}</p>}
              </div>
            </div>

            {/* 2. Product & Inventory Section */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    <Package className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">২. পণ্য ও স্টক নির্বাচন</h3>
                    <p className="text-[11px] text-slate-500">ইনভেন্টরি থেকে ক্লিক করে বা সরাসরি টাইপ করুন</p>
                  </div>
                </div>
              </div>

              {/* Fast inventory selection chips */}
              {products.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    দ্রুত নির্বাচন করুন (ইনভেন্টরি স্টক):
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {products.map(prod => (
                      <button
                        key={prod.id}
                        type="button"
                        onClick={() => handleSelectProduct(prod.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 ${
                          selectedProductId === prod.id
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        <span>{prod.name}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                            selectedProductId === prod.id
                              ? 'bg-emerald-700 text-white'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          মজুদ: {prod.stock}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    পণ্যের নাম *
                  </label>
                  <input
                    type="text"
                    value={formData.product_name}
                    onChange={e => setFormData({ ...formData, product_name: e.target.value })}
                    placeholder="যেমন: কাশ্মীরি পাঞ্জাবি"
                    className={`w-full p-2.5 bg-slate-50 border rounded-xl text-sm focus:bg-white ${
                      errors.product_name ? 'border-rose-400 bg-rose-50' : 'border-slate-300'
                    }`}
                  />
                  {errors.product_name && <p className="text-[11px] text-rose-600 mt-1 font-semibold">{errors.product_name}</p>}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    ভ্যারিয়েন্ট / সাইজ / কালার (ঐচ্ছিক)
                  </label>
                  <input
                    type="text"
                    value={formData.variant}
                    onChange={e => setFormData({ ...formData, variant: e.target.value })}
                    placeholder="যেমন: ব্লু, XL সাইজ"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Quantity */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">পরিমাণ (Qty) *</label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, quantity: Math.max(1, prev.quantity - 1) }))}
                      className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="number"
                      min={1}
                      value={formData.quantity}
                      onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl text-sm text-center font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, quantity: prev.quantity + 1 }))}
                      className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Selling Price */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    একক বিক্রয় মূল্য (টাকা) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.selling_price || ''}
                    onChange={e => setFormData({ ...formData, selling_price: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                    className={`w-full p-2.5 bg-slate-50 border rounded-xl text-sm font-bold text-emerald-800 ${
                      errors.selling_price ? 'border-rose-400 bg-rose-50' : 'border-slate-300'
                    }`}
                  />
                  {errors.selling_price && <p className="text-[11px] text-rose-600 mt-1 font-semibold">{errors.selling_price}</p>}
                </div>

                {/* Product Cost Price */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    একক ক্রয়/তৈরি খরচ (টাকা)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.product_cost || ''}
                    onChange={e => setFormData({ ...formData, product_cost: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* 3. Delivery, Expenses & Advance Payment Section */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">৩. ডেলিভারি ও পরিচালন খরচ</h3>
                    <p className="text-[11px] text-slate-500">লাভের সঠিক চিত্র পাওয়ার জন্য খরচের হিসাব দিন</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    কাস্টমার ডেলিভারি চার্জ (টাকা)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.delivery_charge}
                    onChange={e => setFormData({ ...formData, delivery_charge: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    কুরিয়ার ফি (আপনি দিবেন)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.courier_cost}
                    onChange={e => setFormData({ ...formData, courier_cost: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    প্যাকেজিং খরচ (বক্স/পলি)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.packaging_cost}
                    onChange={e => setFormData({ ...formData, packaging_cost: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    ফেসবুক অ্যাড খরচ (আনুমানিক)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.ad_cost}
                    onChange={e => setFormData({ ...formData, ad_cost: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                  />
                </div>
              </div>

              {/* Advance & Payment Method */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    অগ্রিম আদায় (বিকাশ/নগদ) ৳
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.advance_payment || ''}
                    onChange={e => setFormData({ ...formData, advance_payment: parseFloat(e.target.value) || 0 })}
                    placeholder="যেমন: ২০০ (ডেলিভারি চার্জ)"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-blue-700"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">পেমেন্ট মেথড</label>
                  <select
                    value={formData.payment_method}
                    onChange={e => setFormData({ ...formData, payment_method: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm cursor-pointer"
                  >
                    <option value="Cash on Delivery">ক্যাশ অন ডেলিভারি (COD)</option>
                    <option value="bKash">বিকাশ (bKash)</option>
                    <option value="Nagad">নগদ (Nagad)</option>
                    <option value="Bank Transfer">ব্যাংক ট্রান্সফার</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">প্রাথমিক স্ট্যাটাস</label>
                  <select
                    value={orderStatus}
                    onChange={e => setOrderStatus(e.target.value as OrderStatus)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm cursor-pointer font-bold text-emerald-800"
                  >
                    <option value="New">নতুন (New)</option>
                    <option value="Confirmed">কনফার্মড (Confirmed)</option>
                    <option value="Packed">প্যাক করা (Packed)</option>
                    <option value="Shipped">কুরিয়ারে রওয়ানা (Shipped)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  বিশেষ নোট বা ডেলিভারি নির্দেশনা (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="যেমন: ডেলিভারির পূর্বে ফোন দিতে হবে..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                />
              </div>
            </div>
          </form>
        </div>

        {/* Right Sticky Column: Real-time Profit Engine & Financial Simulation */}
        <div className="lg:col-span-5 xl:col-span-4 sticky top-20 space-y-4">
          <div className="bg-[#1C2434] text-white rounded-3xl p-6 shadow-xl border border-[#2E3A4B] space-y-5">
            <div className="flex items-center justify-between border-b border-[#2E3A4B] pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <h3 className="font-extrabold text-base tracking-tight text-white">
                  লাইভ প্রফিট ইঞ্জিন
                </h3>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/30">
                রিয়েলটাইম
              </span>
            </div>

            {/* Net Profit Big Banner */}
            <div className={`p-4 rounded-2xl border transition-all ${
              profitCalc.netProfit > 0
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
            }`}>
              <div className="text-xs text-slate-300 mb-1">
                এই অর্ডারে আপনার সম্ভাব্য নিট লাভ:
              </div>
              <div className="text-3xl font-black text-white">
                {formatBDT(profitCalc.netProfit)}
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/10 text-xs">
                <span>মুনাফা মার্জিন:</span>
                <span className="font-extrabold text-sm text-emerald-400">
                  {profitCalc.profitMarginPct}%
                </span>
              </div>
            </div>

            {/* Financial Ledger Breakdown */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>পণ্য বিক্রি ({formData.quantity} টি):</span>
                <span className="font-mono text-white font-semibold">
                  {formatBDT(formData.selling_price * formData.quantity)}
                </span>
              </div>

              <div className="flex justify-between text-slate-300">
                <span>ডেলিভারি আদায়:</span>
                <span className="font-mono text-white">
                  + {formatBDT(formData.delivery_charge)}
                </span>
              </div>

              <div className="flex justify-between text-slate-300 font-bold border-t border-[#2E3A4B] pt-2">
                <span>মোট কাস্টমার বিল:</span>
                <span className="font-mono text-emerald-400">
                  {formatBDT(totalBill)}
                </span>
              </div>

              {formData.advance_payment > 0 && (
                <div className="flex justify-between text-blue-300">
                  <span>অগ্রিম জমা:</span>
                  <span className="font-mono">- {formatBDT(formData.advance_payment)}</span>
                </div>
              )}

              <div className="flex justify-between text-amber-300 font-bold bg-[#141B26] p-2 rounded-xl">
                <span>ক্যাশ অন ডেলিভারি (COD বাকি):</span>
                <span className="font-mono">{formatBDT(codAmount)}</span>
              </div>
            </div>

            {/* Cost Breakdown */}
            <div className="border-t border-[#2E3A4B] pt-3 space-y-1.5 text-xs text-slate-400">
              <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                খরচের বিস্তারিত (COGS & OPEX):
              </div>
              <div className="flex justify-between">
                <span>পণ্যের ক্রয় খরচ:</span>
                <span className="font-mono text-rose-400">- {formatBDT(formData.product_cost * formData.quantity)}</span>
              </div>
              <div className="flex justify-between">
                <span>কুরিয়ার খরচ:</span>
                <span className="font-mono text-rose-400">- {formatBDT(formData.courier_cost)}</span>
              </div>
              <div className="flex justify-between">
                <span>প্যাকেজিং খরচ:</span>
                <span className="font-mono text-rose-400">- {formatBDT(formData.packaging_cost)}</span>
              </div>
              <div className="flex justify-between">
                <span>মেটা বিজ্ঞাপন খরচ:</span>
                <span className="font-mono text-rose-400">- {formatBDT(formData.ad_cost)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-200 border-t border-[#2E3A4B] pt-1">
                <span>মোট ব্যয়:</span>
                <span className="font-mono text-rose-400">{formatBDT(profitCalc.totalExpenses)}</span>
              </div>
            </div>

            {/* Return Loss Risk Projection */}
            <div className="p-3 bg-rose-950/30 rounded-2xl border border-rose-800/40 text-[11px] text-rose-300 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-rose-200">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>রিটার্ন ঝুঁকি সিমুলেশন:</span>
              </div>
              <p>
                পার্সেল কাস্টমার রিসিভ না করলে সম্ভাব্য ক্ষতি হবে{' '}
                <strong className="text-white underline">
                  {formatBDT(returnLossCalc.totalReturnLoss)}
                </strong>
                । (কুরিয়ার যাতায়াত + প্যাকেজিং + অ্যাড খরচ)
              </p>
            </div>

            {/* Submission Buttons */}
            <div className="space-y-2 pt-2">
              <button
                type="submit"
                form="new-order-form"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-2xl shadow-lg shadow-emerald-900/40 transition active:scale-98 flex items-center justify-center gap-2 text-sm"
              >
                <Check className="w-4 h-4" />
                <span>অর্ডার সেভ করুন ও শেষ করুন</span>
              </button>

              <button
                type="button"
                onClick={e => handleSubmit(e, true)}
                className="w-full py-2.5 bg-[#2E3A4B] hover:bg-[#3B4A5E] text-slate-200 font-bold rounded-2xl transition active:scale-98 flex items-center justify-center gap-2 text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>সেভ করে আরেকটি নতুন অর্ডার নিন</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
