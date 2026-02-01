import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AgoraService } from '../services/AgoraService';

// Fix for default leafet marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom "Pulse" Icon for the user
const userPulseIcon = L.divIcon({
  className: 'custom-user-marker',
  html: `<div class="relative w-6 h-6">
           <div class="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-75"></div>
           <div class="absolute inset-0 bg-blue-600 rounded-full border-2 border-white shadow-lg"></div>
         </div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

// Helper to handle map resizing and focus
const MapController = ({ center, following, containerRef }: { center: [number, number]; following: boolean; containerRef: React.RefObject<HTMLDivElement> }) => {
  const map = useMap();
  const firstRun = useRef(true);

  // Handle resize events using the parent container
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });

    resizeObserver.observe(containerRef.current);

    // Initial resize to ensure current frame is correct
    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => resizeObserver.disconnect();
  }, [map, containerRef]);

  // Handle auto-focus
  useEffect(() => {
    if (following) {
      // If first run or large distance, use flyTo for effect. Otherwise use setView for smooth locking.
      const currentCenter = map.getCenter();
      const dist = currentCenter.distanceTo(L.latLng(center[0], center[1]));

      if (firstRun.current || dist > 100) {
        map.flyTo(center, 19, { duration: 1.5, easeLinearity: 0.25 });
        firstRun.current = false;
      } else {
        map.setView(center, 19, { animate: true, duration: 0.5, easeLinearity: 0.25 });
      }
    }
  }, [center, following, map]);

  return null;
};

interface MonitoredUser {
  id: string;
  name: string;
  status: string;
  location: { lat: number; lng: number };
  progress: number;
  lastUpdated: string;
  recentActivity: string[];
  battery: number;
  signal: number;
  isEmergency: boolean;
}

interface SafeZone {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radius: number;
}

interface LogEntry {
  id: string;
  timestamp: string;
  type: 'info' | 'alert' | 'communication' | 'movement';
  message: string;
}

// Simulated Route Path for Demo (A pleasant walk)
const SIMULATED_PATH = [
  [11.28880, 76.94830],
  [11.28885, 76.94835], // Point 1
  [11.28895, 76.94845], // Point 2
  [11.28910, 76.94850], // Point 3
  [11.28930, 76.94840], // Point 4 (Turn)
  [11.28940, 76.94820], // Point 5
  [11.28920, 76.94800], // Point 6 (Return towards start)
  [11.28880, 76.94830], // Loop close
];

const CaregiverPortal: React.FC = () => {
  // State
  const [user, setUser] = useState<MonitoredUser>({
    id: 'USR-772',
    name: 'Alice Smith',
    status: 'Moving Safely',
    location: { lat: 11.28880, lng: 76.94830 },
    progress: 12,
    lastUpdated: 'Live',
    recentActivity: ['Path Clear', 'Walking'],
    battery: 92,
    signal: 5,
    isEmergency: false
  });

  const [safeZones] = useState<SafeZone[]>([
    { id: 'sz-1', name: 'Home Safe Zone', lat: 11.28900, lng: 76.94820, radius: 80 }
  ]);

  const [logs, setLogs] = useState<LogEntry[]>([
    { id: '1', timestamp: '10:42 AM', type: 'info', message: 'System initialized. Tracking started.' },
    { id: '2', timestamp: '10:45 AM', type: 'movement', message: 'Left Home Safe Zone.' },
    { id: '3', timestamp: '10:48 AM', type: 'communication', message: 'Voice check-in completed: "Going to the park"' },
  ]);

  const [isFollowing, setIsFollowing] = useState(true);
  const [showHistory, setShowHistory] = useState(true);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [callStatus, setCallStatus] = useState<string>('Idle');
  const alertAudio = useRef<HTMLAudioElement | null>(null);

  // Ref for the map wrapper to monitor size changes
  const mapWrapperRef = useRef<HTMLDivElement>(null);

  // Animation State
  const pathIndexRef = useRef(0);
  const progressBetweenPointsRef = useRef(0);
  const animationRef = useRef<number>();
  const lastLogTimeRef = useRef(Date.now());

  useEffect(() => {
    alertAudio.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
  }, []);

  // Smooth Movement Animation Loop
  useEffect(() => {
    const animate = () => {
      // Move user along SIMULATED_PATH
      const speed = 0.003; // Slightly slower for better tracking demo
      progressBetweenPointsRef.current += speed;

      if (progressBetweenPointsRef.current >= 1) {
        progressBetweenPointsRef.current = 0;
        pathIndexRef.current = (pathIndexRef.current + 1) % (SIMULATED_PATH.length - 1);
      }

      const currentPoint = SIMULATED_PATH[pathIndexRef.current];
      const nextPoint = SIMULATED_PATH[pathIndexRef.current + 1];

      // Interpolate
      const lat = currentPoint[0] + (nextPoint[0] - currentPoint[0]) * progressBetweenPointsRef.current;
      const lng = currentPoint[1] + (nextPoint[1] - currentPoint[1]) * progressBetweenPointsRef.current;

      setUser(prev => {
        // Check Safe Zone
        const distanceToHome = Math.sqrt(
          Math.pow(lat - safeZones[0].lat, 2) + Math.pow(lng - safeZones[0].lng, 2)
        ) * 111000; // rough meters

        const isSafe = distanceToHome < safeZones[0].radius;
        const status = isSafe ? (prev.isEmergency ? 'SOS EMERGENCY' : 'Moving Safely') : 'WARNING: Left Safe Zone';

        // Dynamic Logs Simulation
        if (Date.now() - lastLogTimeRef.current > 8000) { // Every 8 seconds
          lastLogTimeRef.current = Date.now();
          const newLog: LogEntry = {
            id: Date.now().toString(),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: isSafe ? 'movement' : 'alert',
            message: isSafe ? `Location updated: Near Coordinates ${lat.toFixed(4)}, ${lng.toFixed(4)}` : 'Warning: Outside designated safe zone!'
          };
          setLogs(prevLogs => [newLog, ...prevLogs.slice(0, 50)]);
        }

        return {
          ...prev,
          location: { lat, lng },
          status: status,
          progress: ((pathIndexRef.current + progressBetweenPointsRef.current) / SIMULATED_PATH.length) * 100
        };
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [safeZones]);

  const triggerSOS = () => {
    setUser(u => ({ ...u, isEmergency: true }));
    setShowEmergencyModal(true);
    alertAudio.current?.play().catch(() => { });
    setLogs(prev => [{ id: Date.now().toString(), timestamp: new Date().toLocaleTimeString(), type: 'alert', message: 'SOS BEACON ACTIVATED BY USER' }, ...prev]);
  };

  const endSOS = () => {
    setUser(u => ({ ...u, isEmergency: false }));
    setShowEmergencyModal(false);
    setLogs(prev => [{ id: Date.now().toString(), timestamp: new Date().toLocaleTimeString(), type: 'info', message: 'SOS Beacon deactivated' }, ...prev]);
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#f8fafc] overflow-y-auto overflow-x-hidden">

      {/* Scrollable Container with Padding */}
      <div className="flex flex-col gap-6 p-6 min-h-full">

        {/* Emergency Overlay - Fixed relative to viewport */}
        {showEmergencyModal && (
          <div className="fixed inset-0 z-[1000] bg-red-600/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] p-10 max-w-lg w-full text-center shadow-2xl animate-bounce-short">
              <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-4xl font-black text-slate-900 mb-2 uppercase italic">SOS Alert</h2>
              <p className="text-xl font-bold text-red-600 mb-6">User triggered emergency beacon!</p>
              <div className="flex gap-4">
                <button onClick={endSOS} className="flex-1 py-4 bg-slate-900 text-white rounded-xl font-bold uppercase hover:opacity-90">Dismiss</button>
              </div>
            </div>
          </div>
        )}

        {/* Main Map Box Container - Large Fixed Height */}
        <div className="flex-none w-full h-[75vh] min-h-[500px] relative rounded-[3rem] shadow-2xl overflow-hidden border-[8px] border-white ring-1 ring-slate-900/5 bg-slate-100 transition-all duration-300" ref={mapWrapperRef}>

          <MapContainer
            center={[user.location.lat, user.location.lng]}
            zoom={19}
            zoomControl={false}
            className="h-full w-full outline-none z-0"
          >
            {/* High Quality CartoDB Styles */}
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
            <MapController
              center={[user.location.lat, user.location.lng]}
              following={isFollowing}
              containerRef={mapWrapperRef}
            />
            <ZoomControl position="bottomright" />

            {/* Safe Zone Visual */}
            {safeZones.map(zone => (
              <React.Fragment key={zone.id}>
                <Circle
                  center={[zone.lat, zone.lng]}
                  radius={zone.radius}
                  pathOptions={{
                    color: '#10b981',
                    fillColor: '#34d399',
                    fillOpacity: 0.15,
                    weight: 2,
                    dashArray: '5, 10'
                  }}
                />
                <Marker position={[zone.lat + 0.0005, zone.lng]} icon={L.divIcon({
                  className: 'bg-transparent',
                  html: `<div class="text-[10px] font-black text-emerald-600 uppercase tracking-widest text-center glass-label p-0.5 px-2 rounded-md bg-white/90 backdrop-blur shadow-sm whitespace-nowrap transform -translate-x-1/2 border border-white/50">${zone.name}</div>`
                })} />
              </React.Fragment>
            ))}

            {/* Planned/History Path */}
            {showHistory && (
              <Polyline
                positions={SIMULATED_PATH as L.LatLngExpression[]}
                pathOptions={{ color: '#64748b', weight: 4, opacity: 0.4, lineCap: 'round', dashArray: '5, 10' }}
              />
            )}

            {/* User Marker */}
            <Marker position={[user.location.lat, user.location.lng]} icon={userPulseIcon}>
              <Popup className="rounded-xl overflow-hidden shadow-lg border-0">
                <div className="p-3 bg-white min-w-[150px]">
                  <p className="font-black text-slate-800 text-sm">{user.name}</p>
                  <p className="text-xs text-blue-500 font-bold uppercase">{user.status}</p>
                  <div className="mt-2 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500" style={{ width: `${user.battery}%` }}></div>
                  </div>
                </div>
              </Popup>
            </Marker>

          </MapContainer>

          {/* Floating Header HUD */}
          <div className="absolute top-6 left-6 right-6 z-[400] flex justify-between items-start pointer-events-none">
            {/* Title & Status */}
            <div className="bg-white/90 backdrop-blur-xl p-4 rounded-[2rem] shadow-xl border border-white/50 flex items-center gap-4 pointer-events-auto transition-transform hover:scale-[1.02]">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 shadow-inner">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-black text-slate-800 text-lg leading-none">{user.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`w-2 h-2 rounded-full ${user.isEmergency ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${user.isEmergency ? 'text-red-500' : 'text-emerald-600'}`}>
                    {user.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Top Right Controls */}
            <div className="flex flex-col gap-3 pointer-events-auto">
              <div className="bg-slate-900/90 backdrop-blur-md text-white px-4 py-3 rounded-2xl shadow-lg border border-slate-700/50 flex items-center justify-center gap-2 min-w-[100px]">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="font-bold font-mono text-sm">{Math.round(user.battery)}%</span>
              </div>

              <button
                onClick={() => setIsFollowing(!isFollowing)}
                className={`px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg border transition-all flex items-center justify-center gap-2 ${isFollowing ? 'bg-blue-600 text-white border-blue-500' : 'bg-white text-slate-500 border-white hover:bg-slate-50'}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isFollowing ? 'bg-white animate-pulse' : 'bg-slate-400'}`}></span>
                {isFollowing ? 'Focus On' : 'Focus Off'}
              </button>
            </div>
          </div>

          {/* Bottom Floating Stats & Controls */}
          <div className="absolute bottom-6 left-6 right-6 z-[400] flex justify-between items-end pointer-events-none">

            {/* Left: SOS */}
            <button
              onClick={triggerSOS}
              className="bg-red-500 hover:bg-red-600 text-white w-16 h-16 rounded-full flex items-center justify-center shadow-[0_10px_25px_rgba(239,68,68,0.4)] transition-all hover:scale-110 active:scale-95 border-[3px] border-white pointer-events-auto group"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 group-hover:animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </button>

            {/* Center: Info Badge */}
            <div className="bg-white/90 backdrop-blur-xl px-6 py-3 rounded-2xl shadow-xl border border-white flex gap-4 pointer-events-auto mb-2">
              <div className="flex flex-col">
                <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Safe Zone</span>
                <span className="text-xs font-bold text-slate-800">Home Garden</span>
              </div>
              <div className="w-[1px] h-full bg-slate-200"></div>
              <div className="flex flex-col">
                <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Distance</span>
                <span className="text-xs font-bold text-slate-800">12 meters</span>
              </div>
            </div>

            {/* Right: Path Control */}
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`w-14 h-14 rounded-2xl shadow-lg border flex items-center justify-center pointer-events-auto transition-all hover:scale-105 active:scale-95 ${showHistory ? 'bg-blue-600 text-white border-blue-500' : 'bg-white text-slate-500 border-white'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0121 18.382V7.618a1 1 0 01-.553-.894L15 7m0 10V7m0 13a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v10a3 3 0 01-3 3h-4z" />
              </svg>
            </button>
          </div>
        </div>

        {/* DASHBOARD DETAILS SECTION */}
        <div className="w-full max-w-7xl mx-auto space-y-6 animate-fade-in-up">

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Daily Distance', value: '2.4 km', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6', color: 'bg-indigo-50 text-indigo-600' },
              { label: 'Active Time', value: '1h 42m', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', color: 'bg-blue-50 text-blue-600' },
              { label: 'Safe Zones', value: '1 Active', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', color: 'bg-emerald-50 text-emerald-600' },
              { label: 'Alerts', value: '0 Critical', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z', color: 'bg-red-50 text-red-600' }
            ].map((stat, i) => (
              <div key={i} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${stat.color}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                  </svg>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">{stat.label}</p>
                  <p className="text-xl font-bold text-slate-800">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Dynamic Activity Log & Control Center */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">

            {/* Left: Timeline - Spans 2 cols */}
            <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 flex flex-col h-full">
              <div className="flex items-center justify-between mb-8 flex-none">
                <h3 className="text-xl font-black text-slate-800">Activity Timeline</h3>
                <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-widest rounded-full">Live Updates</span>
              </div>

              <div className="space-y-8 relative overflow-y-auto pr-2 custom-scrollbar flex-1 max-h-[600px]">
                <div className="absolute top-2 bottom-2 left-[19px] w-0.5 bg-slate-100 h-full"></div>
                {logs.map((log) => (
                  <div key={log.id} className="relative flex gap-6 items-start animate-fade-in-left">
                    <div className={`relative z-10 w-10 h-10 rounded-full border-4 border-white shadow-md flex items-center justify-center shrink-0 
                       ${log.type === 'alert' ? 'bg-red-500 text-white' :
                        log.type === 'communication' ? 'bg-purple-500 text-white' : 'bg-blue-500 text-white'}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {log.type === 'alert' ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /> :
                          log.type === 'communication' ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /> :
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        }
                      </svg>
                    </div>
                    <div className="flex-1 pt-1">
                      <div className="flex justify-between items-baseline mb-1">
                        <h4 className={`font-bold text-sm ${log.type === 'alert' ? 'text-red-600' : 'text-slate-800'}`}>
                          {log.type === 'alert' ? 'Emergency Alert' : log.type === 'communication' ? 'Communication' : 'Movement Update'}
                        </h4>
                        <span className="text-xs font-mono text-slate-400">{log.timestamp}</span>
                      </div>
                      <p className="text-sm text-slate-500 leading-relaxed bg-slate-50 p-3 rounded-xl">{log.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Consolidated Control Panel - Spans 1 col but MATCHES HEIGHT */}
            <div className="flex flex-col gap-6 h-full">

              {/* Configuration Panel */}
              <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
                <h3 className="text-lg font-black text-slate-800 mb-6">Configuration</h3>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Safe Zone Radius</label>
                      <span className="text-xs font-bold text-blue-600">80m</span>
                    </div>
                    <input type="range" className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer" />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                    <span className="text-sm font-bold text-slate-700">Auto-Alert Contact</span>
                    <div className="w-12 h-6 bg-blue-600 rounded-full relative cursor-pointer"><div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div></div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                    <span className="text-sm font-bold text-slate-700">Voice Monitoring</span>
                    <div className="w-12 h-6 bg-slate-300 rounded-full relative cursor-pointer"><div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div></div>
                  </div>
                </div>
              </div>

              {/* Live Guidance / Remote Commands */}
              <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 shadow-xl border border-slate-700 flex-none relative overflow-hidden">
                <div className="flex items-center justify-between mb-6 relative z-10">
                  <h3 className="text-lg font-black">Live Guidance</h3>
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"></span>
                </div>

                {/* AGORA VOICE INTEGRATION */}
                <div className="mb-6 p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase text-slate-400">Emergency Voice Channel</span>
                    <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${callStatus.includes('Connected') ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'}`}>
                      {callStatus || 'Idle'}
                    </div>
                  </div>

                  {!callStatus || callStatus === 'Idle' || callStatus === 'Ended' ? (
                    <button
                      onClick={() => {
                        setCallStatus('Connecting...');
                        AgoraService.startCall((status) => setCallStatus(status));
                      }}
                      className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl uppercase text-xs tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                      Join Emergency Call
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        AgoraService.endCall();
                        setCallStatus('Ended');
                        setTimeout(() => setCallStatus('Idle'), 3000);
                      }}
                      className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl uppercase text-xs tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.516l2.257-1.13a1 1 0 00.502-1.21l-1.498-4.493A1 1 0 005 3z" /></svg>
                      End Call
                    </button>
                  )}
                </div>

                {/* Quick Actions Grid - Compact */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <button onClick={() => { const msg = "STOP!"; setLogs(prev => [{ id: Date.now().toString(), timestamp: new Date().toLocaleTimeString(), type: 'communication', message: `Command: "${msg}"` }, ...prev]); alertAudio.current?.play().catch(e => { }); }} className="py-3 bg-red-600 hover:bg-red-500 rounded-xl font-bold uppercase text-[10px] tracking-widest shadow-lg active:scale-95 transition-all">STOP</button>
                  <button onClick={() => { const msg = "Stay Calm"; setLogs(prev => [{ id: Date.now().toString(), timestamp: new Date().toLocaleTimeString(), type: 'communication', message: `Command: "${msg}"` }, ...prev]); }} className="py-3 bg-slate-700 hover:bg-slate-600 rounded-xl font-bold uppercase text-[10px] tracking-widest active:scale-95 transition-all">Stay Calm</button>
                </div>
                {/* Input */}
                <div className="bg-slate-800 p-2 rounded-2xl flex items-center gap-2 border border-slate-700">
                  <input type="text" placeholder="Send message..." className="bg-transparent text-white text-xs px-3 w-full focus:outline-none placeholder:text-slate-500 font-bold" onKeyDown={(e) => { if (e.key === 'Enter') { const target = e.target as HTMLInputElement; if (target.value.trim()) { setLogs(prev => [{ id: Date.now().toString(), timestamp: new Date().toLocaleTimeString(), type: 'communication', message: `Sent: "${target.value}"` }, ...prev]); target.value = ''; } } }} />
                  <button className="bg-blue-600 p-1.5 rounded-xl text-white hover:bg-blue-500"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg></button>
                </div>
              </div>

              {/* FILLER CARD: Device Status (Flex-1 to take ALL remaining height) */}
              <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 flex-1 flex flex-col justify-between min-h-[160px]">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-black text-slate-800">Device Health</h3>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase rounded-md">Online</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">GPS</p>
                    <div className="flex justify-center gap-1 my-1">{[1, 2, 3, 4, 5].map(i => <div key={i} className="w-1 h-3 bg-emerald-500 rounded-full"></div>)}</div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Network</p>
                    <p className="font-black text-blue-600 text-lg">LTE</p>
                  </div>
                </div>

                <div className="mt-2 text-center">
                  <p className="text-xs text-slate-400 font-medium">Last synced: Just now</p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CaregiverPortal;
