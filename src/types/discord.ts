export type PresenceStatus = 'online' | 'idle' | 'dnd' | 'offline';
export type ThemeMode = 'onyx' | 'dark' | 'purple' | 'light' | 'cyber' | 'emerald' | 'crimson';
export type MainScreen =
  | 'inicio'
  | 'notificaciones'
  | 'tu'
  | 'misiones'
  | 'tienda'
  | 'nitro'
  | 'ajustes'
  | 'amigos'
  | 'servidores'
  | 'insignias'
  | 'mejoras'
  | 'servidor-ajustes';

export type ServerSettingsSection =
  | 'menu'
  | 'vista-general'
  | 'canales'
  | 'integraciones'
  | 'etiqueta'
  | 'plantilla'
  | 'emojis'
  | 'stickers'
  | 'miembros'
  | 'roles'
  | 'invitaciones'
  | 'moderacion'
  | 'automod'
  | 'auditoria'
  | 'baneos'
  | 'seguridad'
  | 'comunidad'
  | 'info';

export type ServerChatTheme =
  | 'black'
  | 'onyx'
  | 'crimson'
  | 'emerald'
  | 'midnight'
  | 'cyber'
  | 'custom-photo';

export type ServerChatStyle = 'classic' | 'bubbles' | 'compact';

export interface ServerRole {
  id: string;
  name: string;
  color: string;
  gradientColors?: [string, string];
  hoist?: boolean;
  permissions: string[];
}

export interface ServerEmoji {
  id: string;
  name: string;
  imageUrl?: string;
  symbol?: string;
  uploadedBy: string;
}

export interface ServerSticker {
  id: string;
  name: string;
  imageUrl?: string;
  emoji: string;
}

export type AvatarKey =
  | 'madara'
  | 'snuf'
  | 'bumper'
  | 'alex'
  | 'discrofy'
  | 'dev'
  | 'joawasa'
  | 'dragon'
  | 'welcomer'
  | 'yourbot'
  | 'alirito'
  | 'xjenx'
  | 'jorge'
  | 'carioca'
  | 'phibi'
  | 'locke'
  | 'coffee'
  | 'primordial-bot';

export type DecorationId =
  | 'none'
  | 'miyabi'
  | 'ellen'
  | 'burnice'
  | 'alex'
  | 'deadpool'
  | 'wolverine'
  | 'dbd'
  | 'lofi'
  | 'plantas'
  | 'croma'
  | 'gato'
  | 'almas'
  | 'observador'
  | 'ofrenda'
  | 'orejas'
  | 'enfado'
  | 'llama'
  | 'pato'
  | 'cerbero'
  | 'pesadilla'
  | 'gojo'
  | 'sukuna'
  | 'yuji'
  | 'espectro'
  | 'grabado'
  | 'lobo'
  | 'tentempie'
  | 'polilla'
  | 'flores-luna'
  | 'cuernos'
  | 'fuegos-fatuos'
  | 'el-ente'
  | 'luna-oscura'
  | 'red-sangre'
  | 'calabazas'
  | 'luces-camara'
  | 'onda-cosmica'
  | 'boveda'
  | 'claptrap'
  | 'saqueo'
  | 'luna-mistica'
  | 'estrella-nocturna'
  | 'flores-lunares'
  | 'trebol'
  | 'jardin-secreto'
  | 'lirio'
  | 'adorable'
  | 'random-xd'
  | 'scene-xd'
  | 'nitro-disco'
  | 'nitro-auris'
  | 'nitro-chip'
  | 'naruto-sabio'
  | 'naruto-barion'
  | 'kurama'
  | 'sasuke'
  | 'sasuke-rinnegan'
  | 'obito-tobi'
  | 'obito-juubi'
  | 'madara-edo'
  | 'madara-rikudo'
  | 'boruto-karma'
  | 'rinnegan-deva'
  | 'rinne-sharingan'
  | 'sharingan-3tomoe'
  | 'sharingan-itachi'
  | 'sharingan-kamui'
  | 'sharingan-shisui'
  | 'ems-sasuke'
  | 'ems-madara';

export type NameplateId =
  | 'none'
  | 'sakura'
  | 'konoha-naranja'
  | 'miyabi'
  | 'deadpool'
  | 'wolverine'
  | 'dbd'
  | 'observador'
  | 'rama'
  | 'condenacion'
  | 'vader'
  | 'cerbero'
  | 'pesadilla'
  | 'gojo'
  | 'sukuna'
  | 'yuji'
  | 'almas'
  | 'lobo'
  | 'acechador'
  | 'diablo-jersey'
  | 'fuegos-fatuos'
  | 'polilla'
  | 'flores-luna'
  | 'marcas-aranazos'
  | 'luna-oscura'
  | 'red-sangre'
  | 'conejito-fresero'
  | 'el-mismo-pato'
  | 'marea-lluvia'
  | 'jackalope'
  | 'jardin-secreto'
  | 'kurama'
  | 'uchiha-sharingan'
  | 'rinnegan'
  | 'obito-kamui'
  | 'madara-susanoo'
  | 'boruto-karma'
  | 'naruto-sabio';

export type BadgeId =
  | 'hypesquad'
  | 'misiones'
  | 'nitro'
  | 'mejora'
  | 'antiguedad'
  | 'orbs'
  | 'regalos'
  | 'transmision'
  | 'juegos'
  | 'pionero';

export interface BadgeTier {
  id: string;
  name: string;
  requirementLabel: string;
  threshold: number;
  color: string;
  accent?: string;
}

export interface BadgeDefinition {
  id: BadgeId;
  title: string;
  shortTitle: string;
  description: string;
  ctaLabel?: string;
  hasNotificationDot?: boolean;
  tiers: BadgeTier[];
}

export type DisplayNameStyle = 'default' | 'shinobi' | 'neon' | 'retro' | 'gothic' | 'sakura';
export type DisplayNameColorPreset =
  | 'none'
  | 'crimson-cyan'
  | 'nitro-sunset'
  | 'cyber-neon'
  | 'infernal-gold'
  | 'emerald-pulse'
  | 'amethyst-prism'
  | 'custom';
export type ProfileEffectId =
  | 'none'
  | 'sparks'
  | 'cyber'
  | 'crimson'
  | 'miyabi'
  | 'ellen'
  | 'burnice'
  | 'deadpool'
  | 'dbd'
  | 'pesadilla'
  | 'cerbero'
  | 'jugar'
  | 'gojo'
  | 'grabado'
  | 'sukuna'
  | 'lobo'
  | 'yuji'
  | 'observador'
  | 'almas'
  | 'hombre-polilla'
  | 'flores-luna'
  | 'diablo-jersey'
  | 'llorona'
  | 'jackalope'
  | 'gancho'
  | 'cuervos-luna'
  | 'red-sangre'
  | 'el-ente'
  | 'boveda'
  | 'saqueo'
  | 'trebol'
  | 'jardin-secreto'
  | 'luna-mistica'
  | 'adorable'
  | 'scene-xd'
  | 'kurama'
  | 'tsukuyomi-sharingan'
  | 'rinnegan-chibaku'
  | 'kamui-vortex'
  | 'susanoo-madara'
  | 'chidori-sasuke'
  | 'baryon-mode'
  | 'karma-boruto';

export type ProfileFrameId =
  | 'none'
  | 'obsidian'
  | 'crimson'
  | 'neon-blue'
  | 'gold'
  | 'glitch'
  | 'espectro'
  | 'observador'
  | 'ramas-desnudas'
  | 'flores-luna'
  | 'diablo-jersey'
  | 'el-ente'
  | 'luna-oscura'
  | 'sharingan-ring'
  | 'rinnegan-aura'
  | 'kurama-tails'
  | 'susanoo-armor'
  | 'lavanda';

export type VoiceEntryEffectId =
  | 'none'
  | 'arcade-chime'
  | 'cyber-warp'
  | 'aurora-bloom'
  | 'bass-drop';

export interface PerServerProfile {
  nickname?: string;
  pronouns?: string;
  bio?: string;
  bannerColor?: string;
  bannerImage?: string;
}

export interface UserProfile {
  id: string;
  displayName: string;
  username: string;
  email?: string;
  phone?: string;
  pronouns?: string;
  displayNameStyle?: DisplayNameStyle;
  displayNameColorPreset?: DisplayNameColorPreset;
  displayNameCustomColors?: [string, string];
  displayNameGlow?: boolean;
  status: PresenceStatus;
  customStatus: string;
  bio: string;
  bannerColor: string;
  bannerImage?: string;
  avatar: AvatarKey;
  customAvatarUrl?: string;
  decoration: DecorationId;
  profileEffect?: ProfileEffectId;
  profileFrame?: ProfileFrameId;
  voiceEntryEffect?: VoiceEntryEffectId;
  ephemeralNoteExpiresAt?: number;
  nameplate: NameplateId;
  orbs: number;
  memberSince: string;
  note: string;
  nitroTier: 'none' | 'basic' | 'nitro';
  serverTag?: string;
  unlockedBadgeIds: BadgeId[];
  equippedBadgeIds: BadgeId[];
  boostsGiven: number;
  boostStreakMonths: number;
  giftsSent: number;
  streamHours: number;
  gamesPlayedCount: number;
  accountYears: number;
  perServerProfiles?: Record<string, PerServerProfile>;
}

export interface StoredAccount {
  id: string;
  contact: string;
  password: string;
  isOwnerAccount?: boolean;
  twoFactorEnabled?: boolean;
  backupCodes?: string[];
  user: UserProfile;
  ownedBundleIds: string[];
  wishlistIds: string[];
}

export interface PublicUserProfile {
  id: string;
  displayName: string;
  username: string;
  pronouns?: string;
  displayNameStyle?: DisplayNameStyle;
  displayNameColorPreset?: DisplayNameColorPreset;
  displayNameCustomColors?: [string, string];
  displayNameGlow?: boolean;
  avatar: AvatarKey;
  customAvatarUrl?: string;
  status: PresenceStatus;
  customStatus?: string;
  bio: string;
  bannerColor: string;
  bannerImage?: string;
  decoration?: DecorationId;
  profileEffect?: ProfileEffectId;
  profileFrame?: ProfileFrameId;
  nameplate?: NameplateId;
  serverTag?: string;
  nitroTier?: 'none' | 'basic' | 'nitro';
  badgeIds?: BadgeId[];
  memberSince: string;
  isBot?: boolean;
  mutualServers?: string[];
}

export interface FriendActivity {
  id: string;
  userId: string;
  displayName: string;
  avatar: AvatarKey;
  status: PresenceStatus;
  gameTitle?: string;
  gameBannerVariant?: 'aldea' | 'carioca' | 'valorant';
  elapsed?: string;
}

export interface ChatReaction {
  emoji: string;
  count: number;
  reacted: boolean;
}

export interface ChatEmbed {
  type: 'invite' | 'link' | 'quest';
  title: string;
  subtitle: string;
  serverName?: string;
  onlineCount?: number;
  memberCount?: number;
  url?: string;
  accentColor?: string;
}

export interface ChatPollOption {
  id: string;
  text: string;
  votes: string[];
}

export interface ChatPoll {
  question: string;
  options: ChatPollOption[];
  closed?: boolean;
}

export interface ChatMessage {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: AvatarKey;
  authorIsBot?: boolean;
  authorTag?: string;
  timestamp: string;
  createdAtMs?: number;
  content: string;
  edited?: boolean;
  editedAt?: string;
  pinned?: boolean;
  mentionEveryone?: boolean;
  threadCount?: number;
  replyTo?: {
    messageId?: string;
    authorName: string;
    content: string;
  };
  forwardedFrom?: {
    authorName: string;
    originLabel: string;
    content: string;
  };
  embed?: ChatEmbed;
  reactions: ChatReaction[];
  attachmentLabel?: string;
  imageUrl?: string;
  sticker?: {
    name: string;
    emoji: string;
    imageUrl?: string;
  };
  audioNote?: {
    durationSec: number;
    waveform: number[];
  };
  poll?: ChatPoll;
  quickReplies?: {
    id: string;
    label: string;
    command?: string;
    navigateTo?: 'tu' | 'tienda' | 'amigos' | 'discover' | 'misiones' | 'voice';
  }[];
}

export interface DropInVoiceRoom {
  id: string;
  name: string;
  topic: string;
  category: string;
  accentColor: string;
  emoji: string;
  participants: {
    id: string;
    name: string;
    avatar: AvatarKey;
    speaking?: boolean;
    muted?: boolean;
  }[];
}

export interface ThreadMessage {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: AvatarKey;
  authorTag?: string;
  timestamp: string;
  createdAtMs?: number;
  content: string;
}

export interface FriendRequestItem {
  fromUid: string;
  toUid: string;
  fromDisplayName: string;
  fromUsername: string;
  fromAvatar: AvatarKey;
  fromCustomAvatarUrl?: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt?: string;
}

export interface SentFriendRequestItem {
  fromUid: string;
  toUid: string;
  toDisplayName: string;
  toUsername: string;
  toAvatar: AvatarKey;
  status: 'pending' | 'accepted' | 'declined';
  createdAt?: string;
}

export type AppLanguage = 'es' | 'en' | 'pt' | 'fr' | 'de' | 'it' | 'ja' | 'ko';

export interface AppPreferences {
  soundsEnabled: boolean;
  chatFontSize: 'small' | 'standard' | 'large';
  compactMode: boolean;
  typingIndicatorEnabled: boolean;
  language: AppLanguage;
  autoTranslateMessages?: boolean;
}

export interface DirectMessageThread {
  id: string;
  name: string;
  username?: string;
  avatar: AvatarKey;
  customAvatarUrl?: string;
  secondaryAvatar?: AvatarKey;
  isGroup?: boolean;
  isBot?: boolean;
  status: PresenceStatus;
  lastMessagePreview: string;
  lastTimestamp: string;
  muted?: boolean;
  unread?: boolean;
  unreadCount?: number;
  pinned?: boolean;
  favorite?: boolean;
  giftedBundleIds?: string[];
  serverTag?: string;
  decoration?: DecorationId;
  nameplate?: NameplateId;
  displayNameStyle?: DisplayNameStyle;
  displayNameColorPreset?: DisplayNameColorPreset;
  displayNameCustomColors?: [string, string];
  displayNameGlow?: boolean;
  nitroTier?: 'none' | 'basic' | 'nitro';
  customIconUrl?: string;
  groupEmoji?: string;
  groupColor?: string;
  isCallEnded?: boolean;
  participantIds?: string[];
  otherUid?: string;
  statusUpdatedAtMs?: number;
  messages: ChatMessage[];
}

export interface Channel {
  id: string;
  name: string;
  type: 'text' | 'voice' | 'announcement';
  category: string;
  isPrivate?: boolean;
  unreadCount?: number;
  topic?: string;
  voiceParticipants?: {
    id: string;
    name: string;
    avatar: AvatarKey;
    muted?: boolean;
    speaking?: boolean;
  }[];
  messages: ChatMessage[];
}

export interface ServerMemberSummary {
  uid: string;
  displayName: string;
  username: string;
  avatar: AvatarKey;
  customAvatarUrl?: string;
  status: PresenceStatus;
  roleIds: string[];
  isAdmin: boolean;
  joinedAt?: string;
}

export interface Server {
  id: string;
  name: string;
  shortCode: string;
  ownerId?: string;
  adminIds?: string[];
  members?: ServerMemberSummary[];
  isDiscoverable?: boolean;
  badgeCount?: number;
  hasUnread?: boolean;
  hasEventBadge?: boolean;
  iconStyle:
    | 'jmt'
    | 'hoyoverse'
    | 'mtg'
    | 'zn'
    | 'tnu'
    | 'b'
    | 'imperio'
    | 'fl'
    | 'au'
    | 'zevr'
    | 'slbr'
    | 'rebo'
    | 'arrow'
    | 'custom';
  accentColor: string;
  bannerColor: string;
  bannerImage?: string;
  customIconUrl?: string;
  customEmoji?: string;
  description?: string;
  memberCount: number;
  memberCountDisplay?: string;
  onlineCount: number;
  boostLevel: number;
  boostCount: number;
  unlockedPerkIds?: string[];
  activeServerTag?: string;
  categoriesOrder?: string[];
  roles?: ServerRole[];
  memberRoleIds?: Record<string, string[]>;
  customEmojis?: ServerEmoji[];
  stickers?: ServerSticker[];
  chatTheme?: ServerChatTheme;
  chatWallpaperUrl?: string;
  chatMessageStyle?: ServerChatStyle;
  chatAccentColor?: string;
  showAllChannels?: boolean;
  muted?: boolean;
  communityEnabled?: boolean;
  channels: Channel[];
}

export interface Quest {
  id: string;
  title: string;
  sponsor: string;
  endsAt: string;
  rewardOrbs: number;
  nitroMultiplier: string;
  description: string;
  ctaLabel: string;
  secondaryLabel: string;
  durationSeconds: number;
  artVariant: 'dune' | 'badges' | 'exterminauts' | 'ad';
  isLimitedTime?: boolean;
  category?: string;
  adBrand?: string;
  adTagline?: string;
  bannerGradient?: [string, string, string];
  claimed: boolean;
}

export type ShopCollectionId =
  | 'night-terrors'
  | 'dark-folklore'
  | 'dbd'
  | 'nameplate-bonanza'
  | 'borderlands'
  | 'secret-garden'
  | 'rawr-xd'
  | 'celestial'
  | 'stardust'
  | 'anime'
  | 'lofi'
  | 'zzz'
  | 'marvel'
  | 'banners';

export interface ShopBundleItem {
  id: string;
  name: string;
  kind:
    | 'Decoración de avatar'
    | 'Placa de identificación'
    | 'Efecto de perfil'
    | 'Marco de perfil'
    | 'Banner de perfil'
    | 'Tema de interfaz'
    | 'Efecto de entrada de voz'
    | 'Insignia exclusiva';
  decorationId?: DecorationId;
  nameplateId?: NameplateId;
  profileEffectId?: ProfileEffectId;
  profileFrameId?: ProfileFrameId;
  bannerUrl?: string;
  uiThemeId?: ThemeMode;
  voiceEntryEffectId?: VoiceEntryEffectId;
  exclusiveBadgeId?: BadgeId;
}

export interface ShopBundle {
  id: string;
  title: string;
  shortTitle: string;
  collectionId?: ShopCollectionId;
  category:
    | 'destacado'
    | 'personalizacion'
    | 'zzz'
    | 'marvel'
    | 'dbd'
    | 'lofi'
    | 'estilo'
    | 'banners'
    | 'anime'
    | 'horror'
    | 'fantasia'
    | 'folklore'
    | 'bonanza'
    | 'borderlands'
    | 'garden'
    | 'rawr'
    | 'celestial';
  priceOrbs: number;
  priceUsd: string;
  colorSwatches?: string[];
  hasExtraSwatches?: boolean;
  items: ShopBundleItem[];
  artVariant:
    | 'miyabi'
    | 'ellen'
    | 'burnice'
    | 'deadpool'
    | 'wolverine'
    | 'dbd'
    | 'plantas'
    | 'croma'
    | 'gato'
    | 'almas'
    | 'observador'
    | 'konoha'
    | 'dune'
    | 'pesadilla'
    | 'pato'
    | 'rama'
    | 'vader'
    | 'condenacion'
    | 'cerbero'
    | 'llama'
    | 'jugar'
    | 'gojo'
    | 'orejas'
    | 'grabado'
    | 'sukuna'
    | 'espectro'
    | 'lobo'
    | 'yuji'
    | 'tentempie'
    | 'acechador'
    | 'hombre-polilla'
    | 'polilla'
    | 'flores-luna'
    | 'cuernos'
    | 'fuegos-fatuos'
    | 'diablo-jersey'
    | 'llorona'
    | 'jackalope'
    | 'ramas-desnudas'
    | 'el-ente'
    | 'luna-oscura'
    | 'red-sangre'
    | 'calabazas'
    | 'marcas-aranazos'
    | 'gancho'
    | 'cuervos-luna'
    | 'hazlo-brillante'
    | 'onda-cosmica'
    | 'luces-camara'
    | 'conejito-fresero'
    | 'marea-lluvia'
    | 'mas-alla-boveda'
    | 'saqueo-arcoiris'
    | 'claptrap'
    | 'luna-mistica'
    | 'estrella-nocturna'
    | 'flores-lunares'
    | 'trebol'
    | 'jardin-secreto'
    | 'lirio'
    | 'adorable'
    | 'random-xd'
    | 'scene-xd'
    | 'espectro-marco'
    | 'observador-marco'
    | 'flores-luna-marco'
    | 'diablo-jersey-marco'
    | 'el-ente-marco'
    | 'luna-oscura-marco'
    | 'naruto-sabio'
    | 'naruto-barion'
    | 'kurama'
    | 'sasuke'
    | 'sasuke-rinnegan'
    | 'obito-tobi'
    | 'obito-juubi'
    | 'madara-edo'
    | 'madara-rikudo'
    | 'boruto-karma'
    | 'rinnegan-deva'
    | 'rinne-sharingan'
    | 'sharingan-3tomoe'
    | 'sharingan-itachi'
    | 'sharingan-kamui'
    | 'sharingan-shisui'
    | 'ems-sasuke'
    | 'ems-madara'
    | 'tema-cyber'
    | 'tema-emerald'
    | 'tema-crimson'
    | 'voz-arcade'
    | 'voz-warp'
    | 'voz-aurora'
    | 'voz-bass'
    | 'insignia-pionero'
    | 'marco-lavanda';
}

export interface NotificationItem {
  id: string;
  type: 'mention' | 'reply' | 'friend' | 'quest' | 'system';
  title: string;
  body: string;
  timestamp: string;
  unread: boolean;
  avatar: AvatarKey;
  senderUid?: string;
  serverName?: string;
  targetDmId?: string;
  targetServerId?: string;
  targetChannelId?: string;
}

export interface VoiceSession {
  active: boolean;
  callNonce?: number;
  dmId?: string;
  serverId?: string;
  channelId?: string;
  callStatus?: 'idle' | 'ringing' | 'connecting' | 'connected';
  channelName: string;
  contextName: string;
  muted: boolean;
  deafened: boolean;
  videoOn: boolean;
  screenSharing: boolean;
  connectedSeconds: number;
  participants: {
    id: string;
    name: string;
    avatar: AvatarKey;
    customAvatarUrl?: string;
    speaking?: boolean;
    muted?: boolean;
    videoOn?: boolean;
    screenSharing?: boolean;
  }[];
}

export type ServerTemplateId =
  | 'friends'
  | 'gaming'
  | 'community'
  | 'study'
  | 'art'
  | 'custom';

export interface CreateServerPayload {
  name: string;
  templateId: ServerTemplateId;
  audience: 'friends' | 'community';
  accentColor: string;
  customIconUrl?: string;
  customEmoji?: string;
  chatTheme: ServerChatTheme;
  chatMessageStyle: ServerChatStyle;
  includeBots: boolean;
  includeStarterRoles: boolean;
  includeVoiceChannels: boolean;
  starterRoles?: ServerRole[];
}

