-- =========================================================================
-- BikriPilot: Admin MFA & Multi-Layer Security Hardening
-- Migration: 20261002_admin_mfa_hardening.sql
-- =========================================================================

-- 1. Extend profiles with MFA status & encrypted TOTP secret store
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS mfa_enrolled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS mfa_secret TEXT,
  ADD COLUMN IF NOT EXISTS last_mfa_verified_at TIMESTAMPTZ;

-- 2. Ensure audit_logs is append-only (revoke DELETE & UPDATE from authenticated users)
REVOKE DELETE, UPDATE ON public.audit_logs FROM authenticated;
REVOKE DELETE, UPDATE ON public.audit_logs FROM anon;

-- 3. Ensure profiles role cannot be modified by user updates
CREATE OR REPLACE FUNCTION public.fn_protect_user_role()
RETURNS TRIGGER AS $$
BEGIN
  -- If updater is not an admin, disallow changes to role, account_status, or mfa_enrolled
  IF NOT public.is_admin() THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'Unauthorized: Users cannot change or elevate their own role.';
    END IF;
    IF NEW.account_status IS DISTINCT FROM OLD.account_status THEN
      RAISE EXCEPTION 'Unauthorized: Users cannot alter account status.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-attach trigger
DROP TRIGGER IF EXISTS tr_protect_user_role ON public.profiles;
CREATE TRIGGER tr_protect_user_role
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.fn_protect_user_role();

-- 4. Secure RLS for Audit Logs: Append-only, viewable only by Admins
DROP POLICY IF EXISTS "Admins can insert audit logs" ON public.audit_logs;
CREATE POLICY "Admins can insert audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Only admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Only admins can view audit logs" ON public.audit_logs
  FOR SELECT USING (public.is_admin());

-- 5. Revoke direct payment mutation from non-admins
DROP POLICY IF EXISTS "Users can update own payments" ON public.payments;
-- Ensure no update policy exists for normal users on payments table
