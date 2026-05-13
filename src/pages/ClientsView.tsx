import React, { useState } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { useClients } from '../hooks/useClients';
import { User, Client } from '../types';
import { inputClasses, modalClasses, FullWidthField } from '../App';

interface ClientsViewProps {
  t: (key: string) => string;
  user: User;
}

const ClientsView: React.FC<ClientsViewProps> = ({ t, user }) => {
  const {
    data: clients = [],
    createClient,
    updateClient,
    deleteClient
  } = useClients(user?.companyId ?? undefined, user?.id);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    vatNumber: '',
    billingAddress: '',
    mainContactName: '',
    mainContactPhone: '',
    email: '',
    status: 'active' as 'active' | 'inactive',
    notes: ''
  });

  const handleEdit = (c: Client) => {
    setEditingId(c.id);
    setFormData({
      name: c.name,
      vatNumber: c.vatNumber || '',
      billingAddress: c.billingAddress || '',
      mainContactName: c.mainContactName || '',
      mainContactPhone: c.mainContactPhone || '',
      email: c.email || '',
      status: c.status || 'active',
      notes: c.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleLocalDelete = (id: string) => {
    if (confirm(t('common.confirmDelete'))) {
      deleteClient.mutate(id);
    }
  };

  const handleLocalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await updateClient.mutateAsync({ id: editingId, data: formData });
    } else {
      await createClient.mutateAsync(formData);
    }
    setIsModalOpen(false);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      name: '',
      vatNumber: '',
      billingAddress: '',
      mainContactName: '',
      mainContactPhone: '',
      email: '',
      status: 'active',
      notes: ''
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">{t('projects.clientsTitle')}</h1>
        <button onClick={resetForm} className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-all">
          <Plus size={16} className="mr-2 inline" /> {t('projects.clientNew')}
        </button>
      </div>
      <div className="grid grid-cols-1 gap-2">
        {clients.map(c => (
          <div key={c.id} className={`bg-white px-4 py-3 rounded-xl border ${c.status === 'active' ? 'border-slate-200' : 'border-slate-100 opacity-60'} flex justify-between items-center group hover:border-blue-200 hover:shadow-md transition-all`}>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-slate-900 text-base truncate">{c.name}</h3>
              <p className="text-xs text-slate-500 font-medium mt-1 truncate">
                {c.mainContactName ? `${c.mainContactName} ${c.mainContactPhone ? ` • ${c.mainContactPhone}` : ''}` : '---'}
              </p>
            </div>
            <div className="flex gap-2 shrink-0 ml-4 items-center">
              <button onClick={() => handleEdit(c)} className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"><Pencil size={18} /></button>
              <button onClick={() => handleLocalDelete(c.id)} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"><Trash2 size={18} /></button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center sm:p-4">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className={modalClasses}>
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h2 className="text-xl font-bold text-slate-900">{editingId ? t('projects.clientEdit') : t('projects.clientNew')}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleLocalSubmit} className="space-y-4">
              <div className="flex flex-col gap-y-4 max-w-lg mx-auto">
                <FullWidthField label={t('projects.clientName')}>
                  <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className={inputClasses} />
                </FullWidthField>
                <FullWidthField label={t('projects.clientVat')}>
                  <input type="text" value={formData.vatNumber} onChange={e => setFormData({ ...formData, vatNumber: e.target.value })} className={inputClasses} />
                </FullWidthField>
                <FullWidthField label={t('projects.clientContact')}>
                  <input type="text" value={formData.mainContactName} onChange={e => setFormData({ ...formData, mainContactName: e.target.value })} className={inputClasses} />
                </FullWidthField>
                <FullWidthField label={t('projects.clientPhone')}>
                  <input type="tel" value={formData.mainContactPhone} onChange={e => setFormData({ ...formData, mainContactPhone: e.target.value })} className={inputClasses} />
                </FullWidthField>
                <FullWidthField label={t('projects.clientEmail')}>
                  <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className={inputClasses} />
                </FullWidthField>
                <FullWidthField label={t('projects.clientAddress')}>
                  <input type="text" value={formData.billingAddress} onChange={e => setFormData({ ...formData, billingAddress: e.target.value })} className={inputClasses} />
                </FullWidthField>
                <FullWidthField label={t('projects.clientNotes')}>
                  <textarea rows={3} value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} className={inputClasses} placeholder={t('projects.internalNotes')} />
                </FullWidthField>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t mt-4">
                <div className="flex items-center gap-3">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-tight">{t('projects.clientStatus')}:</label>
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button type="button" onClick={() => setFormData({ ...formData, status: 'active' })} className={`px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${formData.status === 'active' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>{t('projects.clientActive')}</button>
                    <button type="button" onClick={() => setFormData({ ...formData, status: 'inactive' })} className={`px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${formData.status === 'inactive' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-400'}`}>{t('projects.clientInactive')}</button>
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
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientsView;
