export type CompanyAction = 
  | 'access_app'
  | 'retry_setup'
  | 'update_basic_settings'
  | 'update_sensitive_settings'
  | 'toggle_status'
  | 'send_instructions'
  | 'write_domain_data';

export interface CompanyStateInfo {
  status: string;
  computed?: {
    status: string;
    needsRepair: boolean;
    error?: string;
  };
}

export function canPerformAction(company: CompanyStateInfo | null | undefined, action: CompanyAction): boolean {
  if (!company) return false;

  // DB TRUTH is the primary driver.
  const dbStatus = company.status;
  const needsRepair = company.computed?.needsRepair || false;
  
  

  switch (action) {
    case 'access_app':
      // The app is accessible only if the company is active and doesn't need repair
      return dbStatus === 'active' && !needsRepair;

    case 'retry_setup':
      // Retry is possible only if the company is pending or explicitly needs repair
      return dbStatus === 'pending' || needsRepair;

    case 'update_basic_settings':
      // SuperAdmins can always update basic info (name, email)
      return true;

    case 'update_sensitive_settings':
      // Sensitive settings (billing, status toggle) require active state
      return dbStatus === 'active';

    case 'toggle_status':
      // SuperAdmins can toggle status only if the setup is not pending
      return dbStatus !== 'pending';

    case 'send_instructions':
      // Instructions can be sent only if the setup completed successfully or needs repair
      return dbStatus === 'active' || needsRepair;

    case 'write_domain_data':
      // Core business data (Reports, Workers, Projects) can be written as long as DB is active.
      // We explicitly DO NOT block this based on `needsRepair` to avoid auto-locking the backend.
      return dbStatus === 'active';

    default:
      return false;
  }
}
