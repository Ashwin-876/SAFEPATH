
import React from 'react';
import { Coordinates } from '../types';

interface GpsIndicatorProps {
  location: Coordinates | null;
  isActive: boolean;
}

const GpsIndicator: React.FC<GpsIndicatorProps> = ({ location, isActive }) => {
  if (!isActive) return null;

  return (
    <div 
      className="flex flex-col items-end space-y-2 pointer-events-none"
      aria-live="polite"
      role="status"
    >
      <div className="bg-slate-900/90 backdrop-blur-2xl px-6 py-4 rounded-[1.5rem] border-2 border-white/20 shadow-2xl flex items-center space-x-5 transition-all transform hover:scale-105">
        <div className="relative flex h-8 w-8">
          <span className={`animate-[ping_3s_linear_infinite] absolute inline-flex h-full w-full rounded-full opacity-40 ${location ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
          <div className={`relative flex items-center justify-center rounded-xl h-8 w-8 shadow-inner ${location ? 'bg-emerald-500' : 'bg-amber-500'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        
        <div className="flex flex-col">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-black uppercase tracking-[0.2em] text-white">
              {location ? 'Signal: Locked' : 'Acquiring...'}
            </span>
            <div className="flex space-x-0.5">
               {[1, 2, 3, 4].map(i => (
                 <div key={i} className={`w-1 h-3 rounded-full ${location && i <= 3 ? 'bg-emerald-400' : 'bg-white/20'}`}></div>
               ))}
            </div>
          </div>
          
          {location && (
            <div className="mt-1">
              <span className="text-[10px] font-mono font-black text-emerald-400 leading-none">
                {location.lat.toFixed(5)}°N, {location.lng.toFixed(5)}°W
              </span>
            </div>
          )}
        </div>
      </div>
      
      {location && (
        <div className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 shadow-lg">
           <span className="text-[9px] font-black uppercase text-white/60 tracking-widest">
             High Precision Tracking Active
           </span>
        </div>
      )}
    </div>
  );
};

export default GpsIndicator;
