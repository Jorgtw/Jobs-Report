import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { LanguageProvider } from './contexts/LanguageContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

// IMMEDIATE REDIRECT FOR RECOVERY LINKS
// This runs before React mounts to ensure HashRouter doesn't get confused by Supabase tokens
(function() {
  const h = window.location.hash;
  const s = window.location.search;
  
  // Check both hash and search for recovery tokens
  if (h.includes('access_token=') || h.includes('type=recovery') || s.includes('type=recovery')) {
    if (!h.startsWith('#/profile')) {
      console.log('RECOVERY DETECTED - FORCING REDIRECT');
      const cleanParams = h.includes('?') ? h.substring(h.indexOf('?')) : (h.startsWith('#/') ? h.substring(2) : (h.startsWith('#') ? h.substring(1) : h));
      const searchParams = s.startsWith('?') ? s.substring(1) : s;
      const finalParams = [cleanParams, searchParams].filter(Boolean).join('&');
      
      window.location.replace(window.location.origin + window.location.pathname + '#/profile?' + finalParams);
    }
  }
})();

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
          <App />
        </LanguageProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);