import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

interface TooltipProps {
  text: string;
}

const Tooltip: React.FC<TooltipProps> = ({ text }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div 
      className="relative inline-flex items-center ml-1.5 group cursor-help"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onClick={() => setIsVisible(!isVisible)}
    >
      <HelpCircle 
        size={13} 
        className={`transition-colors duration-200 ${isVisible ? 'text-blue-600' : 'text-slate-300 hover:text-slate-400'}`} 
      />
      
      {isVisible && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 z-[100] animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-slate-900/90 backdrop-blur-md text-white text-[11px] font-medium p-2.5 rounded-xl shadow-xl border border-white/10 leading-relaxed text-center">
            {text}
            {/* Arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900/90" />
          </div>
        </div>
      )}
    </div>
  );
};

export default Tooltip;
