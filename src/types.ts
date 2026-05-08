export type Role = 'admin' | 'operator' | 'supervisor' | 'superadmin';
export type UserStatus = 'active' | 'inactive';

export interface Company {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  is_premium?: boolean;
  createdAt: number;
}

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
  authId?: string;
  name: string;
  username: string;
  password: string;
  email?: string;
  role: Role | 'superadmin';
  status: UserStatus;
  companyId?: string | null;
  companyName?: string;
  isPremium?: boolean;
  availableCompanies?: { id: string; name: string; role: Role }[];
  hourlyRate?: number;
  extraCost?: number;
  overtimeHourlyRate?: number;
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
  isInternal?: boolean;
  assignedWorkerIds?: string[];
  createdAt: number;
}

export interface Expense {
  id: string;
  type: 'CANTIERE' | 'RIMBORSO' | 'KM' | string; // Lascio 'string' finché la UI non è strict
  amount: number;
  description: string;
  notes?: string; // Manteniamo provvisoriamente per retrocompatibilità UI
  km?: number | null;
  workerId?: string | null;
  createdBy?: string;
}

export interface AdditionalWorker {
  userId: string;
  startTime: string;
  endTime: string;
  breakHours: number;
  manualTotalHours?: number;
  totalHours: number;
  // NUOVI CAMPI PER GESTIONE ECONOMICA
  hourlyRate?: number;
  totalCost?: number;
  personName?: string;
  personRole?: string;
  membershipType?: string;
  subcontractorId?: string;
  isManualOverride?: boolean;
  overtimeHours?: number;
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
  teamTotalHours?: number;
  description: string;
  notes: string;
  expenses: Expense[];
  additionalWorkers: AdditionalWorker[];
  activityType?: 'work' | 'sickness' | 'holiday' | 'internal';
  invoiceStatus?: string;
  overtimeHours?: number;
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
  overtimeHours: number;
  overtimeCost: number;
  projectId: string;
  invoiceStatus?: string;
  activityType?: string;
  isInternal?: boolean;
  createdAt: number;
}

export type CommStatus =
  'open' | 'acknowledged' | 'in_progress' |
  'closed' | 'archived' | 'deleted';

export type CommType = 'note' | 'issue' | 'confirmation';
export type MessageType = CommType;
export type CommTargetType = 'all' | 'user' | 'project';

export interface InternalCommunication {
  id: string;
  companyId: string;
  senderId: string;
  senderName: string;
  targetType: CommTargetType;
  targetId?: string;
  targetName?: string;
  projectId?: string;
  parentId?: string;
  parentForwardId?: string;
  metadata?: any;
  content: string;
  type: CommType;
  status: CommStatus;
  isAcknowledged: boolean;
  acknowledgedAt?: string;
  assignedTo?: string;
  assignedToName?: string;
  closedAt?: string;
  lastActivityAt: string;
  updatedAt: string;
  createdAt: number;
  isRead: boolean;
  needsAction?: boolean;
  replies?: InternalCommunication[];
}