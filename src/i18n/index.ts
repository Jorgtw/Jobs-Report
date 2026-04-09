import { common as itCommon } from './it/common';
import { auth as itAuth } from './it/auth';
import { legacy as itLegacy } from './it/legacy';
import { communications as itCommunications } from './it/communications';
import { projects as itProjects } from './it/projects';
import { reports as itReports } from './it/reports';
import { dashboard as itDashboard } from './it/dashboard';
import { landing as itLanding } from './it/landing';
import { help as itHelp } from './it/help';
import { translations } from '../translations';

export type Language = 'it' | 'en' | 'es' | 'pl' | 'tr' | 'da';

/**
 * Base structure using Italian modules.
 */
export const baseIT = {
  common: itCommon,
  auth: itAuth,
  legacy: itLegacy,
  communications: itCommunications,
  projects: itProjects,
  reports: itReports,
  dashboard: itDashboard,
  landing: itLanding,
  help: itHelp,
};

// --- TypeScript Magic for Dot Notation ---
export type TranslationKey = 
  | `common.${keyof typeof itCommon & string}` 
  | `auth.${keyof typeof itAuth & string}`
  | `communications.${keyof typeof itCommunications & string}`
  | `projects.${keyof typeof itProjects & string}`
  | `reports.${keyof typeof itReports & string}` 
  | `dashboard.${keyof typeof itDashboard & string}`
  | `landing.${keyof typeof itLanding & string}`
  | `help.${keyof typeof itHelp & string}`
  | string; 

/**
 * Central translation catalog (Bridge Mode).
 * Other languages inherit the module structure but keep their legacy keys.
 */
export const allTranslations: Record<Language, any> = {
  it: baseIT,
  en: { ...baseIT, legacy: translations.en },
  es: { ...baseIT, legacy: translations.es },
  pl: { ...baseIT, legacy: translations.pl },
  tr: { ...baseIT, legacy: translations.tr },
  da: { ...baseIT, legacy: translations.da },
};

/**
 * Universally resolves a translation key.
 * 1. Checks new modular dot notation.
 * 2. Falls back to legacy flat keys if not found.
 */
export const resolveKey = (lang: Language, key: TranslationKey | string): string => {
  const dict = allTranslations[lang] || allTranslations['it'];
  
  // Try Dot notation first
  if (key.includes('.')) {
    const parts = key.split('.');
    let value: any = dict;
    for (const part of parts) {
      value = value?.[part];
    }
    if (typeof value === 'string') return value;
  }

  // Fallback to legacy
  const legacyValue = dict.legacy?.[key as any] || allTranslations['it'].legacy?.[key as any];
  
  return typeof legacyValue === 'string' ? legacyValue : key;
};
