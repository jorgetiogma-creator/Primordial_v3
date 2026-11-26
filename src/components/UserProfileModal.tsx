import React, { useEffect, useState } from 'react';
import {
  Check,
  MessageCircle,
  PhoneCall,
  Send,
  Shield,
  Sparkles,
  UserCheck,
  UserPlus,
  Users,
  Video,
  X,
} from 'lucide-react';
import { BadgeId, PublicUserProfile, ServerRole, UserProfile } from '../types/discord';
import { BadgeArtwork } from './BadgesView';
import {
  NameplateStripBackground,
  ProfileEffectAnimationOverlay,
  ProfileFrameArtwork,
  StatusIndicator,
  UserAvatar,
  VerifiedBadge,
} from './DiscordArt';
import { getDisplayNameTextPresentation } from '../utils/displayNameStyle';
import { isVerifiedAccount } from '../utils/ownerAccess';

interface UserProfileModalProps {
  profile: PublicUserProfile | null;
  currentUser?: UserProfile;
  isSelf?: boolean;
  isFriend?: boolean;
  requestSent?: boolean;
  hasIncomingRequest?: boolean;
  serverRoles?: ServerRole[];
  onClose: () => void;
  onSendMessage?: (profile: PublicUserProfile, initialMessage?: string) => void;
  onStartCall?: (profile: PublicUserProfile, video: boolean) => void;
  onToggleFriend?: (profile: PublicUserProfile) => void;
  onAcceptFriendRequest?: (profile: PublicUserProfile) => void;
  onOpenSelfFullProfile?: () => void;
}

const NOTES_STORAGE_KEY = 'discord_user_notes_v1';

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  profile,
  currentUser,
  isSelf = false,
  isFriend = false,
  requestSent = false,
  hasIncomingRequest = false,
  serverRoles = [],
  onClose,
  onSendMessage,
  onStartCall,
  onToggleFriend,
  onAcceptFriendRequest,
  onOpenSelfFullProfile,
}) => {
  const [playKey, setPlayKey] = useState(1);
  const [note, setNote] = useState('');
  const [quickDmText, setQuickDmText] = useState('');

  useEffect(() => {
    if (!profile) return;
    setPlayKey((k) => k + 1);
    setQuickDmText('');
    try {
      const saved = JSON.parse(localStorage.getItem(NOTES_STORAGE_KEY) || '{}');
      setNote(saved[profile.id] || '');
    } catch {
      setNote('');
    }
  }, [profile?.id]);

  if (!profile) return null;

  const handleNoteChange = (val: string) => {
    setNote(val);
    try {
      const saved = JSON.parse(localStorage.getItem(NOTES_STORAGE_KEY) || '{}');
      saved[profile.id] = val;
      localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(saved));
    } catch {
      /* ignore */
    }
  };

  const handleQuickDmSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = quickDmText.trim();
    if (!clean) return;
    setQuickDmText('');
    onClose();
    onSendMessage?.(profile, clean);
  };

  const statusText =
    profile.status === 'online'
      ? 'En línea'
      : profile.status === 'idle'
      ? 'Ausente'
      : profile.status === 'dnd'
      ? 'No molestar'
      : 'Desconectado';

  const hasEffect = profile.profileEffect && profile.profileEffect !== 'none';
  const frameBorderClass =
    profile.profileFrame === 'obsidian'
      ? 'ring-1 ring-white/25 shadow-[0_0_25px_rgba(255,255,255,0.08)]'
      : profile.profileFrame === 'crimson'
      ? 'ring-2 ring-[#f23f43]/80 shadow-[0_0_28px_rgba(242,63,67,0.28)]'
      : profile.profileFrame === 'neon-blue'
      ? 'ring-2 ring-[#38bdf8]/80 shadow-[0_0_28px_rgba(56,189,248,0.3)]'
      : profile.profileFrame === 'gold'
      ? 'ring-2 ring-[#f0b232]/85 shadow-[0_0_28px_rgba(240,178,50,0.28)]'
      : profile.profileFrame === 'glitch'
      ? 'ring-2 ring-[#5865F2]/85 shadow-[0_0_28px_rgba(88,101,242,0.35)]'
      : '';
  const hasOrnateFrame =
    profile.profileFrame &&
    !['none', 'obsidian', 'crimson', 'neon-blue', 'gold', 'glitch'].includes(profile.profileFrame);

  return (
    <div
      onClick={onClose}
      className={`fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-end sm:items-center justify-center ${
        hasOrnateFrame ? 'pt-6 sm:p-6' : 'p-0 sm:p-4'
      }`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md relative max-h-[92vh] flex flex-col animate-[slideUp_220ms_cubic-bezier(0.16,1,0.3,1)]"
      >
        <ProfileFrameArtwork frame={profile.profileFrame} />
        <div
          className={`w-full rounded-t-3xl sm:rounded-3xl overflow-hidden bg-[#1c1d22] border border-[#2e3035] shadow-2xl relative flex flex-col max-h-[92vh] ${frameBorderClass}`}
        >
          {/* Mobile Bottom-Sheet Drag Handle */}
          <div className="sm:hidden absolute top-2 left-1/2 -translate-x-1/2 z-40 w-10 h-1 rounded-full bg-white/40 pointer-events-none" />

          {/* Fullscreen Viewport Entrance Profile Effect */}
          <ProfileEffectAnimationOverlay
            effect={profile.profileEffect}
            playKey={playKey}
            fullscreen
          />

          {/* Banner */}
          <div
            className="h-32 w-full relative overflow-hidden shrink-0"
            style={{ backgroundColor: profile.bannerColor || '#5865F2' }}
          >
            {profile.bannerImage && (
              <img
                src={profile.bannerImage}
                alt={`Banner de ${profile.displayName}`}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />

            <div className="absolute top-3 right-3 flex items-center gap-1.5 z-30">
              {hasEffect && (
                <button
                  type="button"
                  onClick={() => setPlayKey((k) => k + 1)}
                  title="Volver a reproducir efecto de perfil"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-black/60 hover:bg-black/85 border border-white/15 text-sky-300 text-[11px] font-bold cursor-pointer backdrop-blur-xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Efecto</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar perfil"
                className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/85 border border-white/15 text-white flex items-center justify-center cursor-pointer backdrop-blur-xs"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Scrollable Profile Body */}
          <div className="px-4 pb-5 -mt-12 relative z-10 overflow-y-auto space-y-3.5">
            {/* Avatar + Status Thought Bubble */}
            <div className="flex items-end justify-between gap-2">
              <div className="p-1.5 rounded-full bg-[#1c1d22] inline-block shadow-xl">
                <UserAvatar
                  avatar={profile.avatar}
                  customAvatarUrl={profile.customAvatarUrl}
                  status={profile.status}
                  decoration={profile.decoration || 'none'}
                  size="xl"
                  borderColor="#1c1d22"
                />
              </div>

              {profile.customStatus && (
                <div className="relative mb-2 flex-1 max-w-[230px] rounded-2xl bg-[#26272f] border border-[#2e3035] px-3 py-2 shadow-lg">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#26272f] border border-[#2e3035] absolute -left-2 bottom-1.5" />
                  <p className="text-[12.5px] text-[#f2f3f5] line-clamp-2 leading-snug">
                    {profile.customStatus}
                  </p>
                </div>
              )}
            </div>

            {/* Identity Header + Nameplate Highlight */}
            <div
              className={`relative rounded-2xl p-3.5 border border-[#2e3035] overflow-hidden ${
                profile.nameplate && profile.nameplate !== 'none'
                  ? 'bg-[#26272f]'
                  : 'bg-[#111214]'
              }`}
            >
              {profile.nameplate && profile.nameplate !== 'none' && (
                <NameplateStripBackground nameplate={profile.nameplate} />
              )}
              <div className="relative z-10">
                <div className="flex items-center gap-2 flex-wrap">
                  {(() => {
                    const hasCustomColor = Boolean(
                      profile.displayNameColorPreset && profile.displayNameColorPreset !== 'none'
                    );
                    const namePres = getDisplayNameTextPresentation({
                      style: profile.displayNameStyle,
                      colorPreset: profile.displayNameColorPreset,
                      customColors: profile.displayNameCustomColors,
                      glow: profile.displayNameGlow,
                      nitroUnlocked: profile.nitroTier !== 'none' || hasCustomColor,
                    });
                    return (
                      <h2
                        className={`text-xl font-bold leading-tight ${
                          hasCustomColor ? '' : 'text-white drop-shadow'
                        } ${namePres.className}`}
                        style={namePres.style}
                      >
                        {profile.displayName}
                      </h2>
                    );
                  })()}
                  {!profile.isBot && isVerifiedAccount(profile.username) && (
                    <VerifiedBadge size="md" />
                  )}
                  {profile.isBot && (
                    <span className="px-1.5 py-0.5 rounded bg-[#5865F2] text-[10px] font-bold text-white uppercase inline-flex items-center gap-0.5">
                      <Check className="w-2.5 h-2.5 stroke-[3]" /> APP
                    </span>
                  )}
                  {profile.serverTag && (
                    <span className="px-2 py-0.5 rounded-md bg-black/50 border border-white/15 text-[11px] font-bold text-white">
                      {profile.serverTag}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-[#b5bac1]">
                  <span>@{profile.username}</span>
                  {profile.pronouns && <span className="text-[#949ba4]">· {profile.pronouns}</span>}
                  <span className="inline-flex items-center gap-1 text-[11px] text-[#b5bac1]">
                    <StatusIndicator status={profile.status} size="xs" borderColor="#111214" />
                    {statusText}
                  </span>
                </div>

                {profile.badgeIds && profile.badgeIds.length > 0 && (
                  <div className="inline-flex items-center gap-1.5 mt-2.5 px-2.5 py-1 rounded-xl bg-black/55 border border-[#2e3035]">
                    {profile.badgeIds.map((b) => (
                      <BadgeArtwork
                        key={b}
                        badgeId={b as BadgeId}
                        unlocked
                        user={isSelf ? currentUser : undefined}
                        size="sm"
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Discord Mobile Quick Actions Bar */}
            {isSelf ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSelfFullProfile?.();
                }}
                className="w-full h-11 rounded-full dc-btn-primary text-sm font-bold cursor-pointer"
              >
                Ver y editar mi perfil completo
              </button>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onSendMessage?.(profile);
                  }}
                  className="flex flex-col items-center justify-center gap-1 py-2.5 rounded-2xl bg-[#26272f] hover:bg-[#2e3035] border border-[#2e3035] text-white cursor-pointer transition-colors"
                >
                  <MessageCircle className="w-4.5 h-4.5 text-[#5865F2]" />
                  <span className="text-[11px] font-semibold">Mensaje</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onStartCall?.(profile, false);
                  }}
                  className="flex flex-col items-center justify-center gap-1 py-2.5 rounded-2xl bg-[#26272f] hover:bg-[#2e3035] border border-[#2e3035] text-white cursor-pointer transition-colors"
                >
                  <PhoneCall className="w-4.5 h-4.5 text-[#23a55a]" />
                  <span className="text-[11px] font-semibold">Llamar</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onStartCall?.(profile, true);
                  }}
                  className="flex flex-col items-center justify-center gap-1 py-2.5 rounded-2xl bg-[#26272f] hover:bg-[#2e3035] border border-[#2e3035] text-white cursor-pointer transition-colors"
                >
                  <Video className="w-4.5 h-4.5 text-sky-400" />
                  <span className="text-[11px] font-semibold">Vídeo</span>
                </button>
                <button
                  type="button"
                  disabled={requestSent && !isFriend && !hasIncomingRequest}
                  onClick={() => {
                    if (hasIncomingRequest && !isFriend) {
                      onAcceptFriendRequest?.(profile);
                    } else if (!requestSent || isFriend) {
                      onToggleFriend?.(profile);
                    }
                  }}
                  className={`flex flex-col items-center justify-center gap-1 py-2.5 rounded-2xl border transition-colors ${
                    hasIncomingRequest && !isFriend
                      ? 'bg-[#23a55a]/20 hover:bg-[#23a55a]/30 border-[#23a55a]/50 text-[#3dd67d] cursor-pointer'
                      : requestSent && !isFriend
                      ? 'bg-[#1e1f26] border-[#2e3035] text-[#949ba4] cursor-default opacity-80'
                      : 'bg-[#26272f] hover:bg-[#2e3035] border-[#2e3035] text-white cursor-pointer'
                  }`}
                >
                  {isFriend ? (
                    <>
                      <UserCheck className="w-4.5 h-4.5 text-[#23a55a]" />
                      <span className="text-[11px] font-semibold">Amigo</span>
                    </>
                  ) : hasIncomingRequest ? (
                    <>
                      <Check className="w-4.5 h-4.5 text-[#23a55a]" />
                      <span className="text-[11px] font-semibold">Aceptar</span>
                    </>
                  ) : requestSent ? (
                    <>
                      <Check className="w-4.5 h-4.5 text-[#949ba4]" />
                      <span className="text-[11px] font-semibold">Enviada</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4.5 h-4.5 text-[#f0b232]" />
                      <span className="text-[11px] font-semibold">Añadir</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Quick DM inline composer */}
            {!isSelf && onSendMessage && (
              <form
                onSubmit={handleQuickDmSubmit}
                className="flex items-center gap-2 rounded-2xl bg-[#26272f] border border-[#2e3035] px-3 py-2"
              >
                <input
                  type="text"
                  value={quickDmText}
                  onChange={(e) => setQuickDmText(e.target.value)}
                  placeholder={`Enviar mensaje rápido a ${profile.displayName}...`}
                  className="flex-1 bg-transparent text-[14px] text-[#f2f3f5] placeholder:text-[#949ba4] focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!quickDmText.trim()}
                  aria-label="Enviar mensaje directo rápido"
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                    quickDmText.trim()
                      ? 'bg-[#5865F2] text-white cursor-pointer'
                      : 'bg-[#1c1d22] text-[#949ba4] opacity-50'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            )}

            {/* Acerca de mí + Miembro desde + Roles */}
            <div className="rounded-2xl bg-[#111214] border border-[#2e3035] p-3.5 space-y-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#949ba4] mb-1">
                  Acerca de mí
                </p>
                <p className="text-[14px] text-[#f2f3f5] leading-relaxed whitespace-pre-wrap">
                  {profile.bio || 'Miembro de Primordial.'}
                </p>
              </div>

              <div className="border-t border-[#2e3035] pt-2.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#949ba4] mb-1">
                  Miembro desde
                </p>
                <p className="text-[13px] font-semibold text-[#f2f3f5] tabular-nums">
                  {profile.memberSince}
                </p>
              </div>

              {serverRoles.length > 0 && (
                <div className="border-t border-[#2e3035] pt-2.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#949ba4] mb-1.5 flex items-center gap-1">
                    <Shield className="w-3 h-3" /> Roles en este servidor
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {serverRoles.map((r) => (
                      <span
                        key={r.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#26272f] border border-[#2e3035] text-xs font-semibold text-[#f2f3f5]"
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: r.color }}
                        />
                        <span>{r.name}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {profile.mutualServers && profile.mutualServers.length > 0 && !isSelf && (
                <div className="border-t border-[#2e3035] pt-2.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#949ba4] mb-1.5 flex items-center gap-1">
                    <Users className="w-3 h-3" /> Servidores en común · {profile.mutualServers.length}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.mutualServers.map((srvName) => (
                      <span
                        key={srvName}
                        className="px-2.5 py-1 rounded-lg bg-[#26272f] border border-[#2e3035] text-xs font-semibold text-[#b5bac1]"
                      >
                        {srvName}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Nota personal */}
            {!isSelf && (
              <div className="rounded-2xl bg-[#111214] border border-[#2e3035] p-3.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#949ba4] block mb-1.5">
                  Nota (solo tú puedes verla)
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => handleNoteChange(e.target.value)}
                  placeholder="Haz clic para añadir una nota..."
                  className="w-full bg-[#26272f] border border-[#2e3035] rounded-xl px-3 py-2 text-xs text-white placeholder:text-[#949ba4] focus:outline-none focus:border-[#5865F2]"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
