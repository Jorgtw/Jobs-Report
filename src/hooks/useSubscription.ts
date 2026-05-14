import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { db } from '../services/dbService';
import { SubscriptionStatus, Feature, PlanFeature, Permission } from '../types/features';

/**
 * V2 Enterprise hook for subscription and feature gating.
 * 
 * Architecture:
 *   - STATE: Read from vw_access_control (pure aggregation, no logic)
 *   - PERMISSIONS: Read from policy RPC (can_company_create_report)
 *   - PLAN FEATURES: Derived from view data (static plan metadata)
 *   - ENFORCEMENT: Handled by RLS on the reports table (database-level)
 * 
 * The frontend is a pure consumer — zero business logic here.
 */
export const useSubscription = (manualCompanyId?: string) => {
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const refreshStatus = useCallback(async () => {
    // 1. Get company context: manual override or current DB state
    const companyId = manualCompanyId || db.getCompanyIdSafe();
    
    if (!companyId) {
      setLoading(false);
      setStatus(null);
      return;
    }

    setLoading(true);
    try {
      // 2. STATE: Read from the aggregation view
      const { data: viewData, error: viewError } = await supabase
        .from('vw_access_control')
        .select('*')
        .eq('company_id', companyId)
        .maybeSingle();

      if (viewError) throw viewError;
      if (!viewData) {
        setStatus(null);
        return;
      }

      // 3. PERMISSION: Only the runtime policy decision (single RPC)
      const { data: canCreate } = await supabase
        .rpc('can_company_create_report', { p_company_id: companyId });

      setStatus({
        planCode: viewData.plan_code,
        billingStatus: viewData.billing_status,
        isBillingActive: viewData.is_billing_active,
        currentPeriodEnd: viewData.current_period_end,
        currentUsage: viewData.current_usage,
        reportsLimit: viewData.reports_limit,
        planFeatures: {
          compliance: viewData.has_compliance ?? false,
          communications: viewData.has_communications ?? false,
          multiworker: viewData.has_multiworker ?? false,
        },
        permissions: {
          can_create_reports: canCreate ?? false,
        },
      });
      setError(null);
    } catch (err) {
      console.error('Error fetching subscription status:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [manualCompanyId]);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus, manualCompanyId]);

  /**
   * Universal feature check. Derives answer from the correct source:
   *   - PlanFeature → from planFeatures (static plan metadata)
   *   - Permission  → from permissions (dynamic policy RPC)
   * 
   * No duplicate state — single source of truth per domain.
   */
  const hasFeature = useCallback((feature: Feature): boolean => {
    if (!status) return false;

    if (feature in status.planFeatures) {
      return status.planFeatures[feature as PlanFeature];
    }
    if (feature in status.permissions) {
      return status.permissions[feature as Permission];
    }
    return false;
  }, [status]);

  return { 
    status, 
    loading, 
    error, 
    hasFeature, 
    refreshStatus,
    isLimitReached: status !== null && status.reportsLimit > 0 && status.currentUsage >= status.reportsLimit,
  };
};
