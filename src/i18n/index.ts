import { common as itCommon } from './it/common';
import { auth as itAuth } from './it/auth';
import { communications as itCommunications } from './it/communications';
import { projects as itProjects } from './it/projects';
import { reports as itReports } from './it/reports';
import { dashboard as itDashboard } from './it/dashboard';
import { landing as itLanding } from './it/landing';
import { help as itHelp } from './it/help';
import { presentation as itPresentation } from './it/presentation';

import { presentation as enPresentation } from './en/presentation';
import { communications as enCommunications } from './en/communications';
import { common as enCommon } from './en/common';
import { auth as enAuth } from './en/auth';

import { presentation as esPresentation } from './es/presentation';
import { communications as esCommunications } from './es/communications';
import { common as esCommon } from './es/common';

import { presentation as plPresentation } from './pl/presentation';
import { communications as plCommunications } from './pl/communications';
import { common as plCommon } from './pl/common';

import { presentation as trPresentation } from './tr/presentation';
import { communications as trCommunications } from './tr/communications';
import { common as trCommon } from './tr/common';

import { presentation as daPresentation } from './da/presentation';
import { communications as daCommunications } from './da/communications';
import { common as daCommon } from './da/common';

export type Language = 'it' | 'en' | 'es' | 'pl' | 'tr' | 'da';

export const baseIT = {
  common: itCommon,
  auth: itAuth,
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
  en: { common: enCommon, auth: enAuth, presentation: enPresentation, communications: enCommunications },
  es: { common: esCommon, presentation: esPresentation, communications: esCommunications },
  pl: { common: plCommon, presentation: plPresentation, communications: plCommunications },
  tr: { common: trCommon, presentation: trPresentation, communications: trCommunications },
  da: { common: daCommon, presentation: daPresentation, communications: daCommunications },
};

export const resolveKey = (lang: Language, key: TranslationKey | string): any => {
  const dict = allTranslations[lang] || allTranslations['it'];
  const itDict = allTranslations['it'];
  
  if (key.includes('.')) {
    const parts = key.split('.');
    
    // 1. Tenta nel dizionario della lingua selezionata
    let value: any = dict;
    for (const part of parts) {
      value = value?.[part];
    }
    
    // 2. Fallback all'italiano se la chiave non esiste nella lingua richiesta
    if (value === undefined || value === null) {
      value = itDict;
      for (const part of parts) {
        value = value?.[part];
      }
    }

    if (typeof value === 'string') return value;
    if (Array.isArray(value)) return value as any; 
  }
  
  return key;
};
