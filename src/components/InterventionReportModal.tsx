import React, { useRef, useState, useEffect, useMemo } from 'react';
import { X, FileText, CheckCircle2, FileDown, PenLine, Users, Package } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import { useTranslation } from '../contexts/LanguageContext';
import { WorkReport, Project, Client, User } from '../types';

interface InterventionReportModalProps {
  selectedReports: WorkReport[];
  project?: Project;
  client?: Client;
  personnel?: User[];
  onClose: () => void;
  onGenerate: (data: {
    description: string;
    notes: string;
    isCompleted: boolean;
    signature: string;
  }) => Promise<void>;
}

export const InterventionReportModal: React.FC<InterventionReportModalProps> = ({
  selectedReports,
  project,
  client,
  personnel = [],
  onClose,
  onGenerate
}) => {
  const { t } = useTranslation();
  const sigCanvas = useRef<SignatureCanvas>(null);
  const sigContainerRef = useRef<HTMLDivElement>(null);

  const [description, setDescription] = useState<string>(project?.description || project?.name || '');
  const [notes, setNotes] = useState<string>('');
  const [isCompleted, setIsCompleted] = useState<boolean>(true);
  const [hasSigned, setHasSigned] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Aggregated calculations for live preview before signing
  const { periodStr, teamStats, teamTotals, allExpenses } = useMemo(() => {
    const formatDateEU = (isoDate: string) => {
      if (!isoDate) return '---';
      const parts = isoDate.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return isoDate;
    };

    const sortedDates = selectedReports.map(r => r.date).filter(Boolean).sort();
    const minDateStr = sortedDates[0] ? formatDateEU(sortedDates[0]) : '---';
    const maxDateStr = sortedDates[sortedDates.length - 1] ? formatDateEU(sortedDates[sortedDates.length - 1]) : '---';
    const periodStr = minDateStr === maxDateStr ? minDateStr : `${minDateStr} — ${maxDateStr}`;

    const workerMap = new Map<string, {
      name: string;
      ordinary: number;
      extra: number;
      festive: number;
      night: number;
      total: number;
    }>();

    selectedReports.forEach(r => {
      const mainId = r.userId || 'main';
      const mainName = personnel?.find(u => u.id === r.userId)?.name || (r as any).userName || t('reports.mainWorker');
      const mainTot = r.manualTotalHours !== undefined && r.manualTotalHours !== null
        ? Number(r.manualTotalHours)
        : Number(r.totalHours) || 0;
      const mainEx = Number(r.overtimeHours) || 0;
      const mainF = Number(r.festiveHours) || 0;
      const mainN = Number(r.nightHours) || 0;
      const mainOrd = (r as any).ordinaryHours !== undefined && (r as any).ordinaryHours !== null
        ? Number((r as any).ordinaryHours)
        : Math.max(0, mainTot - mainEx - mainF - mainN);

      if (!workerMap.has(mainId)) {
        workerMap.set(mainId, { name: mainName, ordinary: 0, extra: 0, festive: 0, night: 0, total: 0 });
      }
      const mainStat = workerMap.get(mainId)!;
      mainStat.ordinary += mainOrd;
      mainStat.extra += mainEx;
      mainStat.festive += mainF;
      mainStat.night += mainN;
      mainStat.total += mainTot;

      (r.additionalWorkers || []).forEach((aw: any) => {
        const awId = aw.userId || aw.personName || 'helper';
        const awName = aw.personName || personnel?.find(u => u.id === aw.userId)?.name || '---';
        const awTot = aw.manualTotalHours !== undefined && aw.manualTotalHours !== null
          ? Number(aw.manualTotalHours)
          : Number(aw.totalHours) || 0;
        const awEx = Number(aw.overtimeHours) || 0;
        const awF = Number(aw.festiveHours) || 0;
        const awN = Number(aw.nightHours) || 0;
        const awOrd = aw.ordinaryHours !== undefined && aw.ordinaryHours !== null
          ? Number(aw.ordinaryHours)
          : Math.max(0, awTot - awEx - awF - awN);

        if (!workerMap.has(awId)) {
          workerMap.set(awId, { name: awName, ordinary: 0, extra: 0, festive: 0, night: 0, total: 0 });
        }
        const awStat = workerMap.get(awId)!;
        awStat.ordinary += awOrd;
        awStat.extra += awEx;
        awStat.festive += awF;
        awStat.night += awN;
        awStat.total += awTot;
      });
    });

    const teamStats = Array.from(workerMap.values());
    const teamTotals = teamStats.reduce((acc, curr) => ({
      ordinary: acc.ordinary + curr.ordinary,
      extra: acc.extra + curr.extra,
      festive: acc.festive + curr.festive,
      night: acc.night + curr.night,
      total: acc.total + curr.total,
    }), { ordinary: 0, extra: 0, festive: 0, night: 0, total: 0 });

    const allExpenses: any[] = [];
    selectedReports.forEach(r => {
      if (r.expenses && r.expenses.length > 0) {
        r.expenses.forEach(exp => allExpenses.push(exp));
      }
    });

    return { periodStr, teamStats, teamTotals, allExpenses };
  }, [selectedReports, personnel, t]);

  // Resize signature canvas to match container width
  useEffect(() => {
    const resizeCanvas = () => {
      if (sigContainerRef.current && sigCanvas.current) {
        const canvas = sigCanvas.current.getCanvas();
        const container = sigContainerRef.current;
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        canvas.width = container.offsetWidth * ratio;
        canvas.height = 180 * ratio;
        canvas.getContext('2d')?.scale(ratio, ratio);
        sigCanvas.current.clear();
        setHasSigned(false);
      }
    };

    const timer = setTimeout(resizeCanvas, 100);
    const observer = new ResizeObserver(resizeCanvas);
    if (sigContainerRef.current) observer.observe(sigContainerRef.current);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  const handleClearSignature = () => {
    sigCanvas.current?.clear();
    setHasSigned(false);
  };

  const handleGenerate = async () => {
    if (!hasSigned || sigCanvas.current?.isEmpty()) {
      alert('⚠️ ' + t('reports.complianceSignatureRequired'));
      return;
    }

    setIsGenerating(true);
    try {
      const signatureBase64 = sigCanvas.current?.getCanvas().toDataURL('image/png') || '';
      await onGenerate({
        description,
        notes,
        isCompleted,
        signature: signatureBase64
      });
      onClose();
    } catch (err) {
      console.error('PDF generation error:', err);
      alert(t('reports.complianceErrorPDF'));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center sm:p-4">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose}></div>
      <div className="bg-white sm:rounded-3xl p-6 w-full h-full sm:h-auto sm:max-w-2xl relative z-10 shadow-2xl animate-in sm:zoom-in-95 duration-200 overflow-y-auto sm:max-h-[95vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
              <FileText size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">{t('reports.interventionReport')}</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {project?.name || '---'} {client?.name ? `• ${client.name}` : ''} ({selectedReports.length} {t('reports.title').toLowerCase()})
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Section 1: Descrizione Intervento */}
          <section>
            <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">
              1. {t('reports.interventionDescription')}
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('reports.interventionDescription')}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
          </section>

          {/* Section 2: Note Finali */}
          <section>
            <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">
              2. {t('reports.interventionFinalNotes')} ({t('reports.nonBillable').toLowerCase()})
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('reports.interventionFinalNotes')}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
          </section>

          {/* Section 3: Intervento Concluso */}
          <section className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <span className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
                3. {t('reports.interventionCompleted')}
              </span>
              <div className="flex items-center gap-4">
                {/* SÌ Button */}
                <button
                  type="button"
                  onClick={() => setIsCompleted(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all font-black text-xs uppercase tracking-wider cursor-pointer"
                  style={{
                    borderColor: isCompleted ? '#10b981' : '#cbd5e1',
                    backgroundColor: isCompleted ? '#ecfdf5' : 'white',
                    color: isCompleted ? '#047857' : '#64748b'
                  }}
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-300'}`}>
                    {isCompleted && <CheckCircle2 size={12} />}
                  </div>
                  {t('common.yes')}
                </button>

                {/* NO Button */}
                <button
                  type="button"
                  onClick={() => setIsCompleted(false)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all font-black text-xs uppercase tracking-wider cursor-pointer"
                  style={{
                    borderColor: !isCompleted ? '#ef4444' : '#cbd5e1',
                    backgroundColor: !isCompleted ? '#fef2f2' : 'white',
                    color: !isCompleted ? '#b91c1c' : '#64748b'
                  }}
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${!isCompleted ? 'bg-red-500 border-red-500 text-white' : 'bg-white border-slate-300'}`}>
                    {!isCompleted && <X size={12} />}
                  </div>
                  {t('common.no')}
                </button>
              </div>
            </div>
          </section>

          {/* Section: Live Preview of Aggregated Data Before Signing */}
          <section className="bg-indigo-50/40 border border-indigo-100 rounded-2xl p-4 space-y-3">
            <div className="flex justify-between items-center border-b border-indigo-100 pb-2">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-indigo-600" />
                <h3 className="text-xs font-black text-indigo-900 uppercase tracking-wider">
                  {t('reports.workSummary')} ({t('reports.workPeriod')}: <span className="text-indigo-700">{periodStr}</span>)
                </h3>
              </div>
              <span className="text-[10px] font-black text-indigo-600 bg-white border border-indigo-200 px-2 py-0.5 rounded-full">
                {selectedReports.length} {t('reports.title').toLowerCase()}
              </span>
            </div>

            {/* Team Hours Summary Table */}
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Users size={12} className="text-indigo-500" />
                <h4 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                  {t('reports.workTeam')} &amp; {t('reports.hoursSummary')}
                </h4>
              </div>
              <div className="overflow-x-auto bg-white rounded-xl border border-indigo-100 shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/70 border-b border-slate-200 text-[9px] font-black uppercase text-slate-500">
                    <tr>
                      <th className="p-2">{t('reports.workerCol')}</th>
                      <th className="p-2 text-center">{t('reports.ordinaryHours')}</th>
                      <th className="p-2 text-center">{t('reports.headerExtra')}</th>
                      <th className="p-2 text-center">{t('reports.headerFestive')}</th>
                      <th className="p-2 text-center">{t('reports.headerNight')}</th>
                      <th className="p-2 text-center font-bold text-indigo-700">{t('common.hours')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {teamStats.map((w, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2 font-semibold text-slate-900">{w.name}</td>
                        <td className="p-2 text-center">{w.ordinary.toFixed(2)}h</td>
                        <td className="p-2 text-center text-amber-600 font-medium">{w.extra > 0 ? `${w.extra.toFixed(2)}h` : '-'}</td>
                        <td className="p-2 text-center text-red-600 font-medium">{w.festive > 0 ? `${w.festive.toFixed(2)}h` : '-'}</td>
                        <td className="p-2 text-center text-indigo-600 font-medium">{w.night > 0 ? `${w.night.toFixed(2)}h` : '-'}</td>
                        <td className="p-2 text-center font-bold text-slate-900">{w.total.toFixed(2)}h</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-indigo-50/70 border-t border-indigo-100 text-xs font-black text-indigo-900">
                    <tr>
                      <td className="p-2">{t('reports.teamTotalLabel')}</td>
                      <td className="p-2 text-center">{teamTotals.ordinary.toFixed(2)}h</td>
                      <td className="p-2 text-center">{teamTotals.extra.toFixed(2)}h</td>
                      <td className="p-2 text-center">{teamTotals.festive.toFixed(2)}h</td>
                      <td className="p-2 text-center">{teamTotals.night.toFixed(2)}h</td>
                      <td className="p-2 text-center text-indigo-700">{teamTotals.total.toFixed(2)}h</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Materials & Expenses Table (If any) */}
            {allExpenses.length > 0 && (
              <div className="pt-1">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Package size={12} className="text-indigo-500" />
                  <h4 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                    {t('reports.expensesAndMaterials')}
                  </h4>
                </div>
                <div className="bg-white rounded-xl border border-indigo-100 overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs divide-y divide-slate-100">
                    <thead className="bg-slate-100/70 text-[9px] font-black uppercase text-slate-500">
                      <tr>
                        <th className="p-2 w-1/3">{t('reports.category')}</th>
                        <th className="p-2">{t('reports.description')}</th>
                        <th className="p-2 text-center w-20">{t('reports.kmShort')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                      {allExpenses.map((exp, idx) => {
                        let catLabel = exp.type || 'CANTIERE';
                        if (exp.type === 'CANTIERE') catLabel = t('reports.expenseCantiere') || 'Spesa Cantiere';
                        else if (exp.type === 'RIMBORSO') catLabel = t('reports.expenseRimborso') || 'Rimborso Personale';
                        else if (exp.type === 'KM') catLabel = t('reports.expenseKm') || 'Trasferta (KM)';

                        return (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2 font-semibold text-slate-800">{catLabel}</td>
                            <td className="p-2">{exp.description || exp.notes || '---'}</td>
                            <td className="p-2 text-center font-bold text-slate-600">
                              {(exp.type === 'KM' || exp.km) && Number(exp.km) > 0 ? `${exp.km} Km` : '---'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>

          {/* Section 4: Signature */}
          <section>
            <div className="flex justify-between items-end mb-3">
              <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] block">
                4. {t('reports.clientSignature')}
                {hasSigned && <span className="ml-2 text-emerald-500">✓</span>}
              </label>
              <button
                type="button"
                onClick={handleClearSignature}
                className="text-[10px] font-bold text-red-500 uppercase hover:underline"
              >
                {t('reports.complianceSignatureClear')}
              </button>
            </div>
            <div ref={sigContainerRef} className="border-2 border-slate-200 rounded-2xl bg-slate-50 overflow-hidden shadow-inner">
              <SignatureCanvas
                ref={sigCanvas}
                penColor="#1e3a8a"
                onEnd={() => setHasSigned(true)}
                canvasProps={{
                  className: "w-full cursor-crosshair",
                  style: { width: '100%', height: '180px', display: 'block' }
                }}
              />
              <div className="bg-slate-100 py-1.5 px-4 text-center border-t border-slate-200 flex items-center justify-center gap-2">
                <PenLine size={12} className="text-slate-400" />
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">
                  {t('reports.complianceSignaturePlaceholder')}
                </p>
              </div>
            </div>
          </section>

          {/* Action Button */}
          <div className="pt-4 border-t">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating || !hasSigned}
              className={`w-full py-4 rounded-2xl font-black shadow-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 ${
                hasSigned
                  ? 'bg-indigo-600 text-white shadow-indigo-200 hover:bg-indigo-700 active:scale-[0.98]'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              {isGenerating ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <FileDown size={20} />
              )}
              {t('reports.exportPDF')}
            </button>
            {!hasSigned && (
              <p className="text-center text-xs text-slate-400 mt-2">⚠️ {t('reports.complianceSignatureRequired')}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
