import { Role, ReportSummary, Client } from '../types';
import { supabase } from './supabase';

class DBService {
  private currentCompanyId: string | null = null;

  constructor() { }

  public setCompanyId(id: string | null) {
    this.currentCompanyId = id;
  }

  private requireCompanyId() {
    if (!this.currentCompanyId) {
      throw new Error("company_id is required but not set in DBService.");
    }
    return this.currentCompanyId;
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

  private mapSupabaseSubcontractor(s: any): any {
    return {
      id: s.id,
      name: s.company_name,
      vatNumber: s.vatNumber || '',
      contactPerson: s.contact_person || '',
      phone: s.phone || '',
      email: s.email || '',
      economicType: s.economic_type || 'hourly',
      hourlySalary: Number(s.hourly_salary) || 0,
      totalAmount: Number(s.total_amount) || 0,
      notes: s.internal_note || '',
      status: s.status,
      createdAt: new Date(s.created_at).getTime()
    };
  }

  private mapAppSubcontractorToSupabase(s: any): any {
    return {
      company_name: s.name,
      vatNumber: s.vatNumber,
      contact_person: s.contactPerson,
      phone: s.phone,
      email: s.email,
      economic_type: s.economicType,
      hourly_salary: s.hourlySalary,
      total_amount: s.totalAmount,
      internal_note: s.notes,
      status: s.status
    };
  }

  async getSubcontractors() {
    const compId = this.requireCompanyId();
    const { data, error } = await supabase.from('subcontractors').select('*').eq('company_id', compId);
    if (error) {
      console.error('Error fetching subcontractors:', error);
      return [];
    }
    return data.map(s => this.mapSupabaseSubcontractor(s));
  }

  async addSubcontractor(sub: any) {
    const sbObj = {
      ...this.mapAppSubcontractorToSupabase(sub),
      company_id: this.requireCompanyId(),
      created_at: new Date().toISOString()
    };
    const { data, error } = await supabase.from('subcontractors').insert([sbObj]).select();
    if (error) throw error;
    return this.mapSupabaseSubcontractor(data[0]);
  }

  async updateSubcontractor(id: string, updates: any) {
    const sbObj = this.mapAppSubcontractorToSupabase(updates);
    const { error } = await supabase.from('subcontractors').update(sbObj).eq('id', id);
    if (error) throw error;
  }

  async deleteSubcontractor(id: string) {
    await supabase.from('workers').update({ subcontractor_id: null }).eq('subcontractor_id', id);
    const { error } = await supabase.from('subcontractors').delete().eq('id', id);
    if (error) throw error;
  }

  async getUsers() {
    const compId = this.requireCompanyId();
    const { data, error } = await supabase.from('workers').select('*').eq('company_id', compId);
    if (error) {
      console.error('Error fetching workers:', error);
      return [];
    }
    return data.map(w => this.mapSupabaseWorker(w));
  }

  async getUserById(id: string) {
    const { data, error } = await supabase.from('workers').select('*').eq('id', id).single();
    if (error && error.code !== 'PGRST116') console.error('Error fetching user:', error);
    return data ? this.mapSupabaseWorker(data) : null;
  }

  async registerCompany(companyName: string, adminName: string, adminUsername: string, adminPassword: string) {
    // 1. Create company
    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .insert([{ name: companyName }])
      .select();
    if (companyError) throw companyError;
    const newCompanyId = companyData[0].id;

    // 2. Create admin worker
    const sbObj = {
      name: adminName,
      username: adminUsername,
      password_hash: adminPassword,
      role: 'admin',
      status: 'active',
      company_id: newCompanyId,
      created_at: new Date().toISOString()
    };
    const { data: userData, error: userError } = await supabase.from('workers').insert([sbObj]).select();
    if (userError) throw userError;

    return this.mapSupabaseWorker(userData[0]);
  }

  async loginUser(username: string) {
    // We cannot use getUsers() during login because requireCompanyId() would throw.
    // We must query the database directly by username.
    const { data, error } = await supabase
      .from('workers')
      .select('*')
      .eq('username', username)
      .eq('status', 'active')
      .limit(1);

    if (error) {
      console.error('Login error:', error);
      return null;
    }

    if (!data || data.length === 0) return null;
    return this.mapSupabaseWorker(data[0]);
  }

  async addUser(user: any) {
    const sbObj = {
      ...this.mapAppWorkerToSupabase(user),
      company_id: this.requireCompanyId(),
      created_at: new Date().toISOString()
    };
    const { data, error } = await supabase.from('workers').insert([sbObj]).select();
    if (error) throw error;
    return this.mapSupabaseWorker(data[0]);
  }

  async updateUser(id: string, updates: any) {
    const sbObj = this.mapAppWorkerToSupabase(updates);
    const { error } = await supabase.from('workers').update(sbObj).eq('id', id);
    if (error) throw error;
  }

  async deleteUser(id: string) {
    // 1. Remove references from rapportini_workers to avoid foreign key constraints
    await supabase.from('rapportini_workers').delete().eq('worker_id', id);

    // 2. Delete the user
    const { error } = await supabase.from('workers').delete().eq('id', id);
    if (error) throw error;
  }

  private mapSupabaseWorker(w: any): any {
    return {
      id: w.id,
      name: w.name,
      email: w.email || '',
      phone: w.phone || '',
      role: w.role,
      status: w.status,
      username: w.username || '',
      password: w.password_hash || '',
      companyId: w.company_id || null,
      subcontractorId: w.subcontractor_id || null,
      hourlyRate: Number(w.hourly_rate) || 0,
      createdAt: new Date(w.created_at).getTime()
    };
  }

  private mapAppWorkerToSupabase(w: any): any {
    const obj: any = {
      name: w.name,
      email: w.email,
      phone: w.phone,
      role: w.role,
      status: w.status,
      username: w.username,
      company_id: w.companyId,
      subcontractor_id: w.subcontractorId,
      hourly_rate: w.hourlyRate
    };
    if (w.password || w.password_hash) obj.password_hash = w.password || w.password_hash;
    return obj;
  }

  private mapSupabaseClient(c: any): Client {
    return {
      id: c.id,
      name: c.name,
      vatNumber: c.vat_number || '',
      billingAddress: c.billingAddress || '',
      mainContactName: c.contact_person || '',
      mainContactPhone: c.phone || '',
      email: c.email || '',
      notes: c.internal_note || '',
      status: c.status,
      createdAt: new Date(c.created_at).getTime()
    };
  }

  private mapAppClientToSupabase(client: any): any {
    return {
      name: client.name,
      vat_number: client.vatNumber,
      billingAddress: client.billingAddress,
      contact_person: client.mainContactName,
      phone: client.mainContactPhone,
      email: client.email,
      internal_note: client.notes,
      status: client.status
    };
  }

  async getClients() {
    const compId = this.requireCompanyId();
    const { data, error } = await supabase.from('clients').select('*').eq('company_id', compId);
    if (error) {
      console.error('Error fetching clients:', error);
      return [];
    }
    return data.map(c => this.mapSupabaseClient(c));
  }

  async addClient(client: any) {
    const sbClient = {
      ...this.mapAppClientToSupabase(client),
      company_id: this.requireCompanyId(),
      created_at: new Date().toISOString()
    };
    const { data, error } = await supabase.from('clients').insert([sbClient]).select();
    if (error) throw error;
    return this.mapSupabaseClient(data[0]);
  }

  async updateClient(id: string, updates: any) {
    const sbClient = this.mapAppClientToSupabase(updates);
    const { error } = await supabase.from('clients').update(sbClient).eq('id', id);
    if (error) throw error;
  }

  async deleteClient(id: string) {
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (error) throw error;
  }

  private mapSupabaseProject(p: any): any {
    return {
      id: p.id,
      clientId: p.client_id,
      companyId: p.company_id || null,
      name: p.title,
      description: p.description || '',
      address: p.site_address || '',
      contactPerson: p.contact_person || '',
      phone: p.phone || '',
      status: p.status,
      financialAgreement: p.economic_type || 'hourly',
      sellingPrice: Number(p.hourly_sale_price) || Number(p.total_amount) || 0,
      notes: p.internal_note || '',
      createdAt: new Date(p.created_at).getTime()
    };
  }

  private mapAppProjectToSupabase(p: any): any {
    return {
      client_id: p.clientId,
      title: p.name,
      description: p.description,
      site_address: p.address,
      status: p.status,
      economic_type: p.financialAgreement,
      hourly_sale_price: p.financialAgreement === 'hourly' ? p.sellingPrice : null,
      total_amount: p.financialAgreement === 'fixed' ? p.sellingPrice : null
    };
  }

  async getProjects() {
    const compId = this.requireCompanyId();
    const { data, error } = await supabase.from('projects').select('*').eq('company_id', compId);
    if (error) {
      console.error('Error fetching projects:', error);
      return [];
    }
    return data.map(p => this.mapSupabaseProject(p));
  }

  async addProject(project: any) {
    const sbObj = {
      ...this.mapAppProjectToSupabase(project),
      company_id: this.requireCompanyId(),
      created_at: new Date().toISOString()
    };
    const { data, error } = await supabase.from('projects').insert([sbObj]).select();
    if (error) throw error;
    return this.mapSupabaseProject(data[0]);
  }

  async updateProject(id: string, updates: any) {
    const sbObj = this.mapAppProjectToSupabase(updates);
    const { error } = await supabase.from('projects').update(sbObj).eq('id', id);
    if (error) throw error;
  }

  async deleteProject(id: string) {
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) throw error;
  }

  private mapSupabaseReport(r: any): any {
    return {
      id: r.id,
      projectId: r.project_id,
      userId: r.created_by,
      date: r.date,
      startTime: r.start_time,
      endTime: r.end_time,
      breakHours: Number(r.break_hours) || 0,
      totalHours: Number(r.total_hours) || 0,
      description: r.description || '',
      notes: r.Notes || '',
      expenses: r.expenses || [],
      additionalWorkers: (r.additionalWorkers || []).map((aw: any) => ({
        userId: aw.worker_id,
        startTime: aw.startTime ? (aw.startTime.includes('T') ? aw.startTime.split('T')[1].substring(0, 5) : aw.startTime) : '',
        endTime: aw.endTime ? (aw.endTime.includes('T') ? aw.endTime.split('T')[1].substring(0, 5) : aw.endTime) : '',
        breakHours: Number(aw.breakHours),
        totalHours: Number(aw.hours),
        hourlyRate: Number(aw.hourly_rate) || 0,
        totalCost: Number(aw.tal_cost) || Number(aw.total_cost) || 0,
        personName: aw.erson_name || aw.person_name || '',
        personRole: aw.person_role || '',
        membershipType: aw.membership_type || 'Interno',
        subcontractorId: aw.subcontractor_id,
        isManualOverride: aw.is_manual_override || false
      })),
      invoiceStatus: r.invoice_status || 'Pending',
      createdAt: new Date(r.created_at).getTime()
    };
  }

  async getReports(userId?: string, role?: Role) {
    const compId = this.requireCompanyId();
    let query = supabase.from('reports').select(`*, additionalWorkers:rapportini_workers(*)`).eq('company_id', compId);

    if (role !== 'admin' && userId) {
      const { data, error } = await query;
      if (error) {
        console.error('Error fetching reports:', error);
        return [];
      }
      return data.map(r => this.mapSupabaseReport(r)).filter((r: any) =>
        r.userId === userId ||
        r.additionalWorkers.some((aw: any) => aw.userId === userId)
      );
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching reports:', error);
      return [];
    }
    return data.map(r => this.mapSupabaseReport(r));
  }

  async addReport(report: any) {
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
      "Notes": report.notes,
      company_id: this.requireCompanyId(),
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase.from('reports').insert([newReport]).select();
    if (error) throw error;

    const createdReportId = data[0].id;

    await supabase.from('reports').update({ invoice_status: report.invoiceStatus || 'Pending' }).eq('id', createdReportId);

    if (additionalWorkers.length > 0) {
      const workersToAdd = additionalWorkers.map((aw: any) => {
        const hours = this.calculateTotalHours(aw.startTime, aw.endTime, aw.breakHours, aw.manualTotalHours);
        const hourlyRate = aw.hourlyRate || 0;
        const totalCost = hours * hourlyRate;

        return {
          rapportino_id: createdReportId,
          worker_id: aw.userId,
          startTime: aw.startTime?.length === 5 ? `${report.date}T${aw.startTime}:00` : aw.startTime,
          endTime: aw.endTime?.length === 5 ? `${report.date}T${aw.endTime}:00` : aw.endTime,
          breakHours: aw.breakHours,
          hours: hours,
          hourly_rate: hourlyRate,
          tal_cost: totalCost,
          erson_name: aw.personName || '',
          person_role: aw.personRole || '',
          membership_type: aw.membershipType || 'Interno',
          subcontractor_id: aw.subcontractorId || null,
          is_manual_override: aw.isManualOverride || false
        };
      });
      const { error: insErr } = await supabase.from('rapportini_workers').insert(workersToAdd);
      if (insErr) {
        console.error('Error inserting additional workers:', insErr);
        throw insErr;
      }
    }

    return this.mapSupabaseReport({ ...data[0], additionalWorkers });
  }
  async updateReport(id: string, updates: any) {
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
      "Notes": updates.notes
    };

    const { error } = await supabase.from('reports').update(sbObj).eq('id', id);
    if (error) throw error;

    await supabase.from('reports').update({ invoice_status: updates.invoiceStatus || 'Pending' }).eq('id', id);

    if (additionalWorkers !== undefined) {
      const { error: delErr } = await supabase.from('rapportini_workers').delete().eq('rapportino_id', id);
      if (delErr) { console.error('Error deleting workers:', delErr); throw delErr; }
      if (additionalWorkers.length > 0) {
        const workersToAdd = additionalWorkers.map((aw: any) => {
          const hours = this.calculateTotalHours(aw.startTime, aw.endTime, aw.breakHours, aw.manualTotalHours);
          const hourlyRate = aw.hourlyRate || 0;
          const totalCost = hours * hourlyRate;

          return {
            rapportino_id: id,
            worker_id: aw.userId,
            startTime: aw.startTime?.length === 5 ? `${updates.date}T${aw.startTime}:00` : aw.startTime,
            endTime: aw.endTime?.length === 5 ? `${updates.date}T${aw.endTime}:00` : aw.endTime,
            breakHours: aw.breakHours,
            hours: hours,
            hourly_rate: hourlyRate,
            tal_cost: totalCost,
            erson_name: aw.personName || '',
            person_role: aw.personRole || '',
            membership_type: aw.membershipType || 'Interno',
            subcontractor_id: aw.subcontractorId || null,
            is_manual_override: aw.isManualOverride || false
          };
        });
        const { error: updInsErr } = await supabase.from('rapportini_workers').insert(workersToAdd);
        if (updInsErr) { console.error('Error inserting workers on update:', updInsErr); throw updInsErr; }
      }
    }
  }
  async deleteReport(id: string) {
    const { error } = await supabase.from('reports').delete().eq('id', id);
    if (error) throw error;
  }

  async getSummary(): Promise<ReportSummary[]> {
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
        hourlyRevenue: sellingPrice,
        cost: workerCost,
        hourlyCost: user?.hourlyRate || 0,
        personnelCost: user?.subcontractorId ? 0 : workerCost,
        subcontractorCost: user?.subcontractorId ? workerCost : 0,
        invoiceStatus: r.invoice_status || 'Pending',
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
          hourlyRevenue: sellingPrice,
          cost: awCost,
          hourlyCost: awUser?.hourlyRate || 0,
          personnelCost: awUser?.subcontractorId ? 0 : awCost,
          subcontractorCost: awUser?.subcontractorId ? awCost : 0,
          invoiceStatus: r.invoice_status || 'Pending',
          createdAt: r.createdAt
        });
      });

      return summaries;
    }).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
}

export const db = new DBService();