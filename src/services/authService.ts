import { User } from '../types';

export type Action = 'create' | 'read' | 'update' | 'delete' | 'approve' | 'manage_users' | 'access_admin';
export type Resource = 'reports' | 'projects' | 'clients' | 'communications' | 'workers';

export const authService = {
  /**
   * Unico punto decisionale per le autorizzazioni funzionali (RBAC).
   * La sicurezza dei dati (Tenancy) è invece garantita a monte dall'RLS del database.
   */
  can(user: User | null, action: Action, resource: Resource): boolean {
    if (!user) return false;

    // SuperAdmin bypass totale
    if (user.role === 'superadmin') return true;

    // Logica Admin / Supervisor
    const isAdmin = user.role === 'admin';
    const isSupervisor = user.role === 'supervisor';

    switch (resource) {
      case 'reports':
        if (action === 'read') return true;
        if (action === 'create') return true;
        if (action === 'update') return isAdmin || isSupervisor;
        if (action === 'delete') return isAdmin;
        if (action === 'approve') return isAdmin || isSupervisor;
        break;

      case 'projects':
      case 'clients':
        if (action === 'read') return true;
        if (action === 'create' || action === 'update' || action === 'delete') return isAdmin || isSupervisor;
        break;

      case 'workers':
      case 'communications':
        if (action === 'read') return true;
        if (action === 'create' || action === 'update' || action === 'delete') return isAdmin;
        break;

      case 'admin' as any:
        if (action === 'access_admin') return isAdmin;
        break;

      default:
        return false;
    }

    return false;
  },

  // Helper rapidi per la UI
  canManageReports(user: User | null): boolean {
    return this.can(user, 'update', 'reports');
  },

  canDelete(user: User | null, resource: Resource): boolean {
    return this.can(user, 'delete', resource);
  },

  canAccessAdmin(user: User | null): boolean {
    return this.can(user, 'access_admin', 'admin' as any);
  }
};
