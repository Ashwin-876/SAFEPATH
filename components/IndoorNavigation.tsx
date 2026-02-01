import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';

interface IndoorNavigationProps {
  onBack: () => void;
}

// --- Mock Indoor Map Data ---
interface LocationNode {
  id: string;
  name: string;
  nextId: string | null;
  instruction: string; // Display text
  voiceInstruction: string; // Optimized for TTS
}

const INDOOR_MAP: Record<string, LocationNode> = {
  'safe-entry': {
    id: 'safe-entry',
    name: 'Main Entrance',
    nextId: 'safe-hallway',
    instruction: 'Move forward 25 steps to Central Hallway.',
    voiceInstruction: 'Move forward twenty-five steps. You will reach the Central Hallway.'
  },
  'safe-hallway': {
    id: 'safe-hallway',
    name: 'Central Hallway',
    nextId: 'safe-turn',
    instruction: 'Walk 10 steps, then Turn Left.',
    voiceInstruction: 'Walk forward ten steps. Then, turn left immediately at the water cooler.'
  },
  'safe-turn': {
    id: 'safe-turn',
    name: 'East Wing Junction',
    nextId: 'safe-dest',
    instruction: 'Turn Right Now. Pharmacy is 15 steps ahead.',
    voiceInstruction: 'Turn right now. Move forward fifteen steps. The Pharmacy will be on your right.'
  },
  'safe-dest': {
    id: 'safe-dest',
    name: 'Pharmacy',
    nextId: null,
    instruction: 'You have arrived.',
    voiceInstruction: 'You have arrived at the Pharmacy. Assistance is available at the counter.'
  }
};

interface DetectedObject {
  id: number;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  distance: number;
  type: 'SAFE' | 'WARNING' | 'DANGER' | 'INFO';
}

const IndoorNavigation: React.FC<IndoorNavigationProps> = ({ onBack }) => {
  const [currentLocation, setCurrentLocation] = useState<LocationNode | null>(null);
  const [instruction, setInstruction] = useState("Scan any QR code for step-by-step guidance.");
  const [detectedObjects, setDetectedObjects] = useState<DetectedObject[]>([]);
  const [lastScannedId, setLastScannedId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [emergencyMode, setEmergencyMode] = useState(false);

  // No Response Monitoring
  const lastInteractionRef = useRef(Date.now());
  const noResponseAlertCountRef = useRef(0);
  const monitorIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const recognitionInterval = useRef<NodeJS.Timeout | null>(null);
  const caregiverInterval = useRef<NodeJS.Timeout | null>(null);

  // Helper for clear speech
  const speak = (text: string, isAlert = false) => {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.9;
    utter.pitch = isAlert ? 1.2 : 1.1;
    utter.volume = 1.0;
    window.speechSynthesis.speak(utter);
  };

  const resetInactivityTimer = () => {
    lastInteractionRef.current = Date.now();
    noResponseAlertCountRef.current = 0;
  };

  const stop = () => {
    window.speechSynthesis.cancel();
  };

  // Initialize Camera & Loops
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            requestAnimationFrame(tick);
          };
        }
      } catch (err) {
        console.error("Camera error:", err);
        setInstruction("Camera access denied.");
      }
    };
    startCamera();

    // Start Object Detection Simulation
    recognitionInterval.current = setInterval(simulateObjectDetection, 2500);

    // Simulate Caregiver Messages
    caregiverInterval.current = setInterval(() => {
      if (Math.random() > 0.85) {
        const msgs = [
          "Caregiver says: Wait, stop!",
          "Caregiver says: Turn around, wrong way.",
          "Caregiver says: Assistance is on the way."
        ];
        const msg = msgs[Math.floor(Math.random() * msgs.length)];
        setFeedbackMessage(msg);
        speak(msg, true);
        setTimeout(() => setFeedbackMessage(null), 4000);
      }
    }, 8000);

    // Inactivity Monitor
    monitorIntervalRef.current = setInterval(() => {
      const timeSinceInteraction = Date.now() - lastInteractionRef.current;
      // Trigger after 30 seconds of inactivity
      if (timeSinceInteraction > 30000) {
        if (noResponseAlertCountRef.current === 0) {
          // First Warning
          speak(`Are you still there? ${currentLocation ? currentLocation.voiceInstruction : instruction}`, true);
          setFeedbackMessage("No Response Detected");
          noResponseAlertCountRef.current = 1;
        } else if (noResponseAlertCountRef.current === 1 && timeSinceInteraction > 60000) {
          // Second Warning (Caregiver Notify) - 60s total inactivity
          speak("No response detected. Automatically notifying caregiver with your location.", true);
          setFeedbackMessage("Alerting Caregiver...");
          noResponseAlertCountRef.current = 2; // Stop spamming
          // TODO: Simulate API call to caregiver here
          console.log("Simulating caregiver notification due to prolonged inactivity.");
        }
      }
    }, 10000); // Check every 10s

    // Initial Voice Command Setup (Web Speech API)
    setupVoiceRecognition();

    return () => {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (recognitionInterval.current) clearInterval(recognitionInterval.current);
      if (caregiverInterval.current) clearInterval(caregiverInterval.current);
      if (monitorIntervalRef.current) clearInterval(monitorIntervalRef.current); // Cleanup for new interval
      window.speechSynthesis.cancel();
    };
  }, [currentLocation, instruction]); // Added currentLocation and instruction to dependencies for the speak function

  const recognitionRef = useRef<any>(null);

  // ... (keeping other refs)

  const setupVoiceRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    // Cleanup existing instance if any
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) { /* ignore */ }
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
      console.log("Voice Command:", transcript);
      handleVoiceCommand(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
    } catch (e) { console.log("Recognition start failed", e); }
  };

  const handleVoiceCommand = (cmd: string) => {
    resetInactivityTimer();
    let response = "";

    // --- Navigation Commands ---
    if (cmd.includes("move forward") || cmd.includes("go forward")) response = "Moving forward.";
    else if (cmd.includes("turn left")) response = "Turning left.";
    else if (cmd.includes("turn right")) response = "Turning right.";
    else if (cmd.includes("stop")) response = "Stopping now.";
    else if (cmd.includes("go back")) response = "Turning around.";
    else if (cmd.includes("repeat direction") || cmd.includes("repeat instruction")) {
      response = "Repeating last instruction.";
      // Helper to trigger the actual repetition logic after speaking confirmation
      setTimeout(() => repeatInstruction(), 2000);
    }
    else if (cmd.includes("slow down")) response = "Slowing guidance speed.";
    else if (cmd.includes("speed up")) response = "Increasing guidance speed.";

    // --- Location & Status Commands ---
    else if (cmd.includes("where am i")) {
      response = currentLocation
        ? `You are near the ${currentLocation.name}.`
        : "You are near the main entrance."; // Default/fallback as requested
    }
    else if (cmd.includes("what is in front of me") || cmd.includes("what's in front")) {
      // Dynamic check
      if (detectedObjects.length > 0) {
        const nearest = detectedObjects.sort((a, b) => a.distance - b.distance)[0];
        response = `There is a ${nearest.label} ahead.`;
      } else {
        response = "There is a door ahead."; // Mock fallback as requested
      }
    }
    else if (cmd.includes("detect object") || cmd.includes("identify object") || cmd.includes("what is this")) {
      stop(); // clear previous speech
      if (detectedObjects.length > 0) {
        const objList = detectedObjects.map(o => o.label).join(" and ");
        response = `I have detected: ${objList} in your path.`;
      } else {
        response = "Scanning surroundings... No specific objects identified yet.";
        // Force a simulation update potentially
        simulateObjectDetection();
      }
    }
    else if (cmd.includes("what is around me")) {
      response = "I detect a chair on the left and a person ahead."; // Mock
    }
    else if (cmd.includes("am i safe")) response = "Yes, your path is clear.";
    else if (cmd.includes("distance to destination")) response = "You are 10 meters away.";
    else if (cmd.includes("current time") || cmd.includes("what time is it")) {
      response = `The current time is ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    else if (cmd.includes("battery level") || cmd.includes("battery status")) {
      response = "Battery level is 85%."; // Mock value
    }

    else if (cmd.includes("where are the stairs") || cmd.includes("stairs")) {
      response = "The stairs are located at the end of the north hallway, roughly 20 meters ahead.";
    }
    else if (cmd.includes("where is the elevator") || cmd.includes("elevator") || cmd.includes("lift")) {
      response = "The elevator is to your left, past the reception desk.";
    }
    else if (cmd.includes("where is the bathroom") || cmd.includes("restroom") || cmd.includes("toilet")) {
      response = "The restroom is down the corridor on your right.";
    }
    // --- New Safety & Utility Commands ---
    else if (cmd.includes("nearest exit") || cmd.includes("escape route")) {
      response = "The nearest exit is the Main Entrance, 40 meters behind you.";
    }
    else if (cmd.includes("read text") || cmd.includes("read sign")) {
      response = "Reading text... 'Emergency Exit Only'."; // Mock response
    }
    else if (cmd.includes("louder") || cmd.includes("volume up")) {
      response = "Volume increased to maximum.";
    }
    else if (cmd.includes("softer") || cmd.includes("quiet") || cmd.includes("volume down")) {
      response = "Volume decreased.";
    }
    else if (cmd.includes("call") && (cmd.includes("alice") || cmd.includes("help"))) {
      response = "Calling Caregiver Alice...";
      // Trigger mock call
    }
    // --- Short & System Commands ---
    else if (cmd === "repeat" || cmd === "say again") {
      response = "Repeating.";
      setTimeout(() => repeatInstruction(), 1000);
    }
    else if (cmd === "status" || cmd === "update") {
      response = `System active. ${emergencyMode ? 'Emergency mode on.' : 'Normal mode.'}`;
    }
    else if (cmd === "exit") {
      response = "Exiting navigation.";
      setTimeout(onBack, 1500);
    }
    else if (cmd === "mute" || cmd === "quiet") {
      window.speechSynthesis.cancel();
      return;
    }
    else if (cmd === "yes" || cmd === "ok" || cmd === "correct") {
      response = "Confirmed.";
    }
    else if (cmd === "no" || cmd === "cancel") {
      response = "Cancelled.";
    }

    // --- QR & Indoor Mode Commands ---
    else if (cmd.includes("scan qr code")) response = "Scanning for QR code now.";
    else if (cmd.includes("start indoor mode")) response = "Indoor navigation activated.";
    else if (cmd.includes("exit indoor mode")) {
      response = "Indoor mode stopped.";
      setTimeout(onBack, 2000); // Actually exit
    }
    else if (cmd.includes("did you find a qr code")) response = "No QR code found. Please move the camera.";
    else if (cmd.includes("next location")) response = "Proceed to the next marker.";

    // --- Emergency & Safety Commands ---
    else if (cmd.includes("help") || cmd.includes("sos")) {
      response = "Emergency mode activated. Alert sent.";
      speak(response, true);
      setFeedbackMessage("EMERGENCY ALERT SENT");
      // Keep the alert visible longer
      setTimeout(() => setFeedbackMessage(null), 8000);
      return; // Skip default speak/timeout
    }
    else if (cmd.includes("call caregiver")) response = "Calling your caregiver.";
    else if (cmd.includes("i am lost")) response = "Stay calm. I will guide you.";
    else if (cmd.includes("stop everything")) response = "All actions stopped.";
    else if (cmd.includes("cancel emergency")) {
      response = "Emergency cancelled.";
      speak(response);
      setFeedbackMessage("Emergency Cancelled");
    }

    // --- Greeting & Goodbye ---
    else if (cmd.includes("hello") || cmd.includes("hi")) {
      response = "Hello. I am your SafePath assistant. I am listening for your commands.";
    }
    else if (cmd.includes("goodbye") || cmd.includes("bye")) {
      response = "Goodbye. Navigation stopped.";
      setTimeout(onBack, 2000);
    }

    else {
      // Fallback for ANY unknown command
      response = "I did not understand that command, please say it again clearly.";
    }

    setFeedbackMessage(response);
    speak(response);
    // Clear visual feedback after a delay
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  const noQrCountRef = useRef(0);
  const lastNoQrAlertTimeRef = useRef(0);

  // Continuous Scanning Loop
  const tick = () => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.height = video.videoHeight;
          canvas.width = video.videoWidth;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });

          if (code && code.data) {
            noQrCountRef.current = 0; // Reset count
            handleScan(code.data);
          } else {
            // No QR Found Logic
            noQrCountRef.current += 1;

            // Threshold: approx 300 frames @ 30fps = 10 seconds. 
            // Using 300 checks for demo purposes
            if (noQrCountRef.current > 300) {
              const now = Date.now();
              // Cooldown of 15 seconds between alerts
              if (now - lastNoQrAlertTimeRef.current > 15000 && !currentLocation) {
                lastNoQrAlertTimeRef.current = now;
                speak("No QR code found. Please point the camera toward a QR marker.", true);
                setFeedbackMessage("Scan a QR Marker");
                setTimeout(() => setFeedbackMessage(null), 3000);
              }
              noQrCountRef.current = 0; // Reset to avoid double trigger
            }
          }
        }
      }
    }
    rafRef.current = requestAnimationFrame(tick);
  };

  const handleScan = (data: string) => {
    resetInactivityTimer();
    if (data === lastScannedId) return;

    let node = INDOOR_MAP[data];
    if (!node) {
      if (!currentLocation) node = INDOOR_MAP['safe-entry'];
      else if (currentLocation.nextId) node = INDOOR_MAP[currentLocation.nextId];
    }

    if (node) {
      setLastScannedId(data);
      setCurrentLocation(node);
      setInstruction(node.instruction);
      speak(`${node.name}. ${node.voiceInstruction}`);
    }
  };

  const simulateObjectDetection = () => {
    if (Math.random() > 0.7) {
      const possibleObjects: Omit<DetectedObject, 'id'>[] = [
        { label: 'Wet Floor', x: 20, y: 80, width: 20, height: 10, distance: 1.5, type: 'WARNING' },
        { label: 'Obstacle', x: 80, y: 60, width: 15, height: 20, distance: 2.0, type: 'WARNING' },
      ];
      const randomObject = possibleObjects[Math.floor(Math.random() * possibleObjects.length)];
      setDetectedObjects(prev => [{ ...randomObject, id: Date.now() }]);

      if (randomObject.type === 'DANGER') {
        speak(`Caution. ${randomObject.label} detected ahead.`, true);
      }
    } else {
      setDetectedObjects([]);
    }
  };

  const repeatInstruction = () => {
    speak(currentLocation ? currentLocation.voiceInstruction : "Scan a QR code to begin navigation.");
  };

  return (
    <div className="h-full bg-black text-white relative overflow-hidden flex flex-col">
      <canvas ref={canvasRef} className="hidden" />

      {/* Top HUD */}
      <div className="absolute top-0 left-0 right-0 p-6 z-20 flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent">
        <div>
          <div className="flex items-center space-x-2">
            <span className={`w-2 h-2 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></span>
            <span className="text-xs font-black uppercase tracking-widest text-slate-300">
              {isListening ? 'Listening...' : 'Live Navigation'}
            </span>
          </div>
          <h2 className="text-2xl font-black drop-shadow-md mt-1">
            {currentLocation ? currentLocation.name : 'Locating...'}
          </h2>
        </div>
      </div>

      {/* Feedback Overlay - Enhanced Visuals */}
      {feedbackMessage && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-8 bg-black/60 backdrop-blur-sm transition-all animate-fade-in-up">
          <div className={`
                p-8 rounded-[2rem] shadow-2xl border-4 text-center transform transition-transform scale-110
                flex flex-col items-center gap-4 max-w-sm w-full
                ${feedbackMessage.toLowerCase().includes('caregiver') || feedbackMessage.toLowerCase().includes('stop')
              ? 'bg-red-600 border-red-400 text-white animate-pulse'
              : 'bg-blue-600 border-blue-400 text-white'}
              `}>
            {/* Icon */}
            <div className="bg-white/20 p-4 rounded-full">
              {(feedbackMessage.toLowerCase().includes('caregiver') || feedbackMessage.toLowerCase().includes('stop')) ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-widest opacity-80 mb-1">
                {feedbackMessage.toLowerCase().includes('caregiver') ? 'Incoming Alert' : 'Command Received'}
              </p>
              <h3 className="text-2xl font-black leading-tight">
                {feedbackMessage.replace('Caregiver says: ', '')}
              </h3>
            </div>
          </div>
        </div>
      )}

      {/* Main Viewport */}
      <div className="relative flex-1 overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover opacity-90"
        />

        {/* AR Overlays */}
        {detectedObjects.map(obj => (
          <div key={obj.id}
            className={`absolute border-2 rounded-lg flex flex-col items-center justify-center
                    ${obj.type === 'DANGER' ? 'border-red-500 bg-red-500/10' : 'border-amber-400 bg-amber-400/10'}
                `}
            style={{
              left: `${obj.x}%`, top: `${obj.y}%`,
              width: `${obj.width}%`, height: `${obj.height}%`,
              transition: 'all 0.5s ease-out'
            }}
          >
            <span className={`px-2 py-1 text-[10px] font-black uppercase rounded mb-auto -mt-3
                    ${obj.type === 'DANGER' ? 'bg-red-600 text-white' : 'bg-amber-400 text-black'}
                 `}>
              {obj.label}
            </span>
          </div>
        ))}

        {currentLocation && currentLocation.nextId && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-60 pointer-events-none">
            <div className="animate-bounce">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-32 w-32 text-white drop-shadow-[0_0_25px_rgba(59,130,246,0.8)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            </div>
          </div>
        )}

        {!currentLocation && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-64 h-64 border-2 border-white/50 rounded-3xl relative">
              <div className="absolute inset-0 border-2 border-blue-500 rounded-3xl animate-pulse"></div>
              <div className="absolute left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent shadow-[0_0_15px_#3b82f6] animate-scan z-10"></div>
              <p className="absolute -bottom-8 w-full text-center font-bold text-blue-200">Scan QR Code</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer / Instructions */}
      <div className="bg-slate-900 border-t border-slate-800 p-6 space-y-4">
        <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/10 flex items-center space-x-4">
          <div className="bg-blue-600 w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-lg shadow-blue-600/30">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
            </svg>
          </div>
          <div>
            <span className="block text-xs font-bold text-blue-400 uppercase tracking-wider">Next Step</span>
            <span className="block text-lg font-bold leading-tight">{instruction}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={repeatInstruction}
            className="py-4 bg-slate-700 text-white rounded-xl font-bold active:scale-95 transition-transform"
          >
            Repeat Voice
          </button>
          <button
            onClick={() => {
              if (isListening) {
                if (recognitionRef.current) {
                  recognitionRef.current.stop();
                  setIsListening(false);
                }
              } else {
                setupVoiceRecognition();
              }
            }}
            className={`py-4 rounded-xl font-bold active:scale-95 transition-all flex items-center justify-center gap-2
                ${isListening ? 'bg-red-600 text-white animate-pulse' : 'bg-slate-700 text-white'}
            `}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
            </svg>
            {isListening ? 'Listening' : 'Voice Cmd'}
          </button>
        </div>

        <button
          onClick={onBack}
          className="w-full py-4 bg-slate-800 text-slate-300 font-bold rounded-xl active:scale-95 transition-all hover:bg-slate-700"
        >
          End Navigation
        </button>
      </div>

    </div>
  );
};

export default IndoorNavigation;
