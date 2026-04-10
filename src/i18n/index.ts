import { common as itCommon } from './it/common';
import { auth as itAuth } from './it/auth';
import { communications as itCommunications } from './it/communications';
import { projects as itProjects } from './it/projects';
import { reports as itReports } from './it/reports';
import { dashboard as itDashboard } from './it/dashboard';
import { landing as itLanding } from './it/landing';
import { help as itHelp } from './it/help';
import { presentation as itPresentation } from './it/presentation';

import { common as enCommon } from './en/common';
import { auth as enAuth } from './en/auth';
import { projects as enProjects } from './en/projects';
import { reports as enReports } from './en/reports';
import { dashboard as enDashboard } from './en/dashboard';
import { landing as enLanding } from './en/landing';
import { help as enHelp } from './en/help';
import { presentation as enPresentation } from './en/presentation';
import { communications as enCommunications } from './en/communications';

import { common as esCommon } from './es/common';
import { auth as esAuth } from './es/auth';
import { projects as esProjects } from './es/projects';
import { reports as esReports } from './es/reports';
import { dashboard as esDashboard } from './es/dashboard';
import { landing as esLanding } from './es/landing';
import { help as esHelp } from './es/help';
import { presentation as esPresentation } from './es/presentation';
import { communications as esCommunications } from './es/communications';

import { common as plCommon } from './pl/common';
import { auth as plAuth } from './pl/auth';
import { projects as plProjects } from './pl/projects';
import { reports as plReports } from './pl/reports';
import { dashboard as plDashboard } from './pl/dashboard';
import { landing as plLanding } from './pl/landing';
import { help as plHelp } from './pl/help';
import { presentation as plPresentation } from './pl/presentation';
import { communications as plCommunications } from './pl/communications';

import { common as trCommon } from './tr/common';
import { auth as trAuth } from './tr/auth';
import { projects as trProjects } from './tr/projects';
import { reports as trReports } from './tr/reports';
import { dashboard as trDashboard } from './tr/dashboard';
import { landing as trLanding } from './tr/landing';
import { help as trHelp } from './tr/help';
import { presentation as trPresentation } from './tr/presentation';
import { communications as trCommunications } from './tr/communications';

import { common as daCommon } from './da/common';
import { auth as daAuth } from './da/auth';
import { projects as daProjects } from './da/projects';
import { reports as daReports } from './da/reports';
import { dashboard as daDashboard } from './da/dashboard';
import { landing as daLanding } from './da/landing';
import { help as daHelp } from './da/help';
import { presentation as daPresentation } from './da/presentation';
import { communications as daCommunications } from './da/communications';

export type Language = 'it' | 'en' | 'es' | 'pl' | 'tr' | 'da';
export type TranslationKey = string;

export const baseIT = {
  common: itCommon,
  auth: itAuth,
  communications: itCommunications,
  projects: itProjects,
  reports: itReports,
  dashboard: itDashboard,
  landing: itLanding,
  help: itHelp,
  presentation: itPresentation
};

export const allTranslations: Record<Language, any> = {
  it: baseIT,
  en: { 
    common: enCommon, 
    auth: enAuth, 
    presentation: enPresentation, 
    communications: enCommunications,
    projects: enProjects,
    reports: enReports,
    dashboard: enDashboard,
    landing: enLanding,
    help: enHelp
  },
  es: { 
    common: esCommon, 
    auth: esAuth,
    presentation: esPresentation, 
    communications: esCommunications,
    projects: esProjects,
    reports: esReports,
    dashboard: esDashboard,
    landing: esLanding,
    help: esHelp
  },
  pl: { 
    common: plCommon, 
    auth: plAuth,
    presentation: plPresentation, 
    communications: plCommunications,
    projects: plProjects,
    reports: plReports,
    dashboard: plDashboard,
    landing: plLanding,
    help: plHelp
  },
  tr: { 
    common: trCommon, 
    auth: trAuth,
    presentation: trPresentation, 
    communications: trCommunications,
    projects: trProjects,
    reports: trReports,
    dashboard: trDashboard,
    landing: trLanding,
    help: trHelp
  },
  da: { 
    common: daCommon, 
    auth: daAuth,
    presentation: daPresentation, 
    communications: daCommunications,
    projects: daProjects,
    reports: daReports,
    dashboard: daDashboard,
    landing: daLanding,
    help: daHelp
  },
};

export const resolveKey = (lang: Language, key: string): string => {
  const parts = key.split('.');
  
  // 1. Prova nella lingua selezionata
  let current: any = allTranslations[lang];
  let found = true;
  if (current) {
    for (const part of parts) {
      if (current && current[part] !== undefined) {
        current = current[part];
      } else {
        found = false;
        break;
      }
    }
  } else {
    found = false;
  }

  if (found && typeof current === 'string') {
    return current;
  }

  // 2. Fallback a Italiano
  let itCurrent: any = allTranslations['it'];
  for (const part of parts) {
    if (itCurrent && itCurrent[part] !== undefined) {
      itCurrent = itCurrent[part];
    } else {
      return key; // Ritorna la chiave se non trovata neanche in IT
    }
  }

  return typeof itCurrent === 'string' ? itCurrent : key;
};
