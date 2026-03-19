import React, { useState, useContext } from 'react';
import { Eye, EyeOff, Globe, ChevronRight } from 'lucide-react';
import { db } from './services/dbService';
import { LanguageContext } from './App';
import logoImg from './assets/logo.png';

export const LoginView: React.FC<{ onLogin: (u: any) => void }> = ({ onLogin }) => {
  const { lang, setLang, t } = useContext(LanguageContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await db.loginUser(username, password);
      if (!user) {
        setError(t('invalidCredentials'));
        return;
      }
      if (user.status === 'inactive') {
        setError(t('accountDisabled'));
        return;
      }
      onLogin(user);
    } catch (err: any) {
      setError(err?.message || 'Errore di connessione');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const user = await db.loginUser('Admin.demo', 'demo123');
      if (user) onLogin(user);
    } catch (err) {
      setError('Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = () => {
    const subject = encodeURIComponent(t('registrationEmailSubject'));
    let bodyText = t('registrationEmailBody')
      .replace('{companyName}', 'Nome Azienda')
      .replace('{contactName}', 'Nome Referente')
      .replace('{email}', 'Email')
      .replace('{phone}', 'Telefono')
      .replace('{notes}', 'Note');
    const body = encodeURIComponent(bodyText);
    window.location.href = `mailto:jtw@live.it?subject=${subject}&body=${body}`;
  };

  const handleForgotPassword = () => {
    const subject = encodeURIComponent(t('forgotPasswordEmailSubject'));
    const body = encodeURIComponent(t('forgotPasswordEmailBody').replace('{username}', username || '...').replace('{email}', '...'));
    window.location.href = `mailto:jtw@live.it?subject=${subject}&body=${body}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-['Inter',sans-serif]">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/5 blur-[120px] rounded-full"></div>
      </div>

      <div className="w-full max-w-[420px] relative z-10">
        {/* Language Selector */}
        <div className="flex justify-end mb-6">
          <div className="relative">
            <button 
              type="button"
              onClick={() => setIsLangOpen(!isLangOpen)}
              className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
            >
              <Globe size={14} className="text-blue-500" />
              <span className="uppercase">{lang}</span>
            </button>
            {isLangOpen && (
              <div className="absolute right-0 mt-2 w-32 bg-white border border-slate-200 rounded-2xl shadow-xl z-[100] py-2 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {['it', 'en', 'es', 'pl', 'tr', 'da'].map((l) => (
                  <button 
                    key={l} 
                    type="button"
                    onClick={() => { setLang(l as any); setIsLangOpen(false); }}
                    className={`flex items-center w-full px-4 py-2 text-xs text-left hover:bg-blue-50 transition-colors ${lang === l ? 'text-blue-600 font-bold bg-blue-50/50' : 'text-slate-600'}`}
                  >
                    {l.toUpperCase()}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-[32px] p-10 shadow-2xl shadow-blue-900/5 border border-white relative overflow-hidden">
          {/* Logo & Header */}
          <div className="flex flex-col items-center mb-10 text-center">
            <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mb-6 shadow-inner ring-4 ring-blue-50/50">
              <img src={logoImg} alt="Logo" className="w-14 h-14 object-contain" style={{ borderRadius: '8px', mixBlendMode: 'multiply', overflow: 'hidden' }} />
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Jobs<span className="text-blue-600">Report</span></h2>
            <p className="text-slate-400 text-sm mt-2 font-medium">Gestione professionale rapportini</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('username')}</label>
              <input 
                required 
                value={username} 
                onChange={e => setUsername(e.target.value)} 
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium placeholder:text-slate-400"
                placeholder="Inserisci il tuo username"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('password')}</label>
                <button type="button" onClick={handleForgotPassword} className="text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest transition-colors">
                  {t('forgotPassword')}
                </button>
              </div>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  required 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium placeholder:text-slate-400"
                  placeholder="••••••••"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-300 hover:text-slate-500 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-[11px] font-bold text-center animate-in slide-in-from-top-2">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-sm hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {loading ? 'Accesso in corso...' : t('loginBtn')}
              {!loading && <ChevronRight size={18} />}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-50 flex flex-col gap-4">
            <button 
              type="button"
              onClick={handleDemoLogin} 
              className="w-full py-4 bg-amber-50 text-amber-700 rounded-2xl font-black text-sm hover:bg-amber-100 transition-all border border-amber-100 active:scale-[0.98] shadow-sm flex items-center justify-center gap-2"
            >
              👤 {t('try_demo' as any) || 'Prova la Demo'}
            </button>
            <p className="text-center text-slate-400 text-xs font-medium">
              {t('noAccount')} <button type="button" onClick={handleRegister} className="text-blue-600 font-bold hover:underline">{t('registerLink')}</button>
            </p>
          </div>
        </div>

        <p className="mt-8 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">
          © 2025 JobsReport · Tutti i diritti riservati
        </p>
      </div>
    </div>
  );
};

export default LoginView;
