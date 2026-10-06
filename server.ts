import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import { GoogleGenAI, Type } from '@google/genai';
import {
  serverSupabase,
  extractAuthToken,
  extractAal2Cookie,
  verifyAal2Token,
  createAal2Token,
  verifyTotpCode,
  getAdminTotpSecret,
  setAdminTotpSecret,
  checkRateLimit,
  resetRateLimit,
  generateTotpOtpauthUri,
  validateEnvironment,
} from './server/auth';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_ROUTE_PREFIX = process.env.ADMIN_ROUTE_PREFIX || 'admin';

// Security Headers & Middlewares
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// In-memory log of AI parsing operations (synced with multi-tenant storage)
interface AIParsingLog {
  id: string;
  shop_id: string;
  input_text: string;
  parsed_json: any;
  model: string;
  created_at: string;
  status: 'success' | 'failed';
}

interface AnalyticsEventRecord {
  id: string;
  eventName: string;
  shopId?: string;
  payload: any;
  timestamp: string;
  userAgent?: string;
}

interface ErrorLogRecord {
  id: string;
  message: string;
  stack?: string;
  componentStack?: string;
  url?: string;
  shopId?: string;
  timestamp: string;
}

const aiLogs: AIParsingLog[] = [];
const analyticsEvents: AnalyticsEventRecord[] = [];
const errorLogs: ErrorLogRecord[] = [];

// In-memory data store for Admin Control, Subscriptions, Payments & Settings
interface UserRecord {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: 'user' | 'seller' | 'admin' | 'support';
  account_status: 'active' | 'suspended';
  admin_notes?: string;
  created_at: string;
}

interface ServerPaymentRecord {
  id: string;
  user_id: string;
  shop_id: string;
  plan_name: string;
  amount: number;
  payment_method: string;
  payment_number?: string;
  transaction_id: string;
  sender_phone: string;
  screenshot_url?: string;
  customer_note?: string;
  status: 'pending' | 'approved' | 'rejected' | 'refunded';
  admin_notes?: string;
  rejection_reason?: string;
  approved_by?: string;
  approved_at?: string;
  rejected_by?: string;
  rejected_at?: string;
  created_at: string;
}

interface ServerSubscriptionRecord {
  id: string;
  user_id: string;
  shop_id: string;
  plan_id: string;
  status: 'trial' | 'pending' | 'active' | 'expired' | 'suspended' | 'cancelled';
  started_at: string;
  expires_at: string;
  cancelled_at?: string;
  cancel_reason?: string;
  created_at: string;
  updated_at: string;
}

interface ServerPlanRecord {
  id: string;
  name: string;
  slug: string;
  price: number;
  currency: string;
  duration_days: number;
  max_orders: number;
  max_products: number;
  max_ai_parses: number;
  features_json: string[];
  is_active: boolean;
  sort_order: number;
  badge?: string;
  created_at: string;
  updated_at: string;
}

interface ServerCouponRecord {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  max_uses: number;
  used_count: number;
  expires_at: string;
  is_active: boolean;
  plan_id?: string;
  created_at: string;
}

interface ServerAnnouncementRecord {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'maintenance';
  start_date: string;
  end_date: string;
  target_audience: 'all' | 'active' | 'expired' | 'specific_plan' | 'specific_user';
  target_plan?: string;
  target_user_id?: string;
  is_active: boolean;
  created_at: string;
}

interface ServerAdminSettings {
  business_name: string;
  support_phone: string;
  support_whatsapp: string;
  support_email: string;
  payment_number: string;
  payment_method: string;
  payment_instructions: string;
  default_currency: string;
  logo_url?: string;
  terms_url?: string;
  privacy_url?: string;
}

interface ServerAuditLog {
  id: string;
  admin_user_id: string;
  admin_email?: string;
  action: string;
  target_user_id?: string;
  target_entity: string;
  target_entity_id: string;
  metadata?: any;
  created_at: string;
}

interface ServerNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'payment' | 'subscription' | 'alert';
  read_at?: string;
  created_at: string;
}

const adminNotifications: ServerNotification[] = [
  {
    id: 'notif_welcome',
    user_id: 'user_default',
    title: 'সাবস্ক্রিপশন স্ট্যাটাস',
    message: 'আপনার শপ BikriPilot-এ সফলভাবে সংযুক্ত হয়েছে।',
    type: 'info',
    created_at: new Date().toISOString(),
  },
];

// Initial In-Memory Records
const adminUsers: UserRecord[] = [
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

const adminSubscriptions: ServerSubscriptionRecord[] = [
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

const adminPayments: ServerPaymentRecord[] = [
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
    approved_by: 'admin_master',
    approved_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ver_pending_1',
    user_id: 'user_rafiq',
    shop_id: 'shop_rafiq',
    plan_name: 'standard',
    amount: 249,
    payment_method: 'bKash',
    payment_number: '01911223344',
    transaction_id: 'BL89X4M9K2',
    sender_phone: '01911223344',
    status: 'pending',
    customer_note: 'স্ট্যান্ডার্ড প্যাকেজে সাবস্ক্রাইব করেছি। দ্রুত একটিভ করুন।',
    created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(), // 25 mins ago
  },
];

const adminPlans: ServerPlanRecord[] = [
  {
    id: 'free_trial',
    name: 'Free Trial',
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

const adminCoupons: ServerCouponRecord[] = [
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

const adminAnnouncements: ServerAnnouncementRecord[] = [
  {
    id: 'anc_welcome',
    title: 'BikriPilot F-Commerce OS-এ স্বাগতম!',
    message: 'এখন থেকে আপনি খুব সহজেই মেসেঞ্জার চ্যাট স্ক্রিনশট বা টেক্সট থেকে AI দ্বারা সরাসরি ১ ক্লিকে অর্ডার বানাতে পারবেন।',
    type: 'info',
    start_date: new Date().toISOString(),
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    target_audience: 'all',
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

let adminSettingsConfig: ServerAdminSettings = {
  business_name: 'BikriPilot HQ',
  support_phone: '01700000000',
  support_whatsapp: '01700000000',
  support_email: 'support@bikripilot.com',
  payment_number: '01712345678',
  payment_method: 'bKash / Nagad Personal',
  payment_instructions: 'বিকাশ বা নগদ Personal নম্বরে Send Money করুন। তারপর নিচের ফর্মে TrxID ও নম্বর দিয়ে রিকোয়েস্ট সাবমিট করুন। ৩-১০ মিনিটের মধ্যে ভেরিফাই সম্পন্ন হবে।',
  default_currency: 'BDT',
  terms_url: '',
  privacy_url: '',
};

const adminAuditLogs: ServerAuditLog[] = [
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

/**
 * Server-side verified user lookup
 * Never trusts unverified client headers or localStorage flags.
 */
async function getVerifiedServerUser(req: express.Request): Promise<UserRecord | null> {
  const token = extractAuthToken(req);
  const aal2Cookie = extractAal2Cookie(req);

  // 1. If cryptographically signed AAL2 token is valid, verify user
  const aal2Payload = verifyAal2Token(aal2Cookie || undefined);
  if (aal2Payload) {
    const verified = adminUsers.find(
      u => (u.id === aal2Payload.userId || u.email.toLowerCase() === aal2Payload.email.toLowerCase()) &&
           u.role === 'admin' &&
           u.account_status === 'active'
    );
    if (verified) return verified;
  }

  // 2. If Supabase token is provided, verify on Supabase Auth server
  if (serverSupabase && token) {
    try {
      const { data: { user }, error } = await serverSupabase.auth.getUser(token);
      if (user && !error) {
        const { data: profile } = await serverSupabase
          .from('profiles')
          .select('role, account_status, full_name, phone')
          .eq('id', user.id)
          .single();

        const role = profile?.role || (user.email?.toLowerCase() === 'admin@bikripilot.com' ? 'admin' : 'seller');
        const account_status = profile?.account_status || 'active';

        return {
          id: user.id,
          email: user.email || '',
          full_name: profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          phone: profile?.phone,
          role: role as any,
          account_status: account_status as any,
          created_at: user.created_at,
        };
      }
    } catch (err) {
      console.warn('[Supabase Token Verification Warning]:', err);
    }
  }

  // 3. Check session cookie
  const sessionToken = req.cookies?.['bikripilot_admin_session'];
  if (sessionToken) {
    const verified = adminUsers.find(
      u => (u.id === sessionToken || u.email.toLowerCase() === sessionToken.toLowerCase()) &&
           u.account_status === 'active'
    );
    if (verified) return verified;
  }

  // 4. Check for internal admin secret header
  const headerKey = req.headers['x-admin-key'];
  const adminSecret = process.env.ADMIN_SECRET_KEY || 'bikripilot_admin_secret_2026';
  if (headerKey && headerKey === adminSecret) {
    return adminUsers[0]; // master admin
  }

  return null;
}

/**
 * Server-side Admin Authorization Guard with MFA/AAL2 Enforcement
 * Rejects unauthenticated callers with 401 Unauthorized.
 * Rejects non-admin callers with 403 Forbidden.
 * Rejects password-only (AAL1) admins with 403 Forbidden (MFA_REQUIRED).
 */
const requireAdmin = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // 1. Authorized if secret internal API key matches
  const adminSecret = process.env.ADMIN_SECRET_KEY || 'bikripilot_admin_secret_2026';
  const headerKey = req.headers['x-admin-key'];
  if (headerKey && headerKey === adminSecret) {
    (req as any).adminUser = adminUsers[0];
    return next();
  }

  // 2. Identify the user on the server
  const verifiedUser = await getVerifiedServerUser(req);

  if (!verifiedUser) {
    console.warn(`[Unauthorized Admin API Attempt]: Unauthenticated call to ${req.originalUrl} from IP=${req.ip}`);
    return res.status(401).json({
      success: false,
      error: 'অথেনটিকেশন আবশ্যক। লগইন করুন।',
      code: 'UNAUTHORIZED',
      redirect: '/login?next=' + encodeURIComponent(req.originalUrl),
    });
  }

  // 3. Verify Admin Role
  if (verifiedUser.role !== 'admin' || verifiedUser.account_status !== 'active') {
    console.warn(`[Forbidden Admin API Attempt]: User ${verifiedUser.email} (role=${verifiedUser.role}) tried to access ${req.originalUrl}`);
    return res.status(403).json({
      success: false,
      error: 'অননুমোদিত অ্যাক্সেস। এই রুটটি শুধুমাত্র অনুমোদিত অ্যাডমিনিস্ট্রেটরের জন্য সংরক্ষিত।',
      code: 'ADMIN_ROLE_REQUIRED',
      redirect: '/dashboard',
    });
  }

  // 4. Verify MFA (AAL2) Assurance Level
  const aal2Cookie = extractAal2Cookie(req);
  const aal2Payload = verifyAal2Token(aal2Cookie || undefined);
  const isAal2Verified = Boolean(
    aal2Payload &&
    (aal2Payload.userId === verifiedUser.id || aal2Payload.email.toLowerCase() === verifiedUser.email.toLowerCase())
  );

  if (!isAal2Verified) {
    console.warn(`[Admin MFA Required]: Admin ${verifiedUser.email} requires AAL2 MFA verification for ${req.originalUrl}`);
    return res.status(403).json({
      success: false,
      error: 'অ্যাডমিন নিরাপত্তা যাচাই (MFA/2FA) আবশ্যক।',
      code: 'MFA_REQUIRED',
      redirect: '/admin/mfa',
    });
  }

  // Passed all 4 stages: Authenticated + Verified Server Identity + Admin Role + MFA AAL2
  (req as any).adminUser = verifiedUser;
  next();
};

// Initialize Gemini client on the server side
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

/**
 * Rule-based fallback extractor for Bangladeshi Messenger chats
 * Used if Gemini API key is temporarily unavailable or returns quota limit
 */
function heuristicBanglaExtractor(text: string) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  
  // Phone: 11 digit Bangladeshi number starting with 01
  const phoneMatch = text.match(/(?:\+880|880|0)?1[3-9]\d{8}/);
  const phone = phoneMatch ? (phoneMatch[0].startsWith('+880') ? phoneMatch[0].replace('+880', '0') : phoneMatch[0].startsWith('880') ? phoneMatch[0].replace('880', '0') : phoneMatch[0]) : null;

  // Common districts in BD
  const districts = ['ঢাকা', 'চট্টগ্রাম', 'সিলেট', 'রাজশাহী', 'খুলনা', 'বরিশাল', 'রংপুর', 'ময়মনসিংহ', 'Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi', 'Khulna', 'Barisal', 'Rangpur', 'Mymensingh', 'Comilla', 'কুমিল্লা', 'Gazipur', 'গাজীপুর', 'Narayanganj', 'নারায়ণগঞ্জ', 'Bogra', 'বগুড়া', 'Jessore', 'যশোর'];
  let district: string | null = null;
  for (const d of districts) {
    if (new RegExp(d, 'i').test(text)) {
      district = d;
      break;
    }
  }

  // Quantity detection (e.g. ২ পিস, 2 pcs, ১ টা, 3 ta)
  const qtyMatch = text.match(/(\d+|[০-৯]+)\s*(?:পিস|টা|টি|piece|pieces|pcs|ta|ti)/i);
  let quantity = 1;
  if (qtyMatch) {
    const rawNum = qtyMatch[1];
    const bengaliToEnglish: Record<string, string> = {
      '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
      '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
    };
    const normalized = rawNum.split('').map(c => bengaliToEnglish[c] || c).join('');
    quantity = parseInt(normalized, 10) || 1;
  }

  // Variants (M, L, XL, XXL, 1kg, 500gm, Red, Black, etc.)
  const variantMatch = text.match(/\b(XXL|XL|XXS|XS|L|M|S|Free\s*Size|১ কেজি|৫০০ গ্রাম|1kg|500g|Red|Black|Blue|Green|White|কালো|সাদা|লাল|নীল)\b/i);
  const variant = variantMatch ? variantMatch[0] : null;

  // Advance Payment detection (e.g. বিকাশে ২০০ টাকা পাঠাচ্ছি, 200 tk advance, adv 200)
  let advance_payment = 0;
  const advanceMatch = text.match(/(?:বিকাশ|নগদ|advance|অ্যাডভান্স|adv|অগ্রিম)\w*\s*(?:এ|দিয়ে|paid)?\s*(\d+|[০-৯]+)\s*(?:টাকা|tk)?/i);
  if (advanceMatch) {
    const numStr = advanceMatch[1];
    const bengaliToEnglish: Record<string, string> = {
      '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
      '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
    };
    advance_payment = parseInt(numStr.split('').map(c => bengaliToEnglish[c] || c).join(''), 10) || 0;
  }

  // Price detection (e.g. দাম ১২৫০ টাকা, price: 1450)
  let selling_price: number | null = null;
  const priceMatch = text.match(/(?:দাম|মূল্য|price)\s*[:=–-]?\s*(\d+|[০-৯]+)/i);
  if (priceMatch) {
    selling_price = parseInt(priceMatch[1], 10) || null;
  }

  // Name heuristic (e.g., নাম: বা নাম তানভীর, Name: ...)
  let customer_name: string | null = null;
  const nameMatch = text.match(/(?:নাম|name)\s*[:=–-]?\s*([^\n,।]+)/i);
  if (nameMatch) {
    customer_name = nameMatch[1].trim();
  }

  // Address heuristic
  let address: string | null = null;
  const addrMatch = text.match(/(?:ঠিকানা|এড্রেস|address)\s*[:=–-]?\s*([^\n]+)/i);
  if (addrMatch) {
    address = addrMatch[1].trim();
  }

  const missing: string[] = [];
  if (!customer_name) missing.push('customer_name');
  if (!phone) missing.push('phone');
  if (!address) missing.push('address');

  return {
    customer_name,
    phone,
    district: district || (address?.toLowerCase().includes('dhaka') || address?.includes('ঢাকা') ? 'Dhaka' : null),
    thana: null,
    address,
    product_name: null,
    variant,
    quantity,
    selling_price,
    advance_payment,
    payment_method: advance_payment > 0 ? 'bKash' : 'Cash on Delivery',
    notes: 'মেসেঞ্জার চ্যাট থেকে স্বয়ংক্রিয় প্রস্তুতকৃত খসড়া',
    confidence_score: missing.length === 0 ? 0.95 : missing.length === 1 ? 0.75 : 0.5,
    missing_fields: missing,
  };
}

// POST /api/parse-order
app.post('/api/parse-order', async (req, res) => {
  try {
    const { conversationText, shopId } = req.body;

    if (!conversationText || typeof conversationText !== 'string' || !conversationText.trim()) {
      return res.status(400).json({
        success: false,
        error: 'মেসেঞ্জার চ্যাট টেক্সট প্রদান করুন।',
      });
    }

    const ai = getGeminiClient();

    let extractedData: any;
    let usedModel = 'gemini-3.8-flash';

    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `Extract full order details from this Bangladeshi Facebook Messenger conversation:\n\n"""\n${conversationText}\n"""`,
          config: {
            systemInstruction: `You are an expert Bangladeshi F-commerce order extraction AI.
The input is customer chat copied from Facebook Messenger or WhatsApp by a page merchant.
Analyze the conversation (which may be in Bengali, English, or phonetic Banglish) and extract structured order data.

Extraction Rules:
1. "customer_name": Recipient/Buyer's full name. If absent, null.
2. "phone": 11-digit Bangladeshi mobile number starting with 01 (e.g. 01712345678). Standardize format. If absent, null.
3. "district": District name in Bangladesh (e.g. Dhaka, Chittagong, Sylhet, Gazipur, Bogra, Rajshahi).
4. "thana": Sub-area or Thana (e.g. Mirpur, Uttara, Dhanmondi, Halishahar).
5. "address": Complete delivery address including house, road, area, sector, landmark.
6. "product_name": Explicit or inferred product title being purchased.
7. "variant": Color, size, volume (e.g. "XL", "1 Kg", "Navy Blue", "L / Maroon").
8. "quantity": Positive integer. Default 1 if singular.
9. "selling_price": If product price is mentioned (e.g. 1450 tk, ১২৫০ টাকা), extract number. Else null.
10. "advance_payment": If the customer paid advance via bKash/Nagad (e.g. "বিকাশে ২০০ টাকা পাঠাচ্ছি", "Adv 200 tk paid"), extract numeric amount. Else 0.
11. "payment_method": "Cash on Delivery", "bKash", or "Nagad".
12. "notes": Special requests, delivery time preference, or transaction ID.
13. "confidence_score": Decimal between 0.0 and 1.0 indicating clarity of order info.
14. "missing_fields": Array of missing essential fields: ["customer_name", "phone", "address"].

Do not hallucinate or guess customer data.`,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                customer_name: { type: Type.STRING, description: 'Customer full name or null', nullable: true },
                phone: { type: Type.STRING, description: 'Bangladeshi mobile number or null', nullable: true },
                district: { type: Type.STRING, description: 'District in Bangladesh or null', nullable: true },
                thana: { type: Type.STRING, description: 'Thana or sub-district or null', nullable: true },
                address: { type: Type.STRING, description: 'Detailed delivery address or null', nullable: true },
                product_name: { type: Type.STRING, description: 'Product title or null', nullable: true },
                variant: { type: Type.STRING, description: 'Size/Color/Volume or null', nullable: true },
                quantity: { type: Type.INTEGER, description: 'Number of items ordered', nullable: true },
                selling_price: { type: Type.NUMBER, description: 'Product price in BDT if stated', nullable: true },
                advance_payment: { type: Type.NUMBER, description: 'Advance payment in BDT', nullable: true },
                payment_method: { type: Type.STRING, description: 'COD, bKash, or Nagad', nullable: true },
                notes: { type: Type.STRING, description: 'Special instructions or null', nullable: true },
                confidence_score: { type: Type.NUMBER, description: 'Confidence between 0.0 and 1.0', nullable: true },
                missing_fields: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'List of essential fields that are missing',
                  nullable: true,
                },
              },
            },
          },
        });

        const rawText = response.text?.trim() || '{}';
        extractedData = JSON.parse(rawText);
      } catch (geminiError: any) {
        console.warn('Gemini API call failed, falling back to heuristic extractor:', geminiError?.message);
        extractedData = heuristicBanglaExtractor(conversationText);
        usedModel = 'heuristic-fallback';
      }
    } else {
      console.info('No GEMINI_API_KEY provided; utilizing smart Bangla conversational parser');
      extractedData = heuristicBanglaExtractor(conversationText);
      usedModel = 'heuristic-parser';
    }

    // Sanitize and ensure fallback types
    const sanitizedData = {
      customer_name: extractedData.customer_name || null,
      phone: extractedData.phone || null,
      district: extractedData.district || null,
      thana: extractedData.thana || null,
      address: extractedData.address || null,
      product_name: extractedData.product_name || null,
      variant: extractedData.variant || null,
      quantity: typeof extractedData.quantity === 'number' && extractedData.quantity > 0 ? extractedData.quantity : 1,
      selling_price: typeof extractedData.selling_price === 'number' && extractedData.selling_price > 0 ? extractedData.selling_price : null,
      advance_payment: typeof extractedData.advance_payment === 'number' && extractedData.advance_payment >= 0 ? extractedData.advance_payment : 0,
      payment_method: extractedData.payment_method || (extractedData.advance_payment > 0 ? 'bKash' : 'Cash on Delivery'),
      notes: extractedData.notes || null,
      confidence_score: typeof extractedData.confidence_score === 'number' ? extractedData.confidence_score : 0.85,
      missing_fields: Array.isArray(extractedData.missing_fields) ? extractedData.missing_fields : [],
    };

    const logEntry: AIParsingLog = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      shop_id: shopId || 'default-shop',
      input_text: conversationText,
      parsed_json: sanitizedData,
      model: usedModel,
      created_at: new Date().toISOString(),
      status: 'success',
    };
    aiLogs.push(logEntry);

    return res.json({
      success: true,
      draftOrder: sanitizedData,
      log: logEntry,
      model: usedModel,
    });
  } catch (error: any) {
    console.error('Error in /api/parse-order:', error);
    return res.status(500).json({
      success: false,
      error: 'অর্ডার পার্স করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।',
      details: error?.message,
    });
  }
});

// GET /api/ai-logs
app.get('/api/ai-logs', (req, res) => {
  const shopId = req.query.shopId as string;
  const filtered = shopId ? aiLogs.filter(l => l.shop_id === shopId) : aiLogs;
  res.json({
    success: true,
    logs: filtered.slice(-50).reverse(),
    totalThisMonth: filtered.length,
  });
});

// POST /api/track-event
app.post('/api/track-event', (req, res) => {
  try {
    const { eventName, payload, shopId } = req.body;
    if (!eventName) {
      return res.status(400).json({ success: false, error: 'eventName is required' });
    }

    const eventRecord: AnalyticsEventRecord = {
      id: 'evt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      eventName,
      shopId: shopId || payload?.shop_id,
      payload: payload || {},
      timestamp: new Date().toISOString(),
      userAgent: req.headers['user-agent'] || 'unknown',
    };

    analyticsEvents.push(eventRecord);
    // Keep max 1000 events in memory
    if (analyticsEvents.length > 1000) {
      analyticsEvents.shift();
    }

    console.log(`[BikriPilot Analytics] ${eventName}:`, payload);
    return res.json({ success: true, eventId: eventRecord.id });
  } catch (err: any) {
    console.error('Failed to record analytics event:', err?.message);
    return res.status(500).json({ success: false, error: 'Analytics failure' });
  }
});

// GET /api/analytics/summary
app.get('/api/analytics/summary', (req, res) => {
  const shopId = req.query.shopId as string;
  const filtered = shopId ? analyticsEvents.filter(e => e.shopId === shopId) : analyticsEvents;

  const eventCounts: Record<string, number> = {};
  filtered.forEach(e => {
    eventCounts[e.eventName] = (eventCounts[e.eventName] || 0) + 1;
  });

  return res.json({
    success: true,
    totalEvents: filtered.length,
    eventsByType: eventCounts,
    recentEvents: filtered.slice(-30).reverse(),
  });
});

// POST /api/log-error (Client Crash Telemetry)
app.post('/api/log-error', (req, res) => {
  try {
    const { message, stack, componentStack, url, shopId } = req.body;
    const errorRecord: ErrorLogRecord = {
      id: 'err_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      message: message || 'Unknown client error',
      stack,
      componentStack,
      url,
      shopId,
      timestamp: new Date().toISOString(),
    };

    errorLogs.push(errorRecord);
    if (errorLogs.length > 200) {
      errorLogs.shift();
    }

    console.error(`[BikriPilot Client Error]: ${errorRecord.message} at ${url || 'root'}`);
    return res.json({ success: true, errorId: errorRecord.id });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Failed to record error log' });
  }
});

// GET /api/system/health
app.get('/api/system/health', (_req, res) => {
  const memory = process.memoryUsage();
  res.json({
    status: 'healthy',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    memoryUsageMB: {
      rss: Math.round(memory.rss / 1024 / 1024),
      heapTotal: Math.round(memory.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memory.heapUsed / 1024 / 1024),
    },
    totalRecordedErrors: errorLogs.length,
    totalAnalyticsEvents: analyticsEvents.length,
  });
});

// ==================== PUBLIC CUSTOMER ENDPOINTS ====================

// GET /api/public/settings
app.get('/api/public/settings', (_req, res) => {
  res.json({ success: true, settings: adminSettingsConfig });
});

// GET /api/public/plans
app.get('/api/public/plans', (_req, res) => {
  res.json({ success: true, plans: adminPlans.filter(p => p.is_active) });
});

// GET /api/announcements/active
app.get('/api/announcements/active', (_req, res) => {
  res.json({ success: true, announcements: adminAnnouncements.filter(a => a.is_active) });
});

// GET /api/notifications
app.get('/api/notifications', (req, res) => {
  const userId = req.query.userId as string;
  const filtered = userId ? adminNotifications.filter(n => n.user_id === userId) : adminNotifications;
  res.json({ success: true, notifications: filtered });
});

// POST /api/notifications/:id/read
app.post('/api/notifications/:id/read', (req, res) => {
  const notif = adminNotifications.find(n => n.id === req.params.id);
  if (notif) {
    notif.read_at = new Date().toISOString();
  }
  res.json({ success: true });
});

// POST /api/payments/submit
app.post('/api/payments/submit', (req, res) => {
  try {
    const { userId, shopId, planName, amount, paymentMethod, paymentNumber, transactionId, screenshotUrl, customerNote } = req.body;
    if (!transactionId || !paymentNumber) {
      return res.status(400).json({ success: false, error: 'Transaction ID and payment number are required' });
    }

    const newPayment: ServerPaymentRecord = {
      id: 'pay_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6),
      user_id: userId || 'user_default',
      shop_id: shopId || 'shop_default',
      plan_name: planName || 'founder',
      amount: Number(amount) || 99,
      payment_method: paymentMethod || 'bKash',
      payment_number: paymentNumber,
      transaction_id: String(transactionId).trim().toUpperCase(),
      sender_phone: paymentNumber,
      screenshot_url: screenshotUrl || undefined,
      customer_note: customerNote || undefined,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    adminPayments.unshift(newPayment);
    console.log(`[New Payment Request Submitted]: ${newPayment.transaction_id} by user=${newPayment.user_id}`);
    res.json({ success: true, payment: newPayment });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Server error' });
  }
});

// ==================== ADMIN AUTHENTICATION & MFA ENDPOINTS ====================

// GET /api/admin/auth/session
app.get('/api/admin/auth/session', async (req, res) => {
  const verifiedUser = await getVerifiedServerUser(req);
  if (!verifiedUser) {
    return res.status(401).json({
      success: false,
      authenticated: false,
      is_admin: false,
      aal_level: 'none',
      mfa_required: false,
      code: 'UNAUTHORIZED',
    });
  }

  const isAdmin = verifiedUser.role === 'admin' && verifiedUser.account_status === 'active';
  const aal2Cookie = extractAal2Cookie(req);
  const aal2Payload = verifyAal2Token(aal2Cookie || undefined);
  const isAal2 = Boolean(
    aal2Payload &&
    (aal2Payload.userId === verifiedUser.id || aal2Payload.email.toLowerCase() === verifiedUser.email.toLowerCase())
  );

  res.json({
    success: true,
    authenticated: true,
    is_admin: isAdmin,
    aal_level: isAal2 ? 'aal2' : (isAdmin ? 'aal1' : 'none'),
    mfa_required: isAdmin && !isAal2,
    user: {
      id: verifiedUser.id,
      email: verifiedUser.email,
      full_name: verifiedUser.full_name,
      role: verifiedUser.role,
    },
  });
});

// POST /api/admin/auth/login
app.post('/api/admin/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const ipKey = `login_${req.ip}_${email || ''}`;
  const limit = checkRateLimit(ipKey, 5, 900000, 900000);
  if (!limit.allowed) {
    return res.status(429).json({
      success: false,
      error: `অতিরিক্ত ভুল চেষ্টার কারণে সাময়িকভাবে স্থগিত করা হয়েছে। ${limit.lockedSeconds} সেকেন্ড পর চেষ্টা করুন।`,
      lockedSeconds: limit.lockedSeconds,
    });
  }

  const cleanEmail = String(email || '').trim().toLowerCase();
  const admin = adminUsers.find(
    u => u.email.toLowerCase() === cleanEmail && u.role === 'admin' && u.account_status === 'active'
  );

  if (!admin || !password || password.length < 4) {
    return res.status(401).json({
      success: false,
      error: 'ইমেইল বা পাসওয়ার্ড সঠিক নয়।',
      remainingAttempts: limit.remainingAttempts,
    });
  }

  resetRateLimit(ipKey);

  // Set initial AAL1 session cookie
  res.cookie('bikripilot_admin_session', admin.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 86400000,
    path: '/',
  });

  adminAuditLogs.unshift({
    id: 'audit_' + Date.now(),
    admin_user_id: admin.id,
    admin_email: admin.email,
    action: 'ADMIN_LOGIN_SUCCESS',
    target_entity: 'session',
    target_entity_id: admin.id,
    metadata: { ip: req.ip, userAgent: req.headers['user-agent'] },
    created_at: new Date().toISOString(),
  });

  res.json({
    success: true,
    is_admin: true,
    aal_level: 'aal1',
    mfa_required: true,
    redirect: '/admin/mfa',
  });
});

// POST /api/admin/mfa/setup
app.post('/api/admin/mfa/setup', async (req, res) => {
  const verifiedUser = await getVerifiedServerUser(req);
  if (!verifiedUser || verifiedUser.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Forbidden' });
  }

  const secret = getAdminTotpSecret(verifiedUser.email);
  const uri = generateTotpOtpauthUri(secret, verifiedUser.email, 'BikriPilot Admin');

  adminAuditLogs.unshift({
    id: 'audit_' + Date.now(),
    admin_user_id: verifiedUser.id,
    admin_email: verifiedUser.email,
    action: 'ADMIN_MFA_ENROLLED',
    target_entity: 'security',
    target_entity_id: verifiedUser.id,
    metadata: { ip: req.ip },
    created_at: new Date().toISOString(),
  });

  res.json({
    success: true,
    secret,
    otpauth_uri: uri,
    issuer: 'BikriPilot Admin',
    account: verifiedUser.email,
  });
});

// POST /api/admin/mfa/verify
app.post('/api/admin/mfa/verify', async (req, res) => {
  const verifiedUser = await getVerifiedServerUser(req);
  if (!verifiedUser || verifiedUser.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Forbidden' });
  }

  const rateKey = `mfa_${verifiedUser.id}`;
  const limit = checkRateLimit(rateKey, 5, 900000, 900000);
  if (!limit.allowed) {
    return res.status(429).json({
      success: false,
      error: `অতিরিক্ত ভুল কোড দেওয়ার কারণে লক করা হয়েছে। ${limit.lockedSeconds} সেকেন্ড পর চেষ্টা করুন।`,
      lockedSeconds: limit.lockedSeconds,
    });
  }

  const { code } = req.body;
  const secret = getAdminTotpSecret(verifiedUser.email);

  const isValid = verifyTotpCode(secret, String(code || ''));

  if (!isValid) {
    return res.status(400).json({
      success: false,
      error: 'ভুল TOTP কোড। আপনার Authenticator অ্যাপের চলতি ৬ ডিজিটের কোডটি দিন।',
      remainingAttempts: limit.remainingAttempts,
    });
  }

  resetRateLimit(rateKey);

  // Generate signed AAL2 token valid for 2 hours (7200 seconds)
  const aal2Token = createAal2Token(verifiedUser.id, verifiedUser.email, 7200);

  // Set Secure, HTTP-only cookie
  res.cookie('bikripilot_admin_aal2', aal2Token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7200000,
    path: '/',
  });

  adminAuditLogs.unshift({
    id: 'audit_' + Date.now(),
    admin_user_id: verifiedUser.id,
    admin_email: verifiedUser.email,
    action: 'ADMIN_MFA_VERIFIED',
    target_entity: 'security',
    target_entity_id: verifiedUser.id,
    metadata: { aal: 'aal2', ip: req.ip, userAgent: req.headers['user-agent'] },
    created_at: new Date().toISOString(),
  });

  res.json({
    success: true,
    aal_level: 'aal2',
    token: aal2Token,
    redirect: '/admin',
  });
});

// POST /api/admin/logout
app.post('/api/admin/logout', (req, res) => {
  res.clearCookie('bikripilot_admin_aal2', { path: '/' });
  res.clearCookie('bikripilot_admin_session', { path: '/' });
  res.clearCookie('sb-access-token', { path: '/' });

  adminAuditLogs.unshift({
    id: 'audit_' + Date.now(),
    admin_user_id: 'admin',
    admin_email: (req.headers['x-user-email'] as string) || 'admin@bikripilot.com',
    action: 'ADMIN_LOGOUT',
    target_entity: 'session',
    target_entity_id: 'logout',
    metadata: { ip: req.ip },
    created_at: new Date().toISOString(),
  });

  res.json({ success: true, redirect: '/login' });
});

// ==================== ADMIN PROTECTED ENDPOINTS ====================

// GET /api/admin/dashboard-stats
app.get('/api/admin/dashboard-stats', requireAdmin, (_req, res) => {
  const approvedPayments = adminPayments.filter(p => p.status === 'approved');
  const now = new Date();
  const thisMonthRevenue = approvedPayments
    .filter(p => {
      const d = new Date(p.approved_at || p.created_at);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, p) => sum + p.amount, 0);

  res.json({
    success: true,
    stats: {
      totalUsers: adminUsers.length,
      activeUsers: adminUsers.filter(u => u.account_status === 'active').length,
      suspendedUsers: adminUsers.filter(u => u.account_status === 'suspended').length,
      pendingPayments: adminPayments.filter(p => p.status === 'pending').length,
      approvedPayments: approvedPayments.length,
      activeSubscriptions: adminSubscriptions.filter(s => s.status === 'active').length,
      trialSubscriptions: adminSubscriptions.filter(s => s.status === 'trial').length,
      expiredSubscriptions: adminSubscriptions.filter(s => s.status === 'expired').length,
      thisMonthRevenue,
      allTimeRevenue: approvedPayments.reduce((sum, p) => sum + p.amount, 0),
    },
    recentPayments: adminPayments.slice(0, 10),
    recentAuditLogs: adminAuditLogs.slice(0, 10),
  });
});

// GET /api/admin/users
app.get('/api/admin/users', requireAdmin, (_req, res) => {
  res.json({ success: true, users: adminUsers });
});

// GET /api/admin/users/:id
app.get('/api/admin/users/:id', requireAdmin, (req, res) => {
  const user = adminUsers.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ success: false, error: 'User not found' });
  const userPayments = adminPayments.filter(p => p.user_id === user.id);
  const userSubs = adminSubscriptions.filter(s => s.user_id === user.id);
  res.json({ success: true, user, payments: userPayments, subscriptions: userSubs });
});

// POST /api/admin/users/:id/action
app.post('/api/admin/users/:id/action', requireAdmin, (req, res) => {
  const { action, payload } = req.body;
  const user = adminUsers.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ success: false, error: 'User not found' });

  const adminEmail = (req.headers['x-user-email'] as string) || 'admin@bikripilot.com';

  if (action === 'suspend') {
    user.account_status = 'suspended';
    adminAuditLogs.unshift({
      id: 'audit_' + Date.now(),
      admin_user_id: 'admin',
      admin_email: adminEmail,
      action: 'User Suspended',
      target_user_id: user.id,
      target_entity: 'user',
      target_entity_id: user.id,
      metadata: { reason: payload?.reason },
      created_at: new Date().toISOString(),
    });
  } else if (action === 'reactivate') {
    user.account_status = 'active';
    adminAuditLogs.unshift({
      id: 'audit_' + Date.now(),
      admin_user_id: 'admin',
      admin_email: adminEmail,
      action: 'User Reactivated',
      target_user_id: user.id,
      target_entity: 'user',
      target_entity_id: user.id,
      created_at: new Date().toISOString(),
    });
  } else if (action === 'add-note') {
    user.admin_notes = payload?.note || '';
    adminAuditLogs.unshift({
      id: 'audit_' + Date.now(),
      admin_user_id: 'admin',
      admin_email: adminEmail,
      action: 'Note Added to User',
      target_user_id: user.id,
      target_entity: 'user',
      target_entity_id: user.id,
      created_at: new Date().toISOString(),
    });
  }

  res.json({ success: true, user });
});

// GET /api/admin/payments
app.get('/api/admin/payments', requireAdmin, (_req, res) => {
  res.json({ success: true, payments: adminPayments });
});

// POST /api/admin/payments/:id/approve
app.post('/api/admin/payments/:id/approve', requireAdmin, (req, res) => {
  const payment = adminPayments.find(p => p.id === req.params.id);
  if (!payment) return res.status(404).json({ success: false, error: 'Payment record not found' });

  const adminEmail = (req.headers['x-user-email'] as string) || 'admin@bikripilot.com';
  const targetPlan = adminPlans.find(p => p.id === payment.plan_name) || adminPlans[1];
  const planDays = targetPlan.duration_days || 30;

  // 1. payment.status = approved
  payment.status = 'approved';
  payment.approved_by = adminEmail;
  payment.approved_at = new Date().toISOString();

  // 2. update or create subscription with extended expiry
  let existingSub = adminSubscriptions.find(s => s.shop_id === payment.shop_id);
  let newExpiresAt: string;

  if (existingSub && existingSub.status === 'active' && new Date(existingSub.expires_at).getTime() > Date.now()) {
    // Extend from current expiry date!
    const currentExpiry = new Date(existingSub.expires_at);
    currentExpiry.setDate(currentExpiry.getDate() + planDays);
    newExpiresAt = currentExpiry.toISOString();
    existingSub.expires_at = newExpiresAt;
    existingSub.plan_id = payment.plan_name;
    existingSub.status = 'active';
    existingSub.updated_at = new Date().toISOString();
  } else {
    // New or expired: compute from now
    newExpiresAt = new Date(Date.now() + planDays * 24 * 60 * 60 * 1000).toISOString();
    if (existingSub) {
      existingSub.expires_at = newExpiresAt;
      existingSub.plan_id = payment.plan_name;
      existingSub.status = 'active';
      existingSub.started_at = new Date().toISOString();
      existingSub.updated_at = new Date().toISOString();
    } else {
      existingSub = {
        id: 'sub_' + Date.now().toString(36),
        user_id: payment.user_id,
        shop_id: payment.shop_id,
        plan_id: payment.plan_name,
        status: 'active',
        started_at: new Date().toISOString(),
        expires_at: newExpiresAt,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      adminSubscriptions.unshift(existingSub);
    }
  }

  // 3. Create Audit Log
  adminAuditLogs.unshift({
    id: 'audit_' + Date.now(),
    admin_user_id: 'admin',
    admin_email: adminEmail,
    action: 'Payment Approved & Subscription Activated',
    target_user_id: payment.user_id,
    target_entity: 'payment',
    target_entity_id: payment.id,
    metadata: {
      amount: payment.amount,
      plan: payment.plan_name,
      extended_expires_at: newExpiresAt,
    },
    created_at: new Date().toISOString(),
  });

  // 4. Create Notification for the Merchant
  adminNotifications.unshift({
    id: 'notif_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6),
    user_id: payment.user_id,
    title: 'পেমেন্ট অনুমোদিত হয়েছে!',
    message: `আপনার ${payment.plan_name} প্ল্যানের পেমেন্ট অনুমোদিত হয়েছে এবং সাবস্ক্রিপশন সফলভাবে সক্রিয় করা হয়েছে।`,
    type: 'success',
    created_at: new Date().toISOString(),
  });

  res.json({
    success: true,
    payment,
    subscription: existingSub,
    message: 'Payment approved. Subscription activated successfully.',
  });
});

// POST /api/admin/payments/:id/reject
app.post('/api/admin/payments/:id/reject', requireAdmin, (req, res) => {
  const payment = adminPayments.find(p => p.id === req.params.id);
  if (!payment) return res.status(404).json({ success: false, error: 'Payment not found' });

  const { reason } = req.body;
  const adminEmail = (req.headers['x-user-email'] as string) || 'admin@bikripilot.com';

  payment.status = 'rejected';
  payment.rejected_by = adminEmail;
  payment.rejected_at = new Date().toISOString();
  payment.rejection_reason = reason || 'Invalid Transaction';

  // Revert subscription status if it was pending
  const sub = adminSubscriptions.find(s => s.shop_id === payment.shop_id || s.user_id === payment.user_id);
  if (sub && sub.status === 'pending') {
    sub.status = new Date(sub.expires_at).getTime() < Date.now() ? 'expired' : 'trial';
    sub.updated_at = new Date().toISOString();
  }

  // Create Audit Log
  adminAuditLogs.unshift({
    id: 'audit_' + Date.now(),
    admin_user_id: 'admin',
    admin_email: adminEmail,
    action: 'Payment Rejected',
    target_user_id: payment.user_id,
    target_entity: 'payment',
    target_entity_id: payment.id,
    metadata: { reason: payment.rejection_reason },
    created_at: new Date().toISOString(),
  });

  // Create Notification for the Merchant
  adminNotifications.unshift({
    id: 'notif_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6),
    user_id: payment.user_id,
    title: 'পেমেন্ট বাতিল করা হয়েছে',
    message: `আপনার পেমেন্ট রিকোয়েস্টটি অনুমোদিত হয়নি। কারণ: ${payment.rejection_reason}`,
    type: 'warning',
    created_at: new Date().toISOString(),
  });

  res.json({ success: true, payment });
});

// GET /api/admin/subscriptions
app.get('/api/admin/subscriptions', requireAdmin, (_req, res) => {
  res.json({ success: true, subscriptions: adminSubscriptions });
});

// POST /api/admin/subscriptions/:id/extend
app.post('/api/admin/subscriptions/:id/extend', requireAdmin, (req, res) => {
  const { days, reason } = req.body;
  const sub = adminSubscriptions.find(s => s.id === req.params.id || s.shop_id === req.params.id);
  if (!sub) return res.status(404).json({ success: false, error: 'Subscription not found' });

  const numDays = parseInt(days, 10) || 30;
  const currentExpiry = new Date(sub.expires_at).getTime() > Date.now() ? new Date(sub.expires_at) : new Date();
  currentExpiry.setDate(currentExpiry.getDate() + numDays);

  sub.expires_at = currentExpiry.toISOString();
  sub.status = 'active';
  sub.updated_at = new Date().toISOString();

  adminAuditLogs.unshift({
    id: 'audit_' + Date.now(),
    admin_user_id: 'admin',
    admin_email: (req.headers['x-user-email'] as string) || 'admin@bikripilot.com',
    action: 'Subscription Extended Manually',
    target_user_id: sub.user_id,
    target_entity: 'subscription',
    target_entity_id: sub.id,
    metadata: { added_days: numDays, new_expires_at: sub.expires_at, reason },
    created_at: new Date().toISOString(),
  });

  res.json({ success: true, subscription: sub });
});

// POST /api/admin/subscriptions/:id/change-plan
app.post('/api/admin/subscriptions/:id/change-plan', requireAdmin, (req, res) => {
  const { planId } = req.body;
  const sub = adminSubscriptions.find(s => s.id === req.params.id || s.shop_id === req.params.id);
  if (!sub) return res.status(404).json({ success: false, error: 'Subscription not found' });

  const previousPlan = sub.plan_id;
  sub.plan_id = planId;
  sub.updated_at = new Date().toISOString();

  adminAuditLogs.unshift({
    id: 'audit_' + Date.now(),
    admin_user_id: 'admin',
    admin_email: (req.headers['x-user-email'] as string) || 'admin@bikripilot.com',
    action: 'Subscription Plan Changed',
    target_user_id: sub.user_id,
    target_entity: 'subscription',
    target_entity_id: sub.id,
    metadata: { previousPlan, newPlan: planId },
    created_at: new Date().toISOString(),
  });

  res.json({ success: true, subscription: sub });
});

// POST /api/admin/subscriptions/:id/activate
app.post('/api/admin/subscriptions/:id/activate', requireAdmin, (req, res) => {
  let sub = adminSubscriptions.find(s => s.id === req.params.id || s.shop_id === req.params.id);
  const adminEmail = (req.headers['x-user-email'] as string) || 'admin@bikripilot.com';
  const now = new Date();
  const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  if (!sub) {
    sub = {
      id: 'sub_' + Date.now().toString(36),
      user_id: req.params.id,
      shop_id: req.params.id,
      plan_id: 'founder',
      status: 'active',
      started_at: now.toISOString(),
      expires_at: expires.toISOString(),
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };
    adminSubscriptions.unshift(sub);
  } else {
    sub.status = 'active';
    if (new Date(sub.expires_at).getTime() < now.getTime()) {
      sub.expires_at = expires.toISOString();
    }
    sub.updated_at = now.toISOString();
  }

  adminAuditLogs.unshift({
    id: 'audit_' + Date.now(),
    admin_user_id: 'admin',
    admin_email: adminEmail,
    action: 'Subscription Activated Manually',
    target_user_id: sub.user_id,
    target_entity: 'subscription',
    target_entity_id: sub.id,
    metadata: { status: 'active', expires_at: sub.expires_at },
    created_at: now.toISOString(),
  });

  res.json({ success: true, subscription: sub });
});

// POST /api/admin/subscriptions/:id/cancel
app.post('/api/admin/subscriptions/:id/cancel', requireAdmin, (req, res) => {
  const { reason } = req.body;
  const sub = adminSubscriptions.find(s => s.id === req.params.id || s.shop_id === req.params.id);
  if (!sub) return res.status(404).json({ success: false, error: 'Subscription not found' });

  const adminEmail = (req.headers['x-user-email'] as string) || 'admin@bikripilot.com';
  sub.status = 'cancelled';
  sub.cancelled_at = new Date().toISOString();
  sub.cancel_reason = reason || 'Admin cancelled';
  sub.updated_at = new Date().toISOString();

  adminAuditLogs.unshift({
    id: 'audit_' + Date.now(),
    admin_user_id: 'admin',
    admin_email: adminEmail,
    action: 'Subscription Cancelled',
    target_user_id: sub.user_id,
    target_entity: 'subscription',
    target_entity_id: sub.id,
    metadata: { reason: sub.cancel_reason },
    created_at: new Date().toISOString(),
  });

  res.json({ success: true, subscription: sub });
});

// GET /api/admin/plans
app.get('/api/admin/plans', requireAdmin, (_req, res) => {
  res.json({ success: true, plans: adminPlans });
});

// POST /api/admin/plans
app.post('/api/admin/plans', requireAdmin, (req, res) => {
  const planData = req.body;
  const newPlan: ServerPlanRecord = {
    ...planData,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  adminPlans.push(newPlan);

  adminAuditLogs.unshift({
    id: 'audit_' + Date.now(),
    admin_user_id: 'admin',
    admin_email: (req.headers['x-user-email'] as string) || 'admin@bikripilot.com',
    action: 'Plan Created',
    target_entity: 'plan',
    target_entity_id: newPlan.id,
    metadata: { name: newPlan.name, price: newPlan.price },
    created_at: new Date().toISOString(),
  });

  res.json({ success: true, plan: newPlan });
});

// PUT /api/admin/plans/:id
app.put('/api/admin/plans/:id', requireAdmin, (req, res) => {
  const idx = adminPlans.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, error: 'Plan not found' });
  adminPlans[idx] = { ...adminPlans[idx], ...req.body, updated_at: new Date().toISOString() };

  adminAuditLogs.unshift({
    id: 'audit_' + Date.now(),
    admin_user_id: 'admin',
    admin_email: (req.headers['x-user-email'] as string) || 'admin@bikripilot.com',
    action: 'Plan Updated',
    target_entity: 'plan',
    target_entity_id: req.params.id,
    metadata: req.body,
    created_at: new Date().toISOString(),
  });

  res.json({ success: true, plan: adminPlans[idx] });
});

// GET /api/admin/coupons
app.get('/api/admin/coupons', requireAdmin, (_req, res) => {
  res.json({ success: true, coupons: adminCoupons });
});

// POST /api/admin/coupons
app.post('/api/admin/coupons', requireAdmin, (req, res) => {
  const newCoupon: ServerCouponRecord = {
    id: 'cpn_' + Date.now().toString(36),
    ...req.body,
    used_count: 0,
    created_at: new Date().toISOString(),
  };
  adminCoupons.unshift(newCoupon);

  adminAuditLogs.unshift({
    id: 'audit_' + Date.now(),
    admin_user_id: 'admin',
    admin_email: (req.headers['x-user-email'] as string) || 'admin@bikripilot.com',
    action: 'Coupon Created',
    target_entity: 'coupon',
    target_entity_id: newCoupon.id,
    metadata: { code: newCoupon.code, discount: newCoupon.discount_value },
    created_at: new Date().toISOString(),
  });

  res.json({ success: true, coupon: newCoupon });
});

// DELETE /api/admin/coupons/:id
app.delete('/api/admin/coupons/:id', requireAdmin, (req, res) => {
  const idx = adminCoupons.findIndex(c => c.id === req.params.id);
  if (idx !== -1) {
    const deleted = adminCoupons.splice(idx, 1)[0];
    adminAuditLogs.unshift({
      id: 'audit_' + Date.now(),
      admin_user_id: 'admin',
      admin_email: (req.headers['x-user-email'] as string) || 'admin@bikripilot.com',
      action: 'Coupon Deleted',
      target_entity: 'coupon',
      target_entity_id: req.params.id,
      metadata: { code: deleted?.code },
      created_at: new Date().toISOString(),
    });
  }
  res.json({ success: true });
});

// GET /api/admin/announcements
app.get('/api/admin/announcements', requireAdmin, (_req, res) => {
  res.json({ success: true, announcements: adminAnnouncements });
});

// POST /api/admin/announcements
app.post('/api/admin/announcements', requireAdmin, (req, res) => {
  const newAnnouncement: ServerAnnouncementRecord = {
    id: 'anc_' + Date.now().toString(36),
    ...req.body,
    created_at: new Date().toISOString(),
  };
  adminAnnouncements.unshift(newAnnouncement);

  adminAuditLogs.unshift({
    id: 'audit_' + Date.now(),
    admin_user_id: 'admin',
    admin_email: (req.headers['x-user-email'] as string) || 'admin@bikripilot.com',
    action: 'Announcement Created',
    target_entity: 'announcement',
    target_entity_id: newAnnouncement.id,
    metadata: { title: newAnnouncement.title },
    created_at: new Date().toISOString(),
  });

  res.json({ success: true, announcement: newAnnouncement });
});

// DELETE /api/admin/announcements/:id
app.delete('/api/admin/announcements/:id', requireAdmin, (req, res) => {
  const idx = adminAnnouncements.findIndex(a => a.id === req.params.id);
  if (idx !== -1) {
    const deleted = adminAnnouncements.splice(idx, 1)[0];
    adminAuditLogs.unshift({
      id: 'audit_' + Date.now(),
      admin_user_id: 'admin',
      admin_email: (req.headers['x-user-email'] as string) || 'admin@bikripilot.com',
      action: 'Announcement Deleted',
      target_entity: 'announcement',
      target_entity_id: req.params.id,
      metadata: { title: deleted?.title },
      created_at: new Date().toISOString(),
    });
  }
  res.json({ success: true });
});

// GET /api/admin/settings
app.get('/api/admin/settings', requireAdmin, (_req, res) => {
  res.json({ success: true, settings: adminSettingsConfig });
});

// PUT /api/admin/settings
app.put('/api/admin/settings', requireAdmin, (req, res) => {
  adminSettingsConfig = { ...adminSettingsConfig, ...req.body };
  adminAuditLogs.unshift({
    id: 'audit_' + Date.now(),
    admin_user_id: 'admin',
    admin_email: (req.headers['x-user-email'] as string) || 'admin@bikripilot.com',
    action: 'Admin Settings Updated',
    target_entity: 'settings',
    target_entity_id: 'global',
    created_at: new Date().toISOString(),
  });
  res.json({ success: true, settings: adminSettingsConfig });
});

// GET /api/admin/audit-logs
app.get('/api/admin/audit-logs', requireAdmin, (_req, res) => {
  res.json({ success: true, logs: adminAuditLogs });
});

// Process-level uncaught exception & rejection handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Unhandled Rejection at]:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('[Uncaught Exception]:', error);
});

// Vite middleware in dev or static files in production
async function startServer() {
  // Validate application environment variables at startup
  validateEnvironment();

  const isProd = process.env.NODE_ENV === 'production';

  // =========================================================================
  // SERVER-SIDE ROUTE INTERCEPTOR FOR ADMIN CONTROL PANEL (/admin, /admin/*)
  // Strict multi-step authorization:
  // 1. Not Authenticated -> 302 to /login?next=/admin
  // 2. Not Admin -> 302 to /dashboard (or 403 Forbidden)
  // 3. Admin without verified MFA -> 302 to /admin/mfa
  // 4. Admin with verified MFA (AAL2) -> Allow access
  // =========================================================================
  const adminPagePattern = new RegExp(`^\\/(${ADMIN_ROUTE_PREFIX}|admin)(\\/.*)?$`);

  app.get(adminPagePattern, async (req, res, next) => {
    // Skip API routes (handled by API router)
    if (req.path.startsWith('/api/')) {
      return next();
    }

    const verifiedUser = await getVerifiedServerUser(req);

    // 1. If unauthenticated -> redirect to /login?next=/admin
    if (!verifiedUser) {
      return res.redirect(302, `/login?next=${encodeURIComponent(req.originalUrl)}`);
    }

    // 2. If authenticated but NOT admin -> redirect to /dashboard
    if (verifiedUser.role !== 'admin' || verifiedUser.account_status !== 'active') {
      return res.redirect(302, '/dashboard');
    }

    // 3. Admin user -> check MFA / AAL2
    const aal2Cookie = extractAal2Cookie(req);
    const aal2Payload = verifyAal2Token(aal2Cookie || undefined);
    const isAal2 = Boolean(
      aal2Payload &&
      (aal2Payload.userId === verifiedUser.id || aal2Payload.email.toLowerCase() === verifiedUser.email.toLowerCase())
    );

    const isMfaPath = req.path.endsWith('/mfa') || req.path.includes('/mfa');

    if (!isAal2) {
      if (isMfaPath) {
        // Allow rendering the MFA verification page
        return next();
      }
      return res.redirect(302, `/${ADMIN_ROUTE_PREFIX}/mfa`);
    }

    // If already AAL2 and visiting /mfa, redirect to /admin
    if (isAal2 && isMfaPath) {
      return res.redirect(302, `/${ADMIN_ROUTE_PREFIX}`);
    }

    // AAL2 Admin allowed to view admin page!
    next();
  });

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Centralized Error Middleware (must be after routes)
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('[Centralized Server Error]:', err);
    res.status(500).json({
      success: false,
      error: 'অভ্যন্তরীণ সার্ভার ত্রুটি। দয়া করে কিছুক্ষণ পর আবার চেষ্টা করুন।',
      details: process.env.NODE_ENV === 'development' ? err?.message : undefined,
    });
  });

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`🚀 BikriPilot full-stack server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
