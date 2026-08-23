export const PRICING_VERSION = 'v1-2026-05';

export type PlanCode = 'free' | 'starter' | 'business' | 'growth' | 'enterprise' | 'basic' | 'premium' | 'pro';

export interface PricingPlan {
  code: PlanCode;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  stripePriceIdMonthly: string | null;
  stripePriceIdYearly: string | null;
  maxUsers: number;
  maxProjects: number | null; // null = unlimited
  maxReports: number | null;  // null = unlimited
  description: string;
  features_list: string[];
  color_theme: string;
  is_popular: boolean;
  features: {
    compliance: boolean;
    communications: boolean;
    multiworker: boolean;
    ai_insights: boolean;
    advanced_roles: boolean;
    sso: boolean;
    white_label: boolean;
  };
}

export const PRICING_PLANS: Record<string, PricingPlan> = {
  free: {
    code: 'free',
    name: 'Free',
    priceMonthly: 0,
    priceYearly: 0,
    stripePriceIdMonthly: null,
    stripePriceIdYearly: null,
    maxUsers: 5,
    maxProjects: null,
    maxReports: null,
    description: 'Ideale per micro-squadre e professionisti indipendenti',
    features_list: [
      'Fino a 5 utenti inclusi',
      'Tutte le funzionalità operative incluse',
      'Progetti e rapportini illimitati',
      'Rapporti Intervento con Foto e Firma',
      'Comunicazioni interne',
      'Export PDF ed Excel'
    ],
    color_theme: 'slate',
    is_popular: false,
    features: {
      compliance: true,
      communications: true,
      multiworker: true,
      ai_insights: true,
      advanced_roles: true,
      sso: true,
      white_label: true
    }
  },
  starter: {
    code: 'starter',
    name: 'Starter',
    priceMonthly: 39,
    priceYearly: 32.50, // 390 / 12
    stripePriceIdMonthly: 'price_1TcUsRQL4s145ccHKvia2EMG',
    stripePriceIdYearly: 'price_1TiAiXQL4s145ccHAMmazaPS',
    maxUsers: 10,
    maxProjects: null,
    maxReports: null,
    description: 'Ideale per piccole imprese e squadre fino a 10 persone',
    features_list: [
      'Fino a 10 utenti inclusi',
      'Tutte le funzionalità operative incluse',
      'Progetti e rapportini illimitati',
      'Rapporti Intervento con Foto e Firma',
      'Comunicazioni interne',
      'Export PDF ed Excel'
    ],
    color_theme: 'blue',
    is_popular: false,
    features: {
      compliance: true,
      communications: true,
      multiworker: true,
      ai_insights: true,
      advanced_roles: true,
      sso: true,
      white_label: true
    }
  },
  business: {
    code: 'business',
    name: 'Business',
    priceMonthly: 119,
    priceYearly: 99, // 1188 / 12
    stripePriceIdMonthly: 'price_1TcV2XQL4s145ccH4HDSiFL3',
    stripePriceIdYearly: 'price_1TiB2JQL4s145ccHy6agWlVL',
    maxUsers: 50,
    maxProjects: null,
    maxReports: null,
    description: 'La soluzione perfetta per PMI e imprese strutturate fino a 50 persone',
    features_list: [
      'Fino a 50 utenti inclusi',
      'Tutte le funzionalità operative incluse',
      'Progetti e rapportini illimitati',
      'Rapporti Intervento con Foto e Firma',
      'Comunicazioni interne',
      'Export PDF ed Excel'
    ],
    color_theme: 'emerald',
    is_popular: true,
    features: {
      compliance: true,
      communications: true,
      multiworker: true,
      ai_insights: true,
      advanced_roles: true,
      sso: true,
      white_label: true
    }
  },
  growth: {
    code: 'growth',
    name: 'Growth',
    priceMonthly: 299,
    priceYearly: 249, // 2988 / 12
    stripePriceIdMonthly: 'price_1TcV5wQL4s145ccHKMOV2i9G',
    stripePriceIdYearly: 'price_1TiB8FQL4s145ccHR00pxR76',
    maxUsers: 150,
    maxProjects: null,
    maxReports: null,
    description: 'Per aziende in forte espansione fino a 150 persone',
    features_list: [
      'Fino a 150 utenti inclusi',
      'Tutte le funzionalità operative incluse',
      'Progetti e rapportini illimitati',
      'Rapporti Intervento con Foto e Firma',
      'Comunicazioni interne',
      'Export PDF ed Excel'
    ],
    color_theme: 'purple',
    is_popular: false,
    features: {
      compliance: true,
      communications: true,
      multiworker: true,
      ai_insights: true,
      advanced_roles: true,
      sso: true,
      white_label: true
    }
  },
  enterprise: {
    code: 'enterprise',
    name: 'Enterprise',
    priceMonthly: 0,
    priceYearly: 0,
    stripePriceIdMonthly: 'price_enterprise_monthly_placeholder',
    stripePriceIdYearly: 'price_enterprise_yearly_placeholder',
    maxUsers: 9999, // oltre 150 / illimitato
    maxProjects: null,
    maxReports: null,
    description: 'Soluzione personalizzata per grandi organizzazioni oltre 150 persone',
    features_list: [
      'Oltre 150 utenti (illimitati)',
      'Tutte le funzionalità operative incluse',
      'Progetti e rapportini illimitati',
      'Supporto prioritario e onboarding dedicato',
      'Personalizzazioni su richiesta'
    ],
    color_theme: 'slate',
    is_popular: false,
    features: {
      compliance: true,
      communications: true,
      multiworker: true,
      ai_insights: true,
      advanced_roles: true,
      sso: true,
      white_label: true
    }
  }
};

// Aliases for backward compatibility with database states
export const PLAN_ALIASES: Record<string, string> = {
  pro: 'business',
  premium: 'business',
  basic: 'starter',
  free: 'free'
};

/**
 * Returns the pricing configuration for a given plan code,
 * resolving aliases automatically to guarantee backwards compatibility.
 */
export function getPlanConfig(code: string | null | undefined): PricingPlan {
  const normalized = (code || 'free').toLowerCase();
  const targetCode = PLAN_ALIASES[normalized] || normalized;
  return PRICING_PLANS[targetCode] || PRICING_PLANS.free;
}
