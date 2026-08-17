import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { LanguageProvider } from './contexts/LanguageContext';
import { CompanyProvider } from './contexts/CompanyContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// --- Early Supabase Auth Hash & Redirect Handler ---
(() => {
  try {
    const rawHash = window.location.hash || '';
    if (rawHash.includes('type=recovery') || rawHash.includes('recovery')) {
      console.log('[Auth Init] Password recovery hash detected, setting recovery flag');
      sessionStorage.setItem('auth_recovery_flow', 'true');
    } else if (rawHash.includes('error_description=')) {
      const params = new URLSearchParams(rawHash.replace(/^#/, ''));
      const errorDesc = params.get('error_description');
      if (errorDesc) {
        sessionStorage.setItem('auth_error_message', decodeURIComponent(errorDesc.replace(/\+/g, ' ')));
      }
      window.location.hash = '#/';
    }
  } catch (e) {
    console.warn('[Auth Init] Hash check warning:', e);
  }
})();

const queryClient = new QueryClient();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <CompanyProvider>
            <App />
          </CompanyProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);