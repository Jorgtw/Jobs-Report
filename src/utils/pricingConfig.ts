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
    maxProjects: 1,
    maxReports: 50, // standard free limit
    description: 'Entry test per valutare il prodotto in cantiere',
    features_list: [
      'Fino a 5 utenti inclusi',
      'Progetti e rapportini base',
      'Nessuna funzionalità AI',
      'Non include Rapportino con Foto/Firma',
      'Non include Comunicazioni interne'
    ],
    color_theme: 'slate',
    is_popular: false,
    features: {
      compliance: false,
      communications: false,
      multiworker: false,
      ai_insights: false,
      advanced_roles: false,
      sso: false,
      white_label: false
    }
  },
  starter: {
    code: 'starter',
    name: 'Starter',
    priceMonthly: 39,
    priceYearly: 31, // equivalent per month when paid yearly
    stripePriceIdMonthly: 'price_1TcUsRQL4s145ccHKvia2EMG',
    stripePriceIdYearly: 'price_starter_yearly_placeholder',
    maxUsers: 10,
    maxProjects: null, // unlimited
    maxReports: null,  // unlimited
    description: 'Ideale per micro-imprese e artigiani in crescita',
    features_list: [
      'Fino a 10 utenti inclusi',
      'Progetti e rapportini illimitati',
      'Tracking ore e spese completo',
      'Esportazioni base PDF/Excel',
      'App mobile PWA + Web',
      'Non include Rapportino con Foto/Firma',
      'Non include Comunicazioni interne'
    ],
    color_theme: 'blue',
    is_popular: false,
    features: {
      compliance: false,
      communications: false,
      multiworker: true,
      ai_insights: false,
      advanced_roles: false,
      sso: false,
      white_label: false
    }
  },
  business: {
    code: 'business',
    name: 'Business',
    priceMonthly: 119,
    priceYearly: 95,
    stripePriceIdMonthly: 'price_1TcV2XQL4s145ccH4HDSiFL3',
    stripePriceIdYearly: 'price_business_yearly_placeholder',
    maxUsers: 50,
    maxProjects: null,
    maxReports: null,
    description: 'Il cuore di Jobs-Report per PMI strutturate edili e di servizi',
    features_list: [
      'Fino a 50 utenti inclusi',
      'Tutto quello presente in Starter',
      'Include Rapportino con Foto e Firma',
      'Include Comunicazioni interne',
      'AI insights e report automatici',
      'Analisi avanzata costi e ricavi'
    ],
    color_theme: 'emerald',
    is_popular: true,
    features: {
      compliance: true,
      communications: true,
      multiworker: true,
      ai_insights: true,
      advanced_roles: false,
      sso: false,
      white_label: false
    }
  },
  growth: {
    code: 'growth',
    name: 'Growth',
    priceMonthly: 299,
    priceYearly: 239,
    stripePriceIdMonthly: 'price_1TcV5wQL4s145ccHKMOV2i9G',
    stripePriceIdYearly: 'price_growth_yearly_placeholder',
    maxUsers: 150,
    maxProjects: null,
    maxReports: null,
    description: 'Per aziende strutturate che necessitano di controllo totale',
    features_list: [
      'Fino a 150 utenti inclusi',
      'Tutto quello presente in Business',
      'Include Rapportino con Foto e Firma',
      'Include Comunicazioni interne',
      'Ruoli avanzati (Admin / Supervisor / Worker)',
      'Performance analytics di cantiere'
    ],
    color_theme: 'purple',
    is_popular: false,
    features: {
      compliance: true,
      communications: true,
      multiworker: true,
      ai_insights: true,
      advanced_roles: true,
      sso: false,
      white_label: false
    }
  },
  enterprise: {
    code: 'enterprise',
    name: 'Enterprise',
    priceMonthly: 0, // precio su richiesta, handled visually as custom text
    priceYearly: 0,
    stripePriceIdMonthly: 'price_enterprise_monthly_placeholder',
    stripePriceIdYearly: 'price_enterprise_yearly_placeholder',
    maxUsers: 9999, // unlimited
    maxProjects: null,
    maxReports: null,
    description: 'Soluzione personalizzata senza limiti di crescita',
    features_list: [
      'Utenti illimitati',
      'Personalizzazione avanzata',
      'Calendario',
      'Avanzamento dei lavori',
      'Accesso API (Prossima versione)',
      'Single Sign-On (SSO / SAML)',
      'Opzione White-Label (tuo logo e dominio)'
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
