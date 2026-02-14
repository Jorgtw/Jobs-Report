export type Role = 'admin' | 'operator' | 'supervisor';
export type UserStatus = 'active' | 'inactive';

export interface Subcontractor {
  id: string;
  name: string;
  vatNumber: string;
  contactPerson: string;
  phone: string;
  email: string;
  address?: string;
  billingType?: 'hourly' | 'fixed';
  amount?: number;
  status?: 'active' | 'inactive';
  notes?: string;
  createdAt: number;
}

export interface User {
  id: string;
  name: string;
  username: string;
  password: string;
  email?: string;
  role: Role;
  status: UserStatus;
  hourlyRate?: number;
  extraCost?: number;
  phone?: string;
  address?: string;
  notes?: string;
  subcontractorId?: string;
  createdAt: number;
}

export interface Client {
  id: string;
  name: string;
  vatNumber: string;
  billingAddress: string;
  mainContactName: string;
  mainContactPhone: string;
  email: string;
  status: 'active' | 'inactive';
  notes?: string;
  createdAt: number;
}

export interface Project {
  id: string;
  clientId: string;
  name: string;
  description: string;
  address?: string;
  notes?: string;
  status: 'active' | 'closed';
  siteContactName?: string;
  siteContactPhone?: string;
  siteContactEmail?: string;
  siteContactRole?: string;
  financialAgreement?: 'hourly' | 'fixed';
  sellingPrice?: number;
  createdAt: number;
}

export interface Expense {
  id: string;
  type: string;
  amount: number;
  notes: string;
}

export interface AdditionalWorker {
  userId: string;
  startTime: string;
  endTime: string;
  breakHours: number;
  manualTotalHours?: number;
  totalHours: number;
}

export interface WorkReport {
  id: string;
  userId: string;
  projectId: string;
  date: string;
  startTime: string;
  endTime: string;
  breakHours: number;
  manualTotalHours?: number;
  totalHours: number;
  description: string;
  notes: string;
  expenses: Expense[];
  additionalWorkers: AdditionalWorker[];
  createdAt: number;
}

export interface ReportSummary {
  id: string;
  date: string;
  projectName: string;
  clientName: string;
  userName: string;
  userId: string;
  totalHours: number;
  totalExpenses: number;
  description: string;
  revenue: number;
  cost: number;
  createdAt: number;
}
