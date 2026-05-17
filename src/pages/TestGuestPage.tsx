import React from 'react';
import { useGuestReport } from '../hooks/useGuestReport';
import { useTranslation } from '../contexts/LanguageContext';

export default function TestGuestPage() {
  const { t } = useTranslation();
  const { guestId, formData, saveDraft } = useGuestReport();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    saveDraft({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGenerateClick = () => {
    alert(t('landing.sandbox.testVersionAlert'));
  };

  return (
    <div className="max-w-xl mx-auto p-6 mt-10 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">{t('landing.sandbox.createFirstReport')}</h1>
        <p className="text-slate-500 mt-2 text-sm">{t('landing.sandbox.noRegistrationRequired')}</p>
      </div>
      
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
        <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1">{t('landing.sandbox.debugStatus')}</p>
        <p className="text-sm font-mono text-slate-700"><strong>{t('landing.sandbox.guestId')}</strong> {guestId || t('landing.sandbox.generating')}</p>
        <p className="text-xs text-slate-400 mt-1">{t('landing.sandbox.localStorageHint')}</p>
      </div>

      <form className="space-y-5 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-tight mb-1">{t('landing.sandbox.client')}</label>
          <input 
            type="text"
            name="cliente" 
            value={formData.cliente} 
            onChange={handleInputChange} 
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
        
        <div>
          <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-tight mb-1">{t('landing.sandbox.date')}</label>
          <input 
            type="date"
            name="data" 
            value={formData.data} 
            onChange={handleInputChange} 
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-tight mb-1">{t('landing.sandbox.hoursWorked')}</label>
          <input 
            type="number"
            name="ore" 
            value={formData.ore} 
            onChange={handleInputChange} 
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-tight mb-1">{t('landing.sandbox.workDescription')}</label>
          <textarea 
            name="descrizione" 
            value={formData.descrizione} 
            onChange={handleInputChange} 
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all min-h-[100px]"
          />
        </div>
        
        <button 
          type="button" 
          onClick={handleGenerateClick}
          className="w-full bg-blue-600 text-white font-black py-4 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30 text-lg tracking-tight"
        >
          {t('landing.sandbox.generateFreePdf')}
        </button>
      </form>
    </div>
  );
}
