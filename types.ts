
export enum NavState {
  HOME = 'HOME',
  PLANNING = 'PLANNING',
  NAVIGATING = 'NAVIGATING',
  EMERGENCY = 'EMERGENCY',
  CAREGIVER = 'CAREGIVER',
  SETTINGS = 'SETTINGS',
  COMMUNITY = 'COMMUNITY',
  INDOOR = 'INDOOR'
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface LocationRecord extends Coordinates {
  timestamp: number;
  accuracy: number;
}

export interface Route {
  id: string;
  name: string;
  distance: string;
  duration: string;
  accessibilityScore: number;
  steps: string[];
}

export interface DetectionResult {
  label: string;
  distance: number;
  direction: 'left' | 'center' | 'right';
  severity: 'low' | 'medium' | 'high';
}

export interface UserPreferences {
  avoidStairs: boolean;
  walkingSpeed: 'slow' | 'normal' | 'fast';
  audioFeedbackLevel: 'low' | 'medium' | 'high';
  language: string;
  routePreference: 'shortest' | 'safest' | 'accessible';
  obstacleSensitivity: 'low' | 'medium' | 'high';
  voiceSpeed: 'slow' | 'normal' | 'fast';
  vibrationFeedback: boolean;
  mapStyle: 'standard' | 'satellite' | 'high-contrast';
  darkMode: boolean;
  notificationsEnabled: boolean;
}
