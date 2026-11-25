import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  Clock,
  MoreHorizontal,
  Play,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
} from 'lucide-react';
import { Quest, ThemeMode, UserProfile } from '../types/discord';
import {
  DiscordLogo,
  GENERATED_ASSETS,
  LaurelQuestIcon,
  NitroWheelIcon,
  OrbsCrystalIcon,
  PrimordialAppIcon,
  SafeImage,
} from './DiscordArt';

interface QuestsViewProps {
  user: UserProfile;
  quests: Quest[];
  theme: ThemeMode;
  onBack: () => void;
  onClaimQuest: (questId: string) => void;
  onApplyPurpleTheme: () => void;
  onOpenNitro: () => void;
  onJoinDuneServer: () => void;
}

const QuestBannerArt: React.FC<{ quest: Quest }> = ({ quest }) => {
  const { artVariant: variant } = quest;
  if (variant === 'dune') {
    return (
      <div className="h-32 w-full relative overflow-hidden bg-[#3b3328]">
        <img
          src={GENERATED_ASSETS.duneBanner}
          alt="Dune Part Three"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
        <div className="absolute left-4 bottom-3 text-amber-100 tracking-[0.42em] font-display text-2xl font-light drop-shadow">
          DUNE
          <div className="text-[7px] tracking-[0.55em] text-amber-200/85 mt-0.5 pl-1">
            PART THREE
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'badges') {
    return (
      <div className="h-36 w-full relative overflow-hidden bg-[#0e172a]">
        <SafeImage
          src={GENERATED_ASSETS.questBadgesBanner}
          alt="Misión Badges 2.0"
          fallbackGradient="from-[#0e172a] via-[#1b274b] to-[#111827]"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
        <div className="absolute left-4 bottom-3 flex items-center gap-2 z-10">
          <DiscordLogo className="w-6 h-6 text-white drop-shadow" />
          <span className="font-display font-black text-xl text-white tracking-tight drop-shadow">
            Discord Badges 2.0
          </span>
        </div>
      </div>
    );
  }

  if (variant === 'ad') {
    const [c1, c2, c3] = quest.bannerGradient || ['#5865f2', '#111214', '#38bdf8'];
    return (
      <div
        className="h-32 w-full relative overflow-hidden"
        style={{
          background: `linear-gradient(125deg, ${c1} 0%, ${c2} 58%, ${c3} 135%)`,
        }}
      >
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(circle at 82% 24%, rgba(255,255,255,0.45) 0%, transparent 45%), radial-gradient(circle at 18% 85%, rgba(255,255,255,0.22) 0%, transparent 40%)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/15" />

        <div className="absolute top-3 left-4 right-4 flex items-center justify-between text-[11px] font-semibold text-white/85">
          <span>{quest.category || 'Anuncio'}</span>
          {quest.isLimitedTime && (
            <span className="inline-flex items-center gap-1 text-amber-300">
              <Clock className="w-3 h-3" />
              <span>Hasta 4 dic.</span>
            </span>
          )}
        </div>

        <div className="absolute left-4 right-4 bottom-3 z-10">
          <p className="font-display font-black text-xl tracking-tight text-white leading-none drop-shadow">
            {quest.adBrand || quest.sponsor}
          </p>
          {quest.adTagline && (
            <p className="text-[12px] text-white/80 mt-1 truncate">{quest.adTagline}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-36 w-full relative overflow-hidden bg-[#1a1f24]">
      <SafeImage
        src={GENERATED_ASSETS.questExterminautsBanner}
        alt="Misión Exterminauts"
        fallbackGradient="from-[#1b2b2c] via-[#344e4f] to-[#1a1f24]"
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
      <div className="absolute left-4 bottom-3 flex items-center gap-2 z-10">
        <span className="w-7 h-7 rounded-lg bg-red-600/80 border border-white/25 flex items-center justify-center text-white text-xs font-black shadow">
          ☢
        </span>
        <span className="font-display font-black tracking-wider text-white text-base drop-shadow">
          EXTERMINAUTS
        </span>
      </div>
    </div>
  );
};

export const QuestsView: React.FC<QuestsViewProps> = ({
  user,
  quests,
  theme,
  onBack,
  onClaimQuest,
  onApplyPurpleTheme,
  onOpenNitro,
  onJoinDuneServer,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'dec4' | 'pending' | 'claimed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [activeVideoQuest, setActiveVideoQuest] = useState<Quest | null>(null);
  const [watchProgress, setWatchProgress] = useState(0);
  const [showThemePreview, setShowThemePreview] = useState(false);

  useEffect(() => {
    if (!activeVideoQuest) return;
    setWatchProgress(0);
    const interval = setInterval(() => {
      setWatchProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          return 100;
        }
        return Math.min(100, p + 5);
      });
    }, 120);
    return () => clearInterval(interval);
  }, [activeVideoQuest]);

  const dec4Quests = quests.filter((q) => q.isLimitedTime);
  const pendingOrbsTotal = quests
    .filter((q) => !q.claimed)
    .reduce((acc, q) => acc + q.rewardOrbs, 0);

  const filteredQuests = quests.filter((q) => {
    if (filterMode === 'dec4' && !q.isLimitedTime) return false;
    if (filterMode === 'pending' && q.claimed) return false;
    if (filterMode === 'claimed' && !q.claimed) return false;
    const qLower = searchQuery.trim().toLowerCase();
    if (qLower) {
      return (
        q.title.toLowerCase().includes(qLower) ||
        q.sponsor.toLowerCase().includes(qLower) ||
        (q.adBrand || '').toLowerCase().includes(qLower) ||
        (q.category || '').toLowerCase().includes(qLower)
      );
    }
    return true;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--dc-bg-chat)] text-[var(--dc-text-primary)] overflow-hidden">
      <header className="h-14 px-3 md:px-5 flex items-center justify-between gap-2 bg-[var(--dc-bg-chat)] border-b border-[var(--dc-border)] shrink-0">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onBack}
            aria-label="Volver"
            className="relative w-9 h-9 rounded-full dc-btn-icon flex items-center justify-center cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <LaurelQuestIcon className="w-5 h-5 text-[var(--dc-text-primary)] ml-1" />
          <h1 className="font-display font-bold text-[19px]">Misiones</h1>
        </div>

        <div className="flex items-center gap-2 relative">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--dc-bg-card)] border border-[var(--dc-border)] text-[var(--dc-text-primary)] text-xs sm:text-sm font-bold tabular-nums whitespace-nowrap">
            <OrbsCrystalIcon className="w-4 h-4 shrink-0" />
            <span>{user.orbs.toLocaleString('es-ES')}</span>
          </div>
          <button
            onClick={() => setShowFilterMenu((s) => !s)}
            aria-label="Filtrar misiones"
            className="w-9 h-9 rounded-xl dc-btn-primary flex items-center justify-center cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>

          {showFilterMenu && (
            <div className="absolute right-0 top-11 w-52 bg-[var(--dc-bg-sheet)] border border-[var(--dc-border)] rounded-2xl p-1.5 shadow-2xl z-30">
              {(
                [
                  { id: 'all', label: `Todas (${quests.length})` },
                  { id: 'dec4', label: `Tiempo limitado · 4 dic. (${dec4Quests.length})` },
                  { id: 'pending', label: 'Disponibles' },
                  { id: 'claimed', label: 'Completadas' },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  onClick={() => {
                    setFilterMode(f.id);
                    setShowFilterMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
                    filterMode === f.id
                      ? 'dc-btn-primary'
                      : 'text-[var(--dc-text-secondary)] hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto pb-10">
        <div className="max-w-xl mx-auto">
          {/* Primordial Morado Theme Showcase */}
          <div className="relative">
            <div className="h-56 w-full relative overflow-hidden bg-[#120b22]">
              <SafeImage
                src={GENERATED_ASSETS.shopCelestialMoonArt}
                alt="Primordial Morado"
                fallbackGradient="from-[#1e113a] via-[#120b22] to-[#090612]"
                className="w-full h-full object-cover opacity-75"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#090612] via-[#120b22]/45 to-black/30" />

              <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-xl border border-violet-400/35 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-violet-400 shadow-[0_0_8px_#a78bfa]" />
                <span className="font-display font-extrabold text-xs tracking-widest uppercase text-violet-200">
                  PRIMORDIAL · MORADO
                </span>
              </div>

              <span className="absolute top-4 right-4 px-3 py-1 rounded-full bg-black/60 backdrop-blur-sm text-violet-100 text-xs font-semibold border border-violet-400/25 inline-flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-violet-300" />
                Tema oficial
              </span>
            </div>

            <div className="mx-3.5 -mt-12 relative z-10 rounded-3xl bg-[var(--dc-bg-card)] border border-violet-500/25 p-4 shadow-2xl">
              <div className="h-36 w-full rounded-2xl bg-[#100a1c] relative overflow-hidden flex items-center justify-center mb-3 border border-violet-400/20">
                <div className="absolute inset-0 bg-gradient-to-br from-[#2a1650]/90 via-[#150c29]/85 to-[#0b0714]/95" />
                <div className="relative z-10 w-60 h-24 rounded-xl bg-black/55 backdrop-blur-md border border-violet-400/35 p-2.5 flex flex-col justify-between shadow-2xl">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-violet-400" />
                    <span className="text-[10px] font-bold tracking-wide text-violet-200">
                      # primordial-club
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-[10px] font-black text-white">
                      P
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="w-24 h-2 rounded-full bg-gradient-to-r from-violet-400 to-purple-300 opacity-90" />
                      <div className="w-36 h-1.5 rounded-full bg-white/45" />
                    </div>
                  </div>
                </div>
                <div className="absolute left-4 bottom-2.5 shadow-xl -rotate-6 z-20">
                  <PrimordialAppIcon className="w-11 h-11 rounded-2xl border border-violet-300/40" />
                </div>
                <div className="absolute right-4 top-2.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-br from-[#4c1d95]/95 to-[#2e1065]/95 border border-violet-400/45 shadow-xl rotate-3 z-20">
                  <span className="font-display font-black text-[10.5px] tracking-wider text-violet-100">
                    TEMA MORADO
                  </span>
                </div>
              </div>

              <h2 className="font-display font-bold text-[19px] leading-snug text-[var(--dc-text-primary)]">
                Personaliza tu app con el tema Primordial Morado
              </h2>
              <p className="text-[13.5px] text-[var(--dc-text-secondary)] mt-1.5 leading-relaxed">
                Aplica una paleta morada limpia y profunda diseñada para destacar tus chats, tarjetas y perfil.
              </p>
              <p className="text-[12.5px] text-[var(--dc-text-muted)] mt-2.5">
                Estilo exclusivo de Primordial.{' '}
                <button
                  onClick={() => setShowThemePreview(true)}
                  className="text-violet-400 hover:underline font-semibold cursor-pointer"
                >
                  Más información
                </button>
              </p>

              <button
                onClick={() => setShowThemePreview(true)}
                className="w-full mt-4 h-11 rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] hover:brightness-110 text-white font-bold text-[14.5px] cursor-pointer whitespace-nowrap shadow-[0_10px_24px_-8px_rgba(139,92,246,0.65)] transition-all"
              >
                {theme === 'purple' ? 'Tema Morado activo ✓' : 'Previsualizar tema Morado'}
              </button>
            </div>
          </div>

          <div className="px-3.5 mt-6 space-y-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="font-display font-bold text-[18px] text-[var(--dc-text-primary)]">
                  Misiones
                </h3>
                <span className="text-xs text-[var(--dc-text-muted)] tabular-nums">
                  {pendingOrbsTotal.toLocaleString('es-ES')} Orbs disponibles
                </span>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                {(
                  [
                    { id: 'all', label: `Todas (${quests.length})` },
                    { id: 'dec4', label: `4 de diciembre (${dec4Quests.length})` },
                    { id: 'pending', label: 'Disponibles' },
                    { id: 'claimed', label: 'Completadas' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFilterMode(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                      filterMode === tab.id
                        ? 'bg-[#5865F2] text-white'
                        : 'bg-[var(--dc-bg-card)] text-[var(--dc-text-secondary)] hover:text-[var(--dc-text-primary)]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-[var(--dc-text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar anuncio, marca o categoría..."
                  className="w-full h-10 pl-10 pr-9 rounded-xl bg-[var(--dc-bg-card)] border border-[var(--dc-border)] text-xs sm:text-sm text-[var(--dc-text-primary)] placeholder:text-[var(--dc-text-muted)] focus:outline-none focus:border-[#5865F2]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Limpiar búsqueda"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--dc-text-muted)] hover:text-[var(--dc-text-primary)] cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {filteredQuests.length === 0 && (
              <div className="rounded-2xl bg-[var(--dc-bg-card)] border border-[var(--dc-border)] p-6 text-center text-sm text-[var(--dc-text-secondary)]">
                No hay misiones que coincidan con este filtro.
              </div>
            )}

            {filteredQuests.map((quest) => (
              <article
                key={quest.id}
                className="rounded-2xl bg-[var(--dc-bg-card)] border border-[var(--dc-border)] overflow-hidden"
              >
                <QuestBannerArt quest={quest} />

                <div className="p-3.5 space-y-3">
                  <div className="flex items-center justify-between text-[12px] text-[var(--dc-text-secondary)]">
                    <span className="inline-flex items-center gap-1.5">
                      <span>Promocionado por</span>
                      <BadgeCheck className="w-4 h-4 text-[#23a55a] fill-[#23a55a]/20" />
                      <strong className="font-semibold text-[var(--dc-text-primary)]">
                        {quest.sponsor}
                      </strong>
                    </span>
                    <span className="text-[var(--dc-text-muted)] tabular-nums">{quest.endsAt}</span>
                  </div>

                  <div className="flex items-center gap-3.5">
                    <div className="w-20 h-20 rounded-2xl bg-[#0e0e12] border border-white/10 flex items-center justify-center shrink-0">
                      <OrbsCrystalIcon colored className="w-12 h-12" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-[11.5px] font-bold uppercase tracking-wide text-[#5ca6ff] truncate">
                        {quest.title}
                      </p>
                      <p className="font-display font-bold text-[16px] text-[var(--dc-text-primary)] flex items-center gap-1.5 mt-0.5 tabular-nums">
                        <span>Consigue</span>
                        <OrbsCrystalIcon className="w-4 h-4" />
                        <span>{quest.rewardOrbs} Orbs</span>
                      </p>

                      <button
                        onClick={onOpenNitro}
                        className="mt-1 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#ec4899] text-white text-[11.5px] font-bold cursor-pointer hover:brightness-110 transition-all shadow-sm"
                      >
                        <NitroWheelIcon className="w-3.5 h-3.5" />
                        <span>{quest.nitroMultiplier}</span>
                      </button>

                      <p className="text-[12.5px] text-[var(--dc-text-secondary)] mt-1">
                        {quest.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={
                        quest.id === 'q-dune'
                          ? onJoinDuneServer
                          : () => setActiveVideoQuest(quest)
                      }
                      className="flex-1 h-10 rounded-full dc-btn-secondary text-[13.5px] font-semibold px-3 truncate cursor-pointer"
                    >
                      {quest.secondaryLabel}
                    </button>

                    <button
                      onClick={() => !quest.claimed && setActiveVideoQuest(quest)}
                      disabled={quest.claimed}
                      className={`flex-1 h-10 rounded-full text-[13.5px] font-bold px-3 flex items-center justify-center gap-1.5 whitespace-nowrap ${
                        quest.claimed
                          ? 'bg-[#23a55a]/20 text-[#23a55a] border border-[#23a55a]/40 cursor-default'
                          : 'dc-btn-primary cursor-pointer'
                      }`}
                    >
                      {quest.claimed ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Reclamado</span>
                        </>
                      ) : (
                        <span>{quest.ctaLabel}</span>
                      )}
                    </button>

                    <button
                      onClick={() => setActiveVideoQuest(quest)}
                      aria-label="Más opciones"
                      className="w-10 h-10 rounded-full dc-btn-icon flex items-center justify-center shrink-0 cursor-pointer"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>

      {showThemePreview && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-gradient-to-b from-[#1a1030] to-[#0d0818] border border-violet-400/35 p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <PrimordialAppIcon className="w-8 h-8 rounded-xl border border-violet-300/35" />
                <h3 className="font-display font-bold text-lg text-white">
                  Tema Primordial · Morado
                </h3>
              </div>
              <button
                onClick={() => setShowThemePreview(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-violet-100/85 leading-relaxed">
              Viste toda la interfaz con tonos morados profundos, contraste limpio y acentos violeta característicos de Primordial.
            </p>
            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => setShowThemePreview(false)}
                className="flex-1 h-11 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-white text-sm font-semibold cursor-pointer transition-colors"
              >
                Cerrar
              </button>
              <button
                onClick={() => {
                  onApplyPurpleTheme();
                  setShowThemePreview(false);
                }}
                className="flex-1 h-11 rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white text-sm font-extrabold cursor-pointer shadow-lg hover:brightness-110 transition-all"
              >
                {theme === 'purple' ? 'Volver a Onyx' : 'Aplicar tema Morado'}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeVideoQuest && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-[var(--dc-bg-sheet)] border border-[var(--dc-border)] overflow-hidden shadow-2xl">
            <div className="relative">
              <QuestBannerArt quest={activeVideoQuest} />
              <button
                onClick={() => setActiveVideoQuest(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/65 border border-white/15 text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-14 h-14 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center border border-white/25">
                  <Play className="w-6 h-6 text-white fill-white ml-0.5" />
                </div>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <p className="text-xs font-bold text-[#5ca6ff] uppercase">{activeVideoQuest.title}</p>
                <h4 className="font-display font-bold text-lg text-[var(--dc-text-primary)] mt-0.5">
                  Reproduciendo tráiler de la misión
                </h4>
              </div>

              <div>
                <div className="flex justify-between text-xs text-[var(--dc-text-secondary)] mb-1.5 tabular-nums">
                  <span>Progreso de visualización</span>
                  <span>{watchProgress}%</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-black/20 dark:bg-black/40 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#5865F2] to-[#a855f7] transition-all duration-150"
                    style={{ width: `${watchProgress}%` }}
                  />
                </div>
              </div>

              <button
                disabled={watchProgress < 100 || activeVideoQuest.claimed}
                onClick={() => {
                  onClaimQuest(activeVideoQuest.id);
                  setActiveVideoQuest(null);
                }}
                className={`w-full h-11 rounded-full font-bold text-sm flex items-center justify-center gap-2 ${
                  watchProgress >= 100 && !activeVideoQuest.claimed
                    ? 'dc-btn-success cursor-pointer'
                    : 'bg-[var(--dc-bg-card)] text-[var(--dc-text-muted)] border border-[var(--dc-border)] cursor-not-allowed'
                }`}
              >
                <OrbsCrystalIcon className="w-4 h-4" />
                <span>
                  {activeVideoQuest.claimed
                    ? 'Misión ya reclamada'
                    : watchProgress >= 100
                    ? `Reclamar +${activeVideoQuest.rewardOrbs} Orbs`
                    : 'Viendo vídeo...'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
