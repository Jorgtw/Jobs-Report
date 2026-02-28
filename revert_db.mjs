import fs from 'fs';
const path = 'c:/Users/jtw/Euro JTW/Archivi/JTW/Programmi/jobs-report-complete/src/services/dbService.ts';
let content = fs.readFileSync(path, 'utf8');

const newAdd = `  async addReport(report: any) {
    const totalHours = this.calculateTotalHours(report.startTime, report.endTime, report.breakHours, report.manualTotalHours);

    const additionalWorkers = report.additionalWorkers || [];
    delete report.additionalWorkers;
    report.expenses || [];
    delete report.expenses;

    const newReport: any = {
      project_id: report.projectId,
      created_by: report.userId,
      date: report.date,
      start_time: report.startTime,
      end_time: report.endTime,
      break_hours: report.breakHours,
      total_hours: totalHours,
      description: report.description,
      \"Notes\": report.notes,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase.from('reports').insert([newReport]).select();
    if (error) throw error;

    const createdReportId = data[0].id;

    if (additionalWorkers.length > 0) {
      const workersToAdd = additionalWorkers.map((aw: any) => {
        const hours = this.calculateTotalHours(aw.startTime, aw.endTime, aw.breakHours, aw.manualTotalHours);
        const hourlyRate = aw.hourlyRate || 0;
        const totalCost = hours * hourlyRate;

        return {
          rapportino_id: createdReportId,
          worker_id: aw.userId,
          startTime: aw.startTime,
          endTime: aw.endTime,
          breakHours: aw.breakHours,
          hours: hours,
          hourly_rate: hourlyRate,
          total_cost: totalCost,
          person_name: aw.personName || '',
          person_role: aw.personRole || '',
          membership_type: aw.membershipType || 'Interno',
          subcontractor_id: aw.subcontractorId || null,
          is_manual_override: aw.isManualOverride || false
        };
      });
      await supabase.from('rapportini_workers').insert(workersToAdd);
    }

    return this.mapSupabaseReport({ ...data[0], additionalWorkers });
  }`;

const newUpdate = `  async updateReport(id: string, updates: any) {
    const additionalWorkers = updates.additionalWorkers;
    delete updates.additionalWorkers;
    updates.expenses;
    delete updates.expenses;
    updates.totalHours = this.calculateTotalHours(updates.startTime, updates.endTime, updates.breakHours, updates.manualTotalHours);

    const sbObj = {
      project_id: updates.projectId,
      created_by: updates.userId,
      date: updates.date,
      start_time: updates.startTime,
      end_time: updates.endTime,
      break_hours: updates.breakHours,
      total_hours: updates.totalHours,
      description: updates.description,
      \"Notes\": updates.notes
    };

    const { error } = await supabase.from('reports').update(sbObj).eq('id', id);
    if (error) throw error;

    if (additionalWorkers !== undefined) {
      await supabase.from('rapportini_workers').delete().eq('rapportino_id', id);
      if (additionalWorkers.length > 0) {
        const workersToAdd = additionalWorkers.map((aw: any) => {
          const hours = this.calculateTotalHours(aw.startTime, aw.endTime, aw.breakHours, aw.manualTotalHours);
          const hourlyRate = aw.hourlyRate || 0;
          const totalCost = hours * hourlyRate;

          return {
            rapportino_id: id,
            worker_id: aw.userId,
            startTime: aw.startTime,
            endTime: aw.endTime,
            breakHours: aw.breakHours,
            hours: hours,
            hourly_rate: hourlyRate,
            total_cost: totalCost,
            person_name: aw.personName || '',
            person_role: aw.personRole || '',
            membership_type: aw.membershipType || 'Interno',
            subcontractor_id: aw.subcontractorId || null,
            is_manual_override: aw.isManualOverride || false
          };
        });
        await supabase.from('rapportini_workers').insert(workersToAdd);
      }
    }
  }`;

const lines = content.split('\n');
let addStart = lines.findIndex(l => l.includes('async addReport'));
let updateStart = lines.findIndex(l => l.includes('async updateReport'));
let deleteStart = lines.findIndex(l => l.includes('async deleteReport'));

if (addStart > -1 && updateStart > -1 && deleteStart > -1) {
    lines.splice(updateStart, deleteStart - updateStart, newUpdate);
    updateStart = lines.findIndex(l => l.includes('async updateReport'));
    lines.splice(addStart, updateStart - addStart, newAdd);
    fs.writeFileSync(path, lines.join('\n'));
    console.log('Successfully reverted dbService');
} else {
    console.error('Failed to find function indices');
}
