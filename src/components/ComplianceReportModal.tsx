import React, { useRef, useState } from 'react';
import { X, Camera, Trash2, FileDown, CheckCircle2 } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import { translations } from '../translations';
import { WorkReport } from '../types';

interface ComplianceReportModalProps {
  report: WorkReport;
  onClose: () => void;
  onGenerate: (photos: string[], signature: string) => void;
  lang: string;
}

export const ComplianceReportModal: React.FC<ComplianceReportModalProps> = ({ report, onClose, onGenerate, lang }) => {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const t = (key: keyof typeof translations['it']) => {
    const current = (translations as any)[lang] || translations['it'];
    return current[key] || translations['it'][key] || key;
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotos(prev => [...prev, reader.result as string].slice(0, 2)); // Limit to 2 photos for PDF performance
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    if (sigCanvas.current?.isEmpty()) {
      alert(t('complianceSignaturePlaceholder'));
      return;
    }
    
    setIsGenerating(true);
    const signatureBase64 = sigCanvas.current?.getTrimmedCanvas().toDataURL('image/png') || '';
    
    try {
      await onGenerate(photos, signatureBase64);
      onClose();
    } catch (err) {
      console.error(err);
      alert('Error generating PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose}></div>
      <div className="bg-white rounded-3xl p-6 w-full max-w-2xl relative z-10 shadow-2xl animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[95vh]">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">{t('complianceReport')}</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{report.date}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={24} /></button>
        </div>

        <div className="space-y-8">
          {/* Photos Section */}
          <section>
            <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 block">
              1. {t('compliancePhotos')} (Max 2)
            </label>
            <div className="grid grid-cols-2 gap-4">
              {photos.map((photo, idx) => (
                <div key={idx} className="relative aspect-video bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 group">
                  <img src={photo} alt="Evidence" className="w-full h-full object-cover" />
                  <button 
                    onClick={() => removePhoto(idx)}
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {photos.length < 2 && (
                <label className="aspect-video bg-blue-50/50 border-2 border-dashed border-blue-200 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-blue-50 hover:border-blue-400 transition-all text-blue-600">
                  <Camera size={32} />
                  <span className="text-[10px] font-black uppercase tracking-wider">{t('complianceAddPhoto')}</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment" 
                    className="hidden" 
                    onChange={handlePhotoChange}
                    multiple 
                  />
                </label>
              )}
            </div>
          </section>

          {/* Signature Section */}
          <section>
            <div className="flex justify-between items-end mb-4">
              <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] block">
                2. {t('complianceSignature')}
              </label>
              <button 
                onClick={() => sigCanvas.current?.clear()}
                className="text-[10px] font-bold text-red-500 uppercase hover:underline"
              >
                {t('complianceSignatureClear')}
              </button>
            </div>
            <div className="border-2 border-slate-200 rounded-2xl bg-slate-50 overflow-hidden shadow-inner">
              <SignatureCanvas 
                ref={sigCanvas}
                penColor="#1e3a8a"
                canvasProps={{
                  className: "w-full min-h-[200px] cursor-crosshair",
                  style: { width: '100%', height: '200px' }
                }}
              />
              <div className="bg-slate-100 py-1.5 px-4 text-center border-t border-slate-200">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">
                  {t('complianceSignaturePlaceholder')}
                </p>
              </div>
            </div>
          </section>

          {/* Action Button */}
          <div className="pt-6 border-t">
            <button 
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-200 hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isGenerating ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <FileDown size={20} />
              )}
              {t('complianceGeneratePDF')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
