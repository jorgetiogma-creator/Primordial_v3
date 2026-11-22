import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  BarChart2,
  Bell,
  BellOff,
  Check,
  Copy,
  Crown,
  Forward,
  Gift,
  Hash,
  ImagePlus,
  Megaphone,
  Mic,
  MoreHorizontal,
  Palette,
  Pause,
  Pencil,
  PhoneCall,
  Pin,
  PinOff,
  Play,
  Plus,
  Reply,
  Search,
  SendHorizontal,
  Settings,
  ShieldCheck,
  Smile,
  Square,
  Star,
  Sticker,
  Trash2,
  Users,
  Video,
  X,
} from 'lucide-react';
import {
  AvatarKey,
  ChatMessage,
  DirectMessageThread,
  PublicUserProfile,
  Server,
  ServerRole,
  ServerSettingsSection,
  ThreadMessage,
  UserProfile,
  AppPreferences,
} from '../types/discord';
import { NameplateStripBackground, UserAvatar } from './DiscordArt';
import { BoostGemIcon } from './ServerBoostView';
import { getDisplayNameTextPresentation } from '../utils/displayNameStyle';
import { getServerPermissions } from '../utils/ownerAccess';
import { sendThreadReply, subscribeToMessageThreads } from '../services/firestoreService';

export interface RichMessagePayload {
  content: string;
  mentionEveryone?: boolean;
  replyTo?: { messageId?: string; authorName: string; content: string };
  imageUrl?: string;
  sticker?: ChatMessage['sticker'];
  audioNote?: ChatMessage['audioNote'];
  poll?: ChatPollPayload;
}

type ChatPollPayload = ChatMessage['poll'];

interface ChatViewProps {
  mode: 'dm' | 'channel';
  dm?: DirectMessageThread;
  server?: Server;
  channelId?: string;
  currentUser: UserProfile;
  dms?: DirectMessageThread[];
  allServers?: Server[];
  typingLabel?: string | null;
  appPreferences?: AppPreferences;
  parentCollectionPath?: string;
  onBackMobile: () => void;
  onSendMessage: (
    text: string,
    replyTo?: { authorName: string; content: string },
    imageUrl?: string
  ) => void;
  onSendRichMessage?: (payload: RichMessagePayload) => void;
  onEditMessage?: (messageId: string, newContent: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  onTogglePinMessage?: (messageId: string) => void;
  onVotePoll?: (messageId: string, optionId: string) => void;
  onForwardMessage?: (
    msg: ChatMessage,
    target: { type: 'dm' | 'channel'; id: string; serverId?: string; label: string }
  ) => void;
  onToggleDmFavorite?: () => void;
  onToggleDmMute?: () => void;
  onToggleReaction: (messageId: string, emoji: string) => void;
  onStartCall: (video: boolean) => void;
  onJoinInviteServer?: (url: string) => void;
  onOpenNitro?: () => void;
  onOpenServerSettings?: (serverId: string, section?: ServerSettingsSection) => void;
  onUpdateNickname?: (serverId: string, nickname: string) => void;
  onClearLocalChat?: () => void;
  onInspectUser?: (
    userId: string,
    fallback?: Partial<PublicUserProfile>,
    roles?: ServerRole[]
  ) => void;
}

const QUICK_EMOJIS = ['🔥', '❤️', '😂', '👍', '🎉', '👀', '😎', '💀'];

const COMPOSER_EMOJIS = [
  '🔥',
  '❤️',
  '😂',
  '👍',
  '🎉',
  '👀',
  '😎',
  '💀',
  '🤖',
  '⚡',
  '💎',
  '🎮',
  '👑',
  '🥳',
  '🚀',
  '✨',
  '🙌',
  '🤝',
  '🎧',
  '💯',
  '❤️‍🔥',
  '😭',
  '🤣',
  '🤯',
  '🫡',
  '✅',
  '💬',
  '🔊',
  '🏆',
  '🌟',
  '🫠',
  '😈',
];

const BUILTIN_STICKERS: { id: string; name: string; emoji: string; bg: string }[] = [
  { id: 'stk-gg', name: 'GG WP', emoji: '🏆', bg: 'from-amber-500/30 to-yellow-600/20' },
  { id: 'stk-hype', name: 'Hype', emoji: '🔥', bg: 'from-orange-500/30 to-red-600/20' },
  { id: 'stk-hola', name: 'Wumpus Hola', emoji: '👋', bg: 'from-indigo-500/30 to-blue-600/20' },
  { id: 'stk-party', name: 'Fiesta', emoji: '🥳', bg: 'from-pink-500/30 to-purple-600/20' },
  { id: 'stk-lol', name: 'LMAO', emoji: '🤣', bg: 'from-emerald-500/30 to-teal-600/20' },
  { id: 'stk-love', name: 'Corazón', emoji: '💖', bg: 'from-rose-500/30 to-pink-600/20' },
];

const SAMPLE_CHAT_PHOTOS = [
  { label: 'Vice City', url: '/src/assets/images/banner_vice_city_1795280073889.jpg' },
  { label: 'Arrakis', url: '/src/assets/images/banner_dune_1795280073636.jpg' },
  { label: 'Miyabi', url: '/src/assets/images/shop_miyabi_art_1795281106262.jpg' },
  { label: 'Lofi', url: '/src/assets/images/shop_lofi_plants_1795281107687.jpg' },
];

const BUILTIN_GIFS: { id: string; name: string; emoji: string; imageUrl: string }[] = [
  { id: 'gif-vice', name: 'Vice City Vibes', emoji: '🌴', imageUrl: '/src/assets/images/banner_vice_city_1795280073889.jpg' },
  { id: 'gif-dune', name: 'Arrakis Storm', emoji: '🏜️', imageUrl: '/src/assets/images/banner_dune_1795280073636.jpg' },
  { id: 'gif-miyabi', name: 'Miyabi Slash', emoji: '❄️', imageUrl: '/src/assets/images/shop_miyabi_art_1795281106262.jpg' },
  { id: 'gif-lofi', name: 'Lofi Chill', emoji: '🎧', imageUrl: '/src/assets/images/shop_lofi_plants_1795281107687.jpg' },
];

const SLASH_COMMANDS: {
  cmd: string;
  desc: string;
  channelOnly?: boolean;
  badge: string;
}[] = [
  { cmd: '/everyone', desc: 'Menciona y envía notificación a todos los miembros', channelOnly: true, badge: 'Mención' },
  { cmd: '/shrug', desc: 'Envía ¯\\_(ツ)_/¯ al chat', badge: 'Texto' },
  { cmd: '/tableflip', desc: 'Envía (╯°□°)╯︵ ┻━┻ al chat', badge: 'Texto' },
  { cmd: '/poll', desc: 'Abre el creador rápido de encuestas interactivas', badge: 'Acción' },
  { cmd: '/nick', desc: 'Cambia tu apodo en este servidor (/nick NuevoApodo)', channelOnly: true, badge: 'Perfil' },
  { cmd: '/clear', desc: 'Limpia el borrador y cierra paneles abiertos', badge: 'Utilidad' },
];

async function compressImageForChat(file: File): Promise<string> {
  const rawUrl: string = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => (typeof reader.result === 'string' ? resolve(reader.result) : reject());
    reader.onerror = () => reject();
    reader.readAsDataURL(file);
  });

  if (rawUrl.length <= 180_000) return rawUrl;

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const maxDim = 960;
      const scale = Math.min(1, maxDim / Math.max(img.width || 1, img.height || 1));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(rawUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      let compressed = canvas.toDataURL('image/jpeg', 0.78);
      if (compressed.length > 180_000) {
        compressed = canvas.toDataURL('image/jpeg', 0.56);
      }
      resolve(compressed);
    };
    img.onerror = () => resolve(rawUrl);
    img.src = rawUrl;
  });
}

function getDateBucket(timestamp: string): string {
  const lower = timestamp.toLowerCase();
  if (lower.startsWith('ayer')) return 'Ayer';
  if (lower.startsWith('hoy') || lower === 'ahora') return 'Hoy';
  return 'Historial';
}

function getShortTime(timestamp: string): string {
  const match = timestamp.match(/(\d{1,2}:\d{2})/);
  return match ? match[1] : timestamp;
}

function formatDuration(sec: number): string {
  const mins = Math.floor(sec / 60);
  const rem = sec % 60;
  return `${mins}:${rem.toString().padStart(2, '0')}`;
}

export const ChatView: React.FC<ChatViewProps> = ({
  mode,
  dm,
  server,
  channelId,
  currentUser,
  dms = [],
  allServers = [],
  typingLabel,
  appPreferences,
  parentCollectionPath,
  onBackMobile,
  onSendMessage,
  onSendRichMessage,
  onEditMessage,
  onDeleteMessage,
  onTogglePinMessage,
  onVotePoll,
  onForwardMessage,
  onToggleDmFavorite,
  onToggleDmMute,
  onToggleReaction,
  onStartCall,
  onJoinInviteServer,
  onOpenNitro,
  onOpenServerSettings,
  onUpdateNickname,
  onClearLocalChat,
  onInspectUser,
}) => {
  const [input, setInput] = useState('');
  const [pendingPhotoUrl, setPendingPhotoUrl] = useState<string | null>(null);
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<{
    messageId?: string;
    authorName: string;
    content: string;
  } | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [pickerTab, setPickerTab] = useState<'emojis' | 'stickers' | 'gifs'>('emojis');
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [reactingMessageId, setReactingMessageId] = useState<string | null>(null);
  const [menuMessageId, setMenuMessageId] = useState<string | null>(null);
  const [confirmDeleteMsgId, setConfirmDeleteMsgId] = useState<string | null>(null);
  const [tappedGroupedMsgId, setTappedGroupedMsgId] = useState<string | null>(null);
  const [activeThreadMsg, setActiveThreadMsg] = useState<ChatMessage | null>(null);
  const [threadReplies, setThreadReplies] = useState<ThreadMessage[]>([]);
  const [threadDraft, setThreadDraft] = useState('');
  const [localThreads, setLocalThreads] = useState<Record<string, ThreadMessage[]>>({});
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [showPinnedDrawer, setShowPinnedDrawer] = useState(false);
  const [forwardingMessage, setForwardingMessage] = useState<ChatMessage | null>(null);
  const [showPollModal, setShowPollModal] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [audioProgress, setAudioProgress] = useState<Record<string, number>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);
  const msgPressTimerRef = useRef<number | null>(null);
  const msgPressStartRef = useRef<{ x: number; y: number } | null>(null);

  const {
    isOwner = false,
    canManageServer = false,
    canManageChannels = false,
    canKickMembers = false,
    canManageRoles = false,
    canPinMessages = false,
  } = mode === 'channel'
    ? getServerPermissions(server, currentUser.id)
    : {
        isOwner: false,
        canManageServer: false,
        canManageChannels: false,
        canKickMembers: false,
        canManageRoles: false,
        canPinMessages: false,
      };
  const canManage = Boolean(isOwner || canManageServer);
  const canPin = Boolean(mode === 'dm' || canPinMessages || canManageServer);
  const fontSizeClass =
    appPreferences?.chatFontSize === 'small'
      ? 'text-[13.5px]'
      : appPreferences?.chatFontSize === 'large'
        ? 'text-[16px]'
        : 'text-[15px]';
  const compactChat = Boolean(appPreferences?.compactMode);

  const getMemberRoles = (memberId: string): ServerRole[] => {
    if (!server?.roles) return [];
    const memberObj = server.members?.find((m) => m.uid === memberId);
    const ids = server.memberRoleIds?.[memberId] || memberObj?.roleIds || [];
    return server.roles.filter((r) => ids.includes(r.id) && r.id !== 'role-everyone');
  };

  const activeChannel =
    mode === 'channel' && server
      ? server.channels.find((c) => c.id === channelId) || server.channels[0]
      : undefined;

  const messages: ChatMessage[] =
    mode === 'dm' && dm ? dm.messages : activeChannel ? activeChannel.messages : [];

  const title = mode === 'dm' && dm ? dm.name : activeChannel ? activeChannel.name : 'general';

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, dm?.id, activeChannel?.id]);

  // Subscribe to active thread replies when a thread drawer is open
  useEffect(() => {
    if (!activeThreadMsg) {
      setThreadReplies([]);
      return;
    }
    if (!parentCollectionPath) {
      setThreadReplies(localThreads[activeThreadMsg.id] || []);
      return;
    }
    const parentMsgPath = `${parentCollectionPath}/${activeThreadMsg.id}`;
    const unsub = subscribeToMessageThreads(parentMsgPath, (replies) => {
      setThreadReplies(replies);
    });
    return () => unsub();
  }, [activeThreadMsg?.id, parentCollectionPath, localThreads]);

  // Voice recording timer
  useEffect(() => {
    if (!isRecordingVoice) return;
    const t = setInterval(() => {
      setRecordSeconds((s) => (s >= 60 ? 60 : s + 1));
    }, 1000);
    return () => clearInterval(t);
  }, [isRecordingVoice]);

  // Simulated voice note playback timer
  useEffect(() => {
    if (!playingAudioId) return;
    const targetMsg = messages.find((m) => m.id === playingAudioId);
    const total = targetMsg?.audioNote?.durationSec || 5;
    const t = setInterval(() => {
      setAudioProgress((prev) => {
        const cur = prev[playingAudioId] ?? 0;
        if (cur + 1 >= total) {
          setPlayingAudioId(null);
          return { ...prev, [playingAudioId]: 0 };
        }
        return { ...prev, [playingAudioId]: cur + 1 };
      });
    }, 1000);
    return () => clearInterval(t);
  }, [playingAudioId, messages]);

  const sendRich = (payload: RichMessagePayload) => {
    if (onSendRichMessage) {
      onSendRichMessage(payload);
    } else {
      onSendMessage(payload.content, payload.replyTo, payload.imageUrl);
    }
  };

  const executeSlashOrSend = (rawText: string): boolean => {
    const trimmed = rawText.trim();
    if (!trimmed) return false;

    if (/^\/poll$/i.test(trimmed)) {
      setInput('');
      setShowPollModal(true);
      return true;
    }
    if (/^\/clear$/i.test(trimmed)) {
      setInput('');
      setShowEmojiPicker(false);
      setShowAttachmentMenu(false);
      setReplyingTo(null);
      onClearLocalChat?.();
      return true;
    }
    if (/^\/nick\s+(.+)/i.test(trimmed) && mode === 'channel' && server) {
      const nextNick = trimmed.replace(/^\/nick\s+/i, '').trim().slice(0, 32);
      if (nextNick) {
        onUpdateNickname?.(server.id, nextNick);
      }
      setInput('');
      return true;
    }

    const expanded = trimmed
      .replace(/^\/shrug$/i, '¯\\_(ツ)_/¯')
      .replace(/^\/tableflip$/i, '(╯°□°)╯︵ ┻━┻');

    const mentionEveryone =
      mode === 'channel' && /(^|\s)[@/]everyone(\s|$|[.,!?:;])/i.test(expanded);
    sendRich({
      content: expanded,
      mentionEveryone,
      replyTo: replyingTo || undefined,
      imageUrl: pendingPhotoUrl || undefined,
    });
    setInput('');
    setPendingPhotoUrl(null);
    setReplyingTo(null);
    setShowEmojiPicker(false);
    setShowAttachmentMenu(false);
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed && !pendingPhotoUrl) return;
    if (trimmed) {
      executeSlashOrSend(trimmed);
      return;
    }
    sendRich({
      content: '',
      replyTo: replyingTo || undefined,
      imageUrl: pendingPhotoUrl || undefined,
    });
    setPendingPhotoUrl(null);
    setReplyingTo(null);
    setShowEmojiPicker(false);
    setShowAttachmentMenu(false);
  };

  const handlePhotoFile = async (file: File) => {
    try {
      const compressed = await compressImageForChat(file);
      setPendingPhotoUrl(compressed);
      setShowAttachmentMenu(false);
    } catch {
      // Ignore invalid image files
    }
  };

  const handleSendThreadReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeThreadMsg) return;
    const clean = threadDraft.trim();
    if (!clean) return;
    setThreadDraft('');
    const nextCount = Math.max(activeThreadMsg.threadCount || 0, threadReplies.length) + 1;
    if (parentCollectionPath) {
      await sendThreadReply({
        parentMessagePath: `${parentCollectionPath}/${activeThreadMsg.id}`,
        currentUser,
        content: clean,
        nextThreadCount: nextCount,
      });
    } else {
      const localItem: ThreadMessage = {
        id: `thr-${Date.now()}`,
        authorId: currentUser.id,
        authorName: currentUser.displayName,
        authorAvatar: currentUser.avatar,
        authorTag: currentUser.serverTag,
        timestamp: 'Ahora',
        createdAtMs: Date.now(),
        content: clean,
      };
      setLocalThreads((prev) => ({
        ...prev,
        [activeThreadMsg.id]: [...(prev[activeThreadMsg.id] || []), localItem],
      }));
    }
  };

  const handleFinishVoiceRecording = () => {
    const dur = Math.max(2, recordSeconds);
    const waveform = Array.from({ length: 22 }, (_, idx) =>
      Math.round(25 + ((idx * 19 + dur * 13) % 70))
    );
    setIsRecordingVoice(false);
    setRecordSeconds(0);
    sendRich({
      content: '',
      replyTo: replyingTo || undefined,
      audioNote: { durationSec: dur, waveform },
    });
    setReplyingTo(null);
  };

  const handleCreatePoll = (e: React.FormEvent) => {
    e.preventDefault();
    const q = pollQuestion.trim();
    const cleanOpts = pollOptions.map((o) => o.trim()).filter(Boolean);
    if (!q || cleanOpts.length < 2) return;
    sendRich({
      content: '',
      poll: {
        question: q,
        options: cleanOpts.map((text, idx) => ({
          id: `opt-${Date.now()}-${idx}`,
          text,
          votes: [],
        })),
      },
    });
    setPollQuestion('');
    setPollOptions(['', '']);
    setShowPollModal(false);
  };

  const getHighestRole = (authorId: string): ServerRole | undefined => {
    if (mode !== 'channel' || !server) return undefined;
    const memberObj = server.members?.find((m) => m.uid === authorId);
    const roleIds = server.memberRoleIds?.[authorId] || memberObj?.roleIds || [];
    return (server.roles || []).find((r) => roleIds.includes(r.id) && r.id !== 'role-everyone');
  };

  const chatBgStyle: React.CSSProperties = (() => {
    if (mode !== 'channel' || !server) return {};
    switch (server.chatTheme) {
      case 'crimson':
        return { background: 'radial-gradient(circle at top right, #23060a 0%, #050203 70%)' };
      case 'emerald':
        return { background: 'radial-gradient(circle at top right, #041d11 0%, #020805 70%)' };
      case 'midnight':
        return { background: 'radial-gradient(circle at top right, #07142b 0%, #02050b 70%)' };
      case 'cyber':
        return { background: 'radial-gradient(circle at top right, #071c24 0%, #07030b 75%)' };
      case 'onyx':
        return { backgroundColor: '#090a0d' };
      case 'custom-photo':
        return server.chatWallpaperUrl
          ? {
              backgroundImage: `linear-gradient(rgba(0,0,0,0.72), rgba(0,0,0,0.82)), url(${server.chatWallpaperUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }
          : { backgroundColor: '#111214' };
      default:
        return { backgroundColor: '#111214' };
    }
  })();

  const chatStyleMode = mode === 'channel' && server ? server.chatMessageStyle || 'classic' : 'classic';
  const accentColor = mode === 'channel' && server?.chatAccentColor ? server.chatAccentColor : '#5865f2';

  // Mention & /everyone & emoji autocomplete candidates (real users only)
  const mentionCandidates = useMemo(() => {
    const base: { id: string; name: string; avatar: AvatarKey; isBot: boolean; isEveryone?: boolean }[] = [];
    if (mode === 'channel') {
      base.push({
        id: 'everyone',
        name: 'everyone',
        avatar: currentUser.avatar,
        isBot: false,
        isEveryone: true,
      });
      for (const m of server?.members || []) {
        if (!base.some((b) => b.id === m.uid)) {
          base.push({ id: m.uid, name: m.displayName, avatar: m.avatar, isBot: false });
        }
      }
    }
    if (!base.some((b) => b.id === currentUser.id)) {
      base.push({
        id: currentUser.id,
        name: currentUser.displayName,
        avatar: currentUser.avatar,
        isBot: false,
      });
    }
    for (const d of dms) {
      if (!d.isGroup && !d.isBot && !base.some((b) => b.name.toLowerCase() === d.name.toLowerCase())) {
        base.push({ id: d.otherUid || d.id, name: d.name, avatar: d.avatar, isBot: false });
      }
    }
    return base;
  }, [mode, server?.members, dms, currentUser.id, currentUser.displayName, currentUser.avatar]);

  const mentionMatch = input.match(/(?:^|\s)@([^\s@]{0,20})$/);
  const filteredMentions = useMemo(() => {
    if (!mentionMatch) return [];
    const q = mentionMatch[1].toLowerCase();
    return mentionCandidates
      .filter((m) => m.name.toLowerCase().includes(q))
      .slice(0, 6);
  }, [mentionMatch, mentionCandidates]);

  const channelMatch =
    mode === 'channel' && !mentionMatch ? input.match(/(?:^|\s)#([^\s#]{0,24})$/) : null;
  const filteredChannelRefs = useMemo(() => {
    if (!channelMatch || !server?.channels) return [];
    const q = channelMatch[1].toLowerCase();
    return server.channels
      .filter((c) => c.name.toLowerCase().includes(q))
      .slice(0, 6);
  }, [channelMatch, server?.channels]);

  const slashMatch =
    !mentionMatch && !channelMatch ? input.match(/^\/([a-zA-Z0-9_-]{0,16})$/) : null;
  const filteredSlashCommands = useMemo(() => {
    if (!slashMatch) return [];
    const q = slashMatch[1].toLowerCase();
    return SLASH_COMMANDS.filter(
      (c) => (!c.channelOnly || mode === 'channel') && c.cmd.slice(1).includes(q)
    );
  }, [slashMatch, mode]);

  const emojiMatch = !mentionMatch && !channelMatch ? input.match(/(?:^|\s):([a-zA-Z0-9_]{1,20})$/) : null;
  const filteredCustomEmojis = useMemo(() => {
    if (!emojiMatch || !server?.customEmojis?.length) return [];
    const q = emojiMatch[1].toLowerCase();
    return server.customEmojis.filter((e) => e.name.toLowerCase().includes(q)).slice(0, 6);
  }, [emojiMatch, server?.customEmojis]);

  // Safe React inline parser (links, /everyone, mentions, custom emojis, markdown bold/italic/strike/code)
  const renderInlineSegment = (text: string, keyPrefix: string): React.ReactNode[] => {
    const tokenRegex =
      /(https?:\/\/[^\s<]+|`[^`]+`|\*\*[^*]+\*\*|~~[^~]+~~|\*[^*]+\*|:[a-zA-Z0-9_]+:|\/everyone\b|@[A-Za-z0-9_.\-\/\\]+)/g;
    const nodes: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let idx = 0;

    while ((match = tokenRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        nodes.push(text.slice(lastIndex, match.index));
      }
      const token = match[0];
      const key = `${keyPrefix}-${idx++}`;

      if (token.startsWith('http://') || token.startsWith('https://')) {
        nodes.push(
          <a
            key={key}
            href={token}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-400 hover:underline break-all"
          >
            {token}
          </a>
        );
      } else if (token.startsWith('`') && token.endsWith('`') && token.length >= 2) {
        nodes.push(
          <code
            key={key}
            className="px-1.5 py-0.5 rounded-md bg-white/[0.08] border border-white/10 font-mono text-[12.5px] text-emerald-300"
          >
            {token.slice(1, -1)}
          </code>
        );
      } else if (token.startsWith('**') && token.endsWith('**') && token.length >= 4) {
        nodes.push(
          <strong key={key} className="font-bold text-white">
            {token.slice(2, -2)}
          </strong>
        );
      } else if (token.startsWith('~~') && token.endsWith('~~') && token.length >= 4) {
        nodes.push(
          <del key={key} className="line-through text-[var(--dc-text-muted)]">
            {token.slice(2, -2)}
          </del>
        );
      } else if (token.startsWith('*') && token.endsWith('*') && token.length >= 2) {
        nodes.push(
          <em key={key} className="italic">
            {token.slice(1, -1)}
          </em>
        );
      } else if (token.startsWith(':') && token.endsWith(':')) {
        const name = token.slice(1, -1);
        const found = server?.customEmojis?.find((em) => em.name === name);
        if (found) {
          nodes.push(
            found.imageUrl ? (
              <img
                key={key}
                src={found.imageUrl}
                alt={token}
                title={token}
                className="inline-block w-6 h-6 rounded-md object-cover align-middle mx-0.5 border border-white/10"
              />
            ) : (
              <span key={key} title={token} className="inline-block text-lg align-middle mx-0.5">
                {found.symbol || '😎'}
              </span>
            )
          );
        } else {
          nodes.push(token);
        }
      } else if (token.toLowerCase() === '/everyone' || token.toLowerCase() === '@everyone') {
        nodes.push(
          <span
            key={key}
            className="inline-block px-1.5 py-0 rounded bg-amber-500/25 border border-amber-400/35 text-amber-200 font-bold"
          >
            {token}
          </span>
        );
      } else if (token.startsWith('@')) {
        const handle = token.slice(1);
        const target = mentionCandidates.find(
          (m) => m.name.toLowerCase() === handle.toLowerCase()
        );
        nodes.push(
          <button
            key={key}
            type="button"
            onClick={() => {
              if (target && !target.isEveryone) {
                onInspectUser?.(target.id, {
                  displayName: target.name,
                  avatar: target.avatar,
                  isBot: target.isBot,
                });
              }
            }}
            className="inline-block px-1 py-0 rounded bg-[#5865F2]/25 hover:bg-[#5865F2]/40 text-[#b4bcff] font-semibold cursor-pointer transition-colors"
          >
            {token}
          </button>
        );
      } else {
        nodes.push(token);
      }

      lastIndex = match.index + token.length;
    }

    if (lastIndex < text.length) {
      nodes.push(text.slice(lastIndex));
    }
    return nodes;
  };

  const visibleMessages = searchTerm.trim()
    ? messages.filter(
        (m) =>
          m.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.authorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.poll?.question.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : messages;

  const pinnedMessages = messages.filter((m) => m.pinned);

  const scrollToMessage = (id: string) => {
    const el = document.getElementById(`chat-msg-${id}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setShowPinnedDrawer(false);
  };

  return (
    <div
      onTouchStart={(e) => {
        const t = e.touches[0];
        if (!t) return;
        swipeStartRef.current = { x: t.clientX, y: t.clientY };
      }}
      onTouchEnd={(e) => {
        const start = swipeStartRef.current;
        const t = e.changedTouches[0];
        swipeStartRef.current = null;
        if (!start || !t) return;
        const dx = t.clientX - start.x;
        const dy = Math.abs(t.clientY - start.y);
        if (start.x < 70 && dx > 85 && dy < 48) {
          onBackMobile();
        }
      }}
      className="flex-1 flex h-full bg-[#111214] min-w-0 overflow-hidden relative"
      style={chatBgStyle}
    >
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handlePhotoFile(f);
          e.target.value = '';
        }}
      />

      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Top Chat Header */}
        <header className="h-14 px-3 md:px-4 border-b border-[var(--dc-border)] flex items-center justify-between gap-2 shrink-0 bg-black/50 backdrop-blur-md">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={onBackMobile}
              aria-label="Volver"
              className="md:hidden w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center text-[var(--dc-text-secondary)] shrink-0 cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            {mode === 'dm' && dm ? (
              <button
                type="button"
                onClick={() =>
                  onInspectUser?.(dm.otherUid || dm.id, {
                    displayName: dm.name,
                    username: dm.username || dm.name.toLowerCase().replace(/\s+/g, ''),
                    avatar: dm.avatar,
                    status: dm.status,
                    decoration: dm.decoration,
                    nameplate: dm.nameplate,
                    serverTag: dm.serverTag,
                    isBot: dm.isBot,
                  })
                }
                className="flex items-center gap-2.5 min-w-0 text-left rounded-xl px-1.5 py-1 -ml-1.5 hover:bg-white/[0.06] transition-colors cursor-pointer"
              >
                {dm.isGroup && dm.customIconUrl ? (
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-white/15 shrink-0">
                    <img src={dm.customIconUrl} alt={dm.name} className="w-full h-full object-cover" />
                  </div>
                ) : dm.isGroup && dm.groupEmoji ? (
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm border border-white/15 shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${dm.groupColor || '#5865F2'} 0%, #11121a 100%)`,
                    }}
                  >
                    <span>{dm.groupEmoji}</span>
                  </div>
                ) : (
                  <UserAvatar
                    avatar={dm.avatar}
                    status={dm.status}
                    decoration={dm.decoration || 'none'}
                    size="sm"
                    borderColor="var(--dc-bg-chat)"
                  />
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h2 className="font-display font-bold text-[15px] text-[var(--dc-text-primary)] truncate">
                      {dm.name}
                    </h2>
                    {dm.serverTag && (
                      <span className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-semibold text-[var(--dc-text-secondary)] shrink-0">
                        {dm.serverTag}
                      </span>
                    )}
                    {dm.isBot && (
                      <span className="px-1 py-[1px] rounded bg-[var(--dc-blurple)] text-[9.5px] font-bold text-white uppercase">
                        APP
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[var(--dc-text-muted)] truncate leading-none mt-0.5">
                    {typingLabel
                      ? typingLabel
                      : dm.isGroup
                      ? 'Grupo directo · Toca para ver info'
                      : `${dm.username || dm.name} · Toca para ver perfil`}
                  </p>
                </div>
              </button>
            ) : (
              <div className="flex items-center gap-2 min-w-0">
                {activeChannel?.type === 'announcement' ? (
                  <Megaphone className="w-5 h-5 text-[var(--dc-text-muted)] shrink-0" />
                ) : (
                  <Hash className="w-5 h-5 text-[var(--dc-text-muted)] shrink-0" />
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <h2 className="font-display font-bold text-[15px] text-[var(--dc-text-primary)] truncate">
                      {title}
                    </h2>
                    {server && (
                      <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#23a55a]/15 text-[#3dd67d] text-[10.5px] font-bold tabular-nums shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#23a55a]" />
                        {server.onlineCount.toLocaleString('es-ES')} en línea
                      </span>
                    )}
                  </div>
                  {activeChannel?.topic && (
                    <p className="hidden sm:block text-[11px] text-[var(--dc-text-muted)] truncate">
                      {activeChannel.topic}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => onStartCall(false)}
              title="Iniciar llamada de voz"
              className="w-9 h-9 rounded-full dc-btn-icon flex items-center justify-center cursor-pointer"
            >
              <PhoneCall className="w-[17px] h-[17px]" />
            </button>
            <button
              onClick={() => onStartCall(true)}
              title="Iniciar videollamada"
              className="w-9 h-9 rounded-full dc-btn-icon flex items-center justify-center cursor-pointer"
            >
              <Video className="w-[18px] h-[18px]" />
            </button>
            <button
              onClick={() => setShowPinnedDrawer((p) => !p)}
              title="Mensajes fijados"
              className={`relative w-9 h-9 rounded-full flex items-center justify-center cursor-pointer ${
                showPinnedDrawer ? 'dc-btn-primary' : 'dc-btn-icon'
              }`}
            >
              <Pin className="w-[16px] h-[16px]" />
              {pinnedMessages.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-[#5865F2] text-white text-[10px] font-bold tabular-nums flex items-center justify-center">
                  {pinnedMessages.length}
                </span>
              )}
            </button>
            {mode === 'dm' && dm && (
              <>
                <button
                  onClick={onToggleDmFavorite}
                  title={dm.favorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
                  className={`hidden sm:flex w-9 h-9 rounded-full items-center justify-center cursor-pointer ${
                    dm.favorite ? 'text-amber-400 bg-amber-400/10' : 'dc-btn-icon'
                  }`}
                >
                  <Star className={`w-[16px] h-[16px] ${dm.favorite ? 'fill-amber-400' : ''}`} />
                </button>
                <button
                  onClick={onToggleDmMute}
                  title={dm.muted ? 'Activar notificaciones' : 'Silenciar conversación'}
                  className={`hidden sm:flex w-9 h-9 rounded-full items-center justify-center cursor-pointer ${
                    dm.muted ? 'text-red-400 bg-red-500/10' : 'dc-btn-icon'
                  }`}
                >
                  {dm.muted ? (
                    <BellOff className="w-[16px] h-[16px]" />
                  ) : (
                    <Bell className="w-[16px] h-[16px]" />
                  )}
                </button>
              </>
            )}
            <button
              onClick={() => setShowSearch((s) => !s)}
              title="Buscar en el chat"
              className={`w-9 h-9 rounded-full flex items-center justify-center cursor-pointer ${
                showSearch ? 'dc-btn-primary' : 'dc-btn-icon'
              }`}
            >
              <Search className="w-[17px] h-[17px]" />
            </button>
            {mode === 'channel' && server && onOpenServerSettings && (
              <>
                {canManage && (
                  <button
                    onClick={() => onOpenServerSettings(server.id, 'vista-general')}
                    title="Diseños de chat del servidor"
                    className="hidden sm:flex w-9 h-9 rounded-full dc-btn-icon items-center justify-center cursor-pointer"
                  >
                    <Palette className="w-[17px] h-[17px]" />
                  </button>
                )}
                <button
                  onClick={() => onOpenServerSettings(server.id, 'menu')}
                  title={canManage ? 'Ajustes del servidor' : 'Información y miembros'}
                  className="hidden sm:flex w-9 h-9 rounded-full dc-btn-icon items-center justify-center cursor-pointer"
                >
                  <Settings className="w-[17px] h-[17px]" />
                </button>
              </>
            )}
            {mode === 'channel' && (
              <button
                onClick={() => setShowMembers((m) => !m)}
                title="Mostrar lista de miembros"
                className={`w-9 h-9 rounded-full flex items-center justify-center cursor-pointer ${
                  showMembers ? 'dc-btn-primary' : 'dc-btn-icon'
                }`}
              >
                <Users className="w-[17px] h-[17px]" />
              </button>
            )}
          </div>
        </header>

        {/* Search Subbar */}
        {showSearch && (
          <div className="px-4 py-2 bg-[var(--dc-bg-sidebar)] border-b border-[var(--dc-border)] flex items-center gap-2">
            <Search className="w-4 h-4 text-[var(--dc-text-muted)]" />
            <input
              type="text"
              autoFocus
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar mensajes, autores o encuestas..."
              className="flex-1 bg-transparent text-sm text-[var(--dc-text-primary)] placeholder:text-[var(--dc-text-muted)] focus:outline-none"
            />
            {searchTerm && (
              <span className="text-[11px] text-[var(--dc-text-muted)] tabular-nums">
                {visibleMessages.length} resultados
              </span>
            )}
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="text-xs text-[var(--dc-text-muted)] hover:text-white cursor-pointer"
              >
                Limpiar
              </button>
            )}
          </div>
        )}

        {/* Pinned Messages Drawer */}
        {showPinnedDrawer && (
          <div className="px-4 py-3 bg-[#111217] border-b border-white/10 max-h-60 overflow-y-auto space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-300">
                <Pin className="w-3.5 h-3.5 text-[#7b85ff]" />
                <span>Mensajes fijados ({pinnedMessages.length})</span>
              </div>
              <button
                onClick={() => setShowPinnedDrawer(false)}
                className="p-1 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {pinnedMessages.length === 0 ? (
              <p className="text-xs text-zinc-400 py-2">
                Aún no hay mensajes fijados en este chat. Usa el menú de un mensaje para fijarlo.
              </p>
            ) : (
              pinnedMessages.map((pm) => (
                <div
                  key={pm.id}
                  className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 flex items-start justify-between gap-2"
                >
                  <button
                    type="button"
                    onClick={() => scrollToMessage(pm.id)}
                    className="flex-1 min-w-0 text-left cursor-pointer"
                  >
                    <p className="text-xs font-bold text-white">
                      {pm.authorName}{' '}
                      <span className="text-[10px] font-normal text-zinc-400">{pm.timestamp}</span>
                    </p>
                    <p className="text-xs text-zinc-300 line-clamp-2 mt-0.5">
                      {pm.content || (pm.poll ? `Encuesta: ${pm.poll.question}` : 'Archivo adjunto')}
                    </p>
                  </button>
                  {(canPin || pm.authorId === currentUser.id || pm.authorId === 'me') && (
                    <button
                      type="button"
                      onClick={() => onTogglePinMessage?.(pm.id)}
                      title="Desfijar"
                      className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white cursor-pointer shrink-0"
                    >
                      <PinOff className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto px-3 md:px-4 py-4">
          {/* Welcome banner */}
          <div className="pb-4 mb-3 border-b border-[var(--dc-border)]">
            {mode === 'dm' && dm ? (
              <div className="space-y-2">
                <UserAvatar
                  avatar={dm.avatar}
                  status={dm.status}
                  decoration={dm.decoration || 'none'}
                  size="xl"
                  borderColor="var(--dc-bg-chat)"
                />
                <h3 className="font-display font-bold text-2xl text-[var(--dc-text-primary)]">
                  {dm.name}
                </h3>
                <p className="text-sm text-[var(--dc-text-muted)]">
                  Este es el comienzo de tu historial de mensajes directos con{' '}
                  <strong className="text-[var(--dc-text-secondary)]">{dm.name}</strong>.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-14 h-14 rounded-full bg-[var(--dc-bg-elevated)] flex items-center justify-center">
                  <Hash className="w-8 h-8 text-[var(--dc-text-primary)]" />
                </div>
                <h3 className="font-display font-bold text-2xl text-[var(--dc-text-primary)]">
                  ¡Te damos la bienvenida a #{title}!
                </h3>
                <p className="text-sm text-[var(--dc-text-muted)]">
                  Aquí empieza el canal #{title} de {server?.name}.
                </p>
              </div>
            )}
          </div>

          <div className="space-y-1">
            {visibleMessages.map((msg, idx) => {
              const prevMsg = idx > 0 ? visibleMessages[idx - 1] : null;
              const dateBucket = getDateBucket(msg.timestamp);
              const prevDateBucket = prevMsg ? getDateBucket(prevMsg.timestamp) : null;
              const showDateDivider = idx === 0 || dateBucket !== prevDateBucket;

              const withinFiveMinutes =
                prevMsg?.createdAtMs && msg.createdAtMs
                  ? Math.abs(msg.createdAtMs - prevMsg.createdAtMs) < 300_000
                  : true;

              const isGrouped =
                !showDateDivider &&
                chatStyleMode !== 'bubbles' &&
                !compactChat &&
                prevMsg !== null &&
                prevMsg.authorId === msg.authorId &&
                withinFiveMinutes &&
                !msg.replyTo &&
                !msg.forwardedFrom &&
                !msg.embed &&
                !msg.poll &&
                !msg.sticker;

              const isMe = msg.authorId === currentUser.id || msg.authorId === 'me';
              const displayAvatar = isMe ? currentUser.avatar : msg.authorAvatar;
              const displayDeco = isMe
                ? currentUser.decoration
                : mode === 'dm' && (dm?.otherUid === msg.authorId || dm?.id === msg.authorId)
                  ? dm.decoration || 'none'
                  : 'none';
              const authorRole = getHighestRole(msg.authorId);
              const isEditing = editingMessageId === msg.id;
              const isPlayingThis = playingAudioId === msg.id;
              const currentAudioPos = audioProgress[msg.id] ?? 0;
              const showTappedTime = tappedGroupedMsgId === msg.id;

              return (
                <React.Fragment key={msg.id}>
                  {showDateDivider && (
                    <div className="flex items-center gap-3 my-3">
                      <div className="h-px flex-1 bg-[#2e3035]" />
                      <span className="text-[11px] font-bold text-[#949ba4] px-2">
                        {dateBucket}
                      </span>
                      <div className="h-px flex-1 bg-[#2e3035]" />
                    </div>
                  )}

                  <div
                    id={`chat-msg-${msg.id}`}
                    onPointerDown={(e) => {
                      if (e.button === 2) return;
                      msgPressStartRef.current = { x: e.clientX, y: e.clientY };
                      if (msgPressTimerRef.current) window.clearTimeout(msgPressTimerRef.current);
                      msgPressTimerRef.current = window.setTimeout(() => {
                        setMenuMessageId(msg.id);
                        setReactingMessageId(null);
                      }, 460);
                    }}
                    onPointerMove={(e) => {
                      const s = msgPressStartRef.current;
                      if (!s || !msgPressTimerRef.current) return;
                      if (Math.abs(e.clientX - s.x) > 10 || Math.abs(e.clientY - s.y) > 10) {
                        window.clearTimeout(msgPressTimerRef.current);
                        msgPressTimerRef.current = null;
                      }
                    }}
                    onPointerUp={() => {
                      if (msgPressTimerRef.current) {
                        window.clearTimeout(msgPressTimerRef.current);
                        msgPressTimerRef.current = null;
                      }
                    }}
                    onPointerCancel={() => {
                      if (msgPressTimerRef.current) {
                        window.clearTimeout(msgPressTimerRef.current);
                        msgPressTimerRef.current = null;
                      }
                    }}
                    onClick={() => {
                      if (isGrouped) {
                        setTappedGroupedMsgId((cur) => (cur === msg.id ? null : msg.id));
                      }
                    }}
                    className={`group relative flex items-start gap-3 transition-colors select-text ${
                      isGrouped ? (compactChat ? 'mt-0' : 'mt-0.5') : compactChat ? 'mt-2' : 'mt-3'
                    } ${
                      msg.mentionEveryone
                        ? 'bg-amber-500/[0.08] border-l-2 border-amber-400 pl-2 rounded-r-xl'
                        : msg.pinned
                          ? 'bg-amber-500/[0.04] rounded-xl'
                          : ''
                    } ${
                      chatStyleMode === 'bubbles'
                        ? 'p-3 rounded-2xl bg-[#26272f] border border-[#2e3035]'
                        : chatStyleMode === 'compact' || compactChat
                        ? 'py-0.5 px-2 -mx-2 rounded-lg hover:bg-white/[0.03]'
                        : 'py-1 px-2 -mx-2 rounded-xl hover:bg-white/[0.03]'
                    }`}
                    style={
                      chatStyleMode === 'bubbles' && isMe
                        ? { borderColor: `${accentColor}55`, backgroundColor: `${accentColor}14` }
                        : undefined
                    }
                  >
                    {/* Left gutter: Avatar or subtle timestamp for grouped messages */}
                    {isGrouped ? (
                      <div className="w-10 shrink-0 flex items-center justify-end pr-1 pt-1">
                        <span
                          className={`${
                            showTappedTime ? 'opacity-100 text-[#b5bac1]' : 'opacity-0 group-hover:opacity-100 text-[var(--dc-text-muted)]'
                          } text-[10px] tabular-nums select-none transition-opacity`}
                        >
                          {getShortTime(msg.timestamp)}
                        </span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          onInspectUser?.(
                            msg.authorId,
                            {
                              displayName: msg.authorName,
                              avatar: msg.authorAvatar,
                              serverTag: msg.authorTag,
                              isBot: msg.authorIsBot,
                            },
                            getMemberRoles(msg.authorId)
                          )
                        }
                        className="mt-0.5 shrink-0 text-left cursor-pointer hover:opacity-90 active:scale-95 transition-transform"
                      >
                        <UserAvatar
                          avatar={displayAvatar}
                          customAvatarUrl={isMe ? currentUser.customAvatarUrl : undefined}
                          decoration={displayDeco}
                          size={chatStyleMode === 'compact' || compactChat ? 'sm' : 'md'}
                          showStatus={false}
                        />
                      </button>
                    )}

                    <div className="flex-1 min-w-0">
                      {/* Discord Curved Reply Connector */}
                      {msg.replyTo && (
                        <div className="flex items-end gap-1.5 mb-1 -ml-8 pl-2">
                          <span className="w-6 h-3 border-t-2 border-l-2 border-[#4e5058] rounded-tl-xl shrink-0 mb-0.5" />
                          <div className="inline-flex items-center gap-1.5 text-xs text-[#b5bac1] max-w-full min-w-0">
                            <Reply className="w-3 h-3 shrink-0 text-[#5865F2]" />
                            <span className="font-semibold text-[#f2f3f5] shrink-0">
                              @{msg.replyTo.authorName}
                            </span>
                            <span className="truncate text-[#949ba4]">
                              {msg.replyTo.content || 'Archivo adjunto'}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Forwarded Header */}
                      {msg.forwardedFrom && (
                        <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 mb-1 italic">
                          <Forward className="w-3 h-3 shrink-0" />
                          <span>
                            Reenviado de <strong>{msg.forwardedFrom.authorName}</strong> (
                            {msg.forwardedFrom.originLabel})
                          </span>
                        </div>
                      )}

                      {/* Author Line */}
                      {!isGrouped && (
                        <div className="flex items-baseline gap-2 flex-wrap">
                          {(() => {
                              const myNamePres = isMe
                                ? getDisplayNameTextPresentation({
                                    style: currentUser.displayNameStyle,
                                    colorPreset: currentUser.displayNameColorPreset,
                                    customColors: currentUser.displayNameCustomColors,
                                    glow: currentUser.displayNameGlow,
                                    nitroUnlocked: currentUser.nitroTier !== 'none',
                                    fallbackColor: authorRole?.color || 'var(--dc-text-primary)',
                                  })
                                : null;
                              const useMyGradient =
                                isMe &&
                                currentUser.nitroTier !== 'none' &&
                                currentUser.displayNameColorPreset &&
                                currentUser.displayNameColorPreset !== 'none';

                              return (
                                <span
                                  onClick={() =>
                                    onInspectUser?.(
                                      msg.authorId,
                                      {
                                        displayName: msg.authorName,
                                        avatar: msg.authorAvatar,
                                        serverTag: msg.authorTag,
                                        isBot: msg.authorIsBot,
                                      },
                                      getMemberRoles(msg.authorId)
                                    )
                                  }
                                  className={`text-[15px] cursor-pointer hover:underline ${
                                    myNamePres ? myNamePres.className : 'font-semibold'
                                  }`}
                                  style={
                                    useMyGradient && myNamePres
                                      ? myNamePres.style
                                      : authorRole?.gradientColors
                                      ? {
                                          backgroundImage: `linear-gradient(90deg, ${authorRole.gradientColors[0]}, ${authorRole.gradientColors[1]})`,
                                          WebkitBackgroundClip: 'text',
                                          color: 'transparent',
                                        }
                                      : { color: authorRole?.color || 'var(--dc-text-primary)' }
                                  }
                                >
                                  {isMe
                                    ? (mode === 'channel' && server
                                        ? currentUser.perServerProfiles?.[server.id]?.nickname
                                        : undefined) || currentUser.displayName
                                    : msg.authorName}
                                </span>
                              );
                            })()}
                          {authorRole && (
                            <span
                              className="px-1.5 py-[1px] rounded-md text-[10px] font-bold bg-white/[0.07] border border-white/10"
                              style={{ color: authorRole.color }}
                            >
                              {authorRole.name}
                            </span>
                          )}
                          {(isMe ? currentUser.serverTag : msg.authorTag) && (
                            <span className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-semibold text-[var(--dc-text-secondary)]">
                              {isMe ? currentUser.serverTag : msg.authorTag}
                            </span>
                          )}
                          {msg.authorIsBot && (
                            <span className="px-1 py-[1px] rounded bg-[var(--dc-blurple)] text-[9.5px] font-bold text-white uppercase">
                              APP
                            </span>
                          )}
                          <span className="text-[11px] text-[var(--dc-text-muted)] tabular-nums">
                            {msg.timestamp}
                          </span>
                          {msg.pinned && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-amber-300">
                              <Pin className="w-2.5 h-2.5" /> Fijado
                            </span>
                          )}
                        </div>
                      )}

                      {/* Content or Inline Editor */}
                      {isEditing ? (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            const trimmed = editDraft.trim();
                            if (trimmed && onEditMessage) {
                              onEditMessage(msg.id, trimmed);
                            }
                            setEditingMessageId(null);
                          }}
                          className="mt-1 space-y-1.5"
                        >
                          <input
                            type="text"
                            autoFocus
                            value={editDraft}
                            onChange={(e) => setEditDraft(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Escape') setEditingMessageId(null);
                            }}
                            className="w-full bg-[var(--dc-bg-input)] border border-[#5865F2] rounded-xl px-3 py-1.5 text-sm text-white focus:outline-none"
                          />
                          <div className="flex items-center gap-2 text-[11px]">
                            <button
                              type="button"
                              onClick={() => setEditingMessageId(null)}
                              className="text-zinc-400 hover:text-white cursor-pointer"
                            >
                              Cancelar (Esc)
                            </button>
                            <button
                              type="submit"
                              className="text-[#7b85ff] font-bold hover:underline cursor-pointer"
                            >
                              Guardar cambios (Enter)
                            </button>
                          </div>
                        </form>
                      ) : (
                        msg.content && (
                          <p className={`${fontSizeClass} leading-relaxed text-[var(--dc-text-primary)]/95 whitespace-pre-wrap break-words mt-0.5`}>
                            {renderInlineSegment(msg.content, msg.id)}
                            {msg.edited && (
                              <span className="text-[10.5px] text-[var(--dc-text-muted)] ml-1.5">
                                (editado)
                              </span>
                            )}
                          </p>
                        )
                      )}

                      {/* Sticker */}
                      {msg.sticker && (
                        <div className="mt-2 inline-flex flex-col items-center gap-1 p-3 rounded-2xl bg-white/[0.04] border border-white/10">
                          {msg.sticker.imageUrl ? (
                            <img
                              src={msg.sticker.imageUrl}
                              alt={msg.sticker.name}
                              className="w-24 h-24 rounded-xl object-cover"
                            />
                          ) : (
                            <span className="text-5xl leading-none">{msg.sticker.emoji}</span>
                          )}
                          <span className="text-[10.5px] font-semibold text-[var(--dc-text-muted)]">
                            {msg.sticker.name}
                          </span>
                        </div>
                      )}

                      {/* Audio / Voice Note */}
                      {msg.audioNote && (
                        <div className="mt-2 max-w-xs rounded-2xl bg-[#13141b] border border-white/10 px-3 py-2.5 flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setPlayingAudioId(isPlayingThis ? null : msg.id)}
                            className="w-9 h-9 rounded-full bg-[#5865F2] hover:bg-[#4752c4] text-white flex items-center justify-center shrink-0 cursor-pointer"
                          >
                            {isPlayingThis ? (
                              <Pause className="w-4 h-4" />
                            ) : (
                              <Play className="w-4 h-4 ml-0.5" />
                            )}
                          </button>
                          <div className="flex-1 flex items-center gap-0.5 h-7">
                            {msg.audioNote.waveform.map((h, i) => {
                              const dur = Math.max(1, msg.audioNote?.durationSec ?? 1);
                              const len = Math.max(1, msg.audioNote?.waveform.length ?? 1);
                              const pct = (currentAudioPos / dur) * len;
                              const activeBar = isPlayingThis ? i <= pct : false;
                              return (
                                <span
                                  key={i}
                                  className={`flex-1 rounded-full transition-colors ${
                                    activeBar ? 'bg-[#7b85ff]' : 'bg-white/25'
                                  }`}
                                  style={{ height: `${Math.max(20, h)}%` }}
                                />
                              );
                            })}
                          </div>
                          <span className="text-[11px] font-mono text-zinc-300 tabular-nums shrink-0">
                            {isPlayingThis
                              ? formatDuration(currentAudioPos)
                              : formatDuration(msg.audioNote.durationSec)}
                          </span>
                        </div>
                      )}

                      {/* Interactive Poll */}
                      {msg.poll && (
                        <div className="mt-2 max-w-sm rounded-2xl bg-[var(--dc-bg-card)] border border-[var(--dc-border)] p-3.5 space-y-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-[10.5px] font-bold uppercase tracking-wider text-[#7b85ff] flex items-center gap-1">
                                <BarChart2 className="w-3.5 h-3.5" /> Encuesta
                              </p>
                              <p className="font-display font-bold text-sm text-white mt-0.5">
                                {msg.poll.question}
                              </p>
                            </div>
                          </div>
                          {(() => {
                            const totalVotes = msg.poll.options.reduce(
                              (acc, o) => acc + o.votes.length,
                              0
                            );
                            return (
                              <div className="space-y-1.5">
                                {msg.poll.options.map((opt) => {
                                  const voted = opt.votes.includes(currentUser.id) || opt.votes.includes('me');
                                  const pct =
                                    totalVotes > 0
                                      ? Math.round((opt.votes.length / totalVotes) * 100)
                                      : 0;
                                  return (
                                    <button
                                      key={opt.id}
                                      type="button"
                                      onClick={() => onVotePoll?.(msg.id, opt.id)}
                                      className={`w-full relative overflow-hidden rounded-xl border px-3 py-2 text-left transition-colors cursor-pointer ${
                                        voted
                                          ? 'border-[#5865F2] bg-[#5865F2]/15'
                                          : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'
                                      }`}
                                    >
                                      <div
                                        className="absolute inset-y-0 left-0 bg-[#5865F2]/25 transition-all"
                                        style={{ width: `${pct}%` }}
                                      />
                                      <div className="relative z-10 flex items-center justify-between gap-2 text-xs">
                                        <span className="font-semibold text-white flex items-center gap-1.5 truncate">
                                          {voted && <Check className="w-3.5 h-3.5 text-[#7b85ff] shrink-0" />}
                                          <span className="truncate">{opt.text}</span>
                                        </span>
                                        <span className="text-zinc-300 font-bold tabular-nums shrink-0">
                                          {pct}% ({opt.votes.length})
                                        </span>
                                      </div>
                                    </button>
                                  );
                                })}
                                <p className="text-[11px] text-zinc-400 tabular-nums pt-0.5">
                                  {totalVotes} {totalVotes === 1 ? 'voto' : 'votos'} · Toca una opción para votar
                                </p>
                              </div>
                            );
                          })()}
                        </div>
                      )}

                      {/* Photo */}
                      {msg.imageUrl && (
                        <button
                          type="button"
                          onClick={() => setLightboxPhoto(msg.imageUrl!)}
                          className="mt-2 block max-w-xs sm:max-w-sm rounded-2xl overflow-hidden border border-white/10 shadow-lg cursor-pointer hover:brightness-105 transition-all"
                        >
                          <img
                            src={msg.imageUrl}
                            alt="Imagen compartida"
                            className="w-full max-h-72 object-cover"
                          />
                        </button>
                      )}

                      {msg.attachmentLabel && (
                        <div className="mt-2 inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--dc-bg-card)] border border-[var(--dc-border)] text-xs text-[var(--dc-text-secondary)]">
                          <ImagePlus className="w-4 h-4 text-[var(--dc-blurple)]" />
                          <span>{msg.attachmentLabel}</span>
                        </div>
                      )}

                      {/* Discord Invite / Embed */}
                      {msg.embed && (
                        <div className="mt-2 max-w-sm rounded-2xl bg-[var(--dc-bg-card)] border border-[var(--dc-border)] p-3.5">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--dc-text-muted)]">
                            {msg.embed.title}
                          </p>
                          <div className="flex items-center justify-between gap-3 mt-2">
                            <div className="min-w-0">
                              <p className="font-display font-bold text-[15px] text-[var(--dc-text-primary)] truncate">
                                {msg.embed.serverName}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-[var(--dc-text-muted)] mt-0.5 tabular-nums">
                                <span className="inline-flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full bg-[#23a55a]" />
                                  {msg.embed.onlineCount} en línea
                                </span>
                                <span>·</span>
                                <span>{msg.embed.memberCount} miembros</span>
                              </div>
                            </div>
                            <button
                              onClick={() => onJoinInviteServer?.(msg.embed?.url || '')}
                              className="px-4 py-2 rounded-xl dc-btn-success text-xs font-bold shrink-0 cursor-pointer whitespace-nowrap"
                            >
                              Unirse
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Thread Counter Pill */}
                      {((msg.threadCount ?? 0) > 0 || (localThreads[msg.id]?.length ?? 0) > 0) && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveThreadMsg(msg);
                          }}
                          className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#26272f] hover:bg-[#2e3035] border border-[#2e3035] text-xs font-semibold text-[#9aa4ff] cursor-pointer"
                        >
                          <span>💬</span>
                          <span>
                            {Math.max(msg.threadCount ?? 0, localThreads[msg.id]?.length ?? 0)}{' '}
                            {Math.max(msg.threadCount ?? 0, localThreads[msg.id]?.length ?? 0) === 1
                              ? 'respuesta en hilo'
                              : 'respuestas en hilo'}
                          </span>
                        </button>
                      )}

                      {/* Reactions */}
                      {msg.reactions.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                          {msg.reactions.map((r) => (
                            <button
                              key={r.emoji}
                              onClick={() => onToggleReaction(msg.id, r.emoji)}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium tabular-nums transition-colors cursor-pointer ${
                                r.reacted
                                  ? 'bg-[var(--dc-blurple)]/25 border border-[var(--dc-blurple)] text-white'
                                  : 'bg-[var(--dc-bg-card)] border border-white/5 text-[var(--dc-text-secondary)] hover:bg-white/10'
                              }`}
                            >
                              <span>{r.emoji}</span>
                              <span>{r.count}</span>
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() =>
                              setReactingMessageId(reactingMessageId === msg.id ? null : msg.id)
                            }
                            title="Añadir reacción"
                            className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-[var(--dc-bg-card)] border border-white/5 text-[var(--dc-text-muted)] hover:text-white hover:bg-white/10 cursor-pointer"
                          >
                            <Smile className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Message Actions Bar (desktop hover + mobile quick trigger) */}
                    <div className="opacity-100 md:opacity-0 md:group-hover:opacity-100 focus-within:opacity-100 absolute -top-3 right-2 bg-[var(--dc-bg-card)] border border-[var(--dc-border)] rounded-xl shadow-lg flex items-center p-0.5 transition-opacity z-10">
                      <button
                        type="button"
                        onClick={() => {
                          setReactingMessageId(reactingMessageId === msg.id ? null : msg.id);
                          setMenuMessageId(null);
                        }}
                        title="Añadir reacción"
                        className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--dc-text-secondary)] hover:text-white cursor-pointer"
                      >
                        <Smile className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setReplyingTo({
                            messageId: msg.id,
                            authorName: isMe ? currentUser.displayName : msg.authorName,
                            content:
                              msg.content ||
                              (msg.poll
                                ? msg.poll.question
                                : msg.audioNote
                                ? 'Nota de voz'
                                : 'Archivo'),
                          });
                          inputRef.current?.focus();
                        }}
                        title="Responder"
                        className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--dc-text-secondary)] hover:text-white cursor-pointer"
                      >
                        <Reply className="w-4 h-4" />
                      </button>
                      {isMe && !msg.audioNote && !msg.poll && !msg.sticker && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingMessageId(msg.id);
                            setEditDraft(msg.content);
                            setMenuMessageId(null);
                          }}
                          title="Editar mensaje"
                          className="hidden sm:flex p-1.5 rounded-lg hover:bg-white/10 text-[var(--dc-text-secondary)] hover:text-white cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setMenuMessageId(menuMessageId === msg.id ? null : msg.id);
                          setReactingMessageId(null);
                        }}
                        title="Más opciones"
                        className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--dc-text-secondary)] hover:text-white cursor-pointer"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Quick Emoji Bar (full emoji picker trigger included) */}
                    {reactingMessageId === msg.id && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute top-6 right-2 z-20 bg-[#26272f] border border-[#2e3035] rounded-2xl p-2 shadow-xl flex flex-wrap items-center gap-1 max-w-[260px]"
                      >
                        {QUICK_EMOJIS.map((em) => (
                          <button
                            key={em}
                            onClick={() => {
                              onToggleReaction(msg.id, em);
                              setReactingMessageId(null);
                            }}
                            className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-base cursor-pointer"
                          >
                            {em}
                          </button>
                        ))}
                        {COMPOSER_EMOJIS.slice(8, 16).map((em) => (
                          <button
                            key={em}
                            onClick={() => {
                              onToggleReaction(msg.id, em);
                              setReactingMessageId(null);
                            }}
                            className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-base cursor-pointer"
                          >
                            {em}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </React.Fragment>
              );
            })}
          </div>

          <div ref={bottomRef} />
        </div>

        {/* Typing Indicator */}
        {typingLabel && (
          <div className="px-4 pb-1 flex items-center gap-2 text-xs text-zinc-400">
            <span className="inline-flex items-center gap-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 animate-bounce" />
              <span
                className="w-1.5 h-1.5 rounded-full bg-zinc-300 animate-bounce"
                style={{ animationDelay: '120ms' }}
              />
              <span
                className="w-1.5 h-1.5 rounded-full bg-zinc-300 animate-bounce"
                style={{ animationDelay: '240ms' }}
              />
            </span>
            <span className="font-medium text-zinc-300">{typingLabel}</span>
          </div>
        )}

        {/* Mention Autocomplete Popover */}
        {filteredMentions.length > 0 && (
          <div className="mx-3 mb-1.5 rounded-2xl bg-[#111217] border border-white/15 p-1.5 shadow-2xl space-y-0.5">
            {filteredMentions.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setInput((prev) =>
                    prev.replace(/(^|\s)@([^\s@]{0,20})$/, `$1@${m.name} `)
                  );
                  inputRef.current?.focus();
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-left cursor-pointer"
              >
                {m.isEveryone ? (
                  <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center shrink-0">
                    <Megaphone className="w-3.5 h-3.5 text-amber-300" />
                  </div>
                ) : (
                  <UserAvatar avatar={m.avatar} size="xs" showStatus={false} />
                )}
                <span className="text-xs font-bold text-white">
                  {m.isEveryone ? '@everyone' : m.name}
                </span>
                {m.isEveryone && (
                  <span className="text-[10.5px] text-amber-200/80 ml-auto">
                    Notificar a todos
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* # Channel Autocomplete Popover */}
        {filteredChannelRefs.length > 0 && (
          <div className="mx-3 mb-1.5 rounded-2xl bg-[#1c1d22] border border-[#2e3035] p-1.5 shadow-2xl space-y-0.5">
            {filteredChannelRefs.map((ch) => (
              <button
                key={ch.id}
                type="button"
                onClick={() => {
                  setInput((prev) =>
                    prev.replace(/(^|\s)#([^\s#]{0,24})$/, `$1#${ch.name} `)
                  );
                  inputRef.current?.focus();
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-[#26272f] text-left cursor-pointer"
              >
                <Hash className="w-4 h-4 text-[#949ba4] shrink-0" />
                <span className="text-xs font-bold text-[#f2f3f5]">{ch.name}</span>
                {ch.category && (
                  <span className="text-[10.5px] text-[#949ba4] ml-auto truncate">{ch.category}</span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* / Slash Commands Autocomplete Popover */}
        {filteredSlashCommands.length > 0 && (
          <div className="mx-3 mb-1.5 rounded-2xl bg-[#1c1d22] border border-[#2e3035] p-1.5 shadow-2xl space-y-0.5">
            {filteredSlashCommands.map((cmdItem) => (
              <button
                key={cmdItem.cmd}
                type="button"
                onClick={() => {
                  if (cmdItem.cmd === '/poll' || cmdItem.cmd === '/clear') {
                    executeSlashOrSend(cmdItem.cmd);
                    return;
                  }
                  setInput(`${cmdItem.cmd} `);
                  inputRef.current?.focus();
                }}
                className="w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl hover:bg-[#26272f] text-left cursor-pointer"
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#f2f3f5]">{cmdItem.cmd}</p>
                  <p className="text-[11px] text-[#949ba4] truncate">{cmdItem.desc}</p>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-[#5865F2]/20 text-[10px] font-bold text-[#9aa4ff] shrink-0">
                  {cmdItem.badge}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Custom Emoji Autocomplete Popover */}
        {filteredCustomEmojis.length > 0 && (
          <div className="mx-3 mb-1.5 rounded-2xl bg-[#111217] border border-white/15 p-1.5 shadow-2xl space-y-0.5">
            {filteredCustomEmojis.map((em) => (
              <button
                key={em.id}
                type="button"
                onClick={() => {
                  setInput((prev) =>
                    prev.replace(/(^|\s):([a-zA-Z0-9_]{1,20})$/, `$1:${em.name}: `)
                  );
                  inputRef.current?.focus();
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-left cursor-pointer"
              >
                {em.imageUrl ? (
                  <img src={em.imageUrl} alt={em.name} className="w-5 h-5 rounded object-cover" />
                ) : (
                  <span>{em.symbol || '😎'}</span>
                )}
                <span className="text-xs font-semibold text-white">:{em.name}:</span>
              </button>
            ))}
          </div>
        )}

        {/* Replying Banner */}
        {replyingTo && (
          <div className="mx-3 mb-1 px-3 py-1.5 rounded-t-xl bg-[var(--dc-bg-card)] border border-b-0 border-[var(--dc-border)] flex items-center justify-between text-xs text-[var(--dc-text-secondary)]">
            <span className="truncate">
              Respondiendo a <strong className="text-white">{replyingTo.authorName}</strong>
            </span>
            <button
              onClick={() => setReplyingTo(null)}
              className="p-1 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Pending Photo Preview */}
        {pendingPhotoUrl && (
          <div className="mx-3 mb-2 p-2.5 rounded-2xl bg-[#111216] border border-white/15 flex items-center gap-3">
            <img
              src={pendingPhotoUrl}
              alt="Vista previa"
              className="w-16 h-16 rounded-xl object-cover border border-white/10 shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white">Foto lista para enviar</p>
              <p className="text-[11px] text-zinc-400">Añade un comentario o pulsa enviar</p>
            </div>
            <button
              type="button"
              onClick={() => setPendingPhotoUrl(null)}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Plus Attachment / Poll / Photo / GIFs Menu */}
        {showAttachmentMenu && (
          <div className="mx-3 mb-2 p-3 rounded-2xl bg-[#1c1d22] border border-[#2e3035] space-y-3">
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-[#26272f] hover:bg-[#2e3035] border border-[#2e3035] text-xs font-semibold text-white cursor-pointer"
              >
                <ImagePlus className="w-4.5 h-4.5 text-[#5865F2]" />
                <span>Foto</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAttachmentMenu(false);
                  setShowPollModal(true);
                }}
                className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-[#26272f] hover:bg-[#2e3035] border border-[#2e3035] text-xs font-semibold text-white cursor-pointer"
              >
                <BarChart2 className="w-4.5 h-4.5 text-[#23a55a]" />
                <span>Encuesta</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAttachmentMenu(false);
                  setShowEmojiPicker(true);
                  setPickerTab('gifs');
                }}
                className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-[#26272f] hover:bg-[#2e3035] border border-[#2e3035] text-xs font-semibold text-white cursor-pointer"
              >
                <span className="text-xs font-black px-1.5 py-0.5 rounded bg-[#5865F2] text-white">GIF</span>
                <span>GIFs</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAttachmentMenu(false);
                  setShowEmojiPicker(true);
                  setPickerTab('stickers');
                }}
                className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-[#26272f] hover:bg-[#2e3035] border border-[#2e3035] text-xs font-semibold text-white cursor-pointer"
              >
                <Sticker className="w-4.5 h-4.5 text-[#f0b232]" />
                <span>Stickers</span>
              </button>
            </div>
            <div>
              <p className="text-[10.5px] font-bold uppercase tracking-wider text-[#949ba4] mb-1.5">
                Imágenes rápidas
              </p>
              <div className="grid grid-cols-4 gap-2">
                {SAMPLE_CHAT_PHOTOS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => {
                      setPendingPhotoUrl(p.url);
                      setShowAttachmentMenu(false);
                    }}
                    className="h-14 rounded-xl overflow-hidden border border-[#2e3035] hover:border-[#5865F2] cursor-pointer relative"
                  >
                    <img src={p.url} alt={p.label} className="w-full h-full object-cover" />
                    <span className="absolute inset-x-0 bottom-0 bg-black/70 text-[9px] font-bold text-white py-0.5 text-center">
                      {p.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Emoji + Stickers + GIFs Drawer */}
        {showEmojiPicker && (
          <div className="mx-3 mb-2 p-3 rounded-2xl bg-[#1c1d22] border border-[#2e3035] space-y-2.5">
            <div className="flex items-center gap-1.5 border-b border-[#2e3035] pb-2">
              <button
                type="button"
                onClick={() => setPickerTab('emojis')}
                className={`px-3 py-1 rounded-full text-xs font-bold cursor-pointer ${
                  pickerTab === 'emojis'
                    ? 'bg-[#5865F2] text-white'
                    : 'text-[#949ba4] hover:text-white'
                }`}
              >
                Emojis
              </button>
              <button
                type="button"
                onClick={() => setPickerTab('stickers')}
                className={`px-3 py-1 rounded-full text-xs font-bold cursor-pointer ${
                  pickerTab === 'stickers'
                    ? 'bg-[#5865F2] text-white'
                    : 'text-[#949ba4] hover:text-white'
                }`}
              >
                Stickers
              </button>
              <button
                type="button"
                onClick={() => setPickerTab('gifs')}
                className={`px-3 py-1 rounded-full text-xs font-bold cursor-pointer ${
                  pickerTab === 'gifs'
                    ? 'bg-[#5865F2] text-white'
                    : 'text-[#949ba4] hover:text-white'
                }`}
              >
                GIFs
              </button>
            </div>

            {pickerTab === 'emojis' ? (
              <div className="space-y-2">
                {mode === 'channel' && server?.customEmojis && server.customEmojis.length > 0 && (
                  <div>
                    <p className="text-[10.5px] font-bold uppercase tracking-wider text-[#949ba4] px-1 mb-1">
                      Emojis de {server.name}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {server.customEmojis.map((em) => (
                        <button
                          key={em.id}
                          type="button"
                          title={`:${em.name}:`}
                          onClick={() => setInput((prev) => `${prev}:${em.name}: `)}
                          className="w-9 h-9 rounded-xl bg-[#26272f] border border-[#2e3035] hover:border-[#5865F2] overflow-hidden flex items-center justify-center cursor-pointer"
                        >
                          {em.imageUrl ? (
                            <img src={em.imageUrl} alt={em.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-lg">{em.symbol || '😎'}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex flex-wrap gap-1.5">
                  {COMPOSER_EMOJIS.map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setInput((prev) => prev + em)}
                      className="w-9 h-9 rounded-xl hover:bg-white/10 text-lg flex items-center justify-center cursor-pointer"
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>
            ) : pickerTab === 'gifs' ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {BUILTIN_GIFS.map((gif) => (
                  <button
                    key={gif.id}
                    type="button"
                    onClick={() => {
                      sendRich({
                        content: '',
                        imageUrl: gif.imageUrl,
                      });
                      setShowEmojiPicker(false);
                    }}
                    className="relative h-20 rounded-xl overflow-hidden border border-[#2e3035] hover:border-[#5865F2] cursor-pointer group"
                  >
                    <img src={gif.imageUrl} alt={gif.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/75 text-[9px] font-black text-white">
                      GIF
                    </span>
                    <span className="absolute inset-x-0 bottom-0 bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white truncate">
                      {gif.emoji} {gif.name}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {(server?.stickers || []).map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => {
                      sendRich({
                        content: '',
                        sticker: { name: st.name, emoji: st.emoji, imageUrl: st.imageUrl },
                      });
                      setShowEmojiPicker(false);
                    }}
                    className="p-2 rounded-xl bg-[#26272f] hover:bg-[#2e3035] border border-[#2e3035] flex flex-col items-center gap-1 cursor-pointer"
                  >
                    {st.imageUrl ? (
                      <img src={st.imageUrl} alt={st.name} className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <span className="text-2xl">{st.emoji}</span>
                    )}
                    <span className="text-[10px] font-semibold text-zinc-300 truncate w-full text-center">
                      {st.name}
                    </span>
                  </button>
                ))}
                {BUILTIN_STICKERS.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => {
                      sendRich({
                        content: '',
                        sticker: { name: st.name, emoji: st.emoji },
                      });
                      setShowEmojiPicker(false);
                    }}
                    className={`p-2 rounded-xl bg-gradient-to-br ${st.bg} border border-white/10 hover:border-[#5865F2] flex flex-col items-center gap-1 cursor-pointer`}
                  >
                    <span className="text-2xl">{st.emoji}</span>
                    <span className="text-[10px] font-bold text-white truncate w-full text-center">
                      {st.name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Message Composer */}
        <form onSubmit={handleSubmit} className="px-3 pb-3 pt-1 shrink-0">
          {isRecordingVoice ? (
            <div className="flex items-center justify-between gap-3 bg-[#1b1115] border border-red-500/40 rounded-full px-4 py-2">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span className="text-xs font-bold text-white">Grabando nota de voz</span>
                <span className="text-xs font-mono text-red-300 tabular-nums">
                  {formatDuration(recordSeconds)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsRecordingVoice(false);
                    setRecordSeconds(0);
                  }}
                  className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-semibold text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleFinishVoiceRecording}
                  className="px-3.5 py-1.5 rounded-full bg-[#5865F2] hover:bg-[#4752c4] text-xs font-bold text-white inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Square className="w-3 h-3 fill-white" />
                  <span>Enviar audio</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-[var(--dc-bg-input)] rounded-full px-2 py-1.5 border border-[var(--dc-border)] shadow-inner">
              <button
                type="button"
                onClick={() => {
                  setShowAttachmentMenu((v) => !v);
                  setShowEmojiPicker(false);
                }}
                title="Adjuntar foto, encuesta o sticker"
                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 cursor-pointer ${
                  showAttachmentMenu ? 'dc-btn-primary' : 'dc-btn-icon'
                }`}
              >
                <Plus className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                title="Enviar foto"
                className="hidden sm:flex w-9 h-9 rounded-full dc-btn-icon items-center justify-center shrink-0 cursor-pointer"
              >
                <ImagePlus className="w-4.5 h-4.5" />
              </button>

              <button
                type="button"
                onClick={onOpenNitro}
                title="Regalar Nitro"
                className="hidden sm:flex w-9 h-9 rounded-full dc-btn-icon items-center justify-center shrink-0 cursor-pointer"
              >
                <Gift className="w-4.5 h-4.5" />
              </button>

              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  mode === 'dm' && dm ? `Enviar mensaje a ${dm.name}` : `Enviar mensaje a #${title}`
                }
                className="flex-1 bg-transparent text-[14.5px] text-[var(--dc-text-primary)] placeholder:text-[var(--dc-text-muted)] focus:outline-none min-w-0 px-1"
              />

              <button
                type="button"
                onClick={() => {
                  setShowEmojiPicker((v) => !v);
                  setShowAttachmentMenu(false);
                }}
                aria-label="Selector de emojis y stickers"
                className="w-9 h-9 rounded-full dc-btn-icon flex items-center justify-center shrink-0 cursor-pointer"
              >
                <Smile className="w-4.5 h-4.5" />
              </button>

              {!input.trim() && !pendingPhotoUrl ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsRecordingVoice(true);
                    setRecordSeconds(0);
                    setShowEmojiPicker(false);
                    setShowAttachmentMenu(false);
                  }}
                  title="Grabar nota de voz"
                  aria-label="Grabar nota de voz"
                  className="w-9 h-9 rounded-full dc-btn-icon flex items-center justify-center shrink-0 cursor-pointer"
                >
                  <Mic className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  aria-label="Enviar mensaje"
                  className="w-9 h-9 rounded-full dc-btn-primary flex items-center justify-center shrink-0 cursor-pointer"
                >
                  <SendHorizontal className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </form>
      </div>

      {/* Right Member List Drawer Grouped by Hoisted Roles */}
      {mode === 'channel' && showMembers && server && (() => {
        const rawMembers =
          server.members && server.members.length > 0
            ? server.members
            : [
                {
                  uid: currentUser.id,
                  displayName:
                    currentUser.perServerProfiles?.[server.id]?.nickname || currentUser.displayName,
                  username: currentUser.username,
                  avatar: currentUser.avatar,
                  customAvatarUrl: currentUser.customAvatarUrl,
                  status: currentUser.status,
                  roleIds: server.memberRoleIds?.[currentUser.id] || [],
                  isAdmin: canManage,
                },
              ];

        const hoistedRoles = (server.roles || []).filter(
          (r) => r.hoist && r.id !== 'role-everyone'
        );
        const assignedUids = new Set<string>();
        const groups: { key: string; title: string; color?: string; members: typeof rawMembers }[] = [];

        for (const role of hoistedRoles) {
          const matched = rawMembers.filter((m) => {
            if (assignedUids.has(m.uid)) return false;
            const roleIds = server.memberRoleIds?.[m.uid] || m.roleIds || [];
            return roleIds.includes(role.id);
          });
          if (matched.length > 0) {
            matched.forEach((m) => assignedUids.add(m.uid));
            groups.push({ key: role.id, title: role.name, color: role.color, members: matched });
          }
        }

        const remainingOnline = rawMembers.filter(
          (m) => !assignedUids.has(m.uid) && m.status !== 'offline'
        );
        if (remainingOnline.length > 0) {
          groups.push({ key: 'online', title: 'En línea', members: remainingOnline });
        }

        const remainingOffline = rawMembers.filter(
          (m) => !assignedUids.has(m.uid) && m.status === 'offline'
        );
        if (remainingOffline.length > 0) {
          groups.push({ key: 'offline', title: 'Desconectado', members: remainingOffline });
        }

        return (
          <>
            <div
              onClick={() => setShowMembers(false)}
              className="fixed inset-0 z-30 bg-black/50 lg:hidden"
            />
            <aside className="fixed inset-y-0 right-0 z-40 lg:static lg:z-auto w-64 lg:w-60 shrink-0 bg-[#1c1d22] border-l border-[#2e3035] p-3 overflow-y-auto shadow-2xl lg:shadow-none space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#949ba4] tabular-nums">
                  Miembros — {rawMembers.length}
                </p>
                <button
                  type="button"
                  onClick={() => setShowMembers(false)}
                  aria-label="Cerrar miembros"
                  className="lg:hidden p-1 text-[#949ba4] hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {groups.map((grp) => (
                <div key={grp.key} className="space-y-1">
                  <p
                    className="text-[11px] font-bold uppercase tracking-wider px-1 tabular-nums"
                    style={{ color: grp.color || '#949ba4' }}
                  >
                    {grp.title} — {grp.members.length}
                  </p>
                  {grp.members.map((member) => {
                    const isSelf = member.uid === currentUser.id;
                    const displayName = isSelf
                      ? currentUser.perServerProfiles?.[server.id]?.nickname || currentUser.displayName
                      : member.displayName;
                    const role = getHighestRole(member.uid);
                    const isSelfRow = isSelf && currentUser.nameplate && currentUser.nameplate !== 'none';
                    const isSrvOwner = member.uid === server.ownerId;
                    const isSrvAdmin =
                      member.isAdmin || isSrvOwner || (server.adminIds || []).includes(member.uid);

                    return (
                      <div
                        key={member.uid}
                        onClick={() =>
                          onInspectUser?.(
                            member.uid,
                            {
                              displayName,
                              username: member.username,
                              avatar: member.avatar,
                              customAvatarUrl: member.customAvatarUrl,
                              status: member.status,
                              serverTag: isSelf ? currentUser.serverTag : undefined,
                            },
                            getMemberRoles(member.uid)
                          )
                        }
                        className={`flex items-center gap-2.5 p-1.5 rounded-xl relative overflow-hidden cursor-pointer ${
                          isSelfRow ? 'bg-[#26272f] border border-[#2e3035]' : 'hover:bg-white/5'
                        }`}
                      >
                        {isSelfRow && <NameplateStripBackground nameplate={currentUser.nameplate} />}
                        <div className="relative z-10">
                          <UserAvatar
                            avatar={isSelf ? currentUser.avatar : member.avatar}
                            customAvatarUrl={isSelf ? currentUser.customAvatarUrl : member.customAvatarUrl}
                            decoration={isSelf ? currentUser.decoration : 'none'}
                            status={isSelf ? currentUser.status : member.status}
                            size="sm"
                            borderColor="#1c1d22"
                          />
                        </div>
                        <div className="min-w-0 flex-1 z-10">
                          <div className="flex items-center gap-1">
                            <span
                              className="text-sm font-medium truncate"
                              style={{ color: role?.color || '#f2f3f5' }}
                            >
                              {displayName}
                            </span>
                            {isSrvOwner ? (
                              <span title="Dueño del servidor">
                                <Crown className="w-3.5 h-3.5 text-[#f0b232] shrink-0" />
                              </span>
                            ) : isSrvAdmin ? (
                              <span title="Administrador">
                                <ShieldCheck className="w-3.5 h-3.5 text-[#5865F2] shrink-0" />
                              </span>
                            ) : null}
                            {isSelf && (currentUser.boostsGiven > 0 || (server.boostCount ?? 0) > 0) && (
                              <span title="Usuario que mejora este servidor">
                                <BoostGemIcon className="w-3.5 h-3.5 shrink-0" />
                              </span>
                            )}
                          </div>
                          {role ? (
                            <p className="text-[10px] font-semibold truncate" style={{ color: role.color }}>
                              {role.name}
                            </p>
                          ) : (
                            <p className="text-[10px] text-[#949ba4] truncate">
                              @{member.username}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </aside>
          </>
        );
      })()}

      {/* Poll Creator Modal */}
      {showPollModal && (
        <div
          onClick={() => setShowPollModal(false)}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <form
            onSubmit={handleCreatePoll}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-3xl bg-[#111217] border border-white/15 p-5 space-y-3.5 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-base text-white flex items-center gap-2">
                <BarChart2 className="w-4.5 h-4.5 text-[#7b85ff]" />
                <span>Crear encuesta</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowPollModal(false)}
                className="p-1 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                Pregunta
              </label>
              <input
                type="text"
                autoFocus
                value={pollQuestion}
                onChange={(e) => setPollQuestion(e.target.value)}
                placeholder="¿Qué jugamos esta noche?"
                className="w-full bg-[#070709] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#5865F2]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
                Opciones
              </label>
              {pollOptions.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) =>
                      setPollOptions((prev) => prev.map((v, i) => (i === idx ? e.target.value : v)))
                    }
                    placeholder={`Opción ${idx + 1}`}
                    className="flex-1 bg-[#070709] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#5865F2]"
                  />
                  {pollOptions.length > 2 && (
                    <button
                      type="button"
                      onClick={() =>
                        setPollOptions((prev) => prev.filter((_, i) => i !== idx))
                      }
                      className="p-1.5 text-zinc-400 hover:text-red-400 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
              {pollOptions.length < 4 && (
                <button
                  type="button"
                  onClick={() => setPollOptions((prev) => [...prev, ''])}
                  className="text-xs font-semibold text-[#7b85ff] hover:underline cursor-pointer"
                >
                  + Añadir opción
                </button>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowPollModal(false)}
                className="px-4 py-2 rounded-full dc-btn-secondary text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!pollQuestion.trim() || pollOptions.filter((o) => o.trim()).length < 2}
                className="px-5 py-2 rounded-full dc-btn-primary text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                Publicar encuesta
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Forward Message Modal */}
      {forwardingMessage && (
        <div
          onClick={() => setForwardingMessage(null)}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-3xl bg-[#111217] border border-white/15 p-5 space-y-3 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-base text-white flex items-center gap-2">
                <Forward className="w-4.5 h-4.5 text-[#7b85ff]" />
                <span>Reenviar mensaje</span>
              </h3>
              <button
                type="button"
                onClick={() => setForwardingMessage(null)}
                className="p-1 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
            <p className="text-xs text-zinc-400 bg-white/[0.04] rounded-xl p-2.5 line-clamp-2">
              "{forwardingMessage.content || forwardingMessage.poll?.question || 'Contenido multimedia'}"
            </p>
            <div className="max-h-60 overflow-y-auto space-y-1">
              {dms.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => {
                    onForwardMessage?.(forwardingMessage, {
                      type: 'dm',
                      id: d.id,
                      label: d.name,
                    });
                    setForwardingMessage(null);
                  }}
                  className="w-full flex items-center justify-between gap-2 p-2 rounded-xl hover:bg-white/10 text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <UserAvatar avatar={d.avatar} status={d.status} size="xs" />
                    <span className="text-xs font-semibold text-white truncate">{d.name}</span>
                  </div>
                  <span className="text-[11px] font-bold text-[#7b85ff] shrink-0">Enviar</span>
                </button>
              ))}
              {allServers.map((srv) =>
                srv.channels
                  .filter((c) => c.type !== 'voice')
                  .map((ch) => (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => {
                        onForwardMessage?.(forwardingMessage, {
                          type: 'channel',
                          id: ch.id,
                          serverId: srv.id,
                          label: `${srv.name} #${ch.name}`,
                        });
                        setForwardingMessage(null);
                      }}
                      className="w-full flex items-center justify-between gap-2 p-2 rounded-xl hover:bg-white/10 text-left cursor-pointer"
                    >
                      <span className="text-xs text-zinc-200 truncate">
                        {srv.name} · <strong>#{ch.name}</strong>
                      </span>
                      <span className="text-[11px] font-bold text-[#7b85ff] shrink-0">Enviar</span>
                    </button>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Photo Lightbox */}
      {lightboxPhoto && (
        <div
          onClick={() => setLightboxPhoto(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <button
            onClick={() => setLightboxPhoto(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={lightboxPhoto}
            alt="Foto ampliada"
            className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl"
          />
        </div>
      )}

      {/* Long-Press / Contextual Action Bottom Sheet */}
      {menuMessageId && (() => {
        const target = messages.find((m) => m.id === menuMessageId);
        if (!target) return null;
        const isTargetMe = target.authorId === currentUser.id || target.authorId === 'me';
        return (
          <div
            onClick={() => setMenuMessageId(null)}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-[#1c1d22] border border-[#2e3035] p-4 pb-6 space-y-3 shadow-2xl animate-[slideUp_180ms_ease-out]"
            >
              <div className="sm:hidden w-10 h-1 rounded-full bg-white/25 mx-auto" />

              {/* Quick Emoji Reaction Row + Full Picker Trigger */}
              <div className="flex items-center justify-between gap-1 bg-[#26272f] border border-[#2e3035] rounded-2xl p-2">
                {QUICK_EMOJIS.slice(0, 6).map((em) => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => {
                      onToggleReaction(target.id, em);
                      setMenuMessageId(null);
                    }}
                    className="w-9 h-9 rounded-xl hover:bg-white/10 flex items-center justify-center text-lg cursor-pointer"
                  >
                    {em}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setReactingMessageId(target.id);
                    setMenuMessageId(null);
                  }}
                  title="Más emojis"
                  className="w-9 h-9 rounded-xl bg-[#1c1d22] hover:bg-white/10 flex items-center justify-center text-[#b5bac1] cursor-pointer"
                >
                  <Smile className="w-4.5 h-4.5" />
                </button>
              </div>

              <div className="rounded-2xl bg-[#26272f] border border-[#2e3035] divide-y divide-[#2e3035] overflow-hidden text-sm font-medium">
                <button
                  type="button"
                  onClick={() => {
                    setReplyingTo({
                      messageId: target.id,
                      authorName: isTargetMe ? currentUser.displayName : target.authorName,
                      content:
                        target.content ||
                        (target.poll
                          ? target.poll.question
                          : target.audioNote
                            ? 'Nota de voz'
                            : 'Archivo'),
                    });
                    setMenuMessageId(null);
                    inputRef.current?.focus();
                  }}
                  className="w-full px-4 py-3 flex items-center gap-3 text-[#f2f3f5] hover:bg-white/5 text-left cursor-pointer"
                >
                  <Reply className="w-4 h-4 text-[#5865F2]" />
                  <span>Responder</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveThreadMsg(target);
                    setMenuMessageId(null);
                  }}
                  className="w-full px-4 py-3 flex items-center gap-3 text-[#f2f3f5] hover:bg-white/5 text-left cursor-pointer"
                >
                  <span className="text-base leading-none">🧵</span>
                  <span>Crear o ver Hilo</span>
                </button>

                {(canPin || isTargetMe) && (
                  <button
                    type="button"
                    onClick={() => {
                      onTogglePinMessage?.(target.id);
                      setMenuMessageId(null);
                    }}
                    className="w-full px-4 py-3 flex items-center gap-3 text-[#f2f3f5] hover:bg-white/5 text-left cursor-pointer"
                  >
                    {target.pinned ? (
                      <PinOff className="w-4 h-4 text-[#f0b232]" />
                    ) : (
                      <Pin className="w-4 h-4 text-[#f0b232]" />
                    )}
                    <span>{target.pinned ? 'Desfijar del canal' : 'Fijar mensaje'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setForwardingMessage(target);
                    setMenuMessageId(null);
                  }}
                  className="w-full px-4 py-3 flex items-center gap-3 text-[#f2f3f5] hover:bg-white/5 text-left cursor-pointer"
                >
                  <Forward className="w-4 h-4 text-[#b5bac1]" />
                  <span>Reenviar</span>
                </button>

                {target.content && (
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(target.content).catch(() => {});
                      setCopiedMessageId(target.id);
                      setTimeout(() => setCopiedMessageId(null), 1500);
                      setMenuMessageId(null);
                    }}
                    className="w-full px-4 py-3 flex items-center gap-3 text-[#f2f3f5] hover:bg-white/5 text-left cursor-pointer"
                  >
                    <Copy className="w-4 h-4 text-[#b5bac1]" />
                    <span>{copiedMessageId === target.id ? 'Texto copiado' : 'Copiar texto'}</span>
                  </button>
                )}

                {isTargetMe && !target.audioNote && !target.poll && !target.sticker && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingMessageId(target.id);
                      setEditDraft(target.content);
                      setMenuMessageId(null);
                    }}
                    className="w-full px-4 py-3 flex items-center gap-3 text-[#f2f3f5] hover:bg-white/5 text-left cursor-pointer"
                  >
                    <Pencil className="w-4 h-4 text-[#23a55a]" />
                    <span>Editar mensaje</span>
                  </button>
                )}

                {(isTargetMe || (mode === 'channel' && canManage)) && (
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmDeleteMsgId(target.id);
                      setMenuMessageId(null);
                    }}
                    className="w-full px-4 py-3 flex items-center gap-3 text-[#f23f43] hover:bg-[#f23f43]/10 text-left cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Eliminar mensaje</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Delete Confirmation Modal */}
      {confirmDeleteMsgId && (
        <div
          onClick={() => setConfirmDeleteMsgId(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xs rounded-3xl bg-[#1c1d22] border border-[#2e3035] p-5 space-y-4 shadow-2xl"
          >
            <h3 className="font-display font-bold text-base text-white">¿Eliminar mensaje?</h3>
            <p className="text-xs text-[#b5bac1] leading-relaxed">
              Esta acción eliminará el mensaje de forma permanente para todos los participantes.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteMsgId(null)}
                className="flex-1 h-10 rounded-full dc-btn-secondary text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteMessage?.(confirmDeleteMsgId);
                  setConfirmDeleteMsgId(null);
                }}
                className="flex-1 h-10 rounded-full bg-[#f23f43] hover:bg-[#d83539] text-white text-xs font-bold cursor-pointer"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dedicated Message Thread Drawer */}
      {activeThreadMsg && (
        <div
          onClick={() => setActiveThreadMsg(null)}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md h-[82vh] rounded-t-3xl sm:rounded-3xl bg-[#1c1d22] border border-[#2e3035] flex flex-col overflow-hidden shadow-2xl animate-[slideUp_200ms_ease-out]"
          >
            <div className="px-4 py-3 border-b border-[#2e3035] flex items-center justify-between bg-[#111214]">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#9aa4ff]">Hilo</p>
                <h3 className="font-display font-bold text-sm text-white truncate">
                  {activeThreadMsg.authorName} · {activeThreadMsg.content || 'Adjunto'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveThreadMsg(null)}
                className="w-8 h-8 rounded-full bg-[#26272f] hover:bg-[#2e3035] flex items-center justify-center text-[#b5bac1] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#111214]">
              {/* Parent message summary */}
              <div className="p-3 rounded-2xl bg-[#26272f] border border-[#2e3035] space-y-1">
                <div className="flex items-center gap-2">
                  <UserAvatar avatar={activeThreadMsg.authorAvatar} size="xs" showStatus={false} />
                  <span className="text-xs font-bold text-white">{activeThreadMsg.authorName}</span>
                  <span className="text-[10px] text-[#949ba4]">{activeThreadMsg.timestamp}</span>
                </div>
                <p className="text-sm text-[#f2f3f5] whitespace-pre-wrap">
                  {activeThreadMsg.content || 'Contenido multimedia'}
                </p>
              </div>

              <div className="h-px bg-[#2e3035]" />

              {threadReplies.length === 0 ? (
                <p className="text-center text-xs text-[#949ba4] py-8">
                  Aún no hay respuestas en este hilo. ¡Inicia la conversación!
                </p>
              ) : (
                threadReplies.map((tr) => (
                  <div key={tr.id} className="flex items-start gap-2.5">
                    <UserAvatar avatar={tr.authorAvatar} size="sm" showStatus={false} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-semibold text-white">{tr.authorName}</span>
                        <span className="text-[10px] text-[#949ba4]">{tr.timestamp}</span>
                      </div>
                      <p className="text-sm text-[#f2f3f5] whitespace-pre-wrap break-words">
                        {tr.content}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <form
              onSubmit={handleSendThreadReply}
              className="p-3 border-t border-[#2e3035] bg-[#1c1d22] flex items-center gap-2"
            >
              <input
                type="text"
                autoFocus
                value={threadDraft}
                onChange={(e) => setThreadDraft(e.target.value)}
                placeholder="Responder en este hilo..."
                className="flex-1 bg-[#26272f] border border-[#2e3035] rounded-full px-4 py-2 text-sm text-white placeholder:text-[#949ba4] focus:outline-none focus:border-[#5865F2]"
              />
              <button
                type="submit"
                disabled={!threadDraft.trim()}
                aria-label="Enviar respuesta al hilo"
                className="w-9 h-9 rounded-full dc-btn-primary flex items-center justify-center shrink-0 cursor-pointer disabled:opacity-40"
              >
                <SendHorizontal className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
