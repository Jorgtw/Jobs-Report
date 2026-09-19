import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../contexts/LanguageContext';

export const RegistrationWelcome: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const go = (path: string) => { onComplete(); navigate(path); };
  return (
    <section aria-labelledby="registration-welcome-title" className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 p-5 sm:p-7">
      <h1 id="registration-welcome-title" className="text-xl font-bold text-slate-900">{t('auth.welcomeTitle')}</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-600">{t('auth.welcomeDescription')}</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button onClick={() => go('/reports?start=internal')} className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white">{t('auth.firstReport')}</button>
        <button onClick={() => go('/clients')} className="rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm font-bold text-blue-700">{t('auth.firstClient')}</button>
        <button onClick={() => go('/profile?tab=company')} className="rounded-xl px-4 py-3 text-sm font-semibold text-blue-700 underline">{t('auth.completeCompanyProfile')}</button>
      </div>
      <button onClick={onComplete} className="mt-4 text-sm text-slate-600 underline">{t('auth.doLater')}</button>
    </section>
  );
};
