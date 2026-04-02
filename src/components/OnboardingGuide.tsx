import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, ChevronRight, Check } from 'lucide-react';
import { translations, Language } from '../translations';

interface OnboardingStep {
  target?: string; // CSS selector
  titleKey: keyof typeof translations['it'];
  bodyKey: keyof typeof translations['it'];
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  requiresSidebar?: boolean;
}

interface OnboardingGuideProps {
  lang: Language;
  userRole: string;
  onComplete: () => void;
  onStepChange?: (step: OnboardingStep) => void;
}

const OnboardingGuide: React.FC<OnboardingGuideProps> = ({ lang, userRole, onComplete, onStepChange }) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const requestRef = useRef<number>();

  const t = (key: string) => {
    return (translations[lang] as any)[key] || (translations['it'] as any)[key] || key;
  };

  const steps: OnboardingStep[] = useMemo(() => {
    const baseSteps: OnboardingStep[] = [
      { 
        titleKey: 'onboarding_welcome_title', 
        bodyKey: 'onboarding_welcome_body', 
        position: 'center' 
      },
      { 
        target: '[data-onboarding="sidebar-clients"]', 
        titleKey: 'onboarding_clients_title', 
        bodyKey: 'onboarding_clients_body', 
        position: 'right',
        requiresSidebar: true
      },
      { 
        target: '[data-onboarding="sidebar-projects"]', 
        titleKey: 'onboarding_projects_title', 
        bodyKey: 'onboarding_projects_body', 
        position: 'right',
        requiresSidebar: true
      },
      { 
        target: '[data-onboarding="sidebar-personnel"]', 
        titleKey: 'onboarding_personnel_title', 
        bodyKey: 'onboarding_personnel_body', 
        position: 'right',
        requiresSidebar: true
      },
      { 
        target: '[data-onboarding="new-report-btn"]', 
        titleKey: 'onboarding_reports_title', 
        bodyKey: 'onboarding_reports_body', 
        position: 'bottom' 
      },
      { 
        titleKey: 'onboarding_finish_title', 
        bodyKey: 'onboarding_finish_body', 
        position: 'center' 
      }
    ];

    // Simple role-based filtering (e.g. operators might not see admin steps)
    if (userRole !== 'admin') return []; // For now onboarding is only for admins

    return baseSteps;
  }, [userRole]);

  const currentStep = steps[stepIndex];

  const updateTargetRect = () => {
    if (currentStep?.target) {
      const el = document.querySelector(currentStep.target);
      if (el) {
        setTargetRect(el.getBoundingClientRect());
      } else {
        setTargetRect(null);
      }
    } else {
      setTargetRect(null);
    }
    requestRef.current = requestAnimationFrame(updateTargetRect);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(updateTargetRect);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [currentStep]);

  useEffect(() => {
    if (currentStep) {
      onStepChange?.(currentStep);
    }
    // Delay visibility to wait for sidebar animations if needed
    const timer = setTimeout(() => setIsVisible(true), currentStep?.requiresSidebar ? 300 : 50);
    return () => {
      clearTimeout(timer);
      setIsVisible(false);
    };
  }, [stepIndex, currentStep]);

  const handleNext = () => {
    if (stepIndex < steps.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  if (!currentStep || steps.length === 0) return null;

  const bubblePosition = () => {
    if (!targetRect || currentStep.position === 'center') return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };

    const padding = 12;
    const { top, left, width, height } = targetRect;

    switch (currentStep.position) {
      case 'right':
        return { top: top + height / 2, left: left + width + padding, transform: 'translateY(-50%)' };
      case 'left':
        return { top: top + height / 2, left: left - padding, transform: 'translate(-100%, -50%)' };
      case 'top':
        return { top: top - padding, left: left + width / 2, transform: 'translate(-50%, -100%)' };
      case 'bottom':
        return { top: top + height + padding, left: left + width / 2, transform: 'translate(-50%, 0)' };
      default:
        return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }
  };

  // Calculate the SVG path for the overlay with a hole
  const overlayPath = useMemo(() => {
    const sw = window.innerWidth;
    const sh = window.innerHeight;
    
    // Main background (clockwise)
    const base = `M 0 0 h ${sw} v ${sh} h ${-sw} Z`;
    
    if (!targetRect) return base;
    
    // Hole (counter-clockwise to subtract with evenodd)
    const { left: x, top: y, width: w, height: h } = targetRect;
    const padding = 4;
    const hole = `M ${x - padding} ${y - padding} v ${h + padding * 2} h ${w + padding * 2} v ${-(h + padding * 2)} Z`;
    
    return `${base} ${hole}`;
  }, [targetRect]);

  return (
    <div className={`fixed inset-0 z-[9999] transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      {/* SVG Overlay with Hole using evenodd path */}
      <svg className="absolute inset-0 w-full h-full pointer-events-auto">
        <path
          fillRule="evenodd"
          fill="rgba(15, 23, 42, 0.75)"
          d={overlayPath}
        />
      </svg>

      {/* Target Pulse Effect */}
      {targetRect && (
        <div 
          className="absolute z-10 border-2 border-blue-400 rounded-xl animate-pulse pointer-events-none"
          style={{
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8
          }}
        />
      )}

      {/* Content Bubble */}
      <div 
        className="absolute z-20 w-[90vw] max-w-sm bg-white rounded-3xl shadow-2xl p-6 border border-slate-100 animate-in fade-in zoom-in-95 duration-300"
        style={bubblePosition() as React.CSSProperties}
      >
        <div className="flex justify-between items-start mb-4">
          <div className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
            {stepIndex + 1} / {steps.length}
          </div>
          <button onClick={handleSkip} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <h3 className="text-xl font-black text-slate-900 mb-2 leading-tight">
          {t(currentStep.titleKey)}
        </h3>
        <p className="text-sm text-slate-500 leading-relaxed mb-6">
          {t(currentStep.bodyKey)}
        </p>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleSkip}
            className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors px-2"
          >
            {t('onboarding_skip')}
          </button>
          <button 
            onClick={handleNext}
            className="ml-auto px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-2"
          >
            {stepIndex === steps.length - 1 ? (
              <><Check size={18} /> {t('onboarding_finish')}</>
            ) : (
              <>{t('onboarding_next')} <ChevronRight size={18} /></>
            )}
          </button>
        </div>

        {/* Arrow for target pointing */}
        {targetRect && currentStep.position !== 'center' && (
          <div 
            className={`absolute w-4 h-4 bg-white rotate-45 border-slate-100 border-l border-t ${
              currentStep.position === 'bottom' ? '-top-2 left-1/2 -translate-x-1/2' : 
              currentStep.position === 'top' ? '-bottom-2 left-1/2 -translate-x-1/2 border-r border-b border-l-0 border-t-0' :
              currentStep.position === 'right' ? '-left-2 top-1/2 -translate-y-1/2 border-b border-l' :
              '-right-2 top-1/2 -translate-y-1/2 border-r border-t border-b-0 border-l-0'
            }`}
          />
        )}
      </div>
    </div>
  );
};

export default OnboardingGuide;
