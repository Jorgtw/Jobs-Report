import React, { useState, useEffect } from 'react';
import { User as UserIcon, Lock, CheckCircle2, Building2, ShieldAlert } from 'lucide-react';
import { User } from '../types';
import { db } from '../services/dbService';
import { supabase } from '../services/supabase';
import { useCompany } from '../contexts/CompanyContext';
import NotificationSettings from '../components/NotificationSettings';

interface ProfileViewProps {
  user: User;
  onUpdate: (u: User) => void;
  t: (key: string) => string;
}

const ProfileView: React.FC<ProfileViewProps> = ({ user, onUpdate, t }) => {
  const { refreshContext } = useCompany();
  const isDemoAccount = user.username?.toLowerCase().includes('demo') || false;
  const isAdmin = user.role === 'admin' || user.role === 'superadmin';

  const [activeTab, setActiveTab] = useState<'profile' | 'company'>('profile');

  const [passForm, setPassForm] = useState({ newPass: '', confirmPass: '' });
  const [profileForm, setProfileForm] = useState({
    email: user.email || '',
    phone: user.phone || '',
    address: user.address || ''
  });
  const [message, setMessage] = useState({ text: '', type: '' });
  const [profileMessage, setProfileMessage] = useState({ text: '', type: '' });
  const [monthlyHours, setMonthlyHours] = useState<number | null>(null);

  // Company Form State (V1)
  const [companyForm, setCompanyForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    vatNumber: '',
    id: '',
    status: ''
  });
  const [companyLoading, setCompanyLoading] = useState(false);
  const [companyMessage, setCompanyMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    if (user.role === 'operator' || user.role === 'supervisor') {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      db.getReports().then(reports => {
        const filtered = reports.filter(r => {
          const rDate = new Date(r.date);
          return rDate >= startOfMonth;
        });

        const total = filtered.reduce((sum: number, r: any) => {
          let h = 0;
          if (r.userId === user.id) h += (r.totalHours || 0);
          const aw = r.additionalWorkers?.find((w: any) => w.userId === user.id);
          if (aw) h += (aw.totalHours || 0);
          return sum + h;
        }, 0);

        setMonthlyHours(total);
      }).catch(console.error);
    }
  }, [user.id, user.role]);

  useEffect(() => {
    if (isAdmin && user.companyId) {
      setCompanyLoading(true);
      db.getCompanyDetails(user.companyId)
        .then(comp => {
          if (comp) {
            setCompanyForm({
              name: comp.name || '',
              email: comp.email || '',
              phone: comp.phone || '',
              address: comp.address || '',
              city: comp.city || '',
              country: comp.country || '',
              vatNumber: comp.vatNumber || comp.vat_number || '',
              id: comp.id || '',
              status: comp.status || 'active'
            });
          }
        })
        .catch(err => console.error('Failed to load company details:', err))
        .finally(() => setCompanyLoading(false));
    }
  }, [isAdmin, user.companyId]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passForm.newPass !== passForm.confirmPass) {
      setMessage({ text: t('auth.passwordMismatch'), type: 'error' });
      return;
    }
    if (passForm.newPass.length < 6) {
      setMessage({ text: t('auth.passwordTooShort') || 'La password deve essere di almeno 6 caratteri', type: 'error' });
      return;
    }
    try {
      const { error } = await supabase.auth.updateUser({ password: passForm.newPass });
      if (error) throw error;
      setMessage({ text: t('auth.passwordChanged'), type: 'success' });
      setPassForm({ newPass: '', confirmPass: '' });
    } catch (err: any) {
      setMessage({ text: err?.message || t('common.updateError'), type: 'error' });
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Preventive email validation
      if (profileForm.email) {
        const { data: existingUser } = await supabase
          .from('workers')
          .select('id, name')
          .eq('email', profileForm.email)
          .maybeSingle();

        if (existingUser && existingUser.id !== user.id) {
          setProfileMessage({ 
            text: t('auth.emailAlreadyInUse'), 
            type: 'error' 
          });
          return;
        }
      }

      await db.updateUser(user.id, profileForm);
      const updatedUser = { ...user, ...profileForm };
      if (onUpdate) onUpdate(updatedUser);
      setProfileMessage({ text: t('auth.profileUpdated'), type: 'success' });
    } catch (err) {
      setProfileMessage({ text: t('common.updateError'), type: 'error' });
    }
  };

  const handleCompanyUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user.companyId) return;
    setCompanyMessage({ text: '', type: '' });
    try {
      setCompanyLoading(true);
      await db.updateCompanyDetails(user.companyId, {
        name: companyForm.name,
        email: companyForm.email,
        phone: companyForm.phone,
        address: companyForm.address,
        city: companyForm.city,
        country: companyForm.country
      });

      if (user.companyName !== companyForm.name) {
        const updatedUser = { ...user, companyName: companyForm.name };
        if (onUpdate) onUpdate(updatedUser);
      }

      await refreshContext();

      setCompanyMessage({
        text: 'Dati aziendali aggiornati con successo!',
        type: 'success'
      });
    } catch (err: any) {
      console.error('Company update error:', err);
      setCompanyMessage({
        text: err?.message || t('common.updateError') || 'Errore durante l\'aggiornamento dell\'azienda',
        type: 'error'
      });
    } finally {
      setCompanyLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Admin Tab Switcher */}
      {isAdmin && (
        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200/60 shadow-inner">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
              activeTab === 'profile'
                ? 'bg-white text-slate-900 shadow-md shadow-slate-200/50'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <UserIcon size={16} />
            <span>Profilo Utente</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('company')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
              activeTab === 'company'
                ? 'bg-white text-blue-600 shadow-md shadow-blue-100'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Building2 size={16} />
            <span>Dati Aziendali</span>
          </button>
        </div>
      )}

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <>
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-6 mb-8 pb-8 border-b border-slate-50">
              <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner">
                <UserIcon size={40} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">{user.name}</h1>
                <p className="text-sm font-bold text-blue-600 uppercase tracking-widest mt-1">
                  {t(`projects.role${user.role.charAt(0).toUpperCase() + user.role.slice(1)}` as any)}
                </p>
                <p className="text-xs text-slate-400 font-medium mt-1">@{user.username}</p>
              </div>
            </div>

            {monthlyHours !== null && (
              <div className="mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('common.monthlySummary')}</h3>
                    <p className="text-2xl font-black text-slate-900 mt-1">{monthlyHours.toFixed(1)} <span className="text-sm font-bold text-slate-400">{t('common.hours').toLowerCase()}</span></p>
                  </div>
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
                    <CheckCircle2 size={24} />
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleProfileUpdate} className="space-y-6">
              <h2 className="text-lg font-black text-slate-900 mb-4">{t('auth.profileDetails')}</h2>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{t('auth.email')}</label>
                  <input
                    type="email"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none text-slate-900 font-medium focus:ring-2 focus:ring-blue-500"
                    value={profileForm.email}
                    onChange={e => setProfileForm({ ...profileForm, email: e.target.value })}
                    disabled={isDemoAccount}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{t('workers.phone')}</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none text-slate-900 font-medium focus:ring-2 focus:ring-blue-500"
                    value={profileForm.phone}
                    onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                    disabled={isDemoAccount}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{t('workers.address')}</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none text-slate-900 font-medium focus:ring-2 focus:ring-blue-500"
                    value={profileForm.address}
                    onChange={e => setProfileForm({ ...profileForm, address: e.target.value })}
                    disabled={isDemoAccount}
                  />
                </div>
              </div>

              {profileMessage.text && (
                <div className={`p-4 rounded-xl text-sm font-bold ${profileMessage.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                  {profileMessage.text}
                </div>
              )}

              <button
                type="submit"
                disabled={isDemoAccount}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-lg shadow-slate-200 hover:bg-black transition-all active:scale-95 disabled:opacity-50"
              >
                {t('common.save')}
              </button>
            </form>
          </div>

          <NotificationSettings user={user} t={t} />

          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600">
                <Lock size={20} />
              </div>
              <h2 className="text-lg font-black text-slate-900">{t('auth.changePassword')}</h2>
            </div>
            
            <form onSubmit={handlePasswordChange} className="space-y-6">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{t('auth.newPassword')}</label>
                  <input
                    type="password"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none text-slate-900 font-medium focus:ring-2 focus:ring-blue-500"
                    value={passForm.newPass}
                    onChange={e => setPassForm({ ...passForm, newPass: e.target.value })}
                    disabled={isDemoAccount}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{t('auth.confirmPassword')}</label>
                  <input
                    type="password"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none text-slate-900 font-medium focus:ring-2 focus:ring-blue-500"
                    value={passForm.confirmPass}
                    onChange={e => setPassForm({ ...passForm, confirmPass: e.target.value })}
                    disabled={isDemoAccount}
                  />
                </div>
              </div>

              {message.text && (
                <div className={`p-4 rounded-xl text-sm font-bold ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                  {message.text}
                </div>
              )}

              <button
                type="submit"
                disabled={isDemoAccount}
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
              >
                {t('auth.updatePassword')}
              </button>
              
              {isDemoAccount && (
                <p className="text-[10px] text-center font-bold text-slate-400 uppercase tracking-widest">
                  ⚠️ {t('auth.demoNoAction')}
                </p>
              )}
            </form>
          </div>
        </>
      )}

      {/* Company Tab (Admin only) */}
      {isAdmin && activeTab === 'company' && (
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-8">
          <div className="flex items-center gap-6 pb-6 border-b border-slate-50">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner">
              <Building2 size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                {companyForm.name || user.companyName || 'Dati Aziendali'}
              </h1>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                Impostazioni Operative Ditta
              </p>
            </div>
          </div>

          <form onSubmit={handleCompanyUpdate} className="space-y-6">
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 text-blue-600">
                Informazioni Modificabili
              </h2>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                    Ragione Sociale
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none text-slate-900 font-medium focus:ring-2 focus:ring-blue-500"
                    value={companyForm.name}
                    onChange={e => setCompanyForm({ ...companyForm, name: e.target.value })}
                    disabled={isDemoAccount || companyLoading}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                      Email Aziendale
                    </label>
                    <input
                      type="email"
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none text-slate-900 font-medium focus:ring-2 focus:ring-blue-500"
                      value={companyForm.email}
                      onChange={e => setCompanyForm({ ...companyForm, email: e.target.value })}
                      disabled={isDemoAccount || companyLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                      Telefono
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none text-slate-900 font-medium focus:ring-2 focus:ring-blue-500"
                      value={companyForm.phone}
                      onChange={e => setCompanyForm({ ...companyForm, phone: e.target.value })}
                      disabled={isDemoAccount || companyLoading}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                    Indirizzo Completo
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none text-slate-900 font-medium focus:ring-2 focus:ring-blue-500"
                    value={companyForm.address}
                    onChange={e => setCompanyForm({ ...companyForm, address: e.target.value })}
                    disabled={isDemoAccount || companyLoading}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                      Città
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none text-slate-900 font-medium focus:ring-2 focus:ring-blue-500"
                      value={companyForm.city}
                      onChange={e => setCompanyForm({ ...companyForm, city: e.target.value })}
                      disabled={isDemoAccount || companyLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                      Paese
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none text-slate-900 font-medium focus:ring-2 focus:ring-blue-500"
                      value={companyForm.country}
                      onChange={e => setCompanyForm({ ...companyForm, country: e.target.value })}
                      disabled={isDemoAccount || companyLoading}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Read-Only Fiscal & System Fields */}
            <div className="pt-6 border-t border-slate-100">
              <div className="flex items-center gap-2 mb-4">
                <ShieldAlert size={16} className="text-amber-500" />
                <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  Dati Fiscali e Identificativi (Non Modificabili)
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-500">
                      Partita IVA / CVR
                    </label>
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100 flex items-center gap-1">
                      <Lock size={10} /> Fisso
                    </span>
                  </div>
                  <input
                    type="text"
                    readOnly
                    disabled
                    className="w-full px-4 py-3 rounded-xl bg-slate-100 border-none text-slate-500 font-mono text-sm cursor-not-allowed select-all"
                    value={companyForm.vatNumber || 'Non specificata'}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-500">
                      Stato Azienda
                    </label>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Lock size={10} /> Sistema
                    </span>
                  </div>
                  <input
                    type="text"
                    readOnly
                    disabled
                    className="w-full px-4 py-3 rounded-xl bg-slate-100 border-none text-slate-500 font-bold uppercase text-xs tracking-wider cursor-not-allowed"
                    value={companyForm.status || 'ATTIVO'}
                  />
                </div>

                <div className="md:col-span-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-500">
                      ID Azienda (Tenant UUID)
                    </label>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Lock size={10} /> Immutabile
                    </span>
                  </div>
                  <input
                    type="text"
                    readOnly
                    disabled
                    className="w-full px-4 py-3 rounded-xl bg-slate-100 border-none text-slate-400 font-mono text-xs cursor-not-allowed select-all"
                    value={companyForm.id || user.companyId || ''}
                  />
                </div>
              </div>
            </div>

            {companyMessage.text && (
              <div className={`p-4 rounded-xl text-sm font-bold ${companyMessage.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                {companyMessage.text}
              </div>
            )}

            <button
              type="submit"
              disabled={isDemoAccount || companyLoading}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {companyLoading ? (
                <span>Salvataggio in corso...</span>
              ) : (
                <span>Salva Dati Aziendali</span>
              )}
            </button>

            {isDemoAccount && (
              <p className="text-[10px] text-center font-bold text-slate-400 uppercase tracking-widest">
                ⚠️ {t('auth.demoNoAction')}
              </p>
            )}
          </form>
        </div>
      )}
    </div>
  );
};

export default ProfileView;
