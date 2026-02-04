
import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AgoraService } from '../services/AgoraService';
import { getRoute } from '../services/openRouteService';

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
  const animationRef = useRef<number | null>(null);
  const lastLogTimeRef = useRef(Date.now());

  // Path State
  const [pathPositions, setPathPositions] = useState<[number, number][]>(SIMULATED_PATH as [number, number][]);
  const [useRealRoute, setUseRealRoute] = useState(false);

  useEffect(() => {
    // Attempt to fetch a real route based on the loop points (Start -> Turn Point -> Home)
    const fetchRealRoute = async () => {
      try {
        const start = { lat: SIMULATED_PATH[0][0], lng: SIMULATED_PATH[0][1] };
        const mid = { lat: SIMULATED_PATH[4][0], lng: SIMULATED_PATH[4][1] };

        // Fetch path to the turning point
        const routeOut = await getRoute(start, mid);

        if (routeOut && routeOut.length > 0) {
          // For closure, just reverse it to come back
          const routeBack = [...routeOut].reverse();
          const fullLoop = [...routeOut, ...routeBack];
          setPathPositions(fullLoop as [number, number][]);
          setUseRealRoute(true);
          console.log("Using Real OpenRouteService Path:", fullLoop.length, "points");
        }
      } catch (err) {
        console.warn("Failed to retrieve real route, using simulation.", err);
      }
    };

    fetchRealRoute();
  }, []);

  useEffect(() => {
    alertAudio.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
  }, []);

  // Smooth Movement Animation Loop
  useEffect(() => {
    // If we have a very long path (real route), we speed it up
    const speed = useRealRoute ? 0.02 : 0.003;

    // Safety check
    const currentPath = pathPositions.length > 1 ? pathPositions : SIMULATED_PATH;
    const maxIndex = currentPath.length - 1;

    const animate = () => {
      progressBetweenPointsRef.current += speed;

      if (progressBetweenPointsRef.current >= 1) {
        progressBetweenPointsRef.current = 0;
        pathIndexRef.current = (pathIndexRef.current + 1);

        // Loop restart logic
        if (pathIndexRef.current >= maxIndex) {
          pathIndexRef.current = 0;
        }
      }

      const currentIndex = pathIndexRef.current;
      const nextIndex = (currentIndex + 1) % currentPath.length; // Safe wrap

      const currentPoint = currentPath[currentIndex];
      const nextPoint = currentPath[nextIndex];

      // Standard Linear Interpolation
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
          progress: ((pathIndexRef.current + progressBetweenPointsRef.current) / maxIndex) * 100
        };
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [safeZones, pathPositions, useRealRoute]);

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
    <div className="flex flex-col h-full w-full bg-slate-950 overflow-y-auto overflow-x-hidden relative">

      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 blur-[100px] rounded-full"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/10 blur-[100px] rounded-full"></div>
      </div>

      {/* Scrollable Container */}
      <div className="flex flex-col min-h-full relative z-10">

        {/* Emergency Overlay - Fixed relative to viewport */}
        {showEmergencyModal && (
          <div className="fixed inset-0 z-[1000] bg-red-900/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-black/80 rounded-[2.5rem] p-10 max-w-lg w-full text-center shadow-[0_0_50px_rgba(239,68,68,0.5)] border border-red-500 animate-bounce-short relative overflow-hidden">
              <div className="absolute inset-0 bg-red-500/10 animate-pulse"></div>
              <div className="w-24 h-24 bg-red-900/50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.6)] relative z-10">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-4xl font-black text-white mb-2 uppercase italic text-glow-red relative z-10">SOS Alert</h2>
              <p className="text-xl font-bold text-red-400 mb-8 relative z-10">Emergency Beacon Triggered!</p>
              <div className="flex gap-4 relative z-10">
                <button onClick={endSOS} className="flex-1 py-4 bg-white text-black rounded-xl font-black uppercase hover:bg-slate-200 shadow-lg transition-all">Dismiss Beacon</button>
              </div>
            </div>
          </div>
        )}

        {/* Main Map Box Container - Fullscreen 100vh */}
        <div className="flex-none w-full h-[100vh] relative overflow-hidden bg-slate-900 transition-all duration-300 border-b border-white/10" ref={mapWrapperRef}>

          <MapContainer
            center={[user.location.lat, user.location.lng]}
            zoom={19}
            zoomControl={false}
            className="h-full w-full outline-none z-0"
          >
            {/* Dark Mode CartoDB Styles */}
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png"
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
                    fillColor: '#059669',
                    fillOpacity: 0.1,
                    weight: 1,
                    dashArray: '5, 10'
                  }}
                />
                <Marker position={[zone.lat + 0.0005, zone.lng]} icon={L.divIcon({
                  className: 'bg-transparent',
                  html: `<div class="text-[10px] font-black text-emerald-400 uppercase tracking-widest text-center glass-panel p-1 px-3 rounded-full border border-emerald-500/30 whitespace-nowrap transform -translate-x-1/2 shadow-[0_0_15px_rgba(16,185,129,0.2)]">${zone.name}</div>`
                })} />
              </React.Fragment>
            ))}

            {/* Planned/History Path */}
            {showHistory && (
              <Polyline
                positions={pathPositions as L.LatLngExpression[]}
                pathOptions={{ color: '#3b82f6', weight: 3, opacity: 0.5, lineCap: 'round', dashArray: '5, 10' }}
              />
            )}

            {/* User Marker */}
            <Marker position={[user.location.lat, user.location.lng]} icon={userPulseIcon}>
              <Popup className="rounded-xl overflow-hidden shadow-lg border-0 bg-transparent">
                <div className="p-3 bg-slate-900 border border-white/20 min-w-[150px] text-white">
                  <p className="font-black text-sm">{user.name}</p>
                  <p className="text-xs text-blue-400 font-bold uppercase">{user.status}</p>
                  <div className="mt-2 h-1 w-full bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 shadow-[0_0_10px_#3b82f6]" style={{ width: `${user.battery}%` }}></div>
                  </div>
                </div>
              </Popup>
            </Marker>

          </MapContainer>

          {/* Floating Header HUD */}
          <div className="absolute top-6 left-6 right-6 z-[400] flex justify-between items-start pointer-events-none">
            {/* Title & Status */}
            <div className="glass-panel p-4 rounded-[2rem] flex items-center gap-4 pointer-events-auto transition-transform hover:scale-[1.02] bg-black/40 backdrop-blur-xl border-white/10">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)] border border-blue-500/30">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-black text-white text-lg leading-none tracking-wide uppercase">{user.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`w-2 h-2 rounded-full ${user.isEmergency ? 'bg-red-500 animate-pulse shadow-[0_0_10px_red]' : 'bg-emerald-500 shadow-[0_0_10px_#10b981]'}`}></div>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${user.isEmergency ? 'text-red-400' : 'text-emerald-400'}`}>
                    {user.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Top Right Controls */}
            <div className="flex flex-col gap-3 pointer-events-auto">
              <div className="glass-panel px-4 py-3 rounded-2xl flex items-center justify-center gap-2 min-w-[100px] bg-black/40 backdrop-blur-md border-white/10">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="font-bold font-mono text-sm text-white">{Math.round(user.battery)}%</span>
              </div>

              <button
                onClick={() => setIsFollowing(!isFollowing)}
                className={`px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg border transition-all flex items-center justify-center gap-2 
                  ${isFollowing ? 'bg-blue-600/80 text-white border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'bg-black/40 text-slate-400 border-white/10 hover:bg-white/10'}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isFollowing ? 'bg-white animate-pulse' : 'bg-slate-500'}`}></span>
                {isFollowing ? 'Locked' : 'Free Cam'}
              </button>
            </div>
          </div>

          {/* Bottom Floating Stats & Controls */}
          <div className="absolute bottom-6 left-6 right-6 z-[400] flex justify-between items-end pointer-events-none">

            {/* Left: SOS */}
            <button
              onClick={triggerSOS}
              className="bg-red-600/90 text-white w-16 h-16 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.5)] transition-all hover:scale-110 active:scale-95 border-2 border-red-400 pointer-events-auto group hover:bg-red-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 group-hover:animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </button>

            {/* Center: Info Badge */}
            <div className="glass-panel px-6 py-3 rounded-2xl border-white/10 bg-black/50 backdrop-blur-xl flex gap-6 pointer-events-auto mb-2 text-white/90">
              <div className="flex flex-col">
                <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Safe Zone</span>
                <span className="text-xs font-bold text-emerald-400 text-glow-green">Home Garden</span>
              </div>
              <div className="w-[1px] h-full bg-white/10"></div>
              <div className="flex flex-col">
                <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Distance</span>
                <span className="text-xs font-bold text-blue-400">12 meters</span>
              </div>
            </div>

            {/* Right: Path Control */}
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`w-14 h-14 rounded-2xl shadow-lg border flex items-center justify-center pointer-events-auto transition-all hover:scale-105 active:scale-95 
                ${showHistory ? 'bg-blue-600/80 text-white border-blue-500' : 'bg-black/40 text-slate-400 border-white/10'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0121 18.382V7.618a1 1 0 01-.553-.894L15 7m0 10V7m0 13a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v10a3 3 0 01-3 3h-4z" />
              </svg>
            </button>
          </div>
        </div>

        {/* DASHBOARD DETAILS SECTION - Below the fold */}
        <div className="w-full max-w-7xl mx-auto space-y-6 animate-fade-in-up p-6 lg:p-10 relative z-10">

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Daily Distance', value: '2.4 km', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6', color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' },
              { label: 'Active Time', value: '1h 42m', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
              { label: 'Safe Zones', value: '1 Active', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
              { label: 'Alerts', value: '0 Critical', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z', color: 'bg-red-500/20 text-red-500 border-red-500/30' }
            ].map((stat, i) => (
              <div key={i} className={`glass-panel p-5 rounded-3xl flex items-center gap-4 hover:bg-white/5 transition-colors border ${stat.color.split(' ').pop()}`}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border border-white/10 ${stat.color}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                  </svg>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">{stat.label}</p>
                  <p className="text-xl font-bold text-white">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Dynamic Activity Log & Control Center */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">

            {/* Left: Timeline - Spans 2 cols */}
            <div className="lg:col-span-2 glass-panel rounded-[2.5rem] p-8 border-white/10 flex flex-col h-full bg-black/40">
              <div className="flex items-center justify-between mb-8 flex-none">
                <h3 className="text-xl font-black text-white text-glow">Activity Timeline</h3>
                <span className="px-3 py-1 bg-white/5 text-blue-400 text-[10px] font-bold uppercase tracking-widest rounded-full border border-white/10 animate-pulse">Live Updates</span>
              </div>

              <div className="space-y-8 relative overflow-y-auto pr-2 custom-scrollbar flex-1 max-h-[600px]">
                <div className="absolute top-2 bottom-2 left-[19px] w-0.5 bg-white/10 h-full"></div>
                {logs.map((log) => (
                  <div key={log.id} className="relative flex gap-6 items-start animate-fade-in-left group">
                    <div className={`relative z-10 w-10 h-10 rounded-full border-4 border-slate-900 shadow-md flex items-center justify-center shrink-0 transition-transform group-hover:scale-110
                       ${log.type === 'alert' ? 'bg-red-600 text-white shadow-red-900/50' :
                        log.type === 'communication' ? 'bg-purple-600 text-white shadow-purple-900/50' : 'bg-blue-600 text-white shadow-blue-900/50'}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {log.type === 'alert' ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /> :
                          log.type === 'communication' ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /> :
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        }
                      </svg>
                    </div>
                    <div className="flex-1 pt-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <div className="flex justify-between items-baseline mb-1">
                        <h4 className={`font-bold text-sm uppercase tracking-wide ${log.type === 'alert' ? 'text-red-400' : 'text-white'}`}>
                          {log.type === 'alert' ? 'Emergency Alert' : log.type === 'communication' ? 'Communication' : 'Movement Update'}
                        </h4>
                        <span className="text-xs font-mono text-slate-500">{log.timestamp}</span>
                      </div>
                      <p className="text-sm text-slate-300 leading-relaxed bg-white/5 p-3 rounded-xl border border-white/5">{log.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Consolidated Control Panel */}
            <div className="flex flex-col gap-6 h-full">

              {/* Configuration Panel */}
              <div className="glass-panel rounded-[2.5rem] p-8 border-white/10 bg-black/40">
                <h3 className="text-lg font-black text-white mb-6 uppercase tracking-wider text-glow-blue">Configuration</h3>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Safe Zone Radius</label>
                      <span className="text-xs font-bold text-blue-400">80m</span>
                    </div>
                    <input type="range" className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                    <span className="text-sm font-bold text-slate-300">Auto-Alert Contact</span>
                    <div className="w-12 h-6 bg-blue-600 rounded-full relative cursor-pointer shadow-[0_0_10px_rgba(59,130,246,0.5)]"><div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div></div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                    <span className="text-sm font-bold text-slate-300">Voice Monitoring</span>
                    <div className="w-12 h-6 bg-slate-700 rounded-full relative cursor-pointer"><div className="absolute left-1 top-1 w-4 h-4 bg-slate-400 rounded-full shadow-sm"></div></div>
                  </div>
                </div>
              </div>

              {/* Live Guidance / Remote Commands */}
              <div className="bg-slate-900/80 text-white rounded-[2.5rem] p-8 shadow-xl border border-slate-700/50 flex-none relative overflow-hidden backdrop-blur-md">
                <div className="flex items-center justify-between mb-6 relative z-10">
                  <h3 className="text-lg font-black uppercase tracking-wider">Live Guidance</h3>
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"></span>
                </div>

                {/* AGORA VOICE INTEGRATION */}
                <div className="mb-6 p-4 bg-black/40 rounded-2xl border border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase text-slate-400">Emergency Voice Channel</span>
                    <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${callStatus.includes('Connected') ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-slate-800 text-slate-500'}`}>
                      {callStatus || 'Idle'}
                    </div>
                  </div>

                  {!callStatus || callStatus === 'Idle' || callStatus === 'Ended' ? (
                    <button
                      onClick={() => {
                        setCallStatus('Connecting...');
                        AgoraService.startCall((status) => setCallStatus(status));
                      }}
                      className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl uppercase text-xs tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 shadow-[0_0_15px_rgba(34,197,94,0.3)]"
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
                      className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl uppercase text-xs tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 shadow-[0_0_15px_rgba(220,38,38,0.4)]"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.516l2.257-1.13a1 1 0 00.502-1.21l-1.498-4.493A1 1 0 005 3z" /></svg>
                      End Call
                    </button>
                  )}
                </div>

                {/* Quick Actions Grid - Compact */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <button onClick={() => { const msg = "STOP!"; setLogs(prev => [{ id: Date.now().toString(), timestamp: new Date().toLocaleTimeString(), type: 'communication', message: `Command: "${msg}"` }, ...prev]); alertAudio.current?.play().catch(e => { }); }} className="py-3 bg-red-600/20 hover:bg-red-600/40 text-red-500 border border-red-500/50 rounded-xl font-bold uppercase text-[10px] tracking-widest shadow-lg active:scale-95 transition-all">STOP</button>
                  <button onClick={() => { const msg = "Stay Calm"; setLogs(prev => [{ id: Date.now().toString(), timestamp: new Date().toLocaleTimeString(), type: 'communication', message: `Command: "${msg}"` }, ...prev]); }} className="py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl font-bold uppercase text-[10px] tracking-widest active:scale-95 transition-all">Stay Calm</button>
                </div>
                {/* Input */}
                <div className="bg-black/50 p-2 rounded-2xl flex items-center gap-2 border border-white/10 focus-within:border-blue-500/50 transition-colors">
                  <input type="text" placeholder="Send message..." className="bg-transparent text-white text-xs px-3 w-full focus:outline-none placeholder:text-slate-600 font-bold" onKeyDown={(e) => { if (e.key === 'Enter') { const target = e.target as HTMLInputElement; if (target.value.trim()) { setLogs(prev => [{ id: Date.now().toString(), timestamp: new Date().toLocaleTimeString(), type: 'communication', message: `Sent: "${target.value}"` }, ...prev]); target.value = ''; } } }} />
                  <button className="bg-blue-600 p-1.5 rounded-xl text-white hover:bg-blue-500 shadow-md"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg></button>
                </div>
              </div>

              {/* FILLER CARD: Device Status (Flex-1 to take ALL remaining height) */}
              <div className="glass-panel rounded-[2.5rem] p-8 border-white/10 bg-black/40 flex-1 flex flex-col justify-between min-h-[160px]">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-black text-white">Device Health</h3>
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase rounded-md shadow-[0_0_10px_rgba(16,185,129,0.2)]">Online</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-4 rounded-2xl text-center border border-white/5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">GPS</p>
                    <div className="flex justify-center gap-1 my-1">{[1, 2, 3, 4, 5].map(i => <div key={i} className="w-1 h-3 bg-emerald-500 rounded-full shadow-[0_0_5px_#10b981]"></div>)}</div>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl text-center border border-white/5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Network</p>
                    <p className="font-black text-blue-400 text-lg text-glow-blue">LTE</p>
                  </div>
                </div>

                <div className="mt-2 text-center">
                  <p className="text-xs text-slate-500 font-medium">Last synced: Just now</p>
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
