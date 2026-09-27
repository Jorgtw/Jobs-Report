import { useTranslation } from '../contexts/LanguageContext';
import type { Project } from '../types';
import { getWorkerCompensation } from '../services/workerCompensation';
export function CompletedQuantityField({ project, workerId, value, onChange, className = '' }: { className?: string; project?: Project; workerId: string; value?: number; onChange: (value: number | undefined) => void }) {
  const { t } = useTranslation();
  const terms = getWorkerCompensation(project, workerId);
  if (terms.method !== 'PER_UNIT') return null;
  return <label className={`block text-sm ${className}`}>{t('reports.completedQuantity')}{terms.unitName ? ` (${terms.unitName})` : ''}
    <input type="number" required min="0" step="any" className="block w-full rounded border border-slate-300 p-2" value={value ?? ''} onChange={e => onChange(e.target.value === '' ? undefined : Number(e.target.value))} />
  </label>;
}
