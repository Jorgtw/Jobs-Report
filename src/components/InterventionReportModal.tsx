import React, { useRef, useState, useEffect, useMemo } from 'react';
import { X, FileText, CheckCircle2, FileDown, PenLine, Users, Package, Camera, Trash2, Smile, Frown, Image as ImageIcon } from 'lucide-react';
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
    isCompleted: boolean | null;
    satisfaction: 'yes' | 'no' | null;
    photos: string[];
    signature: string;
  }) => Promise<void>;
}

// Client-side image compression helper
const compressImage = (base64Str: string, maxDim = 1200, quality = 0.75): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      } else {
        resolve(base64Str);
      }
    };
    img.onerror = () => resolve(base64Str);
  });
};

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
  const [isCompleted, setIsCompleted] = useState<boolean | null>(null);
  const [satisfaction, setSatisfaction] = useState<'yes' | 'no' | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [hasSigned, setHasSigned] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Aggregated calculations for live preview before signing
  const { periodStr, dailyRows, teamTotals, allExpenses, hasKm } = useMemo(() => {
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

    const sortedReports = [...selectedReports].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    interface DailyWorkerRow {
      dateFormatted: string;
      isFirstRowOfDate: boolean;
      workerName: string;
      ordinary: number;
      extra: number;
      festive: number;
      night: number;
      total: number;
    }

    const dailyRows: DailyWorkerRow[] = [];
    let lastDate = '';

    sortedReports.forEach(r => {
      const dateFormatted = formatDateEU(r.date);

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

      const isFirstMain = dateFormatted !== lastDate;
      if (isFirstMain) lastDate = dateFormatted;

      dailyRows.push({
        dateFormatted,
        isFirstRowOfDate: isFirstMain,
        workerName: mainName,
        ordinary: mainOrd,
        extra: mainEx,
        festive: mainF,
        night: mainN,
        total: mainTot
      });

      (r.additionalWorkers || []).forEach((aw: any) => {
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

        const isFirstAw = dateFormatted !== lastDate;
        if (isFirstAw) lastDate = dateFormatted;

        dailyRows.push({
          dateFormatted,
          isFirstRowOfDate: isFirstAw,
          workerName: awName,
          ordinary: awOrd,
          extra: awEx,
          festive: awF,
          night: awN,
          total: awTot
        });
      });
    });

    const teamTotals = dailyRows.reduce((acc, curr) => ({
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

    const hasKm = allExpenses.some(exp => (exp.type === 'KM' || Number(exp.km) > 0));

    return { periodStr, dailyRows, teamTotals, allExpenses, hasKm };
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

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = async () => {
        if (reader.result) {
          const compressed = await compressImage(reader.result as string, 1200, 0.75);
          setPhotos(prev => {
            if (prev.length >= 3) return prev;
            return [...prev, compressed].slice(0, 3);
          });
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

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
        satisfaction,
        photos,
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
                {project?.name || '---'} {client?.name ? `• ${client.name}` : ''}
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

          {/* Section 3: Intervento Concluso (Opzionale) */}
          <section className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <span className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                3. {t('reports.interventionCompleted')}
              </span>
              <div className="flex items-center gap-4">
                {/* SÌ Button */}
                <button
                  type="button"
                  onClick={() => setIsCompleted(prev => prev === true ? null : true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all font-black text-xs uppercase tracking-wider cursor-pointer"
                  style={{
                    borderColor: isCompleted === true ? '#10b981' : '#cbd5e1',
                    backgroundColor: isCompleted === true ? '#ecfdf5' : 'white',
                    color: isCompleted === true ? '#047857' : '#64748b'
                  }}
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isCompleted === true ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-300'}`}>
                    {isCompleted === true && <CheckCircle2 size={12} />}
                  </div>
                  {t('common.yes')}
                </button>

                {/* NO Button */}
                <button
                  type="button"
                  onClick={() => setIsCompleted(prev => prev === false ? null : false)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all font-black text-xs uppercase tracking-wider cursor-pointer"
                  style={{
                    borderColor: isCompleted === false ? '#ef4444' : '#cbd5e1',
                    backgroundColor: isCompleted === false ? '#fef2f2' : 'white',
                    color: isCompleted === false ? '#b91c1c' : '#64748b'
                  }}
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isCompleted === false ? 'bg-red-500 border-red-500 text-white' : 'bg-white border-slate-300'}`}>
                    {isCompleted === false && <X size={12} />}
                  </div>
                  {t('common.no')}
                </button>
              </div>
            </div>
          </section>

          {/* Section 4: Documentazione Fotografica dell'Intervento (Opzionale, Max 3 foto) */}
          <section>
            <div className="flex justify-between items-center mb-3">
              <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] block">
                4. {t('reports.interventionPhotoDoc')} ({photos.length}/3)
              </label>
              {photos.length >= 3 && (
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  {t('reports.maxPhotosReached')}
                </span>
              )}
            </div>

            <div className="space-y-3">
              {/* Photo Thumbnails */}
              {photos.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {photos.map((photo, idx) => (
                    <div key={idx} className="relative aspect-video bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 group shadow-sm">
                      <img src={photo} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(idx)}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full shadow-lg opacity-90 hover:opacity-100 transition-all cursor-pointer"
                      >
                        <Trash2 size={12} />
                      </button>
                      <span className="absolute bottom-1 left-2 text-[9px] font-black text-white/90 bg-black/50 px-1.5 py-0.5 rounded-full backdrop-blur-xs">
                        #{idx + 1}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Photo Upload Buttons */}
              {photos.length < 3 && (
                <div className="flex gap-3">
                  {/* Camera Button (Mobile/PWA Direct Camera) */}
                  <label className="flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-50 border-2 border-dashed border-indigo-200 text-indigo-700 rounded-2xl text-xs font-black uppercase tracking-wider cursor-pointer hover:bg-indigo-100 transition-all shadow-xs">
                    <Camera size={16} />
                    <span>{t('reports.addPhotoCamera')}</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={handlePhotoChange}
                    />
                  </label>

                  {/* Gallery Button */}
                  <label className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-50 border-2 border-dashed border-slate-200 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-all shadow-xs">
                    <ImageIcon size={16} />
                    <span>{t('reports.addPhotoGallery')}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoChange}
                    />
                  </label>
                </div>
              )}
            </div>
          </section>

          {/* Section: Live Preview of Aggregated Data Before Signing */}
          <section className="bg-indigo-50/40 border border-indigo-100 rounded-2xl p-4 space-y-3">
            <div className="flex justify-between items-center border-b border-indigo-100 pb-2">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-indigo-600" />
                <h3 className="text-xs font-black text-indigo-900 uppercase tracking-wider">
                  {t('reports.workSummary')} — {t('reports.workPeriod')}: <span className="text-indigo-700">{periodStr}</span>
                </h3>
              </div>
            </div>

            {/* Team Hours Summary Table (Row per Date & Worker) */}
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
                      <th className="p-2">{t('reports.headerDate')}</th>
                      <th className="p-2">{t('reports.workerCol')}</th>
                      <th className="p-2 text-center">{t('reports.ordinaryHours')}</th>
                      <th className="p-2 text-center">{t('reports.headerExtra')}</th>
                      <th className="p-2 text-center">{t('reports.headerFestive')}</th>
                      <th className="p-2 text-center">{t('reports.headerNight')}</th>
                      <th className="p-2 text-center font-bold text-indigo-700">{t('common.hours')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {dailyRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2 font-bold text-blue-600 whitespace-nowrap">{row.isFirstRowOfDate ? row.dateFormatted : ''}</td>
                        <td className="p-2 font-semibold text-slate-900">{row.workerName}</td>
                        <td className="p-2 text-center">{row.ordinary.toFixed(2)}h</td>
                        <td className="p-2 text-center text-amber-600 font-medium">{row.extra > 0 ? `${row.extra.toFixed(2)}h` : '-'}</td>
                        <td className="p-2 text-center text-red-600 font-medium">{row.festive > 0 ? `${row.festive.toFixed(2)}h` : '-'}</td>
                        <td className="p-2 text-center text-indigo-600 font-medium">{row.night > 0 ? `${row.night.toFixed(2)}h` : '-'}</td>
                        <td className="p-2 text-center font-bold text-slate-900">{row.total.toFixed(2)}h</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-indigo-50/70 border-t border-indigo-100 text-xs font-black text-indigo-900">
                    <tr>
                      <td colSpan={2} className="p-2">{t('reports.totalTeamHours')}</td>
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
                        {hasKm && <th className="p-2 text-center w-20">{t('reports.kmShort')}</th>}
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
                            {hasKm && (
                              <td className="p-2 text-center font-bold text-slate-600">
                                {(exp.type === 'KM' || exp.km) && Number(exp.km) > 0 ? `${exp.km} Km` : '---'}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Photos Preview Grid in Summary (if photos present) */}
            {photos.length > 0 && (
              <div className="pt-1 border-t border-indigo-100">
                <h4 className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                  {t('reports.interventionPhotoDoc')} ({photos.length})
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  {photos.map((p, idx) => (
                    <div key={idx} className="aspect-video rounded-xl overflow-hidden border border-indigo-100 bg-white">
                      <img src={p} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Section 5: Soddisfazione del Cliente (Opzionale) */}
          <section className="bg-slate-50 p-4 rounded-2xl border-2 border-indigo-100 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <span className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                5. {t('reports.satisfiedWithIntervention')}
              </span>
              <div className="flex items-center gap-4">
                {/* SÌ Button */}
                <button
                  type="button"
                  onClick={() => setSatisfaction(prev => prev === 'yes' ? null : 'yes')}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 transition-all font-black text-xs uppercase tracking-wider cursor-pointer"
                  style={{
                    borderColor: satisfaction === 'yes' ? '#10b981' : '#cbd5e1',
                    backgroundColor: satisfaction === 'yes' ? '#ecfdf5' : 'white',
                    color: satisfaction === 'yes' ? '#047857' : '#64748b'
                  }}
                >
                  <Smile size={16} className={satisfaction === 'yes' ? 'text-emerald-600' : 'text-slate-400'} />
                  {t('common.yes')}
                </button>

                {/* NO Button */}
                <button
                  type="button"
                  onClick={() => setSatisfaction(prev => prev === 'no' ? null : 'no')}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 transition-all font-black text-xs uppercase tracking-wider cursor-pointer"
                  style={{
                    borderColor: satisfaction === 'no' ? '#ef4444' : '#cbd5e1',
                    backgroundColor: satisfaction === 'no' ? '#fef2f2' : 'white',
                    color: satisfaction === 'no' ? '#b91c1c' : '#64748b'
                  }}
                >
                  <Frown size={16} className={satisfaction === 'no' ? 'text-red-600' : 'text-slate-400'} />
                  {t('common.no')}
                </button>
              </div>
            </div>
          </section>

          {/* Section 6: Signature */}
          <section>
            <div className="flex justify-between items-end mb-3">
              <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] block">
                6. {t('reports.clientSignature')}
                {hasSigned && <span className="ml-2 text-emerald-500">✓</span>}
              </label>
              <button
                type="button"
                onClick={handleClearSignature}
                className="text-[10px] font-bold text-red-500 uppercase hover:underline cursor-pointer"
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
                  ? 'bg-indigo-600 text-white shadow-indigo-200 hover:bg-indigo-700 active:scale-[0.98] cursor-pointer'
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
              <p className="text-center text-xs text-slate-400 mt-2">
                ⚠️ {t('reports.complianceSignatureRequired')}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
