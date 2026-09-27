import type { WorkerCompensation } from '../types';
import { useTranslation } from '../contexts/LanguageContext';

export function WorkerCompensationFields({ value, onChange }: { value: WorkerCompensation; onChange: (value: WorkerCompensation) => void }) {
  const { t } = useTranslation();
  const cls = 'w-full rounded border border-slate-300 p-2 text-sm';
  return <div className="grid sm:grid-cols-3 gap-3">
    <label>{t('reports.compensationMethod')}<select className={cls} value={value.method} onChange={e => onChange({ ...value, method: e.target.value as WorkerCompensation['method'] })}>
      <option value="HOURLY">{t('reports.compensationHourly')}</option><option value="PER_UNIT">{t('reports.compensationPerUnit')}</option><option value="FIXED_PROJECT">{t('reports.compensationFixed')}</option>
    </select></label>
    {value.method === 'PER_UNIT' && <><label>{t('reports.unitRate')}<input className={cls} required type="number" min="0" step="0.01" value={value.unitRate ?? ''} onChange={e => onChange({ ...value, unitRate: e.target.value === '' ? undefined : Number(e.target.value) })} /></label>
      <label>{t('reports.unitName')}<input className={cls} maxLength={80} value={value.unitName || ''} onChange={e => onChange({ ...value, unitName: e.target.value })} /></label></>}
    {value.method === 'FIXED_PROJECT' && <label>{t('reports.fixedAmount')}<input className={cls} required type="number" min="0" step="0.01" value={value.fixedAmount ?? ''} onChange={e => onChange({ ...value, fixedAmount: e.target.value === '' ? undefined : Number(e.target.value) })} /></label>}
  </div>;
}
