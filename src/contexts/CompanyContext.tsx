import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { supabase } from '../services/supabase';
import { db } from '../services/dbService';
import { User } from '../types';
import { canPerformAction } from '../utils/companyStatePolicy';

export type CompanyStatus = 'loading' | 'resolving' | 'ready' | 'unauthenticated' | 'error' | 'pending_setup';

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
  const isResolvingRef = useRef(false);

  const resolveContext = async (force: boolean = false) => {
    if (isResolvingRef.current && !force) return;
    isResolvingRef.current = true;

    // Prevent unneeded re-evaluations and "flashes" if we are already locked in setup
    if (status === 'pending_setup' && !force) {
      isResolvingRef.current = false;
      return;
    }
    
    console.log("[CompanyContext] Resolving context...");
    try {
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      
      console.log("[CompanyContext] Auth session check:", session ? "PRESENT" : "NONE");

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
        console.warn("[CompanyContext] User profile not found for auth ID:", session.user.id);
        setStatus('unauthenticated');
        return;
      }

      // Determine active company
      const activeCompId = userData.companyId || (userData.availableCompanies?.length ? userData.availableCompanies[0].id : null);
      
      console.log("[CompanyContext] Resolved context:", { 
        userId: userData.id, 
        companyId: activeCompId,
        role: userData.role 
      });

      const isSA = userData.role?.toLowerCase() === 'superadmin';

      if (activeCompId || isSA) {
        // Enforce status gating via policy
        if (activeCompId && !isSA) {
            const compDetails = await db.getCompanyDetails(activeCompId);
            
            if (compDetails) {
              const canAccess = canPerformAction(compDetails, 'access_app');
              console.log("[CompanyContext] Result for", activeCompId, ":", canAccess);

              if (!canAccess) {
                console.warn("[CompanyContext] Redirecting to pending_setup screen: Company fails access_app policy.");
                setStatus('pending_setup');
                setUser(userData); // Keep user data so logout works
                isResolvingRef.current = false;
                return;
              }
            } else {
              // Optimistic fallback: if we have a company ID from the profile (bridge), 
              // we trust the user has access even if the company table RLS is still propagating.
              console.log("[CompanyContext] Optimistic access granted (Details were null but companyId present)");
            }
        }

        // 1. Inject into infrastructure (Sincrono)
        db.setUserId(userData.id);
        db.setCompanyId(activeCompId);
        
        // 2. Set React State (Trigger re-render)
        setCompanyId(activeCompId);
        setUser(userData);
        
        // 3. Mark as READY (Gate open)
        setStatus('ready');
        console.log("[CompanyContext] Context successfully set to READY");
      } else {
        console.warn("[CompanyContext] Redirecting to unauthenticated: No active company and not a SuperAdmin.", { 
          userName: userData.name, 
          role: userData.role, 
          companiesCount: userData.availableCompanies?.length 
        });
        setStatus('unauthenticated');
      }
    } catch (err) {
      console.error('[CompanyContext] Critical Context Failure:', err);
      setStatus('error');
    } finally {
      isResolvingRef.current = false;
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[CompanyContext] Auth Event:", event, session?.user?.id ? "User Present" : "No User");
      
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') {
        if (session) {
          resolveContext();
        }
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

  console.log("[CompanyContext] CURRENT STATE:", { status, companyId, isUserPresent: !!user });

  return (
    <CompanyContext.Provider value={{ 
      companyId, 
      user, 
      status, 
      isReady: status === 'ready',
      refreshContext: () => resolveContext(true),
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
