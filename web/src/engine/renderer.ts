import type { GameState, Gummy, Particle, DoneOverlay } from './types';

export function render(ctx: CanvasRenderingContext2D, state: GameState) {
  const { width, height, bot } = state;

  // Clear
  ctx.fillStyle = '#0a0a1a';
  ctx.fillRect(0, 0, width, height);

  // Subtle grid pattern for depth
  drawGrid(ctx, width, height);

  // Bot outer glow
  drawBotGlow(ctx, bot.x, bot.y, bot.radius, bot.breathPhase, bot.catchFlash, bot.catchColor);

  // Gummies (behind bot glow, in front of grid)
  for (const g of state.gummies) {
    if (g.state !== 'dead') {
      drawGummy(ctx, g);
    }
  }

  // Bot orb
  drawBot(ctx, bot.x, bot.y, bot.radius, bot.breathPhase, bot.squishX, bot.squishY, bot.catchFlash, bot.catchColor);

  // Bot mode-specific effects
  if (bot.mode === 'thinking') {
    drawThinkingDots(ctx, bot.x, bot.y, bot.radius, bot.breathPhase);
  }
  if (bot.mode === 'working') {
    drawWorkingRing(ctx, bot.x, bot.y, bot.radius, bot.spinAngle);
  }
  if (bot.mode === 'celebrating') {
    drawSparkles(ctx, bot.x, bot.y, bot.sparkles, bot.celebrateTimer);
  }

  // Particles (on top of everything)
  for (const p of state.particles) {
    drawParticle(ctx, p);
  }

  // Done overlays
  for (const d of state.doneOverlays) {
    drawDoneOverlay(ctx, d);
  }

  // Connection indicator
  drawConnectionDot(ctx, width, state.connected);
}

function drawGrid(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.strokeStyle = 'rgba(0, 220, 255, 0.02)';
  ctx.lineWidth = 1;
  const spacing = 60;
  for (let x = spacing; x < w; x += spacing) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = spacing; y < h; y += spacing) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
}

function drawBotGlow(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, r: number,
  breathPhase: number, catchFlash: number, catchColor: string
) {
  const breathScale = 1 + Math.sin(breathPhase) * 0.08;
  const glowR = r * 2.2 * breathScale;
  const alpha = 0.08 + Math.sin(breathPhase) * 0.04 + catchFlash * 0.15;

  const grad = ctx.createRadialGradient(x, y, r * 0.5, x, y, glowR);
  const color = catchFlash > 0.1 ? catchColor : '#00dcff';
  grad.addColorStop(0, colorWithAlpha(color, alpha * 2));
  grad.addColorStop(0.5, colorWithAlpha(color, alpha));
  grad.addColorStop(1, 'transparent');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, glowR, 0, Math.PI * 2);
  ctx.fill();

  // Catch shockwave ring
  if (catchFlash > 0.05) {
    const ringR = r * (1 + (1 - catchFlash) * 3);
    ctx.strokeStyle = colorWithAlpha(catchColor, catchFlash * 0.6);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, ringR, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawBot(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, r: number,
  breathPhase: number,
  squishX: number, squishY: number,
  catchFlash: number, catchColor: string
) {
  const breathScale = 1 + Math.sin(breathPhase) * 0.04;
  const rx = r * breathScale * squishX;
  const ry = r * breathScale * squishY;

  ctx.save();
  ctx.translate(x, y);

  // Main orb
  const grad = ctx.createRadialGradient(-rx * 0.2, -ry * 0.3, 0, 0, 0, rx);
  grad.addColorStop(0, '#78e8ff');
  grad.addColorStop(0.3, '#00dcff');
  grad.addColorStop(0.7, '#0099cc');
  grad.addColorStop(1, '#006688');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();

  // Catch flash overlay
  if (catchFlash > 0.05) {
    ctx.fillStyle = colorWithAlpha(catchColor, catchFlash * 0.4);
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Highlight
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.beginPath();
  ctx.ellipse(-rx * 0.2, -ry * 0.25, rx * 0.3, ry * 0.2, -0.3, 0, Math.PI * 2);
  ctx.fill();

  // Small secondary highlight
  ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.beginPath();
  ctx.ellipse(rx * 0.2, ry * 0.15, rx * 0.12, ry * 0.08, 0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawGummy(ctx: CanvasRenderingContext2D, g: Gummy) {
  if (g.opacity <= 0) return;

  ctx.save();
  ctx.globalAlpha = g.opacity;
  ctx.translate(g.x, g.y);
  ctx.scale(g.scale, g.scale);

  const r = g.size;

  // Shadow
  ctx.shadowColor = g.color;
  ctx.shadowBlur = 15;
  ctx.shadowOffsetY = 4;

  // Main circle
  const grad = ctx.createRadialGradient(-r * 0.15, -r * 0.2, 0, 0, 0, r);
  grad.addColorStop(0, lightenColor(g.color, 30));
  grad.addColorStop(0.6, g.color);
  grad.addColorStop(1, darkenColor(g.color, 30));
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // Glossy highlight
  ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
  ctx.beginPath();
  ctx.ellipse(-r * 0.15, -r * 0.2, r * 0.4, r * 0.25, -0.3, 0, Math.PI * 2);
  ctx.fill();

  // Label
  ctx.fillStyle = '#fff';
  ctx.font = `bold ${Math.max(9, r * 0.32)}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Text shadow
  ctx.shadowColor = 'rgba(0,0,0,0.4)';
  ctx.shadowBlur = 3;
  ctx.fillText(g.label, 0, 2, r * 1.6);
  ctx.shadowBlur = 0;

  ctx.restore();
}

function drawParticle(ctx: CanvasRenderingContext2D, p: Particle) {
  const alpha = p.life / p.maxLife;
  ctx.globalAlpha = alpha;
  ctx.fillStyle = p.color;
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.radius * alpha, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawThinkingDots(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, phase: number) {
  const dotCount = 3;
  for (let i = 0; i < dotCount; i++) {
    const dotPhase = phase * 4 + i * 0.8;
    const alpha = 0.3 + Math.sin(dotPhase) * 0.3;
    const yOffset = Math.sin(dotPhase) * 5;
    const dotX = x - 12 + i * 12;
    const dotY = y + r + 20 + yOffset;

    ctx.fillStyle = `rgba(255, 200, 50, ${alpha})`;
    ctx.beginPath();
    ctx.arc(dotX, dotY, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawWorkingRing(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, spinAngle: number) {
  const ringR = r * 1.4;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(spinAngle);

  // Dashed spinning ring
  ctx.strokeStyle = 'rgba(0, 220, 255, 0.3)';
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 15]);
  ctx.beginPath();
  ctx.arc(0, 0, ringR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Accent dot on ring
  ctx.fillStyle = 'rgba(0, 220, 255, 0.8)';
  ctx.beginPath();
  ctx.arc(ringR, 0, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawSparkles(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  sparkles: Array<{ angle: number; dist: number; size: number }>,
  timer: number
) {
  const alpha = Math.min(1, timer * 3) * Math.max(0, 1 - timer / 1.5);

  for (const s of sparkles) {
    const sx = x + Math.cos(s.angle) * s.dist;
    const sy = y + Math.sin(s.angle) * s.dist;
    const pulse = 0.5 + Math.sin(timer * 10 + s.angle * 3) * 0.5;

    ctx.save();
    ctx.globalAlpha = alpha * pulse;
    ctx.translate(sx, sy);

    // Draw 4-point star
    const size = s.size * (1 + pulse * 0.5);
    ctx.fillStyle = '#ffe066';
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(size * 0.3, -size * 0.3);
    ctx.lineTo(size, 0);
    ctx.lineTo(size * 0.3, size * 0.3);
    ctx.lineTo(0, size);
    ctx.lineTo(-size * 0.3, size * 0.3);
    ctx.lineTo(-size, 0);
    ctx.lineTo(-size * 0.3, -size * 0.3);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}

function drawDoneOverlay(ctx: CanvasRenderingContext2D, d: DoneOverlay) {
  const alpha = Math.min(1, d.life / (d.maxLife * 0.3));
  const scale = 0.8 + (1 - d.life / d.maxLife) * 0.3;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(d.x, d.y);
  ctx.scale(scale, scale);

  // Background pill
  ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, sans-serif';
  const textWidth = ctx.measureText(d.text).width;
  const pillW = textWidth + 32;
  const pillH = 36;

  ctx.fillStyle = colorWithAlpha(d.color, 0.85);
  ctx.beginPath();
  ctx.roundRect(-pillW / 2, -pillH / 2, pillW, pillH, pillH / 2);
  ctx.fill();

  // Text
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(d.text, 0, 0);

  ctx.restore();
}

function drawConnectionDot(ctx: CanvasRenderingContext2D, width: number, connected: boolean) {
  ctx.fillStyle = connected ? '#44cc66' : '#ff4455';
  ctx.beginPath();
  ctx.arc(width - 20, 20, 4, 0, Math.PI * 2);
  ctx.fill();
}

// Color utilities
function colorWithAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha))})`;
}

function lightenColor(hex: string, amount: number): string {
  const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + amount);
  const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + amount);
  const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + amount);
  return `rgb(${r}, ${g}, ${b})`;
}

function darkenColor(hex: string, amount: number): string {
  const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - amount);
  const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - amount);
  const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - amount);
  return `rgb(${r}, ${g}, ${b})`;
}
