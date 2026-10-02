import React, { useState } from 'react';
import { SUBSCRIPTION_PLANS } from '../../config/plans';
import { formatBDT } from '../../utils/calculations';
import {
  Sparkles,
  Zap,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ShoppingBag,
  FileText,
  AlertTriangle,
  Users,
  ChevronDown,
  MessageSquare,
  Copy,
  Check,
  Star,
  Lock,
} from 'lucide-react';

interface LandingPageProps {
  onGoToApp: () => void;
  onGoToPricing: () => void;
  onGoToFAQ: () => void;
  onGoToLogin: () => void;
  onGoToRegister: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onGoToApp,
  onGoToPricing,
  onGoToFAQ,
  onGoToLogin,
  onGoToRegister,
}) => {
  const [demoChat, setDemoChat] = useState(`আসসালামু আলাইকুম ভাইয়া। রয়েল ব্লু কালার কাশ্মীরি পাঞ্জাবি XL সাইজ ১ পিস নিতে চাই। 
নাম: তানভীর আহমেদ
ফোন: 01712987654
ঠিকানা: বাড়ি ১২, রোড ৪, ব্লক সি, মিরপুর ১০, ঢাকা।`);

  const [simulatedExtracted, setSimulatedExtracted] = useState<any>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const handleSimulate = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setSimulatedExtracted({
        customer_name: 'তানভীর আহমেদ',
        phone: '01712987654',
        district: 'ঢাকা',
        thana: 'মিরপুর ১০',
        address: 'বাড়ি ১২, রোড ৪, ব্লক সি, মিরপুর ১০, ঢাকা',
        product_name: 'কাশ্মীরি পাঞ্জাবি',
        variant: 'রয়েল ব্লু / XL',
        quantity: 1,
        selling_price: 1450,
        estimated_profit: 595,
      });
      setIsSimulating(false);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-emerald-100">
      {/* Public Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={onGoToApp}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <span className="font-extrabold text-xl text-slate-900 tracking-tight">
              Bikri<span className="text-emerald-600">Pilot</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
            <button onClick={onGoToApp} className="hover:text-emerald-600 transition">
              লাইভ ডেমো
            </button>
            <button onClick={onGoToPricing} className="hover:text-emerald-600 transition">
              মূল্য তালিকা
            </button>
            <button onClick={onGoToFAQ} className="hover:text-emerald-600 transition">
              সাধারণ জিজ্ঞাসা (FAQ)
            </button>
          </nav>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onGoToLogin}
              className="px-3.5 py-1.5 text-xs sm:text-sm font-bold text-slate-700 hover:text-slate-900 transition"
            >
              লগইন
            </button>
            <button
              onClick={onGoToRegister}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 transition active:scale-98"
            >
              ফ্রি ট্রায়াল শুরু করুন
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 px-4 sm:px-6 overflow-hidden bg-gradient-to-b from-white via-slate-50 to-emerald-50/30">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-bold text-emerald-800 animate-in fade-in duration-300">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Bangla-First AI Order & Profit Assistant for F-Commerce</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight">
            "Facebook-এর অর্ডার, হিসাব আর লাভ—
            <span className="text-emerald-600 underline decoration-emerald-300 underline-offset-8">
              এক জায়গায়
            </span>
            ।"
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-600 leading-relaxed font-medium">
            Facebook থেকে আসা অর্ডার ৩০ সেকেন্ডে ম্যানেজ করুন। কপি করা মেসেঞ্জার চ্যাট পেস্ট করলেই AI দিয়ে অর্ডার তৈরি করুন, আসল নিট লাভ দেখুন এবং কুরিয়ার রিটার্ন লসের নিখুঁত হিসাব রাখুন।
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={onGoToApp}
              className="w-full sm:w-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-base rounded-2xl shadow-xl shadow-emerald-600/25 transition active:scale-98 flex items-center justify-center gap-2"
            >
              <span>সরাসরি ডেমো ড্যাশবোর্ডে প্রবেশ করুন</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            <button
              onClick={onGoToRegister}
              className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-800 font-bold text-base rounded-2xl border border-slate-300 shadow-xs transition"
            >
              ১৪ দিনের ফ্রি ট্রায়াল নিন
            </button>
          </div>

          <div className="flex items-center justify-center gap-6 pt-4 text-xs font-semibold text-slate-500">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              কোনো ক্রেডিট কার্ডের প্রয়োজন নেই
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              খাতা-কলমের হিসাবের দিন শেষ
            </span>
          </div>
        </div>

        {/* Interactive Live AI Parser Demo on Hero */}
        <div className="max-w-4xl mx-auto mt-12 bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 relative">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500" />
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-xs font-bold text-slate-500 ml-2">
                লাইভ টেস্ট: Messenger Chat → AI Order
              </span>
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              Gemini Powered
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
            {/* Left: Input */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 block">
                মেসেঞ্জার থেকে কপি করা চ্যাট:
              </label>
              <textarea
                value={demoChat}
                onChange={e => setDemoChat(e.target.value)}
                rows={5}
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={handleSimulate}
                disabled={isSimulating}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>{isSimulating ? 'AI বিশ্লেষণ করছে...' : 'AI দিয়ে অর্ডার বের করুন'}</span>
              </button>
            </div>

            {/* Right: Extracted Result Card */}
            <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                    AI প্রস্তুতকৃত ড্রাফট অর্ডার
                  </span>
                  <span className="text-[10px] bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-md font-bold">
                    পর্যালোচনা স্ক্রিন
                  </span>
                </div>

                {simulatedExtracted ? (
                  <div className="space-y-1.5 text-xs text-slate-700 animate-in fade-in duration-200">
                    <div>
                      <strong>নাম:</strong> {simulatedExtracted.customer_name}
                    </div>
                    <div>
                      <strong>মোবাইল:</strong> {simulatedExtracted.phone}
                    </div>
                    <div>
                      <strong>ঠিকানা:</strong> {simulatedExtracted.address}
                    </div>
                    <div>
                      <strong>পণ্য:</strong> {simulatedExtracted.product_name} ({simulatedExtracted.variant})
                    </div>
                    <div className="pt-2 border-t border-emerald-200 flex justify-between font-bold text-emerald-800 text-sm">
                      <span>আনুমানিক নিট লাভ:</span>
                      <span>{formatBDT(simulatedExtracted.estimated_profit)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="h-32 flex flex-col items-center justify-center text-center text-slate-400 text-xs">
                    <MessageSquare className="w-8 h-8 text-emerald-300 mb-1" />
                    <span>বামের বাটনে ক্লিক করে AI এক্সট্রাকশন দেখুন</span>
                  </div>
                )}
              </div>

              {simulatedExtracted && (
                <button
                  onClick={onGoToApp}
                  className="w-full mt-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Check className="w-4 h-4" />
                  <span>ড্যাশবোর্ডে গিয়ে পুরো অর্ডার সেভ করুন</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="py-16 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            F-Commerce ব্যবসার প্রতিটি প্রয়োজনের সমাধান
          </h2>
          <p className="text-sm text-slate-500 font-medium">
            অপ্রয়োজনীয় জটিল ফিচার ছাড়া শুধুমাত্র বাংলাদেশি ফেসবুক সেলারদের উপযোগী টুলস
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs hover:border-emerald-300 transition space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">১. AI মেসেঞ্জার অর্ডার ক্যাপচার</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              কাস্টমারের বড় চ্যাট বা ঠিকানা কপি করে পেস্ট করুন। Gemini AI স্বয়ংক্রিয়ভাবে নাম, ফোন, জেলা ও পণ্য বের করে দেবে। কখনো ভুয়া তথ্য বানায় না।
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs hover:border-emerald-300 transition space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">২. প্রকৃত নিট প্রফিট ক্যালকুলেশন</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              শুধু বিক্রয় মূল্য নয়—পণ্য ক্রয় খরচ, কুরিয়ার, প্যাকেজিং এবং ফেসবুক অ্যাড কস্ট বাদ দিয়ে প্রতি অর্ডারে আসল কত টাকা লাভ হচ্ছে তা দেখুন।
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs hover:border-rose-300 transition space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">৩. রিটার্ন লস ক্ষতি ট্র্যাকিং</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              পার্সেল রিটার্ন আসলে কত টাকা কুরিয়ার লস ও নষ্ট প্যাকেজিং খরচ হলো তা ট্র্যাক করুন। রিটার্ন রেট বেশি এমন গ্রাহকদের আগেভাগেই সতর্ক সংকেত পাবেন।
            </p>
          </div>

          {/* Card 4 */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs hover:border-emerald-300 transition space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">৪. ১ ক্লিকে বাংলা PDF ক্যাশ মেমো</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              আপনার শপের নাম, লোগো ও অর্ডারের পণ্যের বিবরণ সহ আকর্ষণীয় বাংলা ইনভয়েস তৈরি করুন। কাস্টমারকে ইনবক্সে পাঠান বা প্রিন্ট করে পার্সেলের সাথে দিন।
            </p>
          </div>

          {/* Card 5 */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs hover:border-emerald-300 transition space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">৫. কাস্টমার ফোন নম্বর হিস্ট্রি</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              ফোন নম্বর দিয়ে কাস্টমারের পূর্বের অর্ডার ইতিহাস, ডেলিভারি ও রিটার্ন রেকর্ড নিমেষেই দেখুন। বিশ্বস্ত গ্রাহকদের চিহ্নিত করুন।
            </p>
          </div>

          {/* Card 6 */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs hover:border-emerald-300 transition space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">৬. মাল্টি-শপ ও সম্পূর্ণ নিরাপদ ডেটা</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              একই একাউন্টে একাধিক ফেসবুক শপ পরিচালনা করুন। Row Level Security দ্বারা প্রতিটি শপের ডেটা ১০০% সুরক্ষিত ও আলাদা থাকে।
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Preview Section */}
      <section className="py-16 px-4 sm:px-6 bg-slate-100/70 border-y border-slate-200">
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              সুলভ ও স্বচ্ছ সাবস্ক্রিপশন প্ল্যান
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              বিকাশ বা নগদে সহজে পেমেন্ট করুন। কোনো গোপন চার্জ নেই।
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {SUBSCRIPTION_PLANS.map(p => (
              <div
                key={p.id}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4 hover:border-emerald-500 transition"
              >
                <div>
                  {p.badge && (
                    <span className="inline-block text-[10px] font-bold bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full mb-2">
                      {p.badge}
                    </span>
                  )}
                  <h3 className="font-bold text-base text-slate-900">{p.nameBn}</h3>
                  <div className="text-2xl font-black text-slate-900 mt-2">
                    {p.priceBDT === 0 ? 'ফ্রি' : `৳${p.priceBDT}`}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium mb-3">
                    {p.durationLabel}
                  </div>
                  <ul className="text-xs text-slate-600 space-y-2 pt-3 border-t border-slate-100">
                    {p.features.map((f, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <button
                  onClick={onGoToRegister}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition"
                >
                  শুরু করুন
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Teaser */}
      <section className="py-16 px-4 sm:px-6 max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            সাধারণ জিজ্ঞাসা (FAQ)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            ফেসবুক সেলারদের সবচেয়ে বেশি জিজ্ঞাসিত প্রশ্নাবলীর উত্তর
          </p>
        </div>

        <div className="space-y-3">
          <div className="p-4 bg-white rounded-2xl border border-slate-200">
            <h4 className="font-bold text-sm text-slate-900 mb-1">
              AI কিভাবে মেসেঞ্জার চ্যাট থেকে সঠিক অর্ডার বের করে?
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Google Gemini AI প্রযুক্তির সাহায্যে কাস্টমারের পাঠানো মেসেজ বিশ্লেষণ করে নাম, ফোন নম্বর, জেলা, এলাকা এবং পণ্যের পরিমাণ স্বয়ংক্রিয়ভাবে আলাদা করে। কোনো তথ্য মিসিং থাকলে আপনাকে রিভিউ স্ক্রিনে এডিট করার পূর্ণ স্বাধীনতা দেওয়া হয়।
            </p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200">
            <h4 className="font-bold text-sm text-slate-900 mb-1">
              আমি কি একাধিক ফেসবুক পেজ একসাথে ম্যানেজ করতে পারব?
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              হ্যাঁ! BikriPilot-এ আপনি যত খুশি আলাদা শপ তৈরি করতে পারবেন। প্রতিটা শপের অর্ডার, প্রোডাক্ট এবং হিসাব সম্পূর্ণ আলাদা ও সুরক্ষিত থাকে।
            </p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200">
            <h4 className="font-bold text-sm text-slate-900 mb-1">
              সাবস্ক্রিপশন ফি কীভাবে দেব?
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              বাংলাদেশি বিকাশ, নগদ বা রকেট অ্যাকাউন্টে নির্ধারিত ফি পাঠিয়ে TrxID সাবমিট করলেই খুব দ্রুত একাউন্ট ভেরিফাই হয়ে যায়।
            </p>
          </div>
        </div>

        <div className="text-center pt-2">
          <button
            onClick={onGoToFAQ}
            className="text-xs font-bold text-emerald-700 hover:underline inline-flex items-center gap-1"
          >
            <span>সব FAQ দেখুন</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center font-bold">
              <Zap className="w-4 h-4 fill-current text-white" />
            </div>
            <div>
              <span className="font-bold text-lg">BikriPilot</span>
              <p className="text-xs text-slate-400">Facebook ব্যবসার অর্ডার, হিসাব আর লাভ—এক জায়গায়।</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-400">
            <button onClick={onGoToPricing} className="hover:text-white transition">মূল্য তালিকা</button>
            <button onClick={onGoToFAQ} className="hover:text-white transition">FAQ</button>
            <button onClick={onGoToLogin} className="hover:text-white transition">লগইন</button>
            <button onClick={onGoToApp} className="hover:text-white transition">ডেমো ড্যাশবোর্ড</button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-slate-800 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} BikriPilot. সর্বস্বত্ব সংরক্ষিত। Proudly built for Bangladeshi F-Commerce entrepreneurs.
        </div>
      </footer>
    </div>
  );
};
