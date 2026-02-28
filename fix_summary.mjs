import fs from 'fs';
const path = 'c:/Users/jtw/Euro JTW/Archivi/JTW/Programmi/jobs-report-complete/src/services/dbService.ts';
let content = fs.readFileSync(path, 'utf8');

const oldLines = content.split('\n');
let summaryStart = oldLines.findIndex(l => l.includes('async getSummary():'));

const newSummary = `  async getSummary(): Promise<ReportSummary[]> {
    const [reports, projects, clients, workers] = await Promise.all([
      this.getReports('admin', 'admin'),
      this.getProjects(),
      this.getClients(),
      this.getUsers()
    ]);

    return reports.flatMap((r: any) => {
      const project = projects.find((p: any) => p.id === r.projectId);
      const client = clients.find((c: any) => c.id === project?.clientId);
      const sellingPrice = project?.sellingPrice || 0;

      const summaries = [];

      const user = workers.find((u: any) => u.id === r.userId);
      const workerCost = (r.totalHours * (user?.hourlyRate || 0)) + (user?.extraCost || 0);

      summaries.push({
        id: r.id + '_main',
        date: r.date,
        projectName: project?.name || 'Sconosciuto',
        projectId: project?.id,
        projectStatus: project?.status || 'Attivo',
        clientName: client?.name || 'Sconosciuto',
        userName: user?.name || 'Sconosciuto',
        userId: r.userId,
        subcontractorId: user?.subcontractorId || null,
        totalHours: r.totalHours,
        totalExpenses: 0,
        description: r.description,
        revenue: r.totalHours * sellingPrice,
        cost: workerCost,
        personnelCost: user?.subcontractorId ? 0 : workerCost,
        subcontractorCost: user?.subcontractorId ? workerCost : 0,
        createdAt: r.createdAt
      });

      const additionalWorkers = r.additionalWorkers || [];
      additionalWorkers.forEach((aw: any, idx: number) => {
        const awUser = workers.find((u: any) => u.id === aw.userId);
        const awCost = (aw.totalHours * (awUser?.hourlyRate || 0)) + (awUser?.extraCost || 0);

        summaries.push({
          id: r.id + '_aw_' + idx,
          date: r.date,
          projectName: project?.name || 'Sconosciuto',
          projectId: project?.id,
          projectStatus: project?.status || 'Attivo',
          clientName: client?.name || 'Sconosciuto',
          userName: awUser?.name || aw.personName || 'Sconosciuto',
          userId: aw.userId,
          subcontractorId: awUser?.subcontractorId || null,
          totalHours: aw.totalHours,
          totalExpenses: 0,
          description: r.description,
          revenue: aw.totalHours * sellingPrice,
          cost: awCost,
          personnelCost: awUser?.subcontractorId ? 0 : awCost,
          subcontractorCost: awUser?.subcontractorId ? awCost : 0,
          createdAt: r.createdAt
        });
      });

      return summaries;
    }).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }`;

if (summaryStart > -1) {
    oldLines.splice(summaryStart, oldLines.length - summaryStart - 1, newSummary);
    fs.writeFileSync(path, oldLines.join('\n'));
    console.log('Success');
}
