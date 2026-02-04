
import React, { useState, useEffect } from 'react';
import { generateSmartRoute } from '../services/gemini';
import { NavState, Coordinates } from '../types';

interface RoutePlannerProps {
  onStartNavigation: () => void;
  onNavigate?: (state: NavState) => void;
  preferences?: any;
  gpsActive?: boolean;
  currentLocation?: Coordinates | null;
  initialDestination?: string;
  isListening?: boolean;
  interimText?: string;
  onStartVoice?: () => void;
}

const RoutePlanner: React.FC<RoutePlannerProps> = ({
  onStartNavigation,
  onNavigate,
  preferences,
  gpsActive,
  currentLocation,
  initialDestination,
  isListening = false,
  interimText = '',
  onStartVoice
}) => {
  const [destination, setDestination] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [routes, setRoutes] = useState<any[]>([]);
  const [isConfirming, setIsConfirming] = useState(false);

  // Auto-search if initialDestination is provided
  useEffect(() => {
    if (initialDestination) {
      setDestination(initialDestination);
      const fakeEvent = { preventDefault: () => { } } as React.FormEvent;
      handleSearch(fakeEvent, initialDestination);
    }
  }, [initialDestination]);

  // Initial greeting and prompt
  useEffect(() => {
    if (!initialDestination) {
      const greeting = new SpeechSynthesisUtterance("Planning screen active. Where would you like to go today?");
      window.speechSynthesis.speak(greeting);
    }
  }, []);

  const handleSearch = async (e: React.FormEvent, overrideDest?: string) => {
    e.preventDefault();
    const finalDest = overrideDest || destination;
    if (!finalDest) return;

    setIsConfirming(true);
    const confirmation = new SpeechSynthesisUtterance(`Confirming location for ${finalDest}`);
    window.speechSynthesis.speak(confirmation);

    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsConfirming(false);

    setIsSearching(true);
    const routingNotice = new SpeechSynthesisUtterance("Smart routing is active. Calculating the safest paths.");
    window.speechSynthesis.speak(routingNotice);

    const result = await generateSmartRoute(finalDest, preferences || { avoidStairs: true, walkingSpeed: 'normal' });
    setRoutes(result);
    setIsSearching(false);

    if (result.length > 0) {
      const msg = `Found ${result.length} route options. The first is ${result[0].duration} long.`;
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(msg));
    }
  };

  const handleVoiceInput = () => {
    onStartVoice?.();
  };

  return (
    <div className="min-h-full p-6 sm:p-8 space-y-8 max-w-5xl mx-auto pb-40">

      {/* Header */}
      <div className="flex items-center space-x-4 mb-4">
        <div className="bg-blue-600/20 p-3 rounded-full border border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.5)]">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0121 18.382V7.618a1 1 0 01-.806-.984l-4.647-2.324A1 1 0 0115 5m-6-3l-4.553 2.223A1 1 0 003 5.318V16.634a1 1 0 00.553.894L9 20M15 4.318l-4.553 2.223A1 1 0 009 7.634V18.95a1 1 0 00.957.947l4.59-2.296" />
          </svg>
        </div>
        <div>
          <h2 className="text-3xl font-black text-white tracking-wide uppercase text-glow-blue">Journey Planner</h2>
          <p className="text-blue-300/60 font-medium text-sm tracking-widest uppercase">AI-Optimized Routing</p>
        </div>
      </div>

      {/* Search Input */}
      <section className={`glass-panel p-2 rounded-[2rem] transition-all relative group
         ${isListening ? 'border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.3)]' : 'border-white/10 focus-within:border-blue-500 focus-within:shadow-[0_0_20px_rgba(59,130,246,0.3)]'}
      `}>
        <form onSubmit={handleSearch} className="flex items-center">
          <input
            type="text"
            placeholder={isListening ? "Listening..." : "Where to?"}
            value={isListening ? interimText : destination}
            onChange={(e) => setDestination(e.target.value)}
            className="flex-1 bg-transparent p-6 text-2xl font-bold text-white placeholder-slate-500 border-none focus:ring-0 outline-none w-full"
            aria-label="Enter destination"
          />

          <div className="flex items-center space-x-2 pr-2">
            <button
              type="button"
              onClick={handleVoiceInput}
              disabled={isListening}
              className={`p-4 rounded-full transition-all relative overflow-hidden group/mic
                ${isListening
                  ? 'bg-red-600/20 text-red-500 border border-red-500/50'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'}
              `}
            >
              {isListening && <div className="absolute inset-0 bg-red-500/20 animate-ping rounded-full"></div>}
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 relative z-10 ${isListening ? 'animate-pulse' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>

            <button
              type="submit"
              disabled={isSearching || isConfirming || isListening}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-[1.5rem] font-bold uppercase tracking-widest shadow-lg hover:shadow-blue-500/40 hover:scale-105 active:scale-95 transition-all text-sm disabled:opacity-50 disabled:pointer-events-none"
            >
              {isSearching || isConfirming ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Calc...</span>
                </div>
              ) : (
                "Go"
              )}
            </button>
          </div>
        </form>
      </section>

      {/* Results Area */}
      <div className="space-y-4">
        {isConfirming ? (
          <div className="glass-panel p-12 rounded-[2rem] flex flex-col items-center justify-center text-center space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/30 blur-xl rounded-full animate-pulse"></div>
              <div className="relative w-20 h-20 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">Locating Target</h3>
              <p className="text-blue-200/60 font-mono text-sm tracking-wider">TRIANGULATING COORDINATES...</p>
            </div>
          </div>
        ) : isSearching ? (
          <div className="glass-panel p-12 rounded-[2rem] flex flex-col items-center justify-center text-center space-y-6 border-emerald-500/30">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full animate-pulse"></div>
              <div className="relative w-20 h-20 border-4 border-emerald-500/50 border-t-emerald-400 rounded-full animate-spin-slow"></div>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-2 text-glow-green">Optimizing SafePath</h3>
              <p className="text-emerald-200/60 font-mono text-sm tracking-wider">ANALYZING ACCESSIBILITY DATA...</p>
            </div>
          </div>
        ) : routes.length > 0 ? (
          <>
            <h3 className="text-slate-400 font-bold uppercase tracking-widest text-sm ml-2">Recommended Routes</h3>
            <div className="space-y-4">
              {routes.map((route) => (
                <button
                  key={route.id}
                  onClick={onStartNavigation}
                  className={`w-full text-left glass-panel p-6 rounded-[2rem] transition-all group hover:bg-white/5 hover:border-blue-400/50 active:scale-[0.98] relative overflow-hidden
                    ${route.type === 'SafePath' ? 'border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : ''}
                  `}
                >
                  {route.type === 'SafePath' && (
                    <div className="absolute top-0 right-0 p-4">
                      <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur-md">
                        Recommended
                      </span>
                    </div>
                  )}

                  <div className="flex flex-col gap-4 relative z-10">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className={`inline-block px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest mb-2
                            ${route.type === 'SafePath' ? 'bg-emerald-500 text-black' : 'bg-slate-700 text-slate-300'}
                          `}>
                          {route.type}
                        </div>
                        <h4 className="text-2xl font-bold text-white group-hover:text-glow-blue transition-all">{route.desc}</h4>
                      </div>
                      <div className="text-right mt-8">
                        <div className="text-4xl font-black text-white leading-none tracking-tight">{route.duration}</div>
                        <div className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">{route.distance}</div>
                      </div>
                    </div>

                    {/* Accessibility Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                        <span className="text-slate-400">Accessibility Score</span>
                        <span className={route.accessibilityScore > 80 ? 'text-emerald-400' : 'text-blue-400'}>{route.accessibilityScore}%</span>
                      </div>
                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_currentColor]
                             ${route.accessibilityScore > 80 ? 'bg-emerald-500 text-emerald-500' : 'bg-blue-500 text-blue-500'}
                           `}
                          style={{ width: `${route.accessibilityScore}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </>
        ) : (
          destination && !isSearching && (
            <div className="glass-panel p-10 rounded-[2rem] text-center border-dashed border-slate-700">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="text-slate-400 font-medium">No results found for "{destination}"</p>
              <button onClick={() => setDestination('')} className="mt-4 text-blue-400 text-sm font-bold uppercase tracking-widest hover:text-blue-300">Clear Search</button>
            </div>
          )
        )}
      </div>

      {/* Info Footer */}
      <div className="glass-panel p-6 rounded-3xl flex items-start gap-4">
        <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400 shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-1">Smart Preferences</h4>
          <p className="text-slate-400 text-sm leading-relaxed">
            Routes are automatically filtered to prioritize <span className="text-white font-semibold">{preferences?.avoidStairs ? 'ramps & elevators' : 'speed'}</span> based on your settings.
          </p>
        </div>
      </div>

    </div>
  );
};

export default RoutePlanner;
