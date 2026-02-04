
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { analyzeScene, askGeminiAboutImage, DetailedAnalysis } from '../services/gemini';
import { detectObjectsBytez } from '../services/bytez';
import { spatialAudio } from '../services/spatialAudio';
import { UserPreferences } from '../types';

interface CameraAssistantProps {
  onStop: () => void;
  preferences: UserPreferences;
}

const CameraAssistant: React.FC<CameraAssistantProps> = ({ onStop, preferences }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [detections, setDetections] = useState<DetailedAnalysis['objects']>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [instruction, setInstruction] = useState("Initializing SafePath...");
  const [lowLightWarning, setLowLightWarning] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  // Track last spoken alert to prevent repetition
  const lastSpokenRef = useRef<{ text: string, time: number } | null>(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Camera access failed:", err);
        setInstruction("CAMERA ERROR");
      }
    };
    startCamera();

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recog = new SpeechRecognition();
      recog.continuous = false;
      recog.interimResults = false;
      recog.lang = 'en-US';

      recog.onresult = async (event: any) => {
        const query = event.results[0][0].transcript;
        processUserQuestion(query);
      };

      recog.onend = () => setIsListening(false);
      recog.onerror = () => setIsListening(false);

      setRecognition(recog);
    }

    return () => {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const processUserQuestion = async (query: string) => {
    if (!videoRef.current) return;
    setInstruction(`Searching for: ${query}`);
    spatialAudio.speak("Checking surroundings...");

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx && canvas.width > 0) {
      ctx.drawImage(videoRef.current, 0, 0);
      const base64 = canvas.toDataURL('image/jpeg', 0.6).split(',')[1];
      const answer = await askGeminiAboutImage(base64, query);
      setInstruction(answer || "No info.");
      spatialAudio.speak(answer || "I don't see that here.");
    }
  };

  const describeCurrentScene = useCallback(async () => {
    if (videoRef.current && !isAnalyzing) {
      setIsAnalyzing(true);
      setInstruction("Scanning environment...");

      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx && canvas.width > 0) {
        ctx.drawImage(videoRef.current, 0, 0);
        const base64 = canvas.toDataURL('image/jpeg', 0.6).split(',')[1];
        const data = await analyzeScene(base64);
        if (data) {
          setDetections(data.objects);
          setInstruction(data.sceneSummary);
          spatialAudio.speak(data.sceneSummary);
        }
      }
      setIsAnalyzing(false);
    }
  }, [isAnalyzing]);

  // Main Detection Loop (Hybrid: Bytez Fast Scan)
  useEffect(() => {
    const interval = setInterval(async () => {
      if (videoRef.current && !isAnalyzing && !isListening) {

        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');

        if (ctx && canvas.width > 0) {
          ctx.drawImage(videoRef.current, 0, 0);

          // 1. Low Light Check
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          let brightness = 0;
          for (let i = 0; i < imageData.data.length; i += 4) {
            brightness += (imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2]) / 3;
          }
          brightness /= (canvas.width * canvas.height);
          setLowLightWarning(brightness < 30);

          // 2. Fast Detection using Bytez
          const imageInput = canvas.toDataURL('image/jpeg', 0.5);

          try {
            const results = await detectObjectsBytez(imageInput);

            // 3. Map Bytez Results to SafePath DetailedAnalysis format
            const mappedObjects: DetailedAnalysis['objects'] = results.map(r => {
              const isNormalized = r.box.xmax <= 1.0;
              const width = isNormalized ? 1.0 : canvas.width;

              const centerX = (r.box.xmin + r.box.xmax) / 2;
              const ratio = centerX / width;

              let direction: 'left' | 'center' | 'right' = 'center';
              if (ratio < 0.33) direction = 'left';
              else if (ratio > 0.66) direction = 'right';

              const highSeverity = ['car', 'truck', 'bus', 'train', 'fire', 'person'];
              const mediumSeverity = ['bicycle', 'motorcycle', 'dog', 'chair', 'couch', 'tv'];
              let severity: 'low' | 'medium' | 'high' = 'low';
              if (highSeverity.includes(r.label.toLowerCase())) severity = 'high';
              else if (mediumSeverity.includes(r.label.toLowerCase())) severity = 'medium';

              const boxArea = (r.box.xmax - r.box.xmin) * (r.box.ymax - r.box.ymin);
              const imgArea = isNormalized ? 1.0 : (canvas.width * canvas.height);
              const coverage = boxArea / imgArea;

              const proximity: 'near' | 'far' = coverage > 0.15 ? 'near' : 'far';
              const distanceStr = coverage > 0.3 ? '<1m' : coverage > 0.1 ? '2m' : '>3m';

              return {
                label: r.label,
                direction,
                proximity,
                severity,
                distance: distanceStr
              };
            });

            // 4. Update State & Feedback
            if (mappedObjects.length > 0) {
              setDetections(mappedObjects);

              const critical = mappedObjects.find(o => o.severity === 'high' && o.proximity === 'near');
              const now = Date.now();

              if (critical) {
                const feedback = `${critical.label} ahead!`;

                // Debounce Check: Don't repeat same critical alert within 8 seconds
                const shouldSpeak = !lastSpokenRef.current ||
                  lastSpokenRef.current.text !== feedback ||
                  (now - lastSpokenRef.current.time > 8000);

                if (shouldSpeak && !window.speechSynthesis.speaking) {
                  setInstruction(feedback.toUpperCase());
                  const pan = critical.direction === 'left' ? -1 : critical.direction === 'right' ? 1 : 0;
                  spatialAudio.playDirectionalPing(pan);
                  spatialAudio.speak(feedback, pan);
                  lastSpokenRef.current = { text: feedback, time: now };
                }
              } else if (!window.speechSynthesis.speaking && Math.random() > 0.85) {
                // Occasional update
                setInstruction(`${mappedObjects[0].label.toUpperCase()} DETECTED`);
              }
            } else {
              setDetections([]);
              setInstruction("PATH CLEAR");
              // Reset debounce if path is clear for a while
              if (lastSpokenRef.current && (Date.now() - lastSpokenRef.current.time > 5000)) {
                lastSpokenRef.current = null;
              }
            }

          } catch (e) {
            // console.warn("Detection skipped", e);
          }
        }
      }
    }, 1500); // 1.5s Interval

    return () => clearInterval(interval);
  }, [isAnalyzing, isListening]);

  const handleMicAction = useCallback(() => {
    if (!recognition || isListening) return;
    spatialAudio.playDirectionalPing(0);
    if (window.navigator.vibrate) window.navigator.vibrate(50);
    try {
      recognition.start();
      setIsListening(true);
      setInstruction("LISTENING...");
    } catch (e) {
      console.error("Mic error", e);
    }
  }, [recognition, isListening]);

  useEffect(() => {
    let frameId: number;
    const draw = () => {
      if (!canvasRef.current || !videoRef.current) return;
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;

      const w = canvasRef.current.width = videoRef.current.clientWidth;
      const h = canvasRef.current.height = videoRef.current.clientHeight;
      ctx.clearRect(0, 0, w, h);

      const time = Date.now() / 1000;

      detections.forEach((d) => {
        const x = d.direction === 'left' ? w * 0.25 : d.direction === 'right' ? w * 0.75 : w * 0.5;
        const y = h * 0.55;

        let color = '#3b82f6'; // Low (Blue)
        let speed = 4;
        let intensity = 0.4;

        if (d.severity === 'high') {
          color = '#ef4444'; // High (Red)
          speed = 12;
          intensity = 0.9;
        } else if (d.severity === 'medium') {
          color = '#f59e0b'; // Medium (Amber)
          speed = 7;
          intensity = 0.6;
        }

        const isNear = d.proximity === 'near';
        const baseSize = isNear ? 110 : 70;
        const pulse = Math.sin(time * speed) * (isNear ? 12 : 6);
        const radius = baseSize + pulse;

        // Ground Ellipse
        ctx.save();
        ctx.translate(x, y + 140);
        ctx.scale(1, 0.2);
        ctx.beginPath();
        ctx.arc(0, 0, radius + 40, 0, Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = isNear ? 10 : 4;
        ctx.stroke();
        ctx.restore();

        // Main Marker
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.strokeStyle = 'white';
        ctx.lineWidth = isNear ? 10 : 5;
        ctx.stroke();

        const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
        grad.addColorStop(0, `${color}${Math.floor(intensity * 255).toString(16).padStart(2, '0')}`);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fill();

        // Label HUD
        ctx.save();
        const label = d.label.toUpperCase();
        ctx.font = `black ${isNear ? 32 : 24}px Inter`;
        const tw = ctx.measureText(label).width + 60;

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(x - tw / 2, y - (isNear ? 170 : 130), tw, isNear ? 65 : 45, 15);
        ctx.fill();

        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText(label, x, y - (isNear ? 122 : 95));
        ctx.restore();
      });

      // Central Path Vector (Visual Gimmick)
      ctx.beginPath();
      ctx.setLineDash([20, 15]);
      ctx.moveTo(w / 2, h * 0.45);
      ctx.lineTo(w / 2, h * 0.9);
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
      ctx.lineWidth = 15;
      ctx.stroke();
      ctx.setLineDash([]);

      frameId = requestAnimationFrame(draw);
    };

    frameId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameId);
  }, [detections]);

  return (
    <div className="relative h-full bg-black overflow-hidden flex flex-col font-sans">
      <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-10" />

      {/* Critical Alarm Border */}
      {detections.some(d => d.severity === 'high' && d.proximity === 'near') && (
        <div className="absolute inset-0 border-[20px] border-red-600/40 animate-pulse pointer-events-none z-40" />
      )}

      {/* Tactical Header Banner */}
      <div className="relative z-30 p-8 pt-12">
        <div className={`transition-all duration-300 rounded-[3rem] p-8 border-4 shadow-2xl flex items-center space-x-6 ${detections.some(d => d.severity === 'high' && d.proximity === 'near' && d.direction === 'center')
          ? 'bg-red-800 border-white scale-105 shadow-[0_0_50px_rgba(239,68,68,0.4)]'
          : isListening
            ? 'bg-blue-600 border-white'
            : 'bg-black/90 backdrop-blur-3xl border-white/20'
          }`}>
          <div className="flex-1">
            <p className="text-4xl font-black text-white leading-tight tracking-tight uppercase italic text-center drop-shadow-2xl">
              {instruction}
            </p>
          </div>
        </div>
      </div>

      {/* Visibility Check */}
      {lowLightWarning && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none bg-red-950/20 backdrop-blur-sm">
          <div className="bg-black/95 p-10 rounded-[3rem] border-4 border-red-500 shadow-2xl text-center space-y-4">
            <div className="w-16 h-16 bg-red-500 rounded-full mx-auto animate-bounce flex items-center justify-center">
              <span className="text-white text-3xl font-black">!</span>
            </div>
            <p className="text-white text-2xl font-black uppercase italic">Low Light Signal</p>
          </div>
        </div>
      )}

      {/* Controller Strip */}
      <div className="mt-auto relative z-30 p-10 flex items-end justify-between pointer-events-none pb-16">
        <div className="flex flex-col space-y-6">
          <button
            onClick={describeCurrentScene}
            disabled={isAnalyzing}
            className="w-24 h-24 rounded-3xl bg-blue-700 text-white shadow-2xl border-4 border-white/30 flex items-center justify-center pointer-events-auto active:scale-90 hover:bg-blue-800 disabled:opacity-50 transition-all"
            aria-label="Scene Scan"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </button>

          <button
            onClick={handleMicAction}
            className={`w-40 h-40 rounded-full shadow-[0_30px_60px_rgba(0,0,0,0.8)] border-[10px] flex items-center justify-center pointer-events-auto transition-all active:scale-90 ${isListening
              ? 'bg-white text-blue-600 border-blue-600'
              : 'bg-slate-900 text-white border-white/20'
              }`}
            aria-label="Mic Input"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </button>
        </div>

        <button
          onClick={onStop}
          className="w-36 h-36 bg-[#ef4444] text-white rounded-full shadow-[0_30px_60px_rgba(239,68,68,0.5)] border-[10px] border-white/40 flex items-center justify-center pointer-events-auto active:scale-90 transition-all hover:bg-red-700"
          aria-label="Exit Navigation"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={6} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Removed the bottom text footer as requested */}
    </div>
  );
};

export default CameraAssistant;
