import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Lock,
  KeyRound,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  LogOut,
  QrCode,
  Copy,
  Check,
  HelpCircle,
  Clock,
} from 'lucide-react';

interface AdminMFAPageProps {
  onSuccess: () => void;
  onLogout: () => void;
}

export const AdminMFAPage: React.FC<AdminMFAPageProps> = ({ onSuccess, onLogout }) => {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const [lockedSeconds, setLockedSeconds] = useState<number>(0);

  // QR / Setup view states
  const [showSetup, setShowSetup] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);
  const [totpSecret, setTotpSecret] = useState<string>('');
  const [otpauthUri, setOtpauthUri] = useState<string>('');
  const [copiedSecret, setCopiedSecret] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-focus first input on load
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Countdown timer if locked out
  useEffect(() => {
    if (lockedSeconds <= 0) return;
    const timer = setInterval(() => {
      setLockedSeconds(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [lockedSeconds]);

  // Load TOTP Setup data if user opens setup section
  const handleOpenSetup = async () => {
    setShowSetup(!showSetup);
    if (!showSetup && !totpSecret) {
      setSetupLoading(true);
      try {
        const res = await fetch('/api/admin/mfa/setup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        const data = await res.json();
        if (data.success) {
          setTotpSecret(data.secret);
          setOtpauthUri(data.otpauth_uri);
        }
      } catch (err: any) {
        console.error('Failed to load MFA setup details:', err);
      } finally {
        setSetupLoading(false);
      }
    }
  };

  const handleDigitChange = (index: number, value: string) => {
    // If user pasted a 6-digit code
    if (value.length > 1) {
      const clean = value.replace(/\D/g, '').slice(0, 6);
      if (clean.length > 0) {
        const newDigits = [...digits];
        for (let i = 0; i < 6; i++) {
          newDigits[i] = clean[i] || '';
        }
        setDigits(newDigits);
        const nextIdx = Math.min(clean.length, 5);
        inputRefs.current[nextIdx]?.focus();
        if (clean.length === 6) {
          submitCode(clean);
        }
        return;
      }
    }

    // Single digit input
    const cleanDigit = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = cleanDigit;
    setDigits(newDigits);

    // Auto advance to next box
    if (cleanDigit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // If all 6 digits are filled, auto-submit
    if (cleanDigit && index === 5 && newDigits.every(d => d.length === 1)) {
      submitCode(newDigits.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!paste) return;

    const newDigits = [...digits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = paste[i] || '';
    }
    setDigits(newDigits);
    const nextIdx = Math.min(paste.length, 5);
    inputRefs.current[nextIdx]?.focus();

    if (paste.length === 6) {
      submitCode(paste);
    }
  };

  const submitCode = async (codeToSubmit?: string) => {
    const code = codeToSubmit || digits.join('');
    if (code.length !== 6) {
      setErrorMsg('অনুগ্রহ করে ৬ ডিজিটের সম্পূর্ণ কোড দিন।');
      return;
    }

    if (lockedSeconds > 0) {
      setErrorMsg(`অতিরিক্ত ভুল চেষ্টার কারণে লক রয়েছে। দয়া করে ${lockedSeconds} সেকেন্ড অপেক্ষা করুন।`);
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/admin/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.lockedSeconds) {
          setLockedSeconds(data.lockedSeconds);
          setErrorMsg(`অতিরিক্ত ভুল চেষ্টার কারণে লক করা হয়েছে। ${data.lockedSeconds} সেকেন্ড পর চেষ্টা করুন।`);
        } else {
          setErrorMsg(data.error || 'ভুল TOTP কোড। আবার চেষ্টা করুন।');
          if (typeof data.remainingAttempts === 'number') {
            setRemainingAttempts(data.remainingAttempts);
          }
        }
        // Clear digits
        setDigits(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        return;
      }

      // Success!
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err?.message || 'সার্ভার যোগাযোগে সমস্যা হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  const copySecret = () => {
    if (!totpSecret) return;
    navigator.clipboard.writeText(totpSecret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2500);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center items-center p-4 selection:bg-rose-500 selection:text-white">
      {/* Background radial glow */}
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
        <div className="w-[500px] h-[500px] bg-rose-600/10 rounded-full blur-3xl -top-24 -right-24" />
        <div className="w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-3xl -bottom-24 -left-24" />
      </div>

      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Card Header */}
        <div className="bg-[#1C2434] border border-[#2E3A4B] rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-rose-900/30 border border-rose-500/20">
              <ShieldCheck className="w-9 h-9" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-500/15 border border-rose-500/30 text-rose-300 rounded-full text-[11px] font-bold tracking-wider uppercase">
              <Lock className="w-3 h-3" />
              <span>AAL2 Security Verification</span>
            </div>

            <h1 className="text-2xl font-black text-white tracking-tight">
              অ্যাডমিন নিরাপত্তা যাচাই (MFA)
            </h1>

            <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
              সিস্টেম অ্যাডমিন প্যানেলে প্রবেশের জন্য আপনার অথেনটিকেটর অ্যাপ (Google Authenticator, Authy বা Apple Keychain) থেকে ৬ ডিজিটের কোডটি দিন।
            </p>
          </div>

          {/* Locked / Rate limit Banner */}
          {lockedSeconds > 0 && (
            <div className="p-3.5 bg-rose-500/15 border border-rose-500/30 rounded-2xl flex items-center gap-2.5 text-rose-300 text-xs font-semibold">
              <Clock className="w-4 h-4 text-rose-400 shrink-0 animate-spin" />
              <span>নিরাপত্তার স্বার্থে লক করা হয়েছে। বাকি সময়: <strong>{lockedSeconds}s</strong></span>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3.5 bg-rose-500/20 border border-rose-500/40 rounded-2xl flex items-start gap-2.5 text-rose-200 text-xs font-medium">
              <AlertTriangle className="w-4 h-4 mt-0.5 text-rose-400 shrink-0" />
              <div>
                <div>{errorMsg}</div>
                {remainingAttempts !== null && remainingAttempts > 0 && (
                  <div className="text-[11px] text-rose-300 mt-1">
                    বাকি প্রচেষ্টা: <strong>{remainingAttempts}</strong> বার
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 6 Digit Input Group */}
          <form
            onSubmit={e => {
              e.preventDefault();
              submitCode();
            }}
            className="space-y-6"
          >
            <div className="flex justify-between gap-2 sm:gap-2.5" onPaste={handlePaste}>
              {digits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={el => {
                    inputRefs.current[idx] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={digit}
                  disabled={loading || lockedSeconds > 0}
                  onChange={e => handleDigitChange(idx, e.target.value)}
                  onKeyDown={e => handleKeyDown(idx, e)}
                  className={`w-12 h-14 sm:w-13 sm:h-16 text-center text-2xl font-black rounded-2xl border transition outline-hidden ${
                    digit
                      ? 'bg-slate-800 text-emerald-400 border-emerald-500/60 shadow-lg shadow-emerald-950/40'
                      : 'bg-[#151D2A] text-white border-slate-700/80 focus:border-rose-500 focus:bg-slate-800 focus:ring-2 focus:ring-rose-500/30'
                  }`}
                />
              ))}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || digits.join('').length !== 6 || lockedSeconds > 0}
              className="w-full py-3.5 bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-sm rounded-2xl transition duration-150 flex items-center justify-center gap-2 shadow-lg shadow-rose-900/30 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-98"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>যাচাই করা হচ্ছে...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>ভেরিফাই ও প্রবেশ করুন</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Setup / Help Toggle */}
          <div className="pt-2 border-t border-slate-800 space-y-3">
            <button
              type="button"
              onClick={handleOpenSetup}
              className="w-full py-2 px-3 text-xs font-semibold text-slate-400 hover:text-slate-200 rounded-xl hover:bg-slate-800/60 transition flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-emerald-400" />
                <span>নতুন ডিভাইসে Authenticator সেটআপ করবেন?</span>
              </span>
              <span className="text-[11px] text-emerald-400 font-mono underline">
                {showSetup ? 'বন্ধ করুন' : 'QR কোড দেখুন'}
              </span>
            </button>

            {/* Expandable Setup Card */}
            {showSetup && (
              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3 text-xs text-slate-300 animate-in fade-in duration-150">
                {setupLoading ? (
                  <div className="py-6 text-center text-slate-400 flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                    <span>MFA ক্রেডেনশিয়াল লোড হচ্ছে...</span>
                  </div>
                ) : (
                  <>
                    <p className="text-[11px] text-slate-400">
                      আপনার পছন্দের Authenticator অ্যাপে নিচের সিক্রেট কোডটি ম্যানুয়ালি যুক্ত করুন:
                    </p>

                    <div className="flex items-center gap-2 bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                      <code className="font-mono text-emerald-300 text-xs select-all flex-1 tracking-wider overflow-x-auto">
                        {totpSecret || 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP'}
                      </code>
                      <button
                        type="button"
                        onClick={copySecret}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1 shrink-0"
                      >
                        {copiedSecret ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedSecret ? 'কপি হয়েছে' : 'কপি'}</span>
                      </button>
                    </div>

                    <div className="text-[10px] text-slate-400 space-y-1">
                      <div><strong>Account:</strong> admin@bikripilot.com</div>
                      <div><strong>Issuer:</strong> BikriPilot Admin</div>
                      <div><strong>Type:</strong> Time-based (TOTP, 30s)</div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Secure Logout Action */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={onLogout}
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-rose-400 font-semibold transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>নিরাপদ প্রস্থান (Secure Logout)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-6 text-center text-[11px] text-slate-500 space-y-1">
          <div>BikriPilot F-Commerce OS • Multi-Tenant Defense-in-Depth</div>
          <div className="font-mono text-[10px] text-slate-600">Strict Server Verification • RFC 6238 TOTP Assurance</div>
        </div>
      </div>
    </div>
  );
};
