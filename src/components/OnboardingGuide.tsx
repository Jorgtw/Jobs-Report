import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, ChevronRight, Check } from 'lucide-react';
import { useTranslation } from '../App';
import { TranslationKey } from '../i18n';

interface OnboardingStep {
  target?: string; // CSS selector
  titleKey: TranslationKey | string;
  bodyKey: TranslationKey | string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  requiresSidebar?: boolean;
}

interface OnboardingGuideProps {
  userRole: string;
  onComplete: () => void;
  onStepChange?: (step: OnboardingStep) => void;
}

const OnboardingGuide: React.FC<OnboardingGuideProps> = ({ userRole, onComplete, onStepChange }) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const requestRef = useRef<number>();

  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  const { t } = useTranslation();

  const steps: OnboardingStep[] = useMemo(() => {
    // ... same as before
    const baseSteps: OnboardingStep[] = [
      { 
        titleKey: 'help.onboarding_welcome_title', 
        bodyKey: 'help.onboarding_welcome_body', 
        position: 'center' 
      },
      { 
        target: '[data-onboarding="sidebar-clients"]', 
        titleKey: 'help.onboarding_clients_title', 
        bodyKey: 'help.onboarding_clients_body', 
        position: windowSize.width < 768 ? 'bottom' : 'right',
        requiresSidebar: true
      },
      { 
        target: '[data-onboarding="sidebar-personnel"]', 
        titleKey: 'help.onboarding_personnel_title', 
        bodyKey: 'help.onboarding_personnel_body', 
        position: windowSize.width < 768 ? 'bottom' : 'right',
        requiresSidebar: true
      },
      { 
        target: '[data-onboarding="sidebar-projects"]', 
        titleKey: 'help.onboarding_projects_title', 
        bodyKey: 'help.onboarding_projects_body', 
        position: windowSize.width < 768 ? 'bottom' : 'right',
        requiresSidebar: true
      },
      { 
        target: '[data-onboarding="new-report-btn"]', 
        titleKey: 'help.onboarding_reports_title', 
        bodyKey: 'help.onboarding_reports_body', 
        position: 'bottom' 
      },
      { 
        titleKey: 'help.onboarding_finish_title', 
        bodyKey: 'help.onboarding_finish_body', 
        position: 'center' 
      }
    ];

    if (userRole !== 'admin') return [];
    return baseSteps;
  }, [userRole, windowSize.width]);

  const currentStep = steps[stepIndex];

  const updateTargetRect = () => {
    if (currentStep?.target) {
      const el = document.querySelector(currentStep.target);
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setTargetRect(rect);
        } else {
          setTargetRect(null);
        }
      } else {
        setTargetRect(null);
      }
    } else {
      setTargetRect(null);
    }
    requestRef.current = requestAnimationFrame(updateTargetRect);
  };

  useEffect(() => {
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    
    requestRef.current = requestAnimationFrame(updateTargetRect);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [currentStep]);

  useEffect(() => {
    if (currentStep) {
      onStepChange?.(currentStep);
    }
    // Added a more robust delay for sidebar steps to wait for animation
    const delay = currentStep?.requiresSidebar ? 500 : 100;
    const timer = setTimeout(() => setIsVisible(true), delay);
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
    if (!targetRect || currentStep.position === 'center' || windowSize.width < 640) {
      if (windowSize.width < 640) {
        return { 
          bottom: '24px',
          left: '16px',
          right: '16px',
          width: 'auto'
        };
      }
      return { 
        bottom: '80px',
        left: '50%', 
        transform: 'translateX(-50%)'
      };
    }

    const padding = 16;
    const bubbleWidth = 384; // max-w-sm
    const { top, left, width, height } = targetRect;
    
    // Determine actual position based on screen space (collision detection)
    let pos = currentStep.position || 'bottom';
    
    if (pos === 'right' && left + width + bubbleWidth + padding > windowSize.width) {
      pos = 'bottom';
    }
    if (pos === 'bottom' && top + height + 280 > windowSize.height) {
      pos = 'top';
    }
    if (pos === 'top' && top - 280 < 0) {
      pos = 'bottom';
    }

    // Left collision detection: ensure bubble (384px) doesn't go below 16px from left
    // For 'top' and 'bottom', we use left: targetCenter - bubbleWidth/2
    let leftStyle: any = left + width / 2;
    let transformStyle = 'translate(-50%, 0)';

    if (pos === 'top' || pos === 'bottom') {
      const targetCenter = left + width / 2;
      const idealLeft = targetCenter - bubbleWidth / 2;
      if (idealLeft < 16) {
        leftStyle = 16 + bubbleWidth / 2;
      }
      transformStyle = pos === 'top' ? 'translate(-50%, -100%)' : 'translate(-50%, 0)';
    }

    switch (pos) {
      case 'right':
        return { top: top + height / 2, left: left + width + padding, transform: 'translateY(-50%)' };
      case 'left':
        const leftVal = Math.max(16 + bubbleWidth, left - padding);
        return { top: top + height / 2, left: leftVal, transform: 'translate(-100%, -50%)' };
      case 'top':
        return { top: top - padding, left: leftStyle, transform: transformStyle };
      case 'bottom':
      default:
        return { top: top + height + padding, left: leftStyle, transform: transformStyle };
    }
  };

  // Helper to get actual position for arrow rendering
  const getActualPosition = () => {
    if (!targetRect || currentStep.position === 'center' || windowSize.width < 640) return 'center';
    
    const padding = 16;
    const bubbleWidth = 384;
    const { top, left, width, height } = targetRect;
    let pos = currentStep.position || 'bottom';
    
    if (pos === 'right' && left + width + bubbleWidth + padding > windowSize.width) pos = 'bottom';
    if (pos === 'bottom' && top + height + 280 > windowSize.height) pos = 'top';
    if (pos === 'top' && top - 280 < 0) pos = 'bottom';
    
    return pos;
  };

  const lastElementRef = useRef<HTMLElement | null>(null);

  // Apply elevation (z-index) to the target element
  useEffect(() => {
    // Cleanup previous element
    if (lastElementRef.current) {
      lastElementRef.current.style.zIndex = '';
      lastElementRef.current.style.position = '';
    }

    if (isVisible && currentStep?.target) {
      const el = document.querySelector(currentStep.target) as HTMLElement;
      if (el) {
        el.style.zIndex = '9999';
        el.style.position = 'relative';
        lastElementRef.current = el;
      }
    }

    return () => {
      if (lastElementRef.current) {
        lastElementRef.current.style.zIndex = '';
        lastElementRef.current.style.position = '';
      }
    };
  }, [stepIndex, isVisible, currentStep]);

  return (
    <div className={`fixed inset-0 z-[10000] pointer-events-none transition-opacity duration-300 onboarding-active ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      {/* Target Pulse Highlight (No Shadow/Overlay) */}
      {targetRect && windowSize.width >= 640 && (
        <div 
          className="fixed z-10 border-[3px] border-blue-500 rounded-xl animate-pulse ring-4 ring-blue-500/20"
          style={{
            top: targetRect.top - 6,
            left: targetRect.left - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12
          }}
        />
      )}

      {/* Content Bubble (Pointer Events Auto to allow clicking buttons) */}
      <div 
        className="absolute z-20 w-[calc(100vw-2rem)] sm:w-[90vw] sm:max-w-sm bg-white rounded-3xl shadow-2xl p-6 border border-slate-100 animate-in fade-in zoom-in-95 duration-300 pointer-events-auto"
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
            {t('help.onboarding_skip')}
          </button>
          <button 
            onClick={handleNext}
            className="ml-auto px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-2"
          >
            {stepIndex === steps.length - 1 ? (
              <><Check size={18} /> {t('help.onboarding_finish')}</>
            ) : (
              <>{t('help.onboarding_next')} <ChevronRight size={18} /></>
            )}
          </button>
        </div>

        {/* Arrow for target pointing */}
        {targetRect && getActualPosition() !== 'center' && windowSize.width >= 640 && (
          <div 
            className={`absolute w-4 h-4 bg-white rotate-45 border-slate-100 border-l border-t ${
              getActualPosition() === 'bottom' ? '-top-2 left-1/2 -translate-x-1/2' : 
              getActualPosition() === 'top' ? '-bottom-2 left-1/2 -translate-x-1/2 border-r border-b border-l-0 border-t-0' :
              getActualPosition() === 'right' ? '-left-2 top-1/2 -translate-y-1/2 border-b border-l' :
              '-right-2 top-1/2 -translate-y-1/2 border-r border-t border-b-0 border-l-0'
            }`}
          />
        )}
      </div>
    </div>
  );
};

export default OnboardingGuide;
