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

function getInitialPage(): string {
  if (typeof window === 'undefined') return 'dashboard';
  const path = window.location.pathname.replace(/^\/+|\/+$/g, '');
  if (!path) return 'dashboard';
  if (path === 'admin') return 'admin';
  if (path.startsWith('admin/')) {
    return path.replace('/', '-');
  }
  if (path === 'billing' || path === 'subscription' || path === 'payment') {
    return 'billing';
  }
  return path;
}

function MainApp() {
  const { currentShop, currentUser, needsOnboarding, setNeedsOnboarding, switchRole, signOut } = useApp();
  const [currentPage, setCurrentPage] = useState<string>(getInitialPage);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedAdminUserId, setSelectedAdminUserId] = useState<string | null>(null);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  // Sync with browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPage(getInitialPage());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (page: string) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    let urlPath = '/' + page;
    if (page === 'dashboard') urlPath = '/';
    else if (page === 'admin') urlPath = '/admin';
    else if (page === 'admin-mfa') urlPath = '/admin/mfa';
    else if (page.startsWith('admin-')) urlPath = '/' + page.replace('-', '/');
    else if (page === 'billing') urlPath = '/billing';

    try {
      window.history.pushState(null, '', urlPath);
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
