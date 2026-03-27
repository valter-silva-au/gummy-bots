import type { GameState, Gummy, Particle, DoneOverlay, PlayerStats, EvolutionStage } from './types';

export function render(ctx: CanvasRenderingContext2D, state: GameState) {
  const { width, height, bot } = state;

  // Clear
  ctx.fillStyle = '#0a0a1a';
  ctx.fillRect(0, 0, width, height);

  // Subtle grid pattern for depth
  drawGrid(ctx, width, height);

  const stage = bot.evolutionStage;

  // Evolution-specific background aura (stages 3+)
  if (stage >= 3) {
    drawEvolutionAura(ctx, bot.x, bot.y, bot.radius, bot.breathPhase, stage);
  }

  // Bot outer glow
  drawBotGlow(ctx, bot.x, bot.y, bot.radius, bot.breathPhase, bot.catchFlash, bot.catchColor, stage);

  // Gummies (behind bot glow, in front of grid) — max 8 visible
  const visibleGummies = state.gummies.filter(g => g.state !== 'dead');
  const overflowCount = Math.max(0, visibleGummies.length - 8);
  const gummiesToShow = visibleGummies.slice(0, 8);

  for (const g of gummiesToShow) {
    drawGummy(ctx, g);
  }

  // Overflow indicator
  if (overflowCount > 0) {
    drawOverflowIndicator(ctx, width, height, overflowCount);
  }

  // Stage 2+: Inner ring patterns (behind bot orb)
  if (stage >= 2) {
    drawInnerRings(ctx, bot.x, bot.y, bot.radius, bot.breathPhase, stage);
  }

  // Bot orb
  drawBot(ctx, bot.x, bot.y, bot.radius, bot.breathPhase, bot.squishX, bot.squishY, bot.catchFlash, bot.catchColor, stage);

  // Stage 3+: Crown/halo element
  if (stage >= 3) {
    drawCrownHalo(ctx, bot.x, bot.y, bot.radius, bot.breathPhase, stage);
  }

  // Stage 4: Legendary energy field
  if (stage === 4) {
    drawLegendaryField(ctx, bot.x, bot.y, bot.radius, bot.breathPhase);
  }

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

  // Evolution transition flash
  if (bot.evolutionTransition > 0) {
    drawEvolutionTransition(ctx, bot.x, bot.y, bot.radius, bot.evolutionTransition, stage);
  }

  // Particles (on top of everything)
  for (const p of state.particles) {
    drawParticle(ctx, p);
  }

  // Done overlays
  for (const d of state.doneOverlays) {
    drawDoneOverlay(ctx, d);
  }

  // Status bar
  drawStatusBar(ctx, width, state.stats);

  // Connection indicator
  drawConnectionDot(ctx, width, state.connected);

  // Tooltip (Sprint 10)
  if (state.tooltip) {
    drawTooltip(ctx, state);
  }

  // Connector status icons (Sprint 11)
  drawConnectorStatus(ctx, width, height);
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
  breathPhase: number, catchFlash: number, catchColor: string,
  stage: EvolutionStage = 1
) {
  const breathScale = 1 + Math.sin(breathPhase) * 0.08;
  const stageGlowMultiplier = 1 + (stage - 1) * 0.3; // Bigger glow at higher stages
  const glowR = r * 2.2 * breathScale * stageGlowMultiplier;
  const alpha = (0.08 + Math.sin(breathPhase) * 0.04 + catchFlash * 0.15) * (1 + (stage - 1) * 0.15);

  const baseColor = stage >= 4 ? '#ffd700' : stage >= 3 ? '#66eeff' : '#00dcff';
  const grad = ctx.createRadialGradient(x, y, r * 0.5, x, y, glowR);
  const color = catchFlash > 0.1 ? catchColor : baseColor;
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
  catchFlash: number, catchColor: string,
  stage: EvolutionStage = 1
) {
  const breathScale = 1 + Math.sin(breathPhase) * 0.04;
  const rx = r * breathScale * squishX;
  const ry = r * breathScale * squishY;

  ctx.save();
  ctx.translate(x, y);

  // Main orb — gradient varies by evolution stage
  const grad = ctx.createRadialGradient(-rx * 0.2, -ry * 0.3, 0, 0, 0, rx);
  if (stage === 4) {
    // Legendary: gold → deep amber
    grad.addColorStop(0, '#fff4b8');
    grad.addColorStop(0.2, '#ffd700');
    grad.addColorStop(0.5, '#ffaa00');
    grad.addColorStop(0.8, '#cc7700');
    grad.addColorStop(1, '#995500');
  } else if (stage === 3) {
    // Detailed: richer cyan → teal → deep blue
    grad.addColorStop(0, '#aaf0ff');
    grad.addColorStop(0.2, '#44ddff');
    grad.addColorStop(0.5, '#00bbee');
    grad.addColorStop(0.8, '#0088bb');
    grad.addColorStop(1, '#005577');
  } else if (stage === 2) {
    // Featured: brighter cyan palette
    grad.addColorStop(0, '#8aeeff');
    grad.addColorStop(0.3, '#11ddff');
    grad.addColorStop(0.7, '#00aadd');
    grad.addColorStop(1, '#007799');
  } else {
    // Simple orb: original
    grad.addColorStop(0, '#78e8ff');
    grad.addColorStop(0.3, '#00dcff');
    grad.addColorStop(0.7, '#0099cc');
    grad.addColorStop(1, '#006688');
  }

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

  // Stage 2+: Core shimmer
  if (stage >= 2) {
    const shimmer = Math.sin(breathPhase * 3) * 0.5 + 0.5;
    ctx.fillStyle = `rgba(255, 255, 255, ${0.05 + shimmer * 0.08})`;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx * 0.6, ry * 0.6, breathPhase * 0.2, 0, Math.PI * 2);
    ctx.fill();
  }

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

function drawStatusBar(ctx: CanvasRenderingContext2D, width: number, stats: PlayerStats) {
  const y = 30;
  const padding = 24;

  // Level
  ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(`Level ${stats.level}`, padding, y);

  // XP progress bar
  const barX = padding + 90;
  const barW = 120;
  const barH = 6;

  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.beginPath();
  ctx.roundRect(barX, y - barH / 2, barW, barH, 3);
  ctx.fill();

  if (stats.progress > 0) {
    ctx.fillStyle = '#00dcff';
    ctx.beginPath();
    ctx.roundRect(barX, y - barH / 2, barW * stats.progress, barH, 3);
    ctx.fill();
  }

  // Streak
  ctx.font = '600 16px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = '#ffaa44';
  ctx.textAlign = 'right';
  const streakText = stats.streak > 0 ? `🔥 ${stats.streak}-day streak` : '';
  ctx.fillText(streakText, width - padding, y);

  // XP gained popup
  if (stats.xpGainedTimer > 0) {
    const alpha = Math.min(1, stats.xpGainedTimer);
    ctx.globalAlpha = alpha;
    ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = '#44ff88';
    ctx.textAlign = 'center';
    const yOff = (1 - alpha) * 20;
    let xpText = `+${stats.xpGained} XP`;
    if (stats.multiplier > 1) {
      xpText += ` (${stats.multiplier}x combo!)`;
    }
    ctx.fillText(xpText, width / 2, y + 25 - yOff);
    ctx.globalAlpha = 1;
  }

  // Level up!
  if (stats.levelUpTimer > 0) {
    const alpha = Math.min(1, stats.levelUpTimer);
    const scale = 1 + (1 - alpha) * 0.3;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(width / 2, 70);
    ctx.scale(scale, scale);
    ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = '#ffe066';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`⚡ LEVEL ${stats.level}!`, 0, 0);
    ctx.restore();
  }
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

// Sprint 9: Overflow indicator
function drawOverflowIndicator(ctx: CanvasRenderingContext2D, width: number, height: number, count: number) {
  const x = width / 2;
  const y = height * 0.75;

  ctx.save();
  ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = 'rgba(255, 170, 68, 0.8)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Background pill
  const text = `+ ${count} more`;
  const textWidth = ctx.measureText(text).width;
  const pillW = textWidth + 24;
  const pillH = 28;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.beginPath();
  ctx.roundRect(x - pillW / 2, y - pillH / 2, pillW, pillH, pillH / 2);
  ctx.fill();

  ctx.fillStyle = '#ffaa44';
  ctx.fillText(text, x, y);
  ctx.restore();
}

// Sprint 10: Tooltip
function drawTooltip(ctx: CanvasRenderingContext2D, state: GameState) {
  if (!state.tooltip) return;

  const gummy = state.gummies.find(g => g.id === state.tooltip?.gummyId);
  if (!gummy) {
    state.tooltip = null;
    return;
  }

  const x = state.tooltip.x;
  const y = state.tooltip.y;
  const alpha = Math.min(1, state.tooltip.timer);

  ctx.save();
  ctx.globalAlpha = alpha;

  // Measure text
  ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, sans-serif';
  const textWidth = ctx.measureText(gummy.label).width;
  const cardW = textWidth + 24;
  const cardH = 32;

  // Background card
  ctx.fillStyle = 'rgba(20, 20, 30, 0.95)';
  ctx.beginPath();
  ctx.roundRect(x - cardW / 2, y - cardH / 2, cardW, cardH, 6);
  ctx.fill();

  // Border
  ctx.strokeStyle = gummy.color;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Text
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(gummy.label, x, y);

  ctx.restore();
}

// Sprint 12: Evolution visuals

function drawEvolutionAura(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, r: number,
  breathPhase: number, stage: EvolutionStage
) {
  const layers = stage === 4 ? 3 : 2;
  for (let i = 0; i < layers; i++) {
    const phase = breathPhase + i * 0.8;
    const auraR = r * (2.8 + i * 0.6) * (1 + Math.sin(phase) * 0.06);
    const alpha = (0.03 - i * 0.008) * (1 + Math.sin(phase) * 0.5);
    const color = stage === 4 ? '#ffd700' : '#00ccff';

    ctx.fillStyle = colorWithAlpha(color, Math.max(0, alpha));
    ctx.beginPath();
    ctx.arc(x, y, auraR, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawInnerRings(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, r: number,
  breathPhase: number, stage: EvolutionStage
) {
  const ringCount = stage >= 3 ? 3 : 1;
  ctx.save();
  ctx.translate(x, y);

  for (let i = 0; i < ringCount; i++) {
    const ringR = r * (1.15 + i * 0.15);
    const alpha = (0.15 - i * 0.03) * (0.7 + Math.sin(breathPhase * 2 + i) * 0.3);
    const rotation = breathPhase * (0.3 + i * 0.15) * (i % 2 === 0 ? 1 : -1);

    ctx.save();
    ctx.rotate(rotation);

    const color = stage === 4 ? '#ffd700' : '#00dcff';
    ctx.strokeStyle = colorWithAlpha(color, alpha);
    ctx.lineWidth = 1.5;

    // Dashed ring with varying dash pattern per stage
    const dashLen = stage >= 3 ? 6 + i * 3 : 12;
    const gapLen = stage >= 3 ? 8 + i * 4 : 20;
    ctx.setLineDash([dashLen, gapLen]);
    ctx.beginPath();
    ctx.arc(0, 0, ringR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.restore();
  }

  // Stage 2+: Orbital dots
  const dotCount = stage >= 3 ? 6 : 3;
  for (let i = 0; i < dotCount; i++) {
    const angle = (Math.PI * 2 * i) / dotCount + breathPhase * 0.5;
    const dist = r * 1.2;
    const dotX = Math.cos(angle) * dist;
    const dotY = Math.sin(angle) * dist;
    const pulse = 0.4 + Math.sin(breathPhase * 3 + i * 1.2) * 0.6;

    const color = stage === 4 ? '#ffd700' : '#00dcff';
    ctx.fillStyle = colorWithAlpha(color, 0.3 * pulse);
    ctx.beginPath();
    ctx.arc(dotX, dotY, 2 + pulse, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawCrownHalo(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, r: number,
  breathPhase: number, stage: EvolutionStage
) {
  ctx.save();
  ctx.translate(x, y);

  const haloR = r * 0.85;
  const haloY = -r * 0.75;
  const float = Math.sin(breathPhase * 1.5) * 3;

  if (stage === 4) {
    // Legendary: golden crown with 5 points
    const crownY = haloY + float - 5;
    const crownW = r * 0.7;
    const crownH = r * 0.3;

    ctx.fillStyle = 'rgba(255, 215, 0, 0.7)';
    ctx.beginPath();
    ctx.moveTo(-crownW, crownY + crownH);
    for (let i = 0; i < 5; i++) {
      const px = -crownW + (crownW * 2 * (i + 0.5)) / 5;
      ctx.lineTo(px, crownY);
      if (i < 4) {
        const mx = -crownW + (crownW * 2 * (i + 1)) / 5;
        ctx.lineTo(mx, crownY + crownH * 0.6);
      }
    }
    ctx.lineTo(crownW, crownY + crownH);
    ctx.closePath();
    ctx.fill();

    // Crown gems
    for (let i = 0; i < 5; i++) {
      const px = -crownW + (crownW * 2 * (i + 0.5)) / 5;
      ctx.fillStyle = i % 2 === 0 ? 'rgba(255, 100, 100, 0.8)' : 'rgba(100, 200, 255, 0.8)';
      ctx.beginPath();
      ctx.arc(px, crownY + 3, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // Stage 3: Glowing halo ring
    const alpha = 0.25 + Math.sin(breathPhase * 2) * 0.1;

    ctx.strokeStyle = colorWithAlpha('#66eeff', alpha);
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(0, haloY + float, haloR, haloR * 0.25, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Halo glow
    ctx.strokeStyle = colorWithAlpha('#66eeff', alpha * 0.4);
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.ellipse(0, haloY + float, haloR, haloR * 0.25, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

function drawLegendaryField(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, r: number,
  breathPhase: number
) {
  // Rotating energy particles
  const count = 12;
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + breathPhase * 0.8;
    const dist = r * 1.8 + Math.sin(breathPhase * 2 + i * 0.7) * 15;
    const px = x + Math.cos(angle) * dist;
    const py = y + Math.sin(angle) * dist;
    const pulse = 0.3 + Math.sin(breathPhase * 4 + i * 1.5) * 0.7;
    const size = 1.5 + pulse * 2;

    ctx.fillStyle = `rgba(255, 215, 0, ${0.3 * pulse})`;
    ctx.beginPath();
    ctx.arc(px, py, size, 0, Math.PI * 2);
    ctx.fill();
  }

  // Secondary ring of smaller particles
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI * 2 * i) / 8 - breathPhase * 0.5;
    const dist = r * 2.3;
    const px = x + Math.cos(angle) * dist;
    const py = y + Math.sin(angle) * dist;
    const pulse = 0.5 + Math.sin(breathPhase * 3 + i) * 0.5;

    ctx.fillStyle = `rgba(255, 180, 50, ${0.15 * pulse})`;
    ctx.beginPath();
    ctx.arc(px, py, 1 + pulse, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawEvolutionTransition(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, r: number,
  transitionTimer: number, stage: EvolutionStage
) {
  // Flash: bright white expanding ring that fades
  const progress = 1 - transitionTimer / 2; // 0→1 over 2 seconds
  const earlyPhase = Math.min(1, progress * 4); // Quick initial flash (0-0.25s)
  const latePhase = Math.max(0, (progress - 0.2) / 0.8); // Slower fade

  // White flash
  if (earlyPhase < 1) {
    const flashAlpha = (1 - earlyPhase) * 0.6;
    ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha})`;
    ctx.beginPath();
    ctx.arc(x, y, r * (1 + earlyPhase * 2), 0, Math.PI * 2);
    ctx.fill();
  }

  // Expanding color ring
  const ringR = r * (1.5 + latePhase * 4);
  const ringAlpha = Math.max(0, 0.5 - latePhase * 0.6);
  const color = stage === 4 ? '#ffd700' : stage === 3 ? '#66eeff' : '#00ddff';

  ctx.strokeStyle = colorWithAlpha(color, ringAlpha);
  ctx.lineWidth = 3 - latePhase * 2;
  ctx.beginPath();
  ctx.arc(x, y, ringR, 0, Math.PI * 2);
  ctx.stroke();

  // Burst particles during early phase
  if (progress < 0.5) {
    const burstCount = 16;
    for (let i = 0; i < burstCount; i++) {
      const angle = (Math.PI * 2 * i) / burstCount;
      const dist = r * (1 + progress * 6);
      const px = x + Math.cos(angle) * dist;
      const py = y + Math.sin(angle) * dist;
      const alpha = Math.max(0, 0.8 - progress * 2);

      ctx.fillStyle = colorWithAlpha(color, alpha);
      ctx.beginPath();
      ctx.arc(px, py, 3 - progress * 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// Sprint 11: Connector status
function drawConnectorStatus(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const connectors = [
    { name: 'Gmail', icon: '📧', x: width / 2 - 80 },
    { name: 'Calendar', icon: '📅', x: width / 2 },
    { name: 'News', icon: '📰', x: width / 2 + 80 },
  ];

  const y = height - 50;

  for (const conn of connectors) {
    ctx.save();
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(conn.icon, conn.x, y);

    // Syncing indicator (pulsing dot)
    const pulse = Math.sin(performance.now() / 500) * 0.5 + 0.5;
    ctx.fillStyle = `rgba(68, 204, 102, ${0.4 + pulse * 0.6})`;
    ctx.beginPath();
    ctx.arc(conn.x + 15, y - 10, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
