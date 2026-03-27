export interface Gummy {
  id: string;
  label: string;
  color: string;
  orbitRadius: number;
  orbitSpeed: number; // radians per second
  angle: number;
  size: number; // radius in px
  x: number;
  y: number;
  // Drag state
  isDragging: boolean;
  dragOffsetX: number;
  dragOffsetY: number;
  // Animation state
  opacity: number;
  scale: number;
  // Dismiss/catch flight
  state: 'orbiting' | 'caught' | 'dismissed' | 'dead';
  flightX: number;
  flightY: number;
  flightProgress: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  radius: number;
  life: number;
  maxLife: number;
}

export type BotMode = 'idle' | 'thinking' | 'working' | 'celebrating';

export interface BotState {
  x: number;
  y: number;
  radius: number;
  breathPhase: number;
  catchFlash: number;
  catchColor: string;
  squishX: number;
  squishY: number;
  mode: BotMode;
  modeTimer: number; // seconds in current mode
  spinAngle: number;
  celebrateTimer: number;
  sparkles: Array<{ angle: number; dist: number; size: number; speed: number }>;
}

export interface DoneOverlay {
  text: string;
  x: number;
  y: number;
  life: number;
  maxLife: number;
  color: string;
}

export interface PlayerStats {
  xp: number;
  level: number;
  progress: number;
  streak: number;
  combo: number;
  multiplier: number;
  xpGained: number;
  xpGainedTimer: number;
  leveledUp: boolean;
  levelUpTimer: number;
}

export interface GameState {
  bot: BotState;
  gummies: Gummy[];
  particles: Particle[];
  doneOverlays: DoneOverlay[];
  dragTarget: string | null;
  mouseX: number;
  mouseY: number;
  width: number;
  height: number;
  connected: boolean;
  stats: PlayerStats;
  onCatch?: (gummyId: string) => void;
  onPopSound?: (pitch: number) => void;
  onDismissSound?: () => void;
}
