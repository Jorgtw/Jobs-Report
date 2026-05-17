import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ArrowLeft, Building2, User, Mail, MapPin, Hash, Lock, CheckCircle2 } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';
import { db } from '../services/dbService';
import logoImg from '../assets/logo.png';

interface RegistrationRequestViewProps {
  onLogin: (u: any) => void;
}

export const RegistrationRequestView: React.FC<RegistrationRequestViewProps> = ({ onLogin }) => {
  const { t } = useTranslation();
  const [form, setForm] = useState({ 
    companyName: '', 
    adminName: '', 
    email: '', 
    phone: '', 
    address: '', 
    city: '', 
    vatNumber: '', 
    username: '', 
    password: '' 
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedTerms) return;
    
    setStatus('loading');
    setErrorMessage('');
    
    try {
      // 1. Self Registration via API
      await db.selfRegister(form);
      
      // 2. Immediate Login
      const user = await db.loginUser(form.username, form.password);
      if (user) {
        setStatus('success');
        setTimeout(() => onLogin(user), 1500);
      } else {
        throw new Error("Registrazione completata, ma il login automatico è fallito. Prova ad accedere manualmente.");
      }
      
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setErrorMessage(err.message || t('auth.registrationErrorConnection'));
    }
  };

  const inputGroup = (icon: any, label: string, name: keyof typeof form, type = "text", placeholder = "", required = true) => (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
        {React.createElement(icon, { size: 10, className: "text-blue-500" })}
        {label} {required && '*'}
      </label>
      <input 
        type={type}
        required={required}
        value={form[name]} 
        onChange={e => setForm({ ...form, [name]: e.target.value })} 
        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium" 
        placeholder={placeholder} 
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-['Inter',sans-serif]">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/5 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/5 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="w-full max-w-[640px] relative z-10">
        <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-blue-600 font-bold text-xs uppercase tracking-widest mb-6 transition-colors group">
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> {t('auth.back')}
        </Link>
        
        <div className="bg-white rounded-[40px] p-8 sm:p-12 shadow-2xl shadow-blue-900/5 border border-white relative overflow-hidden">
          {/* Progress Indicator */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-100">
            <div 
              className="h-full bg-blue-600 transition-all duration-1000 ease-out" 
              style={{ width: status === 'success' ? '100%' : status === 'loading' ? '60%' : '10%' }}
            />
          </div>

          <div className="flex flex-col items-center mb-10 text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 shadow-inner ring-4 ring-blue-50/50">
              <img src={logoImg} alt="Logo" className="w-10 h-10 object-contain" style={{ mixBlendMode: 'multiply' }} />
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">{t('auth.signupTitle')}</h2>
            <p className="text-slate-400 text-sm mt-2 font-medium max-w-sm">{t('auth.signupDesc')}</p>
          </div>

          {status === 'success' ? (
            <div className="text-center py-12 px-6 bg-emerald-50 rounded-[32px] border border-emerald-100 animate-in zoom-in-95 duration-500">
              <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-200 animate-bounce">
                <CheckCircle2 size={40} />
              </div>
              <h3 className="text-2xl font-black text-emerald-900 mb-2">{t('auth.accountCreated')}</h3>
              <p className="text-sm font-medium text-emerald-700">{t('auth.immediateLogin')}</p>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-8">
              {/* Sezione 1: Dati Aziendali */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-black">1</div>
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">{t('auth.companyDataSection')}</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {inputGroup(Building2, t('auth.companyName'), 'companyName', 'text', t('auth.companyNamePlaceholder'))}
                  {inputGroup(Hash, t('auth.vatNumber'), 'vatNumber', 'text', t('auth.placeholderVatExample'))}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {inputGroup(MapPin, t('auth.address'), 'address', 'text', t('auth.placeholderAddress'))}
                  {inputGroup(MapPin, t('auth.city'), 'city', 'text', t('auth.placeholderCity'))}
                </div>
              </div>

              {/* Sezione 2: Amministratore */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-black">2</div>
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">{t('auth.contactAccessSection')}</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {inputGroup(User, t('auth.contactNameLabel'), 'adminName', 'text', t('auth.placeholderContactExample'))}
                  {inputGroup(Mail, t('auth.email'), 'email', 'email', t('auth.placeholderEmailExample'))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {inputGroup(Lock, t('auth.usernameLabel'), 'username', 'text', t('auth.placeholderUsernameExample'))}
                  {inputGroup(Lock, t('auth.passwordLabel'), 'password', 'password', '••••••••')}
                </div>
              </div>
              
              <div className="pt-4">
                <label className="flex items-start gap-4 cursor-pointer group p-4 bg-slate-50 rounded-2xl hover:bg-blue-50/50 transition-colors">
                  <div className="relative flex items-center justify-center mt-0.5">
                    <input 
                      type="checkbox" 
                      required
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      className="peer appearance-none w-6 h-6 border-2 border-slate-300 rounded-lg checked:bg-blue-600 checked:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer"
                    />
                    <CheckCircle2 className="absolute w-4 h-4 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-500 leading-normal">
                    {t('auth.termsAcceptPrefix')}{' '}
                    <Link to="/terms" target="_blank" className="text-blue-600 hover:underline">{t('auth.termsLink')}</Link>
                    {' '}{t('auth.termsAcceptMiddle')}{' '}
                    <Link to="/privacy" target="_blank" className="text-blue-600 hover:underline">{t('auth.privacyLink')}</Link>.*
                    <br />
                    <span className="text-slate-400 font-medium">{t('auth.dataUsageWarning')}</span>
                  </span>
                </label>
              </div>

              {status === 'error' && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-[11px] font-bold text-center animate-in shake-1">
                  {errorMessage}
                </div>
              )}

              <button 
                disabled={status === 'loading' || !acceptedTerms} 
                type="submit" 
                className="w-full py-5 bg-blue-600 text-white rounded-[24px] font-black text-sm hover:bg-blue-700 transition-all shadow-2xl shadow-blue-200 active:scale-[0.98] mt-4 flex items-center justify-center gap-3 disabled:opacity-70 disabled:grayscale-[50%] disabled:cursor-not-allowed group"
              >
                {status === 'loading' ? (
                  <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {t('auth.signupBtn')}
                    <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        <p className="mt-10 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">
          © 2026 JobsReport · SaaS Infrastructure v1.3
        </p>
      </div>
    </div>
  );
};

export default RegistrationRequestView;
