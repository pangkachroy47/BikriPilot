import crypto from 'crypto';
import express from 'express';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Server-side environment variables (Strictly server-only - NEVER exposed to browser)
export const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';

// Primary modern keys with backward compatibility fallbacks
export const SUPABASE_SECRET_KEY =
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const SUPABASE_PUBLISHABLE_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

export const ADMIN_SECRET_KEY =
  process.env.ADMIN_SECRET_KEY || 'bikripilot_admin_secret_2026';

export const SESSION_SECRET =
  process.env.SESSION_SECRET || ADMIN_SECRET_KEY || 'bikripilot_secure_session_secret_2026_x7a9';

export const ADMIN_ROUTE_PREFIX =
  process.env.ADMIN_ROUTE_PREFIX || 'admin';

// Initialize server-side Supabase client (using privileged secret key for backend tasks)
export const serverSupabase: SupabaseClient | null =
  SUPABASE_URL && (SUPABASE_SECRET_KEY || SUPABASE_PUBLISHABLE_KEY)
    ? createClient(SUPABASE_URL, SUPABASE_SECRET_KEY || SUPABASE_PUBLISHABLE_KEY, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      })
    : null;

/**
 * Validates application environment variables at startup.
 * Logs presence and configuration status without ever leaking raw secret values.
 */
export function validateEnvironment(): { isValid: boolean; issues: string[] } {
  const issues: string[] = [];
  const mask = (val: string | undefined): string => {
    if (!val) return '[NOT CONFIGURED]';
    if (val.length <= 8) return '********';
    return `${val.substring(0, 3)}...${val.substring(val.length - 3)} (length: ${val.length})`;
  };

  console.log('\n======================================================');
  console.log('🔍 BikriPilot Security & Environment Validation Report');
  console.log('======================================================');

  // 1. VITE_SUPABASE_URL (Required)
  if (!SUPABASE_URL) {
    issues.push('VITE_SUPABASE_URL is REQUIRED but not set. Running in self-contained sandbox mode.');
    console.warn('⚠️  VITE_SUPABASE_URL:              [REQUIRED - NOT CONFIGURED] (Sandbox Mode Active)');
  } else {
    console.log(`✅ VITE_SUPABASE_URL:              ${SUPABASE_URL}`);
  }

  // 2. VITE_SUPABASE_PUBLISHABLE_KEY (Required)
  if (!SUPABASE_PUBLISHABLE_KEY) {
    issues.push('VITE_SUPABASE_PUBLISHABLE_KEY is REQUIRED but not set (legacy VITE_SUPABASE_ANON_KEY also absent).');
    console.warn('⚠️  VITE_SUPABASE_PUBLISHABLE_KEY: [REQUIRED - NOT CONFIGURED] (Sandbox Mode Active)');
  } else {
    const isLegacy = !process.env.VITE_SUPABASE_PUBLISHABLE_KEY && Boolean(process.env.VITE_SUPABASE_ANON_KEY);
    console.log(`✅ VITE_SUPABASE_PUBLISHABLE_KEY: ${mask(SUPABASE_PUBLISHABLE_KEY)} ${isLegacy ? '(via legacy VITE_SUPABASE_ANON_KEY fallback)' : ''}`);
  }

  // 3. SUPABASE_SECRET_KEY (Required for server-side privileged operations)
  if (!SUPABASE_SECRET_KEY) {
    issues.push('SUPABASE_SECRET_KEY is REQUIRED for server-side privileged operations (legacy SUPABASE_SERVICE_ROLE_KEY also absent).');
    console.warn('⚠️  SUPABASE_SECRET_KEY:          [REQUIRED FOR SERVER DB - NOT CONFIGURED]');
  } else {
    const isLegacy = !process.env.SUPABASE_SECRET_KEY && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
    console.log(`✅ SUPABASE_SECRET_KEY:          ${mask(SUPABASE_SECRET_KEY)} (Server-only) ${isLegacy ? '(via legacy SUPABASE_SERVICE_ROLE_KEY fallback)' : ''}`);
  }

  // 4. ADMIN_SECRET_KEY (Required)
  if (!process.env.ADMIN_SECRET_KEY) {
    issues.push('ADMIN_SECRET_KEY is REQUIRED for server admin authorization. (Using built-in development fallback)');
    console.warn(`⚠️  ADMIN_SECRET_KEY:              [REQUIRED - MISSING] Dev fallback active: ${mask(ADMIN_SECRET_KEY)}`);
  } else {
    console.log(`✅ ADMIN_SECRET_KEY:              ${mask(ADMIN_SECRET_KEY)} (Server-only)`);
  }

  // 5. SESSION_SECRET (Required)
  if (!process.env.SESSION_SECRET) {
    issues.push('SESSION_SECRET is REQUIRED for cryptographic AAL2 session signing. (Derived from ADMIN_SECRET_KEY)');
    console.warn(`⚠️  SESSION_SECRET:                 [REQUIRED - MISSING] Derived from ADMIN_SECRET_KEY: ${mask(SESSION_SECRET)}`);
  } else {
    console.log(`✅ SESSION_SECRET:                 ${mask(SESSION_SECRET)} (Server-only)`);
  }

  // 6. ADMIN_ROUTE_PREFIX (Server-side configurable)
  console.log(`✅ ADMIN_ROUTE_PREFIX:             /${ADMIN_ROUTE_PREFIX} (Server-side configurable)`);
  console.log('======================================================\n');

  return {
    isValid: issues.length === 0,
    issues,
  };
}

// =========================================================================
// 1. BASE32 & RFC 6238 TOTP ENGINE (Fully self-contained, no external deps)
// =========================================================================
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function generateBase32Secret(length = 20): string {
  const randomBytes = crypto.randomBytes(length);
  let secret = '';
  for (let i = 0; i < randomBytes.length; i++) {
    secret += BASE32_ALPHABET[randomBytes[i] % 32];
  }
  return secret;
}

export function base32ToBuffer(base32: string): Buffer {
  const cleaned = base32.toUpperCase().replace(/=+$/, '').replace(/\s+/g, '');
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < cleaned.length; i++) {
    const val = BASE32_ALPHABET.indexOf(cleaned[i]);
    if (val === -1) continue;
    value = (value << 5) | val;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

/**
 * Computes RFC 6238 TOTP code for a given timestamp and secret
 */
export function generateTotpCode(secretBase32: string, timeStepWindow = 30, forTime = Date.now()): string {
  const epoch = Math.floor(forTime / 1000);
  const timeStep = Math.floor(epoch / timeStepWindow);

  // 8-byte big-endian time buffer
  const timeBuffer = Buffer.alloc(8);
  timeBuffer.writeBigInt64BE(BigInt(timeStep), 0);

  const keyBuffer = base32ToBuffer(secretBase32);
  const hmac = crypto.createHmac('sha1', keyBuffer);
  hmac.update(timeBuffer);
  const hash = hmac.digest();

  // Dynamic truncation
  const offset = hash[hash.length - 1] & 0x0f;
  const binary =
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff);

  const otp = binary % 1000000;
  return otp.toString().padStart(6, '0');
}

/**
 * Verifies a 6-digit TOTP code allowing ±1 timestep clock drift (90-second total validity)
 */
export function verifyTotpCode(secretBase32: string, userCode: string): boolean {
  if (!userCode || userCode.trim().length !== 6) return false;
  const cleanedCode = userCode.trim();

  // Test current timestep, previous timestep, and next timestep
  const now = Date.now();
  const timeSteps = [now, now - 30000, now + 30000];

  for (const time of timeSteps) {
    const validCode = generateTotpCode(secretBase32, 30, time);
    if (crypto.timingSafeEqual(Buffer.from(validCode), Buffer.from(cleanedCode))) {
      return true;
    }
  }
  return false;
}

/**
 * Generates an SVG representation of a TOTP QR matrix / visual code
 */
export function generateTotpOtpauthUri(secret: string, email: string, issuer = 'BikriPilot'): string {
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedEmail = encodeURIComponent(email);
  return `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}

// =========================================================================
// 2. CRYPTOGRAPHIC SESSION & AAL2 TOKEN ENGINE
// =========================================================================
export interface AdminSessionPayload {
  userId: string;
  email: string;
  role: 'admin';
  aal: 'aal2';
  issuedAt: number;
  expiresAt: number;
}

/**
 * Creates a tamper-proof signed AAL2 session token
 */
export function createAal2Token(userId: string, email: string, durationSeconds = 7200): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: AdminSessionPayload = {
    userId,
    email,
    role: 'admin',
    aal: 'aal2',
    issuedAt: now,
    expiresAt: now + durationSeconds,
  };

  const dataStr = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(dataStr)
    .digest('base64url');

  return `${dataStr}.${signature}`;
}

/**
 * Validates and decodes an AAL2 session token
 */
export function verifyAal2Token(token: string | undefined): AdminSessionPayload | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [dataStr, signature] = parts;
  const expectedSig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(dataStr)
    .digest('base64url');

  if (signature.length !== expectedSig.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
    return null;
  }

  try {
    const payload: AdminSessionPayload = JSON.parse(
      Buffer.from(dataStr, 'base64url').toString('utf8')
    );
    const now = Math.floor(Date.now() / 1000);
    if (payload.expiresAt < now) {
      return null; // Expired
    }
    if (payload.role !== 'admin' || payload.aal !== 'aal2') {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

// =========================================================================
// 3. IN-MEMORY RATE LIMITING FOR SENSITIVE SECURITY ACTIONS
// =========================================================================
interface RateLimitEntry {
  attempts: number;
  firstAttempt: number;
  lockedUntil?: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export function checkRateLimit(key: string, maxAttempts = 5, windowMs = 900000, lockoutMs = 900000): {
  allowed: boolean;
  remainingAttempts: number;
  lockedSeconds: number;
} {
  const now = Date.now();
  const entry = rateLimitStore.get(key) || { attempts: 0, firstAttempt: now };

  // If locked
  if (entry.lockedUntil && entry.lockedUntil > now) {
    return {
      allowed: false,
      remainingAttempts: 0,
      lockedSeconds: Math.ceil((entry.lockedUntil - now) / 1000),
    };
  }

  // If window expired, reset
  if (now - entry.firstAttempt > windowMs) {
    entry.attempts = 0;
    entry.firstAttempt = now;
    delete entry.lockedUntil;
  }

  entry.attempts += 1;

  if (entry.attempts > maxAttempts) {
    entry.lockedUntil = now + lockoutMs;
    rateLimitStore.set(key, entry);
    return {
      allowed: false,
      remainingAttempts: 0,
      lockedSeconds: Math.ceil(lockoutMs / 1000),
    };
  }

  rateLimitStore.set(key, entry);
  return {
    allowed: true,
    remainingAttempts: maxAttempts - entry.attempts,
    lockedSeconds: 0,
  };
}

export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
}

// =========================================================================
// 4. TOTP SECRETS STORE FOR VERIFIED ADMINS
// =========================================================================
// Default TOTP seed for master admin (consistent across restarts, can be rotated)
const DEFAULT_ADMIN_TOTP_SECRET = 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP'; // Base32 test secret

export const adminTotpSecrets = new Map<string, string>([
  ['admin_master', DEFAULT_ADMIN_TOTP_SECRET],
  ['admin@bikripilot.com', DEFAULT_ADMIN_TOTP_SECRET],
]);

export function getAdminTotpSecret(identifier: string): string {
  const cleanId = identifier.trim().toLowerCase();
  let secret = adminTotpSecrets.get(cleanId);
  if (!secret) {
    secret = generateBase32Secret(20);
    adminTotpSecrets.set(cleanId, secret);
  }
  return secret;
}

export function setAdminTotpSecret(identifier: string, secret: string): void {
  adminTotpSecrets.set(identifier.trim().toLowerCase(), secret.trim());
}

// =========================================================================
// 5. EXTRACT TOKEN HELPER (Bearer or Cookie)
// =========================================================================
export function extractAuthToken(req: express.Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }

  const cookieToken =
    req.cookies?.['bikripilot_admin_session'] ||
    req.cookies?.['sb-access-token'] ||
    req.cookies?.['admin_auth_token'];

  if (cookieToken) return cookieToken;

  return null;
}

export function extractAal2Cookie(req: express.Request): string | null {
  return (
    req.cookies?.['bikripilot_admin_aal2'] ||
    (req.headers['x-admin-aal2'] as string) ||
    null
  );
}
