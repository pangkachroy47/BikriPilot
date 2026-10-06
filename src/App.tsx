import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AppLayout } from './components/layout/AppLayout';
import { LandingPage } from './pages/public/LandingPage';
import { PricingPage } from './pages/public/PricingPage';
import { FAQPage } from './pages/public/FAQPage';
import { AuthPages } from './pages/public/AuthPages';
import { DashboardPage } from './pages/private/DashboardPage';
import { OrdersPage } from './pages/private/OrdersPage';
import { NewOrderPage } from './pages/private/NewOrderPage';
import { AICapturePage } from './pages/private/AICapturePage';
import { CustomersPage } from './pages/private/CustomersPage';
import { ProductsPage } from './pages/private/ProductsPage';
import { ProfitPage } from './pages/private/ProfitPage';
import { InvoicesPage } from './pages/private/InvoicesPage';
import { SettingsPage } from './pages/private/SettingsPage';
import { BillingPage } from './pages/private/BillingPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminPaymentsPage } from './pages/admin/AdminPaymentsPage';
import { AdminSubscriptionsPage } from './pages/admin/AdminSubscriptionsPage';
import { AdminPlansPage } from './pages/admin/AdminPlansPage';
import { AdminCouponsPage } from './pages/admin/AdminCouponsPage';
import { AdminAnnouncementsPage } from './pages/admin/AdminAnnouncementsPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';
import { AdminAuditLogsPage } from './pages/admin/AdminAuditLogsPage';
import { AdminUserDetailModal } from './pages/admin/AdminUserDetailModal';
import { AdminMFAPage } from './pages/admin/AdminMFAPage';
import { AdminGuard } from './components/admin/AdminGuard';
import { FeatureLockScreen } from './components/subscription/FeatureLockScreen';
import { OrderDetailsModal } from './pages/private/OrderDetailsModal';
import { AIOrderCaptureModal } from './components/ai/AIOrderCaptureModal';
import { OnboardingModal } from './pages/private/OnboardingModal';
import { Order } from './types';
import { trackEvent } from './utils/analytics';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { checkSubscriptionAccess } from './utils/accessControl';
import { ShieldAlert, ArrowLeft, Zap } from 'lucide-react';

const VALID_PAGES = new Set([
  'dashboard',
  'orders',
  'new-order',
  'ai-capture',
  'customers',
  'products',
  'profit',
  'invoices',
  'settings',
  'billing',
  'admin',
  'admin-users',
  'admin-payments',
  'admin-subscriptions',
  'admin-plans',
  'admin-coupons',
  'admin-announcements',
  'admin-settings',
  'admin-audit-logs',
  'admin-mfa',
  'landing',
  'pricing',
  'faq',
  'login',
  'register',
]);

function normalizeRoute(raw: string): string {
  const cleaned = raw.trim().replace(/^#\/?/, '').replace(/^\/+|\/+$/g, '');
  if (!cleaned) return 'dashboard';

  if (cleaned === 'billing' || cleaned === 'subscription' || cleaned === 'payment') {
    return 'billing';
  }
  if (cleaned === 'admin/mfa' || cleaned === 'control/mfa') return 'admin-mfa';
  if (cleaned === 'admin' || cleaned === 'control') return 'admin';
  if (cleaned.startsWith('admin/')) {
    return cleaned.replace('/', '-');
  }
  if (cleaned.startsWith('control/')) {
    return cleaned.replace('control/', 'admin-');
  }

  if (VALID_PAGES.has(cleaned)) {
    return cleaned;
  }

  return 'dashboard';
}

function getAppBasePath(): string {
  if (typeof window === 'undefined') return '';
  const pathname = window.location.pathname;
  const segments = pathname.split('/').filter(Boolean);

  // If hosted on GitHub Pages (*.github.io) or any subdirectory deployment,
  // the first segment is the repo name unless it matches a known page
  if (segments.length > 0) {
    const first = segments[0];
    if (window.location.hostname.endsWith('github.io') || !VALID_PAGES.has(first)) {
      if (first !== 'admin' && first !== 'control' && !VALID_PAGES.has(first)) {
        return '/' + first;
      }
    }
  }
  return '';
}

function getInitialPage(): string {
  if (typeof window === 'undefined') return 'dashboard';

  // 1. Check hash first (e.g. #/orders or #orders or #admin)
  if (window.location.hash) {
    const hashClean = window.location.hash.replace(/^#\/?/, '');
    const matched = normalizeRoute(hashClean);
    if (matched !== 'dashboard' || hashClean === 'dashboard') {
      return matched;
    }
  }

  // 2. Check query params (from 404.html redirect ?p=/orders or ?page=orders)
  const params = new URLSearchParams(window.location.search);
  const queryPage = params.get('p') || params.get('page');
  if (queryPage) {
    return normalizeRoute(queryPage);
  }

  // 3. Check pathname
  const segments = window.location.pathname.split('/').filter(Boolean);
  if (segments.length === 0) return 'dashboard';

  // Try subsegments to handle repository subpaths on GitHub Pages
  for (let i = 0; i < segments.length; i++) {
    const sub = segments.slice(i).join('/');
    const candidate = normalizeRoute(sub);
    if (VALID_PAGES.has(candidate)) {
      return candidate;
    }
  }

  return 'dashboard';
}

function MainApp() {
  const { currentShop, currentUser, needsOnboarding, setNeedsOnboarding, switchRole, signOut } = useApp();
  const [currentPage, setCurrentPage] = useState<string>(getInitialPage);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedAdminUserId, setSelectedAdminUserId] = useState<string | null>(null);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  // Sync with browser back/forward buttons and hashchange
  useEffect(() => {
    const handleRouteSync = () => {
      setCurrentPage(getInitialPage());
    };
    window.addEventListener('popstate', handleRouteSync);
    window.addEventListener('hashchange', handleRouteSync);
    return () => {
      window.removeEventListener('popstate', handleRouteSync);
      window.removeEventListener('hashchange', handleRouteSync);
    };
  }, []);

  const navigateTo = (page: string) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const basePath = getAppBasePath();
    let urlSubPath = '/' + page;
    if (page === 'dashboard') urlSubPath = '/';
    else if (page === 'admin') urlSubPath = '/admin';
    else if (page === 'admin-mfa') urlSubPath = '/admin/mfa';
    else if (page.startsWith('admin-')) urlSubPath = '/' + page.replace('-', '/');
    else if (page === 'billing') urlSubPath = '/billing';

    const fullUrl = basePath + (basePath && urlSubPath === '/' ? '/' : urlSubPath);

    try {
      window.history.pushState(null, '', fullUrl);
    } catch (_) {}

    // Track analytics ViewContent
    trackEvent('ViewContent', {
      content_name: page,
      content_category: 'Navigation',
    });
  };

  // Public Views
  if (currentPage === 'landing') {
    return (
      <LandingPage
        onGoToApp={() => navigateTo('dashboard')}
        onGoToPricing={() => navigateTo('pricing')}
        onGoToFAQ={() => navigateTo('faq')}
        onGoToLogin={() => navigateTo('login')}
        onGoToRegister={() => navigateTo('register')}
      />
    );
  }

  if (currentPage === 'pricing') {
    return (
      <PricingPage
        onGoBack={() => navigateTo('landing')}
        onSelectPlan={(_planId) => {
          navigateTo('billing');
        }}
        onGoToRegister={() => navigateTo('register')}
      />
    );
  }

  if (currentPage === 'faq') {
    return (
      <FAQPage
        onGoBack={() => navigateTo('landing')}
        onGoToApp={() => navigateTo('dashboard')}
      />
    );
  }

  if (currentPage === 'login' || currentPage === 'register') {
    return (
      <AuthPages
        initialMode={currentPage === 'login' ? 'login' : 'register'}
        onSuccess={() => {
          const params = new URLSearchParams(window.location.search);
          const next = params.get('next');
          if (next && (next.startsWith('/admin') || next.startsWith('/control'))) {
            navigateTo('admin-mfa');
          } else {
            navigateTo('dashboard');
          }
        }}
        onGoBack={() => navigateTo('landing')}
      />
    );
  }

  // Admin MFA Verification View (Dedicated Fullscreen security page)
  if (currentPage === 'admin-mfa') {
    return (
      <AdminMFAPage
        onSuccess={() => navigateTo('admin')}
        onLogout={async () => {
          await signOut();
          navigateTo('login');
        }}
      />
    );
  }

  // Access control check for customer side paid features
  const access = checkSubscriptionAccess(currentShop, currentUser);
  const isPaidLocked = !access.hasAccess;

  // Private App Views (enclosed in AppLayout)
  return (
    <AppLayout currentPage={currentPage} onNavigate={navigateTo}>
      {/* Merchant Core Views */}
      {currentPage === 'dashboard' && (
        <DashboardPage
          onNavigate={navigateTo}
          onOpenAIModal={() => setIsAIModalOpen(true)}
          onSelectOrder={(ord) => setSelectedOrder(ord)}
        />
      )}

      {currentPage === 'orders' && (
        isPaidLocked ? (
          <FeatureLockScreen featureName="অর্ডার ব্যবস্থাপনা" onNavigateBilling={() => navigateTo('billing')} />
        ) : (
          <OrdersPage
            onNavigateNewOrder={() => navigateTo('new-order')}
            onOpenAIModal={() => setIsAIModalOpen(true)}
            onSelectOrder={(ord) => setSelectedOrder(ord)}
          />
        )
      )}

      {currentPage === 'new-order' && (
        isPaidLocked ? (
          <FeatureLockScreen featureName="নতুন অর্ডার তৈরি" onNavigateBilling={() => navigateTo('billing')} />
        ) : (
          <NewOrderPage
            onNavigateOrders={() => navigateTo('orders')}
            onOpenAIModal={() => setIsAIModalOpen(true)}
          />
        )
      )}

      {currentPage === 'ai-capture' && (
        isPaidLocked ? (
          <FeatureLockScreen featureName="AI মেসেঞ্জার ক্যাপচার" onNavigateBilling={() => navigateTo('billing')} />
        ) : (
          <AICapturePage
            onOrderSaved={() => navigateTo('orders')}
          />
        )
      )}

      {currentPage === 'customers' && (
        isPaidLocked ? (
          <FeatureLockScreen featureName="কাস্টমার ডাটাবেজ" onNavigateBilling={() => navigateTo('billing')} />
        ) : (
          <CustomersPage />
        )
      )}

      {currentPage === 'products' && <ProductsPage />}

      {currentPage === 'profit' && (
        isPaidLocked ? (
          <FeatureLockScreen featureName="লাভ ও রিটার্ন লস অডিট" onNavigateBilling={() => navigateTo('billing')} />
        ) : (
          <ProfitPage />
        )
      )}

      {currentPage === 'invoices' && (
        isPaidLocked ? (
          <FeatureLockScreen featureName="বাংলা PDF মেমো" onNavigateBilling={() => navigateTo('billing')} />
        ) : (
          <InvoicesPage onSelectOrder={(ord) => setSelectedOrder(ord)} />
        )
      )}

      {currentPage === 'settings' && <SettingsPage />}

      {/* Customer Billing & Payment Submission Page */}
      {currentPage === 'billing' && <BillingPage onNavigate={navigateTo} />}

      {/* Safe Fallback: If currentPage is unmapped/unknown, safely render DashboardPage instead of empty screen */}
      {!currentPage.startsWith('admin') &&
        currentPage !== 'dashboard' &&
        currentPage !== 'orders' &&
        currentPage !== 'new-order' &&
        currentPage !== 'ai-capture' &&
        currentPage !== 'customers' &&
        currentPage !== 'products' &&
        currentPage !== 'profit' &&
        currentPage !== 'invoices' &&
        currentPage !== 'settings' &&
        currentPage !== 'billing' && (
          <DashboardPage
            onNavigate={navigateTo}
            onOpenAIModal={() => setIsAIModalOpen(true)}
            onSelectOrder={(ord) => setSelectedOrder(ord)}
          />
        )}

      {/* ================= ADMIN CONTROL CENTER VIEWS (Protected by Server-verified AdminGuard) ================= */}
      {currentPage.startsWith('admin') && (
        <AdminGuard onNavigate={navigateTo}>
          {currentPage === 'admin' && (
            <AdminDashboardPage
              onNavigateAdmin={navigateTo}
              onOpenUserDetail={(uId) => setSelectedAdminUserId(uId)}
            />
          )}

          {currentPage === 'admin-users' && (
            <AdminUsersPage onSelectUser={(uId) => setSelectedAdminUserId(uId)} />
          )}

          {currentPage === 'admin-payments' && <AdminPaymentsPage />}

          {currentPage === 'admin-subscriptions' && <AdminSubscriptionsPage />}

          {currentPage === 'admin-plans' && <AdminPlansPage />}

          {currentPage === 'admin-coupons' && <AdminCouponsPage />}

          {currentPage === 'admin-announcements' && <AdminAnnouncementsPage />}

          {currentPage === 'admin-settings' && <AdminSettingsPage />}

          {currentPage === 'admin-audit-logs' && <AdminAuditLogsPage />}
        </AdminGuard>
      )}

      {/* Selected Order Details & Invoice Generator Modal */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}

      {/* Admin User Details Inspection & Action Modal */}
      {selectedAdminUserId && (
        <AdminUserDetailModal
          userId={selectedAdminUserId}
          onClose={() => setSelectedAdminUserId(null)}
        />
      )}

      {/* Quick AI Order Capture Modal */}
      <AIOrderCaptureModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        onOrderSaved={(ord) => {
          navigateTo('orders');
          setSelectedOrder(ord);
        }}
        onNavigateBilling={() => {
          setIsAIModalOpen(false);
          navigateTo('billing');
        }}
      />

      {/* Onboarding Wizard */}
      <OnboardingModal
        isOpen={isOnboardingOpen || needsOnboarding}
        onComplete={() => {
          setIsOnboardingOpen(false);
          setNeedsOnboarding(false);
          navigateTo('dashboard');
        }}
      />
    </AppLayout>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <MainApp />
      </AppProvider>
    </ErrorBoundary>
  );
}
