
import React from 'react';
import { NavState } from '../types';

interface HeaderProps {
  currentState: NavState;
  onNavigate: (state: NavState) => void;
}

const Header: React.FC<HeaderProps> = ({ currentState, onNavigate }) => {
  return (
    <header className="bg-blue-800 text-white p-4 shadow-md flex items-center justify-between z-30">
      <div className="flex items-center space-x-3">
        <div className="bg-white p-2 rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">SafePath AI</h1>
      </div>

      <nav className="hidden md:flex space-x-2">
        {Object.values(NavState).map((state) => (
          <button
            key={state}
            onClick={() => onNavigate(state)}
            className={`px-4 py-2 rounded-md font-semibold transition-colors uppercase ${currentState === state
                ? (state === NavState.EMERGENCY ? 'bg-red-600 text-white' : 'bg-white text-blue-800')
                : (state === NavState.EMERGENCY ? 'text-red-200 hover:text-white hover:bg-red-600' : 'hover:bg-blue-700')
              }`}
          >
            {state}
          </button>
        ))}
      </nav>

      <button
        onClick={() => onNavigate(NavState.SETTINGS)}
        className="p-2 rounded-full hover:bg-blue-700 transition-colors"
        aria-label="Settings"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
    </header>
  );
};

export default Header;
