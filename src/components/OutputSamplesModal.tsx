import React, { useState } from 'react';
import { X, FileText, FileDown, FileSpreadsheet, Eye, ShieldAlert, Sparkles, User, Camera, PenLine, Smile } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';
import { 
  getSampleDataPackage, 
  generateSampleInterventionPDF, 
  generateSamplePDFReport, 
  generateSampleExcelReport 
} from '../services/sampleDataService';

interface OutputSamplesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OutputSamplesModal: React.FC<OutputSamplesModalProps> = ({ isOpen, onClose }) => {
  const { lang } = useTranslation();
  const [activeTab, setActiveTab] = useState<'intervention' | 'pdf' | 'excel'>('intervention');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  if (!isOpen) return null;

  const sampleData = getSampleDataPackage();

  const handleGenerate = async (type: 'intervention' | 'pdf' | 'excel') => {
    try {
      setIsGenerating(true);
      if (type === 'intervention') {
        await generateSampleInterventionPDF(lang);
      } else if (type === 'pdf') {
        await generateSamplePDFReport(lang);
      } else if (type === 'excel') {
        await generateSampleExcelReport(lang);
      }
    } catch (err) {
      console.error('Error generating sample file:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex justify-between items-center relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <Eye size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold">Anteprima Documenti & Risultati</h2>
              <p className="text-xs text-slate-300">Esempi di documenti operativi generati da Jobs-Report</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Warning / Sample Info Banner */}
        <div className="bg-amber-50 border-b border-amber-100 px-6 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-800 text-xs font-semibold">
            <ShieldAlert size={16} className="text-amber-600 shrink-0" />
            <span>DATI DIMOSTRATIVI • Nessun costo o importo economico incluso</span>
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider bg-amber-200/60 text-amber-900 px-2 py-0.5 rounded-full">
            Esempio
          </span>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50 p-2 gap-2">
          <button
            onClick={() => setActiveTab('intervention')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'intervention'
                ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/60'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
            }`}
          >
            <FileText size={16} />
            <span>1. Rapporto Intervento</span>
          </button>

          <button
            onClick={() => setActiveTab('pdf')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'pdf'
                ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/60'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
            }`}
          >
            <FileDown size={16} />
            <span>2. PDF Sede</span>
          </button>

          <button
            onClick={() => setActiveTab('excel')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'excel'
                ? 'bg-white text-emerald-600 shadow-sm border border-slate-200/60'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
            }`}
          >
            <FileSpreadsheet size={16} />
            <span>3. Foglio Excel</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          
          {/* TAB 1: RAPPORTO INTERVENTO */}
          {activeTab === 'intervention' && (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3">
                <div className="flex justify-between items-start border-b border-slate-200 pb-3">
                  <div>
                    <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                      Rapporto d'Intervento Ufficiale
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-1">{sampleData.project.name}</h3>
                    <p className="text-xs text-slate-500">Cliente: {sampleData.client.name}</p>
                  </div>
                  <span className="text-[10px] font-extrabold text-slate-500 bg-slate-200/60 px-2 py-1 rounded-lg">
                    Periodo: 05/08/2026 — 06/08/2026
                  </span>
                </div>

                {/* Team Breakdown Table */}
                <div>
                  <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                    <User size={14} className="text-indigo-600" /> Riepilogo Squadra e Ore Lavorate
                  </h4>
                  <div className="overflow-hidden rounded-xl border border-slate-200 text-xs">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-100 text-slate-600 font-bold text-[10px] uppercase">
                        <tr>
                          <th className="p-2">Data</th>
                          <th className="p-2">Operatore</th>
                          <th className="p-2">Ore Ord.</th>
                          <th className="p-2">Straord.</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                        <tr>
                          <td className="p-2">05/08/2026</td>
                          <td className="p-2 font-medium">Marco Rossi (Capocantiere)</td>
                          <td className="p-2 font-bold">8h</td>
                          <td className="p-2">2h</td>
                        </tr>
                        <tr>
                          <td className="p-2">05/08/2026</td>
                          <td className="p-2 font-medium">Luca Bianchi (Tecnico)</td>
                          <td className="p-2 font-bold">8h</td>
                          <td className="p-2">1h</td>
                        </tr>
                        <tr>
                          <td className="p-2">06/08/2026</td>
                          <td className="p-2 font-medium">Marco Rossi (Capocantiere)</td>
                          <td className="p-2 font-bold">8h</td>
                          <td className="p-2">1h</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Description & Note */}
                <div className="text-xs text-slate-600 space-y-1">
                  <p className="font-semibold text-slate-800">Descrizione Intervento:</p>
                  <p className="bg-white p-2.5 rounded-xl border border-slate-200 italic">{sampleData.modalData.description}</p>
                </div>

                {/* Photo & Satisfaction & Signature Badges */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center gap-2">
                    <Camera size={16} className="text-indigo-600" />
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Foto Cantiere</span>
                      <span className="text-xs font-bold text-slate-800">1 Immagine allegata</span>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center gap-2">
                    <Smile size={16} className="text-emerald-600" />
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Soddisfazione</span>
                      <span className="text-xs font-bold text-emerald-600">Sì ✓</span>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center gap-2">
                    <PenLine size={16} className="text-indigo-600" />
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Firma Cliente</span>
                      <span className="text-xs font-bold text-slate-800">Tracciata sul display</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => handleGenerate('intervention')}
                  disabled={isGenerating}
                  className="px-4 py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-md hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <FileDown size={16} />
                  <span>{isGenerating ? 'Generazione in corso...' : 'Genera & Scarica PDF d\'Intervento (Esempio)'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: PDF SEDE */}
          {activeTab === 'pdf' && (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3">
                <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                  <div>
                    <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                      Report PDF Sede Operativo
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-1">Riepilogo Attività & Ore Lavorate</h3>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-200/60 px-2 py-1 rounded-lg">
                    Formato PDF A4
                  </span>
                </div>

                <p className="text-xs text-slate-600">
                  Il Report PDF sintetizza tutte le presenze, le attività svolte e le ore ordinarie/straordinarie per ciascuna commessa, pronto per l'archiviazione in sede.
                </p>

                <div className="overflow-hidden rounded-xl border border-slate-200 text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-100 text-slate-600 font-bold text-[10px] uppercase">
                      <tr>
                        <th className="p-2">Data</th>
                        <th className="p-2">Cliente</th>
                        <th className="p-2">Commessa</th>
                        <th className="p-2">Operatore</th>
                        <th className="p-2">Ore</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                      <tr>
                        <td className="p-2">05/08/2026</td>
                        <td className="p-2">Azienda Cliente SpA</td>
                        <td className="p-2">Cantiere Centro</td>
                        <td className="p-2">Marco Rossi</td>
                        <td className="p-2 font-bold">8h</td>
                      </tr>
                      <tr>
                        <td className="p-2">05/08/2026</td>
                        <td className="p-2">Azienda Cliente SpA</td>
                        <td className="p-2">Cantiere Centro</td>
                        <td className="p-2">Luca Bianchi</td>
                        <td className="p-2 font-bold">8h</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => handleGenerate('pdf')}
                  disabled={isGenerating}
                  className="px-4 py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-md hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <FileDown size={16} />
                  <span>{isGenerating ? 'Generazione in corso...' : 'Scarica PDF Sede (Esempio)'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: EXCEL OPERATIVO */}
          {activeTab === 'excel' && (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3">
                <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                  <div>
                    <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      Foglio Excel (.xlsx) Operativo
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-1">Export Dati Operativi Cantiere</h3>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-200/60 px-2 py-1 rounded-lg">
                    Formato .xlsx
                  </span>
                </div>

                <p className="text-xs text-slate-600">
                  L'esportazione Excel raccoglie i dati in formato tabellare per l'amministrazione, consentendo di filtrare per operatore, commessa o data senza dover riscrivere alcuna informazione.
                </p>

                <div className="overflow-hidden rounded-xl border border-slate-200 text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-emerald-800 text-white font-bold text-[10px] uppercase">
                      <tr>
                        <th className="p-2">Data</th>
                        <th className="p-2">Cliente</th>
                        <th className="p-2">Commessa</th>
                        <th className="p-2">Operatore</th>
                        <th className="p-2">Ore</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                      <tr>
                        <td className="p-2 font-mono">05/08/2026</td>
                        <td className="p-2">Azienda Cliente SpA</td>
                        <td className="p-2">Cantiere Centro</td>
                        <td className="p-2">Marco Rossi</td>
                        <td className="p-2 font-bold text-emerald-700">8.00</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-mono">05/08/2026</td>
                        <td className="p-2">Azienda Cliente SpA</td>
                        <td className="p-2">Cantiere Centro</td>
                        <td className="p-2">Luca Bianchi</td>
                        <td className="p-2 font-bold text-emerald-700">8.00</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => handleGenerate('excel')}
                  disabled={isGenerating}
                  className="px-4 py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md hover:bg-emerald-700 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <FileSpreadsheet size={16} />
                  <span>{isGenerating ? 'Generazione in corso...' : 'Scarica Excel Operativo (Esempio)'}</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Sparkles size={14} className="text-indigo-600" />
            <span>Jobs-Report V1: Dal campo all'ufficio, i dati una sola volta.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition-colors"
          >
            Chiudi
          </button>
        </div>

      </div>
    </div>
  );
};
