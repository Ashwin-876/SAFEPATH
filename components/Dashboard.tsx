
import React from 'react';
import { NavState, LocationRecord } from '../types';

interface DashboardProps {
  onAction: (state: NavState) => void;
  history?: LocationRecord[];
}

const Dashboard: React.FC<DashboardProps> = ({ onAction, history = [] }) => {
  const actions = [
    {
      id: NavState.NAVIGATING,
      label: 'Start Navigation',
      desc: 'Use camera for AR guidance',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      gradient: 'bg-gradient-to-br from-blue-500 to-blue-700',
      shadow: 'shadow-blue-500/40 hover:shadow-blue-500/60'
    },
    {
      id: NavState.PLANNING,
      label: 'Plan New Route',
      desc: 'Find the safest path',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      ),
      gradient: 'bg-gradient-to-br from-emerald-500 to-emerald-700',
      shadow: 'shadow-emerald-500/40 hover:shadow-emerald-500/60'
    },
    {
      id: NavState.COMMUNITY,
      label: 'Community Reports',
      desc: 'Obstacles near you',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      gradient: 'bg-gradient-to-br from-amber-500 to-amber-700',
      shadow: 'shadow-amber-500/40 hover:shadow-amber-500/60'
    },
    {
      id: NavState.CAREGIVER,
      label: 'Caregiver Portal',
      desc: 'Manage connections',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      gradient: 'bg-gradient-to-br from-indigo-500 to-indigo-700',
      shadow: 'shadow-indigo-500/40 hover:shadow-indigo-500/60'
    }
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8 pb-32">
      <section className="text-center space-y-2">
        <h2 className="text-4xl font-black text-slate-800 tracking-tight uppercase italic drop-shadow-sm">SafePath Command</h2>
        <p className="text-xl text-slate-500 font-bold">Location tracking & AR guidance active</p>
      </section>

      {/* Prominent Indoor Scan Button - Glass Hybrid Style */}
      <button
        onClick={() => onAction(NavState.INDOOR)}
        className="relative w-full overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-1 rounded-[2.5rem] shadow-[0_0_40px_rgba(37,99,235,0.4)] hover:shadow-[0_0_60px_rgba(37,99,235,0.6)] transition-all group active:scale-[0.98]"
        aria-label="Start Indoor Scan"
      >
        <div className="absolute inset-0 bg-white/10 blur-xl group-hover:bg-white/20 transition-colors"></div>
        <div className="relative bg-black/20 backdrop-blur-sm rounded-[2.3rem] p-6 flex items-center justify-between border border-white/10">
          <div className="flex items-center space-x-6">
            <div className="bg-white/10 p-5 rounded-3xl backdrop-blur-md shadow-inner border border-white/20 group-hover:rotate-6 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </div>
            <span className="text-3xl font-black tracking-widest uppercase italic text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-200 drop-shadow-sm">Indoor Scanner</span>
          </div>
          <div className="bg-white/10 p-3 rounded-full group-hover:translate-x-2 transition-transform border border-white/10">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </button>

      {/* Grid Actions - Redesigned Icon Boxes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={() => onAction(action.id)}
            className={`
                relative group overflow-hidden
                ${action.gradient} 
                ${action.shadow}
                p-8 rounded-[2.5rem] 
                shadow-2xl hover:scale-[1.02] transition-all duration-300
                flex flex-col items-center text-center space-y-6 
                border border-white/10
                active:scale-[0.98]
            `}
          >
            {/* Glass shine effect */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-white/20 rounded-full blur-3xl pointer-events-none group-hover:bg-white/30 transition-colors"></div>

            <div className="relative z-10 bg-white/10 p-6 rounded-[2rem] backdrop-blur-md shadow-[inset_0_0_20px_rgba(255,255,255,0.2)] border border-white/20 group-hover:scale-110 transition-transform duration-300">
              {action.icon}
            </div>

            <div className="relative z-10 space-y-1">
              <span className="text-3xl font-black block uppercase tracking-tight text-white drop-shadow-md">
                {action.label}
              </span>
              <span className="text-blue-100 block font-bold text-lg tracking-wide opacity-90">
                {action.desc}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* EMERGENCY SOS BUTTON */}
      <button
        onClick={() => onAction(NavState.EMERGENCY)}
        className="w-full bg-red-600 text-white p-6 rounded-[2.5rem] shadow-[0_10px_30px_rgba(220,38,38,0.4)] hover:bg-red-700 hover:shadow-[0_15px_40px_rgba(220,38,38,0.6)] active:scale-[0.98] transition-all flex items-center justify-center space-x-4 border-4 border-red-500 animate-pulse"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span className="text-2xl font-black tracking-widest uppercase">Emergency SOS</span>
      </button>

      {/* Location History Section */}
      <section className="bg-white p-8 rounded-[3rem] shadow-xl space-y-6 border-2 border-slate-100">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-black text-slate-800 flex items-center tracking-tight">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            Live Path Tracking
          </h3>
          <span className="text-xs font-black uppercase text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
            {history.length} Points Recorded
          </span>
        </div>

        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {history.length > 0 ? (
            history.map((record, idx) => {
              const colors = [
                { bg: 'bg-emerald-100/30', border: 'border-emerald-500', dot: 'bg-emerald-600', shadow: 'shadow-emerald-200/50' },
                { bg: 'bg-indigo-100/30', border: 'border-indigo-500', dot: 'bg-indigo-600', shadow: 'shadow-indigo-200/50' },
                { bg: 'bg-amber-100/30', border: 'border-amber-500', dot: 'bg-amber-600', shadow: 'shadow-amber-200/50' },
                { bg: 'bg-rose-100/30', border: 'border-rose-500', dot: 'bg-rose-600', shadow: 'shadow-rose-200/50' },
                { bg: 'bg-violet-100/30', border: 'border-violet-500', dot: 'bg-violet-600', shadow: 'shadow-violet-200/50' }
              ];
              const color = idx === 0
                ? { bg: 'bg-blue-100/40', border: 'border-blue-600', dot: 'bg-blue-600', shadow: 'shadow-blue-200/50' }
                : colors[(idx - 1) % colors.length];

              return (
                <div
                  key={idx}
                  className={`p-6 rounded-[2rem] flex items-center justify-between transition-all hover:scale-[1.02] border-l-[12px] shadow-lg hover:shadow-xl ${color.bg} ${color.border} ${color.shadow}`}
                >
                  <div className="flex items-center space-x-6">
                    <div className={`w-5 h-5 rounded-full ${color.dot} ${idx === 0 ? 'animate-pulse shadow-[0_0_15px_rgba(37,99,235,0.6)]' : ''}`}></div>
                    <div>
                      <p className="font-black text-slate-800 text-lg tracking-tight">
                        {record.lat.toFixed(6)}, {record.lng.toFixed(6)}
                      </p>
                      <p className="text-xs font-black text-slate-500 uppercase tracking-widest mt-1 opacity-80">
                        {new Date(record.timestamp).toLocaleTimeString()} • Accuracy: ±{Math.round(record.accuracy)}m
                      </p>
                    </div>
                  </div>
                  {idx === 0 && (
                    <span className="text-[11px] font-black bg-blue-600 text-white px-6 py-2.5 rounded-full uppercase tracking-[0.2em] shadow-lg shadow-blue-300/50 animate-pulse">
                      Current Position
                    </span>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center p-12 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
              <p className="text-slate-400 font-bold italic">No location data recorded yet.</p>
            </div>
          )}
        </div>
      </section>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </div>
  );
};

export default Dashboard;
