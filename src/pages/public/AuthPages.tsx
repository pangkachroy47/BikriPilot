import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Zap, Mail, Lock, Phone, ArrowRight, CheckCircle2, Sparkles, AlertCircle, ShieldCheck } from 'lucide-react';

interface AuthPagesProps {
  initialMode: 'login' | 'register';
  onSuccess: () => void;
  onGoBack: () => void;
}

export const AuthPages: React.FC<AuthPagesProps> = ({
  initialMode,
  onSuccess,
  onGoBack,
}) => {
  const { signIn, signUp, signInWithOtp, verifyOtp, isSupabaseConnected } = useApp();

  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [authMethod, setAuthMethod] = useState<'email' | 'phone_otp'>('email');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [shopName, setShopName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await signIn(email.trim(), password);
        if (!res.success) {
          setErrorMsg(res.error || 'ইমেইল বা পাসওয়ার্ড সঠিক নয়।');
          setLoading(false);
          return;
        }
      } else {
        if (!fullName.trim()) {
          setErrorMsg('আপনার নাম আবশ্যক।');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setErrorMsg('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।');
          setLoading(false);
          return;
        }
        const res = await signUp(email.trim(), password, fullName.trim(), shopName.trim());
        if (!res.success) {
          setErrorMsg(res.error || 'রেজিস্ট্রেশন সম্পন্ন করা যায়নি।');
          setLoading(false);
          return;
        }
      }

      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'একটি ত্রুটি ঘটেছে।');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    setErrorMsg(null);
    if (!phone || phone.length < 11) {
      setErrorMsg('সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017xxxxxxxx)।');
      return;
    }

    setLoading(true);
    const res = await signInWithOtp(phone.trim());
    setLoading(false);

    if (!res.success) {
      setErrorMsg(res.error || 'OTP পাঠাতে ব্যর্থ হয়েছে।');
    } else {
      setOtpSent(true);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!otp.trim()) {
      setErrorMsg('OTP কোড প্রদান করুন।');
      return;
    }

    setLoading(true);
    const res = await verifyOtp(phone.trim(), otp.trim());
    setLoading(false);

    if (!res.success) {
      setErrorMsg(res.error || 'ভুল কোড। আবার চেষ্টা করুন।');
    } else {
      onSuccess();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      {/* Brand logo */}
      <div className="mb-6 flex items-center gap-2.5 cursor-pointer" onClick={onGoBack}>
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
          <Zap className="w-6 h-6 fill-current" />
        </div>
        <span className="font-extrabold text-2xl text-slate-900 tracking-tight">
          Bikri<span className="text-emerald-600">Pilot</span>
        </span>
      </div>

      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-5">
        <div className="text-center space-y-1">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">
            {mode === 'login' ? 'অ্যাকাউন্টে লগইন করুন' : 'ফ্রি ট্রায়াল একাউন্ট খুলুন'}
          </h1>
          <p className="text-xs text-slate-500">
            Facebook-এর অর্ডার, হিসাব আর লাভ—এক জায়গায়।
          </p>
        </div>

        {/* Supabase status badge */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-slate-500 bg-slate-50 py-1 px-3 rounded-full border border-slate-200 w-fit mx-auto">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>{isSupabaseConnected ? 'Supabase Auth & RLS সক্রিয়' : 'BikriPilot Secure Auth'}</span>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2 font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Method Toggle: Email vs Phone OTP */}
        <div className="flex p-1 bg-slate-100 rounded-xl text-xs font-bold text-slate-600">
          <button
            type="button"
            onClick={() => {
              setAuthMethod('email');
              setErrorMsg(null);
            }}
            className={`flex-1 py-1.5 rounded-lg transition ${
              authMethod === 'email' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            ইমেইল ও পাসওয়ার্ড
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMethod('phone_otp');
              setErrorMsg(null);
            }}
            className={`flex-1 py-1.5 rounded-lg transition flex items-center justify-center gap-1 ${
              authMethod === 'phone_otp' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            <span>মোবাইল OTP</span>
            <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1 rounded-sm">নতুন</span>
          </button>
        </div>

        {authMethod === 'email' ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">আপনার পূর্ণ নাম *</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="যেমন: তানভীর আহমেদ"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">ফেসবুক শপ / পেজের নাম</label>
                  <input
                    type="text"
                    value={shopName}
                    onChange={e => setShopName(e.target.value)}
                    placeholder="যেমন: তহুরা ফ্যাশন হাউজ"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white"
                  />
                </div>
              </>
            )}

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">ইমেইল এড্রেস *</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seller@example.com"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">পাসওয়ার্ড *</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="কমপক্ষে ৬ অক্ষর"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-md transition active:scale-98"
            >
              {loading
                ? 'অপেক্ষা করুন...'
                : mode === 'login'
                ? 'লগইন করুন'
                : '১৪ দিনের ফ্রি ট্রায়াল শুরু করুন'}
            </button>
          </form>
        ) : (
          /* Phone OTP Flow */
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">মোবাইল নম্বর (১১ ডিজিট) *</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="017xxxxxxxx"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:bg-white"
                />
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={loading}
                  className="px-3 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold shrink-0 hover:bg-slate-800 transition"
                >
                  {otpSent ? 'পুনরায় OTP' : 'কোড পাঠান'}
                </button>
              </div>
            </div>

            {otpSent && (
              <form onSubmit={handleVerifyOtp} className="space-y-3 animate-in fade-in duration-200">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    ৪ ডিজিটের যাচাই কোড (ডেমো কোড: ১২৩৪)
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={e => setOtp(e.target.value)}
                    placeholder="1234"
                    maxLength={4}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-base font-mono text-center tracking-widest font-bold focus:bg-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-md transition"
                >
                  {loading ? 'যাচাই হচ্ছে...' : 'OTP দিয়ে প্রবেশ করুন'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Quick Demo Access */}
        <div className="pt-2 border-t border-slate-100 text-center">
          <button
            type="button"
            onClick={onSuccess}
            className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>সরাসরি ১-ক্লিকে ডেমো শপে প্রবেশ করুন</span>
          </button>
        </div>

        <div className="text-center text-xs text-slate-500">
          {mode === 'login' ? (
            <div>
              অ্যাকাউন্ট নেই?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMsg(null);
                }}
                className="text-emerald-700 font-bold hover:underline"
              >
                ফ্রি ট্রায়ালে যোগ দিন
              </button>
            </div>
          ) : (
            <div>
              ইতিমধ্যে অ্যাকাউন্ট আছে?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMsg(null);
                }}
                className="text-emerald-700 font-bold hover:underline"
              >
                লগইন করুন
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
