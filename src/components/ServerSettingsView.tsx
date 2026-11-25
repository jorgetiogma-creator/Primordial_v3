import React, { useRef, useState } from 'react';
import {
  AlignLeft,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Bot,
  Check,
  ChevronRight,
  ClipboardList,
  Copy,
  Crown,
  FileText,
  Gavel,
  Hash,
  Home,
  ImagePlus,
  Info,
  Link2,
  ListChecks,
  Lock,
  LogOut,
  Megaphone,
  MoreVertical,
  Palette,
  Plus,
  Puzzle,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Smile,
  Sparkles,
  Sticker,
  Swords,
  Tag,
  Trash2,
  TrendingUp,
  Upload,
  Users,
  Volume2,
  X,
} from 'lucide-react';
import {
  Channel,
  Server,
  ServerChatStyle,
  ServerChatTheme,
  ServerEmoji,
  ServerRole,
  ServerSettingsSection,
  UserProfile,
} from '../types/discord';
import { ServerIconArt, UserAvatar } from './DiscordArt';
import { BoostGemIcon } from './ServerBoostView';
import { getServerPermissions } from '../utils/ownerAccess';

interface ServerSettingsViewProps {
  server: Server;
  user: UserProfile;
  initialSection?: ServerSettingsSection;
  onBack: () => void;
  onUpdateServer: (serverId: string, patch: Partial<Server>) => void;
  onToggleMemberAdmin?: (serverId: string, targetUid: string, makeAdmin: boolean) => void;
  onUpdateMemberRoles?: (serverId: string, targetUid: string, roleIds: string[], isAdmin: boolean) => void;
  onKickMember?: (serverId: string, targetUid: string, memberName: string) => void;
  onAddChannel: (
    serverId: string,
    data: { name: string; type: Channel['type']; category: string; isPrivate?: boolean }
  ) => void;
  onUpdateChannel: (serverId: string, channelId: string, patch: Partial<Channel>) => void;
  onDeleteChannel: (serverId: string, channelId: string) => void;
  onMoveChannel: (serverId: string, channelId: string, direction: -1 | 1) => void;
  onAddCategory: (serverId: string, categoryName: string) => void;
  onRenameCategory: (serverId: string, oldName: string, newName: string) => void;
  onDeleteCategory: (serverId: string, categoryName: string) => void;
  onMoveCategory: (serverId: string, categoryName: string, direction: -1 | 1) => void;
  onOpenServerBoost: (serverId: string) => void;
  onLeaveServer: (serverId: string) => void;
  onInspectUser?: (userId: string) => void;
  onNotify: (msg: string) => void;
}

const ADMIN_ONLY_SECTIONS = new Set<ServerSettingsSection>([
  'vista-general',
  'canales',
  'integraciones',
  'etiqueta',
  'plantilla',
  'emojis',
  'stickers',
  'roles',
  'moderacion',
  'automod',
  'auditoria',
  'baneos',
  'seguridad',
  'comunidad',
]);

const BANNER_PRESETS = [
  { id: 'eclipse', name: 'Eclipse Celestial', url: '/src/assets/images/shop_celestial_moon_art_1795352098726.jpg' },
  { id: 'dune', name: 'Arrakis Gold', url: '/src/assets/images/banner_dune_1795280073636.jpg' },
  { id: 'dp', name: 'Marvel Duo', url: '/src/assets/images/banner_deadpool_duo_1795280758288.jpg' },
  { id: 'miyabi', name: 'Hoshimi Miyabi', url: '/src/assets/images/shop_miyabi_art_1795281106262.jpg' },
  { id: 'dbd', name: 'Niebla Carmesí', url: '/src/assets/images/banner_dbd_1795280075129.jpg' },
  { id: 'almas', name: 'Ecos Abismo', url: '/src/assets/images/shop_trapped_souls_1795281108312.jpg' },
];

const CHAT_THEMES: { id: ServerChatTheme; label: string; preview: string }[] = [
  { id: 'black', label: 'Negro OLED', preview: '#000000' },
  { id: 'onyx', label: 'Onyx Oscuro', preview: '#0a0b0e' },
  { id: 'crimson', label: 'Carmesí', preview: 'linear-gradient(135deg,#180507,#090304)' },
  { id: 'emerald', label: 'Esmeralda', preview: 'linear-gradient(135deg,#04160e,#030907)' },
  { id: 'midnight', label: 'Medianoche', preview: 'linear-gradient(135deg,#050d1d,#04060b)' },
  { id: 'cyber', label: 'Ciber Neón', preview: 'linear-gradient(135deg,#06151a,#130a18)' },
  { id: 'custom-photo', label: 'Foto de fondo', preview: '#121318' },
];

const ROLE_COLORS = [
  '#f59e0b',
  '#ef4444',
  '#ec4899',
  '#38bdf8',
  '#23a55a',
  '#a855f7',
  '#5865f2',
  '#f97316',
  '#e4e4e7',
];

const EMOJI_PREFIX_CHIPS = ['📢│', '📜│', '💬│', '🚀│', '💎│', '🎮│', '💡│', '🎫│', '🛡️│', '🎉-'];

const readFileAsDataUrl = (file: File, cb: (url: string) => void) => {
  const reader = new FileReader();
  reader.onload = () => {
    if (typeof reader.result === 'string') cb(reader.result);
  };
  reader.readAsDataURL(file);
};

export const ServerSettingsView: React.FC<ServerSettingsViewProps> = ({
  server,
  user,
  initialSection = 'menu',
  onBack,
  onUpdateServer,
  onToggleMemberAdmin,
  onUpdateMemberRoles,
  onKickMember,
  onAddChannel,
  onUpdateChannel,
  onDeleteChannel,
  onMoveChannel,
  onAddCategory,
  onRenameCategory,
  onDeleteCategory,
  onMoveCategory,
  onOpenServerBoost,
  onLeaveServer,
  onInspectUser,
  onNotify,
}) => {
  const [section, setSection] = useState<ServerSettingsSection>(initialSection);
  const [confirmLeave, setConfirmLeave] = useState(false);

  // Vista general draft
  const [srvName, setSrvName] = useState(server.name);
  const [srvDesc, setSrvDesc] = useState(server.description || '');
  const iconInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const wallpaperInputRef = useRef<HTMLInputElement>(null);

  // Canales state
  const [reorderMode, setReorderMode] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState<'none' | 'channel' | 'category'>('none');
  const [newChName, setNewChName] = useState('');
  const [newChType, setNewChType] = useState<Channel['type']>('text');
  const [newChCategory, setNewChCategory] = useState<string>(
    (server.categoriesOrder || []).find((c) => c !== '') || '---- 👥 COMMUNITY ----'
  );
  const [newChPrivate, setNewChPrivate] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingCatValue, setEditingCatValue] = useState('');
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [editChName, setEditChName] = useState('');
  const [editChType, setEditChType] = useState<Channel['type']>('text');
  const [editChCategory, setEditChCategory] = useState('');
  const [editChPrivate, setEditChPrivate] = useState(false);

  // Emojis state
  const emojiInputRef = useRef<HTMLInputElement>(null);
  const [showEmojiModal, setShowEmojiModal] = useState(false);
  const [newEmojiName, setNewEmojiName] = useState('');
  const [newEmojiSymbol, setNewEmojiSymbol] = useState('⚡');
  const [newEmojiImageUrl, setNewEmojiImageUrl] = useState<string | undefined>(undefined);
  const [openEmojiMenuId, setOpenEmojiMenuId] = useState<string | null>(null);

  // Roles state
  const [editingRole, setEditingRole] = useState<ServerRole | null>(null);
  const [showNewRole, setShowNewRole] = useState(false);
  const [roleNameInput, setRoleNameInput] = useState('');
  const [roleColorInput, setRoleColorInput] = useState('#5865f2');
  const [roleGradEnd, setRoleGradEnd] = useState('#ec4899');
  const [roleUseGradient, setRoleUseGradient] = useState(false);
  const [roleHoistInput, setRoleHoistInput] = useState(true);
  const [rolePermsInput, setRolePermsInput] = useState<string[]>(['Enviar mensajes']);

  // Members search, inline role assignment & kick confirm
  const [memberSearch, setMemberSearch] = useState('');
  const [roleTargetMemberId, setRoleTargetMemberId] = useState<string | null>(null);
  const [kickCandidate, setKickCandidate] = useState<{ id: string; name: string } | null>(null);

  const {
    isOwner: isOwnerSrv,
    canManageServer: canManage,
    canManageChannels,
    canKickMembers,
    canManageRoles,
    canPinMessages,
  } = getServerPermissions(server, user.id);

  // Misc interactive state
  const [tagInput, setTagInput] = useState(server.activeServerTag || server.shortCode || 'SRV');
  const [stickerName, setStickerName] = useState('');
  const [stickerEmoji, setStickerEmoji] = useState('🔥');
  const [automodSpam, setAutomodSpam] = useState(true);
  const [automodLinks, setAutomodLinks] = useState(false);
  const [automodWords, setAutomodWords] = useState(true);
  const [modLevel, setModLevel] = useState<'bajo' | 'medio' | 'alto'>('medio');
  const [invites, setInvites] = useState([
    { code: server.id, uses: server.memberCount, expires: 'Permanente', creator: user.username },
  ]);

  const roles = server.roles || [];
  const customEmojis = server.customEmojis || [];
  const stickers = server.stickers || [];
  const memberRoles = server.memberRoleIds || {};
  const boosts = server.boostCount ?? 0;
  const hasBannerUnlocked = boosts >= 1;

  // Ordered categories ensuring any channel category not in categoriesOrder is still shown
  const orderedCategories = Array.from(
    new Set([...(server.categoriesOrder || ['']), ...server.channels.map((c) => c.category)])
  );
  const namedCategories = orderedCategories.filter((c) => c !== '');

  const membersList = (
    server.members && server.members.length > 0
      ? server.members
      : [
          {
            uid: user.id,
            displayName: user.displayName,
            username: user.username,
            avatar: user.avatar,
            customAvatarUrl: user.customAvatarUrl,
            status: user.status,
            roleIds: memberRoles[user.id] || [],
            isAdmin: canManage,
          },
        ]
  ).map((m) => ({
    id: m.uid,
    name: m.displayName,
    username: m.username,
    avatar: m.avatar,
    customAvatarUrl: m.customAvatarUrl,
    status: m.status,
    isAdmin: Boolean(
      m.isAdmin || m.uid === server.ownerId || (server.adminIds || []).includes(m.uid)
    ),
  }));

  const canEditRoles = canManage || canManageRoles;
  const canEditChannels = canManage || canManageChannels;

  const handleToggleMemberRole = (memberId: string, roleId: string) => {
    if (!canEditRoles) {
      onNotify('Necesitas permiso para gestionar roles.');
      return;
    }
    const current = memberRoles[memberId] || [];
    const next = current.includes(roleId)
      ? current.filter((r) => r !== roleId)
      : [...current, roleId];
    const targetMember = membersList.find((m) => m.id === memberId);
    onUpdateServer(server.id, {
      memberRoleIds: { ...memberRoles, [memberId]: next },
    });
    onUpdateMemberRoles?.(server.id, memberId, next, Boolean(targetMember?.isAdmin));
  };

  /* ---------------- SUB-VIEW HEADER ---------------- */
  const renderSubHeader = (title: string, rightNode?: React.ReactNode) => (
    <header className="h-14 px-4 flex items-center justify-between bg-[#111214] border-b border-white/10 shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => setSection('menu')}
          aria-label="Volver a Ajustes del servidor"
          className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center cursor-pointer shrink-0"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="font-display font-bold text-[18px] text-white truncate">{title}</h1>
      </div>
      {rightNode}
    </header>
  );

  const canAccessSection =
    !ADMIN_ONLY_SECTIONS.has(section) ||
    canManage ||
    (section === 'canales' && canEditChannels) ||
    (section === 'roles' && canEditRoles);

  if (!canAccessSection) {
    return (
      <div className="flex-1 flex flex-col h-full bg-[#111214] text-white overflow-hidden">
        {renderSubHeader('Sin permiso de administrador')}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-sm w-full rounded-3xl bg-[#111216] border border-white/10 p-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6 text-amber-400" />
            </div>
            <h2 className="font-display font-bold text-base text-white">
              Solo administradores pueden editar este servidor
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Pídele al dueño de <strong>{server.name}</strong> que te otorgue permiso de administrador en la sección Miembros.
            </p>
            <button
              type="button"
              onClick={() => setSection('menu')}
              className="w-full h-10 rounded-full dc-btn-primary text-xs font-bold cursor-pointer"
            >
              Volver al menú del servidor
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------- 1. CANALES (Screenshot 135004) ---------------- */
  if (section === 'canales') {
    const uncategorized = server.channels.filter((c) => c.category === '');

    return (
      <div className="flex-1 flex flex-col h-full bg-[#111214] text-white relative overflow-hidden">
        {renderSubHeader(
          'Canales',
          <button
            onClick={() => setReorderMode((r) => !r)}
            className={`px-3 py-1.5 rounded-full text-[13.5px] font-bold cursor-pointer transition-colors ${
              reorderMode
                ? 'bg-[#5865F2] text-white'
                : 'text-zinc-200 hover:bg-white/10'
            }`}
          >
            {reorderMode ? 'Listo' : 'Reordenar'}
          </button>
        )}

        <div className="flex-1 overflow-y-auto px-4 pt-3 pb-28 space-y-5">
          {/* Uncategorized channels */}
          {uncategorized.length > 0 && (
            <div className="space-y-1">
              {uncategorized.map((ch) => (
                <div
                  key={ch.id}
                  onClick={() => {
                    if (reorderMode) return;
                    setEditingChannel(ch);
                    setEditChName(ch.name);
                    setEditChType(ch.type);
                    setEditChCategory(ch.category);
                    setEditChPrivate(!!ch.isPrivate);
                  }}
                  className="flex items-center justify-between gap-2 px-2 py-2.5 rounded-xl hover:bg-white/[0.06] cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative text-zinc-400 shrink-0">
                      <Hash className="w-5 h-5" />
                      {ch.isPrivate && (
                        <Lock className="w-2.5 h-2.5 text-zinc-200 bg-black rounded-full absolute -top-0.5 -right-1" />
                      )}
                    </div>
                    <span className="text-[15px] font-medium text-zinc-100 truncate">{ch.name}</span>
                  </div>

                  {reorderMode && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onMoveChannel(server.id, ch.id, -1);
                        }}
                        className="w-8 h-8 rounded-lg bg-[#14151a] border border-white/10 flex items-center justify-center cursor-pointer"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onMoveChannel(server.id, ch.id, 1);
                        }}
                        className="w-8 h-8 rounded-lg bg-[#14151a] border border-white/10 flex items-center justify-center cursor-pointer"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Categorized channels */}
          {namedCategories.map((cat) => {
            const catChannels = server.channels.filter((c) => c.category === cat);
            return (
              <div key={cat} className="space-y-1">
                <div className="flex items-center justify-between gap-2 px-2 py-1">
                  <span className="text-[12.5px] font-bold tracking-wide text-zinc-400 uppercase truncate">
                    {cat}
                  </span>

                  <div className="flex items-center gap-2 shrink-0">
                    {reorderMode ? (
                      <>
                        <button
                          onClick={() => onMoveCategory(server.id, cat, -1)}
                          title="Subir categoría"
                          className="w-7 h-7 rounded-lg bg-[#14151a] border border-white/10 flex items-center justify-center cursor-pointer"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onMoveCategory(server.id, cat, 1)}
                          title="Bajar categoría"
                          className="w-7 h-7 rounded-lg bg-[#14151a] border border-white/10 flex items-center justify-center cursor-pointer"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingCategory(cat);
                          setEditingCatValue(cat);
                        }}
                        className="text-[12.5px] font-semibold text-zinc-400 hover:text-white cursor-pointer"
                      >
                        Editar
                      </button>
                    )}
                  </div>
                </div>

                {catChannels.map((ch) => (
                  <div
                    key={ch.id}
                    onClick={() => {
                      if (reorderMode) return;
                      setEditingChannel(ch);
                      setEditChName(ch.name);
                      setEditChType(ch.type);
                      setEditChCategory(ch.category);
                      setEditChPrivate(!!ch.isPrivate);
                    }}
                    className="flex items-center justify-between gap-2 px-2 py-2.5 rounded-xl hover:bg-white/[0.06] cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative text-zinc-400 shrink-0">
                        {ch.type === 'announcement' ? (
                          <Megaphone className="w-5 h-5" />
                        ) : ch.type === 'voice' ? (
                          <Volume2 className="w-5 h-5" />
                        ) : (
                          <Hash className="w-5 h-5" />
                        )}
                        {ch.isPrivate && (
                          <Lock className="w-2.5 h-2.5 text-zinc-200 bg-black rounded-full absolute -top-0.5 -right-1" />
                        )}
                      </div>
                      <span className="text-[15px] font-medium text-zinc-100 truncate">
                        {ch.name}
                      </span>
                    </div>

                    {reorderMode && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onMoveChannel(server.id, ch.id, -1);
                          }}
                          className="w-8 h-8 rounded-lg bg-[#14151a] border border-white/10 flex items-center justify-center cursor-pointer"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onMoveChannel(server.id, ch.id, 1);
                          }}
                          className="w-8 h-8 rounded-lg bg-[#14151a] border border-white/10 flex items-center justify-center cursor-pointer"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                {catChannels.length === 0 && (
                  <p className="text-xs text-zinc-500 px-2 py-1 italic">
                    Categoría vacía (toca + Crear para añadir un canal)
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Floating Blurple + Crear Pill Button (Exact Screenshot 135004) */}
        <div className="absolute bottom-6 inset-x-0 flex justify-center pointer-events-none z-20">
          <button
            onClick={() => setShowCreateModal('channel')}
            className="pointer-events-auto inline-flex items-center gap-2 px-6 h-12 rounded-2xl dc-btn-primary font-bold text-[15px] shadow-2xl cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            <span>Crear</span>
          </button>
        </div>

        {/* Create Channel or Category Modal */}
        {showCreateModal !== 'none' && (
          <div
            onClick={() => setShowCreateModal('none')}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-end md:items-center justify-center p-0 md:p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-[#0c0d10] border border-white/15 rounded-t-3xl md:rounded-3xl p-5 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowCreateModal('channel')}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold cursor-pointer ${
                      showCreateModal === 'channel'
                        ? 'dc-btn-primary'
                        : 'bg-[#181920] text-zinc-400'
                    }`}
                  >
                    Crear canal
                  </button>
                  <button
                    onClick={() => setShowCreateModal('category')}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold cursor-pointer ${
                      showCreateModal === 'category'
                        ? 'dc-btn-primary'
                        : 'bg-[#181920] text-zinc-400'
                    }`}
                  >
                    Crear categoría
                  </button>
                </div>
                <button
                  onClick={() => setShowCreateModal('none')}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {showCreateModal === 'channel' ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold uppercase text-zinc-400">
                      Nombre del canal
                    </label>
                    <input
                      type="text"
                      value={newChName}
                      onChange={(e) => setNewChName(e.target.value)}
                      placeholder="Ej: 💬│chat-vip"
                      className="w-full mt-1 bg-[#14151a] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#5865F2]"
                    />
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {EMOJI_PREFIX_CHIPS.map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setNewChName((prev) => `${p}${prev.replace(/^.+│/, '')}`)}
                          className="px-2 py-1 rounded-lg bg-[#16171d] hover:bg-[#22242c] text-xs cursor-pointer"
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase text-zinc-400">
                      Tipo de canal
                    </label>
                    <div className="grid grid-cols-3 gap-2 mt-1">
                      {(
                        [
                          { id: 'text', label: 'Texto', icon: Hash },
                          { id: 'announcement', label: 'Anuncio', icon: Megaphone },
                          { id: 'voice', label: 'Voz', icon: Volume2 },
                        ] as const
                      ).map((t) => {
                        const Icon = t.icon;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setNewChType(t.id)}
                            className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer ${
                              newChType === t.id
                                ? 'bg-[#5865F2]/20 border-[#5865F2] text-white'
                                : 'bg-[#14151a] border-white/10 text-zinc-400'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            <span>{t.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase text-zinc-400">
                      Categoría
                    </label>
                    <select
                      value={newChCategory}
                      onChange={(e) => setNewChCategory(e.target.value)}
                      className="w-full mt-1 bg-[#14151a] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"
                    >
                      <option value="">Sin categoría (arriba)</option>
                      {namedCategories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <label className="flex items-center justify-between p-3 rounded-xl bg-[#14151a] border border-white/10 cursor-pointer">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <Lock className="w-4 h-4 text-zinc-400" /> Canal privado
                    </span>
                    <input
                      type="checkbox"
                      checked={newChPrivate}
                      onChange={(e) => setNewChPrivate(e.target.checked)}
                      className="w-4 h-4 accent-[#5865F2]"
                    />
                  </label>

                  <button
                    onClick={() => {
                      if (!newChName.trim()) return;
                      onAddChannel(server.id, {
                        name: newChName.trim(),
                        type: newChType,
                        category: newChCategory,
                        isPrivate: newChPrivate,
                      });
                      setNewChName('');
                      setNewChPrivate(false);
                      setShowCreateModal('none');
                    }}
                    className="w-full h-11 rounded-full dc-btn-primary font-bold text-sm cursor-pointer"
                  >
                    Crear canal
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold uppercase text-zinc-400">
                      Nombre de la categoría
                    </label>
                    <input
                      type="text"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      placeholder="Ej: ---- 🎮 GAMING ----"
                      className="w-full mt-1 bg-[#14151a] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#5865F2]"
                    />
                  </div>
                  <button
                    onClick={() => {
                      if (!newCatName.trim()) return;
                      onAddCategory(server.id, newCatName.trim());
                      setNewCatName('');
                      setShowCreateModal('none');
                    }}
                    className="w-full h-11 rounded-full dc-btn-primary font-bold text-sm cursor-pointer"
                  >
                    Crear categoría
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Edit Category Modal */}
        {editingCategory && (
          <div
            onClick={() => setEditingCategory(null)}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-end md:items-center justify-center p-0 md:p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-[#0c0d10] border border-white/15 rounded-t-3xl md:rounded-3xl p-5 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-lg">Editar categoría</h3>
                <button
                  onClick={() => setEditingCategory(null)}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <input
                type="text"
                value={editingCatValue}
                onChange={(e) => setEditingCatValue(e.target.value)}
                className="w-full bg-[#14151a] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (editingCatValue.trim()) {
                      onRenameCategory(server.id, editingCategory, editingCatValue.trim());
                    }
                    setEditingCategory(null);
                  }}
                  className="flex-1 h-10 rounded-full dc-btn-primary text-sm font-bold cursor-pointer"
                >
                  Guardar
                </button>
                <button
                  onClick={() => {
                    onDeleteCategory(server.id, editingCategory);
                    setEditingCategory(null);
                  }}
                  className="px-4 h-10 rounded-full dc-btn-danger text-sm font-bold cursor-pointer inline-flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Eliminar</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Channel Modal */}
        {editingChannel && (
          <div
            onClick={() => setEditingChannel(null)}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-end md:items-center justify-center p-0 md:p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-[#0c0d10] border border-white/15 rounded-t-3xl md:rounded-3xl p-5 space-y-3.5"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-lg">Editar canal</h3>
                <button
                  onClick={() => setEditingChannel(null)}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-zinc-400">Nombre</label>
                <input
                  type="text"
                  value={editChName}
                  onChange={(e) => setEditChName(e.target.value)}
                  className="w-full mt-1 bg-[#14151a] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-zinc-400">Categoría</label>
                <select
                  value={editChCategory}
                  onChange={(e) => setEditChCategory(e.target.value)}
                  className="w-full mt-1 bg-[#14151a] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white"
                >
                  <option value="">Sin categoría</option>
                  {namedCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex items-center justify-between p-3 rounded-xl bg-[#14151a] border border-white/10 cursor-pointer">
                <span className="text-sm font-medium flex items-center gap-2">
                  <Lock className="w-4 h-4 text-zinc-400" /> Canal privado
                </span>
                <input
                  type="checkbox"
                  checked={editChPrivate}
                  onChange={(e) => setEditChPrivate(e.target.checked)}
                  className="w-4 h-4 accent-[#5865F2]"
                />
              </label>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => {
                    if (editChName.trim()) {
                      onUpdateChannel(server.id, editingChannel.id, {
                        name: editChName.trim(),
                        type: editChType,
                        category: editChCategory,
                        isPrivate: editChPrivate,
                      });
                    }
                    setEditingChannel(null);
                  }}
                  className="flex-1 h-10 rounded-full dc-btn-primary text-sm font-bold cursor-pointer"
                >
                  Guardar cambios
                </button>
                <button
                  onClick={() => {
                    onDeleteChannel(server.id, editingChannel.id);
                    setEditingChannel(null);
                  }}
                  className="px-4 h-10 rounded-full dc-btn-danger text-sm font-bold cursor-pointer inline-flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Borrar</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ---------------- 2. EMOJIS (Screenshot 135011) ---------------- */
  if (section === 'emojis') {
    const remainingSlots = Math.max(0, 50 - customEmojis.length);

    return (
      <div className="flex-1 flex flex-col h-full bg-[#111214] text-white overflow-hidden">
        {renderSubHeader('Emojis')}

        <div className="flex-1 overflow-y-auto px-4 pt-4 pb-16 space-y-5">
          <div className="max-w-lg mx-auto space-y-5">
            <button
              onClick={() => setShowEmojiModal(true)}
              className="w-full h-11 rounded-full dc-btn-primary font-bold text-[15px] cursor-pointer"
            >
              Subir emoji
            </button>

            <p className="text-[13.5px] text-zinc-300 leading-relaxed">
              Añade hasta 50 emojis personalizados que todos podrán usar en este servidor. Los
              miembros con Discord Nitro pueden usar emojis de GIF animados.
            </p>

            <div>
              <h3 className="text-[12px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
                REQUISITOS DE SUBIDA
              </h3>
              <ul className="text-[13px] text-zinc-400 space-y-1">
                <li>• Tipo de archivo: JPEG, PNG, GIF, WEBP</li>
                <li>• Tamaño de archivo recomendado: 256 KB (lo comprimiremos por ti)</li>
                <li>• Dimensiones recomendadas: 128x128</li>
                <li>
                  • Nombres: los nombres de los emojis deben tener al menos 2 caracteres y solo
                  pueden contener caracteres alfanuméricos y guiones bajos.
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-[12.5px] font-extrabold uppercase tracking-wider text-zinc-200 mb-2.5 tabular-nums">
                EMOJIS - {remainingSlots} ESPACIOS DISPONIBLES
              </h3>

              <div className="rounded-2xl bg-[#111216] border border-white/10 divide-y divide-white/[0.06] overflow-visible">
                {customEmojis.map((em) => (
                  <div
                    key={em.id}
                    className="px-3.5 py-3 flex items-center justify-between gap-3 relative"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-[#070709] border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                        {em.imageUrl ? (
                          <img
                            src={em.imageUrl}
                            alt={em.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xl">{em.symbol || '😎'}</span>
                        )}
                      </div>
                      <span className="text-[14.5px] font-semibold text-white truncate">
                        :{em.name}:
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[13px] text-zinc-400">{em.uploadedBy}</span>
                      <div className="w-6 h-6 rounded-full bg-[#5865F2] flex items-center justify-center text-[11px] font-bold">
                        👾
                      </div>
                      <button
                        onClick={() =>
                          setOpenEmojiMenuId(openEmojiMenuId === em.id ? null : em.id)
                        }
                        className="p-1 rounded-lg hover:bg-white/10 text-zinc-300 cursor-pointer"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>

                    {openEmojiMenuId === em.id && (
                      <div className="absolute right-3 top-12 z-30 bg-[#181920] border border-white/15 rounded-xl shadow-2xl p-1.5 w-40 space-y-1">
                        <button
                          onClick={() => {
                            onNotify(`Copiado :${em.name}:`);
                            setOpenEmojiMenuId(null);
                          }}
                          className="w-full px-3 py-1.5 rounded-lg hover:bg-white/10 text-xs font-semibold text-left flex items-center gap-2 cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar :{em.name}:</span>
                        </button>
                        <button
                          onClick={() => {
                            onUpdateServer(server.id, {
                              customEmojis: customEmojis.filter((x) => x.id !== em.id),
                            });
                            setOpenEmojiMenuId(null);
                            onNotify(`Emoji :${em.name}: eliminado`);
                          }}
                          className="w-full px-3 py-1.5 rounded-lg hover:bg-red-500/20 text-xs font-semibold text-red-400 text-left flex items-center gap-2 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Eliminar</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Upload Emoji Modal */}
        {showEmojiModal && (
          <div
            onClick={() => setShowEmojiModal(false)}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-end md:items-center justify-center p-0 md:p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-[#0c0d10] border border-white/15 rounded-t-3xl md:rounded-3xl p-5 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-lg">Subir nuevo emoji</h3>
                <button
                  onClick={() => setShowEmojiModal(false)}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <input
                ref={emojiInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) readFileAsDataUrl(file, (url) => setNewEmojiImageUrl(url));
                }}
              />

              <div className="flex items-center gap-4">
                <button
                  onClick={() => emojiInputRef.current?.click()}
                  className="w-20 h-20 rounded-2xl bg-[#14151a] border border-dashed border-white/25 hover:border-[#5865F2] flex flex-col items-center justify-center gap-1 overflow-hidden cursor-pointer shrink-0"
                >
                  {newEmojiImageUrl ? (
                    <img src={newEmojiImageUrl} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <Upload className="w-5 h-5 text-zinc-400" />
                      <span className="text-[10px] text-zinc-400 font-semibold">Subir foto</span>
                    </>
                  )}
                </button>

                <div className="flex-1 space-y-2">
                  <label className="text-[11px] font-bold uppercase text-zinc-400">
                    Nombre del emoji
                  </label>
                  <input
                    type="text"
                    value={newEmojiName}
                    onChange={(e) =>
                      setNewEmojiName(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))
                    }
                    placeholder="ej: zenith_hype"
                    className="w-full bg-[#14151a] border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
                  />
                </div>
              </div>

              {!newEmojiImageUrl && (
                <div>
                  <p className="text-[11px] font-bold uppercase text-zinc-400 mb-1.5">
                    O elige un símbolo rápido
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {['⚡', '🔥', '💎', '👑', '🚀', '💀', '😈', '❄️', '🎮', '⭐'].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setNewEmojiSymbol(s)}
                        className={`w-9 h-9 rounded-xl border text-lg flex items-center justify-center cursor-pointer ${
                          newEmojiSymbol === s
                            ? 'bg-[#5865F2]/25 border-[#5865F2]'
                            : 'bg-[#14151a] border-white/10'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  const cleanName = newEmojiName.trim() || `emoji_${customEmojis.length + 1}`;
                  const newEm: ServerEmoji = {
                    id: `em-${Date.now()}`,
                    name: cleanName,
                    imageUrl: newEmojiImageUrl,
                    symbol: newEmojiSymbol,
                    uploadedBy: user.username,
                  };
                  onUpdateServer(server.id, {
                    customEmojis: [newEm, ...customEmojis],
                  });
                  setNewEmojiName('');
                  setNewEmojiImageUrl(undefined);
                  setShowEmojiModal(false);
                  onNotify(`Emoji :${cleanName}: añadido a ${server.name}`);
                }}
                className="w-full h-11 rounded-full dc-btn-primary font-bold text-sm cursor-pointer"
              >
                Guardar emoji
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ---------------- 3. VISTA GENERAL (Editar server + Banner 1 mejora + Diseños de chat) ---------------- */
  if (section === 'vista-general') {
    return (
      <div className="flex-1 flex flex-col h-full bg-[#111214] text-white overflow-hidden">
        {renderSubHeader('Vista general')}

        <input
          ref={iconInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              readFileAsDataUrl(file, (url) => {
                onUpdateServer(server.id, { customIconUrl: url });
                onNotify('Icono del servidor actualizado');
              });
            }
          }}
        />
        <input
          ref={bannerInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              readFileAsDataUrl(file, (url) => {
                onUpdateServer(server.id, { bannerImage: url });
                onNotify('Banner del servidor actualizado');
              });
            }
          }}
        />
        <input
          ref={wallpaperInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              readFileAsDataUrl(file, (url) => {
                onUpdateServer(server.id, { chatTheme: 'custom-photo', chatWallpaperUrl: url });
                onNotify('Fondo de chat personalizado aplicado');
              });
            }
          }}
        />

        <div className="flex-1 overflow-y-auto px-4 pt-4 pb-20 space-y-6">
          <div className="max-w-lg mx-auto space-y-6">
            {/* Server Identity Card */}
            <div className="rounded-2xl bg-[#111216] border border-white/10 p-4 space-y-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => iconInputRef.current?.click()}
                  className="relative w-20 h-20 rounded-3xl overflow-hidden border border-white/15 shrink-0 cursor-pointer group"
                >
                  <ServerIconArt server={server} />
                  <span className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] font-bold transition-opacity">
                    Cambiar
                  </span>
                </button>
                <div className="flex-1 space-y-2">
                  <button
                    onClick={() => iconInputRef.current?.click()}
                    className="px-4 py-2 rounded-full dc-btn-primary text-xs font-bold cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <ImagePlus className="w-3.5 h-3.5" />
                    <span>Subir icono</span>
                  </button>
                  {server.customIconUrl && (
                    <button
                      onClick={() => onUpdateServer(server.id, { customIconUrl: undefined })}
                      className="ml-2 px-3 py-2 rounded-full dc-btn-secondary text-xs font-semibold cursor-pointer"
                    >
                      Restaurar
                    </button>
                  )}
                  <p className="text-[11px] text-zinc-400">
                    Tamaño recomendado 512x512 px.
                  </p>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-zinc-400">
                  Nombre del servidor
                </label>
                <input
                  type="text"
                  value={srvName}
                  onChange={(e) => setSrvName(e.target.value)}
                  className="w-full mt-1 bg-[#070709] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-zinc-400">
                  Descripción
                </label>
                <textarea
                  rows={2}
                  value={srvDesc}
                  onChange={(e) => setSrvDesc(e.target.value)}
                  className="w-full mt-1 bg-[#070709] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white resize-none"
                />
              </div>

              <button
                onClick={() => {
                  onUpdateServer(server.id, {
                    name: srvName.trim() || server.name,
                    description: srvDesc.trim(),
                  });
                  onNotify('Cambios del servidor guardados');
                }}
                className="w-full h-10 rounded-full dc-btn-success text-xs font-bold cursor-pointer"
              >
                Guardar información del servidor
              </button>
            </div>

            {/* BANNER DEL SERVIDOR (Desbloqueado con 1 mejora) */}
            <div className="rounded-2xl bg-[#111216] border border-white/10 p-4 space-y-3.5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="font-display font-bold text-[16px] flex items-center gap-2">
                    <span>Banner del servidor</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        hasBannerUnlocked
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-pink-500/15 text-pink-300 border border-pink-500/30'
                      }`}
                    >
                      {hasBannerUnlocked ? 'Desbloqueado' : '1 mejora'}
                    </span>
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Con 1 mejora puedes subir una foto o elegir un banner arriba del canal.
                  </p>
                </div>
                <BoostGemIcon className="w-6 h-6 shrink-0" muted={!hasBannerUnlocked} />
              </div>

              {server.bannerImage ? (
                <div className="relative h-28 rounded-xl overflow-hidden border border-white/15">
                  <img
                    src={server.bannerImage}
                    alt="Banner del servidor"
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => onUpdateServer(server.id, { bannerImage: undefined })}
                    className="absolute top-2 right-2 px-2.5 py-1 rounded-full bg-black/75 text-xs font-bold text-white cursor-pointer"
                  >
                    Quitar
                  </button>
                </div>
              ) : (
                <div
                  className="h-20 rounded-xl border border-white/10 flex items-center justify-center text-xs text-zinc-400"
                  style={{ backgroundColor: server.bannerColor || '#09090b' }}
                >
                  Sin banner de imagen activo
                </div>
              )}

              {hasBannerUnlocked ? (
                <div className="space-y-3">
                  <button
                    onClick={() => bannerInputRef.current?.click()}
                    className="w-full h-10 rounded-full dc-btn-primary text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Subir foto de banner</span>
                  </button>

                  <div>
                    <p className="text-[11px] font-bold uppercase text-zinc-400 mb-2">
                      Banners rápidos del servidor
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {BANNER_PRESETS.map((b) => (
                        <button
                          key={b.id}
                          onClick={() => {
                            onUpdateServer(server.id, { bannerImage: b.url });
                            onNotify(`Banner "${b.name}" aplicado`);
                          }}
                          className={`relative h-14 rounded-xl overflow-hidden border cursor-pointer ${
                            server.bannerImage === b.url
                              ? 'border-[#23a55a] ring-2 ring-[#23a55a]/50'
                              : 'border-white/10'
                          }`}
                        >
                          <img src={b.url} alt={b.name} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => onOpenServerBoost(server.id)}
                  className="w-full h-11 rounded-full dc-btn-primary text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <BoostGemIcon className="w-4 h-4" />
                  <span>Desbloquear con 1 mejora</span>
                </button>
              )}
            </div>

            {/* DISEÑOS DE CHAT DEL SERVIDOR */}
            <div className="rounded-2xl bg-[#111216] border border-white/10 p-4 space-y-4">
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-[#5865F2]" />
                <div>
                  <h2 className="font-display font-bold text-[16px]">Diseños de chat</h2>
                  <p className="text-xs text-zinc-400">
                    Cambia el fondo, burbujas y color de acento de todos los canales de {server.name}.
                  </p>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase text-zinc-400 mb-2">
                  Fondo del chat
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CHAT_THEMES.map((t) => {
                    const active = (server.chatTheme || 'black') === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => {
                          if (t.id === 'custom-photo') {
                            wallpaperInputRef.current?.click();
                          } else {
                            onUpdateServer(server.id, { chatTheme: t.id });
                            onNotify(`Diseño de chat "${t.label}" aplicado`);
                          }
                        }}
                        className={`p-2.5 rounded-xl border text-left flex items-center gap-2 cursor-pointer ${
                          active
                            ? 'border-[#5865F2] bg-[#5865F2]/15'
                            : 'border-white/10 bg-[#070709]'
                        }`}
                      >
                        <span
                          className="w-6 h-6 rounded-lg border border-white/20 shrink-0"
                          style={{ background: t.preview }}
                        />
                        <span className="text-xs font-semibold truncate">{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase text-zinc-400 mb-2">
                  Estilo de mensajes
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { id: 'classic', label: 'Clásico' },
                      { id: 'bubbles', label: 'Burbujas' },
                      { id: 'compact', label: 'Compacto' },
                    ] as { id: ServerChatStyle; label: string }[]
                  ).map((st) => (
                    <button
                      key={st.id}
                      onClick={() => {
                        onUpdateServer(server.id, { chatMessageStyle: st.id });
                        onNotify(`Estilo "${st.label}" aplicado`);
                      }}
                      className={`py-2 rounded-xl border text-xs font-bold cursor-pointer ${
                        (server.chatMessageStyle || 'classic') === st.id
                          ? 'border-[#5865F2] bg-[#5865F2]/20 text-white'
                          : 'border-white/10 bg-[#070709] text-zinc-400'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase text-zinc-400 mb-2">
                  Color de acento del chat
                </p>
                <div className="flex flex-wrap gap-2">
                  {['#5865f2', '#ef4444', '#23a55a', '#f59e0b', '#ec4899', '#06b6d4', '#ffffff'].map(
                    (c) => (
                      <button
                        key={c}
                        onClick={() => onUpdateServer(server.id, { chatAccentColor: c })}
                        className={`w-8 h-8 rounded-full border-2 cursor-pointer ${
                          (server.chatAccentColor || '#5865f2') === c
                            ? 'border-white scale-110'
                            : 'border-white/15'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------- 4. ROLES ---------------- */
  if (section === 'roles') {
    const ROLE_PERMISSIONS_OPTIONS = [
      { key: 'Administrador', desc: 'Acceso total a ajustes y moderación del servidor.' },
      { key: 'Gestionar canales', desc: 'Crear, editar, reordenar y borrar canales.' },
      { key: 'Expulsar miembros', desc: 'Expulsar miembros con menor jerarquía.' },
      { key: 'Gestionar roles', desc: 'Crear roles y asignarlos a miembros.' },
      { key: 'Fijar mensajes', desc: 'Fijar y desfijar mensajes en canales.' },
    ];

    return (
      <div className="flex-1 flex flex-col h-full bg-[#111214] text-white overflow-hidden">
        {renderSubHeader(
          'Roles',
          <button
            onClick={() => {
              setRoleNameInput('');
              setRoleColorInput('#5865f2');
              setRoleUseGradient(false);
              setRoleHoistInput(true);
              setRolePermsInput(['Enviar mensajes', 'Leer canales']);
              setShowNewRole(true);
            }}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full dc-btn-primary text-xs font-bold cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Crear rol</span>
          </button>
        )}

        <div className="flex-1 overflow-y-auto px-4 pt-4 pb-20 space-y-5">
          <div className="max-w-lg mx-auto space-y-5">
            <div className="rounded-2xl bg-[#1c1d22] border border-[#2e3035] divide-y divide-[#2e3035] overflow-hidden">
              {roles.map((r, idx) => (
                <div
                  key={r.id}
                  onClick={() => {
                    setEditingRole(r);
                    setRoleNameInput(r.name);
                    setRoleColorInput(r.color);
                    setRoleUseGradient(!!r.gradientColors);
                    if (r.gradientColors) setRoleGradEnd(r.gradientColors[1]);
                    setRoleHoistInput(Boolean(r.hoist));
                    setRolePermsInput([...(r.permissions || [])]);
                  }}
                  className="w-full px-3.5 py-3 flex items-center justify-between gap-2.5 hover:bg-white/[0.04] text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span className="text-[11px] font-bold text-zinc-500 tabular-nums w-5 shrink-0">
                      #{idx + 1}
                    </span>
                    <span
                      className="w-4 h-4 rounded-full shrink-0"
                      style={{
                        background: r.gradientColors
                          ? `linear-gradient(135deg, ${r.gradientColors[0]}, ${r.gradientColors[1]})`
                          : r.color,
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p
                          className="font-bold text-[15px] truncate"
                          style={
                            r.gradientColors
                              ? {
                                  backgroundImage: `linear-gradient(90deg, ${r.gradientColors[0]}, ${r.gradientColors[1]})`,
                                  WebkitBackgroundClip: 'text',
                                  color: 'transparent',
                                }
                              : { color: r.color }
                          }
                        >
                          {r.name}
                        </p>
                        {r.hoist && (
                          <span className="px-1.5 py-0.5 rounded bg-white/[0.06] text-[9.5px] font-bold text-zinc-400">
                            Separado
                          </span>
                        )}
                      </div>
                      <p className="text-[11.5px] text-zinc-400 truncate">
                        {r.permissions.slice(0, 3).join(' · ') || 'Sin permisos especiales'}
                      </p>
                    </div>
                  </div>
                  <div
                    className="flex items-center gap-1 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      disabled={idx === 0}
                      aria-label={`Subir rol ${r.name}`}
                      onClick={() => {
                        if (idx === 0) return;
                        const next = [...roles];
                        const [item] = next.splice(idx, 1);
                        next.splice(idx - 1, 0, item);
                        onUpdateServer(server.id, { roles: next });
                      }}
                      className="w-8 h-8 rounded-lg bg-white/[0.05] hover:bg-white/10 disabled:opacity-25 flex items-center justify-center text-zinc-300 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === roles.length - 1}
                      aria-label={`Bajar rol ${r.name}`}
                      onClick={() => {
                        if (idx === roles.length - 1) return;
                        const next = [...roles];
                        const [item] = next.splice(idx, 1);
                        next.splice(idx + 1, 0, item);
                        onUpdateServer(server.id, { roles: next });
                      }}
                      className="w-8 h-8 rounded-lg bg-white/[0.05] hover:bg-white/10 disabled:opacity-25 flex items-center justify-center text-zinc-300 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <ChevronRight className="w-4 h-4 text-zinc-400 ml-0.5" />
                  </div>
                </div>
              ))}
            </div>

            {/* Assign roles to members */}
            <div className="rounded-2xl bg-[#1c1d22] border border-[#2e3035] p-4 space-y-3">
              <h3 className="font-display font-bold text-[15px]">
                Asignar roles a miembros
              </h3>
              <div className="space-y-3">
                {membersList.map((m) => {
                  const assigned = memberRoles[m.id] || [];
                  return (
                    <div
                      key={m.id}
                      className="p-3 rounded-xl bg-[#111214] border border-[#2e3035] space-y-2"
                    >
                      <div className="flex items-center gap-2.5">
                        <UserAvatar
                          avatar={m.avatar}
                          customAvatarUrl={m.customAvatarUrl}
                          status={m.status}
                          size="sm"
                        />
                        <span className="font-bold text-sm">{m.name}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {roles
                          .filter((r) => r.id !== 'role-everyone')
                          .map((r) => {
                            const has = assigned.includes(r.id);
                            return (
                              <button
                                key={r.id}
                                onClick={() => handleToggleMemberRole(m.id, r.id)}
                                className={`px-2.5 py-1 rounded-full text-[11px] font-bold border flex items-center gap-1 cursor-pointer transition-all ${
                                  has
                                    ? 'bg-white/15 border-white/35 text-white'
                                    : 'bg-transparent border-white/10 text-zinc-500'
                                }`}
                              >
                                <span
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: r.color }}
                                />
                                <span>{r.name}</span>
                                {has && <Check className="w-3 h-3" />}
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {(showNewRole || editingRole) && (
          <div
            onClick={() => {
              setShowNewRole(false);
              setEditingRole(null);
            }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-end md:items-center justify-center p-0 md:p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md max-h-[90dvh] flex flex-col bg-[#1c1d22] border border-[#2e3035] rounded-t-3xl md:rounded-3xl p-5 space-y-4 overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-lg">
                  {editingRole ? 'Editar rol' : 'Nuevo rol'}
                </h3>
                <button
                  onClick={() => {
                    setShowNewRole(false);
                    setEditingRole(null);
                  }}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-zinc-400">Nombre</label>
                <input
                  type="text"
                  value={roleNameInput}
                  onChange={(e) => setRoleNameInput(e.target.value)}
                  placeholder="Ej: 🔥 VIP"
                  className="w-full mt-1 bg-[#111214] border border-[#2e3035] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#5865F2]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase text-zinc-400">
                  Color del rol (HEX personalizado)
                </label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {ROLE_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setRoleColorInput(c)}
                      className={`w-8 h-8 rounded-full border-2 cursor-pointer ${
                        roleColorInput.toLowerCase() === c.toLowerCase()
                          ? 'border-white scale-110'
                          : 'border-white/10'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="color"
                    value={/^#[0-9a-fA-F]{6}$/.test(roleColorInput) ? roleColorInput : '#5865f2'}
                    onChange={(e) => setRoleColorInput(e.target.value)}
                    aria-label="Selector de color HEX"
                    className="w-10 h-10 rounded-xl bg-transparent border border-[#2e3035] cursor-pointer"
                  />
                  <input
                    type="text"
                    value={roleColorInput}
                    onChange={(e) => setRoleColorInput(e.target.value)}
                    placeholder="#5865F2"
                    className="flex-1 bg-[#111214] border border-[#2e3035] rounded-xl px-3 py-2 text-xs font-mono text-white uppercase focus:outline-none focus:border-[#5865F2]"
                  />
                </div>
              </div>

              <label className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#111214] border border-[#2e3035] cursor-pointer">
                <span className="text-xs font-semibold text-zinc-200">
                  Mostrar miembros del rol por separado
                </span>
                <input
                  type="checkbox"
                  checked={roleHoistInput}
                  onChange={(e) => setRoleHoistInput(e.target.checked)}
                  className="w-4 h-4 accent-[#5865F2]"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-[#111214] border border-[#2e3035] cursor-pointer">
                <span className="text-xs font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-pink-400" /> Gradiente de rol mejorado
                </span>
                <input
                  type="checkbox"
                  checked={roleUseGradient}
                  onChange={(e) => setRoleUseGradient(e.target.checked)}
                  className="w-4 h-4 accent-[#5865F2]"
                />
              </label>

              <div className="space-y-2">
                <p className="text-[11px] font-bold uppercase text-zinc-400">Permisos del rol</p>
                <div className="rounded-xl bg-[#111214] border border-[#2e3035] divide-y divide-[#2e3035]">
                  {ROLE_PERMISSIONS_OPTIONS.map((perm) => {
                    const enabled = rolePermsInput.includes(perm.key);
                    return (
                      <label
                        key={perm.key}
                        className="p-3 flex items-center justify-between gap-3 cursor-pointer"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white">{perm.key}</p>
                          <p className="text-[11px] text-zinc-400">{perm.desc}</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={enabled}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setRolePermsInput((prev) =>
                                prev.includes(perm.key) ? prev : [...prev, perm.key]
                              );
                            } else {
                              setRolePermsInput((prev) => prev.filter((x) => x !== perm.key));
                            }
                          }}
                          className="w-4 h-4 accent-[#5865F2] shrink-0"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => {
                    const name = roleNameInput.trim() || 'Nuevo Rol';
                    const validHex = /^#[0-9a-fA-F]{6}$/.test(roleColorInput.trim())
                      ? roleColorInput.trim()
                      : '#5865f2';
                    if (editingRole) {
                      onUpdateServer(server.id, {
                        roles: roles.map((r) =>
                          r.id === editingRole.id
                            ? {
                                ...r,
                                name,
                                color: validHex,
                                hoist: roleHoistInput,
                                permissions: rolePermsInput,
                                gradientColors: roleUseGradient
                                  ? [validHex, roleGradEnd]
                                  : undefined,
                              }
                            : r
                        ),
                      });
                    } else {
                      const newR: ServerRole = {
                        id: `role-${Date.now()}`,
                        name,
                        color: validHex,
                        gradientColors: roleUseGradient
                          ? [validHex, roleGradEnd]
                          : undefined,
                        hoist: roleHoistInput,
                        permissions: rolePermsInput.length > 0 ? rolePermsInput : ['Enviar mensajes'],
                      };
                      onUpdateServer(server.id, { roles: [newR, ...roles] });
                    }
                    setShowNewRole(false);
                    setEditingRole(null);
                    onNotify('Rol guardado');
                  }}
                  className="flex-1 h-10 rounded-full dc-btn-primary text-sm font-bold cursor-pointer"
                >
                  Guardar rol
                </button>
                {editingRole && editingRole.id !== 'role-everyone' && (
                  <button
                    onClick={() => {
                      onUpdateServer(server.id, {
                        roles: roles.filter((r) => r.id !== editingRole.id),
                      });
                      setEditingRole(null);
                      onNotify('Rol eliminado');
                    }}
                    className="px-4 h-10 rounded-full dc-btn-danger text-sm font-bold cursor-pointer"
                  >
                    Borrar
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ---------------- 5. STICKERS / MIEMBROS / INVITACIONES / MODERACION / ETIQUETA / ETC ---------------- */
  if (section === 'stickers') {
    return (
      <div className="flex-1 flex flex-col h-full bg-[#111214] text-white overflow-hidden">
        {renderSubHeader('Stickers')}
        <div className="flex-1 overflow-y-auto px-4 pt-4 pb-16 max-w-lg mx-auto w-full space-y-4">
          <div className="rounded-2xl bg-[#111216] border border-white/10 p-4 space-y-3">
            <h3 className="font-display font-bold text-sm">Añadir sticker al servidor</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={stickerEmoji}
                onChange={(e) => setStickerEmoji(e.target.value)}
                className="w-14 text-center bg-[#070709] border border-white/10 rounded-xl py-2 text-lg"
              />
              <input
                type="text"
                value={stickerName}
                onChange={(e) => setStickerName(e.target.value)}
                placeholder="Nombre del sticker"
                className="flex-1 bg-[#070709] border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
              />
              <button
                onClick={() => {
                  if (!stickerName.trim()) return;
                  onUpdateServer(server.id, {
                    stickers: [
                      ...stickers,
                      { id: `stk-${Date.now()}`, name: stickerName.trim(), emoji: stickerEmoji || '🔥' },
                    ],
                  });
                  setStickerName('');
                  onNotify('Sticker añadido');
                }}
                className="px-4 rounded-xl dc-btn-primary text-xs font-bold cursor-pointer"
              >
                Añadir
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {stickers.map((stk) => (
              <div
                key={stk.id}
                className="rounded-2xl bg-[#111216] border border-white/10 p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-3xl">{stk.emoji}</span>
                  <span className="font-bold text-sm">{stk.name}</span>
                </div>
                <button
                  onClick={() =>
                    onUpdateServer(server.id, {
                      stickers: stickers.filter((s) => s.id !== stk.id),
                    })
                  }
                  className="text-zinc-500 hover:text-red-400 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (section === 'miembros') {
    const qMembers = memberSearch.trim().toLowerCase();
    const filteredMembers = membersList.filter(
      (m) =>
        !qMembers ||
        m.name.toLowerCase().includes(qMembers) ||
        m.username.toLowerCase().includes(qMembers)
    );
    const activeRoleMember = roleTargetMemberId
      ? membersList.find((m) => m.id === roleTargetMemberId) || null
      : null;

    return (
      <div className="flex-1 flex flex-col h-full bg-[#111214] text-white overflow-hidden">
        {renderSubHeader(`Miembros · ${membersList.length}`)}
        <div className="flex-1 overflow-y-auto px-4 pt-4 pb-16 max-w-lg mx-auto w-full space-y-3">
          <div className="flex items-center gap-2 bg-[#1c1d22] border border-[#2e3035] rounded-xl px-3.5 h-10">
            <input
              type="text"
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              placeholder="Buscar miembro por nombre o @usuario..."
              className="flex-1 bg-transparent text-sm text-white placeholder:text-zinc-500 focus:outline-none"
            />
            {memberSearch && (
              <button
                type="button"
                onClick={() => setMemberSearch('')}
                className="text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {filteredMembers.map((m) => {
            const assigned = roles.filter((r) => (memberRoles[m.id] || []).includes(r.id));
            const isSrvOwner = m.id === server.ownerId;
            return (
              <div
                key={m.id}
                onClick={() => onInspectUser?.(m.id)}
                className="rounded-2xl bg-[#1c1d22] border border-[#2e3035] hover:border-white/25 hover:bg-[#26272f] p-3.5 flex items-center justify-between gap-3 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <UserAvatar
                    avatar={m.avatar}
                    customAvatarUrl={m.customAvatarUrl}
                    status={m.status}
                    size="md"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p
                        className="font-bold text-sm truncate"
                        style={{ color: assigned[0]?.color || '#ffffff' }}
                      >
                        {m.name}
                      </p>
                      {isSrvOwner ? (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-400/35 text-[10px] font-bold text-amber-300">
                          <Crown className="w-2.5 h-2.5" />
                          Dueño
                        </span>
                      ) : m.isAdmin ? (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-[#5865F2]/20 border border-[#5865F2]/40 text-[10px] font-bold text-[#99a2ff]">
                          <ShieldCheck className="w-2.5 h-2.5" />
                          Admin
                        </span>
                      ) : null}
                    </div>
                    <p className="text-xs text-zinc-400">@{m.username}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {assigned.map((r) => (
                        <span
                          key={r.id}
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/5 border border-white/10"
                          style={{ color: r.color }}
                        >
                          {r.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                  {isOwnerSrv && !isSrvOwner && m.id !== user.id && onToggleMemberAdmin && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleMemberAdmin(server.id, m.id, !m.isAdmin);
                      }}
                      className={`px-2.5 py-1.5 rounded-full text-[11px] font-bold cursor-pointer transition-colors ${
                        m.isAdmin
                          ? 'bg-red-500/15 text-red-300 border border-red-500/30 hover:bg-red-500/25'
                          : 'bg-[#5865F2]/20 text-[#b4bcff] border border-[#5865F2]/40 hover:bg-[#5865F2]/30'
                      }`}
                    >
                      {m.isAdmin ? 'Quitar Admin' : 'Dar Admin'}
                    </button>
                  )}
                  {canEditRoles && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setRoleTargetMemberId(m.id);
                      }}
                      className="px-2.5 py-1.5 rounded-full dc-btn-secondary text-[11px] font-semibold cursor-pointer shrink-0"
                    >
                      Roles
                    </button>
                  )}
                  {canKickMembers && !isSrvOwner && m.id !== user.id && onKickMember && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setKickCandidate({ id: m.id, name: m.name });
                      }}
                      className="px-2.5 py-1.5 rounded-full bg-[#f23f43]/15 hover:bg-[#f23f43]/25 border border-[#f23f43]/35 text-[#f23f43] text-[11px] font-bold cursor-pointer shrink-0"
                    >
                      Expulsar
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {filteredMembers.length === 0 && (
            <div className="rounded-2xl bg-[#1c1d22] border border-[#2e3035] p-6 text-center text-xs text-zinc-400">
              No hay miembros que coincidan con «{memberSearch}».
            </div>
          )}
        </div>

        {/* Member Role Checkbox Sheet */}
        {activeRoleMember && (
          <div
            onClick={() => setRoleTargetMemberId(null)}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-end md:items-center justify-center p-0 md:p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-[#1c1d22] border border-[#2e3035] rounded-t-3xl md:rounded-3xl p-5 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display font-bold text-base text-white">
                    Roles de {activeRoleMember.name}
                  </h3>
                  <p className="text-xs text-zinc-400">@{activeRoleMember.username}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setRoleTargetMemberId(null)}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="rounded-xl bg-[#111214] border border-[#2e3035] divide-y divide-[#2e3035] max-h-72 overflow-y-auto">
                {roles
                  .filter((r) => r.id !== 'role-everyone')
                  .map((r) => {
                    const checked = (memberRoles[activeRoleMember.id] || []).includes(r.id);
                    return (
                      <label
                        key={r.id}
                        className="px-3.5 py-2.5 flex items-center justify-between gap-2 cursor-pointer hover:bg-white/[0.03]"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: r.color }}
                          />
                          <span className="text-sm font-semibold text-white truncate">
                            {r.name}
                          </span>
                        </div>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleToggleMemberRole(activeRoleMember.id, r.id)}
                          className="w-4 h-4 accent-[#5865F2]"
                        />
                      </label>
                    );
                  })}
              </div>
              <button
                type="button"
                onClick={() => setRoleTargetMemberId(null)}
                className="w-full h-10 rounded-full dc-btn-primary text-xs font-bold cursor-pointer"
              >
                Listo
              </button>
            </div>
          </div>
        )}

        {/* Kick Confirmation Modal */}
        {kickCandidate && (
          <div
            onClick={() => setKickCandidate(null)}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-end md:items-center justify-center p-0 md:p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-[#1c1d22] border border-[#2e3035] rounded-t-3xl md:rounded-3xl p-5 space-y-4 shadow-2xl"
            >
              <div className="space-y-1">
                <h3 className="font-display font-bold text-lg text-white">
                  ¿Expulsar a {kickCandidate.name}?
                </h3>
                <p className="text-xs text-zinc-400">
                  Perderá el acceso a {server.name} hasta que vuelva a unirse con una invitación.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onKickMember?.(server.id, kickCandidate.id, kickCandidate.name);
                    setKickCandidate(null);
                  }}
                  className="w-full h-11 rounded-full bg-[#f23f43] hover:bg-[#d83337] text-white text-sm font-bold cursor-pointer"
                >
                  Confirmar expulsión
                </button>
                <button
                  type="button"
                  onClick={() => setKickCandidate(null)}
                  className="w-full h-11 rounded-full dc-btn-secondary text-sm font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (section === 'invitaciones') {
    return (
      <div className="flex-1 flex flex-col h-full bg-[#111214] text-white overflow-hidden">
        {renderSubHeader('Invitaciones')}
        <div className="flex-1 overflow-y-auto px-4 pt-4 pb-16 max-w-lg mx-auto w-full space-y-4">
          <div className="rounded-2xl bg-[#111216] border border-white/10 p-4 space-y-2">
            <p className="text-xs text-zinc-400">
              Comparte el ID oficial de este servidor para que otros usuarios reales puedan unirse desde Servidores o Descubrir:
            </p>
            <div className="flex items-center justify-between gap-2 bg-[#070709] border border-white/10 rounded-xl px-3 py-2">
              <span className="font-mono text-xs font-bold text-white truncate">{server.id}</span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(server.id).catch(() => {});
                  onNotify(`ID de invitación copiado: ${server.id}`);
                }}
                className="px-3 py-1 rounded-full dc-btn-primary text-xs font-bold cursor-pointer shrink-0 inline-flex items-center gap-1"
              >
                <Copy className="w-3 h-3" />
                <span>Copiar ID</span>
              </button>
            </div>
          </div>

          <div className="rounded-2xl bg-[#111216] border border-white/10 divide-y divide-white/[0.06]">
            {invites.map((inv) => (
              <div key={inv.code} className="p-3.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-sm font-bold text-white truncate">{inv.code}</p>
                  <p className="text-xs text-zinc-400">
                    Por {inv.creator} · {inv.uses} miembros · {inv.expires}
                  </p>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(inv.code).catch(() => {});
                    onNotify(`Código copiado: ${inv.code}`);
                  }}
                  className="px-3 py-1.5 rounded-full dc-btn-secondary text-xs font-bold cursor-pointer"
                >
                  Copiar
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (section === 'etiqueta') {
    return (
      <div className="flex-1 flex flex-col h-full bg-[#111214] text-white overflow-hidden">
        {renderSubHeader('Etiqueta del servidor')}
        <div className="flex-1 overflow-y-auto px-4 pt-4 pb-16 max-w-lg mx-auto w-full space-y-4">
          <div className="rounded-2xl bg-[#111216] border border-white/10 p-4 space-y-3">
            <p className="text-sm text-zinc-300">
              Crea una etiqueta corta (máx. 4 caracteres) para que tus miembros la muestren junto a su nombre.
            </p>
            <input
              type="text"
              maxLength={4}
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value.toUpperCase())}
              className="w-full bg-[#070709] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm font-black tracking-widest text-white uppercase"
            />
            <button
              onClick={() => {
                const nextTag = tagInput || server.shortCode || 'SRV';
                onUpdateServer(server.id, { activeServerTag: nextTag });
                onNotify(`Etiqueta "${nextTag}" guardada`);
              }}
              className="w-full h-10 rounded-full dc-btn-primary text-xs font-bold cursor-pointer"
            >
              Guardar etiqueta
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (section === 'moderacion' || section === 'automod' || section === 'seguridad') {
    return (
      <div className="flex-1 flex flex-col h-full bg-[#111214] text-white overflow-hidden">
        {renderSubHeader(
          section === 'automod'
            ? 'AutoMod'
            : section === 'seguridad'
            ? 'Seguridad'
            : 'Moderación'
        )}
        <div className="flex-1 overflow-y-auto px-4 pt-4 pb-16 max-w-lg mx-auto w-full space-y-4">
          <div className="rounded-2xl bg-[#111216] border border-white/10 p-4 space-y-3">
            <h3 className="font-display font-bold text-sm">Nivel de verificación</h3>
            <div className="grid grid-cols-3 gap-2">
              {(['bajo', 'medio', 'alto'] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => {
                    setModLevel(lvl);
                    onNotify(`Nivel de verificación: ${lvl.toUpperCase()}`);
                  }}
                  className={`py-2.5 rounded-xl border text-xs font-bold capitalize cursor-pointer ${
                    modLevel === lvl
                      ? 'bg-[#5865F2]/20 border-[#5865F2] text-white'
                      : 'bg-[#070709] border-white/10 text-zinc-400'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-[#111216] border border-white/10 divide-y divide-white/[0.06]">
            {[
              { label: 'Bloquear spam de menciones', val: automodSpam, set: setAutomodSpam },
              { label: 'Filtrar enlaces sospechosos', val: automodLinks, set: setAutomodLinks },
              { label: 'Filtro automático de palabras', val: automodWords, set: setAutomodWords },
            ].map((item) => (
              <label
                key={item.label}
                className="p-4 flex items-center justify-between cursor-pointer"
              >
                <span className="text-sm font-medium">{item.label}</span>
                <input
                  type="checkbox"
                  checked={item.val}
                  onChange={(e) => item.set(e.target.checked)}
                  className="w-4 h-4 accent-[#5865F2]"
                />
              </label>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (section !== 'menu') {
    const titleMap: Record<ServerSettingsSection, string> = {
      menu: 'Ajustes del servidor',
      'vista-general': 'Vista general',
      canales: 'Canales',
      integraciones: 'Integraciones',
      etiqueta: 'Etiqueta del servidor',
      plantilla: 'Plantilla de servidor',
      emojis: 'Emojis',
      stickers: 'Stickers',
      miembros: 'Miembros',
      roles: 'Roles',
      invitaciones: 'Invitaciones',
      moderacion: 'Moderación',
      automod: 'AutoMod',
      auditoria: 'Registro de auditoría',
      baneos: 'Baneos',
      seguridad: 'Seguridad',
      comunidad: 'Ajustes de comunidades',
      info: 'Información del servidor',
    };

    return (
      <div className="flex-1 flex flex-col h-full bg-[#111214] text-white overflow-hidden">
        {renderSubHeader(titleMap[section])}
        <div className="flex-1 overflow-y-auto px-4 pt-4 pb-16 max-w-lg mx-auto w-full space-y-4">
          <div className="rounded-2xl bg-[#111216] border border-white/10 p-4 space-y-3">
            <h3 className="font-display font-bold text-base">{titleMap[section]}</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Configuración activa para <strong className="text-white">{server.name}</strong> ({server.memberCountDisplay ?? server.memberCount} miembros · {server.onlineCount} en línea · {boosts} mejoras).
            </p>
            {section === 'integraciones' && (
              <div className="space-y-2 pt-2">
                <p className="text-xs text-zinc-400">
                  No hay bots ni integraciones externas conectadas en {server.name}. Usa <code className="text-[#b4bcff]">/everyone</code> en cualquier canal para notificar a todos los miembros reales.
                </p>
              </div>
            )}
            {section === 'auditoria' && (
              <div className="space-y-2 pt-2 text-xs text-zinc-300">
                <div className="p-3 rounded-xl bg-[#070709] border border-white/10">
                  <strong>{user.displayName}</strong> abrió los ajustes de {server.name} · Ahora
                </div>
              </div>
            )}
            {section === 'baneos' && (
              <p className="text-xs text-zinc-500 pt-2">
                No hay usuarios baneados actualmente en {server.name}.
              </p>
            )}
            {section === 'plantilla' && (
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(server.id).catch(() => {});
                  onNotify(`Enlace de ${server.name} copiado: ${server.id}`);
                }}
                className="w-full h-10 rounded-full dc-btn-primary text-xs font-bold cursor-pointer"
              >
                Generar y copiar ID de servidor
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ---------------- 0. MAIN MENU ---------------- */
  const menuGroups: {
    heading?: string;
    items: { id: ServerSettingsSection; label: string; icon: React.ComponentType<{ className?: string }>; badge?: string }[];
  }[] = canManage
    ? [
        {
          heading: 'Ajustes',
          items: [
            { id: 'vista-general', label: 'Vista general', icon: Info },
            { id: 'canales', label: 'Canales', icon: AlignLeft },
            { id: 'integraciones', label: 'Integraciones', icon: Puzzle },
            { id: 'etiqueta', label: 'Etiqueta del servidor', icon: Tag },
            { id: 'plantilla', label: 'Plantilla de servidor', icon: ListChecks },
          ],
        },
        {
          heading: 'Expresión',
          items: [
            { id: 'emojis', label: 'Emojis', icon: Smile },
            { id: 'stickers', label: 'Stickers', icon: Sticker },
          ],
        },
        {
          heading: 'Gente',
          items: [
            { id: 'miembros', label: 'Miembros', icon: Users },
            { id: 'roles', label: 'Roles', icon: Shield },
            { id: 'invitaciones', label: 'Invitaciones', icon: Link2 },
          ],
        },
        {
          heading: 'Moderación',
          items: [
            { id: 'moderacion', label: 'Moderación', icon: Swords },
            { id: 'automod', label: 'AutoMod', icon: Bot },
            { id: 'auditoria', label: 'Registro de auditoría', icon: ClipboardList },
            { id: 'baneos', label: 'Baneos', icon: Gavel },
            { id: 'seguridad', label: 'Seguridad', icon: ShieldCheck },
          ],
        },
        {
          heading: 'Comunidad',
          items: [
            { id: 'comunidad', label: 'Ajustes de comunidades', icon: Home },
            { id: 'info', label: 'Información del servidor', icon: TrendingUp },
          ],
        },
      ]
    : [
        ...(canEditChannels || canEditRoles
          ? [
              {
                heading: 'Permisos delegados',
                items: [
                  ...(canEditChannels
                    ? [{ id: 'canales' as const, label: 'Canales', icon: AlignLeft }]
                    : []),
                  ...(canEditRoles
                    ? [{ id: 'roles' as const, label: 'Roles', icon: Shield }]
                    : []),
                ],
              },
            ]
          : []),
        {
          heading: 'Gente',
          items: [
            { id: 'miembros', label: 'Miembros', icon: Users },
            { id: 'invitaciones', label: 'Invitaciones', icon: Link2 },
          ],
        },
        {
          heading: 'Comunidad',
          items: [{ id: 'info', label: 'Información del servidor', icon: TrendingUp }],
        },
      ];

  const groups = menuGroups;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#111214] text-white overflow-hidden">
      <header className="h-14 px-4 flex items-center justify-between bg-[#111214] border-b border-white/10 shrink-0">
        <button
          onClick={onBack}
          aria-label="Cerrar ajustes del servidor"
          className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
        <h1 className="font-display font-bold text-[17px]">Ajustes del servidor</h1>
        <div className="w-9" />
      </header>

      <div className="flex-1 overflow-y-auto px-4 pt-5 pb-16">
        <div className="max-w-lg mx-auto space-y-5">
          {/* Top Server Avatar + Name */}
          <div className="flex flex-col items-center">
            <button
              type="button"
              disabled={!canManage}
              onClick={() => canManage && setSection('vista-general')}
              className={`relative w-20 h-20 group ${canManage ? 'cursor-pointer' : 'cursor-default'}`}
            >
              <div className="w-20 h-20 rounded-3xl overflow-hidden border border-white/15">
                <ServerIconArt server={server} />
              </div>
              {canManage && (
                <span className="absolute -top-1.5 -right-1.5 w-8 h-8 rounded-full bg-[#f2f3f5] text-[#09090b] flex items-center justify-center shadow-lg border-2 border-[#111214]">
                  <ImagePlus className="w-4 h-4" />
                </span>
              )}
            </button>
            <p className="font-display font-bold text-[15px] mt-3 text-zinc-200">
              {server.name}
            </p>
            {!canManage && (
              <span className="mt-1 px-2.5 py-0.5 rounded-full bg-white/[0.06] border border-white/10 text-[11px] font-semibold text-zinc-400">
                {canPinMessages || canKickMembers || canEditChannels || canEditRoles
                  ? `Permisos activos: ${[
                      canEditChannels && 'Canales',
                      canEditRoles && 'Roles',
                      canKickMembers && 'Expulsar',
                      canPinMessages && 'Fijar mensajes',
                    ]
                      .filter(Boolean)
                      .join(' · ')}`
                  : 'Solo lectura · Requiere permiso de Administrador para editar'}
              </span>
            )}
          </div>

          {/* Settings Groups */}
          {groups.map((grp, idx) => (
            <div key={idx} className="space-y-1.5">
              {grp.heading && (
                <p className="text-[13px] font-semibold text-zinc-400 px-1">{grp.heading}</p>
              )}
              <div className="rounded-2xl bg-[#111216] border border-white/[0.07] divide-y divide-white/[0.06] overflow-hidden">
                {grp.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setSection(item.id)}
                      className="w-full px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-white/[0.04] transition-colors cursor-pointer text-left"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <Icon className="w-5 h-5 text-white shrink-0" />
                        <span className="text-[15px] font-medium text-white truncate">
                          {item.label}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-zinc-400 shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Danger Zone: Abandonar servidor */}
          {!isOwnerSrv ? (
            <div className="pt-2 space-y-2">
              <div className="rounded-2xl bg-[#111216] border border-red-500/25 overflow-hidden">
                <button
                  onClick={() => setConfirmLeave(true)}
                  className="w-full px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-red-500/10 transition-colors cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <LogOut className="w-5 h-5 text-[#f23f43] shrink-0" />
                    <span className="text-[15px] font-bold text-[#f23f43] truncate">
                      Abandonar servidor
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#f23f43]/70 shrink-0" />
                </button>
              </div>
              <p className="text-[11.5px] text-zinc-500 px-1">
                Si abandonas {server.name}, perderás acceso a sus canales hasta que te inviten de nuevo.
              </p>
            </div>
          ) : (
            <div className="pt-2">
              <p className="text-[11.5px] text-zinc-500 px-1 text-center">
                Eres el dueño de {server.name}. Puedes otorgar o quitar permisos de Admin a otros miembros desde «Miembros».
              </p>
            </div>
          )}
        </div>
      </div>

      {confirmLeave && (
        <div
          onClick={() => setConfirmLeave(false)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-[#0c0d10] border border-white/15 rounded-t-3xl md:rounded-3xl p-5 space-y-4 shadow-2xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl overflow-hidden border border-white/15 shrink-0">
                <ServerIconArt server={server} />
              </div>
              <div className="min-w-0">
                <h3 className="font-display font-bold text-lg text-white truncate">
                  ¿Abandonar «{server.name}»?
                </h3>
                <p className="text-xs text-zinc-400">
                  No podrás volver a entrar a menos que alguien te envíe otra invitación.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  setConfirmLeave(false);
                  onLeaveServer(server.id);
                }}
                className="w-full h-11 rounded-full bg-[#da373c] hover:bg-[#b82b30] text-white text-sm font-bold cursor-pointer transition-colors"
              >
                Abandonar servidor
              </button>
              <button
                onClick={() => setConfirmLeave(false)}
                className="w-full h-11 rounded-full dc-btn-secondary text-sm font-semibold cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
