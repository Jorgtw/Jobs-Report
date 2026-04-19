import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

interface ResetPasswordViewProps {
  t: (key: string) => string;
}

const ResetPasswordView: React.FC<ResetPasswordViewProps> = ({ t }) => {
  const [form, setForm] = useState({ newPass: '', confirmPass: '' });
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        window.location.hash = '#/';
      }
    };
    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });

    if (form.newPass.length < 6) {
      setMessage({ text: t('auth.passwordTooShort') || 'La password deve essere di almeno 6 caratteri', type: 'error' });
      return;
    }
    if (form.newPass !== form.confirmPass) {
      setMessage({ text: t('auth.passwordMismatch'), type: 'error' });
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({ password: form.newPass });
      if (error) throw error;
      setMessage({ text: t('auth.passwordChanged'), type: 'success' });
      setTimeout(() => { window.location.hash = '#/'; }, 1500);
    } catch (err: any) {
      setMessage({ text: err?.message || t('common.updateError'), type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Jobs Report</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">{t('auth.setNewPassword') || 'Imposta la tua nuova password'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
              {t('auth.newPassword')}
            </label>
            <input
              type="password"
              required
              autoFocus
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.newPass}
              onChange={e => setForm({ ...form, newPass: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
              {t('auth.confirmPassword')}
            </label>
            <input
              type="password"
              required
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.confirmPass}
              onChange={e => setForm({ ...form, confirmPass: e.target.value })}
            />
          </div>

          {message.text && (
            <div className={`p-3 rounded-xl text-sm font-bold ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-60 mt-2"
          >
            {loading ? '...' : (t('auth.updatePassword') || 'Imposta password e accedi')}
          </button>
        </form>

      </div>
    </div>
  );
};

export default ResetPasswordView;
