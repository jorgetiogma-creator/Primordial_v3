import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { PrimordialAppIcon } from './DiscordArt';

interface PrimordialSplashScreenProps {
  onFinish: () => void;
}

const EMBER_PARTICLES = [
  { id: 1, left: '16%', top: '72%', size: 3, delay: 0.1, duration: 2.8, tint: 'bg-amber-300' },
  { id: 2, left: '28%', top: '64%', size: 2, delay: 0.4, duration: 2.5, tint: 'bg-orange-400' },
  { id: 3, left: '38%', top: '76%', size: 3.5, delay: 0.2, duration: 3.0, tint: 'bg-amber-200' },
  { id: 4, left: '52%', top: '68%', size: 2.5, delay: 0.5, duration: 2.6, tint: 'bg-orange-300' },
  { id: 5, left: '65%', top: '74%', size: 3, delay: 0.15, duration: 2.9, tint: 'bg-amber-400' },
  { id: 6, left: '78%', top: '62%', size: 2, delay: 0.35, duration: 2.4, tint: 'bg-white' },
  { id: 7, left: '22%', top: '34%', size: 2, delay: 0.25, duration: 2.7, tint: 'bg-amber-200' },
  { id: 8, left: '74%', top: '36%', size: 2.5, delay: 0.45, duration: 2.8, tint: 'bg-orange-300' },
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
      {/* Fondo negro profundo con halo radial cálido y sutil */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_44%,rgba(249,115,22,0.16)_0%,rgba(168,85,247,0.06)_34%,rgba(0,0,0,1)_72%)]"
      />

      {/* Líneas orbitales finas */}
      <motion.svg
        aria-hidden="true"
        viewBox="0 0 400 400"
        initial={{ opacity: 0, scale: 0.85, rotate: -14 }}
        animate={{ opacity: 0.45, scale: 1, rotate: 18 }}
        transition={{ duration: 2.5, ease: 'easeOut' }}
        className="absolute w-[340px] h-[340px] sm:w-[460px] sm:h-[460px] pointer-events-none"
      >
        <defs>
          <linearGradient id="primordialRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#f97316" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0.45" />
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
        <circle cx="200" cy="44" r="3" fill="#fbbf24" />
        <circle cx="335" cy="278" r="2.2" fill="#f97316" />
      </motion.svg>

      {/* Partículas doradas ascendentes */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden">
        {EMBER_PARTICLES.map((p) => (
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
            className="absolute -inset-4 rounded-[36px] bg-gradient-to-tr from-[#5865F2]/30 via-indigo-400/15 to-amber-300/15 blur-2xl"
          />
          <PrimordialAppIcon className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-[28px] shadow-[0_24px_70px_rgba(88,101,242,0.42)] ring-1 ring-white/25" />
        </motion.div>

        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 0.75, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="w-28 h-[1px] bg-gradient-to-r from-transparent via-amber-300/80 to-transparent mb-6"
        />

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="font-sakura text-3xl sm:text-5xl font-extrabold tracking-tight text-balance leading-[1.12] bg-gradient-to-b from-white via-[#fff5e4] to-[#f4bd76] bg-clip-text text-transparent drop-shadow-[0_4px_26px_rgba(249,115,22,0.22)]"
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

        {/* Barra de entrada sutil */}
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
              className="w-full h-full origin-left bg-gradient-to-r from-amber-300 via-orange-400 to-amber-200"
            />
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onFinish();
            }}
            className="min-h-[44px] px-5 text-xs font-medium text-zinc-400 hover:text-amber-200 transition-colors cursor-pointer"
          >
            Toca para entrar
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
};
