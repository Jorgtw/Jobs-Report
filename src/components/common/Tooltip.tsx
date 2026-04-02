import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';

interface TooltipProps {
  text: string;
}

const Tooltip: React.FC<TooltipProps> = ({ text }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const iconRef = useRef<HTMLDivElement>(null);

  const updatePosition = () => {
    if (iconRef.current) {
      const rect = iconRef.current.getBoundingClientRect();
      setCoords({
        top: rect.top - 8, // 8px spacing above the icon
        left: rect.left + rect.width / 2
      });
    }
  };

  useEffect(() => {
    if (isVisible) {
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
    }
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isVisible]);

  return (
    <div 
      ref={iconRef}
      className="inline-flex items-center ml-1.5 cursor-help"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onClick={(e) => {
        e.stopPropagation();
        setIsVisible(!isVisible);
      }}
    >
      <HelpCircle 
        size={14} 
        className={`transition-colors duration-200 ${isVisible ? 'text-blue-600' : 'text-slate-300 hover:text-slate-400'}`} 
      />
      
      {isVisible && (
        <div 
          className="fixed z-[999] pointer-events-none"
          style={{ 
            top: `${coords.top}px`, 
            left: `${coords.left}px`,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <div className="w-56 bg-slate-900/95 backdrop-blur-md text-white text-[12px] font-medium p-3 rounded-xl shadow-2xl border border-white/10 leading-relaxed text-center animate-in fade-in zoom-in-95 duration-200">
            {text}
            {/* Arrow */}
            <div 
              className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-slate-900/95" 
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Tooltip;
