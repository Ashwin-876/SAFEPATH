
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
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(`Found ${result.length} route options. The first is ${result[0].duration} long.`));
    }
  };

  const handleVoiceInput = () => {
    onStartVoice?.();
  };

  return (
    <div className="min-h-full p-4 sm:p-8 space-y-8 max-w-4xl mx-auto pb-40 relative">
      {/* Top Section: Header & GPS Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight uppercase italic flex items-center">
            <span className="bg-blue-600 text-white p-2 rounded-xl mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
            </span>
            Plan Journey
          </h2>
          <p className="text-slate-500 font-bold mt-1 text-lg">SafePath AI Navigation</p>
        </div>


      </div>

      {/* Destination Search Section */}
      <section className={`bg-white p-2 rounded-[2.5rem] shadow-2xl border-2 transition-all relative ${isListening ? 'border-red-500 ring-4 ring-red-100' : 'border-slate-100 focus-within:border-blue-500'}`}>
        <form onSubmit={handleSearch} className="flex items-center">
          <input
            type="text"
            placeholder={isListening ? "Listening..." : "Search Destination..."}
            value={isListening ? interimText : destination}
            onChange={(e) => setDestination(e.target.value)}
            className="flex-1 p-6 text-2xl font-bold rounded-l-[2rem] border-none focus:ring-0 placeholder:text-slate-300 bg-transparent"
            aria-label="Enter destination"
          />
          <div className="flex items-center space-x-2 pr-2">
            <button
              type="button"
              onClick={handleVoiceInput}
              disabled={isListening}
              className={`p-5 rounded-full transition-all group relative ${isListening ? 'bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)]' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              aria-label="Voice Input"
            >
              {isListening && <span className="absolute inset-0 rounded-full bg-red-600 animate-ping opacity-25"></span>}
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 transition-transform ${isListening ? 'scale-110' : 'group-active:scale-90'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>
            <button
              type="submit"
              disabled={isSearching || isConfirming || isListening}
              className="p-5 bg-blue-600 text-white rounded-[1.8rem] shadow-xl shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all flex items-center space-x-2 min-w-[150px] justify-center"
            >
              {isSearching || isConfirming ? (
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span className="font-black uppercase text-xs tracking-tighter">
                    {isConfirming ? 'Confirming...' : 'Routing...'}
                  </span>
                </div>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span className="font-black uppercase tracking-tight">Go</span>
                </>
              )}
            </button>
          </div>
        </form>
      </section>

      {/* Results Section */}
      <div className="grid grid-cols-1 gap-6">
        {isConfirming ? (
          <div className="flex flex-col items-center justify-center p-20 space-y-6 bg-white/50 rounded-[3rem] border-4 border-dashed border-blue-100">
            <div className="relative flex h-24 w-24">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-20"></span>
              <div className="relative m-auto w-16 h-16 border-8 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
            <div className="text-center">
              <p className="text-3xl font-black text-slate-800 italic uppercase tracking-tighter">Locating Destination</p>
              <p className="text-slate-500 font-bold mt-2">Verifying "{destination}" coordinates...</p>
            </div>
          </div>
        ) : isSearching ? (
          <div className="flex flex-col items-center justify-center p-20 space-y-6 bg-white/50 rounded-[3rem] border-4 border-dashed border-emerald-100 relative overflow-hidden">
            <div className="absolute top-4 right-8">
              <span className="bg-emerald-600 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg animate-pulse">
                Smart Routing Active
              </span>
            </div>
            <div className="relative flex h-24 w-24">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-20"></span>
              <div className="relative m-auto w-16 h-16 border-8 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div className="text-center">
              <p className="text-3xl font-black text-slate-800 italic uppercase tracking-tighter">Calculating SafePath</p>
              <p className="text-slate-500 font-bold mt-2">Analyzing terrain & accessibility accessibility for your profile...</p>
            </div>
          </div>
        ) : routes.length > 0 ? (
          <div className="space-y-6">
            <h3 className="text-xl font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Available Routes</h3>
            {routes.map((route) => (
              <button
                key={route.id}
                onClick={onStartNavigation}
                className={`w-full text-left bg-white p-8 rounded-[3rem] shadow-xl border-4 transition-all flex items-center group active:scale-[0.98] ${route.type === 'SafePath' ? 'border-emerald-100 hover:border-emerald-500' : 'border-slate-50 hover:border-blue-500'
                  }`}
              >
                <div className="flex-1 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-sm ${route.type === 'SafePath' ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white'
                        }`}>
                        {route.type}
                      </span>
                      {route.type === 'SafePath' && (
                        <span className="flex items-center text-emerald-600 font-black text-xs uppercase tracking-widest">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Verified Accessible
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-black text-slate-900 leading-none">{route.duration}</p>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{route.distance}</p>
                    </div>
                  </div>

                  <h4 className="text-2xl font-bold text-slate-800 leading-tight pr-8">{route.desc}</h4>

                  <div className="flex items-center space-x-4">
                    <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden p-1 shadow-inner">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${route.accessibilityScore > 80 ? 'bg-emerald-500' : 'bg-blue-500'
                          }`}
                        style={{ width: `${route.accessibilityScore}%` }}
                      ></div>
                    </div>
                    <span className="font-black text-slate-700 text-sm whitespace-nowrap">{route.accessibilityScore}% Accessible</span>
                  </div>
                </div>

                <div className="ml-6 bg-slate-50 p-4 rounded-3xl group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        ) : (
          destination && !isSearching && (
            <div className="text-center p-20 bg-white rounded-[3rem] border-4 border-dashed border-slate-100">
              <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="text-2xl font-black text-slate-400 italic">No routes found for this destination.</p>
              <button onClick={() => setDestination('')} className="mt-4 text-blue-600 font-black uppercase tracking-widest text-sm hover:underline">Try another search</button>
            </div>
          )
        )}
      </div>



      {/* Footer Info */}
      <div className="bg-slate-900 text-white p-8 rounded-[3rem] space-y-4 shadow-2xl overflow-hidden relative group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 blur-3xl rounded-full -mr-10 -mt-10 group-hover:bg-blue-600/40 transition-colors"></div>
        <h3 className="text-2xl font-black flex items-center tracking-tight relative z-10">
          <span className="bg-blue-500/20 p-2 rounded-lg mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
          Smart Routing Active
        </h3>
        <p className="text-lg text-white/60 font-medium leading-relaxed relative z-10">
          SafePath AI automatically filters routes based on your profile. We are currently prioritizing
          <span className="text-blue-400 font-bold ml-1">
            {preferences?.avoidStairs ? 'ramps/elevators' : 'the shortest accessible path'}
          </span>.
        </p>
      </div>
    </div>
  );
};

export default RoutePlanner;
