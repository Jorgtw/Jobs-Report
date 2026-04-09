import { common as itCommon } from './it/common';
import { auth as itAuth } from './it/auth';
import { legacy as itLegacy } from './it/legacy';
import { communications as itCommunications } from './it/communications';
import { projects as itProjects } from './it/projects';
import { reports as itReports } from './it/reports';
import { dashboard as itDashboard } from './it/dashboard';
import { landing as itLanding } from './it/landing';
import { help as itHelp } from './it/help';
import { presentation as itPresentation } from './it/presentation';

import { presentation as enPresentation } from './en/presentation';
import { presentation as esPresentation } from './es/presentation';
import { presentation as plPresentation } from './pl/presentation';
import { presentation as trPresentation } from './tr/presentation';
import { presentation as daPresentation } from './da/presentation';

import { translations } from '../translations';

export type Language = 'it' | 'en' | 'es' | 'pl' | 'tr' | 'da';

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
  presentation: itPresentation,
};

export type TranslationKey = 
  | `common.${keyof typeof itCommon & string}` 
  | `auth.${keyof typeof itAuth & string}`
  | `communications.${keyof typeof itCommunications & string}`
  | `projects.${keyof typeof itProjects & string}`
  | `reports.${keyof typeof itReports & string}` 
  | `dashboard.${keyof typeof itDashboard & string}`
  | `landing.${keyof typeof itLanding & string}`
  | `help.${keyof typeof itHelp & string}`
  | `presentation.${keyof typeof itPresentation & string}`
  | string; 

export const allTranslations: Record<Language, any> = {
  it: baseIT,
  en: { ...baseIT, presentation: enPresentation, legacy: translations.en },
  es: { ...baseIT, presentation: esPresentation, legacy: translations.es },
  pl: { ...baseIT, presentation: plPresentation, legacy: translations.pl },
  tr: { ...baseIT, presentation: trPresentation, legacy: translations.tr },
  da: { ...baseIT, presentation: daPresentation, legacy: translations.da },
};

export const resolveKey = (lang: Language, key: TranslationKey | string): any => {
  const dict = allTranslations[lang] || allTranslations['it'];
  
  if (key.includes('.')) {
    const parts = key.split('.');
    let value: any = dict;
    for (const part of parts) {
      value = value?.[part];
    }
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) return value as any; // Allow arrays for groups
  }

  const legacyValue = dict.legacy?.[key as any] || allTranslations['it'].legacy?.[key as any];
  
  return (typeof legacyValue === 'string' || Array.isArray(legacyValue)) ? legacyValue : key;
};
