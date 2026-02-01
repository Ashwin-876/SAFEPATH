import React from 'react';
import { UserPreferences } from '../types';

interface SettingsProps {
  preferences: UserPreferences;
  setPreferences: React.Dispatch<React.SetStateAction<UserPreferences>>;
}

const Settings: React.FC<SettingsProps> = ({ preferences, setPreferences }) => {

  const update = (key: keyof UserPreferences, value: any) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const SectionTitle = ({ children, icon }: { children: React.ReactNode; icon: string }) => (
    <div className="flex items-center gap-3 mb-4 px-2">
      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
        </svg>
      </div>
      <h3 className="text-xl font-black text-slate-800 tracking-tight">{children}</h3>
    </div>
  );

  const SettingCard = ({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) => (
    <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h4 className="font-bold text-slate-800 text-lg">{title}</h4>
        {desc && <p className="text-sm text-slate-500 font-medium">{desc}</p>}
      </div>
      <div className="flex-none">
        {children}
      </div>
    </div>
  );

  const Toggle = ({ value, onChange }: { value: boolean; onChange: () => void }) => (
    <button
      onClick={onChange}
      className={`w-14 h-8 rounded-full transition-colors relative ${value ? 'bg-blue-600' : 'bg-slate-600'}`}
    >
      <div
        className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-sm ${value ? 'left-7' : 'left-1'}`}
        style={{ backgroundColor: '#ffffff' }}
      ></div>
    </button>
  );

  const SegmentedControl = ({ options, value, onChange }: { options: string[], value: string, onChange: (val: string) => void }) => (
    <div className="flex bg-slate-100 p-1 rounded-xl">
      {options.map(opt => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${value === opt ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );

  return (
    <div className="p-6 pb-32 space-y-8 max-w-3xl mx-auto animate-fade-in-up">
      <div className="flex items-center justify-between">
        <h2 className="text-4xl font-black text-slate-900 italic tracking-tighter">SETTINGS</h2>
        <div className="px-4 py-2 bg-blue-50 text-blue-700 font-bold rounded-xl text-xs uppercase tracking-widest">
          v2.4.0
        </div>
      </div>

      {/* Navigation & Safety */}
      <section>
        <SectionTitle icon="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0121 18.382V7.618a1 1 0 01-.553-.894L15 7m0 10V7m0 13a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v10a3 3 0 01-3 3h-4z">
          Navigation & Safety
        </SectionTitle>
        <div className="space-y-4">
          <SettingCard title="Route Preference" desc="Choose how SafePath calculates your journey">
            <SegmentedControl
              options={['shortest', 'safest', 'accessible']}
              value={preferences.routePreference || 'safest'}
              onChange={(val) => update('routePreference', val)}
            />
          </SettingCard>

          <SettingCard title="Avoid Stairs" desc="Prioritize ramps and elevators">
            <Toggle value={preferences.avoidStairs} onChange={() => update('avoidStairs', !preferences.avoidStairs)} />
          </SettingCard>

          <SettingCard title="Obstacle Sensitivity" desc="Adjust how early obstacles are detected">
            <SegmentedControl
              options={['low', 'medium', 'high']}
              value={preferences.obstacleSensitivity || 'medium'}
              onChange={(val) => update('obstacleSensitivity', val)}
            />
          </SettingCard>

          <SettingCard title="Geo-Fence Alerts" desc="Notify contacts when leaving safe zones">
            <Toggle value={true} onChange={() => { }} /> {/* Placeholder logic */}
          </SettingCard>
        </div>
      </section>

      {/* Audio & Feedback */}
      <section>
        <SectionTitle icon="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z">
          Voice & Feedback
        </SectionTitle>
        <div className="space-y-4">
          <SettingCard title="Voice Guidance Speed">
            <SegmentedControl
              options={['slow', 'normal', 'fast']}
              value={preferences.voiceSpeed || 'normal'}
              onChange={(val) => update('voiceSpeed', val)}
            />
          </SettingCard>

          <SettingCard title="Haptic Feedback" desc="Vibrate on turns and alerts">
            <Toggle value={preferences.vibrationFeedback ?? true} onChange={() => update('vibrationFeedback', !preferences.vibrationFeedback)} />
          </SettingCard>

          <SettingCard title="Detailed Audio Reports" desc="Announce street names and landmarks">
            <SegmentedControl
              options={['low', 'medium', 'high']}
              value={preferences.audioFeedbackLevel}
              onChange={(val) => update('audioFeedbackLevel', val)}
            />
          </SettingCard>
        </div>
      </section>

      {/* Interface */}
      <section>
        <SectionTitle icon="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01">
          Interface & Account
        </SectionTitle>
        <div className="space-y-4">
          <SettingCard title="Map Style">
            <SegmentedControl
              options={['standard', 'satellite', 'high-contrast']}
              value={preferences.mapStyle || 'standard'}
              onChange={(val) => update('mapStyle', val)}
            />
          </SettingCard>



          <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-3xl shadow-lg flex items-center justify-between text-white cursor-pointer active:scale-[0.98] transition-all">
            <div>
              <h4 className="font-bold text-lg mb-1">Caregiver Connection</h4>
              <p className="text-slate-300 text-xs font-medium uppercase tracking-wide">Status: Active (Alice)</p>
            </div>
            <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      <div className="p-4 text-center">
        <button className="text-red-500 font-bold text-sm uppercase tracking-widest hover:bg-red-50 px-6 py-3 rounded-xl transition-colors">
          Log Out & Clear Data
        </button>
      </div>

    </div>
  );
};

export default Settings;
