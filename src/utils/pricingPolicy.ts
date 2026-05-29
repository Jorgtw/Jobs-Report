import { getPlanConfig } from './pricingConfig';

export interface PlanLimitCheck {
  allowed: boolean;
  current: number;
  limit: number | null;
  message: string | null;
}

/**
 * Pricing Policy Engine (Soft-Gating)
 * Centralizes all pricing limit checks and feature gates.
 * Avoids scattered business logic inside React components.
 */
export const pricingPolicy = {
  /**
   * Checks if the company can add another worker/user.
   */
  checkUserLimit(planCode: string | null | undefined, currentUsersCount: number): PlanLimitCheck {
    const config = getPlanConfig(planCode);
    const limit = config.maxUsers;
    const allowed = currentUsersCount < limit;

    return {
      allowed,
      current: currentUsersCount,
      limit,
      message: allowed
        ? null
        : `Hai raggiunto il limite massimo di ${limit} dipendenti per il piano ${config.name}.`
    };
  },

  /**
   * Checks if the company can add another project.
   */
  checkProjectLimit(planCode: string | null | undefined, currentProjectsCount: number): PlanLimitCheck {
    const config = getPlanConfig(planCode);
    const limit = config.maxProjects;
    const allowed = limit === null || currentProjectsCount < limit;

    return {
      allowed,
      current: currentProjectsCount,
      limit,
      message: allowed
        ? null
        : `Hai raggiunto il limite massimo di ${limit} progetto attivo per il piano ${config.name}.`
    };
  },

  /**
   * Checks if the company can create another report/rapportino (e.g. for Free tier limit).
   */
  checkReportLimit(planCode: string | null | undefined, currentReportsCount: number): PlanLimitCheck {
    const config = getPlanConfig(planCode);
    const limit = config.maxReports;
    const allowed = limit === null || currentReportsCount < limit;

    return {
      allowed,
      current: currentReportsCount,
      limit,
      message: allowed
        ? null
        : `Hai raggiunto il limite massimo di ${limit} rapportini per il piano ${config.name}.`
    };
  },

  /**
   * Checks if a specific feature is enabled in the plan.
   */
  hasFeature(
    planCode: string | null | undefined,
    feature: 'compliance' | 'communications' | 'multiworker' | 'ai_insights' | 'advanced_roles' | 'sso' | 'white_label'
  ): boolean {
    const config = getPlanConfig(planCode);
    return !!config.features[feature];
  }
};
