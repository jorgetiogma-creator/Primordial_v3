export type UiSoundEffect =
  | 'send'
  | 'receive'
  | 'voiceJoin'
  | 'voiceLeave'
  | 'mute'
  | 'unmute'
  | 'ping';

export type SoundboardClipId =
  | 'airhorn'
  | 'applause'
  | 'cricket'
  | 'rimshot'
  | 'trombone'
  | 'quack';

export const SOUNDBOARD_CLIPS: {
  id: SoundboardClipId;
  label: string;
  emoji: string;
  accent: string;
}[] = [
  { id: 'airhorn', label: 'Bocina', emoji: '📣', accent: '#f23f43' },
  { id: 'applause', label: 'Aplausos', emoji: '👏', accent: '#23a55a' },
  { id: 'cricket', label: 'Grillos', emoji: '🦗', accent: '#f0b232' },
  { id: 'rimshot', label: 'Redoble', emoji: '🥁', accent: '#5865F2' },
  { id: 'trombone', label: 'Fail', emoji: '🎺', accent: '#eb459e' },
  { id: 'quack', label: 'Cuac', emoji: '🦆', accent: '#38bdf8' },
];

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (typeof window === 'undefined') return null;
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    if (!sharedAudioCtx) {
      sharedAudioCtx = new Ctx();
    }
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => undefined);
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

function playTone(
  ctx: AudioContext,
  freq: number,
  duration: number,
  startTime: number,
  type: OscillatorType = 'sine',
  gainPeak = 0.08,
  endFreq?: number
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);
  if (endFreq !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(30, endFreq), startTime + duration);
  }
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(gainPeak, startTime + Math.min(0.02, duration * 0.2));
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.02);
}

export function triggerHaptic(ms = 12): void {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(ms);
    }
  } catch {
    // Ignore unsupported vibration environments
  }
}

export function playUiSound(effect: UiSoundEffect, enabled = true): void {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    switch (effect) {
      case 'send':
        playTone(ctx, 520, 0.08, now, 'sine', 0.06, 720);
        break;
      case 'receive':
        playTone(ctx, 640, 0.09, now, 'triangle', 0.06);
        playTone(ctx, 880, 0.11, now + 0.07, 'triangle', 0.05);
        break;
      case 'ping':
        playTone(ctx, 740, 0.09, now, 'sine', 0.08);
        playTone(ctx, 988, 0.14, now + 0.08, 'sine', 0.07);
        break;
      case 'voiceJoin':
        playTone(ctx, 440, 0.1, now, 'sine', 0.07);
        playTone(ctx, 587, 0.1, now + 0.08, 'sine', 0.07);
        playTone(ctx, 784, 0.14, now + 0.16, 'sine', 0.06);
        break;
      case 'voiceLeave':
        playTone(ctx, 620, 0.1, now, 'sine', 0.07);
        playTone(ctx, 415, 0.14, now + 0.08, 'sine', 0.06);
        break;
      case 'mute':
        playTone(ctx, 460, 0.07, now, 'triangle', 0.07, 300);
        break;
      case 'unmute':
        playTone(ctx, 360, 0.07, now, 'triangle', 0.07, 560);
        break;
    }
  } catch {
    // Ignore audio context autoplay errors
  }
}

export function playSoundboardClip(clipId: SoundboardClipId, enabled = true): void {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    switch (clipId) {
      case 'airhorn':
        playTone(ctx, 370, 0.22, now, 'sawtooth', 0.09);
        playTone(ctx, 466, 0.22, now, 'sawtooth', 0.07);
        playTone(ctx, 370, 0.32, now + 0.25, 'sawtooth', 0.09);
        playTone(ctx, 466, 0.32, now + 0.25, 'sawtooth', 0.07);
        break;
      case 'applause':
        [0, 0.06, 0.11, 0.17, 0.23, 0.29, 0.35].forEach((offset, idx) => {
          playTone(ctx, 220 + (idx % 3) * 140, 0.045, now + offset, 'square', 0.035);
        });
        break;
      case 'cricket':
        [0, 0.08, 0.16, 0.36, 0.44, 0.52].forEach((offset) => {
          playTone(ctx, 3200, 0.04, now + offset, 'sine', 0.045, 3600);
        });
        break;
      case 'rimshot':
        playTone(ctx, 180, 0.07, now, 'triangle', 0.09, 90);
        playTone(ctx, 210, 0.07, now + 0.11, 'triangle', 0.09, 100);
        playTone(ctx, 980, 0.28, now + 0.22, 'sawtooth', 0.06, 620);
        break;
      case 'trombone':
        playTone(ctx, 392, 0.22, now, 'sawtooth', 0.07);
        playTone(ctx, 370, 0.22, now + 0.23, 'sawtooth', 0.07);
        playTone(ctx, 349, 0.22, now + 0.46, 'sawtooth', 0.07);
        playTone(ctx, 330, 0.45, now + 0.69, 'sawtooth', 0.07, 260);
        break;
      case 'quack':
        playTone(ctx, 480, 0.12, now, 'sawtooth', 0.08, 310);
        playTone(ctx, 510, 0.14, now + 0.15, 'sawtooth', 0.08, 290);
        break;
    }
  } catch {
    // Ignore audio context errors
  }
}

export interface VoiceEntryEffectMeta {
  id: 'none' | 'arcade-chime' | 'cyber-warp' | 'aurora-bloom' | 'bass-drop';
  label: string;
  description: string;
  accent: string;
  emoji: string;
}

export const VOICE_ENTRY_EFFECTS: VoiceEntryEffectMeta[] = [
  {
    id: 'none',
    label: 'Estándar',
    description: 'Tono clásico al entrar a una sala de voz.',
    accent: '#949ba4',
    emoji: '🔊',
  },
  {
    id: 'arcade-chime',
    label: 'Chime Arcade',
    description: 'Acorde ascendente retro estilo consola.',
    accent: '#f59e0b',
    emoji: '🕹️',
  },
  {
    id: 'cyber-warp',
    label: 'Cyber Warp',
    description: 'Destello futurista de neón sintético.',
    accent: '#06b6d4',
    emoji: '⚡',
  },
  {
    id: 'aurora-bloom',
    label: 'Aurora Bloom',
    description: 'Acorde cristalino envolvente lavanda.',
    accent: '#a855f7',
    emoji: '✨',
  },
  {
    id: 'bass-drop',
    label: 'Impacto Bass',
    description: 'Pulso grave con remate brillante.',
    accent: '#ef4444',
    emoji: '🎧',
  },
];

export function playVoiceEntryEffect(
  effectId: VoiceEntryEffectMeta['id'] | undefined,
  enabled = true
): void {
  if (!enabled) return;
  if (!effectId || effectId === 'none') {
    playUiSound('voiceJoin', enabled);
    return;
  }
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    switch (effectId) {
      case 'arcade-chime':
        playTone(ctx, 523.25, 0.08, now, 'square', 0.055);
        playTone(ctx, 659.25, 0.08, now + 0.07, 'square', 0.055);
        playTone(ctx, 783.99, 0.09, now + 0.14, 'square', 0.055);
        playTone(ctx, 1046.5, 0.18, now + 0.22, 'triangle', 0.07);
        break;
      case 'cyber-warp':
        playTone(ctx, 260, 0.16, now, 'sawtooth', 0.055, 880);
        playTone(ctx, 520, 0.14, now + 0.09, 'sine', 0.06, 1320);
        playTone(ctx, 1180, 0.16, now + 0.21, 'triangle', 0.055);
        break;
      case 'aurora-bloom':
        playTone(ctx, 440, 0.22, now, 'sine', 0.06);
        playTone(ctx, 554.37, 0.22, now + 0.05, 'sine', 0.055);
        playTone(ctx, 659.25, 0.24, now + 0.11, 'triangle', 0.055);
        playTone(ctx, 880, 0.28, now + 0.17, 'sine', 0.06);
        break;
      case 'bass-drop':
        playTone(ctx, 175, 0.24, now, 'sawtooth', 0.08, 55);
        playTone(ctx, 90, 0.2, now + 0.08, 'sine', 0.09, 48);
        playTone(ctx, 680, 0.14, now + 0.22, 'triangle', 0.055, 920);
        break;
    }
  } catch {
    // Ignore audio context errors
  }
}

