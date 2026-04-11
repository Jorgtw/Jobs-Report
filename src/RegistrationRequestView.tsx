import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import { useTranslation } from './App';
import logoImg from './assets/logo.png';

export const RegistrationRequestView: React.FC = () => {
  const { t } = useTranslation();
  const [form, setForm] = useState({ companyName: '', contactName: '', email: '', phone: '', notes: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');
    
    try {
      const res = await fetch('/api/sendEmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        setStatus('success');
      } else {
        setStatus('error');
        setErrorMessage(data.error?.message || t('auth.registrationErrorConfig'));
      }
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || t('auth.registrationErrorConnection'));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-['Inter',sans-serif]">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/5 blur-[120px] rounded-full"></div>
      </div>

      <div className="w-full max-w-[480px] relative z-10">
        <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-blue-600 font-bold text-xs uppercase tracking-widest mb-6 transition-colors">
          <ArrowLeft size={14} /> {t('auth.back')}
        </Link>
        <div className="bg-white rounded-[32px] p-8 sm:p-10 shadow-2xl shadow-blue-900/5 border border-white relative overflow-hidden">
          <div className="flex flex-col items-center mb-10 text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 shadow-inner ring-4 ring-blue-50/50">
              <img src={logoImg} alt="Logo" className="w-10 h-10 object-contain" style={{ borderRadius: '8px', mixBlendMode: 'multiply', overflow: 'hidden' }} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">{t('auth.registrationTitle')}</h2>
            <p className="text-slate-400 text-sm mt-2 font-medium">{t('auth.registrationDesc')}</p>
          </div>

          {status === 'success' ? (
            <div className="text-center p-6 bg-emerald-50 rounded-2xl border border-emerald-100 animate-in zoom-in-95">
              <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-200">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              </div>
              <h3 className="text-lg font-black text-emerald-900 mb-2">{t('auth.requestSent')}</h3>
              <p className="text-sm font-medium text-emerald-700">{t('auth.requestSentDesc')}</p>
            </div>
          ) : (
            <form onSubmit={handleSend} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('auth.companyName')} *</label>
                <input required value={form.companyName} onChange={e => setForm({ ...form, companyName: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium" placeholder={t('auth.companyNamePlaceholder')} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('auth.contactNameLabel')} *</label>
                <input required value={form.contactName} onChange={e => setForm({ ...form, contactName: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium" placeholder={t('auth.placeholderName')} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('auth.email')} *</label>
                <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium" placeholder={t('auth.placeholderEmail')} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('auth.phone')}</label>
                <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium" placeholder={t('auth.placeholderPhone')} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('auth.notes')}</label>
                <textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium resize-none shadow-inner" placeholder={t('auth.registrationNotesPlaceholder')} />
              </div>
              
              <div className="pt-2 pb-2">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center mt-0.5">
                    <input 
                      type="checkbox" 
                      required
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      className="peer appearance-none w-5 h-5 border-2 border-slate-300 rounded-lg checked:bg-blue-600 checked:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
                    />
                    <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-slate-500 leading-tight">
                    Ho letto e accetto i <Link to="/terms" target="_blank" className="text-blue-600 font-bold hover:underline">Termini di Servizio</Link> e la <Link to="/privacy" target="_blank" className="text-blue-600 font-bold hover:underline">Privacy Policy</Link>.*
                  </span>
                </label>
              </div>

              {status === 'error' && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-[11px] font-bold text-center">
                  {errorMessage}
                </div>
              )}

              <button disabled={status === 'loading' || !acceptedTerms} type="submit" className="w-full py-4 bg-[#2563eb] text-white rounded-2xl font-black text-sm hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 active:scale-[0.98] mt-4 flex items-center justify-center gap-2 disabled:opacity-70 disabled:grayscale-[50%] disabled:cursor-not-allowed">
                {status === 'loading' ? t('auth.sending') : t('auth.sendRequest')} {status !== 'loading' && <ChevronRight size={18} />}
              </button>
            </form>
          )}
        </div>

        <p className="mt-8 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">
          © 2026 JobsReport · {t('common.rightsReserved')}
        </p>
      </div>
    </div>
  );
};

export default RegistrationRequestView;
