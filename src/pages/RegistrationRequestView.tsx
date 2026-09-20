import React, { useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';
import { db } from '../services/dbService';
import logoImg from '../assets/logo.png';

export const RegistrationRequestView: React.FC<{ onLogin: (u: any) => void }> = ({ onLogin }) => {
  const { t, lang, setLang } = useTranslation();
  const [, setSearchParams] = useSearchParams();
  const [form, setForm] = useState({ companyName: '', username: '', email: '', password: '' });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'created' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const submitting = useRef(false);
  // Login retries must never create a second company after successful registration.
  const created = useRef(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting.current || !acceptedTerms) return;
    submitting.current = true;
    setStatus('loading');
    setErrorMessage('');
    try {
      const email = form.email.trim().toLowerCase();
      if (!created.current) {
        await db.selfRegister({ ...form, companyName: form.companyName.trim(), email, acceptedTerms, language: lang });
        created.current = true;
      }
      const user = await db.loginUser(form.username, form.password);
      if (!user) throw new Error('REGISTRATION_LOGIN_FAILED');
      sessionStorage.setItem('registration_welcome', user.companyId || '');
      await onLogin(user);
    } catch (err: any) {
      const codes: Record<string, string> = {
        REGISTRATION_INVALID: 'auth.registrationInvalid',
        REGISTRATION_USERNAME_INVALID: 'auth.usernameRules',
        REGISTRATION_TERMS_REQUIRED: 'auth.registrationTermsRequired',
        REGISTRATION_EXISTS: 'auth.registrationExists',
        REGISTRATION_PASSWORD: 'auth.accessPasswordTooShort',
        REGISTRATION_FAILED: 'auth.registrationServerError',
      };
      setErrorMessage(t(created.current ? 'auth.registrationLoginFailed' : (codes[err.message] || 'auth.registrationErrorConnection')));
      setStatus(created.current ? 'created' : 'error');
    } finally {
      submitting.current = false;
    }
  };

  const inputClass = 'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50';
  const locked = status === 'loading' || created.current;
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-md">
        <div className="mb-6 flex items-center justify-between gap-4">
          <Link to={`/?lang=${lang}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600"><ArrowLeft size={16} />{t('auth.back')}</Link>
          <select aria-label={t('auth.languageLabel')} value={lang} onChange={e => { setLang(e.target.value as typeof lang); setSearchParams({ lang: e.target.value }, { replace: true }); }} className="rounded-lg border border-slate-200 bg-white p-2 text-sm">
            <option value="it">Italiano</option><option value="en">English</option><option value="es">Español</option><option value="da">Dansk</option><option value="pl">Polski</option><option value="tr">Türkçe</option>
          </select>
        </div>
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <img src={logoImg} alt="JobsReport" className="mx-auto mb-4 h-14 w-14 object-contain" />
          <h1 className="text-center text-2xl font-bold text-slate-900">{t('auth.quickSignupTitle')}</h1>
          <p className="mt-2 text-center text-sm text-slate-600">{t('auth.quickSignupDesc')}</p>
          <p className="my-6 rounded-xl bg-emerald-50 p-3 text-center text-sm font-medium text-emerald-800">{t('auth.freePlanReassurance')}</p>
          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label htmlFor="signup-company" className="mb-1.5 block text-sm font-semibold text-slate-700">{t('auth.companyName')}</label>
              <input id="signup-company" name="companyName" required maxLength={160} autoComplete="organization" value={form.companyName} disabled={locked} onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))} placeholder={t('auth.companyNamePlaceholder')} className={inputClass} />
            </div>
            <div>
              <label htmlFor="signup-username" className="mb-1.5 block text-sm font-semibold text-slate-700">{t('auth.usernameLabel')}</label>
              <input id="signup-username" name="username" required minLength={3} maxLength={64} pattern="[a-zA-Z0-9][a-zA-Z0-9._\-]{2,63}" autoComplete="username" autoCapitalize="none" spellCheck={false} value={form.username} disabled={locked} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} aria-describedby="signup-username-hint" className={inputClass} />
              <p id="signup-username-hint" className="mt-1 text-xs text-slate-500">{t('auth.usernameRules')}</p>
            </div>
            <div>
              <label htmlFor="signup-email" className="mb-1.5 block text-sm font-semibold text-slate-700">{t('auth.email')}</label>
              <input id="signup-email" name="email" type="email" required maxLength={254} autoComplete="email" autoCapitalize="none" spellCheck={false} value={form.email} disabled={locked} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder={t('auth.placeholderEmailExample')} aria-describedby="signup-email-hint" className={inputClass} />
              <p id="signup-email-hint" className="mt-1 text-xs text-slate-500">{t('auth.emailLoginHint')}</p>
            </div>
            <div>
              <label htmlFor="signup-password" className="mb-1.5 block text-sm font-semibold text-slate-700">{t('auth.passwordLabel')}</label>
              <div className="relative">
                <input id="signup-password" name="password" type={showPassword ? 'text' : 'password'} required minLength={6} maxLength={128} autoComplete="new-password" value={form.password} disabled={locked} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} aria-describedby="signup-password-hint" className={`${inputClass} pr-14`} />
                <button type="button" aria-label={t(showPassword ? 'auth.hideAccessPassword' : 'auth.showAccessPassword')} aria-pressed={showPassword} onClick={() => setShowPassword(v => !v)} className="absolute right-1 top-1 rounded-lg p-3 text-slate-500">{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}</button>
              </div>
              <p id="signup-password-hint" className="mt-1 text-xs text-slate-500">{t('auth.accessPasswordTooShort')}</p>
            </div>
            <div className="flex items-start gap-3 text-sm text-slate-600">
              <input id="signup-terms" type="checkbox" required checked={acceptedTerms} disabled={locked} onChange={e => setAcceptedTerms(e.target.checked)} className="mt-1 h-4 w-4 shrink-0" />
              <label htmlFor="signup-terms">{t('auth.termsAcceptPrefix')}{' '}<Link to={`/terms?lang=${lang}`} target="_blank" rel="noopener" className="text-blue-700 underline">{t('auth.termsLink')}</Link>{' '}{t('auth.termsAcceptMiddle')}{' '}<Link to={`/privacy?lang=${lang}`} target="_blank" rel="noopener" className="text-blue-700 underline">{t('auth.privacyLink')}</Link>.</label>
            </div>
            {errorMessage && <div role="alert" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">{errorMessage}{created.current && <Link to={`/?lang=${lang}`} className="mt-2 block font-semibold underline">{t('auth.loginBtn')}</Link>}</div>}
            <button type="submit" disabled={status === 'loading'} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3.5 font-bold text-white hover:bg-blue-700 disabled:opacity-60">
              {status === 'loading' ? t('auth.loggingIn') : created.current ? t('auth.loginBtn') : t('auth.quickSignupButton')}<CheckCircle2 size={18} />
            </button>
          </form>
          <p className="mt-5 text-center text-xs leading-relaxed text-slate-500">{t('auth.completeProfileLater')}</p>
        </section>
        <p className="mt-6 text-center text-xs text-slate-500">© 2026 JobsReport</p>
      </div>
    </main>
  );
};

export default RegistrationRequestView;
