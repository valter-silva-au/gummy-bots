import type { GameState, Gummy } from './types';

const GRAVITY_WELL = 120;
const CATCH_RADIUS = 85;
const VELOCITY_CATCH_THRESHOLD = 8; // px/frame equivalent
const PARTICLE_COUNT = 18;

export function update(state: GameState, dt: number) {
  updateBot(state, dt);
  updateGummies(state, dt);
  updateParticles(state, dt);
  updateDoneOverlays(state, dt);
  updateStats(state, dt);
}

function updateStats(state: GameState, dt: number) {
  if (state.stats.xpGainedTimer > 0) {
    state.stats.xpGainedTimer -= dt;
  }
  if (state.stats.levelUpTimer > 0) {
    state.stats.levelUpTimer -= dt;
  }
}

function updateBot(state: GameState, dt: number) {
  const bot = state.bot;
  bot.modeTimer += dt;

  // Breathing speed varies by mode
  const breathSpeeds: Record<string, number> = { idle: 1.5, thinking: 3, working: 2.5, celebrating: 4 };
  bot.breathPhase += dt * (breathSpeeds[bot.mode] || 1.5);

  // Spin (for working mode)
  if (bot.mode === 'working') {
    bot.spinAngle += dt * 3;
  } else {
    bot.spinAngle *= 0.95;
  }

  // Celebrate timer
  if (bot.mode === 'celebrating') {
    bot.celebrateTimer += dt;
    if (bot.celebrateTimer > 1.5) {
      bot.mode = 'idle';
      bot.celebrateTimer = 0;
      bot.modeTimer = 0;
    }
  }

  // Thinking → idle timeout
  if (bot.mode === 'thinking' && bot.modeTimer > 3) {
    bot.mode = 'idle';
    bot.modeTimer = 0;
  }

  // Working → idle timeout
  if (bot.mode === 'working' && bot.modeTimer > 5) {
    bot.mode = 'idle';
    bot.modeTimer = 0;
  }

  // Check for caught gummies → set thinking
  const hasCaughtGummy = state.gummies.some(g => g.state === 'caught');
  if (hasCaughtGummy && bot.mode === 'idle') {
    bot.mode = 'thinking';
    bot.modeTimer = 0;
  }

  // Decay catch flash
  if (bot.catchFlash > 0) {
    bot.catchFlash = Math.max(0, bot.catchFlash - dt * 2.5);
  }

  // Recover squish
  bot.squishX += (1 - bot.squishX) * Math.min(1, dt * 8);
  bot.squishY += (1 - bot.squishY) * Math.min(1, dt * 8);

  // Sparkle rotation
  for (const s of bot.sparkles) {
    s.angle += dt * s.speed;
  }
}

function updateGummies(state: GameState, dt: number) {
  for (const g of state.gummies) {
    switch (g.state) {
      case 'orbiting':
        if (!g.isDragging) {
          g.angle += g.orbitSpeed * dt;
          g.x = state.bot.x + Math.cos(g.angle) * g.orbitRadius;
          g.y = state.bot.y + Math.sin(g.angle) * g.orbitRadius;
        }
        break;

      case 'caught':
        g.flightProgress += dt * 6;
        const catchT = Math.min(1, g.flightProgress);
        // Ease-in toward center
        const easedT = catchT * catchT;
        g.x = g.flightX + (state.bot.x - g.flightX) * easedT;
        g.y = g.flightY + (state.bot.y - g.flightY) * easedT;
        g.scale = 1 + catchT * 0.3; // Expand then...
        if (catchT > 0.5) g.scale = (1 - (catchT - 0.5) * 2) * 1.3;
        g.opacity = 1 - catchT;

        if (catchT >= 1) {
          g.state = 'dead';
          spawnParticles(state, g.x, g.y, g.color);
          state.bot.catchFlash = 1;
          state.bot.catchColor = g.color;
          state.bot.squishX = 1.2;
          state.bot.squishY = 0.85;
          // Done overlay
          state.doneOverlays.push({
            text: `✓ ${g.label}`,
            x: state.bot.x,
            y: state.bot.y - 80,
            life: 1.5,
            maxLife: 1.5,
            color: g.color,
          });
          // Celebrate!
          state.bot.mode = 'celebrating';
          state.bot.modeTimer = 0;
          state.bot.celebrateTimer = 0;
          // Audio + server notify
          state.onPopSound?.(0.8 + Math.random() * 0.4);
          state.onCatch?.(g.id);
        }
        break;

      case 'dismissed':
        g.flightProgress += dt * 4;
        const dismissT = Math.min(1, g.flightProgress);
        g.x += g.dragOffsetX * dt * 200;
        g.y += g.dragOffsetY * dt * 200;
        g.opacity = 1 - dismissT;
        g.scale = 1 - dismissT * 0.5;
        if (dismissT >= 1) g.state = 'dead';
        break;
    }
  }

  // Remove dead gummies
  state.gummies = state.gummies.filter(g => g.state !== 'dead');
}

function updateParticles(state: GameState, dt: number) {
  for (const p of state.particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 120 * dt; // Gravity
    p.life -= dt;
    p.vx *= 0.98;
  }
  state.particles = state.particles.filter(p => p.life > 0);
}

function updateDoneOverlays(state: GameState, dt: number) {
  for (const d of state.doneOverlays) {
    d.life -= dt;
    d.y -= dt * 30; // Float upward
  }
  state.doneOverlays = state.doneOverlays.filter(d => d.life > 0);
}

function spawnParticles(state: GameState, x: number, y: number, color: string) {
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const angle = (Math.PI * 2 * i) / PARTICLE_COUNT + (Math.random() - 0.5) * 0.5;
    const speed = 80 + Math.random() * 180;
    state.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 50,
      color,
      radius: 2 + Math.random() * 4,
      life: 0.5 + Math.random() * 0.5,
      maxLife: 1,
    });
  }
}

// Mouse interaction
export function startDrag(state: GameState, mx: number, my: number) {
  // Find closest gummy to mouse
  let closest: Gummy | null = null;
  let closestDist = Infinity;

  for (const g of state.gummies) {
    if (g.state !== 'orbiting') continue;
    const dx = g.x - mx;
    const dy = g.y - my;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < g.size + 15 && dist < closestDist) {
      closest = g;
      closestDist = dist;
    }
  }

  if (closest) {
    closest.isDragging = true;
    state.dragTarget = closest.id;
  }
}

export function moveDrag(state: GameState, mx: number, my: number) {
  state.mouseX = mx;
  state.mouseY = my;

  const g = state.gummies.find(g => g.id === state.dragTarget);
  if (g && g.isDragging) {
    g.x = mx;
    g.y = my;
  }
}

export function endDrag(state: GameState, _mx: number, _my: number, vx: number, vy: number) {
  const g = state.gummies.find(g => g.id === state.dragTarget);
  if (!g) {
    state.dragTarget = null;
    return;
  }

  g.isDragging = false;
  state.dragTarget = null;

  const dx = g.x - state.bot.x;
  const dy = g.y - state.bot.y;
  const distToBot = Math.sqrt(dx * dx + dy * dy);

  // Velocity toward center
  const velToCenter = -(vx * dx + vy * dy) / (distToBot || 1);
  const speed = Math.sqrt(vx * vx + vy * vy);

  // Catch conditions (matching mobile)
  const isDirectHit = distToBot < CATCH_RADIUS;
  const isGravityAssist = velToCenter > VELOCITY_CATCH_THRESHOLD && distToBot < GRAVITY_WELL;
  const isPowerFlick = velToCenter > VELOCITY_CATCH_THRESHOLD * 2 && distToBot < g.orbitRadius * 1.3;

  if (isDirectHit || isGravityAssist || isPowerFlick) {
    // Catch!
    g.state = 'caught';
    g.flightX = g.x;
    g.flightY = g.y;
    g.flightProgress = 0;
  } else if (speed > 10 && velToCenter < -3) {
    // Dismiss
    g.state = 'dismissed';
    const normSpeed = Math.max(speed, 1);
    g.dragOffsetX = vx / normSpeed;
    g.dragOffsetY = vy / normSpeed;
    g.flightProgress = 0;
    state.onDismissSound?.();
  } else {
    // Snap back to orbit
    g.angle = Math.atan2(g.y - state.bot.y, g.x - state.bot.x);
  }
}

export function createInitialState(width: number, height: number): GameState {
  const cx = width / 2;
  const cy = height * 0.42;

  const initialGummies: Array<{label: string; color: string; radius: number; speed: number; angle: number; size: number}> = [
    { label: 'Reply to Mom', color: '#4a90ff', radius: 155, speed: 0.7, angle: 0, size: 30 },
    { label: 'Book Dentist', color: '#44cc66', radius: 175, speed: 0.5, angle: Math.PI * 0.4, size: 33 },
    { label: 'Daily News', color: '#ff8833', radius: 145, speed: 0.6, angle: Math.PI * 0.8, size: 27 },
    { label: 'Pay Rent', color: '#ff4455', radius: 165, speed: 0.8, angle: Math.PI * 1.2, size: 36 },
    { label: 'Auto Backup', color: '#aa66ff', radius: 150, speed: 0.45, angle: Math.PI * 1.6, size: 28 },
    { label: 'Team Standup', color: '#4a90ff', radius: 185, speed: 0.55, angle: Math.PI * 0.15, size: 34 },
  ];

  const sparkles = Array.from({ length: 8 }, (_, i) => ({
    angle: (Math.PI * 2 * i) / 8,
    dist: 60 + Math.random() * 20,
    size: 2 + Math.random() * 3,
    speed: 0.5 + Math.random() * 1,
  }));

  return {
    bot: {
      x: cx,
      y: cy,
      radius: 50,
      breathPhase: 0,
      catchFlash: 0,
      catchColor: '#00dcff',
      squishX: 1,
      squishY: 1,
      mode: 'idle',
      modeTimer: 0,
      spinAngle: 0,
      celebrateTimer: 0,
      sparkles,
    },
    gummies: initialGummies.map((g, i) => ({
      id: String(i + 1),
      label: g.label,
      color: g.color,
      orbitRadius: g.radius,
      orbitSpeed: g.speed,
      angle: g.angle,
      size: g.size,
      x: cx + Math.cos(g.angle) * g.radius,
      y: cy + Math.sin(g.angle) * g.radius,
      isDragging: false,
      dragOffsetX: 0,
      dragOffsetY: 0,
      opacity: 1,
      scale: 1,
      state: 'orbiting' as const,
      flightX: 0,
      flightY: 0,
      flightProgress: 0,
    })),
    particles: [],
    doneOverlays: [],
    stats: {
      xp: 0, level: 1, progress: 0, streak: 0, combo: 0,
      multiplier: 1, xpGained: 0, xpGainedTimer: 0, leveledUp: false, levelUpTimer: 0,
    },
    dragTarget: null,
    mouseX: 0,
    mouseY: 0,
    width,
    height,
    connected: false,
  };
}

export function addGummyFromServer(
  state: GameState,
  data: { id: string; label: string; color: string; size: number; orbitRadius: number; orbitSpeed: number }
) {
  const angle = Math.random() * Math.PI * 2;
  state.gummies.push({
    id: data.id,
    label: data.label,
    color: data.color,
    orbitRadius: data.orbitRadius,
    orbitSpeed: data.orbitSpeed,
    angle,
    size: data.size,
    x: state.bot.x + Math.cos(angle) * data.orbitRadius,
    y: state.bot.y + Math.sin(angle) * data.orbitRadius,
    isDragging: false,
    dragOffsetX: 0,
    dragOffsetY: 0,
    opacity: 1,
    scale: 1,
    state: 'orbiting',
    flightX: 0,
    flightY: 0,
    flightProgress: 0,
  });
}
