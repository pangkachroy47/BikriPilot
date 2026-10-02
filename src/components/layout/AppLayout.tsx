import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { AIOrderCaptureModal } from '../ai/AIOrderCaptureModal';
import { useApp } from '../../context/AppContext';
import { getDaysRemaining, isSubscriptionExpired } from '../../utils/subscriptionLimits';
import { AlertTriangle, Clock, Zap, X, Megaphone, Bell } from 'lucide-react';

interface AppLayoutProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  currentPage,
  onNavigate,
  children,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [dismissedAnnouncementId, setDismissedAnnouncementId] = useState<string | null>(null);

  const { currentShop, currentUser, announcements } = useApp();

  const isExpired = isSubscriptionExpired(currentShop);
  const daysLeft = getDaysRemaining(currentShop);
  const isSuspended = currentUser.account_status === 'suspended' || currentShop.subscription_status === 'suspended';
  const isPending = currentShop.subscription_status === 'pending_approval';

  // Find active in-app announcement
  const activeAnnouncement = announcements?.find(
    a => a.is_active && a.id !== dismissedAnnouncementId && (a.target_audience === 'all' || a.target_user_id === currentUser.id)
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* TailAdmin Dark Sidebar */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={onNavigate}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Shell */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72 transition-all">
        {/* TailAdmin Top Header */}
        <Header
          onOpenAIModal={() => setAiModalOpen(true)}
          onNavigateNewOrder={() => onNavigate('new-order')}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onNavigate={onNavigate}
        />

        {/* Global In-App Announcement Banner if any */}
        {activeAnnouncement && (
          <div className="bg-gradient-to-r from-indigo-700 to-purple-800 text-white px-4 py-2.5 text-xs flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2 max-w-4xl">
              <Megaphone className="w-4 h-4 shrink-0 text-amber-300 animate-bounce" />
              <div>
                <strong className="font-bold mr-1.5">{activeAnnouncement.title}:</strong>
                <span className="text-indigo-100">{activeAnnouncement.message}</span>
              </div>
            </div>
            <button
              onClick={() => setDismissedAnnouncementId(activeAnnouncement.id)}
              className="p-1 hover:bg-white/10 rounded-md transition text-indigo-200 hover:text-white"
              title="বিজ্ঞপ্তি বন্ধ করুন"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Suspended User Banner */}
        {isSuspended && (
          <div className="bg-red-600 text-white px-4 py-2.5 text-xs flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                আপনার অ্যাকাউন্টটি বর্তমানে স্থগিত (Suspended) রয়েছে। অনুগ্রহ করে Support-এর সাথে যোগাযোগ করুন।
              </span>
            </div>
            <button
              onClick={() => onNavigate('settings')}
              className="underline font-bold hover:text-red-100"
            >
              সাপোর্ট দেখুন
            </button>
          </div>
        )}

        {/* Pending payment banner */}
        {!isSuspended && isPending && (
          <div className="bg-amber-500 text-white px-4 py-2 text-xs flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 shrink-0" />
              <span>
                আপনার সাবস্ক্রিপশন ট্রানজ্যাকশন ভেরিফিকেশন অপেক্ষমান রয়েছে। দ্রুত অ্যাডমিন ভেরিফাই করবে।
              </span>
            </div>
            <button
              onClick={() => onNavigate('billing')}
              className="px-2.5 py-1 bg-white/20 hover:bg-white/30 rounded-lg font-bold transition flex items-center gap-1"
            >
              <span>স্ট্যাটাস দেখুন</span>
            </button>
          </div>
        )}

        {/* Expiry Warning: Expired */}
        {!isSuspended && !isPending && isExpired && (
          <div className="bg-rose-600 text-white px-4 py-2.5 text-xs flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 animate-pulse" />
              <span>
                আপনার সাবস্ক্রিপশন শেষ হয়েছে। পেইড ফিচারসমূহ চালু রাখতে এখনই রিনিউ করুন।
              </span>
            </div>
            <button
              onClick={() => onNavigate('billing')}
              className="px-3 py-1 bg-white text-rose-700 hover:bg-rose-50 font-bold rounded-lg transition shadow-xs flex items-center gap-1"
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>RENEW NOW (রিনিউ করুন)</span>
            </button>
          </div>
        )}

        {/* Expiry Warning: 1 Day Left */}
        {!isSuspended && !isPending && !isExpired && daysLeft === 1 && (
          <div className="bg-amber-600 text-white px-4 py-2 text-xs flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 shrink-0 animate-pulse" />
              <span>
                আপনার সাবস্ক্রিপশন আর ১ দিন পর শেষ হবে! নিরবচ্ছিন্ন সেবার জন্য আজই রিনিউ করুন।
              </span>
            </div>
            <button
              onClick={() => onNavigate('billing')}
              className="px-3 py-1 bg-white text-amber-800 hover:bg-amber-50 font-bold rounded-lg transition shadow-xs flex items-center gap-1"
            >
              <Zap className="w-3.5 h-3.5 text-amber-600" />
              <span>রিনিউ করুন</span>
            </button>
          </div>
        )}

        {/* Expiry Warning: 2-3 Days Left */}
        {!isSuspended && !isPending && !isExpired && daysLeft > 1 && daysLeft <= 3 && (
          <div className="bg-amber-500 text-white px-4 py-2 text-xs flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 shrink-0" />
              <span>
                আপনার সাবস্ক্রিপশন আর {daysLeft} দিন পর শেষ হবে।
              </span>
            </div>
            <button
              onClick={() => onNavigate('billing')}
              className="underline font-bold hover:text-amber-100"
            >
              রিনিউ করুন
            </button>
          </div>
        )}

        {/* Expiry Warning: 4-7 Days Left */}
        {!isSuspended && !isPending && !isExpired && daysLeft > 3 && daysLeft <= 7 && (
          <div className="bg-slate-800 text-slate-200 px-4 py-1.5 text-xs flex items-center justify-between border-b border-slate-700">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>
                আপনার সাবস্ক্রিপশন আর {daysLeft} দিন পর শেষ হবে।
              </span>
            </div>
            <button
              onClick={() => onNavigate('billing')}
              className="text-emerald-400 hover:text-emerald-300 font-bold underline"
            >
              রিনিউ বা আপগ্রেড
            </button>
          </div>
        )}

        {/* TailAdmin Page Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* AI Order Capture Modal */}
      <AIOrderCaptureModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        onOrderSaved={() => {
          onNavigate('orders');
        }}
      />
    </div>
  );
};
