
import React, { useState, useEffect, useRef } from 'react';
import { Coordinates } from '../types';
import { NotificationService } from '../services/NotificationService';
import { AgoraService } from '../services/AgoraService';

interface EmergencyHUDProps {
  onCancel: () => void;
  currentLocation: Coordinates | null;
}

const EmergencyHUD: React.FC<EmergencyHUDProps> = ({ onCancel, currentLocation }) => {
  const [countdown, setCountdown] = useState(5);
  const [isTriggered, setIsTriggered] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle');
  const [callStatus, setCallStatus] = useState<string>('Initializing Voice...');

  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const lfoRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Initialize Audio Context for the alert sound
  useEffect(() => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        audioContextRef.current = new AudioContext();
      }
    } catch (e) {
      console.error("Audio API not supported", e);
    }

    return () => {
      stopAlertSound();
      AgoraService.endCall(); // Ensure call ends on unmount
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Handle Mute Toggling - Update Gain immediately if running
  useEffect(() => {
    if (gainNodeRef.current && audioContextRef.current) {
      const now = audioContextRef.current.currentTime;
      // Smooth transition
      gainNodeRef.current.gain.cancelScheduledValues(now);
      gainNodeRef.current.gain.linearRampToValueAtTime(isMuted ? 0 : 0.5, now + 0.1);
    }
  }, [isMuted]);

  // Countdown logic
  useEffect(() => {
    if (countdown > 0 && !isTriggered) {
      playBeep();
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && !isTriggered) {
      triggerEmergency();
    }
  }, [countdown, isTriggered]);

  const playBeep = () => {
    if (!audioContextRef.current || isMuted) return;

    const oscillator = audioContextRef.current.createOscillator();
    const gainNode = audioContextRef.current.createGain();

    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(880, audioContextRef.current.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(440, audioContextRef.current.currentTime + 0.5);

    gainNode.gain.setValueAtTime(0.5, audioContextRef.current.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.5);

    oscillator.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);

    oscillator.start();
    oscillator.stop(audioContextRef.current.currentTime + 0.5);
  };

  const startContinuousAlarm = () => {
    if (!audioContextRef.current) return;

    // Stop any existing sound
    stopAlertSound();

    const now = audioContextRef.current.currentTime;

    // Main Tone
    const oscillator = audioContextRef.current.createOscillator();
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(600, now); // Base frequency

    // LFO for Siren Effect (Modulates frequency)
    const lfo = audioContextRef.current.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(2, now); // 2Hz siren cycle

    const lfoGain = audioContextRef.current.createGain();
    lfoGain.gain.setValueAtTime(200, now); // Modulate by +/- 200Hz

    lfo.connect(lfoGain);
    lfoGain.connect(oscillator.frequency);

    // Master Volume
    const gainNode = audioContextRef.current.createGain();
    gainNode.gain.setValueAtTime(isMuted ? 0 : 0.5, now);

    oscillator.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);

    oscillator.start();
    lfo.start();

    oscillatorRef.current = oscillator;
    lfoRef.current = lfo;
    gainNodeRef.current = gainNode;
  };

  const stopAlertSound = () => {
    if (oscillatorRef.current) {
      oscillatorRef.current.stop();
      oscillatorRef.current.disconnect();
    }
    if (lfoRef.current) {
      lfoRef.current.stop();
      lfoRef.current.disconnect();
    }
    oscillatorRef.current = null;
    lfoRef.current = null;
    gainNodeRef.current = null;
  };

  const triggerEmergency = () => {
    setIsTriggered(true);
    startContinuousAlarm();

    const locationStr = currentLocation ? `at ${currentLocation.lat.toFixed(5)}, ${currentLocation.lng.toFixed(5)}` : "unknown location";
    console.log(`EMERGENCY TRIGGERED: Sending coordinates ${locationStr} to Caregiver (Mom)...`);

    // ALERT: EMAIL INTEGRATION
    setEmailStatus('sending');
    NotificationService.sendEmergencyEmail({
      recipient: 'caregiver@example.com',
      subject: 'URGENT: SafePath Emergency Alert',
      body: `Use has triggered an emergency alert ${locationStr}. Immediate assistance required.`,
      timestamp: new Date().toLocaleTimeString(),
      location: currentLocation
    }).then(() => {
      setEmailStatus('sent');
    }).catch(() => {
      setEmailStatus('failed');
    });

    // ALERT: AGORA VOICE CALL
    setCallStatus("Starting Voice Channel...");
    AgoraService.startCall((status) => {
      setCallStatus(status);
    });

    const msg = new SpeechSynthesisUtterance("Stay calm, help is on the way. Voice channel opening.");
    msg.rate = 0.9;
    window.speechSynthesis.speak(msg);
  };

  const handleCancel = () => {
    stopAlertSound();
    AgoraService.endCall();
    onCancel();
  };

  return (
    <div className={`min-h-full flex flex-col p-6 space-y-6 transition-colors duration-500 ${isTriggered ? 'bg-red-600' : 'bg-red-500'}`}>

      {/* Header Area */}
      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 w-full max-w-md mx-auto relative">

        {!isTriggered ? (
          // Pre-Trigger State
          <>
            <div className="relative">
              <div className="absolute inset-0 bg-red-400 rounded-full animate-ping opacity-75"></div>
              <div className="relative w-56 h-56 rounded-full bg-white text-red-600 flex items-center justify-center shadow-2xl border-8 border-red-200">
                <span className="text-9xl font-black tabular-nums tracking-tighter">{countdown}</span>
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-4xl font-black text-white uppercase tracking-widest animate-pulse">Emergency Alert</h2>
              <p className="text-xl text-red-100 font-medium">Sending alert in {countdown} seconds...</p>
            </div>

            {/* Pre-trigger Mute Option */}
            <button
              onClick={() => setIsMuted(m => !m)}
              className="flex items-center space-x-2 bg-black/20 px-4 py-2 rounded-full text-white/80 hover:bg-black/30 transition-colors"
            >
              {isMuted ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                  <span className="text-sm font-bold">Sound OFF</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                  <span className="text-sm font-bold">Sound ON</span>
                </>
              )}
            </button>


            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 w-full border border-white/20">
              <div className="flex items-center justify-between text-white/90 mb-2">
                <span className="text-sm font-bold uppercase tracking-wider">Target</span>
                <span className="text-sm font-bold">Mom (Caregiver)</span>
              </div>
              <div className="h-px bg-white/20 my-2"></div>
              <div className="flex items-center justify-between text-white/90">
                <span className="text-sm font-bold uppercase tracking-wider">Data</span>
                <span className="text-xs font-mono">GPS • CAMERA • MIC</span>
              </div>
            </div>

            <button
              onClick={handleCancel}
              className="w-full bg-white text-red-600 py-6 rounded-2xl text-3xl font-black uppercase tracking-widest shadow-[0_10px_20px_rgba(0,0,0,0.2)] hover:bg-gray-50 active:scale-95 transition-all"
            >
              Cancel
            </button>
          </>
        ) : (
          // Triggered State
          <>
            {/* Status Top Bar including Mute */}
            <div className="w-full flex justify-between absolute top-0 left-0 right-0 px-2">
              {/* Call Status Badge */}
              <div className="flex items-center space-x-2 px-4 py-2 rounded-full bg-black/40 backdrop-blur border border-white/20">
                <div className={`w-2 h-2 rounded-full animate-pulse ${callStatus.includes('Connected') ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
                <span className="text-white text-xs font-bold uppercase truncate max-w-[150px]">{callStatus}</span>
              </div>

              <button
                onClick={() => setIsMuted(m => !m)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all border ${isMuted ? 'bg-gray-800/50 text-white/50 border-gray-600' : 'bg-white text-red-600 border-white shadow-lg animate-pulse'}`}
              >
                {isMuted ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    <span className="text-sm font-bold">Sound OFF</span>
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    <span className="text-sm font-bold">Sound ON</span>
                  </>
                )}
              </button>
            </div>

            <div className="bg-white/10 p-6 rounded-full animate-pulse border-4 border-white/30 mt-8">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            <div className="space-y-2">
              <h2 className="text-5xl font-black text-white uppercase tracking-tight">Help is on the way</h2>
              <p className="text-2xl text-red-100 font-medium">Stay calm.</p>
            </div>

            {/* Status Cards */}
            <div className="grid grid-cols-2 gap-4 w-full text-left">
              <div className="bg-red-800/40 p-4 rounded-xl border border-red-400/30 backdrop-blur-sm">
                <div className="flex items-center space-x-2 text-red-200 mb-1">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                  <span className="text-xs font-bold uppercase">GPS Location</span>
                </div>
                <div className="text-white font-mono text-lg font-bold truncate">
                  {currentLocation ? `${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}` : "Locating..."}
                </div>
              </div>

              <div className="bg-red-800/40 p-4 rounded-xl border border-red-400/30 backdrop-blur-sm">
                <div className="flex items-center space-x-2 text-red-200 mb-1">
                  <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></div>
                  <span className="text-xs font-bold uppercase">Voice Channel</span>
                </div>
                <div className="text-white font-semibold text-lg animate-pulse">
                  {callStatus}
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-white rounded-2xl p-5 w-full flex items-center space-x-4 shadow-lg">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-gray-500 text-xs font-bold uppercase">Emergency Contact</p>
                <p className="text-gray-900 text-xl font-bold">Mom</p>
                {emailStatus === 'sent' && <p className="text-[10px] text-green-600 font-bold">✓ Email Notification Sent</p>}
              </div>
              <div className="ml-auto flex flex-col items-end gap-1">
                {/* Email Status Pill */}
                {emailStatus === 'sending' && (
                  <span className="text-amber-600 text-[10px] font-bold bg-amber-100 px-2 py-1 rounded animate-pulse">Emailing...</span>
                )}
                {emailStatus === 'sent' && (
                  <span className="text-green-600 text-[10px] font-bold bg-green-100 px-2 py-1 rounded">Notified</span>
                )}
                {emailStatus === 'failed' && (
                  <span className="text-red-600 text-[10px] font-bold bg-red-100 px-2 py-1 rounded">Failed</span>
                )}
                {emailStatus === 'idle' && (
                  <span className="text-gray-400 text-[10px] font-bold bg-gray-100 px-2 py-1 rounded">Pending</span>
                )}

                {/* Voice Status Pill */}
                {callStatus && (
                  <span className="text-blue-600 text-[10px] font-bold bg-blue-100 px-2 py-1 rounded flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping"></span>
                    Voice Active
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={handleCancel}
              className="w-full bg-red-800 text-red-100 py-6 rounded-2xl text-xl font-bold border-2 border-red-700/50 hover:bg-red-900 active:scale-95 transition-all mt-4"
            >
              Safe now? End Call & Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default EmergencyHUD;
