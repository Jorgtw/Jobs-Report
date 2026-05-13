import React, { useState, useEffect } from 'react';
import { X, Trophy, Heart, MessageSquare, FileCheck, Check, Loader2, Sparkles, Zap } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';
import { supabase } from '../services/supabase';
import { db } from '../services/dbService';
import { useSubscription } from '../hooks/useSubscription';

interface UpgradeModalProps {
  onClose: () => void;
  feature?: 'communications' | 'compliance' | 'generic';
}

interface PlanData {
  code: string;
  name: string;
  price_label: string;
  stripe_price_id: string;
  description: string;
  features_list: string[];
  color_theme: string;
  is_popular: boolean;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ onClose, feature = 'generic' }) => {
  const { t } = useTranslation();
  const { status } = useSubscription();
  const [plans, setPlans] = useState<PlanData[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const { data, error } = await supabase
          .from('plans')
          .select('*')
          .neq('code', 'free') // Don't show free as an upgrade option
          .order('reports_limit', { ascending: true, nullsFirst: false });

        if (error) throw error;
        
        // Filter out current plan if applicable
        const currentCode = status?.planCode || 'free';
        const filtered = (data || []).filter(p => p.code !== currentCode);
        
        setPlans(filtered);
      } catch (err) {
        console.error('Error fetching plans:', err);
      } finally {
        setLoadingPlans(false);
      }
    };

    fetchPlans();
  }, [status?.planCode]);

  const handleUpgrade = async (priceId: string) => {
    setLoadingPriceId(priceId);
    try {
      const companyId = db.requireCompanyId();
      
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { 
          company_id: companyId,
          price_id: priceId
        }
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Checkout error:', err);
      alert('Si è verificato un errore durante l\'apertura del checkout. Riprova più tardi.');
      setLoadingPriceId(null);
    }
  };

  const featureConfig = {
    communications: {
      icon: <MessageSquare size={32} />,
      iconBg: 'bg-blue-100 text-blue-600',
      title: t('communications.premiumFeature'),
      desc: 'Sblocca le comunicazioni interne in tempo reale e tieni traccia dei messaggi aziendali.',
    },
    compliance: {
      icon: <FileCheck size={32} />,
      iconBg: 'bg-emerald-100 text-emerald-600',
      title: 'Modulo Compliance',
      desc: 'Garantisci la conformità normativa con report avanzati e controlli di sicurezza automatizzati.',
    },
    generic: {
      icon: <Trophy size={32} />,
      iconBg: 'bg-amber-100 text-amber-600',
      title: 'Espandi il tuo business',
      desc: 'Scegli il piano più adatto alle tue esigenze e porta Jobs-Report al livello successivo.',
    },
  };

  const cfg = featureConfig[feature];

  const getButtonClass = (color: string) => {
    switch (color) {
      case 'emerald': return 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200';
      case 'blue': return 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200';
      case 'purple': return 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-200';
      default: return 'bg-slate-800 hover:bg-slate-900 text-white';
    }
  };

  const getIconColorClass = (color: string) => {
    switch (color) {
      case 'emerald': return 'bg-emerald-100 text-emerald-600';
      case 'blue': return 'bg-blue-100 text-blue-600';
      case 'purple': return 'bg-purple-100 text-purple-600';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-0 sm:p-4">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose}></div>
      <div className="bg-slate-50 sm:rounded-[2rem] w-full h-full sm:h-auto sm:max-w-4xl relative z-10 shadow-2xl animate-in sm:zoom-in-95 duration-300 flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-6 sm:p-8 bg-white border-b border-slate-200 relative">
          <button onClick={onClose} className="absolute right-6 top-6 text-slate-400 hover:text-slate-600 transition-colors z-20">
            <X size={24} />
          </button>

          <div className="flex flex-col items-center text-center max-w-2xl mx-auto">
            <div className={`w-16 h-16 ${cfg.iconBg} rounded-2xl flex items-center justify-center mb-4 shadow-sm`}>
              {cfg.icon}
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-2">{cfg.title}</h2>
            <p className="text-slate-500 leading-relaxed">{cfg.desc}</p>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10">
          {loadingPlans ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="animate-spin text-blue-600" size={40} />
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Caricamento piani...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {plans.map((plan) => (
                <div 
                  key={plan.code}
                  className={`relative bg-white rounded-[1.5rem] p-8 border-2 transition-all duration-300 flex flex-col ${
                    plan.is_popular ? 'border-emerald-500 shadow-xl scale-105 z-10' : 'border-slate-100 shadow-lg hover:border-slate-200'
                  }`}
                >
                  {plan.is_popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                      <Sparkles size={12} />
                      Consigliato
                    </div>
                  )}

                  <div className="mb-6">
                    <h3 className="text-xl font-black text-slate-900 mb-1">{plan.name}</h3>
                    <p className="text-sm text-slate-500 leading-snug">{plan.description}</p>
                  </div>

                  <div className="mb-8">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black text-slate-900">{plan.price_label}</span>
                      <span className="text-slate-400 font-bold">/mese</span>
                    </div>
                  </div>

                  <div className="flex-1 space-y-4 mb-10">
                    {(plan.features_list || []).map((f, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${getIconColorClass(plan.color_theme)}`}>
                          <Check size={12} strokeWidth={4} />
                        </div>
                        <span className="text-sm font-medium text-slate-600">{f}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    disabled={loadingPriceId !== null}
                    onClick={() => handleUpgrade(plan.stripe_price_id)}
                    className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl active:scale-95 disabled:opacity-50 disabled:active:scale-100 ${getButtonClass(plan.color_theme)}`}
                  >
                    {loadingPriceId === plan.stripe_price_id ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : (
                      <>
                        <Zap size={18} fill="currentColor" />
                        Attiva Ora
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="mt-12 text-center">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
              Pagamenti sicuri tramite Stripe
            </p>
            <div className="flex justify-center items-center gap-4 opacity-40 grayscale">
              <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" alt="Stripe" className="h-5" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-100 border-t border-slate-200 text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
            JobsReport Professional Edition • Supporto 24/7
          </p>
        </div>
      </div>
    </div>
  );
};
