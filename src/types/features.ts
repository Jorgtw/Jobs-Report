// === PLAN FEATURES (static, from plans catalog) ===
export type PlanFeature = 'compliance' | 'communications' | 'multiworker' | 'ai_insights' | 'advanced_roles';

// === PERMISSIONS (dynamic, from policy RPCs) ===
export type Permission = 'can_create_reports';

// Combined type for hasFeature() convenience
export type Feature = PlanFeature | Permission;

export type BillingStatus = 'free' | 'active' | 'trialing' | 'past_due' | 'canceled';
export type PlanCode = 'free' | 'starter' | 'business' | 'growth' | 'enterprise' | 'basic' | 'premium' | 'pro';

export interface SubscriptionStatus {
  // --- Display State (from vw_access_control) ---
  planCode: PlanCode;
  billingStatus: BillingStatus;
  isBillingActive: boolean;
  currentPeriodEnd?: string;
  currentUsage: number;
  reportsLimit: number;
  isCommercialOverride?: boolean;

  // --- Plan Features (static, what the plan INCLUDES) ---
  planFeatures: Record<PlanFeature, boolean>;

  // --- Permissions (dynamic, what the company CAN DO right now) ---
  permissions: Record<Permission, boolean>;
}

