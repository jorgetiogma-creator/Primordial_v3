import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { PrimordialAppIcon } from './DiscordArt';

interface PrimordialSplashScreenProps {
  onFinish: () => void;
}

const PURPLE_PARTICLES = [
  { id: 1, left: '16%', top: '72%', size: 3, delay: 0.1, duration: 2.8, tint: 'bg-purple-300/85' },
  { id: 2, left: '28%', top: '64%', size: 2, delay: 0.4, duration: 2.5, tint: 'bg-violet-400/80' },
  { id: 3, left: '38%', top: '76%', size: 3.5, delay: 0.2, duration: 3.0, tint: 'bg-purple-200/80' },
  { id: 4, left: '52%', top: '68%', size: 2.5, delay: 0.5, duration: 2.6, tint: 'bg-violet-300/80' },
  { id: 5, left: '65%', top: '74%', size: 3, delay: 0.15, duration: 2.9, tint: 'bg-purple-400/80' },
  { id: 6, left: '78%', top: '62%', size: 2, delay: 0.35, duration: 2.4, tint: 'bg-white/75' },
  { id: 7, left: '22%', top: '34%', size: 2, delay: 0.25, duration: 2.7, tint: 'bg-purple-200/75' },
  { id: 8, left: '74%', top: '36%', size: 2.5, delay: 0.45, duration: 2.8, tint: 'bg-violet-300/75' },
];

export const PrimordialSplashScreen: React.FC<PrimordialSplashScreenProps> = ({ onFinish }) => {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      onFinish();
    }, 2700);
    return () => window.clearTimeout(timer);
  }, [onFinish]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      onClick={onFinish}
      className="fixed inset-0 z-[220] bg-[#000000] text-white flex flex-col items-center justify-center px-6 overflow-hidden select-none cursor-pointer"
      role="dialog"
      aria-label="Bienvenida a Primordial"
    >
      {/* Fondo negro profundo con halo morado simple y elegante */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_44%,rgba(139,92,246,0.18)_0%,rgba(88,101,242,0.07)_34%,rgba(0,0,0,1)_72%)]"
      />

      {/* Líneas orbitales finas moradas */}
      <motion.svg
        aria-hidden="true"
        viewBox="0 0 400 400"
        initial={{ opacity: 0, scale: 0.85, rotate: -14 }}
        animate={{ opacity: 0.42, scale: 1, rotate: 18 }}
        transition={{ duration: 2.5, ease: 'easeOut' }}
        className="absolute w-[340px] h-[340px] sm:w-[460px] sm:h-[460px] pointer-events-none"
      >
        <defs>
          <linearGradient id="primordialRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c084fc" stopOpacity="0.65" />
            <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.45" />
          </linearGradient>
        </defs>
        <circle
          cx="200"
          cy="200"
          r="156"
          fill="none"
          stroke="url(#primordialRingGrad)"
          strokeWidth="1"
          strokeDasharray="6 10"
        />
        <circle
          cx="200"
          cy="200"
          r="182"
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="0.75"
        />
        <circle cx="200" cy="44" r="3" fill="#c084fc" />
        <circle cx="335" cy="278" r="2.2" fill="#8b5cf6" />
      </motion.svg>

      {/* Partículas sutiles moradas ascendentes */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden">
        {PURPLE_PARTICLES.map((p) => (
          <motion.span
            key={p.id}
            initial={{ opacity: 0, y: 18, scale: 0.6 }}
            animate={{ opacity: [0, 0.85, 0], y: -56, scale: [0.6, 1.15, 0.7] }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Infinity,
              ease: 'easeOut',
            }}
            style={{ left: p.left, top: p.top, width: p.size, height: p.size }}
            className={`absolute rounded-full ${p.tint}`}
          />
        ))}
      </div>

      {/* Bloque central */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.78, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative mb-7"
        >
          <div
            aria-hidden="true"
            className="absolute -inset-4 rounded-[36px] bg-gradient-to-tr from-[#8b5cf6]/30 via-[#5865F2]/20 to-purple-300/15 blur-2xl"
          />
          <PrimordialAppIcon className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-[28px] shadow-[0_24px_70px_rgba(139,92,246,0.42)] ring-1 ring-white/25" />
        </motion.div>

        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 0.75, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="w-28 h-[1px] bg-gradient-to-r from-transparent via-purple-400/80 to-transparent mb-6"
        />

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-balance leading-[1.12] bg-gradient-to-b from-white via-purple-100 to-purple-300 bg-clip-text text-transparent drop-shadow-[0_4px_26px_rgba(139,92,246,0.28)]"
        >
          Bienvenido a Primordial
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.48, ease: [0.16, 1, 0.3, 1] }}
          className="mt-3 text-sm sm:text-base text-zinc-400 font-medium tracking-wide text-balance"
        >
          Tu espacio de voz, video, salas y amigos en tiempo real
        </motion.p>

        {/* Barra de entrada morada simple */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="mt-9 flex flex-col items-center gap-3 w-48"
        >
          <div className="w-full h-[2px] rounded-full bg-white/10 overflow-hidden">
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 2.05, delay: 0.55, ease: 'easeInOut' }}
              className="w-full h-full origin-left bg-gradient-to-r from-violet-500 via-purple-400 to-indigo-300"
            />
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onFinish();
            }}
            className="min-h-[44px] px-5 text-xs font-medium text-zinc-400 hover:text-purple-300 transition-colors cursor-pointer"
          >
            Toca para entrar
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
};
