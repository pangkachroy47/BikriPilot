import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { getPlanLimits, getDaysRemaining, isSubscriptionExpired } from '../../utils/subscriptionLimits';
import {
  Sparkles,
  Plus,
  Store,
  ChevronDown,
  RotateCcw,
  Menu,
  Search,
  Bell,
  MessageSquare,
  User,
  Settings,
  LogOut,
  CheckCircle2,
  Package,
  AlertTriangle,
  ShieldCheck,
  CreditCard,
} from 'lucide-react';

interface HeaderProps {
  onOpenAIModal: () => void;
  onNavigateNewOrder: () => void;
  onToggleSidebar: () => void;
  onNavigate: (page: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAIModal,
  onNavigateNewOrder,
  onToggleSidebar,
  onNavigate,
}) => {
  const { currentShop, shops, switchShop, isDemoMode, resetDemoData, orders, currentUser, signOut, switchRole } = useApp();

  const [shopDropdownOpen, setShopDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notifyDropdownOpen, setNotifyDropdownOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const planLimits = getPlanLimits(currentShop.subscription_plan);
  const daysLeft = getDaysRemaining(currentShop);
  const isExpired = isSubscriptionExpired(currentShop);

  // Close dropdowns on outside click
  const shopRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const notifyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (shopRef.current && !shopRef.current.contains(e.target as Node)) {
        setShopDropdownOpen(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
      if (notifyRef.current && !notifyRef.current.contains(e.target as Node)) {
        setNotifyDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const recentNotifications = [
    {
      id: 'n1',
      title: 'নতুন AI অর্ডার প্রস্তুত',
      desc: 'মেসেঞ্জার থেকে ১টি অর্ডার সফলভাবে ক্যাপচার হয়েছে।',
      time: '১০ মিনিট আগে',
      icon: Sparkles,
      color: 'text-emerald-600 bg-emerald-50',
    },
    {
      id: 'n2',
      title: 'পার্সেল সফলভাবে ডেলিভার্ড',
      desc: 'অর্ডার #BP-1002 গ্রাহক রিসিভ করেছেন (৳২,২৮০)',
      time: '১ ঘন্টা আগে',
      icon: CheckCircle2,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      id: 'n3',
      title: 'রিটার্ন সতর্কতা',
      desc: 'অর্ডার #BP-1003 কুরিয়ার থেকে রিটার্ন এসেছে।',
      time: '৩ ঘন্টা আগে',
      icon: AlertTriangle,
      color: 'text-rose-600 bg-rose-50',
    },
  ];

  return (
    <header className="sticky top-0 z-30 flex w-full bg-white border-b border-slate-200 shadow-xs">
      <div className="flex flex-grow items-center justify-between px-4 py-3 sm:px-6 md:px-8">
        {/* Left Section: Sidebar Toggle & Global Search */}
        <div className="flex items-center gap-3 sm:gap-4 flex-1">
          {/* Sidebar Toggle Button (TailAdmin style) */}
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition focus:outline-hidden"
            aria-label="Toggle Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* TailAdmin Search Input */}
          <div className="relative hidden sm:block max-w-xs md:max-w-sm w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="অর্ডার, কাস্টমার বা পণ্য খুঁজুন..."
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition"
            />
          </div>

          {/* Demo Workspace Pill */}
          {isDemoMode && (
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-full text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>ডেমো মোড</span>
              <button
                onClick={resetDemoData}
                title="ডেমো ডেটা রিসেট করুন"
                className="ml-1 text-amber-700 hover:text-amber-900 p-0.5 rounded-sm"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Right Section: Multi-shop Switcher, Quick Actions & User Cluster */}
        <div className="flex items-center gap-2 sm:gap-3.5">
          {/* Subscription Plan & Expiry Pill */}
          <button
            onClick={() => onNavigate('settings')}
            className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
              isExpired
                ? 'bg-rose-50 text-rose-700 border-rose-300'
                : daysLeft <= 3
                ? 'bg-amber-50 text-amber-800 border-amber-300 animate-pulse'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}
            title="সাবস্ক্রিপশন স্ট্যাটাস ও আপগ্রেড"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isExpired ? 'bg-rose-500' : daysLeft <= 3 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
            />
            <span>{planLimits.nameBn}</span>
            <span className="text-slate-300">|</span>
            <span className="text-[11px] font-mono">
              {isExpired ? 'মেয়াদ শেষ!' : `${daysLeft} দিন`}
            </span>
          </button>

          {/* Multi-Shop Switcher Dropdown */}
          <div className="relative" ref={shopRef}>
            <button
              onClick={() => setShopDropdownOpen(!shopDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition text-left"
            >
              <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                {currentShop.name.charAt(0)}
              </div>
              <div className="hidden md:block max-w-[130px] truncate">
                <div className="text-xs font-bold text-slate-900 leading-tight truncate">
                  {currentShop.name}
                </div>
                <div className="text-[10px] text-slate-500 truncate">
                  {currentShop.fb_page_name || 'Facebook Page'}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {shopDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-4 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  আপনার শপ তালিকা (Multi-Shop)
                </div>
                {shops.map(s => (
                  <button
                    key={s.id}
                    onClick={() => {
                      switchShop(s.id);
                      setShopDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-xs text-left transition ${
                      s.id === currentShop.id
                        ? 'bg-emerald-50 text-emerald-800 font-bold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Store className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="truncate">{s.name}</span>
                    </div>
                    {s.id === currentShop.id && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                        এক্টিভ
                      </span>
                    )}
                  </button>
                ))}

                <div className="border-t border-slate-100 mt-2 pt-1">
                  <button
                    onClick={() => {
                      setShopDropdownOpen(false);
                      onNavigate('settings');
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50 text-left"
                  >
                    <Plus className="w-4 h-4" />
                    <span>নতুন শপ তৈরি করুন</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Notification Bell Dropdown */}
          <div className="relative" ref={notifyRef}>
            <button
              onClick={() => setNotifyDropdownOpen(!notifyDropdownOpen)}
              className="relative p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
            </button>

            {notifyDropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 py-3 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">বিজ্ঞপ্তি (Notifications)</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-md font-bold">
                    ৩টি নতুন
                  </span>
                </div>
                <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                  {recentNotifications.map(n => {
                    const Icon = n.icon;
                    return (
                      <div key={n.id} className="p-3 hover:bg-slate-50 transition flex items-start gap-2.5">
                        <div className={`p-2 rounded-xl shrink-0 ${n.color}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-xs text-slate-900">{n.title}</div>
                          <div className="text-[11px] text-slate-500 truncate">{n.desc}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{n.time}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="px-4 pt-2 border-t border-slate-100 text-center">
                  <button
                    onClick={() => {
                      setNotifyDropdownOpen(false);
                      onNavigate('orders');
                    }}
                    className="text-xs font-bold text-emerald-700 hover:underline"
                  >
                    সকল অর্ডার কার্যকলাপ দেখুন
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Admin Panel Quick Action (If Admin) */}
          {currentUser.role === 'admin' && (
            <button
              onClick={() => onNavigate('admin')}
              className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs text-xs sm:text-sm font-bold transition active:scale-98"
              title="অ্যাডমিন কন্ট্রোল সেন্টারে যান"
            >
              <ShieldCheck className="w-4 h-4 text-rose-200" />
              <span className="hidden sm:inline">অ্যাডমিন প্যানেল</span>
              <span className="sm:hidden">অ্যাডমিন</span>
            </button>
          )}

          {/* Quick AI Capture Action Button */}
          <button
            onClick={onOpenAIModal}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl shadow-xs text-xs sm:text-sm font-bold transition active:scale-98"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span className="hidden sm:inline">AI ক্যাপচার</span>
            <span className="sm:hidden">AI</span>
          </button>

          {/* User Profile Dropdown (TailAdmin signature) */}
          <div className="relative" ref={userRef}>
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition"
            >
              <div className="w-8 h-8 rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                {currentUser.full_name.charAt(0)}
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-xs font-bold text-slate-900 leading-tight">
                  {currentUser.full_name}
                </div>
                <div className="text-[10px] text-slate-500 font-medium">
                  {currentUser.role === 'admin' ? 'সিস্টেম অ্যাডমিন' : 'F-Commerce Pro'}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block" />
            </button>

            {userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-xs text-slate-900">{currentUser.full_name}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{currentUser.email}</div>
                  </div>
                  <span className="text-[10px] font-bold uppercase bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                    {currentUser.role}
                  </span>
                </div>

                <div className="py-1">
                  {currentUser.role === 'admin' && (
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onNavigate('admin');
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 transition"
                    >
                      <ShieldCheck className="w-4 h-4 text-rose-600" />
                      <span>অ্যাডমিন কন্ট্রোল সেন্টার</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onNavigate('settings');
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    <span>শপ প্রোফাইল ও সেটিংস</span>
                  </button>

                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onNavigate('billing');
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                  >
                    <CreditCard className="w-4 h-4 text-slate-400" />
                    <span>পেমেন্ট ও সাবস্ক্রিপশন</span>
                  </button>
                </div>

                {/* Role Switcher Option (Only for Master Admin or in Demo Workspace) */}
                {(isDemoMode || currentUser.email === 'admin@bikripilot.com') && (
                  <div className="px-4 py-2 border-t border-slate-100 flex items-center justify-between text-[11px] bg-slate-50/70">
                    <span className="text-slate-500 font-medium">প্রিভিউ মোড:</span>
                    <button
                      onClick={() => {
                        switchRole(currentUser.role === 'admin' ? 'seller' : 'admin');
                        setUserDropdownOpen(false);
                      }}
                      className="font-bold text-emerald-700 hover:underline"
                    >
                      {currentUser.role === 'admin' ? 'সেলার ভিউ' : 'অ্যাডমিন ভিউ'}
                    </button>
                  </div>
                )}

                <div className="border-t border-slate-100 pt-1">
                  <button
                    onClick={async () => {
                      setUserDropdownOpen(false);
                      await signOut();
                      onNavigate('landing');
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>লগআউট / প্রস্থান</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
