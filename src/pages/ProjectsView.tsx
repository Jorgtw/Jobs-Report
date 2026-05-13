import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, MapPin, Phone } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';
import { db } from '../services/dbService';
import { authService } from '../services/authService';
import { User, Project } from '../types';
import { useProjects } from '../hooks/useProjects';
import { useClients } from '../hooks/useClients';
import { inputClasses, modalClasses, FullWidthField, canUserAccessProject } from '../App';
import Tooltip from '../components/common/Tooltip';

interface ProjectsViewProps {
  user: User;
}

const ProjectsView: React.FC<ProjectsViewProps> = ({ user }) => {
  const { data: projects = [], createProject, updateProject, deleteProject } = useProjects(user?.companyId ?? undefined, user?.id);
  const { data: clients = [] } = useClients(user?.companyId ?? undefined, user?.id);
  const { t } = useTranslation();
  const [personnel, setPersonnel] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!user?.companyId) return;
      db.setCompanyId(user.companyId);
      const [u] = await Promise.all([db.getUsers()]);
      setPersonnel(u.filter((usr: User) => usr.status === 'active'));
    };
    load();
  }, [user?.companyId]);

  const [formData, setFormData] = useState({
    clientId: '',
    name: '',
    description: '',
    address: '',
    notes: '',
    status: 'active' as 'active' | 'closed',
    siteContactName: '',
    siteContactPhone: '',
    siteContactEmail: '',
    siteContactRole: '',
    financialAgreement: 'hourly' as 'hourly' | 'fixed',
    sellingPrice: 0,
    isInternal: false,
    assignedWorkerIds: [] as string[]
  });

  const handleEdit = (p: Project) => {
    setEditingId(p.id);
    setFormData({
      clientId: p.clientId,
      name: p.name,
      description: p.description,
      address: p.address || '',
      notes: p.notes || '',
      status: p.status,
      siteContactName: p.siteContactName || '',
      siteContactPhone: p.siteContactPhone || '',
      siteContactEmail: p.siteContactEmail || '',
      siteContactRole: p.siteContactRole || '',
      financialAgreement: p.financialAgreement || 'hourly',
      sellingPrice: p.sellingPrice || 0,
      isInternal: p.isInternal || false,
      assignedWorkerIds: p.assignedWorkerIds || []
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm(t('common.confirmDelete'))) {
      await deleteProject.mutateAsync(id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateProject.mutateAsync({ id: editingId, data: formData });
      } else {
        await createProject.mutateAsync(formData);
      }
      setIsModalOpen(false);
    } catch (error: any) {
      console.error('Error saving project:', error);
      alert(t('common.saveError') + (error.message || error.code || 'Unknown error'));
    }
  };

  const resetForm = async (isInternal = false) => {
    let internalClientId = '';
    if (isInternal) {
      const internalClient = await db.getInternalClient();
      if (internalClient) {
        internalClientId = internalClient.id;
      } else {
        internalClientId = 'internal';
      }
    }

    setEditingId(null);
    setFormData({
      clientId: isInternal ? internalClientId : '',
      name: '',
      description: '',
      address: '',
      notes: '',
      status: 'active',
      siteContactName: '',
      siteContactPhone: '',
      siteContactEmail: '',
      siteContactRole: '',
      financialAgreement: 'hourly',
      sellingPrice: 0,
      isInternal,
      assignedWorkerIds: []
    });
    setIsModalOpen(true);
  };

  const editingProject = editingId ? projects.find(p => p.id === editingId) : null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-slate-900">{t('projects.listTitle')}</h1>
        {authService.can(user, 'create', 'projects') && (
          <div className="flex gap-2">
            <button onClick={() => resetForm(false)} className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-all flex items-center gap-2">
              <Plus size={16} /> {t('projects.new')}
            </button>
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 gap-2">
        {projects.filter(p => authService.can(user, 'approve', 'reports') ? true : canUserAccessProject(p, user.id)).map(p => {
          const client = clients.find(c => c.id === p.clientId);
          return (
            <div key={p.id} className={`bg-white px-4 py-3 rounded-xl border ${p.status === 'active' ? 'border-slate-200' : 'border-slate-100 opacity-60'} flex justify-between items-center group hover:border-blue-200 hover:shadow-md transition-all`}>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="font-bold text-slate-900 text-base truncate">{p.name}</h3>
                  {p.isInternal && <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 text-[9px] font-black rounded uppercase tracking-wider border border-indigo-100">{t('projects.activityInternal')}</span>}
                </div>
                <p className="text-xs text-slate-500 font-medium truncate uppercase tracking-tight">
                  {client?.name || '---'}
                </p>
              </div>
              <div className="flex gap-2 shrink-0 ml-4 items-center">
                <button onClick={() => handleEdit(p)} className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                  {authService.can(user, 'update', 'projects') ? <Pencil size={18} /> : <Plus size={18} />}
                </button>
                {authService.can(user, 'delete', 'projects') && (
                  <button onClick={() => handleDelete(p.id)} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"><Trash2 size={18} /></button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center sm:p-4">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className={modalClasses}>
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h2 className="text-xl font-bold text-slate-900">
                {editingId
                  ? (authService.can(user, 'update', 'projects') ? t('projects.edit') : (editingProject?.name || '---'))
                  : t('projects.new')
                }
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>

            {authService.can(user, 'update', 'projects') ? (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                  <FullWidthField label={t('projects.isInternal')} className="md:col-span-2">
                    <div className="flex bg-slate-100 p-1 rounded-xl w-full max-w-xs">
                      <button type="button" onClick={() => setFormData({ ...formData, isInternal: false, clientId: '' })} className={`flex-1 px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${!formData.isInternal ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>{t('common.no')}</button>
                      <button type="button" onClick={() => setFormData({ ...formData, isInternal: true, clientId: 'internal', financialAgreement: 'fixed', sellingPrice: 0 })} className={`flex-1 px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${formData.isInternal ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>{t('common.yes')}</button>
                    </div>
                  </FullWidthField>
                  <FullWidthField label={t('projects.client')}>
                    {!formData.isInternal && (
                      <select required value={formData.clientId} onChange={e => setFormData({ ...formData, clientId: e.target.value })} className={inputClasses}>
                        <option value="">{t('common.select')}</option>
                        {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    )}
                    {formData.isInternal && (
                      <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 text-sm italic">
                        {t('projects.activityInternal')}
                      </div>
                    )}
                  </FullWidthField>
                  <FullWidthField label={t('projects.title')}>
                    <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className={inputClasses} />
                  </FullWidthField>
                  <div className="md:col-span-2">
                    <FullWidthField label={t('projects.descriptionLabel')}>
                      <textarea rows={2} required value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className={inputClasses} />
                    </FullWidthField>
                  </div>
                  <FullWidthField label={t('projects.address')}>
                    <input type="text" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className={inputClasses} />
                  </FullWidthField>
                  {!formData.isInternal && (
                    <FullWidthField label={t('projects.billingType')}>
                      <div className="flex bg-slate-100 p-1 rounded-xl">
                        <button type="button" onClick={() => setFormData({ ...formData, financialAgreement: 'hourly' })} className={`flex-1 px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${formData.financialAgreement === 'hourly' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>{t('projects.billingHourly')}</button>
                        <button type="button" onClick={() => setFormData({ ...formData, financialAgreement: 'fixed' })} className={`flex-1 px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${formData.financialAgreement === 'fixed' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>{t('projects.billingFixed')}</button>
                      </div>
                    </FullWidthField>
                  )}
                  {formData.isInternal && (
                    <FullWidthField label={t('projects.billingType')}>
                      <div className="px-3 py-1.5 bg-amber-50 border border-amber-100 rounded-lg text-amber-700 text-sm font-bold">
                        {t('projects.nonBillable')}
                      </div>
                    </FullWidthField>
                  )}
                  {!formData.isInternal && (
                    <FullWidthField label={t('projects.budgetAmount')}>
                      <div className="flex items-center gap-2">
                        <input type="number" step="0.01" value={formData.sellingPrice} onChange={e => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })} className={inputClasses} />
                        <Tooltip text={t('projects.tooltipSellingPrice')} />
                      </div>
                    </FullWidthField>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <FullWidthField label={t('projects.contactPerson')}>
                      <input type="text" value={formData.siteContactName} onChange={e => setFormData({ ...formData, siteContactName: e.target.value })} className={inputClasses} />
                    </FullWidthField>
                    <FullWidthField label={t('projects.phone')}>
                      <input type="tel" value={formData.siteContactPhone} onChange={e => setFormData({ ...formData, siteContactPhone: e.target.value })} className={inputClasses} />
                    </FullWidthField>
                  </div>
                  <div className="md:col-span-2">
                    <FullWidthField label={t('projects.internalNotes')}>
                      <textarea rows={2} value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} className={inputClasses} />
                    </FullWidthField>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase ml-1 tracking-tight">{t('projects.assignedPersonnel')}:</label>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 max-h-40 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {personnel.map(u => (
                        <label key={u.id} className="flex items-center gap-2 p-1.5 hover:bg-white rounded-lg transition-colors cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={formData.assignedWorkerIds.includes(u.id)}
                            onChange={e => {
                              const newIds = e.target.checked
                                ? [...formData.assignedWorkerIds, u.id]
                                : formData.assignedWorkerIds.filter(id => id !== u.id);
                              setFormData({ ...formData, assignedWorkerIds: newIds });
                            }}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-xs font-medium text-slate-700 group-hover:text-blue-600">{u.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t mt-4">
                  <div className="flex items-center gap-3">
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-tight">{t('projects.status')}:</label>
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                      <button type="button" onClick={() => setFormData({ ...formData, status: 'active' })} className={`px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${formData.status === 'active' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>{t('projects.statusActive')}</button>
                      <button type="button" onClick={() => setFormData({ ...formData, status: 'closed' })} className={`px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${formData.status === 'closed' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-400'}`}>{t('projects.statusClosed')}</button>
                    </div>
                  </div>
                  <div className="flex gap-3 w-full sm:w-auto">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 sm:flex-none px-6 py-2.5 font-bold text-slate-500 hover:text-slate-700 transition-colors">{t('common.cancel')}</button>
                    <button type="submit" className="flex-1 sm:flex-none px-10 py-2.5 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">
                      {editingId ? t('common.update') : t('common.save')}
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              /* Operational View for Operators/Supervisors */
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('projects.client')}</label>
                      <p className="text-lg font-bold text-slate-900">{clients.find(c => c.id === formData.clientId)?.name || '---'}</p>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('projects.title')}</label>
                      <p className="text-xl font-black text-blue-600">{formData.name}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {formData.address && (
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('projects.address')}</label>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formData.address)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-slate-700 hover:text-blue-600 transition-colors group"
                        >
                          <span className="font-bold border-b border-dashed border-slate-300 group-hover:border-blue-300">{formData.address}</span>
                          <MapPin size={16} className="text-blue-500" />
                        </a>
                      </div>
                    )}
                    {formData.siteContactPhone && (
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('projects.contactPerson')}</label>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900">{formData.siteContactName || '---'}</span>
                          <a
                            href={`tel:${formData.siteContactPhone}`}
                            className="flex items-center gap-2 text-blue-600 font-black hover:scale-105 transition-transform origin-left w-fit"
                          >
                            <Phone size={16} /> {formData.siteContactPhone}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">{t('projects.descriptionLabel')}</label>
                  <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap font-medium italic">
                    {formData.description || t('common.noData')}
                  </p>
                </div>

                {formData.assignedWorkerIds.length > 0 && (
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block">{t('projects.assignedPersonnel')}</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {personnel.filter(u => formData.assignedWorkerIds.includes(u.id)).map(u => (
                        <div key={u.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                          <span className="text-xs font-bold text-slate-900">{u.name}</span>
                          {u.phone && (
                            <a href={`tel:${u.phone}`} className="text-blue-600 p-1.5 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                              <Phone size={14} />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-4">
                  <button onClick={() => setIsModalOpen(false)} className="px-10 py-3 bg-slate-900 text-white rounded-2xl font-black shadow-lg hover:bg-slate-800 transition-all uppercase tracking-widest text-[10px]">
                    {t('common.back' as any) || 'Chiudi'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsView;
