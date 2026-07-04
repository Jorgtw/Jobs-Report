import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../services/supabase';
import { SubscriptionStatus, Feature, PlanFeature, Permission } from '../types/features';
import { useCompany } from '../contexts/CompanyContext';
import { getPlanConfig, PlanCode } from '../utils/pricingConfig';
import { analyticsService } from '../services/analyticsService';

/**
 * V2 Enterprise hook for subscription and feature gating.
 * 
 * Architecture:
 *   - STATE: Read from vw_access_control (pure aggregation, no logic)
 *   - PERMISSIONS: Derived from pricingConfig.ts (config-driven, soft-gating)
 *   - PLAN FEATURES: Enriched from pricingConfig.ts (static plan metadata)
 * 
 * This frontend is fully config-driven for Phase 1.
 */
export const useSubscription = (manualCompanyId?: string | null) => {
  const { companyId: contextCompanyId, isReady } = useCompany();
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const prevPlanCodeRef = useRef<PlanCode | null>(null);

  const refreshStatus = useCallback(async () => {
    // 1. Get company context: manual override or current context state
    const companyId = manualCompanyId || contextCompanyId;
    
    // CRITICAL: Dormant state if context is not ready.
    if (!companyId || !isReady) {
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

      // 3. ENRICH: Resolve plan limits and features from the config file
      const dbPlanCode = viewData.plan_code;
      const planConfig = getPlanConfig(dbPlanCode);
      const currentUsage = viewData.current_usage || 0;

      // 4. OBSERVE: Detect plan transitions and downgrades dynamically
      const previousPlanCode = prevPlanCodeRef.current;
      if (previousPlanCode !== null && previousPlanCode !== dbPlanCode) {
        const pricingPlansList = ['free', 'starter', 'business', 'growth', 'enterprise'];
        const oldIndex = pricingPlansList.indexOf(
          previousPlanCode === 'pro' || previousPlanCode === 'premium' ? 'business' : (previousPlanCode === 'basic' ? 'starter' : previousPlanCode)
        );
        const newIndex = pricingPlansList.indexOf(
          dbPlanCode === 'pro' || dbPlanCode === 'premium' ? 'business' : (dbPlanCode === 'basic' ? 'starter' : dbPlanCode)
        );
        
        const isDowngrade = oldIndex > newIndex;
        
        analyticsService.trackPricingEvent(isDowngrade ? 'downgrade' : 'plan_change', {
          current_plan: dbPlanCode,
          previous_plan: previousPlanCode,
          source: 'database_sync'
        });
      }
      prevPlanCodeRef.current = dbPlanCode as PlanCode;

      setStatus({
        planCode: dbPlanCode as PlanCode,
        billingStatus: viewData.billing_status,
        isBillingActive: viewData.is_billing_active,
        currentPeriodEnd: viewData.current_period_end,
        currentUsage: currentUsage,
        reportsLimit: planConfig.maxReports !== null ? planConfig.maxReports : 0,
        isCommercialOverride: !!viewData.is_commercial_override,
        planFeatures: {
          compliance: planConfig.features.compliance,
          communications: planConfig.features.communications,
          multiworker: planConfig.features.multiworker,
          ai_insights: planConfig.features.ai_insights,
          advanced_roles: planConfig.features.advanced_roles,
        },
        permissions: {
          can_create_reports: planConfig.maxReports === null || currentUsage < planConfig.maxReports,
        },
      });
      setError(null);
    } catch (err) {
      console.error('Error fetching subscription status:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [manualCompanyId, contextCompanyId, isReady]);


  useEffect(() => {
    if (isReady) {
      refreshStatus();
    } else {
      setLoading(false);
      setStatus(null);
    }
  }, [refreshStatus, isReady, manualCompanyId]);

  // Realtime listener for immediate UI updates when Stripe webhook fires
  useEffect(() => {
    const companyId = manualCompanyId || contextCompanyId;
    if (!companyId || !isReady) return;

    // Listen to Stripe changes
    const entitlementsChannel = supabase
      .channel(`entitlements_${companyId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'company_entitlements', filter: `company_id=eq.${companyId}` },
        () => refreshStatus()
      )
      .subscribe();

    // Listen to Operational State (Break-Glass) changes
    const overridesChannel = supabase
      .channel(`overrides_${companyId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'company_operational_state', filter: `company_id=eq.${companyId}` },
        () => refreshStatus()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(entitlementsChannel);
      supabase.removeChannel(overridesChannel);
    };
  }, [manualCompanyId, contextCompanyId, isReady, refreshStatus]);

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
