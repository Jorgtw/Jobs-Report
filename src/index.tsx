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
      
      // SHOW SPLASH SCREEN
      const splash = document.createElement('div');
      splash.style.cssText = 'position:fixed;inset:0;background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:99999;font-family:sans-serif;';
      splash.innerHTML = `
        <div style="width:40px;height:40px;border:4px solid #f3f3f3;border-top:4px solid #2563eb;border-radius:50%;animate:spin 1s linear infinite;"></div>
        <p style="margin-top:20px;color:#1e293b;font-weight:600;">Configurazione accesso in corso...</p>
        <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
      `;
      document.body.appendChild(splash);

      const cleanParams = h.includes('?') ? h.substring(h.indexOf('?')) : (h.startsWith('#/') ? h.substring(2) : (h.startsWith('#') ? h.substring(1) : h));
      const searchParams = s.startsWith('?') ? s.substring(1) : s;
      const finalParams = [cleanParams, searchParams].filter(Boolean).join('&');
      
      setTimeout(() => {
        window.location.replace(window.location.origin + window.location.pathname + '#/profile?' + finalParams);
      }, 500);
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