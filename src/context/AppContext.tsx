import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Customer,
  Order,
  OrderStatus,
  PaymentVerification,
  Product,
  Shop,
  SubscriptionPlanId,
  UserProfile,
  AIParsingLog,
  OnboardingData,
  SubscriptionRecord,
  PlanRecord,
  CouponRecord,
  AnnouncementRecord,
  AdminSettingsConfig,
  AuditLogRecord,
  AppNotification,
} from '../types';
import { INITIAL_CUSTOMERS, INITIAL_ORDERS, INITIAL_PRODUCTS, INITIAL_SHOPS } from '../services/initialData';
import { calculateOrderProfit, calculateReturnLoss } from '../utils/calculations';
import { trackEvent } from '../utils/analytics';
import { SUBSCRIPTION_PLANS } from '../config/plans';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { DatabaseService } from '../services/dbService';
import { getPlanLimits } from '../utils/subscriptionLimits';

interface AppContextType {
  currentUser: UserProfile;
  currentShop: Shop;
  shops: Shop[];
  orders: Order[];
  products: Product[];
  customers: Customer[];
  paymentVerifications: PaymentVerification[];
  aiParseLogs: AIParsingLog[];
  isDemoMode: boolean;
  isSupabaseConnected: boolean;
  needsOnboarding: boolean;
  setNeedsOnboarding: (val: boolean) => void;

  // Supabase Auth operations
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, fullName: string, shopName?: string) => Promise<{ success: boolean; error?: string }>;
  signInWithOtp: (phone: string) => Promise<{ success: boolean; error?: string }>;
  verifyOtp: (phone: string, token: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;

  // Shop operations & Onboarding
  switchShop: (shopId: string) => void;
  createShop: (shopData: Partial<Shop>) => Shop;
  updateShop: (shopData: Partial<Shop>) => void;
  completeOnboarding: (data: OnboardingData) => Shop;

  // Order operations
  createOrder: (orderData: Partial<Order>) => Order;
  updateOrder: (orderId: string, patch: Partial<Order>) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  deleteOrder: (orderId: string) => void;

  // Product operations
  addProduct: (product: Partial<Product>) => Product;
  updateProduct: (productId: string, patch: Partial<Product>) => void;
  deleteProduct: (productId: string) => void;
  importProducts: (rows: Record<string, string>[]) => number;

  // Customer operations
  addCustomer: (customer: Partial<Customer>) => Customer;
  importCustomers: (rows: Record<string, string>[]) => number;

  // Subscriptions & Payment verification (Customer side)
  submitSubscriptionPayment: (data: Omit<PaymentVerification, 'id' | 'status' | 'created_at' | 'user_id' | 'shop_id'>) => void;
  verifySubscriptionPayment: (id: string, status: 'approved' | 'rejected', notes?: string) => void;

  // AI Log operations
  recordAILog: (log: AIParsingLog) => void;

  // Demo Reset & Role switch
  resetDemoData: () => void;
  setDemoMode: (val: boolean) => void;
  switchRole: (role: 'seller' | 'admin') => void;

  // --- ADMIN CONTROL SYSTEM STATE & METHODS ---
  adminUsers: UserProfile[];
  adminPayments: PaymentVerification[];
  adminSubscriptions: SubscriptionRecord[];
  adminPlans: PlanRecord[];
  coupons: CouponRecord[];
  announcements: AnnouncementRecord[];
  adminSettings: AdminSettingsConfig;
  adminAuditLogs: AuditLogRecord[];
  notifications: AppNotification[];

  markNotificationRead: (id: string) => void;
  approvePayment: (id: string) => Promise<void>;
  rejectPayment: (id: string, reason: string) => Promise<void>;
  suspendUser: (userId: string, reason?: string) => Promise<void>;
  reactivateUser: (userId: string) => Promise<void>;
  extendSubscription: (shopId: string, days: number, reason?: string) => Promise<void>;
  activateSubscription: (shopId: string) => Promise<void>;
  cancelSubscription: (shopId: string, reason?: string) => Promise<void>;
  changeUserPlan: (shopId: string, planId: string) => Promise<void>;
  addUserNote: (userId: string, note: string) => Promise<void>;
  createPlan: (plan: Partial<PlanRecord>) => Promise<void>;
  updatePlan: (planId: string, patch: Partial<PlanRecord>) => Promise<void>;
  createCoupon: (coupon: Partial<CouponRecord>) => Promise<void>;
  toggleCoupon: (couponId: string) => Promise<void>;
  deleteCoupon: (couponId: string) => Promise<void>;
  createAnnouncement: (announcement: Partial<AnnouncementRecord>) => Promise<void>;
  deleteAnnouncement: (announcementId: string) => Promise<void>;
  updateAdminSettings: (settings: Partial<AdminSettingsConfig>) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USER: 'bikripilot_user',
  SHOPS: 'bikripilot_shops',
  ACTIVE_SHOP_ID: 'bikripilot_active_shop_id',
  ORDERS: 'bikripilot_orders',
  PRODUCTS: 'bikripilot_products',
  CUSTOMERS: 'bikripilot_customers',
  VERIFICATIONS: 'bikripilot_verifications',
  AI_LOGS: 'bikripilot_ai_logs',
  DEMO_MODE: 'bikripilot_demo_mode',
  NEEDS_ONBOARDING: 'bikripilot_needs_onboarding',

  // Admin Keys
  ADMIN_USERS: 'bikripilot_admin_users',
  ADMIN_SUBSCRIPTIONS: 'bikripilot_admin_subscriptions',
  ADMIN_PLANS: 'bikripilot_admin_plans',
  ADMIN_COUPONS: 'bikripilot_admin_coupons',
  ADMIN_ANNOUNCEMENTS: 'bikripilot_admin_announcements',
  ADMIN_SETTINGS: 'bikripilot_admin_settings',
  ADMIN_AUDIT_LOGS: 'bikripilot_admin_audit_logs',
  NOTIFICATIONS: 'bikripilot_notifications',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isSupabase = isSupabaseConfigured();

  // Current User Profile
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USER);
    return saved
      ? JSON.parse(saved)
      : {
          id: 'user_default',
          email: 'seller@bikripilot.com',
          full_name: 'আহমেদ সাদিক',
          role: 'seller',
          account_status: 'active',
          isLoggedIn: true,
        };
  });

  // Shops
  const [shops, setShops] = useState<Shop[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SHOPS);
    return saved ? JSON.parse(saved) : INITIAL_SHOPS;
  });

  const [activeShopId, setActiveShopId] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_SHOP_ID);
    return saved && INITIAL_SHOPS.some(s => s.id === saved) ? saved : INITIAL_SHOPS[0].id;
  });

  const [allOrders, setAllOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ORDERS);
    return saved ? JSON.parse(saved) : INITIAL_ORDERS;
  });

  const [allProducts, setAllProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [allCustomers, setAllCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });

  // Payment requests & verifications
  const [paymentVerifications, setPaymentVerifications] = useState<PaymentVerification[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.VERIFICATIONS);
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: 'ver_1',
            user_id: 'user_default',
            shop_id: 'shop_tahoora',
            plan_name: 'founder',
            amount: 99,
            payment_method: 'bKash',
            payment_number: '01712987654',
            transaction_id: '9N74K29LPA',
            sender_phone: '01712987654',
            status: 'approved',
            admin_notes: 'bKash Merchant Trx verified manually.',
            created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            verified_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ];
  });

  const [aiParseLogs, setAiParseLogs] = useState<AIParsingLog[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AI_LOGS);
    return saved ? JSON.parse(saved) : [];
  });

  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DEMO_MODE);
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [needsOnboarding, setNeedsOnboarding] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.NEEDS_ONBOARDING);
    return saved === 'true';
  });

  // --- ADMIN DATA STATES ---
  const [adminUsers, setAdminUsers] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ADMIN_USERS);
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: 'admin_master',
            email: 'admin@bikripilot.com',
            full_name: 'সুপার অ্যাডমিন',
            phone: '01700000000',
            role: 'admin',
            account_status: 'active',
            created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: 'user_default',
            email: 'seller@bikripilot.com',
            full_name: 'আহমেদ সাদিক',
            phone: '01712987654',
            role: 'seller',
            account_status: 'active',
            created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: 'user_tahmina',
            email: 'tahmina@gmail.com',
            full_name: 'তাহমিনা পারভীন',
            phone: '01819283746',
            role: 'seller',
            account_status: 'active',
            created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: 'user_rafiq',
            email: 'rafiq.bd@yahoo.com',
            full_name: 'রফিকুল ইসলাম',
            phone: '01911223344',
            role: 'seller',
            account_status: 'active',
            created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ];
  });

  const [adminSubscriptions, setAdminSubscriptions] = useState<SubscriptionRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ADMIN_SUBSCRIPTIONS);
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: 'sub_default_1',
            user_id: 'user_default',
            shop_id: 'shop_tahoora',
            plan_id: 'founder',
            status: 'active',
            started_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            expires_at: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000).toISOString(),
            created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: 'sub_tahmina_1',
            user_id: 'user_tahmina',
            shop_id: 'shop_tahmina',
            plan_id: 'free_trial',
            status: 'trial',
            started_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            expires_at: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString(),
            created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          },
        ];
  });

  const [adminPlans, setAdminPlans] = useState<PlanRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ADMIN_PLANS);
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: 'free_trial',
            name: 'Free Trial',
            nameBn: 'ফ্রি ট্রায়াল',
            slug: 'free-trial',
            price: 0,
            currency: 'BDT',
            duration_days: 14,
            max_orders: 50,
            max_products: 25,
            max_ai_parses: 50,
            features_json: [
              '৫০টি AI মেসেঞ্জার অর্ডার ক্যাপচার',
              'ম্যানুয়াল অর্ডার ট্র্যাকিং',
              'বাংলা PDF ইনভয়েস',
              'রিটার্ন লস হিসাব',
            ],
            is_active: true,
            sort_order: 1,
            badge: 'ফ্রি ট্রায়াল',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: 'founder',
            name: 'Founder Deal',
            nameBn: 'ফাউন্ডার মেম্বারশিপ',
            slug: 'founder',
            price: 99,
            currency: 'BDT',
            duration_days: 60,
            max_orders: 300,
            max_products: 150,
            max_ai_parses: 300,
            features_json: [
              '৩০০টি AI মেসেঞ্জার অর্ডার ক্যাপচার',
              '৬০ দিন সম্পূর্ণ আনলিমিটেড সার্ভিস',
              'CSV এক্সপোর্ট ও ইমপোর্ট',
              'অডিট রিপোর্ট',
              'ভিআইপি হেল্পলাইন',
            ],
            is_active: true,
            sort_order: 2,
            badge: 'সেরা অফার 🔥',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: 'standard',
            name: 'Standard Pack',
            nameBn: 'স্ট্যান্ডার্ড প্যাক',
            slug: 'standard',
            price: 249,
            currency: 'BDT',
            duration_days: 30,
            max_orders: 800,
            max_products: 500,
            max_ai_parses: 800,
            features_json: [
              '৮০০টি AI মেসেঞ্জার অর্ডার ক্যাপচার',
              'আনলিমিটেড প্রোডাক্ট ও ইনভেন্টরি',
              '৭ দিনের সেলস ও নিট প্রফিট গ্রাফ',
              'বাংলা ইনভয়েস',
            ],
            is_active: true,
            sort_order: 3,
            badge: 'জনপ্রিয়',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: 'growth',
            name: 'Growth Pro',
            nameBn: 'গ্রোথ প্রো প্যাক',
            slug: 'growth',
            price: 499,
            currency: 'BDT',
            duration_days: 30,
            max_orders: 3000,
            max_products: 5000,
            max_ai_parses: 3000,
            features_json: [
              '৩০০০টি AI মেসেঞ্জার অর্ডার ক্যাপচার',
              'মাল্টি-শপ সাপোর্ট',
              'অ্যাড কস্ট ও ROI অ্যানালিটিক্স',
              'সকল প্রিমিয়াম ফিচার আনলক',
            ],
            is_active: true,
            sort_order: 4,
            badge: 'বড় পেজের জন্য',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ];
  });

  const [coupons, setCoupons] = useState<CouponRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ADMIN_COUPONS);
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: 'cpn_welcome',
            code: 'WELCOME50',
            discount_type: 'percentage',
            discount_value: 50,
            max_uses: 100,
            used_count: 8,
            expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
            is_active: true,
            created_at: new Date().toISOString(),
          },
          {
            id: 'cpn_flat',
            code: 'START30',
            discount_type: 'fixed',
            discount_value: 30,
            max_uses: 50,
            used_count: 3,
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            is_active: true,
            created_at: new Date().toISOString(),
          },
        ];
  });

  const [announcements, setAnnouncements] = useState<AnnouncementRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ADMIN_ANNOUNCEMENTS);
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: 'anc_welcome',
            title: 'BikriPilot F-Commerce OS-এ স্বাগতম!',
            message: 'মেসেঞ্জার চ্যাট থেকে AI দ্বারা ১ ক্লিকে ক্যাশ মেমো ও অর্ডার বানানোর সুবিধা এখন সম্পূর্ণ প্রস্তুত।',
            type: 'info',
            start_date: new Date().toISOString(),
            end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            target_audience: 'all',
            is_active: true,
            created_at: new Date().toISOString(),
          },
        ];
  });

  const [adminSettings, setAdminSettings] = useState<AdminSettingsConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ADMIN_SETTINGS);
    return saved
      ? JSON.parse(saved)
      : {
          business_name: 'BikriPilot HQ',
          support_phone: '01700000000',
          support_whatsapp: '01700000000',
          support_email: 'support@bikripilot.com',
          payment_number: '01712345678',
          payment_method: 'bKash / Nagad Personal',
          payment_instructions:
            'বিকাশ বা নগদ Personal নম্বরে Send Money করুন। তারপর নিচের ফর্মে TrxID ও নম্বর দিয়ে রিকোয়েস্ট সাবমিট করুন। ৩-১০ মিনিটের মধ্যে ভেরিফাই সম্পন্ন হবে।',
          default_currency: 'BDT',
          terms_url: '',
          privacy_url: '',
        };
  });

  const [adminAuditLogs, setAdminAuditLogs] = useState<AuditLogRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ADMIN_AUDIT_LOGS);
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: 'audit_init',
            admin_user_id: 'admin_master',
            admin_email: 'admin@bikripilot.com',
            action: 'System Initialized',
            target_entity: 'system',
            target_entity_id: 'bikripilot_v1',
            metadata: { version: '1.0.0' },
            created_at: new Date().toISOString(),
          },
        ];
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: 'notif_welcome',
            user_id: 'user_default',
            title: 'সাবস্ক্রিপশন স্ট্যাটাস',
            message: 'আপনার শপ BikriPilot-এ সফলভাবে সংযুক্ত হয়েছে।',
            type: 'info',
            created_at: new Date().toISOString(),
          },
        ];
  });

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SHOPS, JSON.stringify(shops));
  }, [shops]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_SHOP_ID, activeShopId);
  }, [activeShopId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(allOrders));
  }, [allOrders]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(allProducts));
  }, [allProducts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(allCustomers));
  }, [allCustomers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.VERIFICATIONS, JSON.stringify(paymentVerifications));
  }, [paymentVerifications]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AI_LOGS, JSON.stringify(aiParseLogs));
  }, [aiParseLogs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ADMIN_USERS, JSON.stringify(adminUsers));
  }, [adminUsers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ADMIN_SUBSCRIPTIONS, JSON.stringify(adminSubscriptions));
  }, [adminSubscriptions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ADMIN_PLANS, JSON.stringify(adminPlans));
  }, [adminPlans]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ADMIN_COUPONS, JSON.stringify(coupons));
  }, [coupons]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ADMIN_ANNOUNCEMENTS, JSON.stringify(announcements));
  }, [announcements]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ADMIN_SETTINGS, JSON.stringify(adminSettings));
  }, [adminSettings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ADMIN_AUDIT_LOGS, JSON.stringify(adminAuditLogs));
  }, [adminAuditLogs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  }, [notifications]);

  // Derived current shop
  const currentShop = shops.find(s => s.id === activeShopId) || shops[0] || INITIAL_SHOPS[0];
  const orders = allOrders.filter(o => o.shop_id === currentShop.id);
  const products = allProducts.filter(p => p.shop_id === currentShop.id);
  const customers = allCustomers.filter(c => c.shop_id === currentShop.id);
  const shopAILogs = aiParseLogs.filter(l => l.shop_id === currentShop.id);

  // Switch demo / role toggle
  const switchRole = (newRole: 'seller' | 'admin') => {
    // Only allow switching to admin if currentUser is already an admin or in demo mode
    if (newRole === 'admin' && !isDemoMode && currentUser.email !== 'admin@bikripilot.com') {
      console.warn('Unauthorized role switch attempt to admin');
      return;
    }
    setCurrentUser(prev => ({
      ...prev,
      role: newRole,
      full_name: newRole === 'admin' ? 'সুপার অ্যাডমিন' : (prev.full_name || 'আহমেদ সাদিক'),
      email: newRole === 'admin' ? 'admin@bikripilot.com' : (prev.email === 'admin@bikripilot.com' ? 'seller@bikripilot.com' : prev.email),
    }));
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
    );
  };

  // --- AUTH OPERATIONS ---
  const signIn = async (email: string, password: string) => {
    const cleanEmail = email.trim().toLowerCase();

    // 1. If Supabase is connected, authenticate via Supabase
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
      if (error) return { success: false, error: error.message };
      if (data.user) {
        // Query server/profiles for verified role (never trust client assumption)
        let verifiedRole: 'seller' | 'admin' = 'seller';
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, account_status')
          .eq('id', data.user.id)
          .single();

        if (profile?.role === 'admin' || cleanEmail === 'admin@bikripilot.com') {
          verifiedRole = 'admin';
        }

        // Establish server session
        try {
          await fetch('/api/admin/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: cleanEmail, password }),
          });
        } catch (_) {}

        setCurrentUser({
          id: data.user.id,
          email: data.user.email || cleanEmail,
          full_name: data.user.user_metadata?.full_name || cleanEmail.split('@')[0],
          role: verifiedRole,
          account_status: profile?.account_status || 'active',
          isLoggedIn: true,
        });
        return { success: true, isAdmin: verifiedRole === 'admin' };
      }
    }

    // 2. Direct server-verified login
    try {
      const adminRes = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password }),
      });
      const adminData = await adminRes.json();
      if (adminRes.ok && adminData.is_admin) {
        const adminObj = adminUsers.find(u => u.email.toLowerCase() === cleanEmail) || adminUsers[0];
        setCurrentUser({ ...adminObj, role: 'admin', isLoggedIn: true });
        return { success: true, isAdmin: true, mfaRequired: true };
      }
    } catch (_) {}

    // 3. Fallback standard merchant login
    const foundUser = adminUsers.find(u => u.email.toLowerCase() === cleanEmail);
    if (foundUser) {
      if (foundUser.account_status === 'suspended') {
        return { success: false, error: 'আপনার অ্যাকাউন্টটি স্থগিত রয়েছে। অ্যাডমিনের সাথে যোগাযোগ করুন।' };
      }
      setCurrentUser({ ...foundUser, isLoggedIn: true });
    } else {
      setCurrentUser({
        id: 'user_' + Date.now().toString(36),
        email: cleanEmail,
        full_name: cleanEmail.split('@')[0],
        role: 'seller', // Normal user is always seller by default
        account_status: 'active',
        isLoggedIn: true,
      });
    }
    return { success: true, isAdmin: false };
  };

  const signUp = async (email: string, password: string, fullName: string, shopName?: string) => {
    if (supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (error) return { success: false, error: error.message };
      if (data.user) {
        const newUser: UserProfile = {
          id: data.user.id,
          email,
          full_name: fullName,
          role: 'seller',
          account_status: 'active',
          isLoggedIn: true,
        };
        setCurrentUser(newUser);
        setAdminUsers(prev => [newUser, ...prev]);
      }
    } else {
      const newUser: UserProfile = {
        id: 'user_' + Date.now().toString(36),
        email,
        full_name: fullName,
        role: 'seller',
        account_status: 'active',
        created_at: new Date().toISOString(),
        isLoggedIn: true,
      };
      setCurrentUser(newUser);
      setAdminUsers(prev => [newUser, ...prev]);
    }

    if (shopName) {
      createShop({ name: shopName });
    }
    return { success: true };
  };

  const signInWithOtp = async (phone: string) => {
    if (supabase) {
      const { error } = await supabase.auth.signInWithOtp({ phone });
      if (error) return { success: false, error: error.message };
    }
    return { success: true };
  };

  const verifyOtp = async (phone: string, token: string) => {
    if (supabase) {
      const { data, error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' });
      if (error) return { success: false, error: error.message };
      if (data.user) {
        setCurrentUser({
          id: data.user.id,
          email: data.user.email || `${phone}@phone.bikripilot.com`,
          full_name: 'ভেরিফাইড মার্চেন্ট',
          role: 'seller',
          account_status: 'active',
          isLoggedIn: true,
        });
      }
    }
    return { success: true };
  };

  const signOut = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } catch (_) {}

    if (supabase) {
      await supabase.auth.signOut();
    }

    localStorage.removeItem(STORAGE_KEYS.USER);
    setCurrentUser({
      id: 'guest',
      email: '',
      full_name: '',
      role: 'seller',
      account_status: 'active',
      isLoggedIn: false,
    });
  };

  // --- SHOP OPERATIONS ---
  const switchShop = (shopId: string) => {
    if (shops.some(s => s.id === shopId)) {
      setActiveShopId(shopId);
    }
  };

  const createShop = (shopData: Partial<Shop>): Shop => {
    const userShopsCount = shops.filter(s => s.owner_id === currentUser.id).length;
    const currentLimits = getPlanLimits(currentShop.subscription_plan);
    if (userShopsCount >= currentLimits.maxShops && currentLimits.maxShops < 999) {
      console.warn(`Shop limit reached: ${userShopsCount}/${currentLimits.maxShops}`);
    }

    const newShop: Shop = {
      id: 'shop_' + Date.now().toString(36),
      owner_id: currentUser.id,
      name: shopData.name || 'আমার নতুন পেজ',
      fb_page_name: shopData.fb_page_name || 'My Facebook Page',
      fb_page_url: shopData.fb_page_url || '',
      category: shopData.category || 'General',
      phone: shopData.phone || currentUser.phone || '01700000000',
      logo_url: '',
      default_delivery_inside: 70,
      default_delivery_outside: 130,
      default_packaging_cost: 20,
      default_ad_cost: 150,
      subscription_plan: 'free_trial',
      subscription_status: 'active',
      subscription_expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
    };

    setShops(prev => [...prev, newShop]);
    setActiveShopId(newShop.id);
    DatabaseService.createShop(newShop);
    return newShop;
  };

  const updateShop = (patch: Partial<Shop>) => {
    // Sanitize patch: do not allow normal sellers to modify subscription fields directly
    const sanitizedPatch = { ...patch };
    if (currentUser.role !== 'admin') {
      delete sanitizedPatch.subscription_plan;
      delete sanitizedPatch.subscription_expires_at;
      if (sanitizedPatch.subscription_status !== 'pending_approval') {
        delete sanitizedPatch.subscription_status;
      }
    }

    setShops(prev =>
      prev.map(s => (s.id === currentShop.id ? { ...s, ...sanitizedPatch } : s))
    );
    DatabaseService.updateShop(currentShop.id, sanitizedPatch);
  };

  const completeOnboarding = (data: OnboardingData): Shop => {
    const updated = {
      name: data.shop_name,
      fb_page_name: data.fb_page_name,
      fb_page_url: data.fb_page_url || '',
      category: data.category,
      phone: data.phone,
      default_delivery_inside: data.default_delivery_inside,
      default_delivery_outside: data.default_delivery_outside,
      default_packaging_cost: data.default_packaging_cost,
      default_ad_cost: data.default_ad_cost,
    };
    updateShop(updated);

    if (data.first_product && data.first_product.name) {
      addProduct({
        name: data.first_product.name,
        selling_price: data.first_product.selling_price,
        cost_price: data.first_product.cost_price,
        variant: data.first_product.variant || 'Standard',
      });
    }

    setNeedsOnboarding(false);
    return { ...currentShop, ...updated };
  };

  // --- ORDER OPERATIONS ---
  const createOrder = (orderData: Partial<Order>): Order => {
    const profit = calculateOrderProfit({
      selling_price: orderData.selling_price || 0,
      quantity: orderData.quantity || 1,
      delivery_charge: orderData.delivery_charge || 0,
      product_cost: orderData.product_cost || 0,
      courier_cost: orderData.courier_cost || 0,
      packaging_cost: orderData.packaging_cost || 0,
      ad_cost: orderData.ad_cost || 0,
      other_cost: orderData.other_cost || 0,
      status: orderData.status || 'New',
    });

    const returnLoss = calculateReturnLoss({
      courier_cost: orderData.courier_cost || 0,
      return_courier_cost: orderData.return_courier_cost || 0,
      packaging_cost: orderData.packaging_cost || 0,
      ad_cost: orderData.ad_cost || 0,
      other_cost: orderData.other_cost || 0,
    });

    const countForShop = allOrders.filter(o => o.shop_id === currentShop.id).length;
    const orderNumber = `BP-${1001 + countForShop}`;

    const newOrder: Order = {
      id: 'ord_' + Date.now().toString(36),
      shop_id: currentShop.id,
      order_number: orderNumber,
      customer_name: orderData.customer_name || 'নামহীন গ্রাহক',
      phone: orderData.phone || '',
      district: orderData.district || 'ঢাকা',
      thana: orderData.thana || '',
      full_address: orderData.full_address || '',
      product_name: orderData.product_name || 'পণ্য',
      variant: orderData.variant || 'Standard',
      quantity: orderData.quantity || 1,
      selling_price: orderData.selling_price || 0,
      delivery_charge: orderData.delivery_charge || 0,
      advance_payment: orderData.advance_payment || 0,
      payment_method: orderData.payment_method || 'Cash on Delivery',
      product_cost: orderData.product_cost || 0,
      courier_cost: orderData.courier_cost || 0,
      packaging_cost: orderData.packaging_cost || 0,
      ad_cost: orderData.ad_cost || 0,
      other_cost: orderData.other_cost || 0,
      return_courier_cost: orderData.return_courier_cost || 0,
      return_loss_amount: returnLoss.totalReturnLoss,
      calculated_profit: profit.netProfit,
      profit_margin_pct: profit.profitMarginPct,
      status: orderData.status || 'New',
      notes: orderData.notes || '',
      invoice_id: `INV-${1000 + countForShop + 1}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setAllOrders(prev => [newOrder, ...prev]);
    DatabaseService.createOrder(newOrder);

    // Track analytics
    trackEvent('Purchase', {
      order_id: newOrder.id,
      order_number: newOrder.order_number,
      value: newOrder.selling_price * newOrder.quantity + newOrder.delivery_charge,
      currency: 'BDT',
      customer_phone: newOrder.phone,
      payment_method: newOrder.payment_method,
      estimated_profit: newOrder.calculated_profit,
    }, currentShop.id);

    return newOrder;
  };

  const updateOrder = (orderId: string, patch: Partial<Order>) => {
    setAllOrders(prev =>
      prev.map(ord => {
        if (ord.id !== orderId) return ord;
        return { ...ord, ...patch, updated_at: new Date().toISOString() };
      })
    );
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    updateOrder(orderId, { status });
    DatabaseService.updateOrderStatus(orderId, status);
  };

  const deleteOrder = (orderId: string) => {
    setAllOrders(prev => prev.filter(o => o.id !== orderId));
    DatabaseService.deleteOrder(orderId);
  };

  // --- PRODUCT OPERATIONS ---
  const addProduct = (product: Partial<Product>): Product => {
    const shopProductsCount = allProducts.filter(p => p.shop_id === currentShop.id).length;
    const limits = getPlanLimits(currentShop.subscription_plan);
    if (shopProductsCount >= limits.maxProducts) {
      throw new Error(`আপনার বর্তমান প্ল্যানে সর্বোচ্চ ${limits.maxProducts}টি পণ্য যোগ করা যাবে। সাবস্ক্রিপশন আপগ্রেড করুন।`);
    }

    const newProd: Product = {
      id: 'prod_' + Date.now().toString(36),
      shop_id: currentShop.id,
      name: product.name || 'নতুন পণ্য',
      sku: product.sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      variant: product.variant || 'Standard',
      selling_price: Number(product.selling_price) || 0,
      cost_price: Number(product.cost_price) || 0,
      stock: Number(product.stock) || 0,
      image_url: product.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&auto=format&fit=crop&q=80',
      created_at: new Date().toISOString(),
    };

    setAllProducts(prev => [newProd, ...prev]);
    DatabaseService.createProduct(newProd);
    return newProd;
  };

  const updateProduct = (productId: string, patch: Partial<Product>) => {
    setAllProducts(prev =>
      prev.map(p => (p.id === productId ? { ...p, ...patch } : p))
    );
    DatabaseService.updateProduct(productId, patch);
  };

  const deleteProduct = (productId: string) => {
    setAllProducts(prev => prev.filter(p => p.id !== productId));
    DatabaseService.deleteProduct(productId);
  };

  const importProducts = (rows: Record<string, string>[]): number => {
    let count = 0;
    const newItems: Product[] = [];
    for (const r of rows) {
      const name = r['Name'] || r['পণ্যের নাম'] || r['Product Name'] || r['name'];
      if (!name) continue;
      newItems.push({
        id: 'prod_' + Date.now().toString(36) + '_' + count,
        shop_id: currentShop.id,
        name,
        sku: r['SKU'] || r['sku'] || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
        variant: r['Variant'] || r['ভ্যারিয়েন্ট'] || 'Standard',
        selling_price: parseFloat(r['Selling Price'] || r['বিক্রয় মূল্য'] || r['price'] || '0') || 0,
        cost_price: parseFloat(r['Cost Price'] || r['ক্রয় খরচ'] || r['cost'] || '0') || 0,
        stock: parseInt(r['Stock'] || r['স্টক'] || '0', 10) || 0,
        created_at: new Date().toISOString(),
      });
      count++;
    }
    setAllProducts(prev => [...newItems, ...prev]);
    return count;
  };

  // --- CUSTOMER OPERATIONS ---
  const addCustomer = (cust: Partial<Customer>): Customer => {
    const newCust: Customer = {
      id: 'cust_' + Date.now().toString(36),
      shop_id: currentShop.id,
      name: cust.name || 'নামহীন গ্রাহক',
      phone: cust.phone || '',
      district: cust.district || 'ঢাকা',
      thana: cust.thana || '',
      full_address: cust.full_address || '',
      total_orders: 0,
      delivered_orders: 0,
      returned_orders: 0,
      total_sales: 0,
      estimated_profit: 0,
      created_at: new Date().toISOString(),
    };
    setAllCustomers(prev => [newCust, ...prev]);
    return newCust;
  };

  const importCustomers = (rows: Record<string, string>[]): number => {
    let count = 0;
    const newItems: Customer[] = [];
    for (const r of rows) {
      const phone = r['Phone'] || r['মোবাইল নম্বর'] || r['phone'];
      if (!phone) continue;
      newItems.push({
        id: 'cust_' + Date.now().toString(36) + '_' + count,
        shop_id: currentShop.id,
        name: r['Name'] || r['গ্রাহকের নাম'] || r['name'] || 'গ্রাহক',
        phone,
        district: r['District'] || r['জেলা'] || 'ঢাকা',
        thana: r['Thana'] || r['থানা'] || '',
        full_address: r['Address'] || r['ঠিকানা'] || '',
        total_orders: parseInt(r['Total Orders'] || r['মোট অর্ডার'] || '0', 10) || 0,
        delivered_orders: parseInt(r['Delivered'] || r['ডেলিভার্ড'] || '0', 10) || 0,
        returned_orders: parseInt(r['Returned'] || r['রিটার্ন'] || '0', 10) || 0,
        total_sales: parseFloat(r['Total Sales'] || r['মোট কেনাকাটা'] || '0') || 0,
        estimated_profit: parseFloat(r['Estimated Profit'] || r['মোট লাভ'] || '0') || 0,
        created_at: new Date().toISOString(),
      });
      count++;
    }
    setAllCustomers(prev => [...newItems, ...prev]);
    return count;
  };

  // --- CUSTOMER PAYMENT SUBMISSION ---
  const submitSubscriptionPayment = (
    data: Omit<PaymentVerification, 'id' | 'status' | 'created_at' | 'user_id' | 'shop_id'>
  ) => {
    const newVer: PaymentVerification = {
      id: 'ver_' + Date.now().toString(36),
      user_id: currentUser.id,
      shop_id: currentShop.id,
      ...data,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    setPaymentVerifications(prev => [newVer, ...prev]);
    updateShop({ subscription_status: 'pending_approval' });

    // Send to backend
    fetch('/api/payments/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: currentUser.id,
        shopId: currentShop.id,
        planName: data.plan_name,
        amount: data.amount,
        paymentMethod: data.payment_method,
        paymentNumber: data.sender_phone,
        transactionId: data.transaction_id,
        screenshotUrl: data.screenshot_url,
        customerNote: data.customer_note,
      }),
    }).catch(() => {});

    // In-app notification
    setNotifications(prev => [
      {
        id: 'notif_' + Date.now(),
        user_id: currentUser.id,
        title: 'পেমেন্ট রিকোয়েস্ট জমা হয়েছে',
        message: `${data.plan_name} প্ল্যানের জন্য পেমেন্ট রিকোয়েস্ট (${data.transaction_id}) জমা দেওয়া হয়েছে। অ্যাডমিন ভেরিফিকেশনের পর সক্রিয় হবে।`,
        type: 'payment',
        created_at: new Date().toISOString(),
      },
      ...prev,
    ]);
  };

  const verifySubscriptionPayment = (id: string, status: 'approved' | 'rejected', notes?: string) => {
    if (status === 'approved') {
      approvePayment(id);
    } else {
      rejectPayment(id, notes || 'Rejected by admin');
    }
  };

  // --- ADMIN ACTIONS IMPLEMENTATION ---
  const approvePayment = async (id: string) => {
    if (currentUser.role !== 'admin') {
      throw new Error('অননুমোদিত অ্যাক্সেস। শুধুমাত্র অ্যাডমিন পেমেন্ট অনুমোদন করতে পারেন।');
    }

    // 1. Call server API and verify authorization
    const res = await fetch(`/api/admin/payments/${id}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': currentUser.id,
        'x-user-email': currentUser.email,
        'x-user-role': currentUser.role,
      },
    });

    const resJson = await res.json().catch(() => null);
    if (!res.ok || !resJson?.success) {
      throw new Error(resJson?.error || 'সার্ভারে পেমেন্ট অনুমোদন ব্যর্থ হয়েছে।');
    }

    // 2. Update local state
    const payment = paymentVerifications.find(v => v.id === id);
    const targetUserId = payment?.user_id || currentUser.id;
    const targetShopId = payment?.shop_id || currentShop.id;
    const targetPlanName = payment?.plan_name || 'founder';
    const targetAmount = payment?.amount || 99;

    setPaymentVerifications(prev =>
      prev.map(v => {
        if (v.id !== id) return v;
        return {
          ...v,
          status: 'approved',
          approved_by: currentUser.email,
          approved_at: new Date().toISOString(),
          verified_at: new Date().toISOString(),
        };
      })
    );

    // Calculate days based on plan
    const planObj = adminPlans.find(p => p.id === targetPlanName);
    const planDays = planObj?.duration_days || 30;

    // 3. Extend subscription from current expiry if already active
    setShops(prev =>
      prev.map(s => {
        if (s.id !== targetShopId) return s;

        const currentExpiry = s.subscription_expires_at ? new Date(s.subscription_expires_at) : new Date();
        const baseDate = currentExpiry.getTime() > Date.now() ? currentExpiry : new Date();
        baseDate.setDate(baseDate.getDate() + planDays);

        return {
          ...s,
          subscription_plan: targetPlanName,
          subscription_status: 'active',
          subscription_expires_at: baseDate.toISOString(),
        };
      })
    );

    // 4. Update admin subscriptions list
    setAdminSubscriptions(prev => {
      const existing = prev.find(sub => sub.shop_id === targetShopId);
      if (existing) {
        const currentExp = new Date(existing.expires_at).getTime() > Date.now() ? new Date(existing.expires_at) : new Date();
        currentExp.setDate(currentExp.getDate() + planDays);
        return prev.map(sub =>
          sub.shop_id === targetShopId
            ? { ...sub, status: 'active', plan_id: targetPlanName, expires_at: currentExp.toISOString(), updated_at: new Date().toISOString() }
            : sub
        );
      } else {
        const newSub: SubscriptionRecord = {
          id: 'sub_' + Date.now().toString(36),
          user_id: targetUserId,
          shop_id: targetShopId,
          plan_id: targetPlanName,
          status: 'active',
          started_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + planDays * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        return [newSub, ...prev];
      }
    });

    // 5. Add Audit Log
    setAdminAuditLogs(prev => [
      {
        id: 'audit_' + Date.now(),
        admin_user_id: currentUser.id,
        admin_email: currentUser.email,
        action: 'Payment Approved & Subscription Activated',
        target_entity: 'payment',
        target_entity_id: id,
        metadata: { amount: targetAmount, plan: targetPlanName, shop_id: targetShopId, target_user: targetUserId },
        created_at: new Date().toISOString(),
      },
      ...prev,
    ]);

    // 6. User notification targeted to the buyer / merchant!
    setNotifications(prev => [
      {
        id: 'notif_' + Date.now(),
        user_id: targetUserId,
        title: 'পেমেন্ট অনুমোদিত হয়েছে!',
        message: `আপনার ${targetPlanName} প্ল্যানের পেমেন্ট অনুমোদিত হয়েছে এবং সাবস্ক্রিপশন সফলভাবে সক্রিয় করা হয়েছে।`,
        type: 'success',
        created_at: new Date().toISOString(),
      },
      ...prev,
    ]);
  };

  const rejectPayment = async (id: string, reason: string) => {
    if (currentUser.role !== 'admin') {
      throw new Error('অননুমোদিত অ্যাক্সেস। শুধুমাত্র অ্যাডমিন পেমেন্ট বাতিল করতে পারেন।');
    }

    const res = await fetch(`/api/admin/payments/${id}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': currentUser.id,
        'x-user-email': currentUser.email,
        'x-user-role': currentUser.role,
      },
      body: JSON.stringify({ reason }),
    });

    const resJson = await res.json().catch(() => null);
    if (!res.ok || !resJson?.success) {
      throw new Error(resJson?.error || 'সার্ভারে পেমেন্ট বাতিল ব্যর্থ হয়েছে।');
    }

    const payment = paymentVerifications.find(v => v.id === id);
    const targetUserId = payment?.user_id || currentUser.id;
    const targetShopId = payment?.shop_id || currentShop.id;

    setPaymentVerifications(prev =>
      prev.map(v => {
        if (v.id !== id) return v;
        return {
          ...v,
          status: 'rejected',
          rejection_reason: reason,
          rejected_by: currentUser.email,
          rejected_at: new Date().toISOString(),
        };
      })
    );

    // Revert shop subscription status if it was pending_approval
    setShops(prev =>
      prev.map(s => {
        if (s.id !== targetShopId) return s;
        if (s.subscription_status === 'pending_approval') {
          const isExpired = !s.subscription_expires_at || new Date(s.subscription_expires_at).getTime() < Date.now();
          return {
            ...s,
            subscription_status: isExpired ? 'expired' : 'trial',
          };
        }
        return s;
      })
    );

    setAdminAuditLogs(prev => [
      {
        id: 'audit_' + Date.now(),
        admin_user_id: currentUser.id,
        admin_email: currentUser.email,
        action: 'Payment Rejected',
        target_entity: 'payment',
        target_entity_id: id,
        metadata: { reason, shop_id: targetShopId, target_user: targetUserId },
        created_at: new Date().toISOString(),
      },
      ...prev,
    ]);

    // Target notification to the buyer / merchant
    setNotifications(prev => [
      {
        id: 'notif_' + Date.now(),
        user_id: targetUserId,
        title: 'পেমেন্ট বাতিল করা হয়েছে',
        message: `আপনার পেমেন্ট রিকোয়েস্টটি অনুমোদিত হয়নি। কারণ: ${reason}`,
        type: 'warning',
        created_at: new Date().toISOString(),
      },
      ...prev,
    ]);
  };

  const suspendUser = async (userId: string, reason?: string) => {
    fetch(`/api/admin/users/${userId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'admin' },
      body: JSON.stringify({ action: 'suspend', payload: { reason } }),
    }).catch(() => {});

    setAdminUsers(prev =>
      prev.map(u => (u.id === userId ? { ...u, account_status: 'suspended' } : u))
    );

    if (currentUser.id === userId) {
      setCurrentUser(prev => ({ ...prev, account_status: 'suspended' }));
    }

    setAdminAuditLogs(prev => [
      {
        id: 'audit_' + Date.now(),
        admin_user_id: currentUser.id,
        admin_email: currentUser.email,
        action: 'User Suspended',
        target_user_id: userId,
        target_entity: 'user',
        target_entity_id: userId,
        metadata: { reason },
        created_at: new Date().toISOString(),
      },
      ...prev,
    ]);
  };

  const reactivateUser = async (userId: string) => {
    fetch(`/api/admin/users/${userId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'admin' },
      body: JSON.stringify({ action: 'reactivate' }),
    }).catch(() => {});

    setAdminUsers(prev =>
      prev.map(u => (u.id === userId ? { ...u, account_status: 'active' } : u))
    );

    if (currentUser.id === userId) {
      setCurrentUser(prev => ({ ...prev, account_status: 'active' }));
    }

    setAdminAuditLogs(prev => [
      {
        id: 'audit_' + Date.now(),
        admin_user_id: currentUser.id,
        admin_email: currentUser.email,
        action: 'User Reactivated',
        target_user_id: userId,
        target_entity: 'user',
        target_entity_id: userId,
        created_at: new Date().toISOString(),
      },
      ...prev,
    ]);
  };

  const extendSubscription = async (shopId: string, days: number, reason?: string) => {
    fetch(`/api/admin/subscriptions/${shopId}/extend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'admin' },
      body: JSON.stringify({ days, reason }),
    }).catch(() => {});

    setShops(prev =>
      prev.map(s => {
        if (s.id !== shopId) return s;
        const currentExp = s.subscription_expires_at ? new Date(s.subscription_expires_at) : new Date();
        const base = currentExp.getTime() > Date.now() ? currentExp : new Date();
        base.setDate(base.getDate() + days);
        return {
          ...s,
          subscription_status: 'active',
          subscription_expires_at: base.toISOString(),
        };
      })
    );

    setAdminSubscriptions(prev =>
      prev.map(sub => {
        if (sub.shop_id !== shopId) return sub;
        const currentExp = new Date(sub.expires_at).getTime() > Date.now() ? new Date(sub.expires_at) : new Date();
        currentExp.setDate(currentExp.getDate() + days);
        return {
          ...sub,
          status: 'active',
          expires_at: currentExp.toISOString(),
          updated_at: new Date().toISOString(),
        };
      })
    );

    setAdminAuditLogs(prev => [
      {
        id: 'audit_' + Date.now(),
        admin_user_id: currentUser.id,
        admin_email: currentUser.email,
        action: 'Subscription Extended Manually',
        target_entity: 'shop_subscription',
        target_entity_id: shopId,
        metadata: { days_added: days, reason },
        created_at: new Date().toISOString(),
      },
      ...prev,
    ]);
  };

  const activateSubscription = async (shopId: string) => {
    fetch(`/api/admin/subscriptions/${shopId}/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'admin' },
    }).catch(() => {});

    const now = new Date();
    const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    setShops(prev =>
      prev.map(s => {
        if (s.id !== shopId) return s;
        const exp = s.subscription_expires_at && new Date(s.subscription_expires_at).getTime() > now.getTime()
          ? s.subscription_expires_at
          : expires.toISOString();
        return {
          ...s,
          subscription_status: 'active',
          subscription_expires_at: exp,
        };
      })
    );

    setAdminSubscriptions(prev => {
      const existing = prev.find(sub => sub.shop_id === shopId);
      if (existing) {
        return prev.map(sub =>
          sub.shop_id === shopId
            ? {
                ...sub,
                status: 'active',
                expires_at: new Date(sub.expires_at).getTime() > now.getTime() ? sub.expires_at : expires.toISOString(),
                updated_at: now.toISOString(),
              }
            : sub
        );
      } else {
        const newSub: SubscriptionRecord = {
          id: 'sub_' + Date.now().toString(36),
          user_id: currentUser.id,
          shop_id: shopId,
          plan_id: 'founder',
          status: 'active',
          started_at: now.toISOString(),
          expires_at: expires.toISOString(),
          created_at: now.toISOString(),
          updated_at: now.toISOString(),
        };
        return [newSub, ...prev];
      }
    });

    setAdminAuditLogs(prev => [
      {
        id: 'audit_' + Date.now(),
        admin_user_id: currentUser.id,
        admin_email: currentUser.email,
        action: 'Subscription Activated Directly',
        target_entity: 'shop_subscription',
        target_entity_id: shopId,
        metadata: { status: 'active' },
        created_at: now.toISOString(),
      },
      ...prev,
    ]);
  };

  const cancelSubscription = async (shopId: string, reason?: string) => {
    fetch(`/api/admin/subscriptions/${shopId}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'admin' },
      body: JSON.stringify({ reason }),
    }).catch(() => {});

    setShops(prev =>
      prev.map(s => (s.id === shopId ? { ...s, subscription_status: 'cancelled' } : s))
    );

    setAdminSubscriptions(prev =>
      prev.map(sub =>
        sub.shop_id === shopId
          ? {
              ...sub,
              status: 'cancelled',
              cancelled_at: new Date().toISOString(),
              cancel_reason: reason || 'অ্যাডমিন কর্তৃক বাতিলকৃত',
              updated_at: new Date().toISOString(),
            }
          : sub
      )
    );

    setAdminAuditLogs(prev => [
      {
        id: 'audit_' + Date.now(),
        admin_user_id: currentUser.id,
        admin_email: currentUser.email,
        action: 'Subscription Cancelled',
        target_entity: 'shop_subscription',
        target_entity_id: shopId,
        metadata: { reason },
        created_at: new Date().toISOString(),
      },
      ...prev,
    ]);
  };

  const changeUserPlan = async (shopId: string, planId: string) => {
    fetch(`/api/admin/subscriptions/${shopId}/change-plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'admin' },
      body: JSON.stringify({ planId }),
    }).catch(() => {});

    setShops(prev =>
      prev.map(s => (s.id === shopId ? { ...s, subscription_plan: planId, subscription_status: 'active' } : s))
    );

    setAdminSubscriptions(prev =>
      prev.map(sub => (sub.shop_id === shopId ? { ...sub, plan_id: planId, status: 'active', updated_at: new Date().toISOString() } : sub))
    );

    setAdminAuditLogs(prev => [
      {
        id: 'audit_' + Date.now(),
        admin_user_id: currentUser.id,
        admin_email: currentUser.email,
        action: 'User Plan Changed',
        target_entity: 'shop_subscription',
        target_entity_id: shopId,
        metadata: { new_plan: planId },
        created_at: new Date().toISOString(),
      },
      ...prev,
    ]);
  };

  const addUserNote = async (userId: string, note: string) => {
    setAdminUsers(prev =>
      prev.map(u => (u.id === userId ? { ...u, admin_notes: note } : u))
    );

    setAdminAuditLogs(prev => [
      {
        id: 'audit_' + Date.now(),
        admin_user_id: currentUser.id,
        admin_email: currentUser.email,
        action: 'Note Added to User',
        target_user_id: userId,
        target_entity: 'user',
        target_entity_id: userId,
        created_at: new Date().toISOString(),
      },
      ...prev,
    ]);
  };

  const createPlan = async (plan: Partial<PlanRecord>) => {
    const newPlan: PlanRecord = {
      id: plan.id || 'plan_' + Date.now().toString(36),
      name: plan.name || 'New Plan',
      slug: plan.slug || 'plan-slug',
      price: plan.price || 0,
      currency: 'BDT',
      duration_days: plan.duration_days || 30,
      max_orders: plan.max_orders || 100,
      max_products: plan.max_products || 25,
      max_ai_parses: plan.max_ai_parses || 50,
      features_json: plan.features_json || [],
      is_active: plan.is_active ?? true,
      sort_order: plan.sort_order || adminPlans.length + 1,
      badge: plan.badge,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setAdminPlans(prev => [...prev, newPlan]);

    setAdminAuditLogs(prev => [
      {
        id: 'audit_' + Date.now(),
        admin_user_id: currentUser.id,
        admin_email: currentUser.email,
        action: 'Plan Created',
        target_entity: 'plan',
        target_entity_id: newPlan.id,
        created_at: new Date().toISOString(),
      },
      ...prev,
    ]);
  };

  const updatePlan = async (planId: string, patch: Partial<PlanRecord>) => {
    setAdminPlans(prev =>
      prev.map(p => (p.id === planId ? { ...p, ...patch, updated_at: new Date().toISOString() } : p))
    );

    setAdminAuditLogs(prev => [
      {
        id: 'audit_' + Date.now(),
        admin_user_id: currentUser.id,
        admin_email: currentUser.email,
        action: 'Plan Updated',
        target_entity: 'plan',
        target_entity_id: planId,
        metadata: patch,
        created_at: new Date().toISOString(),
      },
      ...prev,
    ]);
  };

  const createCoupon = async (coupon: Partial<CouponRecord>) => {
    const newCoupon: CouponRecord = {
      id: 'cpn_' + Date.now().toString(36),
      code: coupon.code || 'COUPON',
      discount_type: coupon.discount_type || 'percentage',
      discount_value: coupon.discount_value || 10,
      max_uses: coupon.max_uses || 100,
      used_count: 0,
      expires_at: coupon.expires_at || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      is_active: coupon.is_active ?? true,
      created_at: new Date().toISOString(),
    };

    setCoupons(prev => [newCoupon, ...prev]);

    setAdminAuditLogs(prev => [
      {
        id: 'audit_' + Date.now(),
        admin_user_id: currentUser.id,
        admin_email: currentUser.email,
        action: 'Coupon Created',
        target_entity: 'coupon',
        target_entity_id: newCoupon.code,
        created_at: new Date().toISOString(),
      },
      ...prev,
    ]);
  };

  const toggleCoupon = async (couponId: string) => {
    setCoupons(prev =>
      prev.map(c => (c.id === couponId ? { ...c, is_active: !c.is_active } : c))
    );
  };

  const deleteCoupon = async (couponId: string) => {
    setCoupons(prev => prev.filter(c => c.id !== couponId));
  };

  const createAnnouncement = async (announcement: Partial<AnnouncementRecord>) => {
    const newAnc: AnnouncementRecord = {
      id: 'anc_' + Date.now().toString(36),
      title: announcement.title || 'Notification',
      message: announcement.message || '',
      type: announcement.type || 'info',
      start_date: announcement.start_date || new Date().toISOString(),
      end_date: announcement.end_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      target_audience: announcement.target_audience || 'all',
      target_plan: announcement.target_plan,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    setAnnouncements(prev => [newAnc, ...prev]);

    setAdminAuditLogs(prev => [
      {
        id: 'audit_' + Date.now(),
        admin_user_id: currentUser.id,
        admin_email: currentUser.email,
        action: 'Announcement Published',
        target_entity: 'announcement',
        target_entity_id: newAnc.id,
        created_at: new Date().toISOString(),
      },
      ...prev,
    ]);
  };

  const deleteAnnouncement = async (announcementId: string) => {
    setAnnouncements(prev => prev.filter(a => a.id !== announcementId));
  };

  const updateAdminSettings = async (patch: Partial<AdminSettingsConfig>) => {
    setAdminSettings(prev => ({ ...prev, ...patch }));

    setAdminAuditLogs(prev => [
      {
        id: 'audit_' + Date.now(),
        admin_user_id: currentUser.id,
        admin_email: currentUser.email,
        action: 'Admin Settings Updated',
        target_entity: 'settings',
        target_entity_id: 'global',
        created_at: new Date().toISOString(),
      },
      ...prev,
    ]);
  };

  const recordAILog = (log: AIParsingLog) => {
    setAiParseLogs(prev => [log, ...prev]);
  };

  const resetDemoData = () => {
    localStorage.clear();
    setShops(INITIAL_SHOPS);
    setActiveShopId(INITIAL_SHOPS[0].id);
    setAllOrders(INITIAL_ORDERS);
    setAllProducts(INITIAL_PRODUCTS);
    setAllCustomers(INITIAL_CUSTOMERS);
    setPaymentVerifications([]);
    setAiParseLogs([]);
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        currentShop,
        shops,
        orders,
        products,
        customers,
        paymentVerifications,
        aiParseLogs: shopAILogs,
        isDemoMode,
        isSupabaseConnected: isSupabase,
        needsOnboarding,
        setNeedsOnboarding,
        signIn,
        signUp,
        signInWithOtp,
        verifyOtp,
        signOut,
        completeOnboarding,
        switchShop,
        createShop,
        updateShop,
        createOrder,
        updateOrder,
        updateOrderStatus,
        deleteOrder,
        addProduct,
        updateProduct,
        deleteProduct,
        importProducts,
        addCustomer,
        importCustomers,
        submitSubscriptionPayment,
        verifySubscriptionPayment,
        recordAILog,
        resetDemoData,
        setDemoMode: setIsDemoMode,
        switchRole,

        // Admin system exports
        adminUsers,
        adminPayments: paymentVerifications,
        adminSubscriptions,
        adminPlans,
        coupons,
        announcements,
        adminSettings,
        adminAuditLogs,
        notifications,
        markNotificationRead,
        approvePayment,
        rejectPayment,
        suspendUser,
        reactivateUser,
        extendSubscription,
        activateSubscription,
        cancelSubscription,
        changeUserPlan,
        addUserNote,
        createPlan,
        updatePlan,
        createCoupon,
        toggleCoupon,
        deleteCoupon,
        createAnnouncement,
        deleteAnnouncement,
        updateAdminSettings,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
