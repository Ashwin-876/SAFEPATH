
import React from 'react';
import { NavState } from '../types';

interface HeaderProps {
  currentState: NavState;
  onNavigate: (state: NavState) => void;
}

const Header: React.FC<HeaderProps> = ({ currentState, onNavigate }) => {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center p-4 pointer-events-none">
      <header className="glass-panel rounded-full px-6 py-3 flex items-center justify-between pointer-events-auto space-x-8 animate-fade-in w-full max-w-5xl backdrop-blur-xl bg-slate-900/80 border border-white/10 shadow-2xl">

        {/* Brand */}
        <div className="flex items-center space-x-3 group cursor-pointer" onClick={() => onNavigate(NavState.HOME)}>
          <div className="bg-blue-600/20 p-2 rounded-full border border-blue-500/30 group-hover:scale-110 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white group-hover:text-blue-300 transition-colors">
            SafePath <span className="text-blue-400 font-black">AI</span>
          </h1>
        </div>

        {/* Navigation - Desktop */}
        <nav className="hidden md:flex items-center space-x-1 bg-slate-800/50 p-1 rounded-full border border-white/5">
          {Object.values(NavState).filter(s => s !== NavState.HOME).map((state) => {
            const isActive = currentState === state;
            const isEmergency = state === NavState.EMERGENCY;

            return (
              <button
                key={state}
                onClick={() => onNavigate(state)}
                className={`
                  px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-300
                  ${isActive
                    ? (isEmergency
                      ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.5)]'
                      : 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]')
                    : (isEmergency
                      ? 'text-red-400 hover:bg-red-900/30 hover:text-red-200'
                      : 'text-slate-400 hover:bg-slate-700/50 hover:text-white')
                  }
                `}
              >
                {state}
              </button>
            );
          })}
        </nav>

        {/* Settings / Mobile Menu Trigger */}
        <button
          onClick={() => onNavigate(NavState.SETTINGS)}
          className={`p-2 rounded-full transition-all border border-transparent hover:border-slate-600 hover:bg-slate-800 ${currentState === NavState.SETTINGS ? 'bg-slate-800 border-blue-500/50 text-blue-400' : 'text-slate-400'}`}
          aria-label="Settings"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </header>
    </div>
  );
};

export default Header;
