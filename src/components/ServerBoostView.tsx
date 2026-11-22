import React, { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Headphones,
  Heart,
  HelpCircle,
  LayoutGrid,
  Link2,
  MonitorPlay,
  Settings,
  Shield,
  Smile,
  Sparkles,
  Star,
  Sticker,
  Upload,
  Volume2,
  X,
} from 'lucide-react';
import { Server, UserProfile } from '../types/discord';
import {
  GENERATED_ASSETS,
  OrbsCrystalIcon,
  SafeImage,
  ServerIconArt,
} from './DiscordArt';

interface ServerBoostViewProps {
  servers: Server[];
  user: UserProfile;
  initialServerId?: string | null;
  onBack: () => void;
  onBoostServer: (serverId: string, amount: number, orbCost: number) => void;
  onUnlockServerPerk: (serverId: string, perkId: string, tagLabel?: string) => void;
  onOpenNitro: () => void;
}

export const BoostGemIcon: React.FC<{ className?: string; muted?: boolean }> = ({
  className = 'w-5 h-5',
  muted = false,
}) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    {muted ? (
      <path
        d="M12 2L5 7.5v9L12 22l7-5.5v-9L12 2zm0 3.2l4.5 3.6v6.4L12 18.8l-4.5-3.6V8.8L12 5.2z"
        fill="currentColor"
        opacity="0.45"
      />
    ) : (
      <>
        <polygon points="12,2 19,7.5 19,16.5 12,22 5,16.5 5,7.5" fill="#e879f9" />
        <polygon points="12,5.5 16,8.8 16,15.2 12,18.5 8,15.2 8,8.8" fill="#fdf4ff" opacity="0.7" />
        <polygon points="12,2 12,5.5 8,8.8 5,7.5" fill="#f472b6" />
        <path d="M19 3l.8 2.2L22 6l-2.2.8L19 9l-.8-2.2L16 6l2.2-.8z" fill="#f0abfc" />
      </>
    )}
  </svg>
);

const LEVEL_CARDS = [
  {
    level: 1,
    requiredBoosts: 1,
    perks: [
      { icon: LayoutGrid, text: 'Banner del servidor (desbloqueado con 1 mejora)' },
      { icon: Smile, text: '100 ranuras de emojis personalizados' },
      { icon: 'GIF' as const, text: 'Icono de servidor animado' },
      { icon: Volume2, text: 'Calidad de sonido de 128 kbps' },
    ],
    extraPerks: [
      '50 ranuras para stickers personalizados',
      'Diseños y fondos de chat personalizados',
      'Transmisión en 720p a 60 fps',
    ],
  },
  {
    level: 2,
    requiredBoosts: 5,
    perks: [
      { icon: MonitorPlay, text: 'Calidad de la transmisión de 1440p' },
      { icon: Upload, text: '50 MB subidas de archivos' },
      { icon: Smile, text: 'Iconos de rol personalizados' },
      { icon: LayoutGrid, text: 'Cartel del servidor animado' },
    ],
    extraPerks: [
      '150 ranuras totales de emojis',
      'Calidad de sonido de 256 kbps',
      '150 asientos en canales de escenario',
    ],
  },
  {
    level: 3,
    requiredBoosts: 14,
    perks: [
      { icon: Link2, text: 'Enlace de invitación al servidor personalizado' },
      { icon: Upload, text: '100 MB subidas de archivos' },
      { icon: Volume2, text: 'Calidad de sonido de 384 kbps' },
      { icon: 'GIF' as const, text: 'Icono y banner GIF animado' },
      { icon: Headphones, text: '300 asientos en el escenario de vídeo' },
    ],
    extraPerks: [
      '250 ranuras totales de emojis',
      '60 ranuras para stickers personalizados',
      'Estilos de rol mejorados ilimitados',
    ],
  },
];

export const ServerBoostView: React.FC<ServerBoostViewProps> = ({
  servers,
  user,
  initialServerId = null,
  onBack,
  onBoostServer,
  onUnlockServerPerk,
  onOpenNitro,
}) => {
  const [selectedServerId, setSelectedServerId] = useState<string | null>(initialServerId);
  const [showInfoSheet, setShowInfoSheet] = useState(false);
  const [showBoostModal, setShowBoostModal] = useState(false);
  const [expandedLevels, setExpandedLevels] = useState<Record<number, boolean>>({});
  const carouselRef = useRef<HTMLDivElement>(null);

  const selectedServer = selectedServerId
    ? servers.find((s) => s.id === selectedServerId) || null
    : null;

  const hasNitroDiscount = user.nitroTier === 'nitro';
  const singleBoostCost = hasNitroDiscount ? 700 : 1000;
  const doubleBoostCost = hasNitroDiscount ? 1400 : 2000;

  const scrollCarousel = (dir: -1 | 1) => {
    carouselRef.current?.scrollBy({ left: dir * 290, behavior: 'smooth' });
  };

  /* ---------------- 1. SERVER BOOST DETAIL VIEW (Screenshots 15–20) ---------------- */
  if (selectedServer) {
    const boosts = selectedServer.boostCount ?? 0;
    const level = selectedServer.boostLevel ?? 0;
    const unlockedPerks = selectedServer.unlockedPerkIds || [];
    const progressPct =
      boosts >= 14
        ? 100
        : boosts >= 5
        ? 66 + ((boosts - 5) / 9) * 34
        : boosts >= 1
        ? 33 + ((boosts - 1) / 4) * 33
        : 0;

    return (
      <div className="flex-1 flex flex-col h-full bg-[#111214] text-white relative overflow-hidden">
        {/* Top Header */}
        <header className="h-14 px-4 flex items-center justify-between bg-[#1c1d22] border-b border-white/10 shrink-0 z-20">
          <button
            onClick={() => setSelectedServerId(null)}
            aria-label="Volver a Mejora del servidor"
            className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center min-w-0 px-2">
            <h1 className="font-display font-bold text-[16px] leading-tight">
              Mejora del servidor
            </h1>
            <p className="text-[12px] text-zinc-400 truncate leading-tight">
              {selectedServer.name}
            </p>
          </div>

          <button
            onClick={() => setShowInfoSheet(true)}
            aria-label="Información de Server Boost"
            className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center cursor-pointer"
          >
            <Settings className="w-5 h-5 text-zinc-300" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto pb-28 bg-[#111214]">
          {/* Top Notice Banner */}
          <div className="bg-[#1c1d22] border-b border-white/10 px-4 py-2.5 text-center text-[12.5px] text-zinc-300 leading-snug">
            Con <strong className="text-pink-400">1 mejora</strong> desbloqueas el{' '}
            <strong className="text-white">Banner del servidor</strong>,{' '}
            <strong className="text-white">Estilos de rol</strong> y{' '}
            <strong className="text-white">Diseños de chat</strong>
          </div>

          {/* Dark Mode Hero with Subtle Pink/White Sparkles */}
          <div className="relative pt-8 pb-10 px-5 overflow-hidden bg-[#111214]">
            <div
              className="absolute inset-x-0 top-0 h-[300px] pointer-events-none"
              style={{
                background:
                  'radial-gradient(ellipse 115% 85% at 50% 0%, rgba(244, 114, 182, 0.16) 0%, rgba(255, 255, 255, 0.04) 48%, #111214 95%)',
              }}
            />
            {/* Decorative Sparkles & Floating Gems */}
            <Sparkles className="w-5 h-5 text-pink-300/75 absolute top-5 right-5 pointer-events-none" />
            <Sparkles className="w-4 h-4 text-white/60 absolute top-14 right-14 pointer-events-none" />
            <Sparkles className="w-4 h-4 text-pink-300/60 absolute top-28 left-4 pointer-events-none" />
            <div className="w-2.5 h-3.5 rounded-sm bg-pink-300/50 rotate-12 absolute top-9 left-6 pointer-events-none" />
            <div className="w-2.5 h-3.5 rounded-sm bg-white/40 -rotate-12 absolute top-32 left-20 pointer-events-none" />

            <div className="relative z-10 max-w-lg mx-auto text-center">
              <h2 className="font-display font-black text-[23px] sm:text-[26px] uppercase tracking-tight leading-[1.1] text-white">
                Mejora este servidor para desbloquear mejoras
              </h2>

              <div className="mt-6 flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-2xl border border-white/20">
                  <ServerIconArt server={selectedServer} />
                </div>
                <p className="font-display font-bold text-[15px] mt-2.5 text-white">
                  {selectedServer.name}
                </p>
                <div className="inline-flex items-center gap-1.5 text-[13px] text-zinc-200 mt-1 tabular-nums">
                  <BoostGemIcon className="w-4 h-4" />
                  <span>
                    {boosts === 0
                      ? 'Sin mejoras'
                      : `${boosts} ${boosts === 1 ? 'mejora' : 'mejoras'} · ${
                          level > 0 ? `Nivel ${level}` : 'Banner desbloqueado'
                        }`}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 space-y-2.5">
                <button
                  onClick={() => setShowBoostModal(true)}
                  className="w-full h-11 rounded-xl dc-btn-primary font-bold text-[14.5px] cursor-pointer shadow-lg"
                >
                  Mejora este servidor
                </button>
                <button
                  onClick={onOpenNitro}
                  className="w-full h-11 rounded-xl bg-[#111216] hover:bg-[#1a1b20] border border-white/10 font-bold text-[14px] text-white cursor-pointer transition-colors"
                >
                  Obtener Nitro
                </button>
              </div>
            </div>
          </div>

          {/* 4-Step Progress Track */}
          <div className="max-w-lg mx-auto px-5 pt-2 pb-6">
            <div className="relative flex items-start justify-between">
              <div className="absolute top-3.5 left-4 right-4 h-1.5 rounded-full bg-[#1a1b20]" />
              <div
                className="absolute top-3.5 left-4 h-1.5 rounded-full bg-gradient-to-r from-[#ff6be5] to-[#f43f5e] transition-all duration-500"
                style={{ width: `calc(${progressPct}% - 16px)` }}
              />

              {[
                { label: boosts > 0 ? `${boosts} mejoras` : 'Sin mejoras', active: true, min: 0 },
                { label: 'Nivel 1 (1)', active: level >= 1 || boosts >= 1, min: 1 },
                { label: 'Nivel 2 (5)', active: level >= 2, min: 5 },
                { label: 'Nivel 3 (14)', active: level >= 3, min: 14 },
              ].map((step, i) => (
                <div key={i} className="relative z-10 flex flex-col items-center w-16 text-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                      step.active
                        ? i === 0
                          ? 'bg-[#ff6be5] border-[#ff6be5] shadow-[0_0_16px_rgba(255,107,229,0.55)]'
                          : 'bg-[#1a111a] border-[#ff6be5]'
                        : 'bg-[#121318] border-white/15'
                    }`}
                  >
                    {i > 0 && <BoostGemIcon className="w-4 h-4" muted={!step.active} />}
                  </div>
                  <span
                    className={`text-[11px] mt-1.5 leading-tight ${
                      step.active ? 'text-white font-semibold' : 'text-zinc-500'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 3-Level Swipeable Perks Carousel */}
          <div className="relative max-w-2xl mx-auto px-4">
            <button
              onClick={() => scrollCarousel(-1)}
              aria-label="Nivel anterior"
              className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/65 hover:bg-black/85 border border-white/15 items-center justify-center cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => scrollCarousel(1)}
              aria-label="Siguiente nivel"
              className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/65 hover:bg-black/85 border border-white/15 items-center justify-center cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <div
              ref={carouselRef}
              className="flex gap-3.5 overflow-x-auto no-scrollbar snap-x snap-mandatory pt-3 pb-2"
            >
              {LEVEL_CARDS.map((card) => {
                const isUnlocked = boosts >= card.requiredBoosts;
                const isNextLevel = !isUnlocked && level + 1 === card.level;
                const expanded = !!expandedLevels[card.level];

                return (
                  <div
                    key={card.level}
                    className="w-[272px] sm:w-[290px] shrink-0 snap-center relative rounded-3xl p-5 pt-6 flex flex-col justify-between shadow-xl overflow-visible bg-[#101115] border border-white/10"
                  >
                    {isNextLevel && (
                      <span className="absolute -top-2.5 left-5 px-3 py-1 rounded-full bg-[#5865F2] border border-white/25 text-[10.5px] font-black tracking-wider uppercase text-white shadow-md">
                        TU SIGUIENTE NIVEL
                      </span>
                    )}
                    {isUnlocked && (
                      <span className="absolute -top-2.5 left-5 px-3 py-1 rounded-full bg-[#23a55a] border border-white/25 text-[10.5px] font-black tracking-wider uppercase text-white shadow-md inline-flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        <span>DESBLOQUEADO</span>
                      </span>
                    )}
                    {card.level === 3 && (
                      <Sparkles className="w-8 h-8 text-white/90 absolute -top-2 right-3 pointer-events-none" />
                    )}

                    <div>
                      <div className="flex items-baseline gap-2.5 mb-4">
                        <h3 className="font-display font-extrabold text-[26px] leading-none text-white">
                          Nivel {card.level}
                        </h3>
                        <span className="text-[13px] font-medium text-white/85 tabular-nums">
                          {card.requiredBoosts} mejoras
                        </span>
                      </div>

                      <ul className="space-y-3">
                        {card.perks.map((p, idx) => (
                          <li key={idx} className="flex items-start gap-2.5 text-[13.5px] font-medium text-white">
                            {p.icon === 'GIF' ? (
                              <span className="px-1 py-0.5 rounded bg-white text-[#5865F2] text-[9px] font-black leading-none mt-0.5 shrink-0">
                                GIF
                              </span>
                            ) : (
                              <p.icon className="w-4.5 h-4.5 text-white shrink-0 mt-0.5" />
                            )}
                            <span className="leading-snug">{p.text}</span>
                          </li>
                        ))}
                        {expanded &&
                          card.extraPerks.map((txt, idx) => (
                            <li
                              key={`ex-${idx}`}
                              className="flex items-start gap-2.5 text-[13px] text-white/95"
                            >
                              <Check className="w-4 h-4 text-emerald-200 shrink-0 mt-0.5" />
                              <span className="leading-snug">{txt}</span>
                            </li>
                          ))}
                      </ul>
                    </div>

                    <button
                      onClick={() =>
                        setExpandedLevels((prev) => ({
                          ...prev,
                          [card.level]: !prev[card.level],
                        }))
                      }
                      className="mt-5 inline-flex items-center gap-1.5 text-[13.5px] font-bold text-white/95 hover:text-white cursor-pointer w-fit"
                    >
                      <span>{expanded ? 'Mostrar menos' : 'Mostrar más'}</span>
                      {expanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mejora tu comunidad y obtén reconocimiento (2x2 Grid) */}
          <section className="max-w-lg mx-auto px-4 mt-8">
            <h3 className="font-display font-bold text-[20px] text-center leading-snug mb-4">
              Mejora tu comunidad y obtén reconocimiento
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  icon: <BoostGemIcon className="w-6 h-6" />,
                  text: 'Demuestra tu apoyo con un icono en la lista de miembros',
                },
                {
                  icon: <Sparkles className="w-6 h-6 text-[#f472b6]" />,
                  text: 'Desbloquea una insignia de perfil que evoluciona con el tiempo',
                },
                {
                  icon: <Shield className="w-6 h-6 text-[#f472b6]" />,
                  text: 'Consigue un rol exclusivo de usuario que mejora',
                },
                {
                  icon: <Heart className="w-6 h-6 text-[#f472b6] fill-[#f472b6]" />,
                  text: 'Dale apoyo a tu comunidad',
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl bg-[#1b1c22] border border-white/5 p-4 flex flex-col items-center text-center gap-2.5"
                >
                  {item.icon}
                  <p className="text-[12.5px] text-zinc-200 leading-snug font-medium">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Las mejores ventajas que puedes desbloquear con la mejora */}
          <section className="max-w-lg mx-auto px-4 mt-8">
            <h3 className="font-display font-bold text-[20px] text-center leading-snug mb-4">
              Las mejores ventajas que puedes desbloquear con la mejora
            </h3>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
              <div className="w-[290px] shrink-0 rounded-2xl bg-[#1b1c22] border border-white/10 p-4 space-y-3">
                <div className="h-36 rounded-xl bg-[#0e0f13] relative overflow-hidden border border-white/10">
                  <SafeImage
                    src={GENERATED_ASSETS.boostPerksShowcase}
                    alt="Ventajas de Mejora del servidor"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-fuchsia-600/80 border border-white/25 text-[10px] font-black text-white">
                    1440p · 60 FPS
                  </div>
                  <div className="absolute bottom-2.5 left-3 right-3 flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-black/65 border border-white/20 text-[10px] font-bold text-pink-200">
                      Audio 384 kbps
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-black/65 border border-white/20 text-[10px] font-bold text-sky-200">
                      HD Live
                    </span>
                  </div>
                </div>
                <div>
                  <p className="font-display font-bold text-[15px] text-white">
                    Transmisiones en HD
                  </p>
                  <p className="text-[12.5px] text-zinc-400 mt-0.5 leading-snug">
                    Apoya el acceso de tu servidor a transmisiones de alta calidad para todos.
                  </p>
                </div>
              </div>

              <div className="w-[245px] shrink-0 rounded-2xl bg-[#111216] border border-white/10 p-4 space-y-3">
                <div className="h-36 rounded-xl bg-[#070709] border border-white/10 overflow-hidden relative p-2 grid grid-cols-3 gap-1.5">
                  <div className="rounded-lg overflow-hidden relative border border-white/15">
                    <SafeImage src={GENERATED_ASSETS.shopGojoArt} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="rounded-lg overflow-hidden relative border border-white/15">
                    <SafeImage src={GENERATED_ASSETS.shopCromaArt} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="rounded-lg overflow-hidden relative border border-white/15">
                    <SafeImage src={GENERATED_ASSETS.shopGrabadoJapones} alt="" className="w-full h-full object-cover" />
                  </div>
                </div>
                <div>
                  <p className="font-display font-bold text-[15px] text-white">
                    Iconos y cartel épico
                  </p>
                  <p className="text-[12.5px] text-zinc-400 mt-0.5 leading-snug">
                    Personaliza roles, stickers animados y banner del servidor desde 1 mejora.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Mejoras del servidor — Individual Perks */}
          <section className="max-w-lg mx-auto px-4 mt-8 space-y-3.5">
            <div>
              <h3 className="font-display font-bold text-[19px] text-white">
                Mejoras del servidor
              </h3>
              <p className="text-[12.5px] text-zinc-400 mt-1 leading-snug">
                Ventajas individuales que se pueden desbloquear usando las mejoras disponibles.
              </p>
            </div>

            {/* Perk 0: Banner del servidor (Desbloqueado con 1 mejora) */}
            <div className="rounded-2xl bg-[#111216] border border-white/10 overflow-hidden">
              <div className="h-32 bg-[#070709] relative overflow-hidden">
                <SafeImage
                  src={selectedServer.bannerImage || GENERATED_ASSETS.zenithBanner}
                  alt="Banner del servidor HD"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#111216] via-black/25 to-transparent" />
                <span className="absolute bottom-2.5 left-3 px-2.5 py-1 rounded-full bg-black/65 backdrop-blur-xs border border-pink-400/35 text-xs font-bold text-pink-200 inline-flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Banner del servidor HD
                </span>
              </div>
              <div className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="font-display font-bold text-[16px] text-white">
                    Banner del servidor
                  </h4>
                  <p className="text-[12.5px] text-zinc-400 mt-0.5 leading-snug">
                    Pon una foto o banner personalizado en lo alto de tu servidor.
                  </p>
                  <p className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-pink-300 mt-2">
                    <BoostGemIcon className="w-3.5 h-3.5" />
                    <span>1 mejora</span>
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (boosts < 1) {
                      setShowBoostModal(true);
                    } else {
                      onUnlockServerPerk(selectedServer.id, 'server-banner');
                    }
                  }}
                  className={`px-3.5 py-2 rounded-full text-xs font-bold shrink-0 cursor-pointer ${
                    unlockedPerks.includes('server-banner') || boosts >= 1
                      ? 'dc-btn-success'
                      : 'bg-white/10 hover:bg-white/15 text-zinc-200'
                  }`}
                >
                  {boosts >= 1 ? 'Desbloqueado ✓' : 'Mejorar (1)'}
                </button>
              </div>
            </div>

            {/* Perk 1: Etiqueta del servidor (POLR / GGEZ) */}
            <div className="rounded-2xl bg-[#111216] border border-white/10 overflow-hidden">
              <div className="h-36 bg-[#070709] flex flex-col items-center justify-center gap-1.5 relative">
                <div className="px-3.5 py-1.5 rounded-xl bg-[#4f67f6] shadow-lg flex items-center gap-2 rotate-[3deg] translate-x-3 border-b-4 border-[#3141b8]">
                  <span className="text-sm">💠</span>
                  <span className="font-display font-black tracking-wider text-white text-base">
                    POLR
                  </span>
                </div>
                <div className="px-3.5 py-1.5 rounded-xl bg-[#e1308a] shadow-lg flex items-center gap-2 -rotate-[2deg] -translate-x-3 border-b-4 border-[#9d175a]">
                  <span className="text-sm">🩷</span>
                  <span className="font-display font-black tracking-wider text-white text-base">
                    GGEZ
                  </span>
                </div>
              </div>
              <div className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="font-display font-bold text-[16px] text-white">
                    Etiqueta del servidor
                  </h4>
                  <p className="text-[12.5px] text-zinc-400 mt-0.5 leading-snug">
                    Deja que tus miembros representen a tu servidor en todo Discord.
                  </p>
                  <p className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-zinc-300 mt-2">
                    <BoostGemIcon className="w-3.5 h-3.5" />
                    <span>3 mejoras</span>
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (boosts < 3) {
                      setShowBoostModal(true);
                    } else {
                      onUnlockServerPerk(selectedServer.id, 'tag-polr', 'POLR');
                    }
                  }}
                  className={`px-3.5 py-2 rounded-full text-xs font-bold shrink-0 cursor-pointer ${
                    unlockedPerks.includes('tag-polr')
                      ? 'dc-btn-success'
                      : boosts >= 3
                      ? 'dc-btn-primary'
                      : 'bg-white/10 hover:bg-white/15 text-zinc-200'
                  }`}
                >
                  {unlockedPerks.includes('tag-polr')
                    ? 'Activa ✓'
                    : boosts >= 3
                    ? 'Activar'
                    : 'Mejorar'}
                </button>
              </div>
            </div>

            {/* Perk 2: Paquetes de insignias de etiqueta de servidor (BORK / GOAT / STAR) */}
            <div className="rounded-2xl bg-[#111216] border border-white/10 overflow-hidden">
              <div className="h-36 bg-[#070709] flex flex-col items-center justify-center gap-2">
                <div className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-[#141519] border border-white/10 shadow-md">
                  <span className="text-sky-300 text-xs">💎</span>
                  <span className="font-display font-black text-white tracking-wider">BORK</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-lg bg-[#141519] border border-white/10 font-display font-black text-xs text-zinc-200">
                    💎 GOAT
                  </span>
                  <span className="px-3 py-1 rounded-lg bg-[#141519] border border-white/10 font-display font-black text-xs text-zinc-200">
                    ⭐ STAR
                  </span>
                </div>
              </div>
              <div className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="font-display font-bold text-[16px] text-white">
                    Paquetes de insignias de etiqueta de servidor
                  </h4>
                  <p className="text-[12.5px] text-zinc-400 mt-0.5 leading-snug">
                    Destaca con paquetes de insignias especiales y temáticas para tu etiqueta de
                    servidor.
                  </p>
                  <p className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-zinc-300 mt-2">
                    <BoostGemIcon className="w-3.5 h-3.5" />
                    <span>2+ mejoras</span>
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (boosts < 2) {
                      setShowBoostModal(true);
                    } else {
                      onUnlockServerPerk(selectedServer.id, 'badge-pack', 'GOAT');
                    }
                  }}
                  className={`px-3.5 py-2 rounded-full text-xs font-bold shrink-0 cursor-pointer ${
                    unlockedPerks.includes('badge-pack')
                      ? 'dc-btn-success'
                      : boosts >= 2
                      ? 'dc-btn-primary'
                      : 'bg-white/10 hover:bg-white/15 text-zinc-200'
                  }`}
                >
                  {unlockedPerks.includes('badge-pack')
                    ? 'Activo ✓'
                    : boosts >= 2
                    ? 'Activar'
                    : 'Mejorar'}
                </button>
              </div>
            </div>

            {/* Perk 3: Estilos de rol mejorados (Nelly glow) */}
            <div className="rounded-2xl bg-[#111216] border border-white/10 overflow-hidden">
              <div className="h-36 bg-[#070709] relative flex items-center justify-center gap-4 overflow-hidden">
                <SafeImage
                  src={GENERATED_ASSETS.shopCromaArt}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover opacity-25 blur-xs"
                />
                <div className="relative z-10 w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-fuchsia-600 p-0.5 shadow-[0_0_24px_rgba(244,114,182,0.55)] overflow-hidden">
                  <SafeImage
                    src={GENERATED_ASSETS.shopMiyabiArt}
                    alt="Role Showcase"
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
                <span className="relative z-10 font-display font-black text-3xl bg-gradient-to-r from-sky-300 via-purple-300 to-fuchsia-400 bg-clip-text text-transparent drop-shadow-[0_0_14px_rgba(168,85,247,0.85)]">
                  Nelly
                </span>
              </div>
              <div className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="font-display font-bold text-[16px] text-white">
                    Estilos de rol mejorados
                  </h4>
                  <p className="text-[12.5px] text-zinc-400 mt-0.5 leading-snug">
                    Haz que ciertos roles destaquen con gradientes animados y vivos.
                  </p>
                  <p className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-zinc-300 mt-2">
                    <BoostGemIcon className="w-3.5 h-3.5" />
                    <span>3 mejoras</span>
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (boosts < 3) {
                      setShowBoostModal(true);
                    } else {
                      onUnlockServerPerk(selectedServer.id, 'role-styles');
                    }
                  }}
                  className={`px-3.5 py-2 rounded-full text-xs font-bold shrink-0 cursor-pointer ${
                    unlockedPerks.includes('role-styles')
                      ? 'dc-btn-success'
                      : boosts >= 3
                      ? 'dc-btn-primary'
                      : 'bg-white/10 hover:bg-white/15 text-zinc-200'
                  }`}
                >
                  {unlockedPerks.includes('role-styles')
                    ? 'Activo ✓'
                    : boosts >= 3
                    ? 'Activar'
                    : 'Mejorar'}
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* Floating Bottom Sticky Pill Bar */}
        <div className="absolute bottom-4 inset-x-0 px-4 flex justify-center pointer-events-none z-20">
          <div className="pointer-events-auto w-full max-w-md rounded-full p-2 pl-2.5 flex items-center justify-between gap-3 shadow-2xl border border-white/15 bg-[#0f1014]/95 backdrop-blur-md">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 border border-white/25">
                <ServerIconArt server={selectedServer} />
              </div>
              <span className="font-display font-bold text-[15px] text-white truncate">
                {selectedServer.name}
              </span>
            </div>

            <button
              onClick={() => setShowBoostModal(true)}
              className="px-6 py-2 rounded-full dc-btn-primary text-[14px] font-bold shrink-0 cursor-pointer shadow-lg"
            >
              Mejora
            </button>
          </div>
        </div>

        {/* Confirm Server Boost Modal */}
        <AnimatePresence>
          {showBoostModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBoostModal(false)}
              className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-end md:items-center justify-center p-0 md:p-4"
            >
              <motion.div
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 30, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md bg-[#0c0d10] rounded-t-3xl md:rounded-3xl border border-white/15 p-5 space-y-4 shadow-2xl"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <BoostGemIcon className="w-6 h-6" />
                    <h3 className="font-display font-bold text-lg text-white">
                      Mejorar {selectedServer.name}
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowBoostModal(false)}
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="rounded-2xl bg-[#14151a] border border-white/10 p-3.5 flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-300">Tu saldo actual</span>
                  <span className="inline-flex items-center gap-1.5 text-sm font-bold text-white tabular-nums">
                    <OrbsCrystalIcon className="w-4 h-4 text-indigo-400" />
                    <span>{user.orbs.toLocaleString('es-ES')} Orbs</span>
                  </span>
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed">
                  Con solo <strong className="text-pink-300">1 mejora</strong> desbloquearás el{' '}
                  <strong className="text-white">Banner del servidor</strong>, la insignia{' '}
                  <strong className="text-pink-300">Mejora del servidor</strong> y niveles extra
                  para {selectedServer.name}.
                  {hasNitroDiscount && (
                    <span className="text-emerald-400 font-semibold">
                      {' '}
                      (30 % de descuento Nitro aplicado)
                    </span>
                  )}
                </p>

                <div className="grid grid-cols-1 gap-2.5">
                  <button
                    onClick={() => {
                      onBoostServer(selectedServer.id, 1, singleBoostCost);
                      setShowBoostModal(false);
                    }}
                    className="w-full p-3.5 rounded-2xl dc-btn-primary flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <BoostGemIcon className="w-5 h-5" />
                      <div className="text-left">
                        <p className="font-bold text-sm">Añadir +1 mejora</p>
                        <p className="text-[11px] text-indigo-100">
                          {boosts === 0
                            ? '¡Desbloquea Banner del servidor al instante!'
                            : `Total tras mejora: ${boosts + 1} mejoras`}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-extrabold tabular-nums">
                      ◈ {singleBoostCost.toLocaleString('es-ES')}
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      onBoostServer(selectedServer.id, 2, doubleBoostCost);
                      setShowBoostModal(false);
                    }}
                    className="w-full p-3.5 rounded-2xl bg-[#181920] hover:bg-[#22232b] border border-pink-400/35 text-white flex items-center justify-between cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      <Sparkles className="w-5 h-5" />
                      <div className="text-left">
                        <p className="font-bold text-sm">Paquete +2 mejoras</p>
                        <p className="text-[11px] text-fuchsia-100">
                          {boosts === 0
                            ? '¡Desbloquea el Nivel 1 al instante!'
                            : `Total tras mejora: ${boosts + 2} mejoras`}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-extrabold tabular-nums">
                      ◈ {doubleBoostCost.toLocaleString('es-ES')}
                    </span>
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  /* ---------------- 2. OVERVIEW SCREEN (Mejora del servidor - Screenshot 9 & 8) ---------------- */
  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--dc-bg-chat)] text-[var(--dc-text-primary)] relative overflow-hidden">
      {/* Header: ✕ 99  Mejora del servidor */}
      <header className="h-14 px-4 flex items-center justify-between border-b border-[var(--dc-border)] bg-[var(--dc-bg-chat)] shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            aria-label="Cerrar mejoras del servidor"
            className="relative w-9 h-9 rounded-full dc-btn-icon flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
            <span className="absolute -bottom-1 -right-1 px-1.5 py-[1px] rounded-full bg-[#da373c] text-white text-[10px] font-bold tabular-nums leading-tight border-2 border-[var(--dc-bg-chat)]">
              99
            </span>
          </button>
          <h1 className="font-display font-bold text-[19px]">Mejora del servidor</h1>
        </div>

        <button
          onClick={() => setShowInfoSheet(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full dc-btn-secondary text-xs font-semibold cursor-pointer"
        >
          <HelpCircle className="w-4 h-4 text-[#e879f9]" />
          <span>Info Boost</span>
        </button>
      </header>

      {/* Main Scrollable Server List + Nitro Banner */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-12">
        <div className="max-w-lg mx-auto space-y-3">
          {servers.map((srv) => {
            const boosts = srv.boostCount ?? 0;
            const lvl = srv.boostLevel ?? 0;
            return (
              <button
                key={srv.id}
                onClick={() => setSelectedServerId(srv.id)}
                className="w-full rounded-2xl bg-[var(--dc-bg-card)] hover:bg-[var(--dc-bg-elevated)] border border-[var(--dc-border)] p-4 flex items-center justify-between gap-3 transition-all cursor-pointer text-left shadow-xs"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-2xl overflow-hidden shrink-0 border border-[var(--dc-border)]">
                    <ServerIconArt server={srv} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-display font-bold text-[16px] text-[var(--dc-text-primary)] truncate">
                      {srv.name}
                    </p>
                    <p className="inline-flex items-center gap-1.5 text-[13px] text-[var(--dc-text-secondary)] mt-0.5 tabular-nums">
                      <BoostGemIcon className="w-4 h-4 shrink-0" />
                      <span>{boosts} mejoras</span>
                    </p>
                  </div>
                </div>

                {/* Level Ring Badge */}
                <div
                  className={`w-[68px] h-[68px] rounded-full flex flex-col items-center justify-center shrink-0 border-[3px] ${
                    lvl > 0
                      ? 'border-[#ec4899] bg-fuchsia-500/5 shadow-[0_0_12px_rgba(236,72,153,0.18)]'
                      : 'border-[var(--dc-border)] bg-[var(--dc-bg-input)]/40'
                  }`}
                >
                  <BoostGemIcon className="w-5 h-5" muted={lvl === 0} />
                  <span
                    className={`text-[11px] font-bold mt-0.5 ${
                      lvl > 0 ? 'text-[var(--dc-text-primary)]' : 'text-[var(--dc-text-muted)]'
                    }`}
                  >
                    {lvl > 0 ? `Nivel ${lvl}` : 'Sin nivel'}
                  </span>
                </div>
              </button>
            );
          })}

          <div className="border-t border-[var(--dc-border)] my-5" />

          {/* Consigue la mejor oferta con Nitro Black Onyx Card */}
          <div className="rounded-2xl p-5 text-white shadow-xl space-y-4 bg-[#0d0e12] border border-white/15">
            <h2 className="font-display font-bold text-[19px] text-center">
              Consigue la mejor oferta con Nitro
            </h2>

            <div className="rounded-2xl bg-white/10 backdrop-blur-xs border border-white/15 p-4 space-y-2.5">
              <div className="text-center mb-2">
                <p className="text-[11px] font-bold tracking-wider uppercase opacity-90">
                  Discord
                </p>
                <p className="font-display font-black italic text-3xl tracking-tight leading-none">
                  NITRO
                </p>
              </div>

              <div className="flex items-center gap-2.5 text-[13.5px] font-medium">
                <Check className="w-4.5 h-4.5 text-white shrink-0" />
                <span>30 % de descuento en mejoras del servidor</span>
              </div>
              <div className="flex items-center gap-2.5 text-[13.5px] font-medium">
                <Check className="w-4.5 h-4.5 text-white shrink-0" />
                <span>Incluye 2 mejoras. ¡Desbloquea el nivel 1!</span>
              </div>
            </div>

            <button
              onClick={onOpenNitro}
              className="w-full h-11 rounded-xl dc-btn-white font-bold text-[14.5px] cursor-pointer"
            >
              Más información sobre Discord Nitro
            </button>
          </div>
        </div>
      </div>

      {/* SERVER BOOST Info Modal (Exact Screenshot 8) */}
      <AnimatePresence>
        {showInfoSheet && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowInfoSheet(false)}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end md:items-center justify-center"
          >
            <motion.div
              initial={{ y: 48, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 36, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-[var(--dc-bg-sheet)] text-[var(--dc-text-primary)] rounded-t-3xl md:rounded-3xl border border-[var(--dc-border)] p-5 pb-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-5"
            >
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setShowInfoSheet(false)}
                  className="w-8 h-8 rounded-full dc-btn-icon flex items-center justify-center cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--dc-text-muted)]">
                  Información
                </span>
                <div className="w-8" />
              </div>

              {/* Hands + Pink Crystal SVG */}
              <div className="text-center space-y-2">
                <svg viewBox="0 0 120 72" className="w-28 h-16 mx-auto">
                  <path
                    d="M22 52 C14 42 18 24 26 24 C30 24 31 38 35 44 L38 60 H24 Z"
                    fill="#dbeafe"
                  />
                  <path
                    d="M98 52 C106 42 102 24 94 24 C90 24 89 38 85 44 L82 60 H96 Z"
                    fill="#dbeafe"
                  />
                  <polygon points="60,8 76,20 76,42 60,54 44,42 44,20" fill="#e879f9" />
                  <polygon points="60,15 69,23 69,39 60,47 51,39 51,23" fill="#fdf4ff" opacity="0.65" />
                </svg>

                <h2 className="font-display font-black italic text-3xl tracking-tight">
                  SERVER BOOST
                </h2>
                <p className="font-display font-bold text-[17px]">
                  Apoya a tus servidores favoritos
                </p>
                <p className="text-[13px] text-[var(--dc-text-secondary)] leading-relaxed">
                  Dale mejoras a un servidor y ayúdalo a desbloquear hasta tres niveles. ¡Cuantas
                  más mejoras, mayores serán el nivel y las ventajas que reciban los miembros de ese
                  servidor!
                </p>
              </div>

              <div className="space-y-2.5">
                <h3 className="font-display font-bold text-[15px]">
                  Mejora un servidor y recibe:
                </h3>
                <div className="space-y-2.5 text-[13.5px] text-[var(--dc-text-secondary)]">
                  <div className="flex items-center gap-3">
                    <BoostGemIcon className="w-5 h-5 shrink-0" />
                    <span>Un icono de lista de miembros junto a tu nombre</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-[#e879f9] shrink-0" />
                    <span>
                      Una flamante insignia de perfil de usuario que cambia con el tiempo
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-amber-400 shrink-0" />
                    <span>Un nuevo rol exclusivo en ese servidor</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5">
                <h3 className="font-display font-bold text-[15px]">
                  Los servidores mejorados pueden obtener:
                </h3>
                <div className="space-y-2.5 text-[13.5px] text-[var(--dc-text-secondary)]">
                  <div className="flex items-center gap-3">
                    <Smile className="w-5 h-5 text-amber-400 shrink-0" />
                    <span>Más espacio para emojis personalizados</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Sticker className="w-5 h-5 text-purple-400 shrink-0" />
                    <span>Desbloquea más ranuras para stickers personalizados</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Headphones className="w-5 h-5 text-blue-500 shrink-0" />
                    <span>Una mejor calidad para los canales de voz y Go Live</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Upload className="w-5 h-5 text-pink-400 shrink-0" />
                    <span>Aumenta el límite de subida de toda la comunidad</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Star className="w-5 h-5 text-amber-400 fill-amber-400 shrink-0" />
                    <span>Personalización del servidor para el avatar, el cartel y la URL</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-[var(--dc-border)] text-center space-y-2.5">
                <p className="font-display font-bold text-base">¿Listo para una mejora?</p>
                <button
                  onClick={() => {
                    setShowInfoSheet(false);
                    setSelectedServerId('srv-zn');
                  }}
                  className="w-full h-11 rounded-full dc-btn-primary text-sm font-bold cursor-pointer"
                >
                  Mejorar Zenith Studio
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
