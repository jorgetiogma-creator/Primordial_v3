import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, Gamepad2, Lock, Monitor, Sparkles, X } from 'lucide-react';
import { BadgeDefinition, BadgeId, BadgeTier, UserProfile } from '../types/discord';
import { BADGE_DEFINITIONS } from '../data/discordData';
import { LaurelQuestIcon, NitroWheelIcon, OrbsCrystalIcon } from './DiscordArt';

interface BadgesViewProps {
  user: UserProfile;
  onBack: () => void;
  onUpdateUser: (patch: Partial<UserProfile>) => void;
  onOpenServerBoost: () => void;
  onOpenShop: () => void;
  onOpenNitro: () => void;
  onOpenQuests: () => void;
  onLogStreamHour: () => void;
  onLogGamePlayed: (gameName: string) => void;
  onAdvanceAccountYear: () => void;
}

const SAMPLE_PC_GAMES = [
  'Valorant',
  'Minecraft',
  'Roblox Studio',
  'Zenless Zone Zero',
  'Counter-Strike 2',
  'Elden Ring',
];

export const getBadgeProgressValue = (badgeId: BadgeId, user: UserProfile): number => {
  switch (badgeId) {
    case 'hypesquad':
    case 'misiones':
      return 1;
    case 'nitro':
      return user.nitroTier !== 'none' ? 1 : 0;
    case 'mejora':
      return user.boostsGiven > 0 ? Math.max(1, user.boostStreakMonths || 1) : 0;
    case 'antiguedad':
      return user.accountYears || 0;
    case 'orbs':
      return user.unlockedBadgeIds.includes('orbs') ? 1 : 0;
    case 'regalos':
      return user.giftsSent || 0;
    case 'transmision':
      return user.streamHours || 0;
    case 'juegos':
      return user.gamesPlayedCount || 0;
    default:
      return 0;
  }
};

export const isBadgeUnlocked = (badgeId: BadgeId, user: UserProfile): boolean => {
  if (user.unlockedBadgeIds.includes(badgeId)) return true;
  const def = BADGE_DEFINITIONS.find((b) => b.id === badgeId);
  if (!def || def.tiers.length === 0) return false;
  return getBadgeProgressValue(badgeId, user) >= def.tiers[0].threshold;
};

/* ---------------- CRISP CUSTOM DISCORD BADGE SVGS ---------------- */
export const BadgeArtwork: React.FC<{
  badgeId: BadgeId;
  unlocked?: boolean;
  size?: 'sm' | 'md' | 'hero';
}> = ({ badgeId, unlocked = true, size = 'md' }) => {
  const cls =
    size === 'sm' ? 'w-4 h-4' : size === 'hero' ? 'w-24 h-24' : 'w-12 h-12';

  switch (badgeId) {
    case 'hypesquad':
      return (
        <svg viewBox="0 0 64 64" className={cls}>
          <defs>
            <linearGradient id="swordBlade" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#bae6fd" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
          </defs>
          <path d="M50 10 L54 14 L28 40 L24 36 Z" fill="url(#swordBlade)" />
          <path d="M50 10 L44 12 L24 36 L26 38 Z" fill="#e0f2fe" />
          <path d="M18 34 L30 46 L26 50 L14 38 Z" fill="#64748b" />
          <path d="M14 44 L20 50 L14 54 L10 50 Z" fill="#475569" />
          <circle cx="12" cy="52" r="3" fill="#94a3b8" />
        </svg>
      );

    case 'misiones':
      return <LaurelQuestIcon className={`${cls} text-[#8ea1f8]`} />;

    case 'nitro':
      return (
        <NitroWheelIcon
          className={`${cls} ${
            unlocked
              ? 'text-fuchsia-500 drop-shadow-[0_2px_8px_rgba(217,70,239,0.5)]'
              : 'text-[#5b6682]'
          }`}
        />
      );

    case 'mejora':
      return (
        <svg viewBox="0 0 64 64" className={cls}>
          <defs>
            <linearGradient id="boostTri" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ff73fa" />
              <stop offset="100%" stopColor="#d946ef" />
            </linearGradient>
          </defs>
          <polygon points="32,8 56,52 8,52" fill="url(#boostTri)" />
          <polygon points="32,22 45,46 19,46" fill="#fbcfe8" />
          <polygon points="32,8 32,22 19,46 8,52" fill="#f472b6" opacity="0.7" />
        </svg>
      );

    case 'antiguedad':
      return (
        <svg viewBox="0 0 64 64" className={cls}>
          {size === 'hero' ? (
            <>
              <path
                d="M32 6 C46 14 50 32 44 48 C38 56 26 56 20 48 C14 32 18 14 32 6 Z"
                fill="#84cc16"
              />
              <path d="M32 6 C22 16 18 32 24 48 L32 54 Z" fill="#bef264" opacity="0.65" />
              <path
                d="M28 18 L34 14 L34 44 L29 44 L29 22 L25 24 Z"
                fill="#4d7c0f"
              />
              <path d="M10 30 Q20 46 32 48 Q22 54 12 44 Z" fill="#38bdf8" />
              <path d="M54 32 Q44 48 32 50 Q42 56 52 46 Z" fill="#0284c7" />
            </>
          ) : (
            <>
              <path d="M16 34 Q32 52 48 34 Q44 48 32 50 Q20 48 16 34 Z" fill="#64748b" />
              <text
                x="32"
                y="38"
                textAnchor="middle"
                fontWeight="900"
                fontSize="28"
                fill="#78909c"
                fontFamily="system-ui, sans-serif"
              >
                1
              </text>
            </>
          )}
        </svg>
      );

    case 'orbs':
      return <OrbsCrystalIcon colored className={cls} />;

    case 'regalos':
      return (
        <svg viewBox="0 0 64 64" className={cls}>
          <rect x="14" y="26" width="36" height="28" rx="4" fill="#2563eb" />
          <rect x="12" y="20" width="40" height="9" rx="3" fill="#3b82f6" />
          <rect x="29" y="20" width="6" height="34" fill="#38bdf8" />
          <path d="M32 20 C24 10 14 14 20 20 Z" fill="#2dd4bf" />
          <path d="M32 20 C40 10 50 14 44 20 Z" fill="#2dd4bf" />
          <polygon points="32,33 36,37 32,41 28,37" fill="#fbcfe8" stroke="#1e3a8a" strokeWidth="1.5" />
        </svg>
      );

    case 'transmision':
      return (
        <svg viewBox="0 0 64 64" className={cls}>
          <rect x="10" y="14" width="44" height="32" rx="8" fill="#64748b" />
          <rect x="15" y="19" width="34" height="22" rx="4" fill="#bae6fd" />
          <path d="M22 48 h20 l2 4 H20 Z" fill="#475569" />
          {size === 'hero' && (
            <g>
              <rect x="24" y="29" width="12" height="7" rx="2" fill="#09090b" />
              <polygon points="24,29 26,25 28,29" fill="#09090b" />
              <polygon points="31,29 33,25 35,29" fill="#09090b" />
              <rect x="26" y="30" width="2" height="2" fill="#ffffff" />
              <rect x="31" y="30" width="2" height="2" fill="#ffffff" />
              <path d="M36 33 Q40 31 41 28" stroke="#09090b" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            </g>
          )}
        </svg>
      );

    case 'juegos':
      return size === 'hero' ? (
        <svg viewBox="0 0 80 80" className={cls}>
          {/* Cable */}
          <path
            d="M22 50 C8 46 8 30 22 32 M56 46 C70 42 72 56 58 62"
            stroke="#64748b"
            strokeWidth="4.5"
            fill="none"
            strokeLinecap="round"
          />
          <rect x="52" y="58" width="11" height="8" rx="2" fill="#475569" />
          {/* Base */}
          <polygon points="18,46 40,36 62,46 40,56" fill="#94a3b8" />
          <polygon points="18,46 40,56 40,65 18,55" fill="#475569" />
          <polygon points="62,46 40,56 40,65 62,55" fill="#64748b" />
          <circle cx="28" cy="46" r="2.2" fill="#f43f5e" />
          <circle cx="52" cy="46" r="2.2" fill="#22c55e" />
          {/* Stick & 8 Ball */}
          <rect x="38" y="24" width="4" height="22" rx="2" fill="#cbd5e1" />
          <circle cx="40" cy="18" r="10.5" fill="#0f172a" />
          <circle cx="37" cy="14" r="3" fill="#334155" opacity="0.6" />
          <circle cx="41" cy="17" r="4.5" fill="#ffffff" />
          <text x="41" y="19.5" textAnchor="middle" fontSize="6.5" fontWeight="900" fill="#0f172a">
            8
          </text>
        </svg>
      ) : (
        <svg viewBox="0 0 64 64" className={cls}>
          <path
            d="M19 22 H45 C52 22 56 32 54 42 C53 47 47 48 43 44 L38 39 H26 L21 44 C17 48 11 47 10 42 C8 32 12 22 19 22 Z"
            fill="#8ba0ad"
          />
          <path d="M18 31 h8 M22 27 v8" stroke="#2c353d" strokeWidth="3" strokeLinecap="round" />
          <circle cx="42" cy="29" r="2" fill="#2c353d" />
          <circle cx="46" cy="33" r="2" fill="#2c353d" />
          <circle cx="38" cy="33" r="2" fill="#2c353d" />
          <circle cx="42" cy="37" r="2" fill="#2c353d" />
        </svg>
      );
  }
};

const TierIcon: React.FC<{
  badgeId: BadgeId;
  tier: BadgeTier;
  idx: number;
  reached: boolean;
}> = ({ badgeId, tier, idx, reached }) => {
  const opacity = reached ? 'opacity-100 scale-105' : 'opacity-90';

  if (badgeId === 'juegos') {
    return (
      <svg viewBox="0 0 40 28" className={`w-8 h-6 mx-auto ${opacity}`}>
        <path
          d="M11 4 H29 C34 4 38 12 36 20 C35 25 30 25 27 22 L23 18 H17 L13 22 C10 25 5 25 4 20 C2 12 6 4 11 4 Z"
          fill={tier.color}
        />
        <path d="M10 12 h6 M13 9 v6" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
        <circle cx="27" cy="10" r="1.4" fill="#1e293b" />
        <circle cx="30" cy="13" r="1.4" fill="#1e293b" />
        <circle cx="24" cy="13" r="1.4" fill="#1e293b" />
        <circle cx="27" cy="16" r="1.4" fill="#1e293b" />
      </svg>
    );
  }

  if (badgeId === 'transmision') {
    return (
      <svg viewBox="0 0 36 32" className={`w-7 h-7 mx-auto ${opacity}`}>
        <rect x="4" y="4" width="28" height="20" rx="4" fill={tier.color} />
        <rect x="7.5" y="7.5" width="21" height="13" rx="2" fill="#e0f2fe" opacity="0.85" />
        <path d="M13 26 h10 l1.5 3 h-13 Z" fill={tier.color} />
      </svg>
    );
  }

  if (badgeId === 'regalos') {
    return (
      <svg viewBox="0 0 36 36" className={`w-7 h-7 mx-auto ${opacity}`}>
        <rect x="7" y="14" width="22" height="16" rx="2.5" fill={tier.color} />
        <rect x="5" y="10" width="26" height="5.5" rx="2" fill={tier.color} />
        <rect x="16" y="10" width="4" height="20" fill={tier.accent || '#bae6fd'} opacity="0.85" />
        <path d="M18 10 C13 4 8 7 12 10 Z" fill={tier.accent || '#e0f2fe'} />
        <path d="M18 10 C23 4 28 7 24 10 Z" fill={tier.accent || '#e0f2fe'} />
      </svg>
    );
  }

  if (badgeId === 'antiguedad') {
    return (
      <svg viewBox="0 0 36 36" className={`w-7 h-7 mx-auto ${opacity}`}>
        <path d="M7 22 Q18 33 29 22 Q27 30 18 31 Q9 30 7 22 Z" fill={tier.color} />
        {idx === 9 ? (
          <polygon
            points="18,4 21,12 29,12 23,17 25,25 18,20 11,25 13,17 7,12 15,12"
            fill="#facc15"
          />
        ) : (
          <text
            x="18"
            y="23"
            textAnchor="middle"
            fontWeight="900"
            fontSize="18"
            fill={tier.color}
            fontFamily="system-ui, sans-serif"
          >
            {idx + 1}
          </text>
        )}
      </svg>
    );
  }

  if (badgeId === 'mejora') {
    return (
      <svg viewBox="0 0 36 36" className={`w-7 h-7 mx-auto ${opacity}`}>
        {idx === 0 && (
          <>
            <polygon points="18,5 31,29 5,29" fill={tier.color} />
            <polygon points="18,13 24,25 12,25" fill="#fce7f3" />
          </>
        )}
        {idx === 1 && (
          <>
            <polygon points="18,4 32,18 18,32 4,18" fill={tier.color} />
            <polygon points="18,11 25,18 18,25 11,18" fill="#fce7f3" />
          </>
        )}
        {(idx === 2 || idx === 6) && (
          <>
            <polygon points="18,4 27,10 27,26 18,32 9,26 9,10" fill={tier.color} />
            <polygon points="18,11 22,14 22,22 18,25 14,22 14,14" fill="#fce7f3" />
          </>
        )}
        {(idx === 3 || idx === 7) && (
          <>
            <polygon points="18,4 30,11 30,25 18,32 6,25 6,11" fill={tier.color} />
            <polygon points="18,10 25,14 25,22 18,26 11,22 11,14" fill="#fce7f3" />
          </>
        )}
        {idx === 4 && (
          <>
            <rect x="6" y="6" width="24" height="24" rx="5" fill={tier.color} />
            <rect x="11" y="11" width="14" height="14" rx="2.5" fill="#fce7f3" />
          </>
        )}
        {idx === 5 && (
          <polygon
            points="18,3 22,13 33,13 24,20 27,31 18,24 9,31 12,20 3,13 14,13"
            fill={tier.color}
            stroke="#fbcfe8"
            strokeWidth="1.5"
          />
        )}
        {idx === 8 && (
          <polygon points="9,7 27,7 33,15 18,31 3,15" fill={tier.color} />
        )}
        {tier.accent && (
          <>
            <path d="M29 5 L30 8 L33 9 L30 10 L29 13 L28 10 L25 9 L28 8 Z" fill={tier.accent} />
            <path d="M7 22 L8 24 L10 25 L8 26 L7 28 L6 26 L4 25 L6 24 Z" fill={tier.accent} />
          </>
        )}
      </svg>
    );
  }

  return (
    <div
      className="w-7 h-7 mx-auto rounded-full flex items-center justify-center"
      style={{ backgroundColor: `${tier.color}33`, color: tier.color }}
    >
      <Sparkles className="w-4 h-4" />
    </div>
  );
};

export const BadgesView: React.FC<BadgesViewProps> = ({
  user,
  onBack,
  onUpdateUser,
  onOpenServerBoost,
  onOpenShop,
  onOpenNitro,
  onOpenQuests,
  onLogStreamHour,
  onLogGamePlayed,
  onAdvanceAccountYear,
}) => {
  const [selectedBadge, setSelectedBadge] = useState<BadgeDefinition | null>(null);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [selectedGamePick, setSelectedGamePick] = useState(SAMPLE_PC_GAMES[0]);

  const unlockedBadges = BADGE_DEFINITIONS.filter((b) => isBadgeUnlocked(b.id, user));
  const lockedBadges = BADGE_DEFINITIONS.filter((b) => !isBadgeUnlocked(b.id, user));

  const toggleEquippedBadge = (badgeId: BadgeId) => {
    if (!isBadgeUnlocked(badgeId, user)) return;
    const exists = user.equippedBadgeIds.includes(badgeId);
    const next = exists
      ? user.equippedBadgeIds.filter((id) => id !== badgeId)
      : [...user.equippedBadgeIds, badgeId];
    onUpdateUser({ equippedBadgeIds: next });
  };

  const renderBadgeCard = (badge: BadgeDefinition, unlocked: boolean) => (
    <motion.button
      key={badge.id}
      whileHover={{ y: -2, scale: 1.02 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => setSelectedBadge(badge)}
      className="relative aspect-square rounded-2xl bg-[var(--dc-bg-card)] hover:bg-[var(--dc-bg-elevated)] border border-[var(--dc-border)] flex flex-col items-center justify-center p-2 cursor-pointer transition-colors shadow-xs group"
      title={badge.shortTitle}
    >
      {badge.hasNotificationDot && (
        <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-[#5865F2] ring-2 ring-[var(--dc-bg-card)]" />
      )}
      <div className={`transition-transform duration-200 group-hover:scale-108 ${!unlocked ? 'opacity-90' : ''}`}>
        <BadgeArtwork badgeId={badge.id} unlocked={unlocked} size="md" />
      </div>
    </motion.button>
  );

  const selectedUnlocked = selectedBadge ? isBadgeUnlocked(selectedBadge.id, user) : false;
  const selectedProgress = selectedBadge ? getBadgeProgressValue(selectedBadge.id, user) : 0;

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--dc-bg-chat)] text-[var(--dc-text-primary)] relative overflow-hidden">
      {/* Top Header (Exact Screenshot: X  Tus insignias) */}
      <header className="h-14 px-4 flex items-center justify-between border-b border-[var(--dc-border)] bg-[var(--dc-bg-chat)] shrink-0">
        <button
          onClick={onBack}
          aria-label="Cerrar insignias"
          className="w-9 h-9 rounded-full dc-btn-icon flex items-center justify-center cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
        <h1 className="font-display font-bold text-[18px]">Tus insignias</h1>
        <div className="w-9" />
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-4 pt-5 pb-28">
        <div className="max-w-lg mx-auto space-y-7">
          {/* Section 1: Tus insignias */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-semibold text-[var(--dc-text-primary)]">
                Tus insignias
              </h2>
              <span className="text-xs font-semibold text-[var(--dc-text-muted)] tabular-nums">
                {unlockedBadges.length}/{BADGE_DEFINITIONS.length} desbloqueadas
              </span>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {unlockedBadges.map((b) => renderBadgeCard(b, true))}
            </div>
          </section>

          {/* Section 2: Disponible para desbloquear */}
          {lockedBadges.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-[15px] font-semibold text-[var(--dc-text-primary)]">
                Disponible para desbloquear
              </h2>
              <div className="grid grid-cols-4 gap-3">
                {lockedBadges.map((b) => renderBadgeCard(b, false))}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Bottom Sticky CTA: Personaliza tus insignias */}
      <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-[var(--dc-bg-chat)] via-[var(--dc-bg-chat)]/95 to-transparent pointer-events-none">
        <div className="max-w-lg mx-auto pointer-events-auto">
          <button
            onClick={() => setShowCustomizeModal(true)}
            className="w-full h-12 rounded-full dc-btn-secondary font-semibold text-[15px] cursor-pointer shadow-lg"
          >
            Personaliza tus insignias
          </button>
        </div>
      </div>

      {/* Badge Progression Detail Sheet (Exact Discord Bottom-Sheet Style) */}
      <AnimatePresence>
        {selectedBadge && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedBadge(null)}
            className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-end md:items-center justify-center"
          >
            <motion.div
              initial={{ y: 56, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-[var(--dc-bg-sheet)] rounded-t-3xl md:rounded-3xl border border-[var(--dc-border)] p-5 pb-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="w-10 h-1 bg-[var(--dc-text-muted)]/35 rounded-full mx-auto mb-5" />

              {/* Hero Emblem + Title */}
              <div className="flex flex-col items-center text-center">
                <div className="mb-3">
                  <BadgeArtwork badgeId={selectedBadge.id} unlocked={selectedUnlocked} size="hero" />
                </div>
                <h2 className="font-display font-black text-[22px] tracking-wide uppercase text-[var(--dc-text-primary)] leading-tight">
                  {selectedBadge.title}
                </h2>
                <p className="text-[13.5px] font-medium text-[var(--dc-text-secondary)] mt-1">
                  {selectedBadge.id === 'antiguedad' && !selectedUnlocked
                    ? 'Menos de un año de antigüedad • Sin desbloquear'
                    : selectedUnlocked
                    ? `Desbloqueada • Progreso actual: ${selectedProgress}`
                    : 'Sin desbloquear'}
                </p>
              </div>

              {/* Inner Info + Action + Tier Grid Card */}
              <div className="mt-5 rounded-3xl bg-[var(--dc-bg-card)] border border-[var(--dc-border)] p-4 space-y-4">
                <p className="text-[14.5px] text-[var(--dc-text-primary)] leading-snug">
                  {selectedBadge.description}
                </p>

                {/* Primary CTA / Real In-App Action */}
                {selectedBadge.id === 'mejora' && (
                  <button
                    onClick={() => {
                      setSelectedBadge(null);
                      onOpenServerBoost();
                    }}
                    className="w-full h-11 rounded-full dc-btn-primary font-bold text-[14.5px] cursor-pointer"
                  >
                    Mejorar un servidor
                  </button>
                )}

                {selectedBadge.id === 'regalos' && (
                  <button
                    onClick={() => {
                      setSelectedBadge(null);
                      onOpenShop();
                    }}
                    className="w-full h-11 rounded-full dc-btn-primary font-bold text-[14.5px] cursor-pointer"
                  >
                    Enviar regalo
                  </button>
                )}

                {selectedBadge.id === 'nitro' && (
                  <button
                    onClick={() => {
                      setSelectedBadge(null);
                      onOpenNitro();
                    }}
                    className="w-full h-11 rounded-full dc-btn-primary font-bold text-[14.5px] cursor-pointer"
                  >
                    Obtener Nitro
                  </button>
                )}

                {selectedBadge.id === 'orbs' && (
                  <button
                    onClick={() => {
                      setSelectedBadge(null);
                      onOpenQuests();
                    }}
                    className="w-full h-11 rounded-full dc-btn-primary font-bold text-[14.5px] cursor-pointer"
                  >
                    Ir a Misiones y Orbs
                  </button>
                )}

                {selectedBadge.id === 'transmision' && (
                  <div className="space-y-2">
                    <button
                      onClick={onLogStreamHour}
                      className="w-full h-11 rounded-full dc-btn-primary font-bold text-[14px] flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Monitor className="w-4 h-4" />
                      <span>Transmitir pantalla (+1 hora)</span>
                    </button>
                    <p className="text-[11.5px] text-center text-[var(--dc-text-muted)] tabular-nums">
                      Horas transmitidas: {user.streamHours} h
                    </p>
                  </div>
                )}

                {selectedBadge.id === 'juegos' && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <select
                        value={selectedGamePick}
                        onChange={(e) => setSelectedGamePick(e.target.value)}
                        className="flex-1 bg-[var(--dc-bg-input)] border border-[var(--dc-border)] rounded-full px-3.5 py-2 text-xs font-semibold text-[var(--dc-text-primary)] focus:outline-none"
                      >
                        {SAMPLE_PC_GAMES.map((g) => (
                          <option key={g} value={g}>
                            {g}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => onLogGamePlayed(selectedGamePick)}
                        className="px-4 py-2 rounded-full dc-btn-primary text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                      >
                        <Gamepad2 className="w-3.5 h-3.5" />
                        <span>Jugar (+1)</span>
                      </button>
                    </div>
                    <p className="text-[11.5px] text-center text-[var(--dc-text-muted)] tabular-nums">
                      Juegos detectados: {user.gamesPlayedCount}
                    </p>
                  </div>
                )}

                {selectedBadge.id === 'antiguedad' && (
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span className="text-xs text-[var(--dc-text-muted)] tabular-nums">
                      Antigüedad simulada: {user.accountYears} año(s)
                    </span>
                    <button
                      onClick={onAdvanceAccountYear}
                      className="px-3.5 py-1.5 rounded-full dc-btn-secondary text-xs font-semibold cursor-pointer"
                    >
                      +1 año
                    </button>
                  </div>
                )}

                {/* Tiers Grid (3 Columns, Centered Last Item when 10 tiers) */}
                {selectedBadge.tiers.length > 1 && (
                  <>
                    <div className="border-t border-[var(--dc-border)] pt-4" />
                    <div className="grid grid-cols-3 gap-x-2 gap-y-5">
                      {selectedBadge.tiers.map((tier, idx) => {
                        const reached = selectedProgress >= tier.threshold;
                        const isLastCentered =
                          selectedBadge.tiers.length % 3 === 1 &&
                          idx === selectedBadge.tiers.length - 1;

                        return (
                          <div
                            key={tier.id}
                            className={`text-center flex flex-col items-center ${
                              isLastCentered ? 'col-start-2' : ''
                            }`}
                          >
                            <TierIcon
                              badgeId={selectedBadge.id}
                              tier={tier}
                              idx={idx}
                              reached={reached}
                            />
                            <p className="text-[13px] font-bold text-[var(--dc-text-primary)] mt-1.5 leading-tight">
                              {tier.name}
                            </p>
                            <p
                              className={`text-[11.5px] mt-0.5 inline-flex items-center justify-center gap-1 tabular-nums leading-tight ${
                                reached
                                  ? 'text-[#23a55a] font-bold'
                                  : 'text-[var(--dc-text-muted)]'
                              }`}
                            >
                              {reached ? (
                                <Check className="w-3 h-3 shrink-0" />
                              ) : (
                                <Lock className="w-2.5 h-2.5 shrink-0" />
                              )}
                              <span>{tier.requirementLabel}</span>
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Personaliza tus insignias Modal */}
      <AnimatePresence>
        {showCustomizeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCustomizeModal(false)}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end md:items-center justify-center p-0 md:p-4"
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 30, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-[var(--dc-bg-sheet)] rounded-t-3xl md:rounded-3xl border border-[var(--dc-border)] p-5 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-lg">Personaliza tus insignias</h3>
                <button
                  onClick={() => setShowCustomizeModal(false)}
                  className="w-8 h-8 rounded-full dc-btn-icon flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-[var(--dc-text-secondary)]">
                Elige qué insignias desbloqueadas quieres mostrar en la barra de tu perfil.
              </p>

              <div className="space-y-2 max-h-72 overflow-y-auto">
                {BADGE_DEFINITIONS.map((b) => {
                  const unlocked = isBadgeUnlocked(b.id, user);
                  const equipped = user.equippedBadgeIds.includes(b.id);
                  return (
                    <button
                      key={b.id}
                      disabled={!unlocked}
                      onClick={() => toggleEquippedBadge(b.id)}
                      className={`w-full p-3 rounded-2xl border flex items-center justify-between gap-3 transition-colors ${
                        unlocked
                          ? 'bg-[var(--dc-bg-card)] hover:bg-[var(--dc-bg-elevated)] border-[var(--dc-border)] cursor-pointer'
                          : 'bg-[var(--dc-bg-card)]/40 border-[var(--dc-border)]/50 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-[var(--dc-bg-elevated)] flex items-center justify-center shrink-0">
                          <BadgeArtwork badgeId={b.id} unlocked={unlocked} size="sm" />
                        </div>
                        <div className="text-left min-w-0">
                          <p className="text-sm font-bold text-[var(--dc-text-primary)] truncate">
                            {b.shortTitle}
                          </p>
                          <p className="text-[11px] text-[var(--dc-text-muted)]">
                            {unlocked ? 'Desbloqueada' : 'Bloqueada'}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          equipped && unlocked
                            ? 'bg-[#5865F2] border-[#5865F2] text-white'
                            : 'border-[var(--dc-text-muted)]/50'
                        }`}
                      >
                        {equipped && unlocked && <Check className="w-3.5 h-3.5" />}
                      </span>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setShowCustomizeModal(false)}
                className="w-full h-11 rounded-full dc-btn-primary text-sm font-bold cursor-pointer"
              >
                Guardar selección
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
