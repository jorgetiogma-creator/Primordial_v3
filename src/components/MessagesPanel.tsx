import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Bell,
  BellOff,
  CalendarPlus,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  Gamepad2,
  Globe,
  Hash,
  Home,
  Lock,
  Mail,
  Megaphone,
  MicOff,
  MoreHorizontal,
  PhoneMissed,
  Pin,
  PinOff,
  Plus,
  Search,
  Settings,
  Star,
  Trash2,
  UserPlus,
  Users,
  Volume2,
  X,
} from 'lucide-react';
import {
  BadgeId,
  DirectMessageThread,
  DropInVoiceRoom,
  FriendActivity,
  PublicUserProfile,
  Server,
  ServerSettingsSection,
  ServerTemplateId,
  UserProfile,
  VoiceSession,
} from '../types/discord';
import { EPHEMERAL_STATUS_PRESETS } from '../data/discordData';
import { BadgeArtwork } from './BadgesView';
import {
  GENERATED_ASSETS,
  NameplateStripBackground,
  SafeImage,
  ServerIconArt,
  UserAvatar,
  VerifiedBadge,
} from './DiscordArt';
import { BoostGemIcon } from './ServerBoostView';
import { getDisplayNameTextPresentation } from '../utils/displayNameStyle';
import { getServerPermissions, isOwnerUsername, isVerifiedAccount } from '../utils/ownerAccess';
import { useTranslation } from '../utils/i18n';

interface MessagesPanelProps {
  dms: DirectMessageThread[];
  activities: FriendActivity[];
  servers: Server[];
  activeContext:
    | { type: 'dm' }
    | { type: 'favorites' }
    | { type: 'servidores' }
    | { type: 'server'; serverId: string };
  selectedDmId: string | null;
  selectedChannelId: string | null;
  voiceSession: VoiceSession;
  currentUser: UserProfile;
  typingDmIds?: Record<string, string | null>;
  pendingFriendRequestsCount?: number;
  curatedServers?: Server[];
  joinedCuratedIds?: string[];
  dropInRooms?: DropInVoiceRoom[];
  liveProfilesByUid?: Record<string, PublicUserProfile>;
  onSelectDm: (dmId: string) => void;
  onSelectChannel: (serverId: string, channelId: string) => void;
  onJoinVoice: (serverId: string, channelId: string, channelName: string, serverName: string) => void;
  onJoinDropInRoom?: (room: DropInVoiceRoom) => void;
  onUpdateEphemeralStatus?: (status: string, expiresInHours?: number) => void;
  onJoinCuratedServer?: (serverId: string) => void;
  onOpenFriends: () => void;
  onOpenNewGroupDm: () => void;
  onSelectActivity: (act: FriendActivity) => void;
  onOpenCreateServerModal: (templateId?: ServerTemplateId) => void;
  onJoinCommunity: (name: string) => void;
  onOpenDiscover?: () => void;
  onOpenServerBoost: (serverId: string) => void;
  onOpenServerSettings: (serverId: string, section?: ServerSettingsSection) => void;
  onMarkServerRead: (serverId: string) => void;
  onUpdateServer: (serverId: string, patch: Partial<Server>) => void;
  onOpenProfile: (serverId?: string) => void;
  onInspectUser?: (userId: string, fallback?: Partial<PublicUserProfile>) => void;
  onToggleDmPin?: (dmId: string) => void;
  onToggleDmMute?: (dmId: string) => void;
  onToggleDmUnread?: (dmId: string) => void;
  onToggleDmFavorite?: (dmId: string) => void;
  onCloseDm?: (dmId: string) => void;
  onNotify: (msg: string) => void;
}

export const MessagesPanel: React.FC<MessagesPanelProps> = ({
  dms,
  activities,
  servers,
  activeContext,
  selectedDmId,
  selectedChannelId,
  voiceSession,
  currentUser,
  typingDmIds = {},
  pendingFriendRequestsCount = 0,
  curatedServers = [],
  joinedCuratedIds = [],
  dropInRooms = [],
  liveProfilesByUid = {},
  onSelectDm,
  onSelectChannel,
  onJoinVoice,
  onJoinDropInRoom,
  onUpdateEphemeralStatus,
  onJoinCuratedServer,
  onOpenFriends,
  onOpenNewGroupDm,
  onSelectActivity,
  onOpenCreateServerModal,
  onJoinCommunity,
  onOpenDiscover,
  onOpenServerBoost,
  onOpenServerSettings,
  onMarkServerRead,
  onUpdateServer,
  onOpenProfile,
  onInspectUser,
  onToggleDmPin,
  onToggleDmMute,
  onToggleDmUnread,
  onToggleDmFavorite,
  onCloseDm,
  onNotify,
}) => {
  const { t } = useTranslation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [quickSearchOpen, setQuickSearchOpen] = useState(false);
  const [quickSearchQuery, setQuickSearchQuery] = useState('');
  const [dmFilter, setDmFilter] = useState<'all' | 'unread' | 'groups'>('all');
  const [openDmMenuId, setOpenDmMenuId] = useState<string | null>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [showServerSheet, setShowServerSheet] = useState(false);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState(currentUser.customStatus || '');
  const [noteHours, setNoteHours] = useState<number>(4);
  const [showDropInRooms, setShowDropInRooms] = useState(false);

  const quickResults = useMemo(() => {
    const q = quickSearchQuery.trim().toLowerCase();
    const dmItems = dms
      .filter(
        (d) =>
          !q ||
          d.name.toLowerCase().includes(q) ||
          (d.username || '').toLowerCase().includes(q) ||
          d.lastMessagePreview.toLowerCase().includes(q) ||
          d.messages.some((m) => m.content.toLowerCase().includes(q))
      )
      .slice(0, 6);

    const channelItems: {
      serverId: string;
      serverName: string;
      channelId: string;
      channelName: string;
      channelType: 'text' | 'voice' | 'announcement';
      matchedSnippet?: string;
    }[] = [];

    for (const srv of servers) {
      for (const ch of srv.channels) {
        const nameHit = ch.name.toLowerCase().includes(q) || srv.name.toLowerCase().includes(q);
        const msgHit = q
          ? ch.messages.find((m) => m.content.toLowerCase().includes(q))
          : undefined;
        if (!q || nameHit || msgHit) {
          channelItems.push({
            serverId: srv.id,
            serverName: srv.name,
            channelId: ch.id,
            channelName: ch.name,
            channelType: ch.type,
            matchedSnippet: msgHit ? `${msgHit.authorName}: ${msgHit.content}` : undefined,
          });
        }
      }
    }

    return {
      dmItems,
      channelItems: channelItems.slice(0, 10),
    };
  }, [quickSearchQuery, dms, servers]);

  const renderQuickSearchModal = () =>
    quickSearchOpen ? (
      <div
        onClick={() => setQuickSearchOpen(false)}
        className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-start justify-center p-4 pt-14"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md rounded-3xl bg-[#1c1d22] border border-[#2e3035] shadow-2xl overflow-hidden flex flex-col max-h-[78vh] animate-[slideUp_180ms_ease-out]"
        >
          <div className="p-3 border-b border-[#2e3035] flex items-center gap-2 bg-[#111214]">
            <Search className="w-4 h-4 text-[#949ba4] shrink-0" />
            <input
              type="text"
              autoFocus
              value={quickSearchQuery}
              onChange={(e) => setQuickSearchQuery(e.target.value)}
              placeholder="Buscar chats, canales, servidores o mensajes..."
              className="flex-1 bg-transparent text-[14.5px] text-[#f2f3f5] placeholder:text-[#949ba4] focus:outline-none min-w-0"
            />
            <button
              type="button"
              onClick={() => {
                setQuickSearchQuery('');
                setQuickSearchOpen(false);
              }}
              className="w-7 h-7 rounded-full hover:bg-[#26272f] flex items-center justify-center text-[#949ba4] hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2.5 space-y-3">
            {quickResults.dmItems.length > 0 && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#949ba4] px-2 mb-1">
                  Mensajes Directos
                </p>
                <div className="space-y-1">
                  {quickResults.dmItems.map((dm) => (
                    <button
                      key={dm.id}
                      type="button"
                      onClick={() => {
                        setQuickSearchOpen(false);
                        setQuickSearchQuery('');
                        onSelectDm(dm.id);
                      }}
                      className="w-full flex items-center gap-2.5 p-2 rounded-2xl hover:bg-[#26272f] text-left cursor-pointer"
                    >
                      <UserAvatar avatar={dm.avatar} status={dm.status} size="sm" borderColor="#1c1d22" />
                      <div className="min-w-0 flex-1">
                        {(() => {
                          const hasCustomColor = Boolean(
                            dm.displayNameColorPreset && dm.displayNameColorPreset !== 'none'
                          );
                          const dmNamePres = !dm.isGroup && !dm.isBot
                            ? getDisplayNameTextPresentation({
                                style: dm.displayNameStyle,
                                colorPreset: dm.displayNameColorPreset,
                                customColors: dm.displayNameCustomColors,
                                glow: dm.displayNameGlow,
                                nitroUnlocked: dm.nitroTier !== 'none' || hasCustomColor,
                              })
                            : null;
                          return (
                            <p className="text-sm font-semibold text-[#f2f3f5] truncate inline-flex items-center gap-1 max-w-full">
                              <span
                                className={`truncate ${dmNamePres ? dmNamePres.className : ''}`}
                                style={dmNamePres ? dmNamePres.style : undefined}
                              >
                                {dm.name}
                              </span>
                              {!dm.isGroup && !dm.isBot && isVerifiedAccount(dm.username) && (
                                <VerifiedBadge size="sm" />
                              )}
                            </p>
                          );
                        })()}
                        <p className="text-xs text-[#949ba4] truncate">{dm.lastMessagePreview}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {quickResults.channelItems.length > 0 && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#949ba4] px-2 mb-1">
                  Canales y Servidores
                </p>
                <div className="space-y-1">
                  {quickResults.channelItems.map((item) => (
                    <button
                      key={`${item.serverId}-${item.channelId}`}
                      type="button"
                      onClick={() => {
                        setQuickSearchOpen(false);
                        setQuickSearchQuery('');
                        const srv = servers.find((s) => s.id === item.serverId);
                        if (item.channelType === 'voice' && srv) {
                          onJoinVoice(srv.id, item.channelId, item.channelName, srv.name);
                        } else {
                          onSelectChannel(item.serverId, item.channelId);
                        }
                      }}
                      className="w-full flex items-center gap-2.5 p-2 rounded-2xl hover:bg-[#26272f] text-left cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-xl bg-[#26272f] border border-[#2e3035] flex items-center justify-center shrink-0 text-[#949ba4]">
                        {item.channelType === 'voice' ? (
                          <Volume2 className="w-4 h-4" />
                        ) : item.channelType === 'announcement' ? (
                          <Megaphone className="w-4 h-4" />
                        ) : (
                          <Hash className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-[#f2f3f5] truncate">
                          #{item.channelName}{' '}
                          <span className="text-xs font-normal text-[#949ba4]">· {item.serverName}</span>
                        </p>
                        {item.matchedSnippet && (
                          <p className="text-xs text-[#b5bac1] truncate">{item.matchedSnippet}</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {quickResults.dmItems.length === 0 && quickResults.channelItems.length === 0 && (
              <p className="text-center text-xs text-[#949ba4] py-8">
                No hay resultados para &ldquo;{quickSearchQuery}&rdquo;.
              </p>
            )}
          </div>
        </div>
      </div>
    ) : null;

  const baseDms = useMemo(() => {
    const contextList =
      activeContext.type === 'favorites' ? dms.filter((d) => Boolean(d.favorite)) : dms;
    const byTab = contextList.filter((d) => {
      if (activeContext.type === 'favorites') return true;
      if (dmFilter === 'unread') return Boolean(d.unread || (d.unreadCount ?? 0) > 0);
      if (dmFilter === 'groups') return Boolean(d.isGroup);
      return true;
    });
    const q = searchQuery.trim().toLowerCase();
    const bySearch = q
      ? byTab.filter(
          (d) =>
            d.name.toLowerCase().includes(q) ||
            (d.username || '').toLowerCase().includes(q) ||
            d.lastMessagePreview.toLowerCase().includes(q) ||
            d.messages.some((m) => m.content.toLowerCase().includes(q))
        )
      : byTab;

    return [...bySearch].sort((a, b) => {
      if (Boolean(a.pinned) !== Boolean(b.pinned)) return a.pinned ? -1 : 1;
      return 0;
    });
  }, [dms, activeContext.type, dmFilter, searchQuery]);

  const unreadDmCount = dms.filter((d) => d.unread || (d.unreadCount ?? 0) > 0).length;
  const groupsDmCount = dms.filter((d) => Boolean(d.isGroup)).length;

  /* EXACT SCREENSHOT 8: Servidores screen inside the rail panel */
  if (activeContext.type === 'servidores') {
    return (
      <div className="flex-1 flex flex-col bg-[var(--dc-bg-sidebar)] rounded-tl-2xl overflow-hidden min-w-0">
        <div className="px-4 pt-4 pb-2 shrink-0">
          <h1 className="font-display font-extrabold text-[22px] tracking-tight text-[var(--dc-text-primary)]">
            Servidores
          </h1>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-24 md:pb-6 space-y-4">
          <div>
            <h2 className="font-display font-bold text-[16px] text-[var(--dc-text-primary)]">
              Crea un lugar para ti y tus amigos
            </h2>
            <p className="text-[13px] text-[var(--dc-text-secondary)] mt-1 leading-snug">
              Los servidores son donde tus amigos y tú os reunís. Cread el vuestro y empezad a
              hablar.
            </p>
          </div>

          {/* Horizontal scrollable original cards */}
          <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => onOpenCreateServerModal('friends')}
              className="w-[230px] shrink-0 rounded-2xl bg-[var(--dc-bg-card)] hover:bg-[var(--dc-bg-elevated)] border border-[var(--dc-border)] p-4 text-left transition-colors cursor-pointer"
            >
              <div className="h-24 flex items-center justify-center mb-2">
                <svg viewBox="0 0 120 80" className="w-28 h-20" aria-hidden="true">
                  <rect x="20" y="28" width="32" height="22" rx="8" fill="#60a5fa" />
                  <rect x="68" y="28" width="32" height="22" rx="8" fill="#a855f7" />
                  <circle cx="52" cy="39" r="10" fill="#818cf8" />
                  <circle cx="68" cy="39" r="10" fill="#c084fc" />
                  <path d="M58 14 L62 22 M44 18 L50 24 M76 18 L70 24" stroke="#818cf8" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>
              <p className="font-display font-bold text-[14.5px] text-[var(--dc-text-primary)]">
                Solo para pasar el rato
              </p>
              <p className="text-[12px] text-[var(--dc-text-secondary)] mt-1 leading-snug">
                Un punto de encuentro privado para ti y tu gente, sin necesidad de tema.
              </p>
            </button>

            <button
              onClick={() => onOpenCreateServerModal('gaming')}
              className="w-[230px] shrink-0 rounded-2xl bg-[var(--dc-bg-card)] hover:bg-[var(--dc-bg-elevated)] border border-[var(--dc-border)] p-4 text-left transition-colors cursor-pointer"
            >
              <div className="h-24 flex items-center justify-center mb-2">
                <svg viewBox="0 0 120 80" className="w-28 h-20" aria-hidden="true">
                  <rect x="28" y="18" width="58" height="40" rx="12" fill="#5865F2" />
                  <polygon points="40,58 50,58 38,68" fill="#5865F2" />
                  <path d="M51 38 H63 M57 32 V44" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
                  <rect x="74" y="34" width="18" height="14" rx="4" fill="#312e81" />
                </svg>
              </div>
              <p className="font-display font-bold text-[14.5px] text-[var(--dc-text-primary)]">
                Para juegos
              </p>
              <p className="text-[12px] text-[var(--dc-text-secondary)] mt-1 leading-snug">
                Una base de operaciones para que tu equipo se reúna, comparta clips y hable de
                estrategia.
              </p>
            </button>
          </div>

          <div className="space-y-2.5">
            <button
              onClick={() => onOpenCreateServerModal('friends')}
              className="w-full h-11 rounded-full dc-btn-primary font-semibold text-[14.5px] cursor-pointer whitespace-nowrap"
            >
              Crear un servidor
            </button>
            <button
              onClick={() => setInviteOpen((v) => !v)}
              className="w-full h-11 rounded-full dc-btn-secondary font-semibold text-[14.5px] cursor-pointer whitespace-nowrap"
            >
              Tengo un enlace de invitación
            </button>

            {inviteOpen && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!inviteCode.trim()) return;
                  onJoinCommunity(inviteCode.trim());
                  setInviteCode('');
                  setInviteOpen(false);
                }}
                className="flex gap-2 pt-1"
              >
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="https://discord.gg/..."
                  className="flex-1 bg-[var(--dc-bg-input)] border border-[var(--dc-border)] rounded-xl px-3 py-2 text-sm text-[var(--dc-text-primary)] focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl dc-btn-success text-xs font-bold cursor-pointer whitespace-nowrap"
                >
                  Unirse
                </button>
              </form>
            )}
          </div>

          {/* Explorar comunidades reales */}
          <div className="pt-2 space-y-3">
            <div>
              <h2 className="font-display font-bold text-[16px] text-[var(--dc-text-primary)]">
                Explorar comunidades reales
              </h2>
              <p className="text-[12.5px] text-[var(--dc-text-secondary)] mt-0.5 leading-snug">
                Descubre servidores públicos creados por usuarios reales o únete usando un ID o código de invitación.
              </p>
            </div>

            <div className="rounded-2xl bg-[var(--dc-bg-card)] border border-[var(--dc-border)] p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#5865F2]/20 border border-[#5865F2]/40 flex items-center justify-center shrink-0">
                  <Globe className="w-5 h-5 text-[#7b85ff]" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-display font-bold text-[15px] text-[var(--dc-text-primary)]">
                    Directorio de servidores
                  </h3>
                  <p className="text-xs text-[var(--dc-text-secondary)]">
                    Solo el dueño o administradores con permiso pueden modificar un servidor.
                  </p>
                </div>
              </div>
              <button
                onClick={() => (onOpenDiscover ? onOpenDiscover() : setInviteOpen(true))}
                className="w-full h-10 rounded-full dc-btn-primary text-xs font-bold cursor-pointer whitespace-nowrap"
              >
                Descubrir servidores públicos
              </button>
            </div>

            {curatedServers.length > 0 && (
              <div className="space-y-2 pt-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--dc-text-muted)]">
                  Comunidades listas para unirte con 1 clic
                </p>
                {curatedServers.slice(0, 4).map((srv) => {
                  const alreadyJoined =
                    joinedCuratedIds.includes(srv.id) ||
                    servers.some((existing) => existing.id === srv.id);
                  return (
                    <div
                      key={srv.id}
                      className="rounded-2xl bg-[var(--dc-bg-card)] border border-[var(--dc-border)] p-3 flex items-center gap-3"
                    >
                      <div className="w-11 h-11 rounded-2xl overflow-hidden shrink-0">
                        <ServerIconArt server={srv} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-display font-bold text-sm text-[var(--dc-text-primary)] truncate">
                          {srv.name}
                        </p>
                        <p className="text-[11.5px] text-[var(--dc-text-muted)] truncate">
                          {srv.onlineCount} en línea · {srv.description}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (alreadyJoined && srv.channels[0]) {
                            onSelectChannel(srv.id, srv.channels[0].id);
                          } else if (onJoinCuratedServer) {
                            onJoinCuratedServer(srv.id);
                          } else {
                            onJoinCommunity(srv.id);
                          }
                        }}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 cursor-pointer ${
                          alreadyJoined ? 'dc-btn-secondary' : 'dc-btn-success'
                        }`}
                      >
                        {alreadyJoined ? 'Abrir' : 'Unirse'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (activeContext.type === 'server') {
    const server = servers.find((s) => s.id === activeContext.serverId);
    if (!server) return null;

    const {
      isOwner = false,
      canManageServer = false,
      canManageChannels = false,
      canKickMembers = false,
      canManageRoles = false,
      canPinMessages = false,
    } = getServerPermissions(server, currentUser.id);

    const hasServerAdminAccess = Boolean(
      isOwner || canManageServer || canManageChannels || canManageRoles || canKickMembers || canPinMessages
    );

    const orderedCategories = Array.from(
      new Set([...(server.categoriesOrder || ['']), ...server.channels.map((c) => c.category)])
    );

    const renderChannelRow = (ch: Server['channels'][number]) => {
      const isSelected = selectedChannelId === ch.id;
      const isVoiceConnected =
        voiceSession.active &&
        voiceSession.channelName === ch.name &&
        voiceSession.contextName === server.name;

      return (
        <div key={ch.id}>
          <button
            onClick={() => {
              if (ch.type === 'voice') {
                onJoinVoice(server.id, ch.id, ch.name, server.name);
              } else {
                onSelectChannel(server.id, ch.id);
              }
            }}
            className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
              isSelected || isVoiceConnected
                ? 'bg-[var(--dc-bg-elevated)] text-[var(--dc-text-primary)]'
                : 'text-[var(--dc-text-secondary)] hover:bg-[var(--dc-bg-elevated)]/60 hover:text-[var(--dc-text-primary)]'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="relative shrink-0">
                {ch.type === 'voice' ? (
                  <Volume2
                    className={`w-4 h-4 ${
                      isVoiceConnected ? 'text-[#23a55a]' : 'text-[var(--dc-text-muted)]'
                    }`}
                  />
                ) : ch.type === 'announcement' ? (
                  <Megaphone className="w-4 h-4 text-[var(--dc-text-muted)]" />
                ) : (
                  <Hash className="w-4 h-4 text-[var(--dc-text-muted)]" />
                )}
                {ch.isPrivate && (
                  <Lock className="w-2.5 h-2.5 text-zinc-200 bg-[var(--dc-bg-sidebar)] rounded-full absolute -top-1 -right-1" />
                )}
              </div>
              <span className="truncate">{ch.name}</span>
            </div>

            {ch.unreadCount && ch.unreadCount > 0 && !isSelected && (
              <span className="min-w-[18px] h-[18px] px-1.5 rounded-full bg-[#da373c] text-white text-[11px] font-bold tabular-nums flex items-center justify-center">
                {ch.unreadCount}
              </span>
            )}
          </button>

          {ch.type === 'voice' && (
            <div className="pl-7 pr-2 space-y-1 mt-0.5">
              {isVoiceConnected && (
                <div className="flex items-center justify-between py-1 px-2 rounded-lg bg-[#23a55a]/10">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="rounded-full speaking-ring">
                      <UserAvatar avatar={currentUser.avatar} size="xs" showStatus={false} />
                    </div>
                    {(() => {
                      const voicePres = getDisplayNameTextPresentation({
                        style: currentUser.displayNameStyle,
                        colorPreset: currentUser.displayNameColorPreset,
                        customColors: currentUser.displayNameCustomColors,
                        glow: currentUser.displayNameGlow,
                        nitroUnlocked: currentUser.nitroTier !== 'none',
                      });
                      return (
                        <span
                          className={`text-xs truncate ${voicePres.className}`}
                          style={voicePres.style}
                        >
                          {currentUser.displayName}
                        </span>
                      );
                    })()}
                  </div>
                  {voiceSession.muted && <MicOff className="w-3.5 h-3.5 text-[#da373c]" />}
                </div>
              )}
              {ch.voiceParticipants?.map((vp) => (
                <div key={vp.id} className="flex items-center justify-between py-1 px-2 rounded-lg">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={vp.speaking ? 'rounded-full speaking-ring' : ''}>
                      <UserAvatar avatar={vp.avatar} size="xs" showStatus={false} />
                    </div>
                    <span className="text-xs text-[var(--dc-text-secondary)] truncate">
                      {vp.name}
                    </span>
                  </div>
                  {vp.muted && <MicOff className="w-3.5 h-3.5 text-[var(--dc-text-muted)]" />}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    };

    return (
      <div className="flex-1 flex flex-col bg-[var(--dc-bg-sidebar)] rounded-tl-2xl overflow-hidden min-w-0 relative">
        {/* Server Header + Optional Unlocked Banner */}
        <div
          onClick={() => setShowServerSheet(true)}
          className="relative border-b border-[var(--dc-border)] shrink-0 cursor-pointer overflow-hidden group"
          style={
            server.bannerImage
              ? undefined
              : {
                  background: `linear-gradient(180deg, ${server.bannerColor || '#09090b'} 0%, var(--dc-bg-sidebar) 100%)`,
                }
          }
        >
          {server.bannerImage && (
            <div className="relative h-24 w-full overflow-hidden">
              <SafeImage
                src={server.bannerImage}
                alt={server.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--dc-bg-sidebar)] via-black/35 to-black/15" />
            </div>
          )}

          <div className={`px-4 ${server.bannerImage ? 'pb-3 -mt-6 relative z-10' : 'pt-4 pb-3'}`}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <h2 className="font-display font-bold text-[17px] text-white truncate">
                  {server.name}
                </h2>
                <ChevronRight className="w-4 h-4 text-zinc-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setQuickSearchOpen(true);
                  }}
                  title="Buscador rápido"
                  className="w-7 h-7 rounded-full bg-black/50 hover:bg-black/80 border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenServerBoost(server.id);
                  }}
                  title="Mejorar este servidor"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-black/55 hover:bg-black/80 border border-pink-400/40 px-2.5 py-0.5 rounded-full tabular-nums cursor-pointer transition-colors"
                >
                  <BoostGemIcon className="w-3.5 h-3.5" />
                  <span>{server.boostLevel > 0 ? `Nivel ${server.boostLevel}` : 'Mejorar'}</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenServerSettings(server.id, 'menu');
                  }}
                  title="Ajustes del servidor"
                  className="w-7 h-7 rounded-full bg-black/50 hover:bg-black/80 border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-300 mt-1 tabular-nums">
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#23a55a]" />
                {server.onlineCount} en línea
              </span>
              <span>·</span>
              <span>{server.memberCountDisplay ?? server.memberCount} miembros</span>
              {server.communityEnabled && (
                <>
                  <span>·</span>
                  <span>Comunidad</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Channels List */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
          {orderedCategories.map((cat) => {
            const channels = server.channels.filter((c) => c.category === cat);
            if (cat === '') {
              if (channels.length === 0) return null;
              return (
                <div key="uncategorized" className="space-y-0.5">
                  {channels.map(renderChannelRow)}
                </div>
              );
            }

            const isCollapsed = !!collapsedCategories[cat];
            return (
              <div key={cat}>
                <div className="flex items-center justify-between gap-1 px-1.5 py-1">
                  <button
                    onClick={() =>
                      setCollapsedCategories((prev) => ({ ...prev, [cat]: !prev[cat] }))
                    }
                    className="flex-1 flex items-center gap-1 text-[11px] font-bold tracking-wide text-[var(--dc-text-muted)] hover:text-[var(--dc-text-primary)] uppercase cursor-pointer min-w-0 text-left"
                  >
                    <ChevronDown
                      className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${
                        isCollapsed ? '-rotate-90' : 'rotate-0'
                      }`}
                    />
                    <span className="truncate">{cat}</span>
                  </button>
                  {(canManageServer || canManageChannels) && (
                    <button
                      onClick={() => onOpenServerSettings(server.id, 'canales')}
                      title="Gestionar canales"
                      className="p-0.5 rounded hover:bg-white/10 text-[var(--dc-text-muted)] hover:text-white cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {!isCollapsed && (
                  <div className="mt-1 space-y-0.5">{channels.map(renderChannelRow)}</div>
                )}
              </div>
            );
          })}
        </div>

        {/* Server Quick-Actions Bottom Sheet (Exact Screenshot 134948) */}
        <AnimatePresence>
          {showServerSheet && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowServerSheet(false)}
              className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-end md:items-center justify-center p-0 md:p-4"
            >
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 40, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md bg-[#0b0c0f] border border-white/10 rounded-t-3xl md:rounded-3xl p-4 pb-6 space-y-3.5 max-h-[90vh] overflow-y-auto shadow-2xl"
              >
                <div className="w-10 h-1 rounded-full bg-white/20 mx-auto" />

                {/* Server Identity */}
                <div className="space-y-2 px-1">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden border border-white/15">
                    <ServerIconArt server={server} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all ${
                        (server.boostCount ?? 0) > 0 || (server.boostLevel ?? 0) > 0
                          ? 'bg-[linear-gradient(135deg,#9333ea_0%,#a855f7_44%,#ec4899_56%,#f472b6_100%)] text-white shadow-[0_0_12px_rgba(236,72,153,0.45)] ring-1 ring-white/25'
                          : 'bg-white text-black'
                      }`}
                    >
                      <Home className="w-3.5 h-3.5" />
                    </span>
                    <h3 className="font-display font-bold text-[19px] text-white truncate">
                      {server.name}
                    </h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 text-xs text-zinc-300 tabular-nums">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#16171d] border border-white/10 font-semibold">
                      <Home className="w-3 h-3 text-white" />
                      <span>Servidor de comunidad</span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#23a55a]" />
                      {server.onlineCount} en línea
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-zinc-500" />
                      {server.memberCountDisplay ?? server.memberCount} miembros
                    </span>
                  </div>
                </div>

                {/* 4 Action Buttons: Mejora / Invitación / Notificaciones / Ajustes */}
                <div className="grid grid-cols-4 gap-2 pt-1">
                  <button
                    onClick={() => {
                      setShowServerSheet(false);
                      onOpenServerBoost(server.id);
                    }}
                    className="flex flex-col items-center gap-1.5 cursor-pointer group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-[#16171d] group-hover:bg-[#22242d] border border-white/10 flex items-center justify-center">
                      <BoostGemIcon className="w-5 h-5" />
                    </div>
                    <span className="text-[11.5px] font-medium text-zinc-300">Mejora</span>
                  </button>

                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(server.id).catch(() => undefined);
                      setShowServerSheet(false);
                      onNotify(`ID de invitación copiado: ${server.id}`);
                    }}
                    className="flex flex-col items-center gap-1.5 cursor-pointer group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-[#16171d] group-hover:bg-[#22242d] border border-white/10 flex items-center justify-center">
                      <UserPlus className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-[11.5px] font-medium text-zinc-300">Invitación</span>
                  </button>

                  <button
                    onClick={() => {
                      const nextMuted = !server.muted;
                      onUpdateServer(server.id, { muted: nextMuted });
                      onNotify(
                        nextMuted
                          ? `Notificaciones silenciadas en ${server.name}`
                          : `Notificaciones activadas en ${server.name}`
                      );
                    }}
                    className="flex flex-col items-center gap-1.5 cursor-pointer group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-[#16171d] group-hover:bg-[#22242d] border border-white/10 flex items-center justify-center">
                      {server.muted ? (
                        <BellOff className="w-5 h-5 text-red-400" />
                      ) : (
                        <Bell className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <span className="text-[11.5px] font-medium text-zinc-300">Notificaciones</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowServerSheet(false);
                      onOpenServerSettings(server.id, 'menu');
                    }}
                    className="flex flex-col items-center gap-1.5 cursor-pointer group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-[#16171d] group-hover:bg-[#22242d] border border-white/10 flex items-center justify-center">
                      <Settings className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-[11.5px] font-medium text-zinc-300">
                      {hasServerAdminAccess ? 'Ajustes' : 'Información'}
                    </span>
                  </button>
                </div>

                {/* Card 1: Marcar como leído / Info o Explorar canales */}
                <div className="rounded-2xl bg-[#131419] border border-white/[0.08] divide-y divide-white/[0.06] overflow-hidden">
                  <button
                    onClick={() => {
                      onMarkServerRead(server.id);
                      setShowServerSheet(false);
                    }}
                    className="w-full px-4 py-3.5 text-left text-[15px] font-medium text-white hover:bg-white/[0.04] cursor-pointer"
                  >
                    Marcar como leído
                  </button>
                  <button
                    onClick={() => {
                      setShowServerSheet(false);
                      onOpenServerSettings(
                        server.id,
                        canManageServer || canManageChannels ? 'canales' : 'miembros'
                      );
                    }}
                    className="w-full px-4 py-3.5 text-left text-[15px] font-medium text-white hover:bg-white/[0.04] cursor-pointer"
                  >
                    {canManageServer || canManageChannels
                      ? 'Explorar y gestionar canales'
                      : 'Ver miembros del servidor'}
                  </button>
                </div>

                {(canManageServer || canManageChannels) && (
                  <>
                    {/* Card 2: Reanudar la configuración de tu servidor */}
                    <button
                      onClick={() => {
                        setShowServerSheet(false);
                        onOpenServerSettings(server.id, canManageServer ? 'vista-general' : 'canales');
                      }}
                      className="w-full rounded-2xl bg-[#131419] hover:bg-[#191a21] border border-white/[0.08] p-4 text-left space-y-2.5 cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="font-display font-bold text-[15px] text-white">
                            Reanudar la configuración de tu servidor
                          </p>
                          <p className="text-xs text-zinc-400 mt-0.5">
                            Personaliza banners, roles y diseños
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-zinc-400 shrink-0" />
                      </div>
                      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full w-3/4 rounded-full bg-[#5865F2]" />
                      </div>
                    </button>

                    {/* Card 3: Crear canal / Crear categoría / Crear evento */}
                    <div className="rounded-2xl bg-[#131419] border border-white/[0.08] divide-y divide-white/[0.06] overflow-hidden">
                      <button
                        onClick={() => {
                          setShowServerSheet(false);
                          onOpenServerSettings(server.id, 'canales');
                        }}
                        className="w-full px-4 py-3.5 text-left text-[15px] font-medium text-white hover:bg-white/[0.04] flex items-center justify-between cursor-pointer"
                      >
                        <span>Crear canal</span>
                        <Hash className="w-4 h-4 text-zinc-400" />
                      </button>
                      <button
                        onClick={() => {
                          setShowServerSheet(false);
                          onOpenServerSettings(server.id, 'canales');
                        }}
                        className="w-full px-4 py-3.5 text-left text-[15px] font-medium text-white hover:bg-white/[0.04] flex items-center justify-between cursor-pointer"
                      >
                        <span>Crear categoría</span>
                        <Plus className="w-4 h-4 text-zinc-400" />
                      </button>
                      <button
                        onClick={() => {
                          setShowServerSheet(false);
                          onNotify(`Evento programado en ${server.name}`);
                        }}
                        className="w-full px-4 py-3.5 text-left text-[15px] font-medium text-white hover:bg-white/[0.04] flex items-center justify-between cursor-pointer"
                      >
                        <span>Crear evento</span>
                        <CalendarPlus className="w-4 h-4 text-zinc-400" />
                      </button>
                    </div>
                  </>
                )}

                {/* Card 4: Editar perfil por servidor */}
                <div className="rounded-2xl bg-[#131419] border border-white/[0.08] divide-y divide-white/[0.06] overflow-hidden">
                  <button
                    onClick={() => {
                      setShowServerSheet(false);
                      onOpenProfile(server.id);
                    }}
                    className="w-full px-4 py-3.5 text-left text-[15px] font-medium text-white hover:bg-white/[0.04] cursor-pointer"
                  >
                    Editar perfil por servidor
                  </button>
                  {canManageServer && (
                    <label className="w-full px-4 py-3.5 flex items-center justify-between text-[15px] font-medium text-white cursor-pointer">
                      <span>Mostrar todos los canales</span>
                      <input
                        type="checkbox"
                        checked={server.showAllChannels ?? true}
                        onChange={(e) =>
                          onUpdateServer(server.id, { showAllChannels: e.target.checked })
                        }
                        className="w-5 h-5 accent-[#5865F2]"
                      />
                    </label>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        {renderQuickSearchModal()}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[var(--dc-bg-sidebar)] rounded-tl-2xl overflow-hidden min-w-0">
      <div className="px-4 pt-3.5 pb-2 shrink-0">
        <div className="flex items-center justify-between">
          <h1 className="font-display font-extrabold text-[22px] tracking-tight text-[var(--dc-text-primary)]">
            {activeContext.type === 'favorites' ? t('messages.favorites') : t('messages.title')}
          </h1>
          {unreadDmCount > 0 && activeContext.type === 'dm' && (
            <span className="px-2 py-0.5 rounded-full bg-[#5865F2]/20 text-[#9aa4ff] text-[11px] font-bold tabular-nums">
              {unreadDmCount} {t('messages.unreadCount')}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 mt-3">
          {searchOpen ? (
            <div className="flex-1 flex items-center gap-2 bg-[var(--dc-bg-input)] rounded-full px-3 h-10 border border-[var(--dc-border)]">
              <Search className="w-4 h-4 text-[var(--dc-text-muted)] shrink-0" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('messages.searchPlaceholder')}
                className="flex-1 bg-transparent text-sm text-[var(--dc-text-primary)] placeholder:text-[var(--dc-text-muted)] focus:outline-none min-w-0"
              />
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSearchOpen(false);
                }}
                className="text-[var(--dc-text-muted)] hover:text-[var(--dc-text-primary)] p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => setQuickSearchOpen(true)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setSearchOpen(true);
                }}
                aria-label="Buscador rápido"
                title="Buscador rápido"
                className="w-10 h-10 rounded-full dc-btn-icon flex items-center justify-center shrink-0 cursor-pointer"
              >
                <Search className="w-[18px] h-[18px]" />
              </button>

              <button
                onClick={onOpenFriends}
                className="flex-1 h-10 rounded-full dc-btn-secondary text-[14px] font-semibold flex items-center justify-center gap-2 px-4 cursor-pointer whitespace-nowrap"
              >
                <UserPlus className="w-[17px] h-[17px] text-[var(--dc-text-secondary)]" />
                <span>{t('messages.addFriends')}</span>
                {pendingFriendRequestsCount > 0 && (
                  <span className="min-w-[18px] h-[18px] px-1.5 rounded-full bg-[#da373c] text-white text-[10.5px] font-bold tabular-nums flex items-center justify-center">
                    {pendingFriendRequestsCount}
                  </span>
                )}
              </button>

              <button
                onClick={onOpenNewGroupDm}
                aria-label="Nuevo mensaje directo o grupo"
                title="Nuevo chat o grupo"
                className="w-10 h-10 rounded-xl dc-btn-primary flex items-center justify-center shrink-0 cursor-pointer"
              >
                <Plus className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {/* DM Filter Tabs */}
        {activeContext.type === 'dm' && (
          <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto no-scrollbar">
            {(
              [
                { id: 'all', label: t('messages.all'), count: dms.length },
                { id: 'unread', label: t('messages.unread'), count: unreadDmCount },
                { id: 'groups', label: t('messages.groups'), count: groupsDmCount },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setDmFilter(tab.id)}
                className={`px-3 py-1 rounded-full text-[11.5px] font-semibold whitespace-nowrap transition-colors cursor-pointer inline-flex items-center gap-1.5 shrink-0 ${
                  dmFilter === tab.id
                    ? 'bg-[#5865F2] text-white'
                    : 'bg-[var(--dc-bg-card)] text-[var(--dc-text-secondary)] hover:bg-white/[0.1] hover:text-white'
                }`}
              >
                <span>{tab.label}</span>
                {tab.id !== 'all' && tab.count > 0 && (
                  <span
                    className={`px-1.5 py-[1px] rounded-full text-[10px] font-bold tabular-nums leading-none ${
                      dmFilter === tab.id ? 'bg-white/20 text-white' : 'bg-white/10 text-zinc-300'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-24 md:pb-4">
        {/* Barra compacta de Nota rápida y Salas de voz */}
        {!searchQuery && activeContext.type === 'dm' && dmFilter === 'all' && (
          <div className="py-1.5 space-y-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setNoteDraft(currentUser.customStatus || '');
                  setNoteModalOpen(true);
                }}
                className="flex-1 min-w-0 flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--dc-bg-card)] hover:bg-[var(--dc-bg-elevated)] border border-[var(--dc-border)] text-left cursor-pointer transition-colors"
              >
                <span className="w-2 h-2 rounded-full bg-[#23a55a] shrink-0" />
                <span className="text-xs font-medium text-[var(--dc-text-secondary)] truncate">
                  {currentUser.customStatus || 'Pon tu estado o nota rápida'}
                </span>
              </button>

              {dropInRooms.length > 0 && onJoinDropInRoom && (
                <button
                  type="button"
                  onClick={() => setShowDropInRooms((v) => !v)}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap ${
                    showDropInRooms || (voiceSession.active && dropInRooms.some((r) => r.id === voiceSession.channelId))
                      ? 'bg-[#5865F2]/20 border-[#5865F2]/50 text-white'
                      : 'bg-[var(--dc-bg-card)] hover:bg-[var(--dc-bg-elevated)] border-[var(--dc-border)] text-[var(--dc-text-secondary)]'
                  }`}
                >
                  <Volume2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Salas ({dropInRooms.length})</span>
                </button>
              )}
            </div>

            {(() => {
              const friendNotes = dms.filter(
                (d) => !d.isGroup && !d.isBot && d.otherUid && liveProfilesByUid[d.otherUid]?.customStatus
              );
              if (friendNotes.length === 0) return null;
              return (
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                  {friendNotes.map((d) => {
                    const prof = liveProfilesByUid[d.otherUid!];
                    return (
                      <button
                        key={`note-${d.id}`}
                        type="button"
                        onClick={() => onSelectDm(d.id)}
                        className="shrink-0 flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-[var(--dc-bg-card)] hover:bg-[var(--dc-bg-elevated)] border border-[var(--dc-border)] text-left cursor-pointer max-w-[180px]"
                      >
                        <UserAvatar
                          avatar={d.avatar}
                          customAvatarUrl={d.customAvatarUrl}
                          status={d.status}
                          size="xs"
                          borderColor="var(--dc-bg-card)"
                        />
                        <span className="text-[11px] text-[#c4b5fd] truncate">
                          {d.name}: {prof?.customStatus}
                        </span>
                      </button>
                    );
                  })}
                </div>
              );
            })()}

            {/* Salas de voz rápidas (expandible) */}
            {(showDropInRooms || (voiceSession.active && dropInRooms.some((r) => r.id === voiceSession.channelId))) &&
              dropInRooms.length > 0 &&
              onJoinDropInRoom && (
                <div className="flex items-stretch gap-2 overflow-x-auto no-scrollbar pb-0.5">
                  {dropInRooms.map((room) => {
                    const isJoined = voiceSession.active && voiceSession.channelId === room.id;
                    const count =
                      room.participants.length +
                      (isJoined && !room.participants.some((p) => p.id === currentUser.id) ? 1 : 0);
                    return (
                      <button
                        key={room.id}
                        type="button"
                        onClick={() => onJoinDropInRoom(room)}
                        className={`shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border text-left transition-all cursor-pointer min-w-[165px] max-w-[205px] ${
                          isJoined
                            ? 'bg-[#23a55a]/18 border-[#23a55a]/60'
                            : 'bg-[var(--dc-bg-card)] hover:bg-[var(--dc-bg-elevated)] border-[var(--dc-border)]'
                        }`}
                      >
                        <span className="text-sm shrink-0">{room.emoji}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-[var(--dc-text-primary)] truncate">
                            {room.name}
                          </p>
                          <p className="text-[11px] text-[var(--dc-text-muted)] truncate">
                            {isJoined
                              ? 'Conectado'
                              : count > 0
                              ? `${count} en sala`
                              : 'Entrar'}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
          </div>
        )}

        {!searchQuery && activeContext.type === 'dm' && dmFilter === 'all' && activities.length > 0 && (
          <div className="flex items-stretch gap-2.5 overflow-x-auto no-scrollbar py-2 mb-1">
            {activities.map((act) => {
              if (act.gameTitle) {
                return (
                  <button
                    key={act.id}
                    onClick={() => onSelectActivity(act)}
                    className="shrink-0 flex items-center gap-2.5 p-2 pr-3.5 rounded-2xl bg-[var(--dc-bg-card)] hover:brightness-110 border border-[var(--dc-border)] transition-all cursor-pointer text-left max-w-[248px]"
                  >
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-gradient-to-br from-fuchsia-500 via-pink-500 to-amber-300 flex items-center justify-center border border-white/15">
                      {act.gameBannerVariant === 'aldea' ? (
                        <SafeImage
                          src={GENERATED_ASSETS.aldeaRoleplayIcon}
                          alt="Aldea Roleplay"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Gamepad2 className="w-6 h-6 text-white" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <UserAvatar
                            avatar={act.avatar}
                            status={act.status}
                            size="xs"
                            showStatus={true}
                            borderColor="var(--dc-bg-card)"
                          />
                          <span className="text-[13px] font-bold text-[var(--dc-text-primary)] truncate">
                            {act.displayName}
                          </span>
                        </div>
                        <Gamepad2 className="w-3.5 h-3.5 text-[#23a55a] shrink-0" />
                      </div>
                      <p className="text-[12px] text-[var(--dc-text-secondary)] truncate mt-0.5">
                        {act.gameTitle}
                      </p>
                    </div>
                  </button>
                );
              }

              return (
                <button
                  key={act.id}
                  onClick={() => onSelectActivity(act)}
                  className="shrink-0 w-[72px] p-2 rounded-2xl bg-[var(--dc-bg-card)] hover:brightness-110 border border-[var(--dc-border)] flex items-center justify-center transition-all cursor-pointer"
                  title={act.displayName}
                >
                  <UserAvatar
                    avatar={act.avatar}
                    status={act.status}
                    size="lg"
                    borderColor="var(--dc-bg-card)"
                  />
                </button>
              );
            })}
          </div>
        )}

        <div className="space-y-1 mt-1">
          {baseDms.map((dm) => {
            const isSelected = selectedDmId === dm.id;
            const hasGiftedNameplate = Boolean(dm.nameplate && dm.nameplate !== 'none');
            const isTyping = Boolean(typingDmIds[dm.id]);
            const unreadNum = dm.unreadCount ?? (dm.unread ? 1 : 0);

            return (
              <div key={dm.id} className="relative group">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    setOpenDmMenuId(null);
                    onSelectDm(dm.id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setOpenDmMenuId(null);
                      onSelectDm(dm.id);
                    }
                  }}
                  className={`w-full relative overflow-hidden flex items-center gap-3 px-2.5 py-2 pr-9 rounded-2xl text-left transition-all cursor-pointer ${
                    hasGiftedNameplate
                      ? 'bg-[#171620] border border-white/15 shadow-sm my-1'
                      : isSelected
                      ? 'bg-[var(--dc-bg-elevated)]'
                      : 'hover:bg-[var(--dc-bg-elevated)]/60'
                  } ${dm.muted ? 'opacity-65' : ''}`}
                >
                  {hasGiftedNameplate && (
                    <NameplateStripBackground nameplate={dm.nameplate || 'none'} />
                  )}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onInspectUser?.(dm.otherUid || dm.id, {
                        displayName: dm.name,
                        username: dm.username || dm.name.toLowerCase().replace(/\s+/g, ''),
                        avatar: dm.avatar,
                        customAvatarUrl: dm.customAvatarUrl,
                        status: dm.status,
                        decoration: dm.decoration,
                        nameplate: dm.nameplate,
                        serverTag: dm.serverTag,
                        displayNameStyle: dm.displayNameStyle,
                        displayNameColorPreset: dm.displayNameColorPreset,
                        displayNameCustomColors: dm.displayNameCustomColors,
                        displayNameGlow: dm.displayNameGlow,
                        nitroTier: dm.nitroTier,
                        isBot: dm.isBot,
                      });
                    }}
                    title={`Ver perfil de ${dm.name}`}
                    className="relative shrink-0 z-10 hover:scale-105 transition-transform cursor-pointer"
                  >
                    {dm.isGroup && dm.customIconUrl ? (
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-white/15 shrink-0">
                        <img src={dm.customIconUrl} alt={dm.name} className="w-full h-full object-cover" />
                      </div>
                    ) : dm.isGroup && dm.groupEmoji ? (
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-lg border border-white/15 shrink-0 shadow"
                        style={{
                          background: `linear-gradient(135deg, ${dm.groupColor || '#5865F2'} 0%, #11121a 100%)`,
                        }}
                      >
                        <span>{dm.groupEmoji}</span>
                      </div>
                    ) : dm.isGroup && dm.secondaryAvatar ? (
                      <div className="relative w-10 h-10">
                        <div className="w-7 h-7 rounded-full overflow-hidden border border-[var(--dc-bg-sidebar)] absolute top-0 left-0">
                          <UserAvatar avatar={dm.avatar} size="sm" showStatus={false} />
                        </div>
                        <div className="w-7 h-7 rounded-full overflow-hidden border-2 border-[var(--dc-bg-sidebar)] absolute bottom-0 right-0">
                          <UserAvatar avatar={dm.secondaryAvatar} size="sm" showStatus={false} />
                        </div>
                      </div>
                    ) : (
                      <UserAvatar
                        avatar={dm.avatar}
                        customAvatarUrl={dm.customAvatarUrl}
                        status={dm.status}
                        decoration={dm.decoration || 'none'}
                        size="md"
                        borderColor={
                          hasGiftedNameplate
                            ? '#171620'
                            : isSelected
                            ? 'var(--dc-bg-elevated)'
                            : 'var(--dc-bg-sidebar)'
                        }
                      />
                    )}
                  </button>

                  <div className="flex-1 min-w-0 z-10">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {dm.pinned && (
                          <Pin className="w-3 h-3 text-[#7b85ff] shrink-0" />
                        )}
                        {(() => {
                          const hasCustomColor = Boolean(
                            dm.displayNameColorPreset && dm.displayNameColorPreset !== 'none'
                          );
                          const dmNamePres =
                            !dm.isGroup &&
                            !dm.isBot &&
                            (hasCustomColor ||
                              (dm.displayNameStyle && dm.displayNameStyle !== 'default') ||
                              dm.displayNameGlow)
                              ? getDisplayNameTextPresentation({
                                  style: dm.displayNameStyle,
                                  colorPreset: dm.displayNameColorPreset,
                                  customColors: dm.displayNameCustomColors,
                                  glow: dm.displayNameGlow,
                                  nitroUnlocked: dm.nitroTier !== 'none' || hasCustomColor,
                                })
                              : null;
                          return (
                            <span
                              className={`text-[15px] truncate ${
                                dmNamePres
                                  ? dmNamePres.className
                                  : dm.unread
                                  ? 'font-bold text-[var(--dc-text-primary)]'
                                  : 'font-semibold text-[var(--dc-text-primary)]'
                              }`}
                              style={dmNamePres ? dmNamePres.style : undefined}
                            >
                              {dm.name}
                            </span>
                          );
                        })()}
                        {!dm.isGroup && !dm.isBot && isVerifiedAccount(dm.username) && (
                          <VerifiedBadge size="sm" />
                        )}
                        {!dm.isGroup &&
                          !dm.isBot &&
                          (() => {
                            const dmLive = liveProfilesByUid[dm.id];
                            const badgeId = dmLive?.badgeIds?.[0] as BadgeId | undefined;
                            return badgeId ? (
                              <span className="inline-flex items-center shrink-0">
                                <BadgeArtwork badgeId={badgeId} unlocked size="sm" />
                              </span>
                            ) : null;
                          })()}
                        {dm.favorite && (
                          <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
                        )}

                        {(dm.serverTag || (!dm.isGroup && !dm.isBot && isOwnerUsername(dm.username))) && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-black/15 dark:bg-white/10 text-[10.5px] font-semibold text-[var(--dc-text-secondary)] shrink-0">
                            {dm.serverTag || 'Staff'}
                          </span>
                        )}

                        {dm.isBot && (
                          <span className="px-1 py-[1px] rounded bg-[#5865F2] text-[9.5px] font-bold text-white uppercase tracking-wide shrink-0">
                            APP
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {dm.muted && <BellOff className="w-3.5 h-3.5 text-[var(--dc-text-muted)]" />}
                        <span className="text-[11.5px] tabular-nums text-[var(--dc-text-muted)]">
                          {dm.lastTimestamp}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        {isTyping ? (
                          <p className="text-[12.5px] font-semibold text-[#23a55a] truncate">
                            Escribiendo...
                          </p>
                        ) : (
                          <p
                            className={`text-[13px] truncate ${
                              dm.unread
                                ? 'font-semibold text-[var(--dc-text-primary)]'
                                : 'text-[var(--dc-text-muted)]'
                            }`}
                          >
                            {dm.lastMessagePreview}
                          </p>
                        )}
                        {dm.isCallEnded && (
                          <PhoneMissed className="w-3.5 h-3.5 text-[var(--dc-text-muted)] shrink-0" />
                        )}
                      </div>

                      {unreadNum > 0 && !isSelected && (
                        <span className="min-w-[18px] h-[18px] px-1.5 rounded-full bg-[#da373c] text-white text-[10.5px] font-bold tabular-nums flex items-center justify-center shrink-0">
                          {unreadNum}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Row Actions Button */}
                <button
                  type="button"
                  aria-label={`Opciones de ${dm.name}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenDmMenuId(openDmMenuId === dm.id ? null : dm.id);
                  }}
                  className="opacity-100 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 absolute right-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-black/55 hover:bg-black/80 text-zinc-200 flex items-center justify-center cursor-pointer transition-opacity"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>

                {openDmMenuId === dm.id && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-2 top-12 z-30 w-52 rounded-2xl bg-[#13141b] border border-white/15 shadow-2xl p-1.5 space-y-0.5 text-xs"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onToggleDmPin?.(dm.id);
                        setOpenDmMenuId(null);
                      }}
                      className="w-full px-2.5 py-2 rounded-xl hover:bg-white/10 text-left text-white flex items-center gap-2 cursor-pointer"
                    >
                      {dm.pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                      <span>{dm.pinned ? 'Desfijar arriba' : 'Fijar arriba'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onToggleDmUnread?.(dm.id);
                        setOpenDmMenuId(null);
                      }}
                      className="w-full px-2.5 py-2 rounded-xl hover:bg-white/10 text-left text-white flex items-center gap-2 cursor-pointer"
                    >
                      {dm.unread ? <CheckCheck className="w-3.5 h-3.5" /> : <Mail className="w-3.5 h-3.5" />}
                      <span>{dm.unread ? 'Marcar como leído' : 'Marcar como no leído'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onToggleDmFavorite?.(dm.id);
                        setOpenDmMenuId(null);
                      }}
                      className="w-full px-2.5 py-2 rounded-xl hover:bg-white/10 text-left text-white flex items-center gap-2 cursor-pointer"
                    >
                      <Star className={`w-3.5 h-3.5 ${dm.favorite ? 'text-amber-400 fill-amber-400' : ''}`} />
                      <span>{dm.favorite ? 'Quitar de Favoritos' : 'Añadir a Favoritos'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onToggleDmMute?.(dm.id);
                        setOpenDmMenuId(null);
                      }}
                      className="w-full px-2.5 py-2 rounded-xl hover:bg-white/10 text-left text-white flex items-center gap-2 cursor-pointer"
                    >
                      {dm.muted ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
                      <span>{dm.muted ? 'Activar notificaciones' : 'Silenciar'}</span>
                    </button>
                    {!dm.isBot && (
                      <button
                        type="button"
                        onClick={() => {
                          onCloseDm?.(dm.id);
                          setOpenDmMenuId(null);
                        }}
                        className="w-full px-2.5 py-2 rounded-xl hover:bg-red-500/15 text-left text-red-400 flex items-center gap-2 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Cerrar conversación</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {baseDms.length === 0 && (
            <div className="text-center py-12 px-4 flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-[var(--dc-bg-card)] flex items-center justify-center mb-3">
                <Users className="w-7 h-7 text-[var(--dc-text-muted)] opacity-75" />
              </div>
              <p className="text-sm font-medium text-[var(--dc-text-muted)]">
                {searchQuery
                  ? `No se encontraron conversaciones con "${searchQuery}".`
                  : dmFilter === 'unread'
                  ? '¡Todo al día! No tienes mensajes sin leer.'
                  : dmFilter === 'groups'
                  ? 'No hay grupos en esta vista.'
                  : activeContext.type === 'favorites'
                  ? 'Aún no tienes chats marcados en Favoritos.'
                  : 'No hay conversaciones en esta vista.'}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                {(searchQuery || dmFilter !== 'all') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setDmFilter('all');
                    }}
                    className="px-4 py-2.5 rounded-full dc-btn-secondary text-xs font-bold cursor-pointer"
                  >
                    Ver todos
                  </button>
                )}
                <button
                  type="button"
                  onClick={onOpenFriends}
                  className="px-5 py-2.5 rounded-full bg-[#5865F2] hover:bg-[#4752c4] active:scale-[0.98] text-white text-xs font-bold inline-flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-[#5865F2]/25"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{t('friends.searchFriendsCta')}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Ephemeral Quick Note / Status Modal */}
      {noteModalOpen && (
        <div
          onClick={() => setNoteModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-end md:items-center justify-center p-0 md:p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-t-3xl md:rounded-3xl bg-[#1c1d22] border border-[#2e3035] p-5 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-lg text-white">
                  Nota rápida y estado
                </h3>
                <p className="text-xs text-[#949ba4]">
                  Visible temporalmente sobre los mensajes (+25 Orbs al publicar).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setNoteModalOpen(false)}
                className="w-8 h-8 rounded-full dc-btn-icon flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {EPHEMERAL_STATUS_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setNoteDraft(preset.text)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${
                    noteDraft === preset.text
                      ? 'bg-[#8b5cf6]/25 border-[#a855f7] text-white'
                      : 'bg-[#26272f] border-[#2e3035] text-[#b5bac1] hover:text-white'
                  }`}
                >
                  {preset.emoji} {preset.label}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#949ba4]">
                Tu nota personalizada (máx. 80 caracteres)
              </label>
              <input
                type="text"
                maxLength={80}
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                placeholder="Ej. Jugando ranked o escuchando música..."
                className="w-full bg-[#111214] border border-[#2e3035] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-[#949ba4] focus:outline-none focus:border-[#8b5cf6]"
              />
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-[#949ba4]">Duración efímera:</span>
              <div className="flex items-center gap-1.5">
                {[1, 4, 24].map((hrs) => (
                  <button
                    key={hrs}
                    type="button"
                    onClick={() => setNoteHours(hrs)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                      noteHours === hrs
                        ? 'bg-[#5865F2] text-white'
                        : 'bg-[#26272f] text-[#b5bac1] hover:text-white'
                    }`}
                  >
                    {hrs}h
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              {currentUser.customStatus && (
                <button
                  type="button"
                  onClick={() => {
                    onUpdateEphemeralStatus?.('', 0);
                    setNoteDraft('');
                    setNoteModalOpen(false);
                  }}
                  className="px-4 h-10 rounded-full dc-btn-secondary text-xs font-bold cursor-pointer"
                >
                  Quitar nota
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  onUpdateEphemeralStatus?.(noteDraft.trim(), noteHours);
                  setNoteModalOpen(false);
                }}
                className="flex-1 h-10 rounded-full dc-btn-primary text-xs font-bold cursor-pointer"
              >
                Publicar nota rápida
              </button>
            </div>
          </div>
        </div>
      )}

      {renderQuickSearchModal()}
    </div>
  );
};
