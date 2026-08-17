import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { Eye, EyeOff, Lock, CheckCircle2, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import logoImg from '../assets/logo.png';

interface ResetPasswordViewProps {
  t: (key: string) => string;
}

const ResetPasswordView: React.FC<ResetPasswordViewProps> = ({ t }) => {
  const [form, setForm] = useState({ newPass: '', confirmPass: '' });
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' | '' }>({ text: '', type: '' });
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const verifyAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session && isMounted) {
          console.log('[ResetPasswordView] Valid recovery session detected via getSession');
          setHasValidSession(true);
          setCheckingSession(false);
          return;
        }
      } catch (err) {
        console.warn('[ResetPasswordView] getSession error:', err);
      }

      // Check if hash has access tokens
      const rawHash = window.location.hash || '';
      if (rawHash.includes('access_token') || rawHash.includes('type=recovery')) {
        console.log('[ResetPasswordView] Recovery token detected in hash, awaiting auth state change...');
      }
    };

    verifyAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[ResetPasswordView] Auth state change event:', event);
      if (isMounted && (event === 'PASSWORD_RECOVERY' || (session && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')))) {
        setHasValidSession(true);
        setCheckingSession(false);
      }
    });

    // Grace period timer: allow 3.5s for token verification before declaring invalid link
    const timer = setTimeout(async () => {
      if (isMounted) {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          setHasValidSession(true);
        }
        setCheckingSession(false);
      }
    }, 3500);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });

    if (form.newPass.length < 6) {
      setMessage({ 
        text: t('auth.passwordTooShort') || 'La password deve contenere almeno 6 caratteri.', 
        type: 'error' 
      });
      return;
    }
    if (form.newPass !== form.confirmPass) {
      setMessage({ 
        text: t('auth.passwordMismatch') || 'Le password inserite non coincidono.', 
        type: 'error' 
      });
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({ password: form.newPass });
      if (error) throw error;

      sessionStorage.removeItem('auth_recovery_flow');
      setMessage({ 
        text: t('auth.passwordChanged') || 'Password aggiornata con successo! Accesso in corso...', 
        type: 'success' 
      });

      setTimeout(() => {
        window.location.hash = '#/home';
        window.location.reload();
      }, 1200);
    } catch (err: any) {
      console.error('[ResetPasswordView] Update error:', err);
      setMessage({ 
        text: err?.message || t('common.updateError') || 'Errore durante l\'aggiornamento della password.', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoToLogin = () => {
    sessionStorage.removeItem('auth_recovery_flow');
    window.location.hash = '#/';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-['Inter',sans-serif]">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/5 blur-[120px] rounded-full"></div>
      </div>

      <div className="w-full max-w-[420px] relative z-10">
        <div className="bg-white rounded-[32px] p-8 sm:p-10 shadow-2xl shadow-blue-900/5 border border-white relative overflow-hidden">
          
          {/* Logo & Header */}
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-3xl flex items-center justify-center mb-4 shadow-inner ring-4 ring-blue-50/50">
              <img src={logoImg} alt="Logo" className="w-11 h-11 object-contain" style={{ borderRadius: '8px', mixBlendMode: 'multiply' }} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Jobs<span className="text-blue-600">Report</span>
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 font-medium">
              {t('auth.setNewPassword') || 'Imposta la tua nuova password'}
            </p>
          </div>

          {checkingSession ? (
            <div className="py-12 flex flex-col items-center justify-center gap-4 text-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider animate-pulse">
                {t('common.verifyingLink') || 'Verifica del link di accesso in corso...'}
              </p>
            </div>
          ) : !hasValidSession ? (
            <div className="space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex flex-col items-center gap-3">
                <AlertCircle className="w-8 h-8 text-amber-600" />
                <div>
                  <h3 className="text-sm font-bold text-amber-900">
                    {t('auth.linkExpiredTitle') || 'Link non valido o scaduto'}
                  </h3>
                  <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                    {t('auth.linkExpiredDesc') || 'Il link per impostare la password non è più valido o è già stato utilizzato. Richiedi un nuovo invito all\'amministratore.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoToLogin}
                className="w-full py-3.5 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <span>{t('auth.backToLogin') || 'Vai alla schermata di accesso'}</span>
                <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in duration-200">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  {t('auth.newPassword') || 'Nuova Password'}
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <Lock size={16} />
                  </div>
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    autoFocus
                    placeholder="Almeno 6 caratteri"
                    value={form.newPass}
                    onChange={e => setForm({ ...form, newPass: e.target.value })}
                    className="w-full pl-11 pr-11 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  {t('auth.confirmPassword') || 'Conferma Nuova Password'}
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <Lock size={16} />
                  </div>
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    required
                    placeholder="Ripeti la nuova password"
                    value={form.confirmPass}
                    onChange={e => setForm({ ...form, confirmPass: e.target.value })}
                    className="w-full pl-11 pr-11 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {message.text && (
                <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top-1 ${
                  message.type === 'success' 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                    : 'bg-red-50 text-red-600 border border-red-100'
                }`}>
                  {message.type === 'success' ? <CheckCircle2 size={16} className="shrink-0" /> : <AlertCircle size={16} className="shrink-0" />}
                  <span>{message.text}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-sm hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2 mt-4 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Salvataggio...</span>
                  </>
                ) : (
                  <>
                    <span>{t('auth.updatePassword') || 'Salva Password e Accedi'}</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          )}

        </div>

        <p className="mt-8 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">
          v1.1 · © 2026 JobsReport · {t('common.rightsReserved') || 'Tutti i diritti riservati'}
        </p>
      </div>
    </div>
  );
};

export default ResetPasswordView;
