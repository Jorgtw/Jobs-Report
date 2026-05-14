import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../services/supabase';
import { db } from '../services/dbService';
import { User } from '../types';

export type CompanyStatus = 'loading' | 'resolving' | 'ready' | 'unauthenticated' | 'error';

interface CompanyContextType {
  companyId: string | null;
  user: User | null;
  status: CompanyStatus;
  isReady: boolean;
  refreshContext: () => Promise<void>;
  updateUser: (u: User | null) => void;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const CompanyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<CompanyStatus>('loading');
  const [user, setUser] = useState<User | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);

  const resolveContext = async () => {
    try {
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      
      if (authError || !session) {
        setStatus('unauthenticated');
        setUser(null);
        setCompanyId(null);
        return;
      }

      setStatus('resolving');
      
      // Fetch Unified Worker Profile (SSOT)
      const userData = await db.getUserByAuthId(session.user.id);
      
      if (!userData) {
        setStatus('unauthenticated');
        return;
      }

      // Determine active company
      const activeCompId = userData.companyId || (userData.availableCompanies?.length ? userData.availableCompanies[0].id : null);
      
      if (activeCompId) {
        // Inject into global services (Infrastructure Layer)
        db.setCompanyId(activeCompId);
        db.setUserId(userData.id);
        
        setCompanyId(activeCompId);
        setUser(userData);
        setStatus('ready');
      } else {
        setStatus('unauthenticated');
      }
    } catch (err) {
      console.error('Critical Context Failure:', err);
      setStatus('error');
    }
  };

  const updateUser = (u: User | null) => {
    setUser(u);
    if (u) {
      localStorage.setItem('ws_auth', JSON.stringify(u));
    } else {
      localStorage.removeItem('ws_auth');
    }
  };

  useEffect(() => {
    resolveContext();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        resolveContext();
      } else if (event === 'SIGNED_OUT') {
        setStatus('unauthenticated');
        setUser(null);
        setCompanyId(null);
        db.setCompanyId(null);
        localStorage.removeItem('ws_auth');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <CompanyContext.Provider value={{ 
      companyId, 
      user, 
      status, 
      isReady: status === 'ready',
      refreshContext: resolveContext,
      updateUser
    }}>
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
};
