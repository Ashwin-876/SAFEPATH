
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
      desc: 'AR Guidance Active',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      gradient: 'from-blue-600/80 to-blue-900/80',
      border: 'border-blue-500/50',
      glow: 'hover:shadow-[0_0_30px_rgba(37,99,235,0.6)]'
    },
    {
      id: NavState.PLANNING,
      label: 'Plan Route',
      desc: 'Optimized Path',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      ),
      gradient: 'from-emerald-600/80 to-emerald-900/80',
      border: 'border-emerald-500/50',
      glow: 'hover:shadow-[0_0_30px_rgba(16,185,129,0.6)]'
    },
    {
      id: NavState.COMMUNITY,
      label: 'Community',
      desc: 'Live Reports',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      gradient: 'from-amber-600/80 to-amber-900/80',
      border: 'border-amber-500/50',
      glow: 'hover:shadow-[0_0_30px_rgba(245,158,11,0.6)]'
    },
    {
      id: NavState.CAREGIVER,
      label: 'Caregiver',
      desc: 'Active Monitoring',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      gradient: 'from-indigo-600/80 to-indigo-900/80',
      border: 'border-indigo-500/50',
      glow: 'hover:shadow-[0_0_30px_rgba(99,102,241,0.6)]'
    }
  ];

  return (
    <div className="pt-24 pb-32 px-6 max-w-5xl mx-auto space-y-10">

      {/* Hero Section */}
      <section className="text-center space-y-2 animate-fade-in relative z-10">
        <h2 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-white to-blue-400 tracking-tighter uppercase italic drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">
          SafePath Command
        </h2>
        <div className="flex items-center justify-center space-x-2">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"></span>
          <p className="text-lg text-blue-200 font-bold tracking-widest uppercase text-glow-blue">System Online</p>
        </div>
      </section>

      {/* Main Action Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-10">

        {/* Indoor Scanner (Large) */}
        <button
          onClick={() => onAction(NavState.INDOOR)}
          className="col-span-1 sm:col-span-2 group relative overflow-hidden rounded-[2rem] border border-blue-400/30 transition-all duration-300 hover:scale-[1.01] hover:border-blue-400/80 shadow-[0_0_20px_rgba(0,0,0,0.4)] hover:shadow-[0_0_50px_rgba(37,99,235,0.4)]"
        >
          {/* Animated Background */}
          <div className="absolute inset-0 bg-blue-900/40 backdrop-blur-xl"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-transparent to-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          <div className="absolute inset-0 scan-line opacity-30"></div>

          <div className="relative p-8 flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500 blur-xl opacity-40 group-hover:opacity-70 transition-opacity"></div>
                <div className="relative bg-slate-900/80 p-4 rounded-2xl border border-blue-400/40 group-hover:rotate-12 transition-transform duration-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                </div>
              </div>
              <div className="text-left">
                <span className="block text-3xl font-black italic uppercase text-white tracking-widest text-glow">Indoor Scan</span>
                <span className="block text-blue-300 font-semibold tracking-wide">Lidar & Object Detection</span>
              </div>
            </div>

            <div className="bg-white/10 p-3 rounded-full border border-white/10 group-hover:translate-x-2 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </button>

        {/* Secondary Actions */}
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={() => onAction(action.id)}
            className={`
              relative group overflow-hidden rounded-[2rem] border ${action.border} p-6
              bg-gradient-to-br ${action.gradient} backdrop-blur-md
              transition-all duration-300 hover:scale-[1.02] ${action.glow}
              flex flex-col items-center justify-center text-center space-y-4
              shadow-lg
            `}
          >
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-20 transition-opacity"></div>

            <div className="transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-1">
              {action.icon}
            </div>

            <div>
              <span className="block text-2xl font-black uppercase tracking-tight text-white drop-shadow-md">{action.label}</span>
              <span className="block text-sm font-bold text-white/80 uppercase tracking-wider">{action.desc}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Emergency Button */}
      <button
        onClick={() => onAction(NavState.EMERGENCY)}
        className="w-full relative group overflow-hidden rounded-[2.5rem] bg-red-600 p-1 transition-transform border border-red-500 shadow-[0_0_40px_rgba(220,38,38,0.4)] hover:shadow-[0_0_60px_rgba(220,38,38,0.6)] active:scale-[0.98]"
      >
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-30"></div>
        <div className="relative bg-red-700/80 backdrop-blur-md rounded-[2.3rem] p-6 flex items-center justify-center space-x-4 border border-white/20 group-hover:bg-red-600/90 transition-colors">
          <div className="bg-white/20 p-3 rounded-full animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <span className="text-3xl font-black tracking-[0.2em] uppercase text-white drop-shadow-lg">Emergency SOS</span>
        </div>
      </button>

      {/* Live Tracking Log */}
      <section className="glass-panel rounded-[2.5rem] p-8 border border-slate-700/50">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white flex items-center">
            <span className="w-2 h-8 bg-blue-500 rounded-full mr-4 shadow-[0_0_10px_#3b82f6]"></span>
            Live Path Tracking
          </h3>
          <span className="text-xs font-bold uppercase text-blue-300 bg-blue-900/30 px-3 py-1 rounded-full border border-blue-500/30">
            {history.length} Points
          </span>
        </div>

        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
          {history.length > 0 ? (
            history.map((record, idx) => {
              const isLatest = idx === 0;
              return (
                <div
                  key={idx}
                  className={`
                    p-4 rounded-2xl flex items-center justify-between transition-all border
                    ${isLatest
                      ? 'bg-blue-600/20 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                      : 'bg-slate-800/40 border-slate-700/30 hover:bg-slate-700/40'}
                  `}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-3 h-3 rounded-full ${isLatest ? 'bg-blue-400 animate-pulse shadow-[0_0_8px_#60a5fa]' : 'bg-slate-600'}`}></div>
                    <div>
                      <p className="font-mono text-sm text-slate-200">
                        {record.lat.toFixed(6)}, {record.lng.toFixed(6)}
                      </p>
                      <p className="text-[10px] uppercase tracking-wider text-slate-500">
                        {new Date(record.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  {isLatest && (
                    <span className="text-[10px] font-bold bg-blue-500 text-white px-3 py-1 rounded-full shadow-lg">LATEST</span>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center p-8 border border-dashed border-slate-700 rounded-2xl">
              <p className="text-slate-500 italic">No GPS data available...</p>
            </div>
          )}
        </div>
      </section>

    </div>
  );
};

export default Dashboard;
