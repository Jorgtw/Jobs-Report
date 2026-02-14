import React, { useState, useEffect, useMemo, createContext, useContext, useRef } from 'react';
import { HashRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { 
  FileText, 
  Users, 
  Briefcase, 
  LogOut, 
  Plus, 
  Trash2, 
  Pencil,
  Clock,
  Menu,
  X,
  User as UserIcon,
  Globe,
  HardHat,
  Receipt,
  Building2,
  FileDown,
  FileSpreadsheet,
  ClipboardList,
  ShieldAlert,
  ChevronRight,
  UserPlus
} from 'lucide-react';
import { db } from './services/dbService';
import { User, Role, UserStatus, Client, Project, WorkReport, Subcontractor, AdditionalWorker, Expense } from './types';
import { translations, Language } from './translations';
import { exportToPDF, exportToExcel } from './services/exportService';

const LanguageContext = createContext<{
  lang: Language;
  setLang: (l: Language) => void;
  t: (key: keyof typeof translations['it']) => string;
}>({
  lang: 'it',
  setLang: () => {},
  t: (key) => key as string,
});

const useTranslation = () => useContext(LanguageContext);

const inputClasses = "flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-200 shadow-sm text-sm disabled:bg-slate-50";
const modalClasses = "bg-white rounded-2xl p-5 w-full max-w-4xl relative z-10 shadow-2xl animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[95vh]";

const FullWidthField: React.FC<{ label: string; children: React.ReactNode; className?: string }> = ({ label, children, className = "" }) => (
  <div className={`flex flex-col gap-1.5 ${className}`}>
    <label className="text-[10px] font-extrabold text-slate-400 uppercase ml-1 tracking-tight">{label}:</label>
    {children}
  </div>
);

const getNavLinks = (t: any) => [
  { name: t('reports'), path: '/reports', icon: FileText, roles: ['admin', 'operator', 'supervisor'], color: 'bg-blue-500' },
  { name: t('workSummary'), path: '/work-summary', icon: ClipboardList, roles: ['admin'], color: 'bg-indigo-500' },
  { name: t('clients'), path: '/clients', icon: Users, roles: ['admin'], color: 'bg-emerald-500' },
  { name: t('projects'), path: '/projects', icon: Briefcase, roles: ['admin'], color: 'bg-amber-500' },
  { name: t('subcontractors'), path: '/subcontractors', icon: Building2, roles: ['admin'], color: 'bg-cyan-500' },
  { name: t('personnel'), path: '/personnel', icon: ShieldAlert, roles: ['admin'], color: 'bg-rose-500' },
];

export default function App() {
  return <div>App placeholder - see document for full code</div>;
}
