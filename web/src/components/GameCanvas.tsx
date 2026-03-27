import { useCallback, useEffect, useRef } from 'react';
import { createInitialState, update, startDrag, moveDrag, endDrag, addGummyFromServer } from '../engine/physics';
import { render } from '../engine/renderer';
import type { GameState } from '../engine/types';
import { useWebSocket } from '../hooks/useWebSocket';
import type { WSMessage } from '../hooks/useWebSocket';
import { playPopSound, playDismissSound } from '../engine/audio';

const API_BASE = 'http://localhost:8088';

export function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState | null>(null);
  const lastTimeRef = useRef<number>(0);
  const dragStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const handleWSMessage = useCallback((msg: WSMessage) => {
    if (msg.type === 'gummy:new' && msg.payload && stateRef.current) {
      const p = msg.payload as {
        id: number; taskId: number; label: string; color: string;
        size: number; orbitRadius: number; orbitSpeed: number; category: string;
      };
      addGummyFromServer(stateRef.current, {
        id: String(p.id),
        label: p.label || `Task #${p.taskId}`,
        color: p.color,
        size: (p.size || 1) * 30,
        orbitRadius: p.orbitRadius || 160,
        orbitSpeed: (p.orbitSpeed || 10000) / 15000, // Convert ms to rad/s approx
      });
    }
  }, []);

  const { isConnected } = useWebSocket(handleWSMessage);

  // Set up callbacks
  useEffect(() => {
    if (stateRef.current) {
      stateRef.current.onCatch = (gummyId: string) => {
        fetch(`${API_BASE}/api/gummies/${gummyId}/execute`, { method: 'POST' })
          .catch(() => { /* Server may be offline */ });
      };
      stateRef.current.onPopSound = (pitch: number) => playPopSound(pitch);
      stateRef.current.onDismissSound = () => playDismissSound();
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);

      if (stateRef.current) {
        const s = stateRef.current;
        s.width = window.innerWidth;
        s.height = window.innerHeight;
        s.bot.x = window.innerWidth / 2;
        s.bot.y = window.innerHeight * 0.42;
      } else {
        stateRef.current = createInitialState(window.innerWidth, window.innerHeight);
      }
    };

    resize();
    window.addEventListener('resize', resize);

    let animFrame: number;
    const loop = (time: number) => {
      const dt = Math.min((time - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = time;

      const state = stateRef.current;
      if (state) {
        state.connected = isConnected;
        update(state, dt);
        ctx.setTransform(window.devicePixelRatio || 1, 0, 0, window.devicePixelRatio || 1, 0, 0);
        render(ctx, state);
      }

      animFrame = requestAnimationFrame(loop);
    };

    animFrame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener('resize', resize);
    };
  }, [isConnected]);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    const { x, y } = getPos(e);
    if (stateRef.current) {
      startDrag(stateRef.current, x, y);
      dragStartRef.current = { x, y, time: performance.now() };
    }
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    const { x, y } = getPos(e);
    if (stateRef.current) {
      moveDrag(stateRef.current, x, y);
    }
  };

  const handlePointerUp = (e: React.MouseEvent | React.TouchEvent) => {
    const pos = 'changedTouches' in e
      ? { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY }
      : { x: (e as React.MouseEvent).clientX, y: (e as React.MouseEvent).clientY };

    if (stateRef.current && dragStartRef.current) {
      const dt = Math.max(1, performance.now() - dragStartRef.current.time) / 1000;
      const vx = (pos.x - dragStartRef.current.x) / dt;
      const vy = (pos.y - dragStartRef.current.y) / dt;
      endDrag(stateRef.current, pos.x, pos.y, vx / 60, vy / 60);
    }
    dragStartRef.current = null;
  };

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        cursor: 'default',
        touchAction: 'none',
      }}
      onMouseDown={handlePointerDown}
      onMouseMove={handlePointerMove}
      onMouseUp={handlePointerUp}
      onMouseLeave={handlePointerUp}
      onTouchStart={handlePointerDown}
      onTouchMove={handlePointerMove}
      onTouchEnd={handlePointerUp}
    />
  );
}
