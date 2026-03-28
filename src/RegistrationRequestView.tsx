import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import { LanguageContext } from './App';
import logoImg from './assets/logo.png';

export const RegistrationRequestView: React.FC = () => {
  const { t } = useContext(LanguageContext);
  const [form, setForm] = useState({ companyName: '', contactName: '', email: '', phone: '', notes: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

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
        setErrorMessage(data.error?.message || "Errore durante l'invio. Verifica la configurazione delle API.");
      }
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Errore di connessione. Riprova più tardi.');
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
          <ArrowLeft size={14} /> {(t as any)('back') || 'Torna alla Login'}
        </Link>
        <div className="bg-white rounded-[32px] p-8 sm:p-10 shadow-2xl shadow-blue-900/5 border border-white relative overflow-hidden">
          <div className="flex flex-col items-center mb-10 text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 shadow-inner ring-4 ring-blue-50/50">
              <img src={logoImg} alt="Logo" className="w-10 h-10 object-contain" style={{ borderRadius: '8px', mixBlendMode: 'multiply', overflow: 'hidden' }} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">{(t as any)('registrationTitle') || 'Richiesta Registrazione'}</h2>
            <p className="text-slate-400 text-sm mt-2 font-medium">{(t as any)('registrationDesc') || 'Invia la tua richiesta per registrare una nuova azienda su JobsReport.'}</p>
          </div>

          {status === 'success' ? (
            <div className="text-center p-6 bg-emerald-50 rounded-2xl border border-emerald-100 animate-in zoom-in-95">
              <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-200">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              </div>
              <h3 className="text-lg font-black text-emerald-900 mb-2">{(t as any)('requestSent') || 'Richiesta Inviata!'}</h3>
              <p className="text-sm font-medium text-emerald-700">{(t as any)('requestSentDesc') || 'Ti contatteremo al più presto. Grazie per aver scelto JobsReport.'}</p>
            </div>
          ) : (
            <form onSubmit={handleSend} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{(t as any)('companyName') || 'Nome Azienda'} *</label>
                <input required value={form.companyName} onChange={e => setForm({ ...form, companyName: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium" placeholder="Es. Edilizia Rossi Srl" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{(t as any)('contactNameLabel') || 'Nome Referente'} *</label>
                <input required value={form.contactName} onChange={e => setForm({ ...form, contactName: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium" placeholder="Mario Rossi" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{(t as any)('email') || 'Email'} *</label>
                <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium" placeholder="info@azienda.it" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{(t as any)('phone') || 'Telefono'}</label>
                <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium" placeholder="+39 02 1234567" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{(t as any)('additionalNotes') || 'Note'}</label>
                <textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium resize-none shadow-inner" placeholder="N. dipendenti, tipo di attività..." />
              </div>
              
              {status === 'error' && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-[11px] font-bold text-center">
                  {errorMessage}
                </div>
              )}

              <button disabled={status === 'loading'} type="submit" className="w-full py-4 bg-[#2563eb] text-white rounded-2xl font-black text-sm hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 active:scale-[0.98] mt-4 flex items-center justify-center gap-2 disabled:opacity-70">
                {status === 'loading' ? ((t as any)('sending') || 'Invio in corso...') : ((t as any)('sendRequest') || 'Invia richiesta')} {status !== 'loading' && <ChevronRight size={18} />}
              </button>
            </form>
          )}
        </div>

        <p className="mt-8 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">
          © 2026 JobsReport · Tutti i diritti riservati
        </p>
      </div>
    </div>
  );
};

export default RegistrationRequestView;
