/**
 * GameCanvas.tsx — Full Skia game engine for Gummy Bots
 *
 * GPU-accelerated 2D rendering via react-native-skia.
 * Physics runs at 60fps on the UI thread via Reanimated useFrameCallback.
 * All game objects (bot, gummies, particles, trajectory) rendered in Skia Canvas.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, LayoutChangeEvent, View } from 'react-native';
import {
  Canvas,
  Circle,
  Group,
  Fill,
  RadialGradient,
  vec,
  Path,
  Skia,
  Paragraph,
} from '@shopify/react-native-skia';
import {
  useSharedValue,
  useDerivedValue,
  useFrameCallback,
  runOnJS,
  SharedValue,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

// ═══════════════════════════════════════════════════════════════════
// Types (exported for App.tsx)
// ═══════════════════════════════════════════════════════════════════

export interface GummyData {
  id: string;
  label: string;
  color: string;
  orbitRadius: number;
  orbitSpeed: number; // ms per full orbit
  startAngle: number;
  size?: number; // 0.7-1.3 scale factor
}

interface GummySlot {
  x: SharedValue<number>;
  y: SharedValue<number>;
  vx: SharedValue<number>;
  vy: SharedValue<number>;
  state: SharedValue<number>; // 0=inactive 1=orbit 2=drag 3=fly 4=caught 5=dismiss
  angle: SharedValue<number>;
  opacity: SharedValue<number>;
  scale: SharedValue<number>;
  orbitRadius: SharedValue<number>;
  orbitSpeed: SharedValue<number>; // rad/s
  radius: SharedValue<number>;
  timer: SharedValue<number>; // catch/dismiss animation countdown
}

interface ParticleSlot {
  x: SharedValue<number>;
  y: SharedValue<number>;
  vx: SharedValue<number>;
  vy: SharedValue<number>;
  r: SharedValue<number>;
  opacity: SharedValue<number>;
  life: SharedValue<number>;
}

// ═══════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════

const { width: SW, height: SH } = Dimensions.get('window');

// Pool sizes
const MAX_G = 12;
const MAX_P = 30;
const P_PER_CATCH = 15;
const TRAJ_DOTS = 8;

// Physics
const GRAVITY_RADIUS = 250;
const GRAVITY_K = 120000;
const DRAG_K = 2.5;
const RESTITUTION = 0.6;
const CATCH_R = 55;
const VEL_SCALE = 0.55;
const ORBIT_RETURN_SPEED = 15;

// Particles
const P_MAX_V = 500;
const P_MIN_V = 150;
const P_LIFE = 0.7;
const P_DRAG = 3.0;

// Visual
const BOT_R = 50;
const BOT_GLOW_R = 90;
const GUMMY_BASE = 64;
const BG = '#0a0a1a';
const GRID_STEP = 50;

// ═══════════════════════════════════════════════════════════════════
// Color helpers
// ═══════════════════════════════════════════════════════════════════

function lighten(hex: string, a = 0.4): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${Math.min(255, Math.round(r + (255 - r) * a))}, ${Math.min(255, Math.round(g + (255 - g) * a))}, ${Math.min(255, Math.round(b + (255 - b) * a))})`;
}

function darken(hex: string, a = 0.5): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${Math.round(r * (1 - a))}, ${Math.round(g * (1 - a))}, ${Math.round(b * (1 - a))})`;
}

// ═══════════════════════════════════════════════════════════════════
// GummySlotView — renders one gummy from shared values
// ═══════════════════════════════════════════════════════════════════

function GummySlotView({
  slot,
  color,
  label,
}: {
  slot: GummySlot;
  color: string;
  label: string | null;
}) {
  const transform = useDerivedValue(() => [
    { translateX: slot.x.value },
    { translateY: slot.y.value },
  ]);
  const scaleT = useDerivedValue(() => [{ scale: slot.scale.value }]);
  const op = useDerivedValue(() => slot.opacity.value);
  const glowR = useDerivedValue(() => slot.radius.value + 12);
  const hlR = useDerivedValue(() => slot.radius.value * 0.28);
  const hlX = useDerivedValue(() => -slot.radius.value * 0.18);
  const hlY = useDerivedValue(() => -slot.radius.value * 0.22);

  // Build paragraph for label text
  const paragraph = useMemo(() => {
    if (!label) return null;
    try {
      const style: Record<string, unknown> = {
        color: Skia.Color('white'),
        fontSize: 9,
        fontStyle: { weight: 700 },
      };
      const builder = Skia.ParagraphBuilder.Make({
        textAlign: 2, // Center
      });
      builder.pushStyle(style as never);
      builder.addText(label.replace(/\n/g, ' '));
      const p = builder.build();
      p.layout(54);
      return p;
    } catch {
      return null;
    }
  }, [label]);

  const lt = lighten(color, 0.45);
  const dk = darken(color, 0.55);

  return (
    <Group transform={transform} opacity={op}>
      <Group transform={scaleT}>
        {/* Soft glow */}
        <Circle cx={0} cy={0} r={glowR} color={color} opacity={0.2} />

        {/* Main body gradient */}
        <Circle cx={0} cy={0} r={slot.radius}>
          <RadialGradient
            c={vec(-4, -6)}
            r={40}
            colors={[lt, color, dk]}
          />
        </Circle>

        {/* Drop shadow */}
        <Circle cx={2} cy={5} r={slot.radius} color="rgba(0,0,0,0.18)" />

        {/* Glossy highlight */}
        <Circle cx={hlX} cy={hlY} r={hlR} color="rgba(255,255,255,0.38)" />

        {/* Label */}
        {paragraph && (
          <Paragraph paragraph={paragraph} x={-27} y={-8} width={54} />
        )}
      </Group>
    </Group>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Props
// ═══════════════════════════════════════════════════════════════════

interface GameCanvasProps {
  gummies: GummyData[];
  onCatch: (gummy: GummyData) => void;
  onDismiss?: (gummy: GummyData) => void;
  comboCount: number;
}

// ═══════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════

export default function GameCanvas({
  gummies,
  onCatch,
  onDismiss,
  comboCount,
}: GameCanvasProps) {
  // ── Layout ─────────────────────────────────────────────────────
  const cW = useSharedValue(SW);
  const cH = useSharedValue(SH - 200);
  const bCX = useSharedValue(SW / 2);
  const bCY = useSharedValue((SH - 200) * 0.38);

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    cW.value = width;
    cH.value = height;
    bCX.value = width / 2;
    bCY.value = height * 0.38;
  }, []);

  // ── Gummy Pool (constant hook count — safe) ────────────────────
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const gPool: GummySlot[] = [];
  for (let i = 0; i < MAX_G; i++) {
    gPool.push({
      // eslint-disable-next-line react-hooks/rules-of-hooks
      x: useSharedValue(0),
      // eslint-disable-next-line react-hooks/rules-of-hooks
      y: useSharedValue(0),
      // eslint-disable-next-line react-hooks/rules-of-hooks
      vx: useSharedValue(0),
      // eslint-disable-next-line react-hooks/rules-of-hooks
      vy: useSharedValue(0),
      // eslint-disable-next-line react-hooks/rules-of-hooks
      state: useSharedValue(0),
      // eslint-disable-next-line react-hooks/rules-of-hooks
      angle: useSharedValue(0),
      // eslint-disable-next-line react-hooks/rules-of-hooks
      opacity: useSharedValue(0),
      // eslint-disable-next-line react-hooks/rules-of-hooks
      scale: useSharedValue(1),
      // eslint-disable-next-line react-hooks/rules-of-hooks
      orbitRadius: useSharedValue(150),
      // eslint-disable-next-line react-hooks/rules-of-hooks
      orbitSpeed: useSharedValue(1),
      // eslint-disable-next-line react-hooks/rules-of-hooks
      radius: useSharedValue(30),
      // eslint-disable-next-line react-hooks/rules-of-hooks
      timer: useSharedValue(0),
    });
  }

  // ── Particle Pool ──────────────────────────────────────────────
  const pPool: ParticleSlot[] = [];
  for (let i = 0; i < MAX_P; i++) {
    pPool.push({
      // eslint-disable-next-line react-hooks/rules-of-hooks
      x: useSharedValue(0),
      // eslint-disable-next-line react-hooks/rules-of-hooks
      y: useSharedValue(0),
      // eslint-disable-next-line react-hooks/rules-of-hooks
      vx: useSharedValue(0),
      // eslint-disable-next-line react-hooks/rules-of-hooks
      vy: useSharedValue(0),
      // eslint-disable-next-line react-hooks/rules-of-hooks
      r: useSharedValue(0),
      // eslint-disable-next-line react-hooks/rules-of-hooks
      opacity: useSharedValue(0),
      // eslint-disable-next-line react-hooks/rules-of-hooks
      life: useSharedValue(0),
    });
  }

  // ── Trajectory Dots ────────────────────────────────────────────
  const tX: SharedValue<number>[] = [];
  const tY: SharedValue<number>[] = [];
  const tO: SharedValue<number>[] = [];
  for (let i = 0; i < TRAJ_DOTS; i++) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    tX.push(useSharedValue(0));
    // eslint-disable-next-line react-hooks/rules-of-hooks
    tY.push(useSharedValue(0));
    // eslint-disable-next-line react-hooks/rules-of-hooks
    tO.push(useSharedValue(0));
  }

  // ── Bot State ──────────────────────────────────────────────────
  const botPhase = useSharedValue(0);
  const botFlash = useSharedValue(0);
  const botEyeA = useSharedValue(0);

  // ── Drag State ─────────────────────────────────────────────────
  const dragIdx = useSharedValue(-1);
  const dragPosX = useSharedValue(0);
  const dragPosY = useSharedValue(0);

  // ── Screen Shake ───────────────────────────────────────────────
  const shakeX = useSharedValue(0);

  // ── Slot Assignments (React state for color/label rendering) ──
  const [slots, setSlots] = useState<Array<{ color: string; label: string; id: string } | null>>(
    () => new Array(MAX_G).fill(null),
  );
  const idMap = useRef<Array<string | null>>(new Array(MAX_G).fill(null));
  const dataMap = useRef<Map<string, GummyData>>(new Map());

  // ── Sync gummies prop → pool slots ─────────────────────────────
  useEffect(() => {
    const ids = new Set(gummies.map((g) => g.id));
    const next = [...slots];
    let changed = false;

    dataMap.current.clear();
    for (const g of gummies) dataMap.current.set(g.id, g);

    // Clear removed
    for (let i = 0; i < MAX_G; i++) {
      if (idMap.current[i] && !ids.has(idMap.current[i]!)) {
        idMap.current[i] = null;
        next[i] = null;
        changed = true;
      }
    }

    // Assign new
    for (const g of gummies) {
      if (idMap.current.indexOf(g.id) >= 0) continue;
      const ei = idMap.current.indexOf(null);
      if (ei < 0) continue;

      const s = gPool[ei];
      s.state.value = 1;
      s.angle.value = g.startAngle;
      s.orbitRadius.value = g.orbitRadius;
      s.orbitSpeed.value = (Math.PI * 2) / (g.orbitSpeed / 1000);
      s.radius.value = (GUMMY_BASE * (g.size ?? 1)) / 2;
      s.opacity.value = 1;
      s.scale.value = 1;
      s.vx.value = 0;
      s.vy.value = 0;
      s.timer.value = 0;
      s.x.value = bCX.value + Math.cos(g.startAngle) * g.orbitRadius;
      s.y.value = bCY.value + Math.sin(g.startAngle) * g.orbitRadius;

      idMap.current[ei] = g.id;
      next[ei] = { color: g.color, label: g.label, id: g.id };
      changed = true;
    }

    if (changed) setSlots(next);
  }, [gummies]);

  // ── Combo → screen shake ───────────────────────────────────────
  useEffect(() => {
    if (comboCount >= 3) {
      shakeX.value = Math.min(comboCount, 8) * 2.5;
    }
  }, [comboCount]);

  // ── Haptic callbacks (JS thread) ───────────────────────────────
  const hapticLight = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);
  const hapticMedium = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);
  const hapticHeavy = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }, []);
  const hapticSuccess = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  // ── Catch / Dismiss callbacks ──────────────────────────────────
  const catchJS = useCallback(
    (si: number) => {
      const gid = idMap.current[si];
      if (!gid) return;
      const d = dataMap.current.get(gid);
      if (d) onCatch(d);
    },
    [onCatch],
  );

  const dismissJS = useCallback(
    (si: number) => {
      const gid = idMap.current[si];
      if (!gid) return;
      const d = dataMap.current.get(gid);
      if (d) onDismiss?.(d);
    },
    [onDismiss],
  );

  // ── Particle spawning (JS thread → shared values) ─────────────
  const spawnParticles = useCallback((px: number, py: number) => {
    let n = 0;
    for (let i = 0; i < MAX_P && n < P_PER_CATCH; i++) {
      if (pPool[i].life.value > 0.01) continue;
      const a = Math.random() * Math.PI * 2;
      const spd = P_MIN_V + Math.random() * (P_MAX_V - P_MIN_V);
      pPool[i].x.value = px;
      pPool[i].y.value = py;
      pPool[i].vx.value = Math.cos(a) * spd;
      pPool[i].vy.value = Math.sin(a) * spd;
      pPool[i].r.value = 2 + Math.random() * 4;
      pPool[i].opacity.value = 0.85 + Math.random() * 0.15;
      pPool[i].life.value = 0.5 + Math.random() * 0.5;
      n++;
    }
  }, []);

  // ═══════════════════════════════════════════════════════════════
  // PHYSICS GAME LOOP — runs on UI thread at 60fps
  // ═══════════════════════════════════════════════════════════════

  useFrameCallback((fi) => {
    'worklet';
    const dt = Math.min((fi.timeSincePreviousFrame ?? 16) / 1000, 0.05);
    const cx = bCX.value;
    const cy = bCY.value;
    const w = cW.value;
    const h = cH.value;

    // Bot breathing
    botPhase.value += dt * 1.4;

    // Bot flash decay
    if (botFlash.value > 0) botFlash.value = Math.max(0, botFlash.value - dt * 3);

    // Screen shake oscillating decay
    if (Math.abs(shakeX.value) > 0.3) {
      shakeX.value *= -0.72;
    } else {
      shakeX.value = 0;
    }

    // Eye tracking — find nearest gummy
    let nearDist = 99999;
    let nearAngle = 0;

    // ── Update each gummy ──
    for (let i = 0; i < MAX_G; i++) {
      const g = gPool[i];
      const st = g.state.value;
      if (st === 0) continue;

      // ORBITING
      if (st === 1) {
        g.angle.value += g.orbitSpeed.value * dt;
        g.x.value = cx + Math.cos(g.angle.value) * g.orbitRadius.value;
        g.y.value = cy + Math.sin(g.angle.value) * g.orbitRadius.value;
        g.scale.value = 1 + Math.sin(g.angle.value * 3) * 0.03;
      }

      // DRAGGING
      if (st === 2) {
        g.x.value = dragPosX.value;
        g.y.value = dragPosY.value;
        g.scale.value = 1.15;
      }

      // FLYING — real physics
      if (st === 3) {
        const dx = cx - g.x.value;
        const dy = cy - g.y.value;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Gravity well
        if (dist < GRAVITY_RADIUS && dist > 1) {
          const f = Math.min(GRAVITY_K / (dist * dist), 2000);
          g.vx.value += (dx / dist) * f * dt;
          g.vy.value += (dy / dist) * f * dt;
        }

        // Drag
        const dm = Math.exp(-DRAG_K * dt);
        g.vx.value *= dm;
        g.vy.value *= dm;

        // Integrate
        g.x.value += g.vx.value * dt;
        g.y.value += g.vy.value * dt;

        const r = g.radius.value;

        // Wall bounce
        if (g.x.value < r) {
          g.x.value = r;
          g.vx.value = Math.abs(g.vx.value) * RESTITUTION;
          runOnJS(hapticLight)();
        } else if (g.x.value > w - r) {
          g.x.value = w - r;
          g.vx.value = -Math.abs(g.vx.value) * RESTITUTION;
          runOnJS(hapticLight)();
        }
        if (g.y.value < r) {
          g.y.value = r;
          g.vy.value = Math.abs(g.vy.value) * RESTITUTION;
          runOnJS(hapticLight)();
        } else if (g.y.value > h - r) {
          g.y.value = h - r;
          g.vy.value = -Math.abs(g.vy.value) * RESTITUTION;
          runOnJS(hapticLight)();
        }

        // Bot catch
        if (dist < CATCH_R + r) {
          g.state.value = 4;
          g.timer.value = 0.2;
          botFlash.value = 1;
          runOnJS(hapticSuccess)();
          runOnJS(catchJS)(i);
          runOnJS(spawnParticles)(g.x.value, g.y.value);
        }

        // Return to orbit if nearly stopped
        const spd = Math.sqrt(g.vx.value ** 2 + g.vy.value ** 2);
        if (spd < ORBIT_RETURN_SPEED && dist > CATCH_R + r) {
          const ta = Math.atan2(g.y.value - cy, g.x.value - cx);
          const tx = cx + Math.cos(ta) * g.orbitRadius.value;
          const ty = cy + Math.sin(ta) * g.orbitRadius.value;
          g.x.value += (tx - g.x.value) * 3 * dt;
          g.y.value += (ty - g.y.value) * 3 * dt;
          if (Math.sqrt((g.x.value - tx) ** 2 + (g.y.value - ty) ** 2) < 5) {
            g.state.value = 1;
            g.angle.value = ta;
            g.scale.value = 1;
          }
        }
      }

      // CAUGHT animation
      if (st === 4) {
        g.timer.value -= dt;
        const t = 1 - Math.max(0, g.timer.value / 0.2);
        g.x.value += (cx - g.x.value) * 0.25;
        g.y.value += (cy - g.y.value) * 0.25;
        g.scale.value = t < 0.3 ? 1 + t * 2 : Math.max(0, 1.6 - ((t - 0.3) / 0.7) * 1.6);
        g.opacity.value = Math.max(0, 1 - t * 1.2);
        if (g.timer.value <= 0) {
          g.state.value = 0;
          g.opacity.value = 0;
          g.scale.value = 1;
        }
      }

      // DISMISSED animation
      if (st === 5) {
        g.timer.value -= dt;
        g.x.value += g.vx.value * dt;
        g.y.value += g.vy.value * dt;
        g.opacity.value = Math.max(0, g.timer.value / 0.4);
        g.scale.value = Math.max(0.2, g.timer.value / 0.4);
        if (g.timer.value <= 0) {
          g.state.value = 0;
          g.opacity.value = 0;
        }
      }

      // Track nearest for bot eyes
      const gd = Math.sqrt((g.x.value - cx) ** 2 + (g.y.value - cy) ** 2);
      if (gd < nearDist && st > 0 && st < 4) {
        nearDist = gd;
        nearAngle = Math.atan2(g.y.value - cy, g.x.value - cx);
      }
    }

    // Bot eye smooth follow
    const eyeTarget = dragIdx.value >= 0
      ? Math.atan2(dragPosY.value - cy, dragPosX.value - cx)
      : nearAngle;
    let ad = eyeTarget - botEyeA.value;
    if (ad > Math.PI) ad -= 2 * Math.PI;
    if (ad < -Math.PI) ad += 2 * Math.PI;
    botEyeA.value += ad * 5 * dt;

    // Trajectory dots
    if (dragIdx.value >= 0) {
      const gx = dragPosX.value;
      const gy = dragPosY.value;
      const dBot = Math.sqrt((cx - gx) ** 2 + (cy - gy) ** 2);
      for (let t = 0; t < TRAJ_DOTS; t++) {
        const f = (t + 1) / (TRAJ_DOTS + 1);
        tX[t].value = gx + (cx - gx) * f;
        tY[t].value = gy + (cy - gy) * f;
        tO[t].value = Math.max(0, 0.4 * (1 - dBot / 400)) * (1 - f * 0.5);
      }
    } else {
      for (let t = 0; t < TRAJ_DOTS; t++) tO[t].value = 0;
    }

    // ── Update particles ──
    for (let i = 0; i < MAX_P; i++) {
      const p = pPool[i];
      if (p.life.value <= 0) continue;
      p.life.value -= dt / P_LIFE;
      if (p.life.value <= 0) {
        p.opacity.value = 0;
        continue;
      }
      const pd = Math.exp(-P_DRAG * dt);
      p.vx.value *= pd;
      p.vy.value *= pd;
      p.x.value += p.vx.value * dt;
      p.y.value += p.vy.value * dt;
      p.opacity.value = Math.max(0, p.life.value);
      p.r.value *= 0.995;
    }
  });

  // ═══════════════════════════════════════════════════════════════
  // GESTURE HANDLER
  // ═══════════════════════════════════════════════════════════════

  const pan = Gesture.Pan()
    .onStart((e) => {
      'worklet';
      let best = -1;
      let bestD = 99999;
      for (let i = 0; i < MAX_G; i++) {
        const g = gPool[i];
        const s = g.state.value;
        if (s !== 1 && s !== 3) continue;
        const dx = e.x - g.x.value;
        const dy = e.y - g.y.value;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < g.radius.value + 20 && d < bestD) {
          bestD = d;
          best = i;
        }
      }
      if (best >= 0) {
        dragIdx.value = best;
        dragPosX.value = gPool[best].x.value;
        dragPosY.value = gPool[best].y.value;
        gPool[best].state.value = 2;
        gPool[best].vx.value = 0;
        gPool[best].vy.value = 0;
        runOnJS(hapticLight)();
      }
    })
    .onUpdate((e) => {
      'worklet';
      if (dragIdx.value < 0) return;
      dragPosX.value = e.x;
      dragPosY.value = e.y;
    })
    .onEnd((e) => {
      'worklet';
      if (dragIdx.value < 0) return;
      const i = dragIdx.value;
      const g = gPool[i];
      const cx = bCX.value;
      const cy = bCY.value;
      const px = dragPosX.value;
      const py = dragPosY.value;
      const dist = Math.sqrt((px - cx) ** 2 + (py - cy) ** 2);
      const vx = e.velocityX * VEL_SCALE;
      const vy = e.velocityY * VEL_SCALE;
      const spd = Math.sqrt(vx * vx + vy * vy);
      const toCX = cx - px;
      const toCY = cy - py;
      const vToC = (vx * toCX + vy * toCY) / Math.max(dist, 1);

      if (dist < CATCH_R + g.radius.value) {
        // Direct catch
        g.state.value = 4;
        g.timer.value = 0.15;
        botFlash.value = 1;
        runOnJS(hapticSuccess)();
        runOnJS(catchJS)(i);
        runOnJS(spawnParticles)(px, py);
      } else if (spd > 300 && vToC < -100) {
        // Dismiss — flicked away
        g.state.value = 5;
        g.vx.value = vx;
        g.vy.value = vy;
        g.timer.value = 0.4;
        runOnJS(hapticLight)();
        runOnJS(dismissJS)(i);
      } else {
        // Fly with physics
        g.state.value = 3;
        g.vx.value = vx;
        g.vy.value = vy;
        g.scale.value = 1;
        runOnJS(hapticMedium)();
      }
      dragIdx.value = -1;
    })
    .onFinalize(() => {
      'worklet';
      if (dragIdx.value >= 0) {
        const g = gPool[dragIdx.value];
        if (g.state.value === 2) {
          g.state.value = 1;
          g.scale.value = 1;
        }
        dragIdx.value = -1;
      }
    });

  // ═══════════════════════════════════════════════════════════════
  // Derived values for rendering
  // ═══════════════════════════════════════════════════════════════

  // Bot orb transform (breathing + catch flash)
  const botTransform = useDerivedValue(() => [
    { translateX: bCX.value },
    { translateY: bCY.value },
    { scale: (1 + Math.sin(botPhase.value) * 0.04) * (1 + botFlash.value * 0.15) },
  ]);

  // Bot glow
  const botGlowOp = useDerivedValue(() => {
    return 0.15 + Math.sin(botPhase.value) * 0.1 + botFlash.value * 0.4;
  });

  // Bot flash ring
  const flashRingOp = useDerivedValue(() => botFlash.value * 0.6);
  const flashRingR = useDerivedValue(() => BOT_R * (1 + botFlash.value * 1.5));

  // Bot eyes
  const eyeOff = 6;
  const lEyeX = useDerivedValue(() => bCX.value - 14 + Math.cos(botEyeA.value) * eyeOff);
  const lEyeY = useDerivedValue(() => bCY.value - 8 + Math.sin(botEyeA.value) * eyeOff);
  const rEyeX = useDerivedValue(() => bCX.value + 14 + Math.cos(botEyeA.value) * eyeOff);
  const rEyeY = useDerivedValue(() => bCY.value - 8 + Math.sin(botEyeA.value) * eyeOff);

  // Bot squish on catch
  const botSquishX = useDerivedValue(() => {
    const f = botFlash.value;
    if (f > 0.7) return 1 + (1 - f) * 0.8;
    if (f > 0.4) return 1 - (f - 0.4) * 0.3;
    return 1;
  });
  const botSquishY = useDerivedValue(() => {
    const f = botFlash.value;
    if (f > 0.7) return 1 - (1 - f) * 0.6;
    if (f > 0.4) return 1 + (f - 0.4) * 0.25;
    return 1;
  });

  // Screen shake transform
  const shakeT = useDerivedValue(() => [{ translateX: shakeX.value }]);

  // ── Background grid (static) ──────────────────────────────────
  const gridPath = useMemo(() => {
    const p = Skia.Path.Make();
    for (let x = GRID_STEP; x < SW; x += GRID_STEP) {
      p.moveTo(x, 0);
      p.lineTo(x, SH);
    }
    for (let y = GRID_STEP; y < SH; y += GRID_STEP) {
      p.moveTo(0, y);
      p.lineTo(SW, y);
    }
    return p;
  }, []);

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════

  return (
    <View style={{ flex: 1 }} onLayout={handleLayout}>
      <GestureDetector gesture={pan}>
        <Animated.View style={{ flex: 1 }}>
          <Canvas style={{ flex: 1 }}>
            <Group transform={shakeT}>
              {/* ── Background ── */}
              <Fill color={BG} />
              <Path
                path={gridPath}
                style="stroke"
                strokeWidth={0.5}
                color="rgba(255,255,255,0.035)"
              />

              {/* ── Bot: Outer glow ── */}
              <Group transform={botTransform}>
                <Circle cx={0} cy={0} r={BOT_GLOW_R} opacity={botGlowOp}>
                  <RadialGradient
                    c={vec(0, 0)}
                    r={BOT_GLOW_R}
                    colors={['rgba(0,220,255,0.35)', 'rgba(0,220,255,0.08)', 'transparent']}
                  />
                </Circle>
              </Group>

              {/* ── Bot: Flash ring ── */}
              <Circle
                cx={bCX}
                cy={bCY}
                r={flashRingR}
                opacity={flashRingOp}
                style="stroke"
                strokeWidth={3}
                color="rgba(0,220,255,0.8)"
              />

              {/* ── Bot: Main orb ── */}
              <Group transform={botTransform}>
                {/* Squish deformation */}
                <Group transform={useDerivedValue(() => [
                  { scaleX: botSquishX.value },
                  { scaleY: botSquishY.value },
                ])}>
                  <Circle cx={0} cy={0} r={BOT_R}>
                    <RadialGradient
                      c={vec(-10, -15)}
                      r={BOT_R * 1.2}
                      colors={['#78e8ff', '#00dcff', '#0099cc', '#006688']}
                    />
                  </Circle>
                  {/* Main highlight */}
                  <Circle cx={-12} cy={-18} r={12} color="rgba(255,255,255,0.35)" />
                  {/* Secondary highlight */}
                  <Circle cx={10} cy={-10} r={5} color="rgba(255,255,255,0.15)" />
                </Group>
              </Group>

              {/* ── Bot: Eyes ── */}
              <Circle cx={lEyeX} cy={lEyeY} r={8} color="rgba(0,20,40,0.5)" />
              <Circle cx={lEyeX} cy={lEyeY} r={4.5} color="white" />
              <Circle cx={rEyeX} cy={rEyeY} r={8} color="rgba(0,20,40,0.5)" />
              <Circle cx={rEyeX} cy={rEyeY} r={4.5} color="white" />

              {/* ── Trajectory dots ── */}
              {tX.map((_, t) => (
                <Circle
                  key={`t${t}`}
                  cx={tX[t]}
                  cy={tY[t]}
                  r={3}
                  opacity={tO[t]}
                  color="rgba(255,255,255,0.6)"
                />
              ))}

              {/* ── Gummies ── */}
              {gPool.map((slot, i) => (
                <GummySlotView
                  key={i}
                  slot={slot}
                  color={slots[i]?.color ?? '#666'}
                  label={slots[i]?.label ?? null}
                />
              ))}

              {/* ── Particles ── */}
              {pPool.map((p, i) => (
                <Circle
                  key={`p${i}`}
                  cx={p.x}
                  cy={p.y}
                  r={p.r}
                  opacity={p.opacity}
                  color="white"
                />
              ))}
            </Group>
          </Canvas>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
