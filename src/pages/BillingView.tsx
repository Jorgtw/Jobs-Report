import React, { useState, useMemo } from 'react';
import { FileText, Download, CheckCircle, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { db } from '../services/dbService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '../contexts/LanguageContext';
import { Client, Project, WorkReport } from '../types';
import { exportInvoiceToPDF, exportInvoiceToExcel } from '../services/exportService';

const localeMap: Record<string, string> = {
  it: 'it-IT',
  en: 'en-US'
};

const BillingView: React.FC = () => {
  const { lang: language } = useTranslation();
  const queryClient = useQueryClient();
  
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedReportIds, setSelectedReportIds] = useState<string[]>([]);
  const [hideExported, setHideExported] = useState<boolean>(true);
  
  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: () => db.getClients()
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: () => db.getProjects()
  });

  const { data: reports = [] } = useQuery<WorkReport[]>({
    queryKey: ['reports'],
    queryFn: () => db.getReports()
  });

  const availableReports = useMemo(() => {
    return reports.filter(r => {
      const matchClient = selectedClientId ? projects.find(p => p.id === r.projectId)?.clientId === selectedClientId : false;
      const matchProject = selectedProjectId ? r.projectId === selectedProjectId : true;
      const matchStatus = hideExported ? r.exportStatus !== 'exported' : true;
      return matchClient && matchProject && matchStatus;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [reports, selectedClientId, selectedProjectId, projects, hideExported]);

  const markExportedMutation = useMutation({
    mutationFn: (reportIds: string[]) => db.markReportsAsExported(reportIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      setSelectedReportIds([]);
    }
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: 'new' | 'exported' }) => db.toggleReportExportStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    }
  });

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedReportIds(availableReports.map(r => r.id));
    } else {
      setSelectedReportIds([]);
    }
  };

  const handleSelectReport = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedReportIds(prev => [...prev, id]);
    } else {
      setSelectedReportIds(prev => prev.filter(reportId => reportId !== id));
    }
  };

  const handleExportPDF = async () => {
    const selectedReports = reports.filter(r => selectedReportIds.includes(r.id));
    if (selectedReports.length === 0 || !selectedClientId) {
      alert('Seleziona almeno un rapportino e un cliente');
      return;
    }
    const client = clients.find(c => c.id === selectedClientId);
    const project = projects.find(p => p.id === selectedProjectId);
    exportInvoiceToPDF(selectedReports, client, project, language);
    await markExportedMutation.mutateAsync(selectedReportIds);
  };

  const handleExportExcel = async () => {
    const selectedReports = reports.filter(r => selectedReportIds.includes(r.id));
    if (selectedReports.length === 0 || !selectedClientId) {
      alert('Seleziona almeno un rapportino e un cliente');
      return;
    }
    const client = clients.find(c => c.id === selectedClientId);
    const project = projects.find(p => p.id === selectedProjectId);
    exportInvoiceToExcel(selectedReports, client, project, language);
    await markExportedMutation.mutateAsync(selectedReportIds);
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto pb-24 lg:pb-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <FileText className="text-blue-600" /> Report Interventi
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Genera l'allegato dei lavori per l'amministrazione o per il cliente.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Cliente</label>
            <select 
              value={selectedClientId} 
              onChange={(e) => { setSelectedClientId(e.target.value); setSelectedProjectId(''); setSelectedReportIds([]); }}
              className="w-full border-slate-300 rounded-lg text-sm p-2"
            >
              <option value="">-- Seleziona Cliente --</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Progetto (Opzionale)</label>
            <select 
              value={selectedProjectId} 
              onChange={(e) => { setSelectedProjectId(e.target.value); setSelectedReportIds([]); }}
              className="w-full border-slate-300 rounded-lg text-sm p-2"
              disabled={!selectedClientId}
            >
              <option value="">-- Tutti i progetti --</option>
              {projects.filter(p => p.clientId === selectedClientId).map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        {selectedClientId && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={selectedReportIds.length === availableReports.length && availableReports.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <span className="text-sm font-bold text-slate-700">Seleziona Tutti ({availableReports.length})</span>
                </label>
                
                <div className="h-6 w-px bg-slate-300 mx-2 hidden sm:block"></div>
                
                <button 
                  onClick={() => { setHideExported(!hideExported); setSelectedReportIds([]); }}
                  className={`text-sm font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${hideExported ? 'text-amber-700 bg-amber-100/50 hover:bg-amber-100' : 'text-slate-600 bg-slate-200/50 hover:bg-slate-200'}`}
                >
                  {hideExported ? <EyeOff size={16} /> : <Eye size={16} />}
                  {hideExported ? 'Nascondi Già Esportati' : 'Mostra Tutti'}
                </button>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={handleExportPDF}
                  disabled={selectedReportIds.length === 0 || markExportedMutation.isPending}
                  className="flex-1 sm:flex-none px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                >
                  <Download size={16} /> PDF
                </button>
                <button
                  onClick={handleExportExcel}
                  disabled={selectedReportIds.length === 0 || markExportedMutation.isPending}
                  className="flex-1 sm:flex-none px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                >
                  <Download size={16} /> Excel
                </button>
              </div>
            </div>

            <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
              {availableReports.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm font-medium">
                  Nessun rapportino trovato per questa selezione.
                </div>
              ) : (
                availableReports.map(r => {
                  const p = projects.find(proj => proj.id === r.projectId);
                  let h = r.totalHours || 0;
                  r.additionalWorkers?.forEach(aw => { h += aw.totalHours || 0; });
                  const isExported = r.exportStatus === 'exported';
                  
                  return (
                    <div key={r.id} className={`flex items-center p-4 transition-colors ${isExported ? 'bg-slate-50/50' : 'hover:bg-blue-50/30'}`}>
                      <input 
                        type="checkbox" 
                        checked={selectedReportIds.includes(r.id)}
                        onChange={(e) => handleSelectReport(r.id, e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 mr-4 flex-shrink-0 cursor-pointer"
                      />
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-sm font-black text-slate-800">{new Date(r.date).toLocaleDateString(localeMap[language] || 'it-IT')}</span>
                          <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-bold truncate max-w-[200px]">
                            {p?.name}
                          </span>
                          {isExported ? (
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider border border-slate-200 flex items-center gap-1">
                              <CheckCircle size={10} /> Esportato
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider border border-emerald-200">
                              Nuovo
                            </span>
                          )}
                        </div>
                        <p className={`text-xs line-clamp-1 ${isExported ? 'text-slate-400' : 'text-slate-600'}`}>{r.description || 'Nessuna descrizione'}</p>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right w-16">
                          <div className={`text-sm font-black ${isExported ? 'text-slate-500' : 'text-slate-800'}`}>{h.toFixed(2)}h</div>
                        </div>
                        <button
                          onClick={() => toggleStatusMutation.mutate({ id: r.id, status: isExported ? 'new' : 'exported' })}
                          className={`p-2 rounded-lg transition-colors ${isExported ? 'text-slate-400 hover:text-slate-600 hover:bg-slate-200' : 'text-emerald-500 hover:text-emerald-700 hover:bg-emerald-100'}`}
                          title={isExported ? 'Segna come Nuovo' : 'Segna come Esportato'}
                        >
                          <RefreshCw size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BillingView;
