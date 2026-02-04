
import React, { useState, useEffect, useCallback } from 'react';
import { NavState, UserPreferences, Coordinates, LocationRecord } from './types';
const Dashboard = React.lazy(() => import('./components/Dashboard'));
const RoutePlanner = React.lazy(() => import('./components/RoutePlanner'));
const CameraAssistant = React.lazy(() => import('./components/CameraAssistant'));
const CaregiverPortal = React.lazy(() => import('./components/CaregiverPortal'));
const Settings = React.lazy(() => import('./components/Settings'));
const CommunityReports = React.lazy(() => import('./components/CommunityReports'));
const EmergencyHUD = React.lazy(() => import('./components/EmergencyHUD'));
const IndoorNavigation = React.lazy(() => import('./components/IndoorNavigation'));
import Header from './components/Header';
const VoiceController = React.lazy(() => import('./components/VoiceController'));

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
          <h1 className="text-3xl font-bold text-red-500 mb-4">Something went wrong.</h1>
          <pre className="bg-slate-800 p-4 rounded text-left text-xs text-red-300 w-full max-w-lg overflow-auto">
            {this.state.error?.toString()}
          </pre>
          <button
            onClick={() => window.location.reload()}
            className="mt-8 px-6 py-3 bg-blue-600 rounded-xl font-bold"
          >
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}


const App: React.FC = () => {
  const [currentState, setCurrentState] = useState<NavState>(NavState.HOME);
  const [preferences, setPreferences] = useState<UserPreferences>({
    avoidStairs: true,
    walkingSpeed: 'normal',
    audioFeedbackLevel: 'high',
    language: 'en-US',
    vibrationFeedback: true,
    routePreference: 'safest',
    obstacleSensitivity: 'medium',
    voiceSpeed: 'normal',
    mapStyle: 'standard',
    darkMode: true,
    notificationsEnabled: true,
  });

  const [currentLocation, setCurrentLocation] = useState<Coordinates | null>(null);
  const [locationHistory, setLocationHistory] = useState<LocationRecord[]>([]);
  const [gpsActive, setGpsActive] = useState(false);
  const [voiceDestination, setVoiceDestination] = useState<string | undefined>(undefined);

  // SHARED VOICE STATE
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [voiceInterimText, setVoiceInterimText] = useState('');

  // Initialize GPS Tracking and History from Storage
  useEffect(() => {
    // Load history from localStorage
    const savedHistory = localStorage.getItem('safepath_location_history');
    if (savedHistory) {
      try {
        setLocationHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse location history", e);
      }
    }

    if (!navigator.geolocation) {
      console.error("Geolocation not supported");
      return;
    }

    setGpsActive(true);
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setCurrentLocation(coords);

        const record: LocationRecord = {
          lat: coords.lat,
          lng: coords.lng,
          timestamp: position.timestamp,
          accuracy: position.coords.accuracy
        };

        setLocationHistory(prev => {
          const next = [record, ...prev].slice(0, 200); // Keep last 200, newest first
          localStorage.setItem('safepath_location_history', JSON.stringify(next));
          return next;
        });
      },
      (error) => {
        console.error("GPS Error:", error);
        setGpsActive(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const navigateTo = (state: NavState) => {
    setCurrentState(state);
    if (state !== NavState.PLANNING) setVoiceDestination(undefined);
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(`Switched to ${state.toLowerCase()}`);
    window.speechSynthesis.speak(utterance);
  };

  const handleVoiceCommand = useCallback((command: string) => {
    const cmd = command.toLowerCase().trim();
    if (!cmd) return;

    // 1. Check for "navigate to X" or "go to X"
    const navMatch = cmd.match(/(?:navigate to|go to|find|direction to)\s+(.+)/);
    if (navMatch && navMatch[1]) {
      const dest = navMatch[1].replace(/[.?!]$/g, '').trim();
      setVoiceDestination(dest);
      navigateTo(NavState.PLANNING);
      return;
    }

    // 2. Direct Destination Search (If in PLANNING)
    if (currentState === NavState.PLANNING &&
      !['home', 'emergency', 'help', 'caregiver', 'setting', 'community', 'report', 'indoor', 'scan'].some(kw => cmd.includes(kw))) {
      setVoiceDestination(cmd.replace(/[.?!]$/g, '').trim());
      return;
    }

    if (cmd.includes('home')) navigateTo(NavState.HOME);
    else if (cmd.includes('plan') || cmd.includes('route')) navigateTo(NavState.PLANNING);
    else if (cmd.includes('start') || cmd.includes('navigate')) navigateTo(NavState.NAVIGATING);
    else if (cmd.includes('emergency') || cmd.includes('help')) navigateTo(NavState.EMERGENCY);
    else if (cmd.includes('caregiver')) navigateTo(NavState.CAREGIVER);
    else if (cmd.includes('setting')) navigateTo(NavState.SETTINGS);
    else if (cmd.includes('community') || cmd.includes('report')) navigateTo(NavState.COMMUNITY);
    else if (cmd.includes('indoor') || cmd.includes('scan')) navigateTo(NavState.INDOOR);
  }, [currentState]);

  const toggleGlobalVoice = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice recognition is not supported in this browser.");
      return;
    }

    if (isVoiceListening) {
      // Logic for stopping would go here if needed, but typically it stops on end
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsVoiceListening(true);
      setVoiceInterimText('');
      window.speechSynthesis.speak(new SpeechSynthesisUtterance("Listening."));
    };

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0])
        .map((result: any) => result.transcript)
        .join('');

      setVoiceInterimText(transcript);

      if (event.results[0].isFinal) {
        handleVoiceCommand(transcript);
        setIsVoiceListening(false);
      }
    };

    recognition.onerror = () => setIsVoiceListening(false);
    recognition.onend = () => {
      setIsVoiceListening(false);
      setVoiceInterimText('');
    };

    recognition.start();
  }, [isVoiceListening, handleVoiceCommand]);

  const isNavigableScreen = currentState === NavState.NAVIGATING || currentState === NavState.INDOOR || currentState === NavState.EMERGENCY;

  return (
    <div className="h-screen flex flex-col bg-transparent relative overflow-hidden">
      {/* Persistent GPS Indicator Overlay (Hidden during specific states to declutter) */}


      {!isNavigableScreen && (
        <Header
          currentState={currentState}
          onNavigate={navigateTo}
        />
      )}

      <main className={`flex-1 relative ${isNavigableScreen && currentState !== NavState.EMERGENCY ? 'overflow-hidden' : 'overflow-y-auto'}`}>
        <ErrorBoundary>
          <React.Suspense fallback={<div className="flex h-full items-center justify-center p-10"><h2 className="text-xl font-bold text-slate-400">Loading Module...</h2></div>}>
            {currentState === NavState.HOME && <Dashboard onAction={navigateTo} history={locationHistory} />}
            {currentState === NavState.PLANNING && (
              <RoutePlanner
                preferences={preferences}
                onStartNavigation={() => navigateTo(NavState.NAVIGATING)}
                onNavigate={navigateTo}
                gpsActive={gpsActive}
                currentLocation={currentLocation}
                initialDestination={voiceDestination}
                isListening={isVoiceListening}
                interimText={voiceInterimText}
                onStartVoice={toggleGlobalVoice}
              />
            )}
            {currentState === NavState.NAVIGATING && <CameraAssistant onStop={() => navigateTo(NavState.HOME)} preferences={preferences} />}
            {currentState === NavState.CAREGIVER && <CaregiverPortal />}
            {currentState === NavState.SETTINGS && <Settings preferences={preferences} setPreferences={setPreferences} />}
            {currentState === NavState.COMMUNITY && <CommunityReports currentLocation={currentLocation} />}
            {currentState === NavState.EMERGENCY && <EmergencyHUD onCancel={() => navigateTo(NavState.HOME)} currentLocation={currentLocation} />}
            {currentState === NavState.INDOOR && <IndoorNavigation onBack={() => navigateTo(NavState.HOME)} />}

            {!(isNavigableScreen || currentState === NavState.PLANNING) && (
              <>
                <VoiceController
                  isExternalControlled
                  isListening={isVoiceListening}
                  onToggle={toggleGlobalVoice}
                />

                <button
                  onClick={() => navigateTo(NavState.EMERGENCY)}
                  className="fixed bottom-6 right-6 w-20 h-20 bg-red-600/90 backdrop-blur-md text-white rounded-full shadow-[0_0_40px_rgba(220,38,38,0.5)] flex items-center justify-center hover:bg-red-500 hover:scale-110 active:scale-90 transition-all z-50 border-4 border-red-400 group"
                  aria-label="Activate Emergency Assistance"
                >
                  <div className="absolute inset-0 rounded-full bg-red-500 opacity-20 animate-ping"></div>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </button>
              </>
            )}
          </React.Suspense>
        </ErrorBoundary>
      </main>
    </div>
  );
};

export default App;
