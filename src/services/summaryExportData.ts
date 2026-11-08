import type { ReportSummary } from '../types';
import type { WorkSession } from './export/ReportBuilder';

export const summaryToWorkSession = (s: ReportSummary & { materialsCost?: number }): WorkSession => ({
  date: s.date,
  projectId: s.projectId,
  clientName: s.clientName || '',
  projectName: s.projectName || '',
  workerName: s.userName || '',
  description: s.description || '',
  ordinaryHours: Math.max(0, (s.totalHours || 0) - (s.overtimeHours || 0) - (s.festiveHours || 0) - (s.nightHours || 0)),
  extraHours: s.overtimeHours || 0,
  nightHours: s.nightHours || 0,
  holidayHours: s.festiveHours || 0,
  hours: s.totalHours || 0,
  cost: s.personnelCost ?? s.cost ?? 0,
  compensationMethod: s.compensationMethod,
  completedQuantity: s.completedQuantity,
  unitRate: s.unitRate,
  unitName: s.unitName,
  fixedAmount: s.fixedCostRecognized ? s.fixedAmount : undefined,
  materialsCost: s.materialsCost || 0,
  subcontractorCost: s.subcontractorCost || 0,
  expenses: s.totalExpenses || 0,
  revenue: s.revenue || 0
});
