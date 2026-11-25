import React from 'react';
import { DisplayNameColorPreset, DisplayNameStyle } from '../types/discord';

export interface DisplayNameFontOption {
  id: DisplayNameStyle;
  label: string;
  desc: string;
}

export const DISPLAY_NAME_FONT_OPTIONS: DisplayNameFontOption[] = [
  { id: 'shinobi', label: 'Impacto Urbano', desc: 'Trazos afilados y estilo moderno' },
  { id: 'gothic', label: 'Gótica / Medieval', desc: 'Caligrafía oscura tipo rawr' },
  { id: 'neon', label: 'Neón Cibernético', desc: 'Estilo limpio con resplandor' },
  { id: 'sakura', label: 'Imperial Serif', desc: 'Elegante con contraste real' },
  { id: 'retro', label: 'Retro Arcade', desc: 'Monoespaciado clásico' },
  { id: 'default', label: 'Predeterminada', desc: 'Fuente oficial de Discord' },
];

export interface DisplayNameColorOption {
  id: DisplayNameColorPreset;
  label: string;
  colors: [string, string];
  glowColor: string;
  nitroOnly: boolean;
}

export const DISPLAY_NAME_COLOR_OPTIONS: DisplayNameColorOption[] = [
  {
    id: 'none',
    label: 'Original',
    colors: ['#ffffff', '#e4e4e7'],
    glowColor: 'rgba(255,255,255,0)',
    nitroOnly: false,
  },
  {
    id: 'crimson-cyan',
    label: 'Carmesí & Cian',
    colors: ['#ef233c', '#06b6d4'],
    glowColor: 'rgba(6, 182, 212, 0.72)',
    nitroOnly: true,
  },
  {
    id: 'nitro-sunset',
    label: 'Pulso Nitro',
    colors: ['#f472b6', '#8b5cf6'],
    glowColor: 'rgba(244, 114, 182, 0.75)',
    nitroOnly: true,
  },
  {
    id: 'cyber-neon',
    label: 'Neón Eléctrico',
    colors: ['#22d3ee', '#3b82f6'],
    glowColor: 'rgba(34, 211, 238, 0.8)',
    nitroOnly: true,
  },
  {
    id: 'infernal-gold',
    label: 'Fuego Dorado',
    colors: ['#f97316', '#facc15'],
    glowColor: 'rgba(249, 115, 22, 0.75)',
    nitroOnly: true,
  },
  {
    id: 'emerald-pulse',
    label: 'Esmeralda Cyber',
    colors: ['#4ade80', '#2dd4bf'],
    glowColor: 'rgba(74, 222, 128, 0.75)',
    nitroOnly: true,
  },
  {
    id: 'amethyst-prism',
    label: 'Prisma Amatista',
    colors: ['#c084fc', '#fb7185'],
    glowColor: 'rgba(192, 132, 252, 0.78)',
    nitroOnly: true,
  },
];

export function getDisplayNameStyleClass(style?: DisplayNameStyle): string {
  switch (style) {
    case 'shinobi':
      return 'font-shinobi';
    case 'gothic':
      return 'font-gothic';
    case 'neon':
      return 'font-neon';
    case 'sakura':
      return 'font-sakura';
    case 'retro':
      return 'font-retro';
    default:
      return 'font-display font-extrabold';
  }
}

function hexLuminance(hex: string): number {
  const clean = hex.trim().replace('#', '');
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return 128;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function resolveCustomGlowColor(pair: [string, string]): string {
  const lum0 = hexLuminance(pair[0]);
  const lum1 = hexLuminance(pair[1]);
  const brightest = lum0 >= lum1 ? pair[0] : pair[1];
  const maxLum = Math.max(lum0, lum1);
  if (maxLum < 38) {
    return 'rgba(239, 68, 68, 0.78)';
  }
  return `${brightest.trim()}dd`;
}

export function getDisplayNameTextPresentation(options: {
  style?: DisplayNameStyle;
  colorPreset?: DisplayNameColorPreset;
  customColors?: [string, string];
  glow?: boolean;
  nitroUnlocked?: boolean;
  fallbackColor?: string;
}): {
  className: string;
  style: React.CSSProperties;
} {
  const {
    style = 'default',
    colorPreset = 'none',
    customColors = ['#ef233c', '#06b6d4'],
    glow = true,
    nitroUnlocked = true,
    fallbackColor,
  } = options;

  const fontClass = getDisplayNameStyleClass(style);

  if (!nitroUnlocked) {
    return {
      className: `${fontClass} ${style === 'neon' && !fallbackColor ? 'text-sky-300' : ''}`.trim(),
      style: fallbackColor ? { color: fallbackColor } : {},
    };
  }

  if (!colorPreset || colorPreset === 'none') {
    return {
      className: `${fontClass} ${style === 'neon' && !fallbackColor ? 'text-sky-300' : ''}`.trim(),
      style: {
        ...(fallbackColor ? { color: fallbackColor } : {}),
        ...(glow
          ? {
              textShadow:
                '0 0 12px rgba(168, 85, 247, 0.9), 0 0 24px rgba(88, 101, 242, 0.65)',
            }
          : {}),
      },
    };
  }

  let pair: [string, string] = customColors;
  let glowColor = resolveCustomGlowColor(customColors);

  if (colorPreset !== 'custom') {
    const found = DISPLAY_NAME_COLOR_OPTIONS.find((p) => p.id === colorPreset);
    if (found) {
      pair = found.colors;
      glowColor = found.glowColor;
    }
  }

  const primaryGlow = hexLuminance(pair[0]) >= 38 ? pair[0] : glowColor;

  return {
    className: `${fontClass} dc-name-glow-shimmer bg-clip-text text-transparent`.trim(),
    style: {
      display: 'inline-block',
      maxWidth: '100%',
      backgroundImage: `linear-gradient(90deg, ${pair[0]} 0%, ${pair[1]} 55%, ${pair[0]} 100%)`,
      backgroundClip: 'text',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      color: 'transparent',
      textShadow: 'none',
      filter: glow
        ? `drop-shadow(0 0 12px ${glowColor}) drop-shadow(0 0 4px ${primaryGlow}) drop-shadow(0 1px 2px rgba(0,0,0,0.85))`
        : 'drop-shadow(0 1px 2px rgba(0,0,0,0.75))',
    },
  };
}
