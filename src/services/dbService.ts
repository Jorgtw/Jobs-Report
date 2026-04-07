import { Role, ReportSummary, Client, InternalCommunication, CommunicationTargetType, MessageType } from '../types';
import { supabase } from './supabase';

class DBService {
  private currentCompanyId: string | null = null;
  private currentUserId: string | null = null;
  private isSuperAdminRole: boolean = false;

  constructor() { }

  public setCompanyId(id: string | null) {
    this.currentCompanyId = id;
  }

  public setUserId(id: string | null) {
    this.currentUserId = id;
  }

  public setIsSuperAdmin(isSA: boolean) {
    this.isSuperAdminRole = isSA;
  }

  private requireCompanyId(): string {
    if (!this.currentCompanyId && !this.isSuperAdminRole) {
      throw new Error("company_id is required but not set in DBService.");
    }
    return this.currentCompanyId || '';
  }

  private requireUserId(): string {
    if (!this.currentUserId) {
      throw new Error("user_id is required but not set in DBService.");
    }
    return this.currentUserId;
  }

  async uploadFile(bucket: string, path: string, file: Blob | File) {
    const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: '3600',
      upsert: true
    });
    if (error) throw error;
    return data;
  }

  async getSignedUrl(bucket: string, path: string, expiresInSeconds: number = 604800) {
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresInSeconds);
    if (error) throw error;
    return data.signedUrl;
  }




  private formatForTimestamp(date: string, time: string | null | undefined): string | null {
    if (!time) return null;
    if (time.includes('T')) return time; 
    const cleanTime = time.trim().substring(0, 5);
    return `${date}T${cleanTime}:00`;
  }

  private formatForTime(time: string | null | undefined): string | null {
    if (!time) return null;
    if (time.includes('T')) return time.split('T')[1].substring(0, 8);
    const cleanTime = time.trim();
    if (cleanTime.length === 5) return `${cleanTime}:00`;
    return cleanTime.substring(0, 8);
  }

  private extractTimeOnly(time: string | null | undefined): string {
    if (!time) return '';
    const t = time.trim();
    if (t.includes('T')) return t.split('T')[1].substring(0, 5);
    return t.substring(0, 5);
  }

  private async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  public calculateTotalHours(startTime: string, endTime: string, breakHours: number, manualTotal?: number): number {
    if (manualTotal !== undefined && manualTotal !== null) {
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
      billingType: s.economic_type || 'hourly',
      amount: Number(s.economic_type === 'fixed' ? s.total_amount : s.hourly_salary) || 0,
      notes: s.internal_note || '',
      status: s.status,
      address: s.address || '',
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
      economic_type: s.billingType,
      hourly_salary: s.billingType === 'hourly' ? s.amount : 0,
      total_amount: s.billingType === 'fixed' ? s.amount : 0,
      internal_note: s.notes,
      status: s.status,
      address: s.address
    };
  }

  async getSubcontractors() {
    const compId = this.requireCompanyId();
    let query = supabase.from('subcontractors').select('*');
    if (compId) query = query.eq('company_id', compId);
    
    const { data, error } = await query;
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
    let query = supabase.from('workers').select('*');
    if (compId) query = query.eq('company_id', compId);

    const { data, error } = await query;
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
    // 1. Check if username already exists globally
    const { data: existingUser, error: checkErr } = await supabase
      .from('workers')
      .select('id')
      .eq('username', adminUsername)
      .maybeSingle();

    if (checkErr) throw checkErr;
    if (existingUser) {
      throw new Error(`L'username '${adminUsername}' è già in uso. Scegline un altro.`);
    }

    // 2. Create company
    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .insert([{ name: companyName, status: 'active' }])
      .select();
    if (companyError) throw companyError;
    const newCompanyId = companyData[0].id;

    // 3. Create admin worker
    const hashedPassword = await this.hashPassword(adminPassword);
    const sbObj = {
      ...this.mapAppWorkerToSupabase({
        name: adminName,
        username: adminUsername,
        password: hashedPassword,
        role: 'admin',
        status: 'active',
        companyId: newCompanyId
      }),
      created_at: new Date().toISOString()
    };
    // Ensure both fields are set
    sbObj.password = hashedPassword;
    sbObj.password_hash = hashedPassword;

    const { data: userData, error: userError } = await supabase.from('workers').insert([sbObj]).select();
    if (userError) throw userError;

    // 4. Create an internal client and project for absences and internal notes
    const internalClientName = `${companyName} - Uso Interno`;
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .insert([{
        company_id: newCompanyId,
        name: internalClientName,
        status: 'active',
        created_at: new Date().toISOString()
      }])
      .select();
    
    if (!clientError && clientData && clientData.length > 0) {
      const internalClientId = clientData[0].id;
      await supabase
        .from('projects')
        .insert([{
          company_id: newCompanyId,
          client_id: internalClientId,
          title: 'Rapportino interno',
          status: 'active',
          economic_type: 'hourly',
          hourly_sale_price: 0,
          is_internal: true,
          created_at: new Date().toISOString()
        }]);
    }

    return this.mapSupabaseWorker(userData[0]);
  }

  // --- Company Management Methods (SuperAdmin Only) ---
  private mapSupabaseCompany(c: any): any {
    return {
      id: c.id,
      name: c.name,
      status: c.status || 'active',
      is_premium: !!c.is_premium,
      address: c.address || '',
      phone: c.phone || '',
      email: c.email || '',
      vatNumber: c.vat_number || '',
      city: c.city || '',
      country: c.country || '',
      createdAt: new Date(c.created_at).getTime()
    };
  }

  async getCompanyDetails(companyId: string): Promise<any> {
    const { data, error } = await supabase.from('companies').select('*').eq('id', companyId).single();
    if (error || !data) return null;
    return this.mapSupabaseCompany(data);
  }

  async getCompanyAdminEmails(companyId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('workers')
      .select('email')
      .eq('company_id', companyId)
      .eq('role', 'admin')
      .eq('status', 'active');
    if (error || !data) return [];
    return data.map((w: any) => w.email).filter(Boolean);
  }

  async updateCompanyDetails(id: string, details: { address?: string; phone?: string; email?: string; vatNumber?: string; city?: string; country?: string }) {
    const { error } = await supabase.from('companies').update({
      address: details.address,
      phone: details.phone,
      email: details.email,
      vat_number: details.vatNumber,
      city: details.city,
      country: details.country,
    }).eq('id', id);
    if (error) throw error;
  }

  async getAllCompanies() {
    const { data: companies, error } = await supabase.from('companies').select('*');
    if (error) {
      console.error('Error fetching companies:', error);
      return [];
    }

    const { data: workers, error: wError } = await supabase.from('workers').select('*').eq('role', 'admin');

    return companies.map(c => {
      const comp = this.mapSupabaseCompany(c);
      if (!wError && workers) {
        const admin = workers.find((w: any) => w.company_id === c.id);
        if (admin) {
          comp.adminId = admin.id;
          comp.adminName = admin.name;
          comp.username = admin.username;
          comp.password = admin.password_hash || admin.password || '';
        }
      }
      return comp;
    });
  }

  async togglePremiumStatus(id: string, currentStatus: boolean) {
    const newStatus = !currentStatus;
    const updates: any = { is_premium: newStatus };
    if (newStatus) {
      updates.premium_since = new Date().toISOString();
    } else {
      updates.premium_since = null;
    }
    const { error } = await supabase.from('companies').update(updates).eq('id', id);
    if (error) throw error;
    return newStatus;
  }

  async setPremiumStatus(id: string, isPremium: boolean) {
    const updates: any = { is_premium: isPremium };
    if (isPremium) {
      updates.premium_since = new Date().toISOString();
    }
    const { error } = await supabase.from('companies').update(updates).eq('id', id);
    if (error) throw error;
  }

  async updateCompany(id: string, updates: any) {
    const { error } = await supabase.from('companies').update(updates).eq('id', id);
    if (error) throw error;
  }

  async updateCompanyAndAdmin(companyId: string, companyName: string, adminId?: string, adminName?: string, username?: string, password?: string) {
    if (username && adminId) {
      const { data: existingUser, error: checkErr } = await supabase
        .from('workers')
        .select('id')
        .eq('username', username)
        .neq('id', adminId)
        .maybeSingle();

      if (checkErr) throw checkErr;
      if (existingUser) throw new Error(`L'username '${username}' è già in uso.`);
    }

    const { error: cError } = await supabase.from('companies').update({ name: companyName }).eq('id', companyId);
    if (cError) throw cError;

    if (adminId) {
      const userUpdates: any = {};
      if (adminName) userUpdates.name = adminName;
      if (username) userUpdates.username = username;
      if (password) {
        userUpdates.password = password;
        userUpdates.password_hash = password; // For superadmin company management, store plain text
      }

      if (Object.keys(userUpdates).length > 0) {
        const { error: uError } = await supabase.from('workers').update(userUpdates).eq('id', adminId);
        if (uError) throw uError;
      }
    }
  }

  async toggleCompanyStatus(id: string, currentStatus: string) {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const { error } = await supabase.from('companies').update({ status: newStatus }).eq('id', id);
    if (error) throw error;
    return newStatus;
  }

  async deleteCompany(id: string) {
    // 1. Trova tutti i report della ditta
    const { data: reports } = await supabase.from('reports').select('id').eq('company_id', id);
    if (reports && reports.length > 0) {
      const reportIds = reports.map((r: any) => r.id);
      // Elimina workers e spese dei rapportini
      await supabase.from('rapportini_workers').delete().in('rapportino_id', reportIds);
      // Prova anche con report_id (per sicurezza)
      await supabase.from('rapportini_workers').delete().in('report_id', reportIds);
    }
    // 2. Elimina i report della ditta
    await supabase.from('reports').delete().eq('company_id', id);
    // 3. Elimina utenti, subappaltatori, progetti, clienti
    await supabase.from('workers').delete().eq('company_id', id);
    await supabase.from('subcontractors').delete().eq('company_id', id);
    await supabase.from('projects').delete().eq('company_id', id);
    await supabase.from('clients').delete().eq('company_id', id);
    // 4. Elimina la ditta
    const { error } = await supabase.from('companies').delete().eq('id', id);
    if (error) throw error;
  }


  // --- Utility Methods ---
  async getGlobalWeeklyStats() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const isoDate = sevenDaysAgo.toISOString();

    const [newCompanies, activeCompanies, totalReports, newPremiums] = await Promise.all([
      // 1. New Companies
      supabase.from('companies').select('id', { count: 'exact', head: true }).gt('created_at', isoDate),
      // 2. Active Companies (had at least one report in last 7 days)
      supabase.from('reports').select('company_id', { count: 'exact', head: false }).gt('created_at', isoDate),
      // 3. Total Reports
      supabase.from('reports').select('id', { count: 'exact', head: true }).gt('created_at', isoDate),
      // 4. New Premium Upgrades
      supabase.from('companies').select('id', { count: 'exact', head: true }).gt('premium_since', isoDate)
    ]);

    // Unique active company count
    const uniqueActiveCompanies = activeCompanies.data ? new Set(activeCompanies.data.map(r => r.company_id)).size : 0;

    return {
      newCompanies: newCompanies.count || 0,
      activeCompanies: uniqueActiveCompanies,
      totalReports: totalReports.count || 0,
      newPremiums: newPremiums.count || 0
    };
  }

  async getGlobalWeeklyActiveCompaniesList() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const isoDate = sevenDaysAgo.toISOString();

    // Get reports and their related company names
    const { data: reports, error } = await supabase
      .from('reports')
      .select('company_id, companies(name)')
      .gt('created_at', isoDate);

    if (error) return [];

    const statsMap: Record<string, { name: string, count: number }> = {};
    reports.forEach((r: any) => {
      const cid = r.company_id;
      const name = r.companies?.name || 'Unknown';
      if (!statsMap[cid]) {
        statsMap[cid] = { name, count: 0 };
      }
      statsMap[cid].count++;
    });

    return Object.values(statsMap).sort((a, b) => b.count - a.count).slice(0, 5);
  }
  // ----------------------------------------------------

  async loginUser(username: string, password?: string) {
    if (!password) return null;
    
    // 1. Usa la nuova RPC per ottenere l'email dall'username (bypassa RLS in modo sicuro)
    const { data: userEmail, error: emailError } = await supabase.rpc('get_email_by_username', { p_username: username });
    
    if (emailError || !userEmail) {
      console.error('Non trovo l\'utente o utente non attivo:', emailError);
      return null;
    }

    // 2. Fai il login con Supabase Auth usando l'email ottenuta
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password: password
    });

    if (authError || !authData.user) {
      console.error('Errore credenziali Supabase Auth:', authError);
      return null;
    }

    // 3. Ora che l'utente è loggato in Supabase, le RLS sono sbloccate per la sua azienda!
    // Scarichiamo il record "worker" completo.
    const { data: workerData, error: workerErr } = await supabase
      .from('workers')
      .select('*')
      .ilike('username', username.trim())
      .eq('status', 'active')
      .single();

    if (workerErr || !workerData) {
      console.error('Record worker non trovato dopo il login:', workerErr);
      return null;
    }

    // 4. Check premium e status azienda
    let isPremium = false;
    let companyName = '';
    if (workerData.company_id) {
      const { data: compData, error: compErr } = await supabase.from('companies').select('name, status, is_premium').eq('id', workerData.company_id).single();
      if (!compErr && compData) {
        if (compData.status === 'inactive') {
          throw new Error('Company is inactive');
        }
        isPremium = !!compData.is_premium;
        companyName = compData.name;
      }
    }

    const user = this.mapSupabaseWorker(workerData, isPremium, companyName);
    
    // Check if truly superadmin via user_roles for extra safety
    const isSA = await this.checkIsSuperAdmin(user.id);
    this.setIsSuperAdmin(isSA);
    if (isSA) user.role = 'superadmin';

    return user;
  }

  async addUser(user: any) {
    const auth = localStorage.getItem('sb-gqetgbqlxljhhcaggoke-auth-token');
    const token = auth ? JSON.parse(auth).access_token : '';
    
    // Sync with Supabase Auth via Admin API
    const response = await fetch('/api/admin-auth-update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
         action: 'create',
         updates: user
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to create user via admin API');
    return data.data;
  }

  async updateUser(id: string, updates: any) {
    const mappedUpdates = this.mapAppWorkerToSupabase(updates);
    
    // Check if email or password ACTUALLY changed to avoid redundant API calls
    let isSensitiveUpdate = false;
    const isEditingUser = !!updates.username || !!updates.email || !!updates.password;

    if (isEditingUser && (updates.email || updates.password)) {
      const currentUser = await this.getUserById(id);
      if (currentUser) {
        const emailChanged = updates.email && updates.email !== currentUser.email;
        const passwordChanged = updates.password && updates.password !== currentUser.password;
        isSensitiveUpdate = !!(emailChanged || passwordChanged);
      }
    }

    if (isSensitiveUpdate) {
      // Sync with Supabase Auth via Admin API
      const auth = localStorage.getItem('sb-gqetgbqlxljhhcaggoke-auth-token');
      const token = auth ? JSON.parse(auth).access_token : '';
      
      const response = await fetch('/api/admin-auth-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
           targetUserId: id,
           updates: mappedUpdates // Send already mapped snake_case fields
        })
      });

      let data: any;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error('Non-JSON response from admin API:', text);
        throw new Error(`Server error (${response.status}): The server returned an unexpected response format.`);
      }

      if (!response.ok) throw new Error(data.error || 'Failed to update user via admin API');
      return data;
    }

    const { error } = await supabase.from('workers').update(mappedUpdates).eq('id', id);
    if (error) throw error;
  }

  async deleteUser(id: string) {
    // 1. Remove references from rapportini_workers to avoid foreign key constraints
    await supabase.from('rapportini_workers').delete().eq('worker_id', id);

    // 2. Delete the user
    const { error } = await supabase.from('workers').delete().eq('id', id);
    if (error) throw error;
  }

  private mapSupabaseWorker(w: any, isPremium?: boolean, companyName?: string): any {
    return {
      id: w.id,
      name: w.name,
      email: w.email || '',
      phone: w.phone || '',
      role: w.role,
      status: w.status,
      username: w.username || '',
      password: w.password_hash || w.password || '', // mantenuto per retrocompatibilità UI
      companyId: w.company_id || null,
      authId: w.auth_id || null,
      subcontractorId: w.subcontractor_id || null,
      hourlyRate: Number(w.hourly_rate) || 0,
      overtimeHourlyRate: Number(w.overtime_hourly_rate) || 0,
      extraCost: Number(w.extra_cost) || 0,
      isInternal: true,
      isPremium: isPremium ?? !!w.is_premium,
      companyName: companyName || '',
      address: w.address || w.billing_address || w.billingAddress || w.home_address || '',
      notes: w.internal_note || w.Notes || w.notes || '',
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
      hourly_rate: w.hourlyRate,
      overtime_hourly_rate: w.overtimeHourlyRate,
      extra_cost: w.extraCost,
      address: w.address
    };
    if (w.password || w.password_hash) {
      obj.password = w.password || w.password_hash;
      obj.password_hash = w.password || w.password_hash;
    }
    return obj;
  }

  async checkIsSuperAdmin(userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) return false;
    return data.role === 'superadmin';
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

  async getInternalClient() {
    const compId = this.requireCompanyId();
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('company_id', compId)
      .or(`name.ilike.%Interno%,name.ilike.%Internal%`)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching internal client:', error);
      return null;
    }
    return data ? this.mapSupabaseClient(data) : null;
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
      isInternal: p.is_internal || false,
      notes: p.internal_note || '',
      assignedWorkerIds: p.assigned_worker_ids || [],
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
      total_amount: p.financialAgreement === 'fixed' ? p.sellingPrice : null,
      is_internal: p.isInternal || false,
      assigned_worker_ids: p.assignedWorkerIds || []
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
    const compId = this.requireCompanyId();

    // Handle internal project client resolution if not already set correctly
    if (project.isInternal && (!project.clientId || project.clientId === 'internal')) {
      let internalClient = await this.getInternalClient();
      if (!internalClient) {
        // Create a default internal client if none exists
        internalClient = await this.addClient({
          name: 'Interno / Magazzino',
          vatNumber: '',
          billingAddress: '',
          mainContactName: '',
          mainContactPhone: '',
          email: '',
          status: 'active',
          notes: 'Cliente creato automaticamente per progetti interni.'
        });
      }
      project.clientId = internalClient.id;
    }

    const sbObj = {
      ...this.mapAppProjectToSupabase(project),
      company_id: compId,
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

  // --- Sezione Comunicazioni Interne (Fase 1 + 2) ---
  async getCommunications(options?: { projectId?: string, targetType?: CommunicationTargetType }): Promise<InternalCommunication[]> {
    const compId = this.requireCompanyId();
    const userId = this.requireUserId();
    
    let query = supabase
      .from('internal_communications')
      .select(`
        *,
        sender:workers(name),
        receipts:communication_read_receipts(user_id)
      `)
      .eq('company_id', compId)
      .order('created_at', { ascending: false });

    if (options?.projectId) {
      // Catch both direct project targets AND messages with project metadata (Ref:)
      query = query.or(`and(target_type.eq.project,target_id.eq.${options.projectId}),project_id.eq.${options.projectId}`);
    }
    if (options?.targetType) {
      query = query.eq('target_type', options.targetType);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data.map((c: any) => ({
      id: c.id,
      companyId: c.company_id,
      senderId: c.sender_id,
      senderName: c.sender?.name || 'Utente',
      content: c.content,
      type: (c.type || 'note') as MessageType,
      targetType: c.target_type as CommunicationTargetType,
      targetId: c.target_id,
      projectId: c.project_id,
      createdAt: new Date(c.created_at).getTime(),
      isRead: c.receipts?.some((r: any) => r.user_id === userId) || false
    }));
  }

  async sendCommunication(data: {
    content: string;
    type?: MessageType;
    targetType: CommunicationTargetType;
    targetIds: string[];
    title?: string;
    projectId?: string;
  }) {
    const compId = this.requireCompanyId();
    const userId = this.requireUserId();

    const payloads = data.targetIds.length > 0 && data.targetType === 'user'
      ? data.targetIds.map(tid => ({
          company_id: compId,
          sender_id: userId,
          content: data.content,
          project_id: data.projectId || null,
          type: data.type || 'note',
          target_type: 'user',
          target_id: tid
        }))
      : [{
          company_id: compId,
          sender_id: userId,
          content: data.content,
          project_id: data.projectId || (data.targetType === 'project' ? data.targetIds[0] : null),
          type: data.type || 'note',
          target_type: data.targetType,
          target_id: data.targetIds[0] || null
        }];

    const { error } = await supabase
      .from('internal_communications')
      .insert(payloads);

    if (error) throw error;
  }

  async markAsRead(communicationId: string) {
    const userId = this.requireUserId();
    const { error } = await supabase
      .from('communication_read_receipts')
      .upsert({ communication_id: communicationId, user_id: userId });
    if (error) throw error;
  }

  async getUnreadCount(): Promise<number> {
    if (!this.currentUserId || !this.currentCompanyId) return 0;
    try {
      const { data: receipts } = await supabase
        .from('communication_read_receipts')
        .select('communication_id')
        .eq('user_id', this.currentUserId);
      
      const readIds = receipts?.map(r => r.communication_id) || [];
      
      let query = supabase
        .from('internal_communications')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', this.currentCompanyId);

      if (readIds.length > 0) {
        query = query.not('id', 'in', `(${readIds.join(',')})`);
      }

      const { count, error } = await query;
      if (error) throw error;
      return count || 0;
    } catch (err) {
      console.error('Error getting unread count:', err);
      return 0;
    }
  }

  private mapSupabaseReport(r: any): any {
    // expenses from rapportini_expenses join (array of {type,amount,notes})
    const expensesList = Array.isArray(r.expenseItems)
      ? r.expenseItems.map((e: any) => ({ type: e.type || e.category || '', amount: Number(e.amount) || 0, notes: e.notes || '' }))
      : [];
    return {
      id: r.id,
      projectId: r.project_id,
      userId: r.created_by,
      date: r.date,
      startTime: this.extractTimeOnly(r.start_time),
      endTime: this.extractTimeOnly(r.end_time),
      breakHours: Number(r.break_hours) || 0,
      totalHours: Number(r.total_hours) || 0,
      manualTotalHours: r.manual_total_hours != null ? Number(r.manual_total_hours) : undefined,
      description: r.description || '',
      notes: r.Notes || '',
      expenses: expensesList,
      additionalWorkers: (r.additionalWorkers || []).map((aw: any) => ({
        userId: aw.worker_id,
        startTime: aw.startTime ? (aw.startTime.includes('T') ? aw.startTime.split('T')[1].substring(0, 5) : aw.startTime) : '',
        endTime: aw.endTime ? (aw.endTime.includes('T') ? aw.endTime.split('T')[1].substring(0, 5) : aw.endTime) : '',
        breakHours: Number(aw.breakHours),
        totalHours: Number(aw.hours),
        manualTotalHours: aw.manual_total_hours != null ? Number(aw.manual_total_hours) : undefined,
        hourlyRate: Number(aw.hourly_rate) || 0,
        totalCost: Number(aw.tal_cost) || Number(aw.total_cost) || 0,
        personName: aw.erson_name || aw.person_name || '',
        personRole: aw.person_role || '',
        membershipType: aw.membership_type || 'Interno',
        subcontractorId: aw.subcontractor_id,
        isManualOverride: aw.is_manual_override || false,
        overtimeHours: Number(aw.overtime_hours) || 0
      })),
      activityType: r.activity_type || 'work',
      invoiceStatus: r.invoice_status || 'Pending',
      overtimeHours: Number(r.overtime_hours) || 0,
      createdAt: new Date(r.created_at).getTime()
    };
  }

  async getReports(userId?: string, role?: Role) {
    const compId = this.requireCompanyId();
    let query = supabase
      .from('reports')
      .select(`*, additionalWorkers:rapportini_workers(*)`)
      .eq('company_id', compId);

    if (role !== 'admin' && userId) {
      if (role === 'supervisor') {
        const projects = await this.getProjects();
        const assignedProjectIds = projects
          .filter((p: any) => !p.assignedWorkerIds || p.assignedWorkerIds.length === 0 || p.assignedWorkerIds.includes(userId))
          .map((p: any) => p.id);

        const { data, error } = await query;
        if (error) {
          console.error('Error fetching reports:', error);
          return [];
        }
        return data.map(r => this.mapSupabaseReport(r)).filter((r: any) =>
          r.userId === userId ||
          r.additionalWorkers.some((aw: any) => aw.userId === userId) ||
          assignedProjectIds.includes(r.projectId)
        );
      } else {
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
    delete report.expenses;

    const newReport: any = {
      project_id: report.projectId,
      created_by: report.userId,
      date: report.date,
      start_time: this.formatForTime(report.startTime),
      end_time: this.formatForTime(report.endTime),
      break_hours: report.breakHours,
      total_hours: totalHours,
      manual_total_hours: report.manualTotalHours !== undefined ? report.manualTotalHours : null,
      description: report.description,
      "Notes": report.notes,
      activity_type: report.activityType || 'work',
      overtime_hours: report.overtimeHours || 0,
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
          startTime: this.formatForTimestamp(report.date, aw.startTime),
          endTime: this.formatForTimestamp(report.date, aw.endTime),
          breakHours: aw.breakHours,
          hours: hours,
          manual_total_hours: aw.manualTotalHours !== undefined ? aw.manualTotalHours : null,
          hourly_rate: hourlyRate,
          tal_cost: totalCost,
          erson_name: aw.personName || '',
          person_role: aw.personRole || '',
          membership_type: aw.membershipType || 'Interno',
          subcontractor_id: aw.subcontractorId || null,
          is_manual_override: aw.isManualOverride || false,
          overtime_hours: aw.overtimeHours || 0
        };
      });
      const { error: insErr } = await supabase.from('rapportini_workers').insert(workersToAdd);
      if (insErr) {
        console.error('Error inserting additional workers:', insErr);
        throw insErr;
      }
    }

    return this.mapSupabaseReport({ ...data[0], additionalWorkers, expenseItems: [] });
  }

  async deleteReports(ids: string[]) {
    if (!ids || ids.length === 0) return;
    
    // 1. First delete from rapportini_workers (using rapportino_id)
    const { error: workersError } = await supabase
      .from('rapportini_workers')
      .delete()
      .in('rapportino_id', ids);
    
    if (workersError) {
      console.error('Error deleting report workers:', workersError);
      throw workersError;
    }

    // 2. Then delete from reports
    const { error: reportsError } = await supabase
      .from('reports')
      .delete()
      .in('id', ids);

    if (reportsError) {
      console.error('Error deleting reports:', reportsError);
      throw reportsError;
    }
  }

  async updateReport(id: string, updates: any) {
    const additionalWorkers = updates.additionalWorkers;
    delete updates.additionalWorkers;
    delete updates.expenses;
    updates.totalHours = this.calculateTotalHours(updates.startTime, updates.endTime, updates.breakHours, updates.manualTotalHours);

    const sbObj = {
      project_id: updates.projectId,
      created_by: updates.userId,
      date: updates.date,
      start_time: this.formatForTime(updates.startTime),
      end_time: this.formatForTime(updates.endTime),
      break_hours: updates.breakHours,
      total_hours: updates.totalHours,
      manual_total_hours: updates.manualTotalHours !== undefined ? updates.manualTotalHours : null,
      description: updates.description,
      "Notes": updates.notes,
      activity_type: updates.activityType || 'work',
      overtime_hours: updates.overtimeHours || 0
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
            startTime: this.formatForTimestamp(updates.date, aw.startTime),
            endTime: this.formatForTimestamp(updates.date, aw.endTime),
            breakHours: aw.breakHours,
            hours: hours,
            manual_total_hours: aw.manualTotalHours !== undefined ? aw.manualTotalHours : null,
            hourly_rate: hourlyRate,
            tal_cost: totalCost,
            erson_name: aw.personName || '',
            person_role: aw.personRole || '',
            membership_type: aw.membershipType || 'Interno',
            subcontractor_id: aw.subcontractorId || null,
            is_manual_override: aw.isManualOverride || false,
            overtime_hours: aw.overtimeHours || 0
          };
        });
        const { error: updInsErr } = await supabase.from('rapportini_workers').insert(workersToAdd);
        if (updInsErr) { console.error('Error inserting workers on update:', updInsErr); throw updInsErr; }
      }
    }
  }

  async bulkUpdateInvoiceStatus(reportIds: string[], newStatus: string) {
    if (!reportIds || reportIds.length === 0) return;
    const { error } = await supabase.from('reports').update({ invoice_status: newStatus }).in('id', reportIds);
    if (error) throw error;
  }

  async deleteReport(id: string) {
    // 1. Delete associated workers and expenses first to avoid foreign key constraints
    await supabase.from('rapportini_workers').delete().eq('rapportino_id', id);
    await supabase.from('rapportini_expenses').delete().eq('rapportino_id', id);

    // 2. Delete the main report
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
        const reportOvertimeHours = r.overtimeHours || 0;
        const workerCost = (r.totalHours * (user?.hourlyRate || 0)) + 
                           (reportOvertimeHours * (user?.overtimeHourlyRate || 0)) + 
                           (user?.extraCost || 0);
        
        const reportExpenses = Array.isArray(r.expenses)
          ? r.expenses.reduce((sum: number, e: any) => sum + (Number(e.amount) || 0), 0)
          : 0;

        const isReportInternal = r.activityType !== 'work' || project?.isInternal;
        const revenue = isReportInternal ? 0 : r.totalHours * sellingPrice;

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
          overtimeHours: reportOvertimeHours,
          totalExpenses: reportExpenses,
          description: r.description,
          revenue: revenue,
          hourlyRevenue: isReportInternal ? 0 : sellingPrice,
          cost: workerCost,
          overtimeCost: reportOvertimeHours * (user?.overtimeHourlyRate || 0),
          hourlyCost: user?.hourlyRate || 0,
          personnelCost: user?.subcontractorId ? 0 : workerCost,
          subcontractorCost: user?.subcontractorId ? workerCost : 0,
          invoiceStatus: r.invoiceStatus || 'Pending',
          activityType: r.activityType || 'work',
          isInternal: project?.isInternal || false,
          createdAt: r.createdAt
        });

        const additionalWorkers = r.additionalWorkers || [];
        additionalWorkers.forEach((aw: any, idx: number) => {
          const awUser = workers.find((u: any) => u.id === aw.userId);
          const awOvertimeHours = aw.overtimeHours || 0;
          const awCost = (aw.totalHours * (awUser?.hourlyRate || 0)) + 
                         (awOvertimeHours * (awUser?.overtimeHourlyRate || 0)) + 
                         (awUser?.extraCost || 0);
          const awRevenue = isReportInternal ? 0 : aw.totalHours * sellingPrice;

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
            overtimeHours: awOvertimeHours,
            totalExpenses: 0,
            description: r.description,
            revenue: awRevenue,
            hourlyRevenue: isReportInternal ? 0 : sellingPrice,
            cost: awCost,
            overtimeCost: awOvertimeHours * (awUser?.overtimeHourlyRate || 0),
            hourlyCost: awUser?.hourlyRate || 0,
            personnelCost: awUser?.subcontractorId ? 0 : awCost,
            subcontractorCost: awUser?.subcontractorId ? awCost : 0,
            invoiceStatus: r.invoiceStatus || 'Pending',
            activityType: r.activityType || 'work',
            isInternal: project?.isInternal || false,
            createdAt: r.createdAt
          });
        });

      return summaries;
    }).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
}

export const db = new DBService();