import React, { useState, useEffect } from 'react';
import { X, Trophy, MessageSquare, FileCheck, Check, Loader2, Sparkles, Zap } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';
import { supabase } from '../services/supabase';
import { db } from '../services/dbService';
import { useSubscription } from '../hooks/useSubscription';
import { PRICING_PLANS } from '../utils/pricingConfig';
import { analyticsService } from '../services/analyticsService';

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
  billed_annually?: boolean;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ onClose, feature = 'generic' }) => {
  const { t } = useTranslation();
  const { status } = useSubscription();
  const [plans, setPlans] = useState<PlanData[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);
  const [isAnnual, setIsAnnual] = useState(true);

  useEffect(() => {
    // 1. Get current plan and resolve config-driven plans catalog
    const currentCode = status?.planCode || 'free';
    
    const mappedPlans = Object.values(PRICING_PLANS)
      .filter(p => p.code !== 'free' && p.code !== currentCode)
      .map(p => {
        const price = isAnnual ? p.priceYearly : p.priceMonthly;
        const stripeId = isAnnual ? p.stripePriceIdYearly : p.stripePriceIdMonthly;
        
        return {
          code: p.code,
          name: p.name,
          price_label: p.code === 'enterprise' ? 'Su Richiesta' : `€${price}`,
          stripe_price_id: stripeId || '',
          description: p.description,
          features_list: p.features_list,
          color_theme: p.color_theme,
          is_popular: p.is_popular,
          billed_annually: isAnnual && p.code !== 'enterprise'
        };
      });

    setPlans(mappedPlans);
    setLoadingPlans(false);
  }, [status?.planCode, isAnnual]);

  const handleUpgrade = async (priceId: string, planCode?: string) => {
    // Track click event for business observability
    analyticsService.trackPricingEvent('upgrade_click', {
      current_plan: status?.planCode || 'free',
      target_plan: planCode || 'unknown',
      button_source: feature
    });

    // 2. Enterprise plans redirect to direct sales/support email
    if (planCode === 'enterprise') {
      window.location.href = 'mailto:assistenza@jobs-report.it?subject=Richiesta%20Informazioni%20Piano%20Enterprise%20-%20JobsReport';
      return;
    }


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
      alert(t('dashboard.upgradeModal.checkoutError'));
      setLoadingPriceId(null);
    }
  };


  const featureConfig = {
    communications: {
      icon: <MessageSquare size={24} />,
      iconBg: 'bg-blue-100 text-blue-600',
      title: t('communications.premiumFeature'),
      desc: t('dashboard.upgradeModal.communicationsDesc'),
    },
    compliance: {
      icon: <FileCheck size={24} />,
      iconBg: 'bg-emerald-100 text-emerald-600',
      title: t('dashboard.upgradeModal.complianceTitle'),
      desc: t('dashboard.upgradeModal.complianceDesc'),
    },
    generic: {
      icon: <Trophy size={24} />,
      iconBg: 'bg-amber-100 text-amber-600',
      title: t('dashboard.upgradeModal.genericTitle'),
      desc: t('dashboard.upgradeModal.genericDesc'),
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
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-2 sm:p-4">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose}></div>
      <div className="bg-slate-50 sm:rounded-[2rem] w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-6xl relative z-10 shadow-2xl animate-in sm:zoom-in-95 duration-300 flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-6 bg-white border-b border-slate-200 relative flex-shrink-0">
          <button onClick={onClose} className="absolute right-6 top-6 text-slate-400 hover:text-slate-600 transition-colors z-20">
            <X size={22} />
          </button>

          <div className="flex flex-col items-center text-center max-w-2xl mx-auto">
            <div className={`w-12 h-12 ${cfg.iconBg} rounded-xl flex items-center justify-center mb-2 shadow-sm`}>
              {cfg.icon}
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-1">{cfg.title}</h2>
            <p className="text-xs text-slate-500 max-w-md leading-relaxed mb-6">{cfg.desc}</p>
            
            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-2 bg-slate-100/80 p-1 rounded-xl w-fit mx-auto border border-slate-200/60 shadow-inner">
              <button
                onClick={() => setIsAnnual(false)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300 ${
                  !isAnnual 
                    ? 'bg-white text-slate-900 shadow border border-slate-200/50' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Mensile
              </button>
              <button
                onClick={() => setIsAnnual(true)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300 flex items-center gap-1.5 ${
                  isAnnual 
                    ? 'bg-white text-slate-900 shadow border border-slate-200/50' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Annuale
                <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border border-emerald-200">
                  -17%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {loadingPlans ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="animate-spin text-blue-600" size={40} />
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">{t('dashboard.upgradeModal.loadingPlans')}</p>
            </div>
          ) : (
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 max-w-6xl mx-auto items-stretch ${
              plans.length === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4'
            }`}>
               {plans.map((plan) => {
                 const planNameKey = `dashboard.plans.${plan.code}.name`;
                 const planDescKey = `dashboard.plans.${plan.code}.description`;
                 const translatedName = t(planNameKey);
                 const translatedDesc = t(planDescKey);
                 
                 const displayName = translatedName !== planNameKey ? translatedName : plan.name;
                 const displayDesc = translatedDesc !== planDescKey ? translatedDesc : plan.description;

                 return (
                   <div 
                     key={plan.code}
                     className={`relative bg-white rounded-[1.25rem] p-5 border-2 transition-all duration-300 flex flex-col justify-between ${
                       plan.is_popular ? 'border-emerald-500 shadow-xl scale-[1.02] z-10' : 'border-slate-100 shadow-md hover:border-slate-200 hover:scale-[1.01]'
                     }`}
                   >
                     {plan.is_popular && (
                       <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg flex items-center gap-1 z-20">
                         <Sparkles size={10} />
                         {t('dashboard.upgradeModal.recommended')}
                       </div>
                     )}

                     <div>
                       <div className="mb-4 min-h-[50px]">
                         <h3 className="text-lg font-black text-slate-900 mb-1">{displayName}</h3>
                         <p className="text-xs text-slate-500 leading-snug">{displayDesc}</p>
                       </div>

                        <div className="mb-4 min-h-[60px]">
                          <div className="flex items-baseline gap-1">
                            <span className={`${plan.code === 'enterprise' ? 'text-2xl' : 'text-3xl'} font-black text-slate-900`}>{plan.price_label}</span>
                            {plan.code !== 'enterprise' && (
                              <span className="text-slate-400 font-bold text-[10px]">{t('dashboard.upgradeModal.perMonth')}</span>
                            )}
                          </div>
                          {plan.billed_annually && (
                            <div className="text-[10px] font-bold text-emerald-600 mt-0.5">
                              Fatturato annualmente
                            </div>
                          )}
                        </div>

                       <div className="space-y-2.5 mb-6">
                         {(plan.features_list || []).map((f, i) => {
                           const featKey = `dashboard.plans.${plan.code}.features.${i}`;
                           const translatedFeat = t(featKey);
                           const displayFeat = translatedFeat !== featKey ? translatedFeat : f;
                           const isExcluded = 
                             displayFeat.toLowerCase().startsWith('non ') ||
                             displayFeat.toLowerCase().startsWith('no ') ||
                             displayFeat.toLowerCase().startsWith('does not ') ||
                             displayFeat.toLowerCase().startsWith('nie ') ||
                             displayFeat.toLowerCase().startsWith('inkluderer ikke') ||
                             displayFeat.toLowerCase().includes('değil') ||
                             displayFeat.toLowerCase().includes('içermez');
                           
                           return (
                             <div key={i} className="flex items-start gap-2.5">
                               <div className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                                 isExcluded 
                                   ? 'bg-rose-50 text-rose-500' 
                                   : getIconColorClass(plan.color_theme)
                               }`}>
                                 {isExcluded ? <X size={10} strokeWidth={4} /> : <Check size={10} strokeWidth={4} />}
                               </div>
                               <span className={`text-[11px] font-medium leading-tight ${isExcluded ? 'text-slate-400 line-through decoration-slate-300' : 'text-slate-600'}`}>
                                 {displayFeat}
                               </span>
                             </div>
                           );
                         })}
                       </div>
                     </div>

                     <button
                       disabled={loadingPriceId !== null}
                       onClick={() => handleUpgrade(plan.stripe_price_id, plan.code)}
                       className={`w-full py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg active:scale-95 disabled:opacity-50 disabled:active:scale-100 ${getButtonClass(plan.color_theme)}`}
                     >
                       {loadingPriceId === plan.stripe_price_id ? (
                         <Loader2 className="animate-spin" size={16} />
                       ) : (
                         <>
                           <Zap size={14} fill="currentColor" />
                           {t('dashboard.upgradeModal.activateNow')}
                         </>
                       )}
                     </button>
                   </div>
                 );
               })}
            </div>
          )}

          {/* Secure Payments Badge */}
          <div className="mt-8 text-center flex-shrink-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
              {t('dashboard.upgradeModal.securePayments')}
            </p>
            <div className="flex justify-center items-center gap-4 opacity-40 grayscale scale-90">
              <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" alt="Stripe" className="h-4" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="py-3 px-6 bg-slate-100 border-t border-slate-200 text-center flex-shrink-0">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">
            {t('dashboard.upgradeModal.footerSupport')}
          </p>
        </div>
      </div>
    </div>
  );
};
