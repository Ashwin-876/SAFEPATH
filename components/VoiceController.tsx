
import React, { useState, useEffect, useCallback } from 'react';

interface VoiceControllerProps {
  onCommand?: (command: string) => void;
  isNavMode?: boolean;
  isExternalControlled?: boolean;
  isListening?: boolean;
  onToggle?: () => void;
}

const VoiceController: React.FC<VoiceControllerProps> = ({
  isNavMode,
  isListening,
  onToggle
}) => {
  const toggleListening = () => {
    if (window.navigator.vibrate) window.navigator.vibrate(50);
    onToggle?.();
  };

  return (
    <div className={`fixed bottom-6 left-6 z-50`}>
      <button
        onClick={toggleListening}
        className={`w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition-all transform active:scale-90 border-[4px] border-white ${isListening ? 'bg-red-600 animate-pulse shadow-[0_0_30px_rgba(220,38,38,0.5)]' : 'bg-[#1e293b]'
          }`}
        aria-label={isListening ? 'Stop listening' : 'Voice command'}
      >
        {isListening ? (
          <div className="flex items-center space-x-1">
            <div className="w-1.5 h-6 bg-white animate-[bounce_1s_infinite_0ms]"></div>
            <div className="w-1.5 h-10 bg-white animate-[bounce_1s_infinite_200ms]"></div>
            <div className="w-1.5 h-6 bg-white animate-[bounce_1s_infinite_400ms]"></div>
          </div>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        )}
      </button>
      {isListening && (
        <div className="absolute left-24 bottom-6 bg-slate-800 text-white px-5 py-3 rounded-2xl text-xl font-bold whitespace-nowrap shadow-2xl border border-white/20 animate-in fade-in slide-in-from-left-4">
          Listening...
        </div>
      )}
    </div>
  );
};

export default VoiceController;
