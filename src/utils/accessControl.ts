import { Shop, SubscriptionStatus, UserProfile } from '../types';
import { getDaysRemaining, isSubscriptionExpired } from './subscriptionLimits';

export type ProtectedFeature =
  | 'dashboard_overview'
  | 'orders'
  | 'ai_capture'
  | 'new_order'
  | 'products'
  | 'customers'
  | 'profit'
  | 'invoices'
  | 'csv_export'
  | 'multi_shop';

export interface AccessCheckResult {
  hasAccess: boolean;
  status: SubscriptionStatus;
  title: string;
  message: string;
  badgeColor: string;
  isPending: boolean;
  isExpired: boolean;
  isSuspended: boolean;
  daysRemaining: number;
}

/**
 * Standard Customer Access Messages in modern, clear Bangla
 */
export const ACCESS_MESSAGES: Record<SubscriptionStatus, { title: string; message: string }> = {
  active: {
    title: 'সাবস্ক্রিপশন সক্রিয়',
    message: 'আপনার subscription active আছে। সকল ফিচার ব্যবহার করতে পারেন।',
  },
  trial: {
    title: 'ফ্রি ট্রায়াল চলছে',
    message: 'আপনার ফ্রি ট্রায়াল সক্রিয় রয়েছে। মেয়াদ শেষ হওয়ার পূর্বে রিনিউ করুন।',
  },
  pending: {
    title: 'পেমেন্ট ভেরিফিকেশন চলছে',
    message: 'আপনার payment verification চলছে। অ্যাডমিন অনুমোদনের পর প্রিমিয়াম ফিচার স্বয়ংক্রিয়ভাবে সক্রিয় হবে।',
  },
  expired: {
    title: 'সাবস্ক্রিপশন শেষ হয়েছে',
    message: 'আপনার subscription শেষ হয়েছে। পেইড ফিচার চালু করতে renew করুন।',
  },
  suspended: {
    title: 'অ্যাকাউন্ট সাসপেন্ডেড',
    message: 'আপনার account বর্তমানে suspended। অনুগ্রহ করে Support-এর সাথে যোগাযোগ করুন।',
  },
  cancelled: {
    title: 'সাবস্ক্রিপশন বাতিল',
    message: 'আপনার সাবস্ক্রিপশন বাতিল করা হয়েছে। পুনরায় সেবা পেতে নতুন প্ল্যান বেছে নিন।',
  },
};

/**
 * Computes the real-time normalized subscription status for a shop and user
 */
export function getNormalizedSubscriptionStatus(shop: Shop, user?: UserProfile): SubscriptionStatus {
  // If user account itself is suspended by Admin
  if (user?.account_status === 'suspended') {
    return 'suspended';
  }

  // Check shop subscription status
  if (shop.subscription_status === 'suspended') return 'suspended';
  if (shop.subscription_status === 'cancelled') return 'cancelled';
  if (shop.subscription_status === 'pending_approval') return 'pending';

  // Check expiry
  if (isSubscriptionExpired(shop)) {
    return 'expired';
  }

  if (shop.subscription_plan === 'free_trial') {
    return 'trial';
  }

  return 'active';
}

/**
 * Validates whether the user/shop has access to the app's protected features
 */
export function checkSubscriptionAccess(shop: Shop, user?: UserProfile): AccessCheckResult {
  const status = getNormalizedSubscriptionStatus(shop, user);
  const days = getDaysRemaining(shop);

  const isPending = status === 'pending';
  const isExpired = status === 'expired';
  const isSuspended = status === 'suspended';

  // Active or Trial with days remaining gives access
  const hasAccess = (status === 'active' || status === 'trial') && !isExpired && !isSuspended;

  let badgeColor = 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
  if (status === 'pending') badgeColor = 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
  if (status === 'expired') badgeColor = 'bg-rose-500/20 text-rose-400 border border-rose-500/30';
  if (status === 'suspended') badgeColor = 'bg-red-900/30 text-red-400 border border-red-800';

  const texts = ACCESS_MESSAGES[status] || ACCESS_MESSAGES.active;

  return {
    hasAccess,
    status,
    title: texts.title,
    message: texts.message,
    badgeColor,
    isPending,
    isExpired,
    isSuspended,
    daysRemaining: days,
  };
}

/**
 * Checks feature-level permission
 */
export function checkFeatureAccess(
  feature: ProtectedFeature,
  shop: Shop,
  user?: UserProfile
): { allowed: boolean; reason?: string } {
  // Public/free tier allowed features
  if (feature === 'dashboard_overview') {
    return { allowed: true };
  }

  const access = checkSubscriptionAccess(shop, user);

  if (!access.hasAccess) {
    return {
      allowed: false,
      reason: access.message,
    };
  }

  // Multi-shop feature check (requires Growth or standard with limit)
  if (feature === 'multi_shop' && shop.subscription_plan === 'free_trial') {
    return {
      allowed: false,
      reason: 'মাল্টি-শপ ব্যবহারের জন্য স্ট্যান্ডার্ড বা গ্রোথ প্যাকেজ প্রয়োজন।',
    };
  }

  // CSV export check
  if (feature === 'csv_export' && shop.subscription_plan === 'free_trial') {
    return {
      allowed: false,
      reason: 'কাস্টমার ও অর্ডার ডাটা CSV এক্সপোর্ট করতে পেইড প্ল্যানে আপগ্রেড করুন।',
    };
  }

  return { allowed: true };
}
