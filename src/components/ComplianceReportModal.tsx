import React, { useRef, useState, useEffect } from 'react';
import { X, Camera, Trash2, FileDown, CheckCircle2, PenLine } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import { useTranslation } from '../App';
import { WorkReport } from '../types';

interface ComplianceReportModalProps {
  report: WorkReport;
  onClose: () => void;
  onGenerate: (photos: string[], signature: string) => void;
}

export const ComplianceReportModal: React.FC<ComplianceReportModalProps> = ({ report, onClose, onGenerate }) => {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const sigContainerRef = useRef<HTMLDivElement>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);

  const { t } = useTranslation();

  // Fix for react-signature-canvas: resize the internal canvas to match its CSS container
  useEffect(() => {
    const resizeCanvas = () => {
      if (sigContainerRef.current && sigCanvas.current) {
        const canvas = sigCanvas.current.getCanvas();
        const container = sigContainerRef.current;
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        canvas.width = container.offsetWidth * ratio;
        canvas.height = 200 * ratio;
        canvas.getContext('2d')?.scale(ratio, ratio);
        sigCanvas.current.clear();
        setHasSigned(false);
      }
    };

    // Run after modal is rendered
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
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotos(prev => [...prev, reader.result as string].slice(0, 3));
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleClear = () => {
    sigCanvas.current?.clear();
    setHasSigned(false);
  };

  const handleGenerate = async () => {
    if (!hasSigned || sigCanvas.current?.isEmpty()) {
      alert('⚠️ ' + t('reports.complianceSignatureRequired'));
      return;
    }

    setIsGenerating(true);
    const signatureBase64 = sigCanvas.current?.getTrimmedCanvas().toDataURL('image/png') || '';

    try {
      await onGenerate(photos, signatureBase64);
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
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">{t('reports.complianceReport')}</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{report.date}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={24} /></button>
        </div>

        <div className="space-y-8">
          {/* Photos Section */}
          <section>
            <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 block">
              1. {t('reports.compliancePhotos')} ({photos.length}/3)
            </label>
            <div className="grid grid-cols-2 gap-3">
              {photos.map((photo, idx) => (
                <div key={idx} className="relative aspect-video bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 group">
                  <img src={photo} alt="Evidence" className="w-full h-full object-cover" />
                  <button
                    onClick={() => removePhoto(idx)}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={12} />
                  </button>
                  <span className="absolute bottom-1 left-2 text-[9px] font-black text-white/80 bg-black/40 px-1.5 py-0.5 rounded-full">#{idx + 1}</span>
                </div>
              ))}
              {photos.length < 3 && (
                <div className="aspect-video bg-blue-50/50 border-2 border-dashed border-blue-200 rounded-2xl flex flex-col items-center justify-center gap-3 p-4">
                  <Camera size={24} className="text-blue-400" />
                  <div className="flex gap-2 w-full">
                    {/* Camera button — opens camera directly on mobile */}
                    <label className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer hover:bg-blue-700 transition-colors">
                      <Camera size={13} /> {t('reports.complianceAddPhoto')}
                      <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoChange} />
                    </label>
                    {/* Gallery / File browser */}
                    <label className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer hover:bg-slate-200 transition-colors">
                      <Camera size={13} /> {t('reports.complianceGallery')}
                      <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} multiple />
                    </label>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Signature Section */}
          <section>
            <div className="flex justify-between items-end mb-4">
              <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] block">
                2. {t('reports.complianceSignature')}
                {hasSigned && <span className="ml-2 text-emerald-500">✓</span>}
              </label>
              <button
                onClick={handleClear}
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
                  style: { width: '100%', height: '200px', display: 'block' }
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
          <div className="pt-6 border-t">
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className={`w-full py-4 rounded-2xl font-black shadow-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 ${
                hasSigned
                  ? 'bg-blue-600 text-white shadow-blue-200 hover:bg-blue-700 active:scale-[0.98]'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              {isGenerating ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <FileDown size={20} />
              )}
              {t('reports.complianceGeneratePDF')}
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
