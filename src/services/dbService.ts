import { User, Client, Project, WorkReport, Role, ReportSummary, Subcontractor } from '../types';

const INITIAL_SUBS = [
  { id: 's1', name: 'Impresa Gamma Srl', vatNumber: '09876543210', contactPerson: 'Sig. Rossi', phone: '02-555666', email: 'info@impresagamma.it', createdAt: Date.now() }
];

const INITIAL_USERS = [
  { id: 'u1', name: 'Mario Rossi', username: 'admin', password: 'password123', email: 'mario@works-summary.it', role: 'admin' as Role, status: 'active' as const, hourlyRate: 25, extraCost: 0, phone: '3331234567', address: 'Via Roma 1, Milano', notes: 'Amministratore di sistema', createdAt: Date.now() },
  { id: 'u2', name: 'Luca Bianchi', username: 'luca', password: 'password123', email: 'luca@works-summary.it', role: 'operator' as Role, status: 'active' as const, hourlyRate: 20, extraCost: 5, phone: '3339876543', address: 'Via Milano 2, Roma', notes: 'Tecnico trasfertista', subcontractorId: 's1', createdAt: Date.now() + 1 },
  { id: 'u3', name: 'Giulia Verdi', username: 'giulia', password: 'password123', email: 'giulia@works-summary.it', role: 'supervisor' as Role, status: 'active' as const, hourlyRate: 22, extraCost: 0, phone: '3335554443', address: 'Via Dante 5, Torino', notes: 'Responsabile cantiere', createdAt: Date.now() + 2 },
];

const INITIAL_CLIENTS = [
  { id: 'c1', name: 'Edilizia Futura S.p.A.', vatNumber: '12345678901', billingAddress: 'Via Roma 10, Milano', mainContactName: 'Ing. Neri', mainContactPhone: '02-123456', email: 'amministrazione@ediliziafutura.it', status: 'active' as const, createdAt: Date.now() },
  { id: 'c2', name: 'Residenza il Bosco', vatNumber: '09827364512', billingAddress: 'Piazza Garibaldi 2, Monza', mainContactName: 'Arch. Bianchi', mainContactPhone: '039-223344', email: 'info@ilbosco.it', status: 'active' as const, createdAt: Date.now() + 100 },
  { id: 'c3', name: 'Global Service S.p.A.', vatNumber: '11223344556', billingAddress: 'Corso Italia 45, Milano', mainContactName: 'Dott. Ferrari', mainContactPhone: '02-998877', email: 'segreteria@globalservice.it', status: 'active' as const, createdAt: Date.now() + 200 },
];

const INITIAL_PROJECTS = [
  { id: 'p1', clientId: 'c1', name: 'Ristrutturazione Condominio Sole', description: 'Rifacimento facciate e tetto', status: 'active' as const, sellingPrice: 65, createdAt: Date.now() },
  { id: 'p2', clientId: 'c2', name: 'Impianto Fotovoltaico Villa Blu', description: 'Installazione pannelli e accumulo', status: 'active' as const, sellingPrice: 55, createdAt: Date.now() + 10 },
  { id: 'p3', clientId: 'c3', name: 'Manutenzione Straordinaria Centro Verde', description: 'Intervento urgente tubazioni', status: 'active' as const, sellingPrice: 70, createdAt: Date.now() + 20 },
];

class DBService {
  private users: User[] = [];
  private clients: Client[] = [];
  private projects: Project[] = [];
  private reports: WorkReport[] = [];
  private subcontractors: any[] = [];
  
  constructor() {
    this.loadFromStorage();
  }
  
  private loadFromStorage() {
    try {
      this.users = JSON.parse(localStorage.getItem('ws_users') || JSON.stringify(INITIAL_USERS));
      this.clients = JSON.parse(localStorage.getItem('ws_clients') || JSON.stringify(INITIAL_CLIENTS));
      this.projects = JSON.parse(localStorage.getItem('ws_projects') || JSON.stringify(INITIAL_PROJECTS));
      this.reports = JSON.parse(localStorage.getItem('ws_reports') || '[]');
      this.subcontractors = JSON.parse(localStorage.getItem('ws_subcontractors') || JSON.stringify(INITIAL_SUBS));
    } catch (error) {
      console.error('Errore caricamento dati da localStorage:', error);
      this.users = INITIAL_USERS;
      this.clients = INITIAL_CLIENTS;
      this.projects = INITIAL_PROJECTS;
      this.reports = [];
      this.subcontractors = INITIAL_SUBS;
    }
  }
  
  private save() {
    try {
      localStorage.setItem('ws_users', JSON.stringify(this.users));
      localStorage.setItem('ws_clients', JSON.stringify(this.clients));
      localStorage.setItem('ws_projects', JSON.stringify(this.projects));
      localStorage.setItem('ws_reports', JSON.stringify(this.reports));
      localStorage.setItem('ws_subcontractors', JSON.stringify(this.subcontractors));
    } catch (error) {
      console.error('Errore salvataggio dati in localStorage:', error);
    }
  }

  public calculateTotalHours(startTime: string, endTime: string, breakHours: number, manualTotal?: number): number {
    if (manualTotal !== undefined && manualTotal !== null && manualTotal > 0) {
      return Number(manualTotal);
    }
    if (!startTime || !endTime) return 0;
    
    const start = new Date(`1970-01-01T${startTime}`);
    const end = new Date(`1970-01-01T${endTime}`);
    let diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    diff -= (breakHours || 0);
    return Number(Math.max(0, diff).toFixed(2));
  }

  getSubcontractors() { return this.subcontractors; }
  addSubcontractor(sub: any) {
    const newSub = { ...sub, id: Math.random().toString(36).substr(2, 9), createdAt: Date.now() };
    this.subcontractors.push(newSub);
    this.save();
    return newSub;
  }
  updateSubcontractor(id: string, updates: any) {
    this.subcontractors = this.subcontractors.map(s => s.id === id ? { ...s, ...updates } : s);
    this.save();
  }
  deleteSubcontractor(id: string) {
    this.users = this.users.map(u => u.subcontractorId === id ? { ...u, subcontractorId: undefined } : u);
    this.subcontractors = this.subcontractors.filter(s => s.id !== id);
    this.save();
  }

  getUsers() { return this.users; }
  getUserById(id: string) { return this.users.find(u => u.id === id); }
  addUser(user: any) {
    const newUser = { ...user, id: Math.random().toString(36).substr(2, 9), createdAt: Date.now() };
    this.users.push(newUser);
    this.save();
    return newUser;
  }
  updateUser(id: string, updates: any) {
    this.users = this.users.map(u => u.id === id ? { ...u, ...updates } : u);
    this.save();
  }
  deleteUser(id: string) {
    this.reports = this.reports.filter(r => r.userId !== id);
    this.users = this.users.filter(u => u.id !== id);
    this.save();
  }

  getClients() { return this.clients; }
  addClient(client: any) {
    const newClient = { ...client, id: Math.random().toString(36).substr(2, 9), createdAt: Date.now() };
    this.clients.push(newClient);
    this.save();
    return newClient;
  }
  updateClient(id: string, updates: any) {
    this.clients = this.clients.map(c => c.id === id ? { ...c, ...updates } : c);
    this.save();
  }
  deleteClient(id: string) {
    const projectsToDelete = this.projects.filter(p => p.clientId === id).map(p => p.id);
    this.reports = this.reports.filter(r => !projectsToDelete.includes(r.projectId));
    this.projects = this.projects.filter(p => p.clientId !== id);
    this.clients = this.clients.filter(c => c.id !== id);
    this.save();
  }

  getProjects() { return this.projects; }
  addProject(project: any) {
    const newProject = { ...project, id: Math.random().toString(36).substr(2, 9), createdAt: Date.now() };
    this.projects.push(newProject);
    this.save();
    return newProject;
  }
  updateProject(id: string, updates: any) {
    this.projects = this.projects.map(p => p.id === id ? { ...p, ...updates } : p);
    this.save();
  }
  deleteProject(id: string) {
    this.reports = this.reports.filter(r => r.projectId !== id);
    this.projects = this.projects.filter(p => p.id !== id);
    this.save();
  }

  getReports(userId?: string, role?: Role) {
    if (role === 'admin') return this.reports;
    return this.reports.filter(r => r.userId === userId || r.additionalWorkers.some(aw => aw.userId === userId));
  }
  addReport(report: any) {
    const totalHours = this.calculateTotalHours(report.startTime, report.endTime, report.breakHours, report.manualTotalHours);
    const newReport: any = {
      ...report,
      id: Math.random().toString(36).substr(2, 9),
      totalHours,
      expenses: report.expenses || [],
      additionalWorkers: report.additionalWorkers || [],
      createdAt: Date.now()
    };
    this.reports.push(newReport);
    this.save();
    return newReport;
  }
  updateReport(id: string, updates: any) {
    this.reports = this.reports.map(r => {
      if (r.id === id) {
        const merged = { ...r, ...updates };
        merged.totalHours = this.calculateTotalHours(merged.startTime, merged.endTime, merged.breakHours, merged.manualTotalHours);
        if (merged.additionalWorkers) {
          merged.additionalWorkers = merged.additionalWorkers.map((aw: any) => ({
            ...aw,
            totalHours: this.calculateTotalHours(aw.startTime, aw.endTime, aw.breakHours, aw.manualTotalHours)
          }));
        }
        return merged;
      }
      return r;
    });
    this.save();
  }
  deleteReport(id: string) {
    this.reports = this.reports.filter(r => r.id !== id);
    this.save();
  }

  getSummary(): ReportSummary[] {
    return this.reports.map(r => {
      const project = this.projects.find(p => p.id === r.projectId);
      const client = this.clients.find(c => c.id === project?.clientId);
      const user = this.users.find(u => u.id === r.userId);
      const totalExp = (r.expenses || []).reduce((sum: number, e: any) => sum + e.amount, 0);
      const sellingPrice = project?.sellingPrice || 0;
      const teamHours = r.totalHours + r.additionalWorkers.reduce((sum: number, aw: any) => sum + aw.totalHours, 0);
      const totalRevenue = teamHours * sellingPrice;
      let totalCost = (r.totalHours * (user?.hourlyRate || 0)) + (user?.extraCost || 0);
      r.additionalWorkers.forEach((aw: any) => {
        const wInfo = this.users.find(u => u.id === aw.userId);
        totalCost += (aw.totalHours * (wInfo?.hourlyRate || 0)) + (wInfo?.extraCost || 0);
      });
      return {
        id: r.id,
        date: r.date,
        projectName: project?.name || 'Sconosciuto',
        clientName: client?.name || 'Sconosciuto',
        userName: user?.name || 'Sconosciuto',
        userId: r.userId,
        totalHours: teamHours,
        totalExpenses: totalExp,
        description: r.description,
        revenue: totalRevenue,
        cost: totalCost,
        createdAt: r.createdAt
      };
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
}

export const db = new DBService();
