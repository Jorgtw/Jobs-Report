import React from 'react';
import { X, Trophy, Heart, CreditCard, Landmark } from 'lucide-react';
import { useTranslation } from '../App';

interface UpgradeModalProps {
  onClose: () => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ onClose }) => {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center sm:p-4">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose}></div>
      <div className="bg-white sm:rounded-3xl p-8 w-full h-full sm:h-auto sm:max-w-lg relative z-10 shadow-2xl animate-in sm:zoom-in-95 duration-300 overflow-y-auto">
        <button onClick={onClose} className="absolute right-6 top-6 text-slate-400 hover:text-slate-600 transition-colors">
          <X size={24} />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 mb-6 shadow-inner ring-4 ring-amber-50">
            <Trophy size={40} />
          </div>

          <h2 className="text-2xl font-black text-slate-900 mb-2">{t('communications.upgradeTitle')}</h2>
          <p className="text-slate-500 mb-8 leading-relaxed">
            {t('communications.upgradeDesc')}
          </p>

          <div className="w-full space-y-4 mb-8">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-4 text-left">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                <Landmark size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bonifico Bancario</p>
                <p className="text-sm font-bold text-slate-700">IBAN: IT00 X000 0000 0000 0000 0000 000</p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-4 text-left">
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                <CreditCard size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">PayPal / Carta</p>
                <p className="text-sm font-bold text-slate-700">jorgtw@gmail.com</p>
              </div>
            </div>
          </div>

          <button 
            onClick={() => window.open('https://paypal.me/jorgtw', '_blank')}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-blue-200 hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
          >
            <Heart size={20} fill="currentColor" />
            {t('communications.upgradeCTA')}
          </button>
          
          <p className="mt-4 text-[10px] font-bold text-slate-300 uppercase tracking-widest">
            JobsReport Premium Edition
          </p>
        </div>
      </div>
    </div>
  );
};
