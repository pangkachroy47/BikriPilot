import React, { useState } from 'react';
import { ArrowLeft, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

interface FAQPageProps {
  onGoBack: () => void;
  onGoToApp: () => void;
}

const FAQS = [
  {
    q: 'BikriPilot মূলত কাদের জন্য তৈরি করা হয়েছে?',
    a: 'যারা বাংলাদেশে Facebook পেজের মাধ্যমে জামাকাপড়, অর্গানিক ফুড, গ্যাজেট, কসমেটিক্স বা অন্যান্য পণ্য বিক্রি করেন এবং বর্তমানে খাতা-কলম, গুগল শিট বা ইনবক্সের স্ক্রিনশটে অর্ডার সংরক্ষণ করেন—তাদের সময় বাঁচাতে ও সঠিক নিট লাভ জানার জন্য BikriPilot তৈরি করা হয়েছে।',
  },
  {
    q: 'AI মেসেঞ্জার অর্ডার ক্যাপচার কীভাবে কাজ করে?',
    a: 'কাস্টমার মেসেঞ্জারে যে নাম, ফোন নম্বর বা পূর্ণ ঠিকানা পাঠায়, সেটি কপি করে BikriPilot-এ পেস্ট করলে Google Gemini AI মডেল স্বয়ংক্রিয়ভাবে ফিল্ডগুলো আলাদা করে একটি ড্রাফট অর্ডার প্রস্তুত করে। আপনি রিভিউ স্ক্রিনে তা দেখে ঠিকঠাক করে সেভ করতে পারেন।',
  },
  {
    q: 'নিট লাভ (Net Profit) কীভাবে গণনা করা হয়?',
    a: 'BikriPilot শুধুমাত্র বিক্রয় মূল্য দেখায় না। সূত্র: (পণ্য বিক্রি + ডেলিভারি চার্জ) - (পণ্যের ক্রয় খরচ + কুরিয়ার চার্জ + প্যাকেজিং খরচ + ফেসবুক বিজ্ঞাপন খরচ + রিটার্ন লস)। এর ফলে দিনশেষে আপনার পকেটে আসল কত টাকা লাভ অবশিষ্ট থাকল তা পরিষ্কার দেখা যায়।',
  },
  {
    q: 'পার্সেল রিটার্ন আসলে কীভাবে হিসাব রাখা হয়?',
    a: 'যেকোনো অর্ডারকে ‘Returned’ স্ট্যাটাস দিলে সিস্টেম স্বয়ংক্রিয়ভাবে আউটবাউন্ড কুরিয়ার চার্জ, রিটার্ন কুরিয়ার চার্জ এবং নষ্ট প্যাকেজিং ও অ্যাড কস্ট যোগ করে মোট ‘রিটার্ন লস’ বের করে। এতে আপনার ব্যবসায়ের আসল ঝুঁকি বোঝা সহজ হয়।',
  },
  {
    q: 'বাংলা ক্যাশ মেমো কি কাস্টমারকে পাঠানো যায়?',
    a: 'অবশ্যই! প্রতিটা অর্ডারের জন্য ১ ক্লিকে প্রিমিয়াম বাংলা PDF ইনভয়েস তৈরি হয় যা আপনি ডাউনলোড করে মেসেঞ্জারে পাঠাতে পারেন অথবা প্রিন্ট করে ডেলিভারি পার্সেলের সাথে দিতে পারেন।',
  },
  {
    q: 'পেমেন্ট ভেরিফিকেশন কীভাবে হয়?',
    a: 'আমাদের বিকাশ বা নগদ নম্বরে নির্ধারিত ফি পাঠিয়ে আপনার বিকাশ TrxID ও প্রেরকের নম্বর ফর্মে লিখলেই আমাদের অ্যাডমিন ম্যানুয়ালি মিলিয়ে আপনার একাউন্ট একটিভ করে দেয়।',
  },
  {
    q: 'আমার পেজের কাস্টমারদের তথ্য কি নিরাপদ থাকবে?',
    a: 'হ্যাঁ, ১০০% নিরাপদ। প্রতিটি শপের ডেটা Row Level Security (RLS) এর মাধ্যমে সম্পূর্ণ আলাদা ও সুরক্ষিত থাকে। এক শপের ডেটা অন্য কোনো শপ কখনো দেখতে পাবে না।',
  },
];

export const FAQPage: React.FC<FAQPageProps> = ({ onGoBack, onGoToApp }) => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top Bar */}
      <div className="bg-white border-b border-slate-200 py-4 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={onGoBack}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>হোমে ফিরুন</span>
          </button>
          <div className="font-extrabold text-lg text-slate-900">
            Bikri<span className="text-emerald-600">Pilot</span>
          </div>
          <button
            onClick={onGoToApp}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition"
          >
            ডেমো ড্যাশবোর্ড
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 space-y-8">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2 font-bold">
            <HelpCircle className="w-5 h-5" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            সাধারণ জিজ্ঞাসা ও উত্তর (FAQ)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            BikriPilot নিয়ে আপনার যাবতীয় প্রশ্নের সহজ সমাধান
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs transition"
              >
                <button
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between text-left gap-4 font-bold text-sm text-slate-900 hover:bg-slate-50 transition"
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-4 pb-5 sm:px-5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
