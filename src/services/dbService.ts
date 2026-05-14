import { ReportSummary, Client, InternalCommunication, CommTargetType, CommType, CommStatus, User } from '../types';
import { supabase } from './supabase';

class DBService {
  private currentCompanyId: string | null = null;
  private currentUserId: string | null = null;
  private isSuperAdminRole: boolean = false;

  constructor() { }

  private async getAuthToken(): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? '';
  }

  public setCompanyId(id: string | null) {
    this.currentCompanyId = id;
  }

  public setUserId(id: string | null) {
    this.currentUserId = id;
  }

  public getCompanyIdSafe(): string | null {
    return this.currentCompanyId;
  }

  public getUserIdSafe(): string | null {
    return this.currentUserId;
  }

  public setIsSuperAdmin(isSA: boolean) {
    this.isSuperAdminRole = isSA;
  }

  public requireCompanyId(): string {
    if (!this.currentCompanyId && !this.isSuperAdminRole) {
      const msg = "DBService: company_id requested but not set. Action blocked to prevent inconsistent empty states.";
      console.error(msg);
      throw new Error(msg);
    }
    return this.currentCompanyId || '';
  }

  private async checkAuthSession() {
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      console.warn('DBService: No active session found in client.');
      throw new Error('SESSION_EXPIRED');
    }

    // [BLINDATO] Verifica reale lato Database: il JWT è arrivato a Postgres?
    try {
      const { data, error: rpcError } = await supabase.rpc('verify_auth_context');
      if (rpcError) {
        console.error('[RLS-STRESS] RPC Auth Verification Failed:', rpcError);
        throw new Error('JWT_NOT_PROPAGATED_TO_DB');
      }
      console.log(`[RLS-STRESS] DB-Verified UID: ${data.uid}`);
      return data;
    } catch (err) {
      console.error('[RLS-STRESS] Pre-flight Auth check failed:', err);
      throw err;
    }
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
    const isSA = this.isSuperAdminRole;
    const compId = this.currentCompanyId;
    
    let query = supabase.from('subcontractors').select('*');
    
    // SSOT: If a company is selected, filter by it. 
    // If no company is selected and user is SuperAdmin, show all.
    if (compId) {
      query = query.eq('company_id', compId);
    } else if (!isSA) {
      console.warn('DBService: getSubcontractors called without companyId and user is not SuperAdmin');
      return [];
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching subcontractors:', error);
      throw error;
    }
    return data.map(s => this.mapSupabaseSubcontractor(s));
  }

  private async getWorkerById(id: string): Promise<User | null> {
    const { data } = await supabase.from('workers').select('*').eq('id', id).single();
    return data ? this.mapSupabaseWorker(data) : null;
  }

  async addUser(worker: any) {
    const compId = this.requireCompanyId();
    
    // 1. Check if worker already exists within THIS company (Option A)
    const { data: existingWorker } = await supabase
      .from('workers')
      .select('id, auth_id, name')
      .eq('email', worker.email)
      .eq('company_id', compId)
      .maybeSingle();

    let workerId = existingWorker?.id;
    let authId = existingWorker?.auth_id;

    if (!existingWorker) {
      // 2. Create new global profile if not exists
      const sbWorker = {
        ...this.mapAppWorkerToSupabase(worker),
        created_at: new Date().toISOString()
      };
      const { data, error: insErr } = await supabase.from('workers').insert([sbWorker]).select();
      if (insErr) throw insErr;
      workerId = data[0].id;
      authId = data[0].auth_id;
    }

    // 3. Create the association in user_companies (SSOT)
    // If the user already has an auth_id, we link them immediately.
    // If not (new user or legacy), the association will be completed during their first login/repair.
    if (authId) {
       const { error: assocErr } = await supabase.from('user_companies').upsert({
         auth_id: authId,
         company_id: compId,
         role: worker.role || 'operator'
       }, { onConflict: 'auth_id, company_id' });
       
       if (assocErr) throw assocErr;
    } else {
       // Legacy/Pending: We might need a way to link by email if auth_id is missing, 
       // but for now the repair_user_companies RPC handles this on first login.
       console.log('Worker found/created but no auth_id yet. Association will trigger on first login.');
    }

    return this.getUserById(workerId!);
  }

  async updateUser(id: string, updates: any) {
    const mappedUpdates = this.mapAppWorkerToSupabase(updates);
    const worker = await this.getUserById(id);
    
    // SSOT: If role changed, update user_companies as well
    if (updates.role && worker?.authId) {
      await supabase.from('user_companies')
        .update({ role: updates.role })
        .eq('auth_id', worker.authId)
        .eq('company_id', this.requireCompanyId());
    }

    // Sync with Supabase Auth via Admin API for sensitive fields
    const isSensitiveUpdate = !!(updates.email || updates.password);
    if (isSensitiveUpdate) {
      const token = await this.getAuthToken();
      const response = await fetch('/api/admin-auth-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
           targetUserId: id,
           updates: mappedUpdates
        })
      });
      if (!response.ok) {
        let errorMessage = 'Failed to update user via admin API';
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            errorMessage = data.error || errorMessage;
          } else {
            const text = await response.text();
            console.error('API Error (Non-JSON):', text);
          }
        } catch (e) {
          console.error('Error parsing API error response:', e);
        }
        throw new Error(errorMessage);
      }
    }

    const { error } = await supabase.from('workers').update(mappedUpdates).eq('id', id);
    if (error) throw error;
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
    const compId = this.requireCompanyId();
    const sbObj = this.mapAppSubcontractorToSupabase(updates);
    const { error } = await supabase.from('subcontractors')
      .update(sbObj)
      .eq('id', id)
      .eq('company_id', compId);
    if (error) throw error;
  }

  async deleteSubcontractor(id: string) {
    const compId = this.requireCompanyId();
    await supabase.from('workers').update({ subcontractor_id: null }).eq('subcontractor_id', id).eq('company_id', compId);
    const { error } = await supabase.from('subcontractors').delete().eq('id', id).eq('company_id', compId);
    if (error) throw error;
  }

  async getUsers() {
    const isSA = this.isSuperAdminRole;
    const compId = this.currentCompanyId;
    
    // Opzione A (Siloed): La tabella `workers` è la fonte di verità operativa.
    // Ogni record appartiene a una sola azienda via `company_id`.
    if (compId) {
      const { data: { user } } = await supabase.auth.getUser();
      const uid = user?.id || 'NULL';
      console.log(`[RLS-AUDIT] Fetching workers | UID: ${uid} | CompID: ${compId || 'ALL'}`);
      
      const { data, error } = await supabase
        .from('workers')
        .select('*')
        .eq('company_id', compId);

      if (error) {
        console.error('[RLS-AUDIT] Error fetching workers:', error);
        throw error;
      }
      console.log(`[RLS-AUDIT] Success | UID: ${uid} | Rows: ${data?.length || 0}`);
      return data.map(w => this.mapSupabaseWorker(w));
    } else if (isSA) {
      // Global View for SuperAdmin: fetch all workers
      const { data: { user } } = await supabase.auth.getUser();
      const uid = user?.id || 'NULL';
      console.log(`[RLS-AUDIT] Fetching all workers | UID: ${uid}`);
      
      const { data, error } = await supabase.from('workers').select('*');
      if (error) {
        console.error('[RLS-AUDIT] Error fetching all worker profiles for SuperAdmin:', error);
        throw error;
      }
      console.log(`[RLS-AUDIT] Success | UID: ${uid} | Rows: ${data?.length || 0}`);
      return data.map(w => this.mapSupabaseWorker(w));
    } else {
      console.warn('DBService: getUsers called without companyId and user is not SuperAdmin');
      return [];
    }
  }

  async getUserById(id: string) {
    const { data, error } = await supabase.from('workers').select('*').eq('id', id).single();
    if (error && error.code !== 'PGRST116') console.error('Error fetching user:', error);
    return data ? this.mapSupabaseWorker(data) : null;
  }

  async getUserByAuthId(authId: string) {
    // In Option A, we fetch the worker record that matches BOTH auth_id and the active company.
    // However, during initial login, we might not know the company yet, so we get the first one
    // and then resolve the context.
    const { data, error } = await supabase
      .from('workers')
      .select('*')
      .eq('auth_id', authId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user by auth_id:', error);
      return null;
    }
    if (!data || data.length === 0) return null;
    
    // Default to the first profile found if we don't have a company context yet
    const initialWorker = data[0]; 

    // SSOT Context & Repair logic for hydration
    let { data: contexts } = await supabase.rpc('get_user_session_context', { target_auth_id: authId });
    if (!contexts || contexts.length === 0) {
      await supabase.rpc('repair_user_companies');
      const retry = await supabase.rpc('get_user_session_context', { target_auth_id: authId });
      contexts = retry.data;
    }

    const availableCompanies = contexts?.map((c: any) => ({
      id: c.cid,
      name: c.cname,
      role: c.urole,
      isPremium: !!c.is_premium,
      planCode: c.plan_code,
      subscriptionStatus: c.subscription_status
    })) || [];

    // Sync main role and premium status with session context (SSOT)
    const saContext = availableCompanies.find((c: any) => c.role === 'superadmin');

    // Set active company and sync context role if not already superadmin
    const activeCompId = (availableCompanies.length > 0 ? availableCompanies[0].id : null) || initialWorker.company_id;
    
    // Now resolve the specific worker profile for this company (if multiple exist)
    const activeWorkerData = data.find(w => w.company_id === activeCompId) || initialWorker;
    const user = this.mapSupabaseWorker(activeWorkerData);
    user.availableCompanies = availableCompanies;

    if (saContext) {
      user.role = 'superadmin';
      user.isPremium = true;
    }

    if (activeCompId) {
      this.setCompanyId(activeCompId);
      user.companyId = activeCompId;
      
      const compContext = availableCompanies.find((c: any) => c.id === activeCompId);
      if (compContext && !saContext) {
        user.role = compContext.role;
        user.isPremium = compContext.isPremium;
        user.companyName = compContext.name;
      }

      // Pre-fetch detailed subscription status if possible
      try {
        const subStatus = await this.getSubscriptionStatus(activeCompId);
        if (subStatus) {
           user.subscription = {
             planCode: subStatus.plan_code,
             status: subStatus.status,
             currentPeriodEnd: subStatus.current_period_end
           };
           user.isPremium = subStatus.plan_code === 'premium' || subStatus.plan_code === 'basic';
        }
      } catch (e) {
        console.error('Error fetching initial subscription status:', e);
      }
    }
    
    return user;
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

    // 3. Create admin worker via Admin API (handles Supabase Auth and DB safely)
    const token = await this.getAuthToken();
    const response = await fetch('/api/admin-auth-update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
         action: 'create',
         updates: {
           name: adminName,
           username: adminUsername,
           password: adminPassword,
           email: `${adminUsername.toLowerCase()}@jobsreport.it`, // Placeholder email for Auth
           role: 'admin',
           status: 'active',
           companyId: newCompanyId
         }
      })
    });

    const apiData = await response.json();
    if (!response.ok) throw new Error(apiData.error || 'Failed to create admin via API');
    const userData = apiData.data;

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

    return this.mapSupabaseWorker(userData);
  }

  // --- Company Management Methods (SuperAdmin Only) ---
  private mapSupabaseCompany(c: any): any {
    const comp: any = {
      id: c.id,
      name: c.name,
      status: c.status || 'active',
      isPremium: !!c.is_premium,
      address: c.address || '',
      phone: c.phone || '',
      email: c.email || '',
      vatNumber: c.vat_number || '',
      city: c.city || '',
      country: c.country || '',
      createdAt: new Date(c.created_at).getTime()
    };

    // Handle new subscription model
    const sub = c.company_subscriptions;
    if (sub) {
      // PostgREST might return an array or a single object depending on the join
      const subData = Array.isArray(sub) ? sub[0] : sub;
      if (subData) {
        comp.subscription = {
          planCode: subData.plan_code,
          status: subData.status,
          currentPeriodEnd: subData.current_period_end
        };
        // Update isPremium based on the new source of truth
        comp.isPremium = subData.plan_code === 'pro' && (subData.status === 'active' || subData.status === 'trialing');
      }
    }

    return comp;
  }

  async canUseFeature(feature: string): Promise<boolean> {
    const compId = this.currentCompanyId;
    if (!compId) return false;
    if (this.isSuperAdminRole) return true;

    const { data, error } = await supabase.rpc('can_use_feature', {
        p_company_id: compId,
        p_feature: feature
    });

    if (error) {
        console.error('Error checking feature access:', error);
        return false;
    }
    return !!data;
  }

  async getSubscriptionStatus(companyId?: string): Promise<any> {
    const cid = companyId || this.currentCompanyId;
    if (!cid) return null;

    // V2: Read from the access control view
    const { data: viewData, error: viewError } = await supabase
      .from('vw_access_control')
      .select('*')
      .eq('company_id', cid)
      .maybeSingle();

    if (viewError) {
      console.error('Error fetching subscription status:', viewError);
      throw viewError;
    }
    if (!viewData) return null;

    // Map to the format expected by the rest of the codebase
    return {
      plan_code: viewData.plan_code,
      status: viewData.billing_status,
      current_period_end: viewData.current_period_end,
      reports_count: viewData.current_usage,
      reports_limit: viewData.reports_limit,
    };
  }

  async getCompanyDetails(companyId: string): Promise<any> {
    const { data, error } = await supabase
      .from('companies')
      .select('*, company_subscriptions(*)')
      .eq('id', companyId)
      .maybeSingle();
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
    const { data: companies, error } = await supabase
      .from('companies')
      .select('*, company_subscriptions(*)')
      .order('name');
    if (error) {
      console.error('Error fetching companies:', error);
      return [];
    }

    // SSOT: Fetch admin memberships from the bridge table
    const { data: memberships } = await supabase
      .from('user_companies')
      .select('company_id, auth_id')
      .eq('role', 'admin');

    const adminAuthIds = memberships?.map(m => m.auth_id) || [];
    const { data: workers } = adminAuthIds.length > 0 
      ? await supabase.from('workers').select('id, name, username, auth_id').in('auth_id', adminAuthIds)
      : { data: [] };

    return companies.map(c => {
      const comp = this.mapSupabaseCompany(c);
      const membership = memberships?.find(m => m.company_id === c.id);
      if (membership) {
        const admin = workers?.find(w => w.auth_id === membership.auth_id);
        if (admin) {
          comp.adminId = admin.id;
          comp.adminName = admin.name;
          comp.username = admin.username;
          comp.password = '';
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
      if (password) userUpdates.password = password; // Will be handled by Admin API

      if (Object.keys(userUpdates).length > 0) {
        const token = await this.getAuthToken();
        const response = await fetch('/api/admin-auth-update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
             targetUserId: adminId,
             updates: userUpdates
          })
        });

        if (!response.ok) {
          const apiData = await response.json();
          throw new Error(apiData.error || 'Failed to update admin via API');
        }
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
      await supabase.from('rapportini_workers').delete().in('rapportino_id', reportIds);
      await supabase.from('rapportini_workers').delete().in('report_id', reportIds);
    }
    // 2. Elimina i report della ditta
    await supabase.from('reports').delete().eq('company_id', id);
    
    // 3. SSOT: Elimina le associazioni degli utenti, ma NON i profili worker globali
    await supabase.from('user_companies').delete().eq('company_id', id);
    
    // 4. Elimina dati specifici del tenant
    await supabase.from('subcontractors').delete().eq('company_id', id);
    await supabase.from('projects').delete().eq('company_id', id);
    await supabase.from('clients').delete().eq('company_id', id);
    
    // 5. Elimina la ditta
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

    // 3. ROBUST FETCH: Implementiamo un retry pattern come suggerito per gestire timing issues
    let workerData = null;
    let workerErr = null;
    
    for (let i = 0; i < 3; i++) {
      const res = await supabase
        .from('workers')
        .select('*')
        .eq('auth_id', authData.user.id)
        .maybeSingle();
        
      if (res.data) {
        workerData = res.data;
        break;
      }
      
      workerErr = res.error;
      // Aspetta 150ms prima del prossimo tentativo
      await new Promise(resolve => setTimeout(resolve, 150));
    }

    if (!workerData) {
      console.error('Record worker non trovato dopo i tentativi di login:', workerErr);
      return null;
    }

    // NEW: SSOT Company Context & Repair logic
    let { data: contexts, error: rpcError } = await supabase.rpc('get_user_session_context');
    
    if (rpcError) console.error("RPC Context Error:", rpcError);

    if (!contexts || contexts.length === 0) {
      await supabase.rpc('repair_user_companies');
      const retry = await supabase.rpc('get_user_session_context');
      contexts = retry.data;
    }

    const availableCompanies = contexts?.map((c: any) => ({
      id: c.cid,
      name: c.cname,
      role: c.urole
    })) || [];

    if (availableCompanies.length > 0) {
      this.setCompanyId(availableCompanies[0].id);
      
      const userContext = contexts?.find((c: any) => c.cid === availableCompanies[0].id) || {};
      
      const user = this.mapSupabaseWorker(workerData, userContext.is_premium, userContext.cname);
      user.availableCompanies = availableCompanies;
      
      // Check if truly superadmin via user_roles for extra safety
      const isSA = await this.checkIsSuperAdmin(user.id);
      this.setIsSuperAdmin(isSA);
      if (isSA) user.role = 'superadmin';
      
      return user;
    }

    const user = this.mapSupabaseWorker(workerData);
    user.availableCompanies = availableCompanies;
    return user;
  }

  async sendAccessInstructions(id: string): Promise<void> {
    const token = await this.getAuthToken();
    const response = await fetch('/api/admin-auth-update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
         action: 'generate-recovery-link',
         targetUserId: id
      })
    });

    let data: any;
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      console.error('Non-JSON response from admin API:', text);
      throw new Error(`Server error (${response.status}): unexpected response format.`);
    }

    if (!response.ok) throw new Error(data?.error || 'Failed to send access instructions');
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
      companyId: this.currentCompanyId || w.company_id || null,
      authId: w.auth_id || null,
      subcontractorId: w.subcontractor_id || null,
      hourlyRate: Number(w.hourly_rate) || 0,
      overtimeHourlyRate: Number(w.overtime_hourly_rate) || 0,
      extraCost: Number(w.extra_cost) || 0,
      isInternal: true,
      // Legacy isPremium mapping - we should move away from this
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
      // SSOT per Offline Workers: Senza auth_id, user_companies non può mapparli. 
      // company_id in workers è l'unico legame rimasto per il personale non registrato.
      company_id: w.companyId || this.currentCompanyId,
      subcontractor_id: w.subcontractorId,
      hourly_rate: w.hourlyRate,
      overtime_hourly_rate: w.overtimeHourlyRate,
      extra_cost: w.extraCost,
      address: w.address,
      internal_note: w.notes
    };
    // password and password_hash fields are strictly ignored to prevent plain text storage
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
    await this.checkAuthSession();
    const compId = this.getCompanyIdSafe();
    
    if (!compId && !this.isSuperAdminRole) {
      console.warn('DBService: getClients called without companyId');
      return [];
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    const uid = user?.id || 'NULL';
    console.log(`[RLS-AUDIT] Fetching clients | UID: ${uid} | CompID: ${compId || 'ALL'}`);

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('company_id', compId);
    if (error) {
      console.error('[RLS-AUDIT] Error fetching clients:', error);
      throw error;
    }
    console.log(`[RLS-AUDIT] Success | UID: ${uid} | Rows: ${data?.length || 0}`);
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
    const compId = this.requireCompanyId();
    const sbClient = this.mapAppClientToSupabase(updates);
    const { error } = await supabase.from('clients')
      .update(sbClient)
      .eq('id', id)
      .eq('company_id', compId);
    if (error) throw error;
  }

  async deleteClient(id: string) {
    const compId = this.requireCompanyId();
    const { error } = await supabase.from('clients').delete().eq('id', id).eq('company_id', compId);
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
      contact_person: p.siteContactName,
      phone: p.siteContactPhone,
      internal_note: p.notes,
      status: p.status,
      economic_type: p.financialAgreement,
      hourly_sale_price: p.financialAgreement === 'hourly' ? p.sellingPrice : null,
      total_amount: p.financialAgreement === 'fixed' ? p.sellingPrice : null,
      is_internal: p.isInternal || false,
      assigned_worker_ids: p.assignedWorkerIds || []
    };
  }

  async getProjects() {
    await this.checkAuthSession();
    const compId = this.getCompanyIdSafe();

    if (!compId && !this.isSuperAdminRole) {
      console.warn('DBService: getProjects called without companyId');
      return [];
    }
    
    console.log(`DBService: Fetching projects for company ${compId || 'ALL'}...`);
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('company_id', compId);
    
    if (error) {
      console.error('Error fetching projects:', error);
      throw error;
    }
    
    console.log(`DBService: Found ${data?.length || 0} projects.`);
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
    const compId = this.requireCompanyId();
    const sbObj = this.mapAppProjectToSupabase(updates);
    const { error } = await supabase.from('projects')
      .update(sbObj)
      .eq('id', id)
      .eq('company_id', compId);
    if (error) throw error;
  }

  async deleteProject(id: string) {
    const compId = this.requireCompanyId();
    const { error } = await supabase.from('projects').delete().eq('id', id).eq('company_id', compId);
    if (error) throw error;
  }

  // --- Sezione Comunicazioni Interne (Workflow v3) ---
  
  private mapSupabaseComm(c: any, userId: string): InternalCommunication {
    return {
      id: c.id,
      companyId: c.company_id,
      senderId: c.sender_id,
      senderName: c.sender_name_snap || c.sender?.name || 'Utente',
      content: c.content,
      type: c.type as CommType,
      targetType: c.target_type as CommTargetType,
      targetId: c.target_id,
      targetName: c.target_name_snap,
      projectId: c.project_id,
      parentId: c.parent_id,
      parentForwardId: c.parent_forward_id,
      metadata: c.metadata,
      status: c.status as CommStatus,
      isAcknowledged: c.is_acknowledged || false,
      acknowledgedAt: c.acknowledged_at,
      assignedTo: c.assigned_to,
      assignedToName: c.assigned_worker?.name,
      closedAt: c.closed_at,
      lastActivityAt: c.last_activity_at,
      updatedAt: c.updated_at,
      createdAt: new Date(c.created_at).getTime(),
      isRead: c.receipts?.some((r: any) => r.user_id === userId) || false,
      replies: []
    };
  }

  private async getRootId(id: string): Promise<string> {
    const compId = this.requireCompanyId();
    const { data } = await supabase.from('internal_communications').select('id, parent_id').eq('id', id).eq('company_id', compId).single();
    return data?.parent_id || id;
  }

  async getCommunications(filters: { 
    type?: 'inbox' | 'working' | 'completed';
    projectId?: string;
  } = {}): Promise<InternalCommunication[]> {
    const compId = this.requireCompanyId();
    const userId = this.requireUserId();
    
    // V2: Use RPC for server-side filtering
    const { data, error } = await supabase.rpc('get_filtered_communications', {
      p_user_id: userId,
      p_company_id: compId,
      p_section: filters.type || 'inbox'
    });

    if (error) {
      console.error('Error fetching communications via RPC:', error);
      throw error;
    }

    // Get read receipts for these communications
    const commIds = (data || []).map((c: any) => c.id);
    const { data: receipts } = await supabase
      .from('communication_read_receipts')
      .select('communication_id')
      .eq('user_id', userId)
      .in('communication_id', commIds);
    
    const readIds = new Set(receipts?.map(r => r.communication_id) || []);

    const mapped = (data || []).map((c: any) => {
      const isRead = readIds.has(c.id);
      const needsAction = (c.status === 'open' || c.status === 'acknowledged') && 
                          (c.target_type === 'all' || c.target_id === userId || !isRead);
      
      return {
        ...this.mapSupabaseComm(c, userId),
        isRead,
        needsAction
      };
    });

    return mapped;
  }

  async getInbox(): Promise<InternalCommunication[]> {
    const compId = this.requireCompanyId();
    const userId = this.requireUserId();

    const { data, error } = await supabase
      .from('internal_communications')
      .select(`
        *,
        sender:workers!sender_id(name),
        assigned_worker:workers!assigned_to(name)
      `)
      .eq('company_id', compId)
      .or(`target_id.eq.${userId},target_type.eq.all`)
      .neq('sender_id', userId)
      .not('status', 'in', '("archived","deleted")')
      .is('parent_id', null)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Get read receipts
    const commIds = (data || []).map((c: any) => c.id);
    const { data: receipts } = await supabase
      .from('communication_read_receipts')
      .select('communication_id')
      .eq('user_id', userId)
      .in('communication_id', commIds);
    
    const readIds = new Set(receipts?.map(r => r.communication_id) || []);

    return (data || []).map(c => ({
      ...this.mapSupabaseComm(c, userId),
      isRead: readIds.has(c.id)
    }));
  }

  async getOutbox(): Promise<InternalCommunication[]> {
    const compId = this.requireCompanyId();
    const userId = this.requireUserId();

    const { data, error } = await supabase
      .from('internal_communications')
      .select(`
        *,
        sender:workers!sender_id(name),
        assigned_worker:workers!assigned_to(name)
      `)
      .eq('company_id', compId)
      .eq('sender_id', userId)
      .not('status', 'in', '("archived","deleted")')
      .is('parent_id', null)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(c => this.mapSupabaseComm(c, userId));
  }

  async getThread(rootId: string): Promise<InternalCommunication[]> {
    const userId = this.requireUserId();
    const compId = this.requireCompanyId();
    const { data, error } = await supabase
      .from('internal_communications')
      .select(`
        *,
        sender:workers!sender_id(name),
        assigned_worker:workers!assigned_to(name)
      `)
      .eq('company_id', compId)
      .or(`id.eq.${rootId},parent_id.eq.${rootId}`)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching thread:', error);
      return [];
    }

    // Mark all unread messages in this thread as read
    const messages = data || [];
    const unreadInThread = messages.filter(m => 
      (m.target_id === userId || m.target_type === 'all')
    );

    if (unreadInThread.length > 0) {
      // Get current receipts to avoid duplicates
      const { data: existing } = await supabase
        .from('communication_read_receipts')
        .select('communication_id')
        .eq('user_id', userId)
        .in('communication_id', unreadInThread.map(m => m.id));
      
      const existingIds = new Set(existing?.map(e => e.communication_id) || []);
      const toMark = unreadInThread.filter(m => !existingIds.has(m.id));

      if (toMark.length > 0) {
        await supabase
          .from('communication_read_receipts')
          .upsert(toMark.map(m => ({ communication_id: m.id, user_id: userId })), { onConflict: 'communication_id, user_id' });
      }
    }

    return messages.map(c => this.mapSupabaseComm(c, userId));
  }

  async sendCommunication(data: {
    content: string;
    type?: CommType;
    targetType: CommTargetType;
    targetIds?: string[];
    targetId?: string;
    projectId?: string;
    parentId?: string;
    parentForwardId?: string;
    metadata?: any;
  }) {
    const compId = this.requireCompanyId();
    const userId = this.requireUserId();

    // V2: Solve snapshots before insertion
    const [sender, allWorkers] = await Promise.all([
      this.getWorkerById(userId),
      this.getUsers()
    ]);
    const senderName = sender?.name || 'Utente';

    if (data.parentId) {
      const payload = {
        company_id: compId,
        sender_id: userId,
        sender_name_snap: senderName,
        content: data.content,
        type: data.type || 'note',
        target_type: data.targetType,
        target_id: data.targetId,
        project_id: data.projectId,
        parent_id: data.parentId,
        status: 'open',
        metadata: data.metadata || {}
      };
      const { error } = await supabase.from('internal_communications').insert([payload]);
      if (error) throw error;

      await supabase
        .from('internal_communications')
        .update({ last_activity_at: new Date().toISOString() })
        .eq('id', data.parentId);
      return;
    }

    let payloads = [];
    if (data.targetType === 'user' && data.targetIds && data.targetIds.length > 0) {
      payloads = data.targetIds.map(tid => {
        const target = allWorkers.find((w: User) => w.id === tid);
        return {
          company_id: compId,
          sender_id: userId,
          sender_name_snap: senderName,
          target_name_snap: target?.name,
          content: data.content,
          type: data.type || 'note',
          target_type: 'user',
          target_id: tid,
          project_id: data.projectId || null,
          parent_forward_id: data.parentForwardId || null,
          status: 'open',
          metadata: data.metadata || {}
        };
      });
    } else {
      let targetName = null;
      if (data.targetType === 'user' && data.targetId) {
        targetName = allWorkers.find((w: User) => w.id === data.targetId)?.name;
      }

      payloads = [{
        company_id: compId,
        sender_id: userId,
        sender_name_snap: senderName,
        target_name_snap: targetName,
        content: data.content,
        type: data.type || 'note',
        target_type: data.targetType,
        target_id: data.targetId || null,
        project_id: data.projectId || null,
        parent_forward_id: data.parentForwardId || null,
        status: 'open',
        metadata: data.metadata || {}
      }];
    }

    const { error } = await supabase.from('internal_communications').insert(payloads);
    if (error) throw error;
  }

  async acknowledgeComm(id: string) {
    const rootId = await this.getRootId(id);
    const { error } = await supabase
      .from('internal_communications')
      .update({ 
        status: 'acknowledged',
        is_acknowledged: true,
        acknowledged_at: new Date().toISOString()
      })
      .eq('id', rootId);
    if (error) throw error;
  }

  async takeInCharge(id: string) {
    const userId = this.requireUserId();
    const rootId = await this.getRootId(id);
    const { error } = await supabase
      .from('internal_communications')
      .update({ 
        status: 'in_progress',
        assigned_to: userId
      })
      .eq('id', rootId);
    if (error) throw error;
  }

  async closeComm(id: string, userId: string) {
    const rootId = await this.getRootId(id);
    
    // Security check: only the sender can close the communication
    const { data: root } = await supabase
      .from('internal_communications')
      .select('sender_id')
      .eq('id', rootId)
      .single();

    if (root?.sender_id !== userId) {
      throw new Error("Only the original sender can close this communication.");
    }

    const { error } = await supabase
      .from('internal_communications')
      .update({ 
        status: 'closed',
        closed_at: new Date().toISOString()
      })
      .eq('id', rootId);
    if (error) throw error;
  }

  async archiveComm(id: string) {
    const compId = this.requireCompanyId();
    const { error } = await supabase
      .from('internal_communications')
      .update({ status: 'archived' })
      .eq('id', id)
      .eq('company_id', compId);
    if (error) throw error;
  }

  async deleteComm(id: string) {
    const compId = this.requireCompanyId();
    // Mark both the root and its children as deleted
    const { error } = await supabase
      .from('internal_communications')
      .update({ status: 'deleted' })
      .or(`id.eq.${id},parent_id.eq.${id}`)
      .eq('company_id', compId);
    if (error) throw error;
  }

  async markAsRead(communicationId: string) {
    const userId = this.requireUserId();
    const compId = this.requireCompanyId();
    const { error } = await supabase
      .from('communication_read_receipts')
      .upsert({ 
        communication_id: communicationId, 
        user_id: userId,
        company_id: compId
      });
    if (error) throw error;
  }

  async getUnreadCount(): Promise<number> {
    const userId = this.currentUserId;
    const compId = this.currentCompanyId;
    if (!userId || !compId) return 0;
    
    const { count, error } = await supabase
      .from('internal_communications')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', compId)
      .is('parent_id', null)
      .in('status', ['open', 'acknowledged'])
      .or(`target_type.eq.all,target_id.eq.${userId}`);
      
    return error ? (function(){ throw error; }()) : (count || 0);
  }


  private mapSupabaseReport(r: any): any {
    const expensesList = Array.isArray(r.expenses)
      ? r.expenses.map((e: any) => ({ 
          id: e.id,
          type: e.type || '', 
          amount: Number(e.amount) || 0, 
          description: e.description || '',
          notes: e.description || '', // per retrocompatibilità UI finché non l'aggiorniamo
          km: e.km !== null ? Number(e.km) : undefined,
          workerId: e.worker_id,
          createdBy: e.created_by
        }))
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
        totalCost: Number(aw.total_cost) || 0,
        personName: aw.person_name || '',
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
  async getReports() {
    await this.checkAuthSession();
    const compId = this.getCompanyIdSafe();

    if (!compId && !this.isSuperAdminRole) {
      console.warn('DBService: getReports called without companyId');
      return [];
    }

    const { data: { user } } = await supabase.auth.getUser();
    const uid = user?.id || 'NULL';
    
    console.log(`[RLS-AUDIT] Fetching reports | UID: ${uid} | CompID: ${compId || 'ALL'}`);
    
    const { data, error } = await supabase
      .from('reports')
      .select(`*, additionalWorkers:rapportini_workers(*), expenses:rapportini_expenses(*)`)
      .eq('company_id', compId);

    if (error) {
      console.error('[RLS-AUDIT] Error fetching reports:', error);
      throw error;
    }
    
    const count = data?.length || 0;
    console.log(`[RLS-AUDIT] Success | UID: ${uid} | CompID: ${compId} | Rows: ${count}`);
    
    if (count === 0 && uid !== 'NULL') {
      console.warn(`[RLS-AUDIT] SUSPICIOUS EMPTY RESULT: 0 reports for user ${uid} in company ${compId}. Verify RLS policies and user_companies table.`);
    }
    
    return data.map(r => this.mapSupabaseReport(r));
  }

  async addReport(report: any) {
    const { additionalWorkers = [], expenses = [], ...reportData } = report;
    const totalHours = this.calculateTotalHours(reportData.startTime, reportData.endTime, reportData.breakHours, reportData.manualTotalHours);

    const newReport: any = {
      project_id: reportData.projectId,
      created_by: reportData.userId,
      date: reportData.date,
      start_time: this.formatForTime(reportData.startTime),
      end_time: this.formatForTime(reportData.endTime),
      break_hours: reportData.breakHours,
      total_hours: totalHours,
      manual_total_hours: reportData.manualTotalHours !== undefined ? reportData.manualTotalHours : null,
      description: reportData.description,
      "Notes": reportData.notes,
      activity_type: reportData.activityType || 'work',
      overtime_hours: reportData.overtimeHours || 0,
      company_id: this.requireCompanyId(),
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase.from('reports').insert([newReport]).select();
    if (error) throw error;

    const createdReportId = data[0].id;

    await supabase.from('reports').update({ invoice_status: reportData.invoiceStatus || 'Pending' }).eq('id', createdReportId);

    // Salva le spese
    if (expenses && expenses.length > 0) {
      const expensesToAdd = expenses.map((e: any) => ({
        company_id: this.requireCompanyId(),
        rapportino_id: createdReportId,
        worker_id: e.type === 'CANTIERE' ? null : (e.workerId || reportData.userId),
        created_by: reportData.userId, // Audit tracciabilità
        type: e.type && ['CANTIERE', 'RIMBORSO', 'KM'].includes(e.type.toUpperCase()) ? e.type.toUpperCase() : 'CANTIERE',
        description: e.description || e.notes || '',
        amount: Number(e.amount) || 0,
        km: (e.type?.toUpperCase() === 'KM' && e.km && Number(e.km) > 0) ? Number(e.km) : null
      }));
      const { error: expErr } = await supabase.from('rapportini_expenses').insert(expensesToAdd);
      if (expErr) { console.error('Error inserting expenses:', expErr); throw expErr; }
    }

    if (additionalWorkers.length > 0) {
      const workersToAdd = additionalWorkers.map((aw: any) => {
        const hours = this.calculateTotalHours(aw.startTime, aw.endTime, aw.breakHours, aw.manualTotalHours);
        const hourlyRate = aw.hourlyRate || 0;
        const totalCost = hours * hourlyRate;

        return {
          rapportino_id: createdReportId,
          worker_id: aw.userId,
          startTime: this.formatForTimestamp(reportData.date, aw.startTime),
          endTime: this.formatForTimestamp(reportData.date, aw.endTime),
          breakHours: aw.breakHours,
          hours: hours,
          manual_total_hours: aw.manualTotalHours !== undefined ? aw.manualTotalHours : null,
          hourly_rate: hourlyRate,
          total_cost: totalCost,
          person_name: aw.personName || '',
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

    return this.mapSupabaseReport({ ...data[0], additionalWorkers, expenses });
  }

  async deleteReports(ids: string[]) {
    if (!ids || ids.length === 0) return;
    const compId = this.requireCompanyId();
    
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
      .in('id', ids)
      .eq('company_id', compId);

    if (reportsError) {
      console.error('Error deleting reports:', reportsError);
      throw reportsError;
    }
  }

  async updateReport(id: string, updates: any) {
    const { additionalWorkers, expenses, ...updatesData } = updates;
    updatesData.totalHours = this.calculateTotalHours(updatesData.startTime, updatesData.endTime, updatesData.breakHours, updatesData.manualTotalHours);

    const sbObj = {
      project_id: updatesData.projectId,
      created_by: updatesData.userId,
      date: updatesData.date,
      start_time: this.formatForTime(updatesData.startTime),
      end_time: this.formatForTime(updatesData.endTime),
      break_hours: updatesData.breakHours,
      total_hours: updatesData.totalHours,
      manual_total_hours: updatesData.manualTotalHours !== undefined ? updatesData.manualTotalHours : null,
      description: updatesData.description,
      "Notes": updatesData.notes,
      activity_type: updatesData.activityType || 'work',
      overtime_hours: updatesData.overtimeHours || 0
    };

    const compId = this.requireCompanyId();
    const { error } = await supabase.from('reports')
      .update(sbObj)
      .eq('id', id)
      .eq('company_id', compId);
    if (error) throw error;

    await supabase.from('reports')
      .update({ invoice_status: updatesData.invoiceStatus || 'Pending' })
      .eq('id', id)
      .eq('company_id', compId);

    // Aggiorna le spese: la strada più sicura è ricrearle
    if (expenses !== undefined) {
      const { error: delExpErr } = await supabase.from('rapportini_expenses').delete().eq('rapportino_id', id);
      if (delExpErr) { console.error('Error deleting old expenses:', delExpErr); throw delExpErr; }

      if (expenses.length > 0) {
        const expensesToAdd = expenses.map((e: any) => ({
          company_id: compId,
          rapportino_id: id,
          worker_id: e.type === 'CANTIERE' ? null : (e.workerId || updatesData.userId),
          created_by: updatesData.userId, // Audit tracciabilità
          type: e.type && ['CANTIERE', 'RIMBORSO', 'KM'].includes(e.type.toUpperCase()) ? e.type.toUpperCase() : 'CANTIERE',
          description: e.description || e.notes || '',
          amount: Number(e.amount) || 0,
          km: (e.type?.toUpperCase() === 'KM' && e.km && Number(e.km) > 0) ? Number(e.km) : null
        }));
        const { error: insExpErr } = await supabase.from('rapportini_expenses').insert(expensesToAdd);
        if (insExpErr) { console.error('Error inserting new expenses:', insExpErr); throw insExpErr; }
      }
    }

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
            startTime: this.formatForTimestamp(updatesData.date, aw.startTime),
            endTime: this.formatForTimestamp(updatesData.date, aw.endTime),
            breakHours: aw.breakHours,
            hours: hours,
            manual_total_hours: aw.manualTotalHours !== undefined ? aw.manualTotalHours : null,
            hourly_rate: hourlyRate,
            total_cost: totalCost,
            person_name: aw.personName || '',
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
    const compId = this.requireCompanyId();
    const { error } = await supabase.from('reports')
      .update({ invoice_status: newStatus })
      .in('id', reportIds)
      .eq('company_id', compId);
    if (error) throw error;
  }

  async deleteReport(id: string) {
    const compId = this.requireCompanyId();
    // 1. Delete associated workers first to avoid foreign key constraints
    // We check company_id on reports to ensure it belongs to the tenant
    const { data: report } = await supabase.from('reports').select('id').eq('id', id).eq('company_id', compId).single();
    if (!report) throw new Error("Report not found or access denied");

    await supabase.from('rapportini_workers').delete().eq('rapportino_id', id);

    // 2. Delete the main report
    const { error } = await supabase.from('reports').delete().eq('id', id).eq('company_id', compId);
    if (error) throw error;
  }

  async getSummary(): Promise<ReportSummary[]> {
    await this.checkAuthSession();
    const { data: { user } } = await supabase.auth.getUser();
    console.log(`[RLS-AUDIT] Generating Summary | UID: ${user?.id || 'NULL'}`);
    
    const [reports, projects, clients, workers] = await Promise.all([
      this.getReports(),
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