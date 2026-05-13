import React, { useState, useEffect } from 'react';
import { Plus, Building2, Pencil, Trash2, X } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';
import { db } from '../services/dbService';
import { Subcontractor } from '../types';
import { inputClasses, modalClasses, FullWidthField } from '../App';

const SubcontractorsView: React.FC = () => {
  const { t } = useTranslation();
  const [subs, setSubs] = useState<Subcontractor[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    db.getSubcontractors().then(setSubs);
  }, []);

  const [formData, setFormData] = useState({
    name: '',
    vatNumber: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    billingType: 'hourly' as 'hourly' | 'fixed',
    amount: 0,
    status: 'active' as 'active' | 'inactive',
    notes: ''
  });

  const handleEdit = (s: Subcontractor) => {
    setEditingId(s.id);
    setFormData({
      name: s.name,
      vatNumber: s.vatNumber || '',
      contactPerson: s.contactPerson || '',
      phone: s.phone || '',
      email: s.email || '',
      address: s.address || '',
      billingType: s.billingType || 'hourly',
      amount: s.amount || 0,
      status: s.status || 'active',
      notes: s.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm(t('common.confirmDelete'))) {
      await db.deleteSubcontractor(id);
      setSubs(await db.getSubcontractors());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await db.updateSubcontractor(editingId, formData);
    } else {
      await db.addSubcontractor(formData);
    }
    setSubs(await db.getSubcontractors());
    setIsModalOpen(false);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      name: '',
      vatNumber: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      billingType: 'hourly',
      amount: 0,
      status: 'active',
      notes: ''
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">{t('projects.subcontractorsTitle')}</h1>
        <button onClick={resetForm} className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-all">
          <Plus size={16} className="mr-2 inline" /> {t('projects.subcontractorNew')}
        </button>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {subs.map(s => (
          <div key={s.id} className={`bg-white p-4 rounded-2xl border ${s.status === 'active' ? 'border-slate-200' : 'border-slate-100 opacity-60'} flex justify-between items-center group hover:border-blue-200 hover:shadow-md transition-all`}>
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${s.status === 'active' ? 'bg-cyan-50 text-cyan-500' : 'bg-slate-50 text-slate-400'}`}>
                <Building2 size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-slate-900 text-base truncate">{s.name}</h3>
                <p className="text-xs text-slate-500 font-medium mt-1 truncate">
                  {s.contactPerson ? `${s.contactPerson} ${s.phone ? ` • ${s.phone}` : ''}` : '---'}
                </p>
              </div>
            </div>
            <div className="flex gap-2 shrink-0 ml-4 items-center">
              <button onClick={() => handleEdit(s)} className="p-2.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"><Pencil size={18} /></button>
              <button onClick={() => handleDelete(s.id)} className="p-2.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"><Trash2 size={18} /></button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center sm:p-4">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className={modalClasses}>
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h2 className="text-xl font-bold text-slate-900">{editingId ? t('projects.subcontractorEdit') : t('projects.subcontractorNew')}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                <FullWidthField label={t('projects.subcontractorName')}>
                  <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className={inputClasses} />
                </FullWidthField>
                <FullWidthField label={t('projects.clientVat')}>
                  <input type="text" value={formData.vatNumber} onChange={e => setFormData({ ...formData, vatNumber: e.target.value })} className={inputClasses} />
                </FullWidthField>
                <FullWidthField label={t('projects.subcontractorContact')}>
                  <input type="text" value={formData.contactPerson} onChange={e => setFormData({ ...formData, contactPerson: e.target.value })} className={inputClasses} />
                </FullWidthField>
                <FullWidthField label={t('projects.subcontractorPhone')}>
                  <input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className={inputClasses} />
                </FullWidthField>
                <FullWidthField label={t('projects.subcontractorEmail')}>
                  <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className={inputClasses} />
                </FullWidthField>
                <FullWidthField label={t('projects.subcontractorAddress')}>
                  <input type="text" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className={inputClasses} />
                </FullWidthField>
                <FullWidthField label={t('projects.subcontractorBillingType')}>
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button type="button" onClick={() => setFormData({ ...formData, billingType: 'hourly' })} className={`flex-1 px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${formData.billingType === 'hourly' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>{t('projects.billingHourly')}</button>
                    <button type="button" onClick={() => setFormData({ ...formData, billingType: 'fixed' })} className={`flex-1 px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${formData.billingType === 'fixed' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>{t('projects.billingFixed')}</button>
                  </div>
                </FullWidthField>
                <FullWidthField label={t('projects.subcontractorAmount')}>
                  <div className="relative flex items-center">
                    <input type="number" step="0.01" value={formData.amount} onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })} className={inputClasses} />
                  </div>
                </FullWidthField>
                <div className="md:col-span-2">
                  <FullWidthField label={t('projects.subcontractorNotes')}>
                    <textarea rows={2} value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} className={inputClasses} placeholder={t('projects.internalNotes')} />
                  </FullWidthField>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t mt-4">
                <div className="flex items-center gap-3">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-tight">{t('projects.subcontractorStatus')}:</label>
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button type="button" onClick={() => setFormData({ ...formData, status: 'active' })} className={`px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${formData.status === 'active' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>{t('projects.subcontractorActive')}</button>
                    <button type="button" onClick={() => setFormData({ ...formData, status: 'inactive' })} className={`px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${formData.status === 'inactive' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-400'}`}>{t('projects.subcontractorInactive')}</button>
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

export default SubcontractorsView;
