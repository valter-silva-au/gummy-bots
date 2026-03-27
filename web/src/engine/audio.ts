let audioCtx: AudioContext | null = null;

function getContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

// Satisfying bubble pop — ASMR-style
export function playPopSound(pitch: number = 1) {
  const ctx = getContext();
  if (ctx.state === 'suspended') ctx.resume();

  const now = ctx.currentTime;

  // Two-tone pop: high attack + low thud
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  const gain2 = ctx.createGain();

  // High bubble pop
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(800 * pitch, now);
  osc1.frequency.exponentialRampToValueAtTime(200 * pitch, now + 0.15);
  gain1.gain.setValueAtTime(0.3, now);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

  // Low thud for body
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(150 * pitch, now);
  osc2.frequency.exponentialRampToValueAtTime(60, now + 0.2);
  gain2.gain.setValueAtTime(0.2, now);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

  // Noise burst for texture
  const noiseLen = 0.08;
  const buffer = ctx.createBuffer(1, ctx.sampleRate * noiseLen, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (data.length * 0.3));
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.08, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + noiseLen);

  // Bandpass the noise for warmth
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 2000;
  filter.Q.value = 1;

  osc1.connect(gain1).connect(ctx.destination);
  osc2.connect(gain2).connect(ctx.destination);
  noise.connect(filter).connect(noiseGain).connect(ctx.destination);

  osc1.start(now);
  osc2.start(now);
  noise.start(now);
  osc1.stop(now + 0.2);
  osc2.stop(now + 0.25);
  noise.stop(now + noiseLen);
}

// Soft whoosh for dismiss
export function playDismissSound() {
  const ctx = getContext();
  if (ctx.state === 'suspended') ctx.resume();

  const now = ctx.currentTime;

  const noiseLen = 0.3;
  const buffer = ctx.createBuffer(1, ctx.sampleRate * noiseLen, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    const t = i / data.length;
    data[i] = (Math.random() * 2 - 1) * Math.sin(t * Math.PI) * 0.3;
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(3000, now);
  filter.frequency.exponentialRampToValueAtTime(500, now + noiseLen);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.1, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + noiseLen);

  noise.connect(filter).connect(gain).connect(ctx.destination);
  noise.start(now);
  noise.stop(now + noiseLen);
}

// Subtle click for UI interactions
export function playClickSound() {
  const ctx = getContext();
  if (ctx.state === 'suspended') ctx.resume();

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(1200, now);
  osc.frequency.exponentialRampToValueAtTime(800, now + 0.03);
  gain.gain.setValueAtTime(0.1, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

  osc.connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.05);
}
