import React, { useState, useEffect } from 'react';
import { Plus, Mail, Pencil, Trash2, X, User as UserIcon, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';
import { db } from '../services/dbService';
import { User, Role, UserStatus } from '../types';
import { inputClasses, modalClasses, FullWidthField } from '../App';
import Tooltip from '../components/common/Tooltip';
import { useSubscription } from '../hooks/useSubscription';
import { pricingPolicy } from '../utils/pricingPolicy';
import { UpgradeModal } from '../components/UpgradeModal';

interface PersonnelViewProps {
  user: User;
  onImpersonate?: (u: User) => void;
}

const PersonnelView: React.FC<PersonnelViewProps> = ({ user, onImpersonate }) => {
  const { t } = useTranslation();
  const { status: subStatus } = useSubscription(user?.companyId);
  const [users, setUsers] = useState<User[]>([]);
  const [subcontractors, setSubcontractors] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [accessMessage, setAccessMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [sendStatus, setSendStatus] = useState<Record<string, 'success' | 'error'>>({});

  useEffect(() => {
    const load = async () => {
      // Ensure DB context is correct for this component (handle both set and clear)
      db.setCompanyId(user?.companyId ?? null);
      const [u, s] = await Promise.all([db.getUsers(), db.getSubcontractors()]);
      setUsers(u.filter(account => !account.accessDeleted));
      setSubcontractors(s);
    };
    load();
  }, [user?.companyId]);

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    email: '',
    role: 'operator' as Role,
    status: 'active' as UserStatus,
    hourlyRate: 0,
    overtimeHourlyRate: 0,
    extraCost: 0,
    phone: '',
    address: '',
    notes: '',
    subcontractorId: ''
  });

  const isEditingDemo = !!editingId && formData.username?.toLowerCase().includes('demo');

  const handleEdit = (u: User) => {
    setAccessMessage(null);
    setShowPassword(false);
    setEditingId(u.id);
    setFormData({
      name: u.name,
      username: u.username,
      password: '',
      email: u.email || '',
      role: u.role,
      status: u.status,
      hourlyRate: u.hourlyRate || 0,
      overtimeHourlyRate: u.overtimeHourlyRate || 0,
      extraCost: u.extraCost || 0,
      phone: u.phone || '',
      address: u.address || '',
      notes: u.notes || '',
      subcontractorId: u.subcontractorId || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm(t('common.confirmDelete'))) {
      try {
        await db.deleteUser(id);
        setUsers((await db.getUsers()).filter(account => !account.accessDeleted));
      } catch (err: any) {
        setAccessMessage({ type: 'error', text: accessError(err) });
      }
    }
  };

  const accessError = (err: any) => {
    const code = String(err?.message || '');
    const messages: Record<string, string> = {
      ACCESS_PASSWORD_TOO_SHORT: 'accessPasswordTooShort',
      ACCESS_WORKER_INACTIVE: 'accessWorkerInactive',
      ACCESS_EMAIL_REQUIRED: 'accessEmailRequired',
      ACCESS_EMAIL_NOT_CONFIGURED: 'accessEmailUnavailable',
      ACCESS_EMAIL_SEND_FAILED: 'accessEmailUnavailable',
      ACCESS_PASSWORD_SAVED_EMAIL_FAILED: 'accessPasswordSavedEmailFailed',
      ACCESS_PASSWORD_UPDATE_FAILED: 'accessPasswordUpdateFailed',
      ACCESS_PROTECTED_ACCOUNT: 'accessProtectedAccount',
      ACCESS_IDENTITY_MISMATCH: 'accessProtectedAccount',
      ACCESS_SHARED_ACCOUNT: 'accessProtectedAccount',
      ACCESS_USERNAME_INVALID: 'usernameRules',
      ACCESS_USERNAME_EXISTS: 'registrationExists'
    };
    return code.startsWith('ACCESS_') ? t(`auth.${messages[code] || 'accessSetupFailed'}`) : `${t('common.saveError')} ${code}`;
  };

  const handleSendInstructions = async (u: { id: string; email?: string }, password: string) => {
    if (!u.email || sendingId) return false;

    try {
      setAccessMessage(null);
      setSendingId(u.id);
      await db.sendAccessInstructions(u.id, password);
      setAccessMessage({ type: 'success', text: t('auth.loginDetailsSent') });
      setSendStatus(prev => ({ ...prev, [u.id]: 'success' }));
      setTimeout(() => setSendStatus(prev => { const next = { ...prev }; delete next[u.id]; return next; }), 3000);
      return true;
    } catch (err: any) {
      console.error('Failed to send instructions:', err);
      setSendStatus(prev => ({ ...prev, [u.id]: 'error' }));
      setAccessMessage({ type: 'error', text: accessError(err) });
      setTimeout(() => setSendStatus(prev => { const next = { ...prev }; delete next[u.id]; return next; }), 3000);
      return false;
    } finally {
      setSendingId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving || sendingId) return;
    const sendInstructions = (e.nativeEvent as SubmitEvent).submitter?.getAttribute('value') === 'send';
    if (sendInstructions && formData.password.trim().length < 6) {
      setAccessMessage({ type: 'error', text: t('auth.accessPasswordTooShort') });
      return;
    }
    setIsSaving(true);
    setAccessMessage(null);
    try {
      const isPasswordSet = typeof formData.password === 'string' && formData.password.trim() !== '';
      const data = {
        ...formData,
        // The send endpoint sets the exact password included in the email.
        password: isPasswordSet && !sendInstructions ? formData.password : undefined,
        subcontractorId: formData.subcontractorId || undefined
      };
      const isSensitive = !!(editingId && (
        isPasswordSet ||
        (formData.email && formData.email !== users.find(u => u.id === editingId)?.email)
      ));

      let savedId = editingId;
      if (editingId) {
        await db.updateUser(editingId, data);
        if (isSensitive && !sendInstructions) {
          alert(t('auth.profileUpdated'));
        }
      } else {
        const activeCount = users.filter(u => u.status === 'active').length;
        const check = pricingPolicy.checkUserLimit(subStatus?.planCode, activeCount);
        if (!check.allowed) {
          alert(check.message);
          setIsModalOpen(false);
          setIsUpgradeModalOpen(true);
          return;
        }
        const saved = await db.addUser(data);
        savedId = saved.id;
        setEditingId(savedId);
      }
      setUsers((await db.getUsers()).filter(account => !account.accessDeleted));
      if (sendInstructions && savedId) {
        const sent = await handleSendInstructions({ id: savedId, email: formData.email }, formData.password);
        if (!sent) return;
      }
      setFormData(prev => ({ ...prev, password: '' }));
      setShowPassword(false);
      setEditingId(null);
      setIsModalOpen(false);
    } catch (err: any) {
      setAccessMessage({ type: 'error', text: accessError(err) });
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setAccessMessage(null);
    setShowPassword(false);
    const activeCount = users.filter(u => u.status === 'active').length;
    const check = pricingPolicy.checkUserLimit(subStatus?.planCode, activeCount);
    if (!check.allowed) {
      alert(check.message);
      setIsUpgradeModalOpen(true);
      return;
    }
    setEditingId(null);
    setFormData({
      name: '',
      username: '',
      password: '',
      email: '',
      role: 'operator',
      status: 'active',
      hourlyRate: 0,
      overtimeHourlyRate: 0,
      extraCost: 0,
      phone: '',
      address: '',
      notes: '',
      subcontractorId: ''
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSaving || sendingId) return;
    setFormData(prev => ({ ...prev, password: '' }));
    setShowPassword(false);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {!isModalOpen && accessMessage && (
        <p role={accessMessage.type === 'error' ? 'alert' : 'status'} className={`p-3 rounded-xl text-sm ${accessMessage.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
          {accessMessage.text}
        </p>
      )}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">{t('projects.personnelTitle')}</h1>
        <button onClick={resetForm} className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-all">
          <Plus size={16} className="mr-2" /> {t('projects.personnelNew')}
        </button>
      </div>
      <div className="grid grid-cols-1 gap-2">
        {[...users].sort((a, b) => {
          const aType = a.status === 'inactive' ? 2 : (!a.subcontractorId ? 0 : 1);
          const bType = b.status === 'inactive' ? 2 : (!b.subcontractorId ? 0 : 1);
          if (aType !== bType) return aType - bType;
          return a.name.localeCompare(b.name);
        }).map(u => {
          const sub = subcontractors.find(s => s.id === u.subcontractorId);
          return (
            <div key={u.id} className={`bg-white px-4 py-3 rounded-xl border ${u.status === 'active' ? 'border-slate-200' : 'border-slate-100 opacity-60'} flex justify-between items-center group hover:border-blue-200 hover:shadow-md transition-all`}>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-slate-900 text-base truncate">
                  {u.name}
                  {u.phone && <span className="text-sm text-slate-500 font-medium ml-2 font-normal">• {u.phone}</span>}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1 truncate capitalize">
                  {t(`projects.role${u.role.charAt(0).toUpperCase() + u.role.slice(1)}` as any)} • {u.subcontractorId ? sub?.name || t('projects.personSubcontractor') : t('projects.personInternal')}
                </p>
              </div>
              <div className="flex gap-2 shrink-0 ml-4 items-center">
                {u.email && (
                  <button
                    disabled={sendingId === u.id || !u.email}
                    onClick={() => handleEdit(u)}
                    className={`p-2 rounded-lg transition-all ${sendingId === u.id ? 'bg-slate-100 text-slate-400' : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'}`}
                    title={t('auth.sendInstructions')}
                  >
                    {sendingId === u.id ? (
                      <div className="w-[18px] h-[18px] border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                    ) : (
                      <Mail size={18} />
                    )}
                  </button>
                )}
                {sendStatus[u.id] && (
                  <span className={`text-xs font-bold ${sendStatus[u.id] === 'success' ? 'text-emerald-600' : 'text-red-500'}`}>
                    {sendStatus[u.id] === 'success' ? '✓' : '✗'}
                  </span>
                )}
                {onImpersonate && (
                  <button onClick={() => onImpersonate(u)} className="p-2 text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors" title={t('dashboard.impersonateUser')}>
                    <UserIcon size={18} />
                  </button>
                )}
                <button onClick={() => handleEdit(u)} className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"><Pencil size={18} /></button>
                <button onClick={() => handleDelete(u.id)} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"><Trash2 size={18} /></button>
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center sm:p-4">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={closeModal}></div>
          <div className={modalClasses}>
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h2 className="text-xl font-bold text-slate-900">{editingId ? t('projects.personnelEdit') : t('projects.personnelNew')}</h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {accessMessage && (
                <p role={accessMessage.type === 'error' ? 'alert' : 'status'} className={`p-3 rounded-xl text-sm ${accessMessage.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                  {accessMessage.text}
                </p>
              )}
              {isEditingDemo && (
                <div className="bg-amber-50 text-amber-800 p-3 rounded-xl text-xs font-semibold border border-amber-200">
                  {t('dashboard.demoFieldsLocked')}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <FullWidthField label={t('projects.personName')}>
                  <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} disabled={isEditingDemo} className={inputClasses} />
                </FullWidthField>
                <FullWidthField label={t('projects.personType')}>
                  <select
                    value={formData.subcontractorId}
                    onChange={e => {
                      const subId = e.target.value;
                      const sub = subcontractors.find(s => s.id === subId);
                      setFormData({
                        ...formData,
                        subcontractorId: subId,
                        hourlyRate: sub ? sub.amount : (subId === "" ? 0 : formData.hourlyRate)
                      });
                    }}
                    className={inputClasses}
                  >
                    <option value="">{t('projects.personInternal')}</option>
                    {Array.from(new Map(subcontractors.map(s => [s.id, s])).values()).map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </FullWidthField>
                <FullWidthField label={t('projects.personRole')}>
                  <select required value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value as Role })} disabled={isEditingDemo} className={inputClasses}>
                    <option value="operator">{t('projects.roleOperator')}</option>
                    <option value="supervisor">{t('projects.roleSupervisor')}</option>
                    <option value="admin">{t('projects.roleAdmin')}</option>
                  </select>
                </FullWidthField>
                <FullWidthField label={t('projects.personPhone')}>
                  <input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className={inputClasses} />
                </FullWidthField>
                <FullWidthField label={t('projects.personEmail')}>
                  <input type="email" required={!formData.subcontractorId} value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className={inputClasses} />
                </FullWidthField>
                <FullWidthField label={t('projects.personRate')}>
                  <div className="flex items-center gap-2">
                    <input type="number" step="0.01" value={formData.hourlyRate} onChange={e => setFormData({ ...formData, hourlyRate: parseFloat(e.target.value) || 0 })} className={inputClasses} />
                    <Tooltip text={t('projects.tooltip_hourlyRate')} />
                  </div>
                </FullWidthField>
                <FullWidthField label={t('projects.personOvertimeRate')}>
                  <div className="flex items-center gap-2">
                    <input type="number" step="0.01" value={formData.overtimeHourlyRate} onChange={e => setFormData({ ...formData, overtimeHourlyRate: parseFloat(e.target.value) || 0 })} className={inputClasses} />
                    <Tooltip text={t('projects.tooltip_overtimeHourlyRate')} />
                  </div>
                </FullWidthField>
                {/* Fields moved to Access and Security section below */}
                <div className="md:col-span-2">
                  <FullWidthField label={t('projects.personAddress')}>
                    <input type="text" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className={inputClasses} />
                  </FullWidthField>
                </div>
                <div className="md:col-span-2">
                  <FullWidthField label={t('projects.personNotes')}>
                    <textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} className={inputClasses + " min-h-[60px]"} />
                  </FullWidthField>
                </div>
              </div>

              {/* Access and Security Section (Internal Personnel only) */}
              {!formData.subcontractorId && (
                <div className="mt-4 pt-6 border-t">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1.5 h-4 bg-blue-600 rounded-full" />
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-tight">{t('projects.accessAndSecurity')}</h3>
                  </div>

                  {editingId && (
                    <div className="bg-blue-50 text-blue-700 p-3 rounded-xl text-[10px] font-bold border border-blue-100 flex items-start gap-2 mb-4">
                      <AlertCircle size={14} className="shrink-0" />
                      {t('auth.loginCredentialsWarning')}
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                    <FullWidthField label={t('projects.personUsername')}>
                      <input type="text" required value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} disabled={isEditingDemo} className={inputClasses} />
                    </FullWidthField>
                    <FullWidthField label={t('auth.newPassword')}>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="new-password"
                            minLength={6}
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                            disabled={isEditingDemo}
                            className={inputClasses}
                            placeholder={editingId ? t('auth.passwordChangeHint') : ''}
                          />
                          <button type="button" onClick={() => setShowPassword(value => !value)} aria-label={t(showPassword ? 'auth.hideAccessPassword' : 'auth.showAccessPassword')} aria-pressed={showPassword} className="shrink-0 p-2 text-slate-600 rounded-lg hover:bg-slate-100">
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                          </button>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{t('auth.loginDetailsHint')}</p>
                      </div>
                    </FullWidthField>

                    {/* Send access instructions button integrated here */}
                    {formData.email && (
                      <div className="md:col-span-2">
                        <button
                          type="submit"
                          value="send"
                          disabled={isSaving || !!sendingId || isEditingDemo}
                          className="w-full px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl font-bold border border-emerald-100 hover:bg-emerald-100 transition-all flex items-center justify-center gap-2 shadow-sm"
                        >
                          <Mail size={16} /> {isSaving || sendingId ? t('auth.sending') : t('auth.sendLoginDetails')}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t mt-4">
                <div className="flex items-center gap-3">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-tight">{t('projects.personStatus')}:</label>
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button type="button" onClick={() => setFormData({ ...formData, status: 'active' })} className={`px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${formData.status === 'active' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>{t('projects.personStatusActive')}</button>
                    <button type="button" onClick={() => setFormData({ ...formData, status: 'inactive' })} className={`px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${formData.status === 'inactive' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-400'}`}>{t('projects.personStatusInactive')}</button>
                  </div>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                  <button type="button" onClick={closeModal} className="flex-1 sm:flex-none px-6 py-2.5 font-bold text-slate-500 hover:text-slate-700 transition-colors">{t('common.cancel')}</button>
                  <button type="submit" disabled={isSaving || !!sendingId} className="flex-1 sm:flex-none px-10 py-2.5 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">
                    {editingId ? t('common.update') : t('common.save')}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      {isUpgradeModalOpen && (
        <UpgradeModal onClose={() => setIsUpgradeModalOpen(false)} />
      )}
    </div>
  );
};

export default PersonnelView;
