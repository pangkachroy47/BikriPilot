import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PlanRecord } from '../../types';
import { formatBDT } from '../../utils/calculations';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import {
  Layers,
  Plus,
  Edit2,
  Check,
  X,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Package,
  ShoppingBag,
} from 'lucide-react';

export const AdminPlansPage: React.FC = () => {
  const { adminPlans, updatePlan, createPlan } = useApp();

  const [editingPlan, setEditingPlan] = useState<PlanRecord | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [price, setPrice] = useState(99);
  const [durationDays, setDurationDays] = useState(30);
  const [maxOrders, setMaxOrders] = useState(300);
  const [maxProducts, setMaxProducts] = useState(150);
  const [maxAIParses, setMaxAIParses] = useState(100);
  const [featuresText, setFeaturesText] = useState('');
  const [badge, setBadge] = useState('');
  const [isActive, setIsActive] = useState(true);

  const handleOpenEdit = (plan: PlanRecord) => {
    setEditingPlan(plan);
    setName(plan.name);
    setSlug(plan.slug);
    setPrice(plan.price);
    setDurationDays(plan.duration_days);
    setMaxOrders(plan.max_orders);
    setMaxProducts(plan.max_products);
    setMaxAIParses(plan.max_ai_parses);
    setFeaturesText(plan.features_json?.join('\n') || '');
    setBadge(plan.badge || '');
    setIsActive(plan.is_active);
    setIsCreating(false);
  };

  const handleOpenCreate = () => {
    setEditingPlan(null);
    setName('New Custom Plan');
    setSlug(`plan-${Date.now().toString(36)}`);
    setPrice(199);
    setDurationDays(30);
    setMaxOrders(500);
    setMaxProducts(200);
    setMaxAIParses(250);
    setFeaturesText('আনলিমিটেড অর্ডার ট্র্যাকিং\n৫০টি AI ক্যাপচার\nবাংলা ইনভয়েস');
    setBadge('');
    setIsActive(true);
    setIsCreating(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const featuresList = featuresText
      .split('\n')
      .map(f => f.trim())
      .filter(Boolean);

    if (isCreating) {
      await createPlan({
        id: slug.toLowerCase().replace(/[^a-z0-9_-]/g, ''),
        name,
        slug,
        price,
        currency: 'BDT',
        duration_days: durationDays,
        max_orders: maxOrders,
        max_products: maxProducts,
        max_ai_parses: maxAIParses,
        features_json: featuresList,
        is_active: isActive,
        sort_order: (adminPlans.length || 0) + 1,
        badge: badge.trim() || undefined,
      });
      setIsCreating(false);
    } else if (editingPlan) {
      await updatePlan(editingPlan.id, {
        name,
        price,
        duration_days: durationDays,
        max_orders: maxOrders,
        max_products: maxProducts,
        max_ai_parses: maxAIParses,
        features_json: featuresList,
        badge: badge.trim() || undefined,
        is_active: isActive,
      });
      setEditingPlan(null);
    }
  };

  const handleToggleActive = async (plan: PlanRecord) => {
    await updatePlan(plan.id, { is_active: !plan.is_active });
  };

  return (
    <div className="space-y-6">
      <Breadcrumb pageName="সাবস্ক্রিপশন প্ল্যান কনফিগ" parentName="Admin Control" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">সাবস্ক্রিপশন প্যাকেজ পরিচালনা</h1>
          <p className="text-sm text-slate-500">
            প্ল্যানের মূল্য, মেয়াদ, AI লিমিট ও ফিচার ডাইনামিকালি কনফিগার করুন
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>নতুন প্যাকেজ তৈরি করুন</span>
        </button>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {adminPlans.map(plan => {
          return (
            <div
              key={plan.id}
              className={`bg-white rounded-3xl border p-5 shadow-xs flex flex-col justify-between transition ${
                plan.is_active ? 'border-slate-200' : 'border-slate-200 opacity-60 bg-slate-50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  {plan.badge ? (
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full">
                      {plan.badge}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400 font-mono">
                      {plan.slug}
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => handleToggleActive(plan)}
                    title={plan.is_active ? 'নিষ্ক্রিয় করুন' : 'সক্রিয় করুন'}
                    className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                      plan.is_active
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {plan.is_active ? 'সক্রিয়' : 'বন্ধ'}
                  </button>
                </div>

                <h3 className="font-bold text-base text-slate-900">{plan.name}</h3>
                <div className="text-2xl font-black text-slate-900 mt-1">
                  {plan.price === 0 ? 'ফ্রি' : `৳${plan.price}`}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  মেয়াদ: <strong>{plan.duration_days} দিন</strong>
                </div>

                {/* Quotas */}
                <div className="my-3 p-3 bg-slate-50 rounded-xl space-y-1 text-xs text-slate-700 border border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-500">AI পার্স:</span>
                    <strong className="font-mono">{plan.max_ai_parses} টি</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">প্রোডাক্ট লিমিট:</span>
                    <strong className="font-mono">{plan.max_products} টি</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">অর্ডার লিমিট:</span>
                    <strong className="font-mono">{plan.max_orders} টি</strong>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-1.5 text-xs text-slate-600">
                  {plan.features_json?.map((f, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(plan)}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>এডিট প্যাকেজ</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit / Create Modal */}
      {(isCreating || editingPlan) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4 text-left animate-in fade-in zoom-in-95 duration-150 my-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900">
                {isCreating ? 'নতুন প্যাকেজ যোগ করুন' : `${editingPlan?.name} প্যাকেজ এডিট করুন`}
              </h3>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setEditingPlan(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">প্যাকেজের নাম *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">মূল্য (BDT) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={price}
                    onChange={e => setPrice(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">মেয়াদ (দিন) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={durationDays}
                    onChange={e => setDurationDays(parseInt(e.target.value, 10) || 30)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">AI পার্স</label>
                  <input
                    type="number"
                    value={maxAIParses}
                    onChange={e => setMaxAIParses(parseInt(e.target.value, 10) || 0)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">পণ্য স্টক</label>
                  <input
                    type="number"
                    value={maxProducts}
                    onChange={e => setMaxProducts(parseInt(e.target.value, 10) || 0)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">অর্ডার সীমা</label>
                  <input
                    type="number"
                    value={maxOrders}
                    onChange={e => setMaxOrders(parseInt(e.target.value, 10) || 0)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">হাইলাইট ব্যাজ (ঐচ্ছিক)</label>
                <input
                  type="text"
                  value={badge}
                  onChange={e => setBadge(e.target.value)}
                  placeholder="যেমন: সেরা অফার 🔥"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">ফিচার তালিকা (প্রতি লাইনে ১টি)</label>
                <textarea
                  rows={4}
                  value={featuresText}
                  onChange={e => setFeaturesText(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingPlan(null);
                  }}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
