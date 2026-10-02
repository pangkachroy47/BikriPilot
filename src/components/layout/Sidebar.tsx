import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SUBSCRIPTION_PLANS } from '../../config/plans';
import {
  LayoutDashboard,
  ShoppingBag,
  PlusCircle,
  Sparkles,
  Users,
  Package,
  TrendingUp,
  FileText,
  Settings,
  CreditCard,
  Zap,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Store,
  X,
  Layers,
  BarChart3,
  HelpCircle,
  LogOut,
} from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

interface NavGroup {
  name: string;
  items: {
    id: string;
    label: string;
    icon: React.ElementType;
    badge?: string;
    badgeColor?: string;
    subItems?: { id: string; label: string }[];
  }[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  isOpen,
  onClose,
}) => {
  const { currentShop, currentUser, orders, aiParseLogs, paymentVerifications, switchRole, signOut } = useApp();
  const currentPlan = SUBSCRIPTION_PLANS.find(p => p.id === currentShop.subscription_plan) || SUBSCRIPTION_PLANS[0];

  // Collapsible dropdown states
  const [openSubMenus, setOpenSubMenus] = useState<Record<string, boolean>>({
    orders: true,
  });

  const toggleSubMenu = (menuId: string) => {
    setOpenSubMenus(prev => ({ ...prev, [menuId]: !prev[menuId] }));
  };

  const pendingCount = orders.filter(
    o => o.status === 'New' || o.status === 'Confirmed' || o.status === 'Packed'
  ).length;

  const adminPendingCount = paymentVerifications?.filter(p => p.status === 'pending').length || 0;

  const NAV_GROUPS: NavGroup[] = [
    {
      name: 'মূল মেনু (MENU)',
      items: [
        {
          id: 'dashboard',
          label: 'ড্যাশবোর্ড ও ওভারভিউ',
          icon: LayoutDashboard,
        },
        {
          id: 'orders',
          label: 'অর্ডার ব্যবস্থাপনা',
          icon: ShoppingBag,
          badge: pendingCount > 0 ? `${pendingCount} পেন্ডিং` : undefined,
          badgeColor: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
        },
        {
          id: 'ai-capture',
          label: 'AI মেসেঞ্জার ক্যাপচার',
          icon: Sparkles,
          badge: 'AI Flash',
          badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
        },
        {
          id: 'new-order',
          label: 'নতুন অর্ডার তৈরি',
          icon: PlusCircle,
        },
      ],
    },
    {
      name: 'ব্যবসা ও হিসাব (COMMERCE)',
      items: [
        {
          id: 'customers',
          label: 'কাস্টমার ডাটাবেজ',
          icon: Users,
        },
        {
          id: 'products',
          label: 'প্রোডাক্ট ও স্টক',
          icon: Package,
        },
        {
          id: 'profit',
          label: 'লাভ ও রিটার্ন লস অডিট',
          icon: TrendingUp,
        },
        {
          id: 'invoices',
          label: 'বাংলা PDF মেমো',
          icon: FileText,
        },
      ],
    },
    {
      name: 'শপ ও সাবস্ক্রিপশন (SETTINGS)',
      items: [
        {
          id: 'billing',
          label: 'পেমেন্ট ও বিলিং রিকোয়েস্ট',
          icon: CreditCard,
        },
        {
          id: 'settings',
          label: 'শপ প্রোফাইল ও সেটিংস',
          icon: Settings,
        },
      ],
    },
  ];

  // If user has admin role, add Admin Control Center nav group
  if (currentUser.role === 'admin') {
    NAV_GROUPS.push({
      name: 'অ্যাডমিন কন্ট্রোল (ADMIN CONTROL)',
      items: [
        {
          id: 'admin',
          label: 'অ্যাডমিন ড্যাশবোর্ড',
          icon: ShieldCheck,
        },
        {
          id: 'admin-users',
          label: 'ইউজার ও শপ তালিকা',
          icon: Users,
        },
        {
          id: 'admin-payments',
          label: 'পেমেন্ট অনুমোদন',
          icon: CreditCard,
          badge: adminPendingCount > 0 ? `${adminPendingCount} পেন্ডিং` : undefined,
          badgeColor: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
        },
        {
          id: 'admin-subscriptions',
          label: 'সাবস্ক্রিপশন অ্যাক্সেস',
          icon: Layers,
        },
        {
          id: 'admin-plans',
          label: 'প্ল্যান ও প্যাকেজ',
          icon: Zap,
        },
        {
          id: 'admin-coupons',
          label: 'কুপন কোড',
          icon: Sparkles,
        },
        {
          id: 'admin-announcements',
          label: 'ইন-অ্যাপ নোটিশ',
          icon: HelpCircle,
        },
        {
          id: 'admin-settings',
          label: 'পেমেন্ট সেটিংস',
          icon: Settings,
        },
        {
          id: 'admin-audit-logs',
          label: 'সিকিউরিটি অডিট লগ',
          icon: BarChart3,
        },
      ],
    });
  }

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* TailAdmin Dark Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#1C2434] text-slate-300 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 border-r border-[#2E3A4B] ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-6 py-5.5 border-b border-[#2E3A4B]">
          <button
            onClick={() => {
              onNavigate('dashboard');
              onClose();
            }}
            className="flex items-center gap-3 text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="font-extrabold text-xl text-white tracking-tight leading-tight">
                Bikri<span className="text-emerald-400">Pilot</span>
              </div>
              <div className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                F-Commerce OS
              </div>
            </div>
          </button>

          <button
            onClick={onClose}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#333A48] transition"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Body */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6 custom-scrollbar">
          {NAV_GROUPS.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1.5">
              <div className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {group.name}
              </div>

              <div className="space-y-1">
                {group.items.map(item => {
                  const Icon = item.icon;
                  const isActive = currentPage === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onNavigate(item.id);
                        onClose();
                      }}
                      className={`w-full group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                        isActive
                          ? 'bg-[#333A48] text-white shadow-sm border-l-4 border-emerald-500'
                          : 'text-slate-400 hover:bg-[#333A48]/60 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3 truncate">
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            isActive
                              ? 'text-emerald-400'
                              : 'text-slate-400 group-hover:text-slate-200'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>

                      {item.badge && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            item.badgeColor || 'bg-slate-700 text-slate-300'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Secure Admin Logout Button (Strict Security Action) */}
          {currentUser.role === 'admin' && (
            <div className="pt-2 px-1">
              <button
                type="button"
                onClick={async () => {
                  await signOut();
                  onNavigate('login');
                  onClose();
                }}
                className="w-full py-2.5 px-3 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-98"
                title="সিস্টেম অ্যাডমিন থেকে নিরাপদ প্রস্থান"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
                <span>নিরাপদ লগআউট (Secure Logout)</span>
              </button>
            </div>
          )}
        </div>

        {/* Bottom Subscription & Plan Card (TailAdmin style widget) */}
        <div className="p-4 border-t border-[#2E3A4B] bg-[#141B26]">
          <div className="p-3.5 bg-[#1C2434] rounded-2xl border border-[#2E3A4B] space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[11px] font-medium text-slate-400">শপ প্ল্যান</span>
              <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                {currentPlan.nameBn}
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-slate-300">
                <span>AI ক্যাপচার কোটা</span>
                <span className="font-bold text-white">
                  {aiParseLogs.length} / {currentPlan.monthlyAILimit}
                </span>
              </div>
              <div className="w-full bg-[#2E3A4B] h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, (aiParseLogs.length / currentPlan.monthlyAILimit) * 100)}%`,
                  }}
                />
              </div>
            </div>

            <button
              onClick={() => {
                onNavigate('settings');
                onClose();
              }}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-xs"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>প্ল্যান আপগ্রেড করুন</span>
            </button>
          </div>

          {/* Role Status & Switcher */}
          <div className="mt-3 pt-2.5 border-t border-[#2E3A4B]/80 flex items-center justify-between text-[11px] px-1">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${currentUser.role === 'admin' ? 'bg-rose-400' : 'bg-emerald-400'}`} />
              <span className="text-slate-400">রোল: <strong className="text-white uppercase font-bold">{currentUser.role}</strong></span>
            </div>
            <button
              onClick={() => {
                switchRole(currentUser.role === 'admin' ? 'seller' : 'admin');
              }}
              className="text-[10px] text-emerald-300 hover:text-emerald-200 font-bold bg-[#2E3A4B] hover:bg-[#384659] px-2 py-0.5 rounded-md transition"
            >
              {currentUser.role === 'admin' ? 'সেলার মোড' : 'অ্যাডমিন মোড'}
            </button>
          </div>

          <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400 px-1">
            <button
              onClick={() => {
                onNavigate('landing');
                onClose();
              }}
              className="hover:text-emerald-400 transition flex items-center gap-1"
            >
              <span>পাবলিক ল্যান্ডিং পেজ</span>
              <ExternalLink className="w-3 h-3" />
            </button>
            <span className="font-mono text-[10px] text-slate-500">v2.5 Pro</span>
          </div>
        </div>
      </aside>
    </>
  );
};
