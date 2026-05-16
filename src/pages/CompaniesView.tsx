import React, { useState, useEffect } from 'react';
import { Plus, Building2, Eye, EyeOff, Pencil, Trash2, X, Mail, Zap } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';
import { db } from '../services/dbService';
import { inputClasses, modalClasses, FullWidthField } from '../App';
import { canPerformAction } from '../utils/companyStatePolicy';

const CompaniesView: React.FC = () => {
  const { t } = useTranslation();
  const [companies, setCompanies] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [sendStatus, setSendStatus] = useState<Record<string, 'success' | 'error'>>({});

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    const data = await db.getAllCompanies();
    setCompanies(data);
  };

  const [formData, setFormData] = useState({
    companyName: '',
    adminId: '',
    adminName: '',
    username: '',
    password: '',
    isPremium: false,
    address: '',
    city: '',
    country: '',
    phone: '',
    email: '',
    vatNumber: '',
    sendWelcomeEmail: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEdit = (c: any) => {
    setEditingId(c.id);
    setFormData({
      companyName: c.name,
      adminId: c.adminId || '',
      adminName: c.adminName || '',
      username: c.username || '',
      password: c.password || '',
      isPremium: !!c.isPremium,
      address: c.address || '',
      city: c.city || '',
      country: c.country || '',
      phone: c.phone || '',
      email: c.email || '',
      vatNumber: c.vatNumber || '',
      sendWelcomeEmail: false,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm(t('reports.confirmDeleteCompany'))) {
      try {
        await db.deleteCompany(id);
        loadCompanies();
      } catch (err: any) {
        alert(t('reports.deleteError') + (err.message || JSON.stringify(err)));
      }
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    await db.toggleCompanyStatus(id, currentStatus);
    loadCompanies();
  };

  const handleTogglePremium = async (id: string, currentPremium: boolean) => {
    await db.togglePremiumStatus(id, currentPremium);
    loadCompanies();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingId) {
        // If the company is in pending status or needs repair, we should resume the setup flow
        const existingCompany = companies.find(c => c.id === editingId);
        if (canPerformAction(existingCompany, 'retry_setup')) {
          await db.resumeCompanySetup(editingId, {
            companyName: formData.companyName,
            adminName: formData.adminName,
            username: formData.username,
            password: formData.password,
            email: formData.email,
            phone: formData.phone,
            sendEmail: formData.sendWelcomeEmail
          });
        } else {
          // Normal update for an already active company
          await db.updateCompanyAndAdmin(editingId, formData.companyName, formData.adminId, formData.adminName, formData.username, formData.password, formData.sendWelcomeEmail, formData.email);
          await db.setPremiumStatus(editingId, formData.isPremium);
          await db.updateCompanyDetails(editingId, {
            address: formData.address,
            city: formData.city,
            country: formData.country,
            phone: formData.phone,
            email: formData.email,
            vatNumber: formData.vatNumber,
          });
        }
      } else {
        await db.registerCompany({
          ...formData,
          sendEmail: formData.sendWelcomeEmail
        });
      }
      setIsModalOpen(false);
      loadCompanies();
    } catch (err: any) {
      alert(t('common.genericError') + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendInstructions = async (c: any) => {
    if (!c.email || !c.adminId) {
      alert("Email o Admin ID mancante per questa ditta.");
      return;
    }

    try {
      setSendingId(c.id);
      await db.sendAccessInstructions(c.adminId);
      setSendStatus(prev => ({ ...prev, [c.id]: 'success' }));
      setTimeout(() => setSendStatus(prev => { const next = { ...prev }; delete next[c.id]; return next; }), 3000);
    } catch (err: any) {
      console.error('Failed to send instructions:', err);
      setSendStatus(prev => ({ ...prev, [c.id]: 'error' }));
      setTimeout(() => setSendStatus(prev => { const next = { ...prev }; delete next[c.id]; return next; }), 3000);
    } finally {
      setSendingId(null);
    }
  };

  const handlePrepareEmail = (c: any) => {
    const name = c.adminName || c.admin_name || 'Amministratore';
    const company = c.name || c.companyName || '';
    const subjectText = `Credenziali di accesso Jobs Report - ${company}`;
    const bodyText = 
      `Ciao ${name},\n\n` +
      `Ecco le tue credenziali di accesso per Jobs Report:\n\n` +
      `URL: https://jobs-report.vercel.app\n` +
      `Username: ${c.username}\n` +
      `Password: ${c.password || '********'}\n\n` +
      `Ti consigliamo di cambiare la password al primo accesso.\n\n` +
      `Buon lavoro,\n` +
      `Il team di JobsReport`;

    // Copy to clipboard as fallback
    navigator.clipboard.writeText(bodyText).catch(err => console.error('Clipboard copy failed:', err));

    const subject = encodeURIComponent(subjectText);
    const body = encodeURIComponent(bodyText);
    window.location.href = `mailto:${c.email}?subject=${subject}&body=${body}`;
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ companyName: '', adminId: '', adminName: '', username: '', password: '', isPremium: false, address: '', city: '', country: '', phone: '', email: '', vatNumber: '', sendWelcomeEmail: true });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">{t('dashboard.companiesManagement')}</h1>
        <button onClick={resetForm} className="px-4 py-2 bg-purple-600 text-white font-bold rounded-xl shadow-lg hover:bg-purple-700 transition-all">
          <Plus size={16} className="mr-2 inline" /> {t('dashboard.createCompanyBtn')}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-2 font-bold text-slate-500 uppercase text-[9px] tracking-wider">{t('dashboard.companyName')}</th>
                <th className="px-4 py-2 font-bold text-slate-500 uppercase text-[9px] tracking-wider">{t('dashboard.companyEmail')}</th>
                <th className="px-4 py-2 font-bold text-slate-500 uppercase text-[9px] tracking-wider">{t('dashboard.phone')}</th>
                <th className="px-4 py-2 font-bold text-slate-500 uppercase text-[9px] tracking-wider">{t('dashboard.premium')}</th>
                <th className="px-4 py-2 font-bold text-slate-500 uppercase text-[9px] tracking-wider">{t('dashboard.companyStatus')}</th>
                <th className="px-4 py-2 font-bold text-slate-500 uppercase text-[9px] tracking-wider text-right">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {companies.map(c => (
                <tr key={c.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-0">
                  <td className="px-4 py-2 font-bold text-slate-900 text-xs">{c.name}</td>
                  <td className="px-4 py-2 text-slate-500 text-[11px]">{c.email || '-'}</td>
                  <td className="px-4 py-2 text-slate-500 text-[11px]">{c.phone || '-'}</td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => handleTogglePremium(c.id, !!c.isPremium)}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black transition-all ${c.isPremium ? 'bg-amber-100 text-amber-700 ring-1 ring-amber-200' : 'bg-slate-100 text-slate-400'}`}
                    >
                      <Building2 size={10} />
                      {c.isPremium ? 'PREMIUM' : 'BASE'}
                    </button>
                  </td>
                  <td className="px-4 py-2 flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                      c.computed?.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 
                      (c.computed?.status === 'pending' || c.computed?.status === 'repair_pending') ? 'bg-amber-100 text-amber-700' : 
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {c.computed?.status === 'active' ? t('common.statusActive') : 
                       (c.computed?.status === 'pending' || c.computed?.status === 'repair_pending') ? 'IN SETUP' : t('common.statusInactive')}
                    </span>
                    {c.computed?.error && (
                      <span className="text-red-500 cursor-help" title={`Error at step ${c.setupStep}: ${c.computed.error}`}>
                        ⚠️
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right flex justify-end gap-1.5">
                    <button disabled={!canPerformAction(c, 'toggle_status')} onClick={() => handleToggleStatus(c.id, c.status)} className={`p-1.5 rounded-lg transition-colors ${c.status === 'active' ? 'text-amber-700 bg-amber-50 hover:bg-amber-100' : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'} disabled:opacity-30 disabled:cursor-not-allowed`} title={c.status === 'active' ? t('common.deactivate') : t('common.activate')}>
                      {c.status === 'active' ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    <button disabled={!canPerformAction(c, 'update_basic_settings')} onClick={() => handleEdit(c)} className="p-1.5 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed" title={t('common.edit')}>
                      <Pencil size={14} />
                    </button>
                    <button 
                      disabled={!canPerformAction(c, 'send_instructions')}
                      onClick={() => handlePrepareEmail({
                        adminName: c.admin_name,
                        companyName: c.name,
                        email: c.email,
                        username: c.username,
                        password: c.password
                      })} 
                      className="p-1.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed" 
                      title="Prepara Email Manuale"
                    >
                      <Mail size={14} />
                    </button>
                    <button 
                      disabled={sendingId === c.id || !c.email || !canPerformAction(c, 'send_instructions')}
                      onClick={() => handleSendInstructions(c)} 
                      className={`p-1.5 rounded-lg transition-all ${sendingId === c.id ? 'bg-slate-100 text-slate-400' : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'} disabled:opacity-30 disabled:cursor-not-allowed`} 
                      title="Invia Credenziali"
                    >
                      {sendingId === c.id ? (
                        <div className="w-3.5 h-3.5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                      ) : (
                        <Zap size={14} />
                      )}
                    </button>
                    {sendStatus[c.id] && (
                      <span className={`flex items-center text-sm font-bold ${sendStatus[c.id] === 'success' ? 'text-emerald-600' : 'text-red-500'}`}>
                        {sendStatus[c.id] === 'success' ? '✓' : '✗'}
                      </span>
                    )}
                    <button onClick={() => handleDelete(c.id)} className="p-1.5 text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors" title={t('common.delete')}>
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {companies.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-slate-500 italic">{t('common.noData')}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className={modalClasses}>
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h2 className="text-xl font-bold text-slate-900">{editingId ? t('dashboard.editCompany') : t('dashboard.createCompanyBtn')}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FullWidthField label={t('dashboard.companyName')}>
                  <input type="text" required value={formData.companyName} onChange={e => setFormData({ ...formData, companyName: e.target.value })} className={inputClasses} placeholder={t('dashboard.companyNamePlaceholder')} />
                </FullWidthField>
                <FullWidthField label={t('dashboard.adminName')}>
                  <input type="text" required value={formData.adminName} onChange={e => setFormData({ ...formData, adminName: e.target.value })} className={inputClasses} placeholder={t('auth.placeholderName')} />
                </FullWidthField>
                <FullWidthField label={t('dashboard.adminUsername')}>
                  <input type="text" required value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} className={inputClasses} placeholder={t('auth.usernamePlaceholder')} />
                </FullWidthField>
                <FullWidthField label={t('dashboard.adminPassword')}>
                  <input type="text" required={!editingId} value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className={inputClasses} placeholder={t('dashboard.tempPasswordPlaceholder')} />
                </FullWidthField>
              </div>

              <div className="pt-2 border-t">
                <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">📋 {t('dashboard.corporateData')}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FullWidthField label={t('dashboard.address')}>
                    <input type="text" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className={inputClasses} placeholder={t('auth.placeholderAddress')} />
                  </FullWidthField>
                  <FullWidthField label={t('dashboard.city')}>
                    <input type="text" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} className={inputClasses} placeholder={t('auth.placeholderCity')} />
                  </FullWidthField>
                  <FullWidthField label={t('dashboard.country')}>
                    <input type="text" value={formData.country} onChange={e => setFormData({ ...formData, country: e.target.value })} className={inputClasses} placeholder={t('dashboard.italy')} />
                  </FullWidthField>
                  <FullWidthField label={t('dashboard.phone')}>
                    <input type="text" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className={inputClasses} placeholder={t('auth.phonePlaceholder')} />
                  </FullWidthField>
                  <FullWidthField label={t('dashboard.companyEmail')}>
                    <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className={inputClasses} placeholder={t('auth.placeholderEmail')} />
                  </FullWidthField>
                  <FullWidthField label={t('dashboard.vatNumber')}>
                    <input type="text" value={formData.vatNumber} onChange={e => setFormData({ ...formData, vatNumber: e.target.value })} className={inputClasses} placeholder={t('auth.placeholderVat')} />
                  </FullWidthField>
                </div>
              </div>

              <div className="space-y-4">
                {editingId ? (
                  <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <div>
                      <p className="text-sm font-bold text-amber-800">{t('dashboard.premiumPlan')}</p>
                      <p className="text-xs text-amber-600">{t('dashboard.premiumPlanDesc')}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, isPremium: !formData.isPremium })}
                      className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none ${formData.isPremium ? 'bg-amber-500' : 'bg-slate-300'
                        }`}
                    >
                      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${formData.isPremium ? 'translate-x-8' : 'translate-x-1'
                        }`} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-100 rounded-xl">
                    <div>
                      <p className="text-sm font-bold text-blue-800">{t('dashboard.premiumPlan')}</p>
                      <p className="text-xs text-blue-600">Attiva subito le funzionalità premium per questa ditta.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, isPremium: !formData.isPremium })}
                      className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none ${formData.isPremium ? 'bg-blue-500' : 'bg-slate-300'
                        }`}
                    >
                      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${formData.isPremium ? 'translate-x-8' : 'translate-x-1'
                        }`} />
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                  <div className="flex-1">
                    <p className="text-sm font-bold text-emerald-800">Invio Credenziali</p>
                    <p className="text-xs text-emerald-600 mb-2">
                      {editingId ? "Inserisci una password sopra per inviarla al cliente." : "Invia automaticamente username e password all'indirizzo email della ditta."}
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={sendingId === editingId || !formData.email}
                        onClick={() => {
                          if (editingId) {
                             handleSendInstructions({ id: editingId, adminId: formData.adminId, email: formData.email, name: formData.companyName });
                          } else {
                             setFormData({ ...formData, sendWelcomeEmail: !formData.sendWelcomeEmail });
                          }
                        }}
                        className={`px-3 py-1.5 text-[10px] font-black rounded-lg transition-all ${formData.sendWelcomeEmail || (editingId && sendStatus[editingId] === 'success') ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-200 text-slate-500'}`}
                      >
                        {sendingId === editingId ? "INVIO IN CORSO..." : (formData.sendWelcomeEmail ? "AUTO-INVIO ATTIVO" : "INVIA ISTRUZIONI (AUTO)")}
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePrepareEmail({ 
                          companyName: formData.companyName, 
                          adminName: formData.adminName, 
                          email: formData.email, 
                          username: formData.username, 
                          password: formData.password 
                        })}
                        className="px-3 py-1.5 text-[10px] font-black rounded-lg bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50 shadow-sm"
                      >
                        PREPARA EMAIL (MANUALE)
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-6 border-t mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 font-bold text-slate-500 hover:text-slate-700 transition-colors">{t('common.cancel')}</button>
                <button type="submit" disabled={isSubmitting} className="px-10 py-2.5 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50">
                  {isSubmitting ? '...' : (editingId ? t('common.update') : t('dashboard.createCompanyBtn'))}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompaniesView;
