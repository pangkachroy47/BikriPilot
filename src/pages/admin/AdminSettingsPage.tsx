import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import {
  Settings,
  CreditCard,
  Phone,
  Mail,
  MessageSquare,
  Building,
  Check,
  Save,
  Globe,
} from 'lucide-react';

export const AdminSettingsPage: React.FC = () => {
  const { adminSettings, updateAdminSettings } = useApp();

  const [businessName, setBusinessName] = useState(adminSettings?.business_name || 'BikriPilot HQ');
  const [supportPhone, setSupportPhone] = useState(adminSettings?.support_phone || '01700000000');
  const [supportWhatsapp, setSupportWhatsapp] = useState(adminSettings?.support_whatsapp || '01700000000');
  const [supportEmail, setSupportEmail] = useState(adminSettings?.support_email || 'support@bikripilot.com');
  const [paymentNumber, setPaymentNumber] = useState(adminSettings?.payment_number || '01712345678');
  const [paymentMethod, setPaymentMethod] = useState(adminSettings?.payment_method || 'bKash / Nagad Personal');
  const [paymentInstructions, setPaymentInstructions] = useState(
    adminSettings?.payment_instructions ||
      'বিকাশ বা নগদ Personal নম্বরে Send Money করুন। তারপর নিচের ফর্মে TrxID ও নম্বর দিয়ে রিকোয়েস্ট সাবমিট করুন।'
  );
  const [defaultCurrency, setDefaultCurrency] = useState(adminSettings?.default_currency || 'BDT');
  const [termsUrl, setTermsUrl] = useState(adminSettings?.terms_url || '');
  const [privacyUrl, setPrivacyUrl] = useState(adminSettings?.privacy_url || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateAdminSettings({
      business_name: businessName,
      support_phone: supportPhone,
      support_whatsapp: supportWhatsapp,
      support_email: supportEmail,
      payment_number: paymentNumber,
      payment_method: paymentMethod,
      payment_instructions: paymentInstructions,
      default_currency: defaultCurrency,
      terms_url: termsUrl,
      privacy_url: privacyUrl,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6">
      <Breadcrumb pageName="সিস্টেম ও বিলিং সেটিংস" parentName="Admin Control" />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">গ্লোবাল বিলিং ও হেল্পডেস্ক সেটিংস</h1>
        <p className="text-sm text-slate-500">
          বিকাশ/নগদ পেমেন্ট নম্বর, নির্দেশনাবলী ও কাস্টমার সাপোর্ট চ্যানেল কনফিগার করুন
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Payment Configuration */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-600" />
            <span>১. পেমেন্ট রিসিভার ও নির্দেশনাবলী (Customer Billing View)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                পেমেন্ট নম্বর (যে নম্বরে টাকা পাঠানো হবে) *
              </label>
              <input
                type="text"
                required
                value={paymentNumber}
                onChange={e => setPaymentNumber(e.target.value)}
                placeholder="01712345678"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-sm font-bold text-rose-800"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                এই নম্বরটি সমস্ত গ্রাহকের সাবস্ক্রিপশন ও বিলিং পেজে প্রদর্শিত হবে।
              </p>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                পেমেন্ট মেথড লেবেল *
              </label>
              <input
                type="text"
                required
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value)}
                placeholder="bKash / Nagad Personal"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
              />
            </div>
          </div>

          <div className="text-xs">
            <label className="font-bold text-slate-700 block mb-1">
              বিস্তারিত পেমেন্ট নির্দেশনাবলী *
            </label>
            <textarea
              rows={4}
              required
              value={paymentInstructions}
              onChange={e => setPaymentInstructions(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl leading-relaxed"
            />
          </div>
        </div>

        {/* Business & Support Details */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <Building className="w-5 h-5 text-blue-600" />
            <span>২. প্ল্যাটফর্ম ও হেল্পলাইন তথ্য</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">ব্যবসা / প্ল্যাটফর্মের নাম</label>
              <input
                type="text"
                value={businessName}
                onChange={e => setBusinessName(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">সাপোর্ট ইমেইল</label>
              <input
                type="email"
                value={supportEmail}
                onChange={e => setSupportEmail(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">সাপোর্ট ফোন নম্বর</label>
              <input
                type="text"
                value={supportPhone}
                onChange={e => setSupportPhone(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">সাপোর্ট হোয়াটসঅ্যাপ (WhatsApp)</label>
              <input
                type="text"
                value={supportWhatsapp}
                onChange={e => setSupportWhatsapp(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono"
              />
            </div>
          </div>
        </div>

        {/* Legal & URLs */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <Globe className="w-5 h-5 text-purple-600" />
            <span>৩. লিগ্যাল ও পলিসি ইউআরএল</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">শর্তাবলী পেজ (Terms URL)</label>
              <input
                type="url"
                value={termsUrl}
                onChange={e => setTermsUrl(e.target.value)}
                placeholder="https://..."
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">গোপনীয়তা নীতি (Privacy URL)</label>
              <input
                type="url"
                value={privacyUrl}
                onChange={e => setPrivacyUrl(e.target.value)}
                placeholder="https://..."
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          {savedSuccess ? (
            <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
              <Check className="w-4 h-4" />
              <span>সেটিংস সফলভাবে সংরক্ষিত হয়েছে!</span>
            </span>
          ) : (
            <span className="text-xs text-slate-500">
              পরিবর্তন নিশ্চিত করতে সংরক্ষণ বাটনে ক্লিক করুন।
            </span>
          )}

          <button
            type="submit"
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>সেটিংস সংরক্ষণ করুন</span>
          </button>
        </div>
      </form>
    </div>
  );
};
