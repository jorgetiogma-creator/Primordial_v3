import React, { useState } from 'react';
import {
  Award,
  Check,
  Crown,
  Flame,
  Gem,
  Palette,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  UserCog,
  X,
} from 'lucide-react';
import {
  BadgeId,
  DecorationId,
  DisplayNameColorPreset,
  DisplayNameStyle,
  NameplateId,
  ProfileEffectId,
  ProfileFrameId,
  ShopBundle,
  UserProfile,
} from '../types/discord';
import { BADGE_DEFINITIONS } from '../data/discordData';
import { BadgeArtwork } from './BadgesView';
import {
  NameplateStripBackground,
  NitroWheelIcon,
  OrbsCrystalIcon,
  ProfileFrameArtwork,
  UserAvatar,
} from './DiscordArt';
import { findBundleForCosmetic } from '../utils/shopOwnership';
import {
  DISPLAY_NAME_COLOR_OPTIONS,
  DISPLAY_NAME_FONT_OPTIONS,
  getDisplayNameTextPresentation,
} from '../utils/displayNameStyle';

interface OwnerPanelModalProps {
  isOpen: boolean;
  user: UserProfile;
  ownedBundleIds: string[];
  shopBundles: ShopBundle[];
  onClose: () => void;
  onUpdateOwnerProfile: (patch: Partial<UserProfile>, ensureBundleIds?: string[]) => void;
  onUnlockAllEverything: () => void;
  onUnlockAllShopBundles: () => void;
  onClearAllShopBundles: () => void;
  onUnlockAllBadges: () => void;
  onNotify: (message: string) => void;
}

const MAX_SAFE_ORBS = 999_999_999_999_999;

const ALL_DECO_CHOICES: { id: DecorationId; label: string }[] = [
  { id: 'none', label: 'Ninguno' },
  { id: 'grabado', label: 'Grabado japonés' },
  { id: 'espectro', label: 'Espectro' },
  { id: 'observador', label: 'Observador' },
  { id: 'almas', label: 'Almas atrapadas' },
  { id: 'tentempie', label: 'Tentempié medianoche' },
  { id: 'polilla', label: 'Polilla fantasma' },
  { id: 'flores-luna', label: 'Flores de luna' },
  { id: 'cuernos', label: 'Cuernos de demonio' },
  { id: 'fuegos-fatuos', label: 'Fuegos fatuos' },
  { id: 'el-ente', label: 'El Ente' },
  { id: 'luna-oscura', label: 'Luna oscura' },
  { id: 'red-sangre', label: 'Red de Sangre' },
  { id: 'calabazas', label: 'Calabazas' },
  { id: 'luces-camara', label: '¡Luces, cámara!' },
  { id: 'onda-cosmica', label: '¡Onda cósmica!' },
  { id: 'boveda', label: 'La bóveda' },
  { id: 'claptrap', label: '¡Estoy bailando!' },
  { id: 'saqueo', label: '¡Saqueo!' },
  { id: 'luna-mistica', label: 'Luna mística' },
  { id: 'estrella-nocturna', label: 'Estrella nocturna' },
  { id: 'flores-lunares', label: 'Flores lunares' },
  { id: 'trebol', label: 'Trébol' },
  { id: 'jardin-secreto', label: 'Jardín secreto' },
  { id: 'lirio', label: 'Nenúfares' },
  { id: 'adorable', label: '¡Adorable!' },
  { id: 'random-xd', label: '¡So random!' },
  { id: 'scene-xd', label: 'Estética scene' },
  { id: 'nitro-disco', label: 'Fragmento Tóxico' },
  { id: 'nitro-auris', label: 'Auriculares Neón' },
  { id: 'nitro-chip', label: 'Placa Cyber' },
  { id: 'gojo', label: 'Satoru Gojo' },
  { id: 'sukuna', label: 'Ryomen Sukuna' },
  { id: 'yuji', label: 'Yuji Itadori' },
  { id: 'cerbero', label: 'Cerbero' },
  { id: 'pesadilla', label: 'Hora de pesadilla' },
  { id: 'lobo', label: 'Lobo y Luna' },
  { id: 'miyabi', label: 'Hoshimi Miyabi' },
  { id: 'ellen', label: 'Ellen Joe' },
  { id: 'burnice', label: 'Burnice' },
  { id: 'deadpool', label: 'Deadpool' },
  { id: 'wolverine', label: 'Wolverine' },
  { id: 'dbd', label: 'Dead by Daylight' },
  { id: 'pato', label: 'El mismo pato' },
  { id: 'llama', label: 'Llama infernal' },
  { id: 'orejas', label: 'Orejas de gato' },
  { id: 'plantas', label: 'Vibras lofi' },
  { id: 'croma', label: 'Onda cromática' },
  { id: 'gato', label: 'Gato cómodo' },
];

const ALL_FRAME_CHOICES: { id: ProfileFrameId; label: string }[] = [
  { id: 'none', label: 'Ninguno' },
  { id: 'espectro', label: 'Espectro' },
  { id: 'observador', label: 'Observador' },
  { id: 'ramas-desnudas', label: 'Ramas desnudas' },
  { id: 'flores-luna', label: 'Flores de luna' },
  { id: 'diablo-jersey', label: 'Diablo de Jersey' },
  { id: 'el-ente', label: 'El Ente' },
  { id: 'luna-oscura', label: 'Luna oscura' },
  { id: 'obsidian', label: 'Obsidiana' },
  { id: 'crimson', label: 'Carmesí' },
  { id: 'neon-blue', label: 'Neón Azul' },
  { id: 'gold', label: 'Dorado Real' },
  { id: 'glitch', label: 'Cyber Glitch' },
];

const ALL_EFFECT_CHOICES: { id: ProfileEffectId; label: string }[] = [
  { id: 'none', label: 'Ninguno' },
  { id: 'observador', label: 'Observador' },
  { id: 'almas', label: 'Almas atrapadas' },
  { id: 'hombre-polilla', label: 'Hombre Polilla' },
  { id: 'flores-luna', label: 'Flores de luna' },
  { id: 'diablo-jersey', label: 'Diablo de Jersey' },
  { id: 'llorona', label: 'La Llorona' },
  { id: 'jackalope', label: 'Jackalope' },
  { id: 'gancho', label: 'En el gancho' },
  { id: 'cuervos-luna', label: 'Cuervos bajo la luna' },
  { id: 'red-sangre', label: 'Red de Sangre' },
  { id: 'el-ente', label: 'El Ente' },
  { id: 'boveda', label: 'La Bóveda' },
  { id: 'saqueo', label: 'Saqueo' },
  { id: 'trebol', label: 'Trébol' },
  { id: 'jardin-secreto', label: 'Jardín secreto' },
  { id: 'luna-mistica', label: 'Luna mística' },
  { id: 'adorable', label: 'Adorable' },
  { id: 'scene-xd', label: 'Scene Rawr xD' },
  { id: 'grabado', label: 'Grabado japonés' },
  { id: 'gojo', label: 'Satoru Gojo' },
  { id: 'sukuna', label: 'Ryomen Sukuna' },
  { id: 'yuji', label: 'Yuji Itadori' },
  { id: 'cerbero', label: 'Cerbero' },
  { id: 'pesadilla', label: 'Hora de pesadilla' },
  { id: 'jugar', label: 'Vamos a jugar' },
  { id: 'lobo', label: 'Lobo y Luna' },
  { id: 'miyabi', label: 'Miyabi' },
  { id: 'ellen', label: 'Ellen Joe' },
  { id: 'burnice', label: 'Burnice' },
  { id: 'deadpool', label: 'Deadpool' },
  { id: 'dbd', label: 'La Entidad' },
  { id: 'cyber', label: 'Lluvia Cyber (Nitro)' },
  { id: 'sparks', label: 'Chispas Neón (Nitro)' },
  { id: 'crimson', label: 'Aura Carmesí (Nitro)' },
];

const ALL_PLATE_CHOICES: { id: NameplateId; label: string }[] = [
  { id: 'none', label: 'Ninguno' },
  { id: 'observador', label: 'Observador' },
  { id: 'acechador', label: 'Acechador acuático' },
  { id: 'almas', label: 'Almas atrapadas' },
  { id: 'polilla', label: 'Polilla fantasma' },
  { id: 'flores-luna', label: 'Flores de luna' },
  { id: 'diablo-jersey', label: 'Diablo de Jersey' },
  { id: 'fuegos-fatuos', label: 'Fuegos fatuos' },
  { id: 'jackalope', label: 'Jackalope' },
  { id: 'marcas-aranazos', label: 'Marcas de arañazos' },
  { id: 'luna-oscura', label: 'Luna oscura' },
  { id: 'red-sangre', label: 'Red de Sangre' },
  { id: 'conejito-fresero', label: 'Conejito fresero' },
  { id: 'el-mismo-pato', label: 'El mismo pato' },
  { id: 'marea-lluvia', label: 'Marea de lluvia' },
  { id: 'jardin-secreto', label: 'Jardín secreto' },
  { id: 'rama', label: 'Rama en flor' },
  { id: 'vader', label: 'Darth Vader' },
  { id: 'condenacion', label: 'Condenación eterna' },
  { id: 'cerbero', label: 'Cerbero' },
  { id: 'gojo', label: 'Satoru Gojo' },
  { id: 'sukuna', label: 'Ryomen Sukuna' },
  { id: 'yuji', label: 'Yuji Itadori' },
  { id: 'lobo', label: 'Lobo y Luna' },
  { id: 'sakura', label: 'Sakura' },
  { id: 'vice-city', label: 'Vice City' },
  { id: 'miyabi', label: 'Miyabi' },
  { id: 'deadpool', label: 'Deadpool' },
  { id: 'wolverine', label: 'Wolverine' },
  { id: 'dbd', label: 'Dead by Daylight' },
];

export const OwnerPanelModal: React.FC<OwnerPanelModalProps> = ({
  isOpen,
  user,
  ownedBundleIds,
  shopBundles,
  onClose,
  onUpdateOwnerProfile,
  onUnlockAllEverything,
  onUnlockAllShopBundles,
  onClearAllShopBundles,
  onUnlockAllBadges,
  onNotify,
}) => {
  const [tab, setTab] = useState<'orbs' | 'todo' | 'equipar' | 'identidad'>('orbs');
  const [customOrbsInput, setCustomOrbsInput] = useState('1000000');
  const [equipFilter, setEquipFilter] = useState<'deco' | 'frame' | 'effect' | 'plate' | 'banner'>(
    'deco'
  );
  const [customTagInput, setCustomTagInput] = useState(user.serverTag || '👑 OWNER');
  const [customSinceInput, setCustomSinceInput] = useState(user.memberSince || '6 nov. 2026');

  if (!isOpen) return null;

  const parseSafeOrbs = (raw: string): number | null => {
    const cleaned = raw.replace(/[^0-9]/g, '');
    if (!cleaned) return null;
    const val = Number(cleaned);
    if (!Number.isFinite(val) || val < 0) return null;
    return Math.min(MAX_SAFE_ORBS, Math.floor(val));
  };

  const setOrbsExact = (amount: number) => {
    const safe = Math.max(0, Math.min(MAX_SAFE_ORBS, Math.floor(amount)));
    onUpdateOwnerProfile({ orbs: safe });
    onNotify(`Orbs actualizados a ◈ ${safe.toLocaleString('es-ES')}`);
  };

  const addOrbsAmount = (delta: number) => {
    const next = Math.max(0, Math.min(MAX_SAFE_ORBS, Math.floor((user.orbs || 0) + delta)));
    onUpdateOwnerProfile({ orbs: next });
    onNotify(`+◈ ${delta.toLocaleString('es-ES')} añadidos`);
  };

  const bannerOptions = shopBundles.flatMap((b) => {
    const bannerItem = b.items.find((i) => i.bannerUrl);
    return bannerItem?.bannerUrl
      ? [{ bundleId: b.id, name: bannerItem.name, url: bannerItem.bannerUrl }]
      : [];
  });

  const namePres = getDisplayNameTextPresentation({
    style: user.displayNameStyle,
    colorPreset: user.displayNameColorPreset,
    customColors: user.displayNameCustomColors,
    glow: user.displayNameGlow,
    nitroUnlocked: user.nitroTier !== 'none',
  });

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-[#0e0f14] rounded-t-3xl sm:rounded-3xl border border-pink-400/40 shadow-[0_25px_70px_-15px_rgba(236,72,153,0.4)] flex flex-col max-h-[92vh] overflow-hidden"
      >
        {/* Header */}
        <header className="px-5 py-4 bg-gradient-to-r from-pink-500/25 via-rose-500/15 to-fuchsia-600/20 border-b border-white/10 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-400 to-rose-600 text-white flex items-center justify-center shrink-0 shadow-lg">
              <Crown className="w-5 h-5 stroke-[2.4]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-display font-black text-base sm:text-lg text-white truncate">
                  Panel Privado de Owner
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-pink-500/20 border border-pink-400/45 text-pink-200 text-[10px] font-extrabold uppercase tracking-wider shrink-0">
                  Solo @{user.username}
                </span>
              </div>
              <p className="text-xs text-zinc-300 truncate">
                Control total exclusivo de tu cuenta · Nadie más puede verlo
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar panel de Owner"
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Sub-Tabs */}
        <div className="grid grid-cols-4 bg-[#14151c] border-b border-white/10 shrink-0">
          {(
            [
              { id: 'orbs', label: 'Orbs', icon: OrbsCrystalIcon },
              { id: 'todo', label: 'Darse todo', icon: Sparkles },
              { id: 'equipar', label: 'Equipar', icon: Palette },
              { id: 'identidad', label: 'Perfil Pro', icon: UserCog },
            ] as const
          ).map((t) => {
            const active = tab === t.id;
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`py-3 px-2 text-xs font-bold flex items-center justify-center gap-1.5 relative cursor-pointer transition-colors ${
                  active ? 'text-pink-300' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{t.label}</span>
                {active && (
                  <span className="absolute bottom-0 inset-x-3 h-[2.5px] rounded-t-full bg-pink-400" />
                )}
              </button>
            );
          })}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {tab === 'orbs' && (
            <div className="space-y-4">
              {/* Current Balance Card */}
              <div className="rounded-2xl bg-[#161720] border border-pink-400/30 p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                    Saldo actual de Orbs
                  </p>
                  <p className="font-display font-black text-2xl sm:text-3xl text-white tabular-nums mt-0.5 flex items-center gap-2">
                    <OrbsCrystalIcon colored className="w-6 h-6 shrink-0" />
                    <span>{user.orbs.toLocaleString('es-ES')}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOrbsExact(MAX_SAFE_ORBS)}
                  className="px-3.5 py-2 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-black cursor-pointer shadow-lg hover:brightness-110 whitespace-nowrap"
                >
                  Máximo ∞
                </button>
              </div>

              {/* Quick Add Presets */}
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Sumar Orbs al instante
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: '+10.000', val: 10_000 },
                    { label: '+1.000.000', val: 1_000_000 },
                    { label: '+100M', val: 100_000_000 },
                    { label: '+1 Mil M', val: 1_000_000_000 },
                    { label: '+1 Billón', val: 1_000_000_000_000 },
                    { label: '+1 Cuatrillón', val: 100_000_000_000_000 },
                  ].map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => addOrbsAmount(p.val)}
                      className="py-2.5 px-3 rounded-xl bg-[#1a1c26] hover:bg-[#232635] border border-white/10 text-xs font-bold text-white cursor-pointer tabular-nums transition-colors"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Exact Set Input */}
              <div className="rounded-2xl bg-[#161720] border border-white/10 p-4 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Cantidad personalizada exacta
                </p>
                <input
                  type="text"
                  inputMode="numeric"
                  value={customOrbsInput}
                  onChange={(e) => setCustomOrbsInput(e.target.value)}
                  placeholder="Ej. 50000000"
                  className="w-full h-11 rounded-xl bg-[#090a0e] border border-white/15 px-3.5 text-sm font-bold text-white tabular-nums focus:outline-none focus:border-pink-400"
                />
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const parsed = parseSafeOrbs(customOrbsInput);
                      if (parsed === null) {
                        onNotify('Escribe una cantidad válida');
                        return;
                      }
                      addOrbsAmount(parsed);
                    }}
                    className="h-10 rounded-full dc-btn-secondary text-xs font-bold cursor-pointer"
                  >
                    Sumar cantidad
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const parsed = parseSafeOrbs(customOrbsInput);
                      if (parsed === null) {
                        onNotify('Escribe una cantidad válida');
                        return;
                      }
                      setOrbsExact(parsed);
                    }}
                    className="h-10 rounded-full dc-btn-primary text-xs font-bold cursor-pointer"
                  >
                    Establecer exacto
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setOrbsExact(0)}
                className="w-full py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 text-xs font-bold text-red-300 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reiniciar Orbs a 0 (modo prueba)</span>
              </button>
            </div>
          )}

          {tab === 'todo' && (
            <div className="space-y-3.5">
              {/* Master 1-click unlock */}
              <button
                type="button"
                onClick={onUnlockAllEverything}
                className="w-full p-4 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-fuchsia-600 text-white font-black text-left shadow-xl cursor-pointer hover:brightness-110 transition-all flex items-center justify-between gap-3"
              >
                <div>
                  <p className="text-sm sm:text-base font-black flex items-center gap-1.5">
                    <Crown className="w-5 h-5" />
                    <span>DESBLOQUEAR ABSOLUTAMENTE TODO</span>
                  </p>
                  <p className="text-xs font-semibold text-white/90 mt-0.5">
                    Todos los lotes de Tienda, todas las insignias al máximo, Nitro activo y Orbs al máximo
                  </p>
                </div>
                <Sparkles className="w-6 h-6 shrink-0" />
              </button>

              {/* Shop Bundles Toggle */}
              <div className="rounded-2xl bg-[#161720] border border-white/10 p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <ShoppingBag className="w-5 h-5 text-indigo-400" />
                    <div>
                      <p className="text-sm font-bold text-white">
                        Catálogo completo de la Tienda
                      </p>
                      <p className="text-xs text-zinc-400 tabular-nums">
                        Tienes {ownedBundleIds.length} / {shopBundles.length} artículos en tu inventario
                      </p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={onUnlockAllShopBundles}
                    className="h-10 rounded-full dc-btn-success text-xs font-bold cursor-pointer"
                  >
                    Darse todos ({shopBundles.length})
                  </button>
                  <button
                    type="button"
                    onClick={onClearAllShopBundles}
                    className="h-10 rounded-full dc-btn-secondary text-xs font-bold cursor-pointer"
                  >
                    Vaciar inventario
                  </button>
                </div>
              </div>

              {/* Nitro Tier Switch */}
              <div className="rounded-2xl bg-[#161720] border border-white/10 p-4 space-y-2.5">
                <div className="flex items-center gap-2">
                  <NitroWheelIcon className="w-5 h-5 text-fuchsia-400" />
                  <p className="text-sm font-bold text-white">Suscripción Nitro instantánea</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { id: 'none', label: 'Sin Nitro' },
                      { id: 'basic', label: 'Nitro Basic' },
                      { id: 'nitro', label: 'Discord Nitro' },
                    ] as const
                  ).map((tier) => (
                    <button
                      key={tier.id}
                      type="button"
                      onClick={() => {
                        onUpdateOwnerProfile({
                          nitroTier: tier.id,
                          ...(tier.id !== 'none' && !user.unlockedBadgeIds.includes('nitro')
                            ? {
                                unlockedBadgeIds: [...user.unlockedBadgeIds, 'nitro'],
                              }
                            : {}),
                        });
                        onNotify(`Plan cambiado a ${tier.label}`);
                      }}
                      className={`py-2.5 px-2 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                        user.nitroTier === tier.id
                          ? 'bg-fuchsia-500/20 border-fuchsia-400 text-white'
                          : 'bg-[#0c0d12] border-white/10 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {tier.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* All Badges Unlock & Equip */}
              <div className="rounded-2xl bg-[#161720] border border-white/10 p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-pink-400" />
                    <p className="text-sm font-bold text-white">
                      Todas las insignias ({user.unlockedBadgeIds.length}/{BADGE_DEFINITIONS.length})
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onUnlockAllBadges}
                    className="px-3 py-1.5 rounded-full bg-pink-500/20 border border-pink-400/45 text-pink-200 text-xs font-bold cursor-pointer"
                  >
                    Darse todas al máx
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {BADGE_DEFINITIONS.map((b) => {
                    const equipped = user.equippedBadgeIds.includes(b.id);
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => {
                          const nextUnlocked = user.unlockedBadgeIds.includes(b.id)
                            ? user.unlockedBadgeIds
                            : [...user.unlockedBadgeIds, b.id];
                          const nextEquipped = equipped
                            ? user.equippedBadgeIds.filter((x) => x !== b.id)
                            : [...user.equippedBadgeIds, b.id];
                          onUpdateOwnerProfile({
                            unlockedBadgeIds: nextUnlocked,
                            equippedBadgeIds: nextEquipped,
                          });
                        }}
                        className={`p-2 rounded-xl border flex items-center gap-2 cursor-pointer text-left ${
                          equipped
                            ? 'bg-[#5865F2]/20 border-[#5865F2] text-white'
                            : 'bg-[#0c0d12] border-white/10 text-zinc-400'
                        }`}
                      >
                        <BadgeArtwork badgeId={b.id} unlocked size="sm" />
                        <span className="text-[11px] font-semibold truncate">{b.shortTitle}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {tab === 'equipar' && (
            <div className="space-y-3.5">
              {/* Mini Live Card Preview */}
              <div className="rounded-2xl bg-[#161720] border border-white/10 p-3 flex items-center gap-3">
                <div className="relative p-1 rounded-lg bg-[#0c0d12]">
                  <UserAvatar
                    avatar={user.avatar}
                    customAvatarUrl={user.customAvatarUrl}
                    decoration={user.decoration}
                    status={user.status}
                    size="lg"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-lg truncate ${namePres.className}`} style={namePres.style}>
                    {user.displayName}
                  </p>
                  <p className="text-xs text-zinc-400 truncate">
                    Deco: {user.decoration} · Marco: {user.profileFrame || 'none'} · Efecto:{' '}
                    {user.profileEffect || 'none'}
                  </p>
                </div>
              </div>

              {/* Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {(
                  [
                    { id: 'deco', label: 'Decoraciones' },
                    { id: 'frame', label: 'Marcos' },
                    { id: 'effect', label: 'Efectos' },
                    { id: 'plate', label: 'Placas' },
                    { id: 'banner', label: 'Banners' },
                  ] as const
                ).map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setEquipFilter(cat.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 cursor-pointer transition-colors ${
                      equipFilter === cat.id
                        ? 'bg-pink-500 text-white'
                        : 'bg-[#1a1c26] text-zinc-300 hover:text-white'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {equipFilter === 'deco' && (
                <div className="grid grid-cols-3 gap-2">
                  {ALL_DECO_CHOICES.map((d) => {
                    const active = user.decoration === d.id;
                    const match = findBundleForCosmetic({ decorationId: d.id }, shopBundles);
                    const isNitroDeco =
                      d.id === 'nitro-disco' || d.id === 'nitro-auris' || d.id === 'nitro-chip';
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => {
                          onUpdateOwnerProfile(
                            {
                              decoration: d.id,
                              ...(isNitroDeco && user.nitroTier === 'none'
                                ? { nitroTier: 'nitro' }
                                : {}),
                            },
                            match ? [match.id] : undefined
                          );
                          onNotify(`Decoración equipada: ${d.label}`);
                        }}
                        className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 cursor-pointer ${
                          active
                            ? 'bg-pink-500/15 border-pink-400 text-white'
                            : 'bg-[#161720] border-white/10 text-zinc-300 hover:border-white/25'
                        }`}
                      >
                        <UserAvatar
                          avatar={user.avatar}
                          customAvatarUrl={user.customAvatarUrl}
                          decoration={d.id}
                          size="sm"
                          showStatus={false}
                        />
                        <span className="text-[11px] font-semibold text-center leading-tight line-clamp-2">
                          {d.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {equipFilter === 'frame' && (
                <div className="grid grid-cols-3 gap-2">
                  {ALL_FRAME_CHOICES.map((f) => {
                    const active = (user.profileFrame || 'none') === f.id;
                    const match = findBundleForCosmetic({ profileFrameId: f.id }, shopBundles);
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => {
                          onUpdateOwnerProfile(
                            { profileFrame: f.id },
                            match ? [match.id] : undefined
                          );
                          onNotify(`Marco equipado: ${f.label}`);
                        }}
                        className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 cursor-pointer ${
                          active
                            ? 'bg-pink-500/15 border-pink-400 text-white'
                            : 'bg-[#161720] border-white/10 text-zinc-300 hover:border-white/25'
                        }`}
                      >
                        <div className="relative w-11 h-12 rounded-lg bg-[#23252f] border border-white/15 mt-1">
                          <ProfileFrameArtwork frame={f.id} />
                        </div>
                        <span className="text-[11px] font-semibold text-center truncate w-full">
                          {f.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {equipFilter === 'effect' && (
                <div className="grid grid-cols-2 gap-2">
                  {ALL_EFFECT_CHOICES.map((ef) => {
                    const active = (user.profileEffect || 'none') === ef.id;
                    const match = findBundleForCosmetic({ profileEffectId: ef.id }, shopBundles);
                    const isNitroOnly = ef.id === 'cyber' || ef.id === 'sparks' || ef.id === 'crimson';
                    return (
                      <button
                        key={ef.id}
                        type="button"
                        onClick={() => {
                          onUpdateOwnerProfile(
                            {
                              profileEffect: ef.id,
                              ...(isNitroOnly && user.nitroTier === 'none' ? { nitroTier: 'nitro' } : {}),
                            },
                            match ? [match.id] : undefined
                          );
                          onNotify(`Efecto equipado: ${ef.label}`);
                        }}
                        className={`px-3 py-2.5 rounded-xl border flex items-center justify-between gap-2 cursor-pointer text-left ${
                          active
                            ? 'bg-pink-500/15 border-pink-400 text-white'
                            : 'bg-[#161720] border-white/10 text-zinc-300 hover:border-white/25'
                        }`}
                      >
                        <span className="text-xs font-semibold truncate">{ef.label}</span>
                        {active && <Check className="w-4 h-4 text-pink-300 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}

              {equipFilter === 'plate' && (
                <div className="grid grid-cols-2 gap-2">
                  {ALL_PLATE_CHOICES.map((np) => {
                    const active = user.nameplate === np.id;
                    const match = findBundleForCosmetic({ nameplateId: np.id }, shopBundles);
                    return (
                      <button
                        key={np.id}
                        type="button"
                        onClick={() => {
                          onUpdateOwnerProfile(
                            { nameplate: np.id },
                            match ? [match.id] : undefined
                          );
                          onNotify(`Placa equipada: ${np.label}`);
                        }}
                        className={`relative overflow-hidden px-3 py-3 rounded-xl border flex items-center justify-between gap-2 cursor-pointer text-left bg-[#161720] ${
                          active ? 'border-pink-400 ring-1 ring-pink-400' : 'border-white/10'
                        }`}
                      >
                        {np.id !== 'none' && <NameplateStripBackground nameplate={np.id} />}
                        <span className="relative z-10 text-xs font-bold text-white drop-shadow truncate">
                          {np.label}
                        </span>
                        {active && <Check className="relative z-10 w-4 h-4 text-pink-300 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}

              {equipFilter === 'banner' && (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => onUpdateOwnerProfile({ bannerImage: undefined })}
                    className="w-full py-2 rounded-xl bg-[#161720] border border-white/10 text-xs font-bold text-zinc-300 cursor-pointer"
                  >
                    Quitar imagen de banner (usar color)
                  </button>
                  <div className="grid grid-cols-2 gap-2">
                    {bannerOptions.map((b) => (
                      <button
                        key={b.bundleId}
                        type="button"
                        onClick={() => {
                          onUpdateOwnerProfile({ bannerImage: b.url }, [b.bundleId]);
                          onNotify(`Banner equipado: ${b.name}`);
                        }}
                        className={`relative h-20 rounded-xl overflow-hidden border cursor-pointer ${
                          user.bannerImage === b.url ? 'border-pink-400 ring-2 ring-pink-400' : 'border-white/10'
                        }`}
                      >
                        <img
                          src={b.url}
                          alt={b.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                        <span className="absolute bottom-1.5 left-2 right-2 text-[11px] font-bold text-white truncate text-left">
                          {b.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'identidad' && (
            <div className="space-y-4">
              {/* Estilo y color de nombre con brillo */}
              <div className="rounded-2xl bg-[#161720] border border-white/10 p-4 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-pink-400" />
                  <span>Nombre con fuente, degradado y brillo</span>
                </p>

                <div className="grid grid-cols-2 gap-2">
                  {DISPLAY_NAME_FONT_OPTIONS.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => onUpdateOwnerProfile({ displayNameStyle: f.id })}
                      className={`px-3 py-2 rounded-xl border text-left text-xs font-bold cursor-pointer ${
                        (user.displayNameStyle || 'default') === f.id
                          ? 'bg-pink-500/20 border-pink-400 text-white'
                          : 'bg-[#0c0d12] border-white/10 text-zinc-300'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {DISPLAY_NAME_COLOR_OPTIONS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() =>
                        onUpdateOwnerProfile({
                          displayNameColorPreset: c.id as DisplayNameColorPreset,
                          displayNameGlow: true,
                          ...(c.nitroOnly && user.nitroTier === 'none' ? { nitroTier: 'nitro' } : {}),
                        })
                      }
                      className={`px-3 py-2 rounded-xl border text-left text-xs font-bold cursor-pointer flex items-center justify-between ${
                        (user.displayNameColorPreset || 'none') === c.id
                          ? 'bg-pink-500/20 border-pink-400 text-white'
                          : 'bg-[#0c0d12] border-white/10 text-zinc-300'
                      }`}
                    >
                      <span>{c.label}</span>
                      <span
                        className="w-4 h-4 rounded-full border border-white/25 shrink-0"
                        style={{
                          backgroundImage: `linear-gradient(90deg, ${c.colors[0]}, ${c.colors[1]})`,
                        }}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Etiqueta personalizada & Fecha de miembro */}
              <div className="rounded-2xl bg-[#161720] border border-white/10 p-4 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Etiqueta de Owner & Antigüedad</span>
                </p>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customTagInput}
                    onChange={(e) => setCustomTagInput(e.target.value)}
                    placeholder="Ej. 👑 OWNER"
                    className="flex-1 h-10 rounded-xl bg-[#090a0e] border border-white/15 px-3 text-xs font-bold text-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateOwnerProfile({ serverTag: customTagInput.trim() });
                      onNotify('Etiqueta actualizada');
                    }}
                    className="px-4 h-10 rounded-xl dc-btn-primary text-xs font-bold cursor-pointer"
                  >
                    Aplicar
                  </button>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customSinceInput}
                    onChange={(e) => setCustomSinceInput(e.target.value)}
                    placeholder="Ej. 6 nov. 2026"
                    className="flex-1 h-10 rounded-xl bg-[#090a0e] border border-white/15 px-3 text-xs font-bold text-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateOwnerProfile({ memberSince: customSinceInput.trim() || '6 nov. 2026' });
                      onNotify('Fecha de miembro actualizada');
                    }}
                    className="px-4 h-10 rounded-xl dc-btn-secondary text-xs font-bold cursor-pointer"
                  >
                    Guardar
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onUpdateOwnerProfile({
                      boostsGiven: 12,
                      boostStreakMonths: 24,
                      giftsSent: 25,
                      streamHours: 250,
                      gamesPlayedCount: 40,
                      accountYears: 9,
                    });
                    onNotify('Estadísticas de perfil puestas al máximo');
                  }}
                  className="w-full h-10 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/35 text-xs font-bold text-emerald-300 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Gem className="w-4 h-4" />
                  <span>Subir rachas, mejoras, regalos y años al máximo</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
