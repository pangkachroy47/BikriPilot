import React, { useEffect, useState } from 'react';
import { ShieldCheck, ShieldAlert, ArrowLeft, RefreshCw, Lock } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface AdminGuardProps {
  children: React.ReactNode;
  onNavigate: (page: string) => void;
}

export interface AdminAuthSessionState {
  isVerifying: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  aalLevel: 'none' | 'aal1' | 'aal2';
  mfaRequired: boolean;
  error: string | null;
}

export const AdminGuard: React.FC<AdminGuardProps> = ({ children, onNavigate }) => {
  const { currentUser } = useApp();
  const [authState, setAuthState] = useState<AdminAuthSessionState>({
    isVerifying: true,
    isAuthenticated: false,
    isAdmin: false,
    aalLevel: 'none',
    mfaRequired: false,
    error: null,
  });

  const verifyAdminAccess = async () => {
    setAuthState(prev => ({ ...prev, isVerifying: true, error: null }));

    try {
      // Server-side verification request
      const res = await fetch('/api/admin/auth/session', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
          'x-user-email': currentUser.email,
        },
      });

      const data = await res.json();

      if (res.status === 401 || !data.authenticated) {
        // Not authenticated -> redirect to login with return path
        setAuthState({
          isVerifying: false,
          isAuthenticated: false,
          isAdmin: false,
          aalLevel: 'none',
          mfaRequired: false,
          error: 'অথেনটিকেশন আবশ্যক। লগইন করুন।',
        });
        onNavigate('login');
        return;
      }

      if (res.status === 403 && data.code === 'MFA_REQUIRED') {
        // Admin, but MFA required -> redirect to /admin/mfa
        setAuthState({
          isVerifying: false,
          isAuthenticated: true,
          isAdmin: true,
          aalLevel: 'aal1',
          mfaRequired: true,
          error: null,
        });
        onNavigate('admin-mfa');
        return;
      }

      if (!data.is_admin || res.status === 403) {
        // Non-admin -> Show 403 Forbidden
        setAuthState({
          isVerifying: false,
          isAuthenticated: true,
          isAdmin: false,
          aalLevel: 'none',
          mfaRequired: false,
          error: 'অননুমোদিত অ্যাক্সেস। এই বিভাগটি শুধুমাত্র সিস্টেম অ্যাডমিনিস্ট্রেটরের জন্য সংরক্ষিত।',
        });
        return;
      }

      if (data.aal_level !== 'aal2') {
        // Must complete MFA
        setAuthState({
          isVerifying: false,
          isAuthenticated: true,
          isAdmin: true,
          aalLevel: data.aal_level || 'aal1',
          mfaRequired: true,
          error: null,
        });
        onNavigate('admin-mfa');
        return;
      }

      // Fully authorized & verified AAL2 admin!
      setAuthState({
        isVerifying: false,
        isAuthenticated: true,
        isAdmin: true,
        aalLevel: 'aal2',
        mfaRequired: false,
        error: null,
      });
    } catch (err: any) {
      setAuthState({
        isVerifying: false,
        isAuthenticated: false,
        isAdmin: false,
        aalLevel: 'none',
        mfaRequired: false,
        error: 'সার্ভারের সাথে সংযোগ স্থাপন করা যায়নি। আবার চেষ্টা করুন।',
      });
    }
  };

  useEffect(() => {
    verifyAdminAccess();
  }, [currentUser.id, currentUser.email]);

  // 1. Loading / Security Verification state: NEVER display admin data during verification
  if (authState.isVerifying) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-slate-900 text-emerald-400 flex items-center justify-center shadow-xl border border-slate-800 animate-pulse">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-base font-bold text-slate-800">
            সার্ভার-সাইড অ্যাডমিন নিরাপত্তা যাচাই হচ্ছে...
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            আপনার পরিচয়, অ্যাডমিন অনুমতি এবং MFA নিরাপত্তা স্তর যাচাই করা হচ্ছে। অনুগ্রহ করে অপেক্ষা করুন।
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-500" />
          <span>Verifying AAL2 Authorization...</span>
        </div>
      </div>
    );
  }

  // 2. 403 Forbidden state for Non-Admin
  if (!authState.isAdmin) {
    return (
      <div className="min-h-[65vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 shadow-xl text-center space-y-5 animate-in fade-in zoom-in-95 duration-150">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200 shadow-inner">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <span className="text-[11px] font-bold px-3 py-1 bg-rose-100 text-rose-800 rounded-full uppercase tracking-wider">
              403 Forbidden
            </span>
            <h2 className="text-xl font-black text-slate-900 mt-2.5">অননুমোদিত অ্যাক্সেস</h2>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              এই বিভাগটি শুধুমাত্র অনুমোদিত সিস্টেম অ্যাডমিনিস্ট্রেটরের জন্য সংরক্ষিত। সাধারণ ইউজার বা মার্চেন্টদের জন্য এখানে প্রবেশাধিকার নেই।
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-2.5">
            <button
              onClick={() => onNavigate('dashboard')}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>মার্চেন্ট ড্যাশবোর্ডে ফিরে যান</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. MFA Required (redirecting)
  if (authState.mfaRequired || authState.aalLevel !== 'aal2') {
    return (
      <div className="min-h-[65vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center border border-amber-500/30">
          <Lock className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-900">অ্যাডমিন MFA যাচাই আবশ্যক</h3>
          <p className="text-xs text-slate-500">MFA ভেরিফিকেশন পেজে নিয়ে যাওয়া হচ্ছে...</p>
        </div>
      </div>
    );
  }

  // 4. Fully Authorized & Verified
  return <>{children}</>;
};
