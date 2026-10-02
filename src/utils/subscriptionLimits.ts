import { Shop, SubscriptionPlanId } from '../types';
import { SUBSCRIPTION_PLANS } from '../config/plans';

export interface PlanLimitsConfig {
  planId: SubscriptionPlanId;
  name: string;
  nameBn: string;
  priceBDT: number;
  monthlyAILimit: number;
  maxProducts: number;
  maxShops: number;
  allowCsvExport: boolean;
  allowAdvancedAnalytics: boolean;
  allowCustomLogo: boolean;
  allowPrioritySupport: boolean;
}

export const PLAN_LIMITS_CONFIG: Record<SubscriptionPlanId, PlanLimitsConfig> = {
  free_trial: {
    planId: 'free_trial',
    name: 'Free Trial',
    nameBn: 'ফ্রি ট্রায়াল (১৪ দিন)',
    priceBDT: 0,
    monthlyAILimit: 50,
    maxProducts: 25,
    maxShops: 1,
    allowCsvExport: false,
    allowAdvancedAnalytics: false,
    allowCustomLogo: false,
    allowPrioritySupport: false,
  },
  founder: {
    planId: 'founder',
    name: 'Founder Deal',
    nameBn: 'ফাউন্ডার মেম্বারশিপ',
    priceBDT: 99,
    monthlyAILimit: 300,
    maxProducts: 150,
    maxShops: 1,
    allowCsvExport: true,
    allowAdvancedAnalytics: true,
    allowCustomLogo: true,
    allowPrioritySupport: true,
  },
  standard: {
    planId: 'standard',
    name: 'Standard Pack',
    nameBn: 'স্ট্যান্ডার্ড প্যাক',
    priceBDT: 249,
    monthlyAILimit: 800,
    maxProducts: 500,
    maxShops: 2,
    allowCsvExport: true,
    allowAdvancedAnalytics: true,
    allowCustomLogo: true,
    allowPrioritySupport: true,
  },
  growth: {
    planId: 'growth',
    name: 'Growth Pro',
    nameBn: 'গ্রোথ প্রো প্যাক',
    priceBDT: 499,
    monthlyAILimit: 3000,
    maxProducts: 5000,
    maxShops: 10,
    allowCsvExport: true,
    allowAdvancedAnalytics: true,
    allowCustomLogo: true,
    allowPrioritySupport: true,
  },
};

/**
 * Returns configuration for a shop's plan
 */
export function getPlanLimits(planId: SubscriptionPlanId = 'free_trial'): PlanLimitsConfig {
  return PLAN_LIMITS_CONFIG[planId] || PLAN_LIMITS_CONFIG.free_trial;
}

/**
 * Checks if subscription is expired
 */
export function isSubscriptionExpired(shop: Shop): boolean {
  if (shop.subscription_status === 'expired') return true;
  if (!shop.subscription_expires_at) return false;
  return new Date(shop.subscription_expires_at).getTime() < Date.now();
}

/**
 * Returns days remaining until subscription expires
 */
export function getDaysRemaining(shop: Shop): number {
  if (!shop.subscription_expires_at) return 0;
  const diffMs = new Date(shop.subscription_expires_at).getTime() - Date.now();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

/**
 * Validates AI order capture quota
 */
export function checkAILimit(shop: Shop, monthlyUsageCount: number): {
  isLimitReached: boolean;
  used: number;
  max: number;
  remaining: number;
  percentage: number;
} {
  const limits = getPlanLimits(shop.subscription_plan);
  const max = limits.monthlyAILimit;
  const isLimitReached = monthlyUsageCount >= max && max < 9999;
  const remaining = Math.max(0, max - monthlyUsageCount);
  const percentage = Math.min(100, Math.round((monthlyUsageCount / max) * 100));

  return {
    isLimitReached,
    used: monthlyUsageCount,
    max,
    remaining,
    percentage,
  };
}

/**
 * Validates product creation limit
 */
export function checkProductLimit(shop: Shop, currentProductCount: number): {
  isLimitReached: boolean;
  currentCount: number;
  maxAllowed: number;
} {
  const limits = getPlanLimits(shop.subscription_plan);
  const maxAllowed = limits.maxProducts;
  return {
    isLimitReached: currentProductCount >= maxAllowed,
    currentCount: currentProductCount,
    maxAllowed,
  };
}

/**
 * Validates multi-shop creation limit
 */
export function checkShopLimit(shop: Shop, userTotalShopsCount: number): {
  canCreateShop: boolean;
  currentCount: number;
  maxAllowed: number;
} {
  const limits = getPlanLimits(shop.subscription_plan);
  const maxAllowed = limits.maxShops;
  return {
    canCreateShop: userTotalShopsCount < maxAllowed,
    currentCount: userTotalShopsCount,
    maxAllowed,
  };
}
