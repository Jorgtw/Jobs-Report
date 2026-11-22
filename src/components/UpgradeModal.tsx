import React from 'react';
import { X } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';

interface UpgradeModalProps {
  onClose: () => void;
  feature?: string;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ onClose }) => {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="jobs-report-support-title"
        className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="jobs-report-support-title" className="text-lg font-bold text-slate-900">
            {t('dashboard.contactSupport')}
          </h2>
          <button type="button" onClick={onClose} aria-label={t('common.close')} className="rounded p-1 text-slate-600 hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>
        <p className="mt-2 text-sm text-slate-600">{t('dashboard.accessLimitHelp')}</p>
        <a
          href="mailto:jobsreportadmin@gmail.com?subject=Jobs-Report"
          className="mt-4 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          {t('dashboard.contactSupport')}
        </a>
      </section>
    </div>
  );
};
