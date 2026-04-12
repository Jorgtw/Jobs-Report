import React, { useState, useEffect } from 'react';
import { 
  BookOpen, HelpCircle, Smartphone, PlusCircle, Users, 
  BarChart3, ShieldCheck, Building2, Sparkles, X 
} from 'lucide-react';
import { User } from '../types';

interface ArticleCardProps {
  title: string;
  children: React.ReactNode;
  icon: React.ReactNode;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ title, children, icon }) => (
  <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-all">
    <div className="flex items-start gap-4">
      <div className="p-3 rounded-2xl bg-slate-50 shrink-0">
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-bold text-slate-900 mb-1">{title}</h3>
        <p className="text-xs text-slate-500 leading-relaxed">{children}</p>
      </div>
    </div>
  </div>
);

interface HelpViewProps {
  user: User;
  isMobile: boolean;
  t: (key: string) => string;
}

const HelpView: React.FC<HelpViewProps> = ({ user, isMobile, t }) => {
  const isAdmin = user?.role === 'admin';
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [manualHtml, setManualHtml] = useState<string>('');

  useEffect(() => {
    // When leaving the help view, explicitly close the global AI Chat to avoid floating windows overlapping
    return () => {
      setIsGuideOpen(false);
      window.dispatchEvent(new CustomEvent('close-ai-chat'));
    };
  }, []);

  useEffect(() => {
    if (!isGuideOpen) return;
    
    // Function to load arbitrary manual file
    const loadManual = (url: string) => {
      fetch(url)
        .then(res => res.text())
        .then(html => {
          const safeHtml = html.replace(/target="_blank"/g, "");
          setManualHtml(safeHtml);
        })
        .catch(err => {
          console.error("Failed to load manual:", err);
          setManualHtml('<div class="p-8 text-center text-red-500 font-bold">Impossibile caricare il manuale. Riprova più tardi.</div>');
        });
    };

    loadManual('/MANUALE.html');
    
    // We attach it to window so our internal click handler can switch languages if requested
    (window as any)._loadManual = loadManual;
    
    return () => {
      delete (window as any)._loadManual;
    };
  }, [isGuideOpen]);

  const handleManualClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const link = target.closest('a');
    if (!link) return;
    
    const href = link.getAttribute('href');
    if (!href) return;
    
    // External absolute links
    if (href.startsWith('http')) return; 

    // Prevent default React Router hash change
    e.preventDefault(); 

    if (href.startsWith('#')) {
      const elementId = href.substring(1);
      const modalNode = e.currentTarget;
      const element = modalNode.querySelector(`#${elementId}`) || document.getElementById(elementId);
      if (element) {
         element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      // It's a file link, like MANUALE_es.html or /MANUALE_es.html
      const loadFn = (window as any)._loadManual;
      if (loadFn) {
        loadFn(href.startsWith('/') ? href : `/${href}`);
      }
    }
  };

  useEffect(() => {
    if (!isGuideOpen || !manualHtml) return;
    
    // dangerouslySetInnerHTML blocks script execution by design.
    // We must manually find and re-append <script> tags to force the browser to execute them,
    // which revives the setLang() function and the mobile TOC navigation.
    const container = document.getElementById('manual-inner-container');
    if (!container) return;
    
    const addedScripts: HTMLScriptElement[] = [];
    const scripts = container.querySelectorAll('script');
    scripts.forEach(script => {
      const newScript = document.createElement('script');
      newScript.textContent = script.textContent;
      document.body.appendChild(newScript);
      addedScripts.push(newScript);
      
      script.parentNode?.removeChild(script);
    });

    // Cleanup function to avoid polluting the DOM upon closing
    return () => {
      addedScripts.forEach(s => {
        if (s.parentNode) {
          s.parentNode.removeChild(s);
        }
      });
    };
  }, [manualHtml, isGuideOpen]);

  return (
    <div className="space-y-8 pb-10 px-4 sm:px-0">
      <div className="text-center max-w-2xl mx-auto pt-4">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">{t('help.title')}</h1>
        <p className="text-slate-500 font-medium">{t('help.subtitle')}</p>
        
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl shadow-blue-200/50 flex flex-col justify-between group overflow-hidden relative text-left">
            <div className="relative z-10">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <BookOpen size={24} />
              </div>
              <h3 className="text-xl font-bold text-white mb-1">{t('help.guideTitle')}</h3>
              <p className="text-blue-100 text-sm leading-relaxed max-w-md">{t('help.guideBody')}</p>
            </div>
            <button 
              onClick={() => setIsGuideOpen(true)}
              className="mt-8 px-6 py-3 bg-white text-blue-600 font-bold rounded-2xl w-fit shadow-lg hover:shadow-xl transition-all active:scale-95 z-10"
            >
              {t('help.guideBtn')}
            </button>
            <HelpCircle className="absolute -right-8 -bottom-8 text-white/10 w-48 h-48 -rotate-12 group-hover:rotate-0 transition-transform duration-700" />
          </div>

          <ArticleCard 
            icon={<Smartphone className="text-blue-500" />} 
            title={t('help.pwaTitle')} 
          >
            {t('help.pwaBody')}
          </ArticleCard>
        </div>

        {/* Roles based content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12 text-left">
          {!isAdmin ? (
            <>
              <ArticleCard icon={<PlusCircle className="text-emerald-500" />} title={t('help.newReportTitle')}>{t('help.newReportBody')}</ArticleCard>
              <ArticleCard icon={<Users className="text-amber-500" />} title={t('help.additionalWorkersTitle')}>{t('help.additionalWorkersBody')}</ArticleCard>
            </>
          ) : (
            <>
              <ArticleCard icon={<BarChart3 className="text-indigo-500" />} title={t('help.adminSummaryTitle')}>{t('help.adminSummaryBody')}</ArticleCard>
              <ArticleCard icon={<ShieldCheck className="text-blue-500" />} title={t('help.adminPersonnelTitle')}>{t('help.adminPersonnelBody')}</ArticleCard>
              <ArticleCard icon={<Building2 className="text-rose-500" />} title={t('help.adminInternalTitle')}>{t('help.adminInternalBody')}</ArticleCard>
            </>
          )}
        </div>
      </div>

      <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200 text-center max-w-2xl mx-auto">
        <div className="w-16 h-16 bg-white rounded-3xl shadow-sm border border-slate-100 flex items-center justify-center mx-auto mb-4">
          <HelpCircle className="text-blue-500" size={32} />
        </div>
        <h3 className="font-black text-slate-900 text-xl tracking-tight">{t('help.contactHeader')}</h3>
        <p className="text-slate-500 text-sm mt-3 leading-relaxed font-medium">
          {t('help.supportContact')}
        </p>
        
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('open-ai-chat'))}
            className="w-full sm:w-auto px-8 py-3 bg-slate-900 text-white font-bold rounded-2xl shadow-xl hover:bg-black transition-all flex items-center justify-center gap-2 group"
          >
            <Sparkles size={18} className="text-blue-400 group-hover:scale-110 transition-transform" />
            {t('help.chatWithAI')}
          </button>
          
          {!isMobile && (
            <button 
              onClick={() => {
                localStorage.removeItem('onboarding_v1');
                window.location.hash = '/home';
                window.location.reload();
              }}
              className="w-full sm:w-auto px-8 py-3 bg-white text-slate-600 font-bold rounded-2xl border border-slate-200 shadow-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
            >
              <Smartphone size={18} />
              {t('help.restart')}
            </button>
          )}
        </div>
      </div>

      {/* Modale Manuale (Single Window Experience) overlay */}
      {isGuideOpen && (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in fade-in slide-in-from-bottom-4">
          <div className="h-16 border-b border-slate-200 flex items-center justify-between px-6 shrink-0 bg-slate-50">
            <h2 className="font-bold text-slate-800">{t('help.guideTitle')}</h2>
            <button 
              onClick={() => setIsGuideOpen(false)}
              className="p-2 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-2 group"
            >
              <span className="text-sm font-bold text-slate-500 group-hover:text-slate-800">Chiudi</span>
              <X size={24} className="text-slate-600 group-hover:text-slate-900" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto w-full max-w-5xl mx-auto md:px-10 py-10" id="manual-container">
            <div 
              id="manual-inner-container"
              className="prose prose-slate max-w-none px-6 md:px-0"
              dangerouslySetInnerHTML={{ __html: manualHtml }} 
              onClick={handleManualClick}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default HelpView;
