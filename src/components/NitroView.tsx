import React, { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Gem,
  MonitorUp,
  Smile,
  Sparkles,
  Upload,
  UserCheck,
} from 'lucide-react';
import { UserProfile } from '../types/discord';
import {
  DiscordLogo,
  NitroWheelIcon,
  OrbsCrystalIcon,
  WumpusNitroFly,
  WumpusScooter,
} from './DiscordArt';

export const NITRO_ORBS_COST = 100_000;
export const NITRO_BASIC_ORBS_COST = 50_000;

interface NitroViewProps {
  user: UserProfile;
  onBack: () => void;
  onSubscribe: (tier: 'nitro' | 'basic', costOrbs: number) => void;
}

export const NitroView: React.FC<NitroViewProps> = ({ user, onBack, onSubscribe }) => {
  const [confirmTier, setConfirmTier] = useState<'nitro' | 'basic' | null>(null);

  const selectedCost =
    confirmTier === 'nitro' ? NITRO_ORBS_COST : NITRO_BASIC_ORBS_COST;
  const canAffordSelected = user.orbs >= selectedCost;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#111214] text-white overflow-y-auto pb-14">
      {/* Top Bar */}
      <header className="sticky top-0 z-20 bg-[#111214]/90 backdrop-blur-md border-b border-white/[0.07] px-4 py-3 flex items-center justify-between">
        <button
          onClick={onBack}
          aria-label="Volver"
          className="w-9 h-9 rounded-full bg-[#14151b] hover:bg-[#1e2029] border border-white/10 flex items-center justify-center text-white cursor-pointer transition-transform active:scale-95"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="inline-flex items-center gap-1.5">
          <DiscordLogo className="w-5 h-5 text-white" />
          <span className="font-display font-black italic text-lg tracking-tight text-white">
            NITRO
          </span>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#14151b] border border-white/10 text-xs font-extrabold tabular-nums">
          <OrbsCrystalIcon colored className="w-4 h-4 shrink-0" />
          <span>{user.orbs.toLocaleString('es-ES')}</span>
        </div>
      </header>

      <div className="max-w-lg mx-auto w-full px-4 pt-5">
        {/* Centered Discord NITRO Hero Header */}
        <div className="text-center mb-7">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-fuchsia-500/15 border border-fuchsia-400/30 text-fuchsia-300 text-[11px] font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Canjea con tus Orbs</span>
          </div>
          <h1 className="font-display font-black italic text-4xl sm:text-5xl tracking-tight text-white leading-none">
            NITRO
          </h1>
          <p className="text-[14.5px] text-zinc-400 mt-2.5">
            Desbloquea ventajas épicas usando tu saldo de Orbs
          </p>
        </div>

        {/* NITRO Card — 100.000 Orbs */}
        <div className="relative rounded-3xl bg-gradient-to-br from-[#8b3dff] via-[#b845c9] to-[#6d28d9] p-5 pt-7 border border-white/20 shadow-[0_20px_50px_-15px_rgba(168,85,247,0.55)]">
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-white text-[#111216] text-[11.5px] font-black tracking-wide shadow-lg whitespace-nowrap">
            EL MEJOR PLAN · 100K ORBS
          </div>

          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h2 className="font-display font-black italic text-[30px] tracking-tight leading-none text-white">
                NITRO
              </h2>
              <div className="inline-flex items-center gap-2 mt-2.5 px-3 py-1.5 rounded-2xl bg-black/30 border border-white/20 backdrop-blur-xs">
                <OrbsCrystalIcon colored className="w-5 h-5 shrink-0" />
                <span className="font-display font-black text-lg text-white tabular-nums">
                  100.000 Orbs
                </span>
              </div>
              <p className="text-[12.5px] text-white/85 mt-1.5">
                La experiencia definitiva con mejoras incluidas
              </p>
            </div>
            <WumpusNitroFly />
          </div>

          <ul className="space-y-2.5 mt-4 text-[14px] font-medium text-white">
            <li className="flex items-center gap-3">
              <Upload className="w-4 h-4 shrink-0 text-fuchsia-200" />
              <span>Subidas de 500 MB y archivos HD</span>
            </li>
            <li className="flex items-center gap-3">
              <Smile className="w-4 h-4 shrink-0 text-fuchsia-200" />
              <span>Emojis y stickers personalizados en cualquier servidor</span>
            </li>
            <li className="flex items-center gap-3">
              <Sparkles className="w-4 h-4 shrink-0 text-fuchsia-200" />
              <span>Superreacciones y efectos de perfil ilimitados</span>
            </li>
            <li className="flex items-center gap-3">
              <MonitorUp className="w-4 h-4 shrink-0 text-fuchsia-200" />
              <span>Transmitir vídeo hasta en 4K 60fps</span>
            </li>
            <li className="flex items-center gap-3">
              <Gem className="w-4 h-4 shrink-0 text-fuchsia-200" />
              <span>2 mejoras de servidor gratis + 30% extra</span>
            </li>
            <li className="flex items-center gap-3">
              <Sparkles className="w-4 h-4 shrink-0 text-fuchsia-200" />
              <span>Diseño especial de color de nombre con brillo y fuentes únicas</span>
            </li>
            <li className="flex items-center gap-3">
              <UserCheck className="w-4 h-4 shrink-0 text-fuchsia-200" />
              <span>Banners animados, perfiles por servidor y +x1,2 en Misiones</span>
            </li>
          </ul>

          <button
            onClick={() => setConfirmTier('nitro')}
            className="w-full mt-6 h-12 rounded-full dc-btn-white font-extrabold text-[15px] flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
          >
            {user.nitroTier === 'nitro' ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-[#23a55a]" />
                <span>Nitro Activo</span>
              </>
            ) : (
              <>
                <OrbsCrystalIcon colored className="w-4.5 h-4.5" />
                <span>Desbloquear por 100K Orbs</span>
              </>
            )}
          </button>
        </div>

        {/* NITRO BASIC Card — 50.000 Orbs */}
        <div className="mt-5 rounded-3xl bg-gradient-to-br from-[#2563eb] via-[#1d4ed8] to-[#0284c7] p-5 border border-white/15 shadow-[0_18px_45px_-15px_rgba(37,99,235,0.55)]">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h2 className="font-display font-black italic text-[26px] tracking-tight leading-none text-white">
                NITRO BASIC
              </h2>
              <div className="inline-flex items-center gap-2 mt-2.5 px-3 py-1.5 rounded-2xl bg-black/30 border border-white/20 backdrop-blur-xs">
                <OrbsCrystalIcon colored className="w-4.5 h-4.5 shrink-0" />
                <span className="font-display font-black text-base text-white tabular-nums">
                  50.000 Orbs
                </span>
              </div>
              <p className="text-[12.5px] text-white/85 mt-1.5">
                Esenciales de personalización y chat
              </p>
            </div>
            <WumpusScooter />
          </div>

          <ul className="space-y-2.5 mt-4 text-[14px] font-medium text-white">
            <li className="flex items-center gap-3">
              <Upload className="w-4 h-4 shrink-0 text-sky-200" />
              <span>Subidas de archivos de hasta 50 MB</span>
            </li>
            <li className="flex items-center gap-3">
              <Smile className="w-4 h-4 shrink-0 text-sky-200" />
              <span>Emojis personalizados en cualquier parte</span>
            </li>
            <li className="flex items-center gap-3">
              <Sparkles className="w-4 h-4 shrink-0 text-sky-200" />
              <span>Diseño especial de color de nombre con brillo</span>
            </li>
            <li className="flex items-center gap-3">
              <NitroWheelIcon className="w-4 h-4 shrink-0 text-sky-200" />
              <span>Insignia exclusiva de Nitro en tu perfil</span>
            </li>
          </ul>

          <button
            onClick={() => setConfirmTier('basic')}
            className="w-full mt-6 h-12 rounded-full dc-btn-white font-extrabold text-[15px] flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
          >
            {user.nitroTier === 'basic' ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-[#23a55a]" />
                <span>Nitro Basic Activo</span>
              </>
            ) : (
              <>
                <OrbsCrystalIcon colored className="w-4.5 h-4.5" />
                <span>Obtener Basic por 50K Orbs</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Nitro Activation Confirmation Modal */}
      {confirmTier && (
        <div
          onClick={() => setConfirmTier(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-3xl bg-[#111216] border border-white/15 p-5 space-y-4 shadow-2xl"
          >
            <div className="flex items-center gap-2.5">
              <NitroWheelIcon
                className={`w-6 h-6 ${
                  confirmTier === 'nitro' ? 'text-fuchsia-400' : 'text-sky-400'
                }`}
              />
              <h3 className="font-display font-bold text-lg text-white">
                {confirmTier === 'nitro' ? 'Activar Discord Nitro' : 'Activar Nitro Basic'}
              </h3>
            </div>

            <p className="text-sm text-zinc-300 leading-relaxed">
              {confirmTier === 'nitro'
                ? 'Desbloquearás la insignia de Nitro, diseño especial de color de nombre con brillo, decoraciones/efectos Nitro, 2 mejoras de servidor y multiplicador x1,2 en Misiones.'
                : 'Desbloquearás la insignia de Nitro Basic, diseño especial de color de nombre con brillo, emojis personalizados y subidas de 50 MB.'}
            </p>

            <div className="rounded-2xl bg-[#070709] border border-white/10 p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Precio del plan</span>
                <span className="font-extrabold text-white inline-flex items-center gap-1 tabular-nums">
                  <OrbsCrystalIcon colored className="w-4 h-4" />
                  {selectedCost.toLocaleString('es-ES')} Orbs
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Tu saldo actual</span>
                <span className="font-bold text-zinc-200 tabular-nums">
                  {user.orbs.toLocaleString('es-ES')} Orbs
                </span>
              </div>
              <div className="border-t border-white/[0.07] pt-2 flex items-center justify-between">
                <span className="text-zinc-400">Saldo restante</span>
                <span
                  className={`font-extrabold tabular-nums ${
                    canAffordSelected ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {canAffordSelected
                    ? `${(user.orbs - selectedCost).toLocaleString('es-ES')} Orbs`
                    : 'Saldo insuficiente'}
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setConfirmTier(null)}
                className="flex-1 h-11 rounded-full dc-btn-secondary text-sm font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                disabled={!canAffordSelected}
                onClick={() => {
                  onSubscribe(confirmTier, selectedCost);
                  setConfirmTier(null);
                }}
                className={`flex-1 h-11 rounded-full text-sm font-bold ${
                  canAffordSelected
                    ? 'dc-btn-primary cursor-pointer'
                    : 'bg-white/10 text-zinc-500 cursor-not-allowed'
                }`}
              >
                Confirmar ({confirmTier === 'nitro' ? '100K' : '50K'})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
