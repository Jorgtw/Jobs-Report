import React from 'react';
import { X, Trophy, Heart, MessageSquare, FileCheck } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';

interface UpgradeModalProps {
  onClose: () => void;
  feature?: 'communications' | 'compliance' | 'generic';
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ onClose, feature = 'generic' }) => {
  const { t } = useTranslation();

  const featureConfig = {
    communications: {
      icon: <MessageSquare size={32} />,
      iconBg: 'bg-blue-100 text-blue-600',
      title: t('communications.premiumFeature'),
      desc: t('communications.internalCommunicationsDesc'),
    },
    compliance: {
      icon: <FileCheck size={32} />,
      iconBg: 'bg-emerald-100 text-emerald-600',
      title: t('communications.upgradeTitle'),
      desc: t('communications.upgradeDesc'),
    },
    generic: {
      icon: <Trophy size={32} />,
      iconBg: 'bg-amber-100 text-amber-600',
      title: t('communications.upgradeTitle'),
      desc: t('communications.upgradeDesc'),
    },
  };

  const cfg = featureConfig[feature];

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center sm:p-4">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose}></div>
      <div className="bg-white sm:rounded-3xl p-8 w-full h-full sm:h-auto sm:max-w-lg relative z-10 shadow-2xl animate-in sm:zoom-in-95 duration-300 overflow-y-auto">
        <button onClick={onClose} className="absolute right-6 top-6 text-slate-400 hover:text-slate-600 transition-colors">
          <X size={24} />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className={`w-20 h-20 ${cfg.iconBg} rounded-2xl flex items-center justify-center mb-6 shadow-inner ring-4 ring-white`}>
            {cfg.icon}
          </div>

          <h2 className="text-2xl font-black text-slate-900 mb-2">{cfg.title}</h2>
          <p className="text-slate-500 mb-8 leading-relaxed">{cfg.desc}</p>

          <div className="w-full bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col items-center gap-2 mb-8 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-2">
              <Heart fill="currentColor" size={24} />
            </div>
            <p className="text-sm font-bold text-slate-700">Per attivare il piano Premium contatta:</p>
            <a href="mailto:jobsreportadmin@gmail.com" className="text-lg font-black text-blue-600 hover:text-blue-700 transition-colors">
              jobsreportadmin@gmail.com
            </a>
            <div className="mt-4 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs font-bold text-amber-700">Nota: Il sistema di pagamento automatico sarà disponibile a breve.</p>
            </div>
          </div>
          
          <p className="mt-4 text-[10px] font-bold text-slate-300 uppercase tracking-widest">
            JobsReport Premium Edition
          </p>
        </div>
      </div>
    </div>
  );
};
