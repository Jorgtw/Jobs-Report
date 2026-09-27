import type { Project, WorkReport, WorkerCompensation } from '../types';

export function getWorkerCompensation(project: Pick<Project, 'workerCompensations'> | undefined, workerId: string): WorkerCompensation {
  return project?.workerCompensations?.[workerId] || { method: 'HOURLY' };
}

// Select before date/status/user filtering. Stable even if the API returns a different order.
// Main and additional-worker entries participate in the same assignment.
export function fixedCostEntries(reports: WorkReport[]): Set<string> {
  const assignments = new Set<string>();
  const entries = new Set<string>();
  const sorted = [...reports].sort((a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt || a.id.localeCompare(b.id));
  for (const report of sorted) {
    if (report.activityType === 'sickness' || report.activityType === 'holiday') continue;
    const workers = [report.userId, ...(report.additionalWorkers || []).map(w => w.userId)];
    workers.forEach((workerId, index) => {
      const key = JSON.stringify([report.projectId, workerId]);
      if (!assignments.has(key)) {
        assignments.add(key);
        entries.add(index === 0 ? report.id + '_main' : report.id + '_aw_' + (index - 1));
      }
    });
  }
  return entries;
}

export function compensationSummary(terms: WorkerCompensation, quantity: number | undefined, recognized: boolean) {
  return {
    compensationMethod: terms.method,
    completedQuantity: terms.method === 'PER_UNIT' ? quantity || 0 : undefined,
    unitRate: terms.method === 'PER_UNIT' ? terms.unitRate : undefined,
    unitName: terms.method === 'PER_UNIT' ? terms.unitName : undefined,
    fixedAmount: terms.method === 'FIXED_PROJECT' ? terms.fixedAmount : undefined,
    fixedCostRecognized: terms.method === 'FIXED_PROJECT' && recognized
  };
}
