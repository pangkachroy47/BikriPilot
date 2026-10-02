import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { OnboardingData } from '../../types';
import {
  Store,
  ArrowRight,
  ArrowLeft,
  Check,
  Sparkles,
  Package,
  Truck,
  ShieldCheck,
  DollarSign,
  AlertCircle,
} from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onComplete,
}) => {
  const { completeOnboarding, currentUser } = useApp();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Shop Identity
  const [shopName, setShopName] = useState('');
  const [fbPageName, setFbPageName] = useState('');
  const [fbPageUrl, setFbPageUrl] = useState('');
  const [category, setCategory] = useState('fashion');
  const [phone, setPhone] = useState(currentUser.phone || '');

  // Step 2: Shipping & Operating Costs
  const [deliveryInside, setDeliveryInside] = useState<number>(80);
  const [deliveryOutside, setDeliveryOutside] = useState<number>(130);
  const [packagingCost, setPackagingCost] = useState<number>(25);
  const [adCost, setAdCost] = useState<number>(110);

  // Step 3: First Product (optional)
  const [productName, setProductName] = useState('');
  const [variant, setVariant] = useState('Standard');
  const [sellingPrice, setSellingPrice] = useState<number>(1450);
  const [costPrice, setCostPrice] = useState<number>(750);

  if (!isOpen) return null;

  const handleNextStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!shopName.trim()) {
      setError('আপনার শপ বা পেজের নাম আবশ্যক।');
      return;
    }
    setStep(2);
  };

  const handleNextStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(3);
  };

  const handleFinalSubmit = () => {
    const onboardingPayload: OnboardingData = {
      shop_name: shopName.trim(),
      fb_page_name: fbPageName.trim() || shopName.trim(),
      fb_page_url: fbPageUrl.trim(),
      category,
      phone: phone.trim(),
      default_delivery_inside: deliveryInside,
      default_delivery_outside: deliveryOutside,
      default_packaging_cost: packagingCost,
      default_ad_cost: adCost,
      first_product: productName.trim()
        ? {
            name: productName.trim(),
            variant: variant.trim(),
            selling_price: sellingPrice,
            cost_price: costPrice,
          }
        : undefined,
    };

    completeOnboarding(onboardingPayload);
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header with step progress indicator */}
        <div className="bg-[#1C2434] text-white p-6 border-b border-[#2E3A4B]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold">
                <Store className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-base tracking-tight">
                Bikri<span className="text-emerald-400">Pilot</span> শপ অনবোর্ডিং
              </span>
            </div>
            <span className="text-xs font-bold text-slate-400">
              ধাপ {step} / ৩
            </span>
          </div>

          <div className="w-full bg-[#2E3A4B] h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2 font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: Shop Identity */}
        {step === 1 && (
          <form onSubmit={handleNextStep1} className="p-6 space-y-4">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">
                ১. আপনার ব্যবসার প্রাথমিক তথ্য
              </h3>
              <p className="text-xs text-slate-500">
                আপনার Facebook পেজের তথ্য দিয়ে শপ প্রোফাইল শুরু করুন
              </p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                শপ / ব্র্যান্ডের নাম *
              </label>
              <input
                type="text"
                value={shopName}
                onChange={e => setShopName(e.target.value)}
                placeholder="যেমন: তহুরা ক্লথিং বা খাঁটি অর্গানিক ফুড"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Facebook পেজের নাম
              </label>
              <input
                type="text"
                value={fbPageName}
                onChange={e => setFbPageName(e.target.value)}
                placeholder="যেমন: Tahoora Clothing BD"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                ব্যবসার ধরণ / ক্যাটাগরি
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white cursor-pointer"
              >
                <option value="fashion">পোশাক ও বুটিক (Fashion & Apparel)</option>
                <option value="food">খাদ্য ও মধু (Organic Food & Honey)</option>
                <option value="gadgets">ইলেকট্রনিক্স ও গ্যাজেট (Gadgets)</option>
                <option value="cosmetics">কসমেটিক্স ও রূপচর্চা (Cosmetics)</option>
                <option value="general">সাধারণ পণ্য (General Merchandise)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                অফিসিয়াল হেল্পলাইন ফোন নম্বর
              </label>
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="017xxxxxxxx"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:bg-white"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition"
              >
                <span>পরবর্তী ধাপ</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: Delivery & Packaging Defaults */}
        {step === 2 && (
          <form onSubmit={handleNextStep2} className="p-6 space-y-4">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">
                ২. ডেলিভারি ও প্যাকেজিং চার্জ
              </h3>
              <p className="text-xs text-slate-500">
                অর্ডার তৈরির সময় এই রেটগুলো স্বয়ংক্রিয়ভাবে বসে যাবে
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  ঢাকার ভেতর ডেলিভারি (টাকা)
                </label>
                <input
                  type="number"
                  min={0}
                  value={deliveryInside}
                  onChange={e => setDeliveryInside(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  ঢাকার বাইরে ডেলিভারি (টাকা)
                </label>
                <input
                  type="number"
                  min={0}
                  value={deliveryOutside}
                  onChange={e => setDeliveryOutside(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  প্যাকেজিং খরচ (প্রতি পার্সেল)
                </label>
                <input
                  type="number"
                  min={0}
                  value={packagingCost}
                  onChange={e => setPackagingCost(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  গড় ফেসবুক বিজ্ঞাপন খরচ (টাকা)
                </label>
                <input
                  type="number"
                  min={0}
                  value={adCost}
                  onChange={e => setAdCost(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                />
              </div>
            </div>

            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-800">
              💡 <strong>টিপস:</strong> আপনি যেকোনো অর্ডারে প্রয়োজন অনুযায়ী এই খরচগুলো পরিবর্তন করতে পারবেন।
            </div>

            <div className="pt-2 flex justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                ← পেছনে
              </button>

              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition"
              >
                <span>পরবর্তী ধাপ</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: First Product (Optional) */}
        {step === 3 && (
          <div className="p-6 space-y-4">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">
                ৩. প্রথম পণ্য যোগ করুন (ঐচ্ছিক)
              </h3>
              <p className="text-xs text-slate-500">
                আপনার সেরা বিক্রিত পণ্যের তথ্য লিখে এখনই শুরু করতে পারেন
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  পণ্যের নাম
                </label>
                <input
                  type="text"
                  value={productName}
                  onChange={e => setProductName(e.target.value)}
                  placeholder="যেমন: কাশ্মীরি পাঞ্জাবি বা টাঙ্গাইল শাড়ি"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">ভ্যারিয়েন্ট</label>
                  <input
                    type="text"
                    value={variant}
                    onChange={e => setVariant(e.target.value)}
                    placeholder="যেমন: XL"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">বিক্রয় মূল্য (৳)</label>
                  <input
                    type="number"
                    value={sellingPrice}
                    onChange={e => setSellingPrice(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-emerald-800"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">ক্রয় খরচ (৳)</label>
                  <input
                    type="number"
                    value={costPrice}
                    onChange={e => setCostPrice(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
              <span>সম্ভাব্য একক লাভ:</span>
              <span className="font-bold text-emerald-700 text-sm">
                ৳{Math.max(0, sellingPrice - costPrice)}
              </span>
            </div>

            <div className="pt-2 flex justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                ← পেছনে
              </button>

              <button
                type="button"
                onClick={handleFinalSubmit}
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition"
              >
                <Check className="w-4 h-4" />
                <span>শপ অনবোর্ডিং সম্পন্ন করুন</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
