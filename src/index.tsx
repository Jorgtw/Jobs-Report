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
  const hash = window.location.hash;
  if (hash.includes('access_token=') || hash.includes('type=recovery')) {
    if (!hash.startsWith('#/profile')) {
      const cleanParams = hash.includes('?') ? hash.substring(hash.indexOf('?')) : (hash.startsWith('#/') ? hash.substring(2) : hash.substring(1));
      window.location.replace(window.location.origin + window.location.pathname + '#/profile?' + cleanParams);
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