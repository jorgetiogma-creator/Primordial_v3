import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import {
  Award,
  Bell,
  Compass,
  Home,
  Moon,
  PhoneCall,
  PhoneOff,
  Plus,
  Search,
  Settings,
  Store,
  Sun,
  Upload,
  UserPlus,
  Video,
  X,
} from 'lucide-react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import {
  auth,
  db,
  ensureFirebaseSessionForAppAccount,
  signInCloudAccountWithCredentials,
} from './lib/firebase';
import {
  cancelSentFriendRequest,
  claimProfileWithUsername,
  createFirestoreChannel,
  createFirestoreServer,
  deleteFirestoreChannel,
  deleteFirestoreMessage,
  deleteFirestoreServer,
  fetchDiscoverableServers,
  fetchPublicProfileById,
  fetchUserAccountBundle,
  getOrCreateDmThread,
  inviteAiBotToFirestoreServer,
  joinFirestoreServer,
  kickFirestoreServerMember,
  leaveFirestoreServer,
  LivePublicProfileEntry,
  markAllNotificationsReadInFirestore,
  markDmThreadRead,
  markNotificationReadInFirestore,
  normalizeUsernameHandle,
  removeVoiceChannelPresence,
  resolveEffectivePresence,
  respondFriendRequest,
  searchRealUsers,
  sendAiBotChannelMessage,
  sendChannelMessage,
  sendDmMessage,
  sendFriendRequest,
  subscribeToChannelMessages,
  subscribeToDmMessages,
  subscribeToDms,
  subscribeToFriendRequests,
  subscribeToNotifications,
  subscribeToPublicProfilesByIds,
  subscribeToSentFriendRequestItems,
  subscribeToSentFriendRequests,
  subscribeToServerDetail,
  subscribeToVoiceChannelPresence,
  syncUserAccountToFirestore,
  toggleServerMemberAdmin,
  updateFirestoreChannel,
  updateFirestoreMessage,
  updateFirestoreServer,
  updateServerMemberRolesInFirestore,
  updateUserPresenceStatus,
  upsertVoiceChannelPresence,
} from './services/firestoreService';
import {
  captureLocalAudio,
  captureLocalCamera,
  captureLocalScreen,
  DmWebRtcController,
  IncomingDmCall,
  rejectDmIncomingCall,
  subscribeToIncomingDmCalls,
} from './services/rtcService';
import {
  BADGE_DEFINITIONS,
  CURATED_PUBLIC_SERVERS,
  INITIAL_ACTIVITIES,
  INITIAL_DMS,
  INITIAL_DROPIN_ROOMS,
  INITIAL_NOTIFICATIONS,
  INITIAL_QUESTS,
  INITIAL_SERVERS,
  INITIAL_SHOP_BUNDLES,
  INITIAL_USER,
  PRIMORDIAL_BOT_DM_ID,
  createWelcomeBotThread,
  generateBotReply,
  resolvePublicUserProfile,
} from './data/discordData';
import {
  AiAssistantMessage,
  AiConversationState,
  AiServerBuildPlan,
  AppPreferences,
  AvatarKey,
  BadgeId,
  Channel,
  ChatMessage,
  CreateServerPayload,
  DirectMessageThread,
  DropInVoiceRoom,
  FriendActivity,
  FriendRequestItem,
  MainScreen,
  NotificationItem,
  PublicUserProfile,
  Quest,
  SentFriendRequestItem,
  Server,
  ServerMemberSummary,
  ServerRole,
  ServerSettingsSection,
  ServerTemplateId,
  ShopBundle,
  StoredAccount,
  ThemeMode,
  UserProfile,
  VoiceEntryEffectId,
  VoiceSession,
} from './types/discord';
import {
  LaurelQuestIcon,
  NitroWheelIcon,
  OrbsCrystalIcon,
  PrimordialAppIcon,
  UserAvatar,
} from './components/DiscordArt';
import { AuthView, CloudLoginResult } from './components/AuthView';
import { ServerRail } from './components/ServerRail';
import { MessagesPanel } from './components/MessagesPanel';
import { ChatView, RichMessagePayload } from './components/ChatView';
import { ProfileView } from './components/ProfileView';
import { QuestsView } from './components/QuestsView';
import { ShopView } from './components/ShopView';
import { NitroView } from './components/NitroView';
import { BadgesView } from './components/BadgesView';
import { BoostGemIcon, ServerBoostView } from './components/ServerBoostView';
import { ServerSettingsView } from './components/ServerSettingsView';
import { UserProfileModal } from './components/UserProfileModal';
import { OwnerPanelModal } from './components/OwnerPanelModal';
import { ScreenShareStudioModal } from './components/ScreenShareStudioModal';
import {
  AI_BUILDER_BOT_UID,
  AiServerAssistantView,
} from './components/AiServerAssistantView';
import { getOwnedCosmetics, sanitizeUserShopCosmetics } from './utils/shopOwnership';
import {
  canManageServer,
  getServerPermissions,
  isActiveAccountOwner,
  isOwnerIdentity,
  isServerOwner,
  normalizeSingleOwnerAccounts,
  RESERVED_OWNER_USERNAME,
} from './utils/ownerAccess';
import { playUiSound, playVoiceEntryEffect, triggerHaptic } from './utils/soundEffects';
import {
  CreateServerModal,
  DiscoverModal,
  FriendsView,
  NotificationsView,
  SettingsView,
  VoiceOverlay,
} from './components/SettingsAndModals';
import { OfflineIndicator, PWAInstallButton } from './components/PWAPrompts';
import { I18nProvider, translateAppText, TranslationKey } from './utils/i18n';

const STORAGE_KEY = 'discord_full_app_state_v2';
const ACCOUNTS_KEY = 'discord_accounts_v1';
const SESSION_KEY = 'discord_auth_session_v1';
const ORBS_BUGFIX_KEY = 'discord_orbs_bugfix_v2';
const SHOP_OWNERSHIP_MIGRATION_KEY = 'discord_shop_ownership_v1';
const CLEAN_EMPTY_START_KEY = 'primordial_clean_empty_v1';
const APP_PREFS_KEY = 'primordial_app_prefs_v1';
const SERVER_ORDER_KEY = 'primordial_server_order_v1';
const BOT_DM_KEY_PREFIX = 'primordial_bot_dm_v1_';
const CURATED_SERVERS_KEY_PREFIX = 'primordial_curated_srv_v1_';
const CURATED_MSGS_KEY_PREFIX = 'primordial_curated_msgs_v1_';
const LOCAL_PREFS_KEY_PREFIX = 'primordial_local_prefs_v1_';
const ACTIVITY_ORBS_KEY_PREFIX = 'primordial_activity_orbs_v1_';
const AI_CONVO_KEY_PREFIX = 'primordial_ai_chat_v1_';
const OWNER_JONH_MIGRATION_KEY = 'primordial_owner_jonh_v1';
const OWNER_JONH_USER_MIGRATION_KEY = 'primordial_owner_jonh_user_v1';

const DEFAULT_AI_CONVERSATION: AiConversationState = {
  chatMessages: [],
  buildMessages: [],
  selectedTargetId: '',
  mode: 'build',
};

const loadAiConversationForAccount = (accountId: string | null): AiConversationState => {
  try {
    const raw = localStorage.getItem(`${AI_CONVO_KEY_PREFIX}${accountId || 'guest'}`);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AiConversationState> & {
        messages?: AiAssistantMessage[];
      };
      if (parsed && (Array.isArray(parsed.chatMessages) || Array.isArray(parsed.buildMessages))) {
        return {
          chatMessages: Array.isArray(parsed.chatMessages) ? parsed.chatMessages.slice(-60) : [],
          buildMessages: Array.isArray(parsed.buildMessages) ? parsed.buildMessages.slice(-60) : [],
          selectedTargetId:
            typeof parsed.selectedTargetId === 'string' ? parsed.selectedTargetId : '',
          mode: parsed.mode === 'chat' ? 'chat' : 'build',
        };
      }
      if (parsed && Array.isArray(parsed.messages)) {
        const legacy = parsed.messages.slice(-60);
        return {
          chatMessages: legacy.filter((m) => m.mode === 'chat'),
          buildMessages: legacy.filter((m) => m.mode !== 'chat'),
          selectedTargetId:
            typeof parsed.selectedTargetId === 'string' ? parsed.selectedTargetId : '',
          mode: parsed.mode === 'chat' ? 'chat' : 'build',
        };
      }
    }
  } catch {
    /* ignore */
  }
  return { ...DEFAULT_AI_CONVERSATION };
};

const saveAiConversationForAccount = (
  accountId: string | null,
  state: AiConversationState
) => {
  const key = `${AI_CONVO_KEY_PREFIX}${accountId || 'guest'}`;
  const trimmed: AiConversationState = {
    ...state,
    chatMessages: (state.chatMessages || []).slice(-50),
    buildMessages: (state.buildMessages || []).slice(-50),
  };
  try {
    localStorage.setItem(key, JSON.stringify(trimmed));
  } catch {
    // Quota fallback: drop heavy inline image previews from localStorage while keeping full chat history
    try {
      const lightweight: AiConversationState = {
        ...trimmed,
        chatMessages: trimmed.chatMessages.map((m) =>
          m.images?.length ? { ...m, images: undefined } : m
        ),
        buildMessages: trimmed.buildMessages.map((m) =>
          m.images?.length ? { ...m, images: undefined } : m
        ),
      };
      localStorage.setItem(key, JSON.stringify(lightweight));
    } catch {
      /* ignore */
    }
  }
};

const isCuratedServerId = (id?: string | null): boolean =>
  Boolean(id && CURATED_PUBLIC_SERVERS.some((s) => s.id === id));

const loadLocalPrefsForAccount = (
  accountId: string | null
): {
  voiceEntryEffect?: VoiceEntryEffectId;
  ephemeralNoteExpiresAt?: number;
  betaTestsCount?: number;
  aiCredits?: number;
} => {
  try {
    const raw = localStorage.getItem(`${LOCAL_PREFS_KEY_PREFIX}${accountId || 'guest'}`);
    if (raw) return JSON.parse(raw) || {};
  } catch {
    /* ignore */
  }
  return {};
};

const saveLocalPrefsForAccount = (
  accountId: string | null,
  prefs: {
    voiceEntryEffect?: VoiceEntryEffectId;
    ephemeralNoteExpiresAt?: number;
    betaTestsCount?: number;
    aiCredits?: number;
  }
) => {
  try {
    const merged = { ...loadLocalPrefsForAccount(accountId), ...prefs };
    localStorage.setItem(`${LOCAL_PREFS_KEY_PREFIX}${accountId || 'guest'}`, JSON.stringify(merged));
  } catch {
    /* ignore */
  }
};

const loadBotDmForAccount = (
  accountId: string | null,
  displayName?: string
): DirectMessageThread => {
  try {
    const raw = localStorage.getItem(`${BOT_DM_KEY_PREFIX}${accountId || 'guest'}`);
    if (raw) {
      const parsed = JSON.parse(raw) as DirectMessageThread;
      if (parsed && parsed.id === PRIMORDIAL_BOT_DM_ID && Array.isArray(parsed.messages)) {
        return {
          ...parsed,
          isBot: true,
          pinned: true,
          avatar: 'primordial-bot',
        };
      }
    }
  } catch {
    /* ignore */
  }
  return createWelcomeBotThread(displayName);
};

const saveBotDmForAccount = (accountId: string | null, thread: DirectMessageThread) => {
  try {
    localStorage.setItem(`${BOT_DM_KEY_PREFIX}${accountId || 'guest'}`, JSON.stringify(thread));
  } catch {
    /* ignore */
  }
};

const mergeBotDm = (
  list: DirectMessageThread[],
  accountId: string | null,
  displayName?: string
): DirectMessageThread[] => {
  const withoutBot = list.filter((d) => d.id !== PRIMORDIAL_BOT_DM_ID);
  const existingBot = list.find((d) => d.id === PRIMORDIAL_BOT_DM_ID);
  const botThread = existingBot
    ? { ...existingBot, isBot: true, pinned: true, avatar: 'primordial-bot' as AvatarKey }
    : loadBotDmForAccount(accountId, displayName);
  return [botThread, ...withoutBot];
};

const loadCuratedJoinedIds = (accountId: string | null): string[] => {
  try {
    const raw = localStorage.getItem(`${CURATED_SERVERS_KEY_PREFIX}${accountId || 'guest'}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    /* ignore */
  }
  return [];
};

const saveCuratedJoinedIds = (accountId: string | null, ids: string[]) => {
  try {
    localStorage.setItem(`${CURATED_SERVERS_KEY_PREFIX}${accountId || 'guest'}`, JSON.stringify(ids));
  } catch {
    /* ignore */
  }
};

const loadCuratedMessages = (accountId: string | null): Record<string, ChatMessage[]> => {
  try {
    const raw = localStorage.getItem(`${CURATED_MSGS_KEY_PREFIX}${accountId || 'guest'}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch {
    /* ignore */
  }
  return {};
};

const saveCuratedMessages = (accountId: string | null, map: Record<string, ChatMessage[]>) => {
  try {
    localStorage.setItem(`${CURATED_MSGS_KEY_PREFIX}${accountId || 'guest'}`, JSON.stringify(map));
  } catch {
    /* ignore */
  }
};

const DEFAULT_ACCOUNT: StoredAccount = {
  id: 'acc-default',
  contact: 'usuario@primordial.gg',
  password: '',
  user: {
    ...INITIAL_USER,
    email: 'usuario@primordial.gg',
    orbs: 1200,
  },
  ownedBundleIds: [],
  wishlistIds: [],
};

const normalizeOrbs = (value?: number) => {
  if (typeof value !== 'number' || Number.isNaN(value) || value < 0) {
    return 1200;
  }
  return Math.min(999_999_999_999_999, Math.floor(value));
};

export default function App() {
  const [accounts, setAccounts] = useState<StoredAccount[]>(() => {
    try {
      const rawAccs = localStorage.getItem(ACCOUNTS_KEY);
      if (rawAccs) {
        const parsed: StoredAccount[] = JSON.parse(rawAccs);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const needsJonhMigration = !localStorage.getItem(OWNER_JONH_MIGRATION_KEY);
          const sanitized = parsed.map((acc) => {
            const owned = acc.ownedBundleIds || [];
            const isExistingJonh =
              acc.user?.username?.trim().toLowerCase() === 'jonh';
            const mergedAccUser: UserProfile = {
              ...INITIAL_USER,
              ...acc.user,
              ...(isExistingJonh
                ? { email: acc.user?.email || 'jorgesantiagoensuprime@gmail.com' }
                : {}),
              orbs: normalizeOrbs(acc.user?.orbs),
            };
            return {
              ...acc,
              ...(isExistingJonh ? { isOwnerAccount: true } : {}),
              ownedBundleIds: owned,
              user: sanitizeUserShopCosmetics(mergedAccUser, owned, INITIAL_SHOP_BUNDLES),
            };
          });
          if (needsJonhMigration) {
            localStorage.setItem(OWNER_JONH_MIGRATION_KEY, '1');
          }
          localStorage.setItem(ORBS_BUGFIX_KEY, '1');
          return normalizeSingleOwnerAccounts(sanitized);
        }
      }
      localStorage.setItem(ORBS_BUGFIX_KEY, '1');
    } catch {
      /* ignore */
    }
    return [];
  });

  const [activeAccountId, setActiveAccountId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(SESSION_KEY) || null;
    } catch {
      return null;
    }
  });

  const [user, setUser] = useState<UserProfile>(() => {
    const localPrefs = loadLocalPrefsForAccount(activeAccountId);
    const noteExpired = Boolean(
      localPrefs.ephemeralNoteExpiresAt && Date.now() >= localPrefs.ephemeralNoteExpiresAt
    );
    try {
      localStorage.removeItem('discord_orbs_100m_granted_v1');
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const parsedUser = parsed.user;
        const owned: string[] = parsed.ownedBundleIds || [];
        if (parsedUser) {
          const rawStyle = parsedUser.displayNameStyle as string | undefined;
          const rawPlate = parsedUser.nameplate as string | undefined;
          const needsJonhUserMigration =
            !localStorage.getItem(OWNER_JONH_USER_MIGRATION_KEY) &&
            String(parsedUser.username || '').trim().toLowerCase() === 'jonh';
          const merged: UserProfile = {
            ...INITIAL_USER,
            ...parsedUser,
            ...(needsJonhUserMigration
              ? { email: parsedUser.email || 'jorgesantiagoensuprime@gmail.com' }
              : {}),
            displayNameStyle: rawStyle === 'gta' || rawStyle === 'shinobi' ? 'default' : parsedUser.displayNameStyle,
            nameplate:
              rawPlate === 'vice-city' || rawPlate === 'konoha-naranja'
                ? 'none'
                : parsedUser.nameplate,
            orbs: normalizeOrbs(parsedUser.orbs),
            unlockedBadgeIds: parsedUser.unlockedBadgeIds || INITIAL_USER.unlockedBadgeIds,
            equippedBadgeIds: parsedUser.equippedBadgeIds || INITIAL_USER.equippedBadgeIds,
            boostsGiven: parsedUser.boostsGiven ?? 0,
            boostStreakMonths: parsedUser.boostStreakMonths ?? 0,
            giftsSent: parsedUser.giftsSent ?? 0,
            streamHours: parsedUser.streamHours ?? 0,
            gamesPlayedCount: parsedUser.gamesPlayedCount ?? 0,
            accountYears: parsedUser.accountYears ?? 0,
            betaTestsCount: localPrefs.betaTestsCount ?? parsedUser.betaTestsCount ?? 0,
            voiceEntryEffect: localPrefs.voiceEntryEffect || parsedUser.voiceEntryEffect || 'none',
            ephemeralNoteExpiresAt: noteExpired ? undefined : localPrefs.ephemeralNoteExpiresAt,
            customStatus: noteExpired ? '' : parsedUser.customStatus || '',
          };
          if (needsJonhUserMigration) {
            localStorage.setItem(OWNER_JONH_USER_MIGRATION_KEY, '1');
          }
          return sanitizeUserShopCosmetics(merged, owned, INITIAL_SHOP_BUNDLES);
        }
      }
    } catch {
      /* ignore */
    }
    return {
      ...DEFAULT_ACCOUNT.user,
      betaTestsCount: localPrefs.betaTestsCount ?? 0,
      voiceEntryEffect: localPrefs.voiceEntryEffect || 'none',
      ephemeralNoteExpiresAt: noteExpired ? undefined : localPrefs.ephemeralNoteExpiresAt,
    };
  });

  const [dms, setDms] = useState<DirectMessageThread[]>(() => {
    try {
      if (!localStorage.getItem(CLEAN_EMPTY_START_KEY)) {
        return mergeBotDm(INITIAL_DMS, activeAccountId, user.displayName);
      }
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const savedDms: DirectMessageThread[] | undefined = JSON.parse(raw).dms;
        if (Array.isArray(savedDms)) {
          return mergeBotDm(savedDms, activeAccountId, user.displayName);
        }
      }
    } catch {
      /* ignore */
    }
    return mergeBotDm(INITIAL_DMS, activeAccountId, user.displayName);
  });

  const [servers, setServers] = useState<Server[]>(() => {
    try {
      if (!localStorage.getItem(CLEAN_EMPTY_START_KEY)) {
        return INITIAL_SERVERS;
      }
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved: Server[] | undefined = JSON.parse(raw).servers;
        if (Array.isArray(saved)) {
          return saved;
        }
      }
    } catch {
      /* ignore */
    }
    return INITIAL_SERVERS;
  });

  const [quests, setQuests] = useState<Quest[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const savedQuests: Quest[] = JSON.parse(raw).quests;
        if (Array.isArray(savedQuests) && savedQuests.length > 0) {
          const claimedMap = new Map(savedQuests.map((q) => [q.id, q.claimed]));
          return INITIAL_QUESTS.map((q) => ({
            ...q,
            claimed: claimedMap.get(q.id) ?? q.claimed,
          }));
        }
      }
    } catch {
      /* ignore */
    }
    return INITIAL_QUESTS;
  });

  const [wishlistIds, setWishlistIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw).wishlistIds || ['bundle-miyabi'];
    } catch {
      /* ignore */
    }
    return ['bundle-miyabi'];
  });

  const [ownedBundleIds, setOwnedBundleIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw).ownedBundleIds || [];
    } catch {
      /* ignore */
    }
    return [];
  });

  const [theme, setTheme] = useState<ThemeMode>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const storedTheme = JSON.parse(raw).theme;
        if (storedTheme === 'vice-city' || storedTheme === 'naruto') return 'onyx';
        return storedTheme || 'onyx';
      }
    } catch {
      /* ignore */
    }
    return 'onyx';
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [screen, setScreen] = useState<MainScreen>('inicio');
  const [activeContext, setActiveContext] = useState<
    | { type: 'dm' }
    | { type: 'favorites' }
    | { type: 'servidores' }
    | { type: 'server'; serverId: string }
  >({ type: 'dm' });
  const [selectedDmId, setSelectedDmId] = useState<string | null>(null);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);

  const [selectedShopBundle, setSelectedShopBundle] = useState<ShopBundle | null>(null);
  const [boostTargetServerId, setBoostTargetServerId] = useState<string | null>(null);
  const [serverSettingsTarget, setServerSettingsTarget] = useState<{
    serverId: string;
    section: ServerSettingsSection;
  } | null>(null);
  const [showCreateServer, setShowCreateServer] = useState(false);
  const [createServerTemplate, setCreateServerTemplate] = useState<ServerTemplateId>('friends');
  const [showDiscover, setShowDiscover] = useState(false);
  const [showNewGroupDm, setShowNewGroupDm] = useState(false);
  const [groupMemberIds, setGroupMemberIds] = useState<string[]>([]);
  const [groupTitle, setGroupTitle] = useState('');
  const [groupEmoji, setGroupEmoji] = useState('💬');
  const [groupColor, setGroupColor] = useState('#5865F2');
  const [groupCustomIconUrl, setGroupCustomIconUrl] = useState<string | undefined>(undefined);
  const groupIconFileRef = useRef<HTMLInputElement>(null);
  const [selectedActivity, setSelectedActivity] = useState<FriendActivity | null>(null);
  const [inspectedUser, setInspectedUser] = useState<{
    profile: PublicUserProfile;
    roles?: ServerRole[];
  } | null>(null);
  const [typingMap, setTypingMap] = useState<Record<string, string | null>>({});
  const [profileEditorRequest, setProfileEditorRequest] = useState<{
    tab: 'principal' | 'servidor';
    serverId?: string;
  } | null>(null);
  const [profileViewTrigger, setProfileViewTrigger] = useState(0);
  const [pendingNitroNamePatch, setPendingNitroNamePatch] = useState<Partial<UserProfile> | null>(
    null
  );
  const [showOwnerPanel, setShowOwnerPanel] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const [firebaseUid, setFirebaseUid] = useState<string | null>(null);
  const [firebaseEmail, setFirebaseEmail] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authProviderNeedsSetup, setAuthProviderNeedsSetup] = useState(false);
  const [joinedServerIds, setJoinedServerIds] = useState<string[]>([]);
  const [claimedQuestIds, setClaimedQuestIds] = useState<string[]>([]);
  const [discoverableServers, setDiscoverableServers] = useState<Server[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequestItem[]>([]);
  const [sentFriendRequestUids, setSentFriendRequestUids] = useState<string[]>([]);
  const [sentFriendRequestItems, setSentFriendRequestItems] = useState<SentFriendRequestItem[]>([]);
  const [liveProfilesByUid, setLiveProfilesByUid] = useState<Record<string, LivePublicProfileEntry>>({});
  const [presenceTick, setPresenceTick] = useState(0);
  const [aiCredits, setAiCredits] = useState<number>(() => {
    const prefs = loadLocalPrefsForAccount(activeAccountId);
    return typeof prefs.aiCredits === 'number' ? prefs.aiCredits : 100;
  });
  const updateAiCredits = useCallback(
    (updater: (prev: number) => number) => {
      setAiCredits((prev) => {
        const next = Math.max(0, Math.floor(updater(prev)));
        saveLocalPrefsForAccount(activeAccountId, { aiCredits: next });
        return next;
      });
    },
    [activeAccountId]
  );
  const [aiConversation, setAiConversation] = useState<AiConversationState>(() =>
    loadAiConversationForAccount(activeAccountId)
  );
  const updateAiConversation = useCallback(
    (updater: (prev: AiConversationState) => AiConversationState) => {
      setAiConversation((prev) => {
        const next = updater(prev);
        saveAiConversationForAccount(activeAccountId, next);
        return next;
      });
    },
    [activeAccountId]
  );
  const [appPreferences, setAppPreferences] = useState<AppPreferences>(() => {
    try {
      const raw = localStorage.getItem(APP_PREFS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          soundsEnabled: parsed.soundsEnabled ?? true,
          chatFontSize: parsed.chatFontSize || 'standard',
          compactMode: Boolean(parsed.compactMode),
          typingIndicatorEnabled: parsed.typingIndicatorEnabled ?? true,
          language: parsed.language || 'es',
          autoTranslateMessages: Boolean(parsed.autoTranslateMessages),
        };
      }
    } catch {
      /* ignore */
    }
    return {
      soundsEnabled: true,
      chatFontSize: 'standard',
      compactMode: false,
      typingIndicatorEnabled: true,
      language: 'es',
      autoTranslateMessages: false,
    };
  });
  const [customServerOrder, setCustomServerOrder] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(SERVER_ORDER_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      /* ignore */
    }
    return [];
  });
  const hydratedUidRef = useRef<string | null>(null);
  const [joinedCuratedIds, setJoinedCuratedIds] = useState<string[]>(() =>
    loadCuratedJoinedIds(activeAccountId)
  );
  const [curatedMessagesByChannel, setCuratedMessagesByChannel] = useState<
    Record<string, ChatMessage[]>
  >(() => loadCuratedMessages(activeAccountId));
  const [dropInRooms] = useState<DropInVoiceRoom[]>(INITIAL_DROPIN_ROOMS);
  const [initialFriendQuery, setInitialFriendQuery] = useState<string | undefined>(undefined);
  const pendingJoinServerRef = useRef<string | null>(null);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const invite = params.get('invite')?.trim();
      const joinSrv = params.get('joinServer')?.trim();
      if (invite) {
        setInitialFriendQuery(invite);
      }
      if (joinSrv) {
        pendingJoinServerRef.current = joinSrv;
      }
      if (invite || joinSrv) {
        window.history.replaceState({}, '', window.location.pathname);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!activeAccountId) return;
    setJoinedCuratedIds(loadCuratedJoinedIds(activeAccountId));
    setCuratedMessagesByChannel(loadCuratedMessages(activeAccountId));
    const localPrefs = loadLocalPrefsForAccount(activeAccountId);
    const expired = Boolean(
      localPrefs.ephemeralNoteExpiresAt && Date.now() >= localPrefs.ephemeralNoteExpiresAt
    );
    setUser((prev) => ({
      ...prev,
      betaTestsCount: localPrefs.betaTestsCount ?? prev.betaTestsCount ?? 0,
      voiceEntryEffect: localPrefs.voiceEntryEffect || prev.voiceEntryEffect || 'none',
      ephemeralNoteExpiresAt: expired ? undefined : localPrefs.ephemeralNoteExpiresAt,
      ...(expired ? { customStatus: '' } : {}),
    }));
    setAiCredits(typeof localPrefs.aiCredits === 'number' ? localPrefs.aiCredits : 100);
    setAiConversation(loadAiConversationForAccount(activeAccountId));
    setDms((prev) => mergeBotDm(prev, activeAccountId, user.displayName));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeAccountId]);

  useEffect(() => {
    if (activeAccountId && initialFriendQuery) {
      setScreen('amigos');
    }
  }, [activeAccountId, initialFriendQuery]);

  const isOwner = useMemo(
    () => isActiveAccountOwner(activeAccountId, accounts, user, firebaseEmail),
    [activeAccountId, accounts, user, firebaseEmail]
  );

  useEffect(() => {
    if (!isOwner && showOwnerPanel) {
      setShowOwnerPanel(false);
    }
  }, [isOwner, showOwnerPanel]);

  const [voiceSession, setVoiceSession] = useState<VoiceSession>({
    active: false,
    channelName: '',
    contextName: '',
    muted: false,
    deafened: false,
    videoOn: false,
    screenSharing: false,
    connectedSeconds: 0,
    participants: [],
  });
  const voiceSessionRef = useRef(voiceSession);
  useEffect(() => {
    voiceSessionRef.current = voiceSession;
  }, [voiceSession]);

  const rtcControllerRef = useRef<DmWebRtcController | null>(null);
  const localAudioStreamRef = useRef<MediaStream | null>(null);
  const localVideoStreamRef = useRef<MediaStream | null>(null);
  const [localVideoStream, setLocalVideoStream] = useState<MediaStream | null>(null);
  const [remoteVideoStream, setRemoteVideoStream] = useState<MediaStream | null>(null);
  const [remoteAudioStream, setRemoteAudioStream] = useState<MediaStream | null>(null);
  const [incomingCalls, setIncomingCalls] = useState<IncomingDmCall[]>([]);
  const [showScreenStudio, setShowScreenStudio] = useState(false);
  const [screenStudioNotice, setScreenStudioNotice] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(CLEAN_EMPTY_START_KEY, '1');
      localStorage.setItem(SHOP_OWNERSHIP_MIGRATION_KEY, '1');
    } catch {
      /* ignore */
    }
  }, []);

  const accountsRef = useRef(accounts);
  useEffect(() => {
    accountsRef.current = accounts;
  }, [accounts]);

  const activeAccountIdRef = useRef(activeAccountId);
  useEffect(() => {
    activeAccountIdRef.current = activeAccountId;
  }, [activeAccountId]);

  const claimingCloudRef = useRef(false);
  const autoCloudAttemptedRef = useRef<string | null>(null);

  const syncAppAccountToCloud = useCallback(
    async (params: {
      accountId: string;
      localUser: UserProfile;
      email?: string | null;
      password?: string | null;
      ownedBundleIds: string[];
      wishlistIds: string[];
      claimedQuestIds: string[];
      joinedServerIds: string[];
      isOwnerAccount: boolean;
      createIfMissing?: boolean;
    }): Promise<boolean> => {
      claimingCloudRef.current = true;
      try {
        const session = await ensureFirebaseSessionForAppAccount({
          email: params.email || params.localUser.email,
          username: params.localUser.username,
          password: params.password,
          createIfMissing: params.createIfMissing,
        });

        if (session.authProviderDisabled) {
          setAuthProviderNeedsSetup(true);
          return false;
        }

        if (!session.uid) return false;

        setAuthProviderNeedsSetup(false);
        const uid = session.uid;
        setFirebaseUid(uid);
        setFirebaseEmail(session.email || null);

        const existingBundle = await fetchUserAccountBundle(uid).catch(() => null);
        if (existingBundle) {
          const resolvedOwner = isOwnerIdentity({
            username: existingBundle.user.username,
            email: session.email,
            isOwnerAccount: existingBundle.isOwnerAccount,
          });
          const safeCloudUser = sanitizeUserShopCosmetics(
            { ...INITIAL_USER, ...existingBundle.user, id: uid },
            existingBundle.ownedBundleIds,
            INITIAL_SHOP_BUNDLES,
            resolvedOwner
          );
          hydratedUidRef.current = uid;
          setUser(safeCloudUser);
          setOwnedBundleIds(existingBundle.ownedBundleIds);
          setWishlistIds(existingBundle.wishlistIds);
          setClaimedQuestIds(existingBundle.claimedQuestIds);
          setQuests(
            INITIAL_QUESTS.map((q) => ({
              ...q,
              claimed: existingBundle.claimedQuestIds.includes(q.id),
            }))
          );
          setJoinedServerIds(existingBundle.joinedServerIds);
        } else {
          const syncedUser: UserProfile = {
            ...params.localUser,
            id: uid,
            username:
              normalizeUsernameHandle(params.localUser.username) ||
              uid.slice(0, 12).toLowerCase(),
          };
          await syncUserAccountToFirestore(uid, syncedUser, {
            ownedBundleIds: params.ownedBundleIds,
            wishlistIds: params.wishlistIds,
            claimedQuestIds: params.claimedQuestIds,
            joinedServerIds: params.joinedServerIds,
            isOwnerAccount: params.isOwnerAccount,
          });
          hydratedUidRef.current = uid;
          setUser(syncedUser);
        }

        setAccounts((prev) => {
          const existsTarget = prev.some((a) => a.id === uid);
          if (existsTarget) {
            return prev.map((a) =>
              a.id === uid
                ? { ...a, user: { ...a.user, id: uid } }
                : a
            );
          }
          const idx = prev.findIndex((a) => a.id === params.accountId);
          if (idx === -1) return prev;
          const updated = [...prev];
          updated[idx] = {
            ...updated[idx],
            id: uid,
            user: { ...updated[idx].user, id: uid },
          };
          return updated;
        });

        setActiveAccountId(uid);
        try {
          localStorage.setItem(SESSION_KEY, uid);
        } catch {
          /* ignore */
        }
        return true;
      } catch (err) {
        console.error('Error syncing app account to cloud:', err);
        return false;
      } finally {
        claimingCloudRef.current = false;
      }
    },
    []
  );

  const localContextRef = useRef({
    user,
    ownedBundleIds,
    wishlistIds,
    claimedQuestIds,
    joinedServerIds,
    isOwner,
  });
  useEffect(() => {
    localContextRef.current = {
      user,
      ownedBundleIds,
      wishlistIds,
      claimedQuestIds,
      joinedServerIds,
      isOwner,
    };
  }, [user, ownedBundleIds, wishlistIds, claimedQuestIds, joinedServerIds, isOwner]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setAuthReady(true);
      if (!fbUser) {
        setFirebaseUid(null);
        setFirebaseEmail(null);
        setSentFriendRequestUids([]);
        setFriendRequests([]);
        hydratedUidRef.current = null;
        setActiveAccountId((prev) => {
          if (!prev) return null;
          const isLocal = accountsRef.current.some((a) => a.id === prev);
          if (!isLocal) {
            try {
              localStorage.removeItem(SESSION_KEY);
            } catch {
              /* ignore */
            }
            return null;
          }
          return prev;
        });
        return;
      }

      setFirebaseUid(fbUser.uid);
      setFirebaseEmail(fbUser.email || null);

      if (claimingCloudRef.current) return;

      try {
        const bundle = await fetchUserAccountBundle(fbUser.uid);
        if (bundle) {
          const resolvedOwner = isOwnerIdentity({
            username: bundle.user.username,
            email: fbUser.email,
            isOwnerAccount: bundle.isOwnerAccount,
          });
          const safeUser = sanitizeUserShopCosmetics(
            { ...INITIAL_USER, ...bundle.user, id: fbUser.uid },
            bundle.ownedBundleIds,
            INITIAL_SHOP_BUNDLES,
            resolvedOwner
          );
          hydratedUidRef.current = fbUser.uid;
          setUser(safeUser);
          setOwnedBundleIds(bundle.ownedBundleIds);
          setWishlistIds(bundle.wishlistIds);
          setClaimedQuestIds(bundle.claimedQuestIds);
          setQuests(
            INITIAL_QUESTS.map((q) => ({
              ...q,
              claimed: bundle.claimedQuestIds.includes(q.id),
            }))
          );
          setJoinedServerIds(bundle.joinedServerIds);
          setDms([]);
          setServers([]);
          setNotifications([]);
          setActiveAccountId(fbUser.uid);
          try {
            localStorage.setItem(SESSION_KEY, fbUser.uid);
          } catch {
            /* ignore */
          }
        } else if (activeAccountIdRef.current) {
          const currentLocalId = activeAccountIdRef.current;
          const savedAcc = accountsRef.current.find((a) => a.id === currentLocalId);
          const ctx = localContextRef.current;
          const baseUser = savedAcc?.user || ctx.user;
          void syncAppAccountToCloud({
            accountId: currentLocalId,
            localUser: { ...baseUser, status: baseUser.status || 'online' },
            email: savedAcc?.user.email || fbUser.email || undefined,
            password: savedAcc?.password,
            ownedBundleIds: savedAcc?.ownedBundleIds || ctx.ownedBundleIds,
            wishlistIds: savedAcc?.wishlistIds || ctx.wishlistIds,
            claimedQuestIds: ctx.claimedQuestIds,
            joinedServerIds: ctx.joinedServerIds,
            isOwnerAccount: Boolean(savedAcc?.isOwnerAccount || ctx.isOwner),
            createIfMissing: true,
          });
        } else {
          hydratedUidRef.current = null;
          setActiveAccountId(null);
        }
      } catch (err) {
        console.error('Error hydrating Firebase user:', err);
      }
    });
    return () => unsub();
  }, [syncAppAccountToCloud]);

  // Migra automáticamente cualquier cuenta creada localmente antes de esta actualización hacia Firestore
  useEffect(() => {
    if (!authReady || firebaseUid || !activeAccountId || claimingCloudRef.current) return;
    if (autoCloudAttemptedRef.current === activeAccountId) return;
    autoCloudAttemptedRef.current = activeAccountId;

    const savedAcc = accounts.find((a) => a.id === activeAccountId);
    const localProfile = savedAcc?.user || user;
    if (!localProfile?.username) return;

    void syncAppAccountToCloud({
      accountId: activeAccountId,
      localUser: localProfile,
      email: savedAcc?.user.email || (savedAcc?.contact?.includes('@') ? savedAcc.contact : undefined),
      password: savedAcc?.password,
      ownedBundleIds: savedAcc?.ownedBundleIds || ownedBundleIds,
      wishlistIds: savedAcc?.wishlistIds || wishlistIds,
      claimedQuestIds,
      joinedServerIds,
      isOwnerAccount: Boolean(savedAcc?.isOwnerAccount),
      createIfMissing: false,
    });
  }, [
    authReady,
    firebaseUid,
    activeAccountId,
    accounts,
    user,
    ownedBundleIds,
    wishlistIds,
    claimedQuestIds,
    joinedServerIds,
    syncAppAccountToCloud,
  ]);

  const flushCloudAccountSync = useCallback(
    (overrides?: {
      user?: UserProfile;
      ownedBundleIds?: string[];
      wishlistIds?: string[];
      claimedQuestIds?: string[];
      joinedServerIds?: string[];
    }) => {
      if (!firebaseUid || hydratedUidRef.current !== firebaseUid) return;
      const nextUser = overrides?.user ?? user;
      const nextOwned = overrides?.ownedBundleIds ?? ownedBundleIds;
      const nextWishlist = overrides?.wishlistIds ?? wishlistIds;
      const nextClaimed = overrides?.claimedQuestIds ?? claimedQuestIds;
      const nextJoined = overrides?.joinedServerIds ?? joinedServerIds;
      void syncUserAccountToFirestore(firebaseUid, nextUser, {
        ownedBundleIds: nextOwned,
        wishlistIds: nextWishlist,
        claimedQuestIds: nextClaimed,
        joinedServerIds: nextJoined,
        isOwnerAccount: isOwner,
      }).catch((err) => console.error('Sync profile error:', err));
    },
    [firebaseUid, user, ownedBundleIds, wishlistIds, claimedQuestIds, joinedServerIds, isOwner]
  );

  useEffect(() => {
    if (!firebaseUid || hydratedUidRef.current !== firebaseUid) return;
    const timer = window.setTimeout(() => {
      flushCloudAccountSync();
    }, 300);
    const handlePageHide = () => flushCloudAccountSync();
    window.addEventListener('beforeunload', handlePageHide);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('beforeunload', handlePageHide);
    };
  }, [firebaseUid, flushCloudAccountSync]);

  useEffect(() => {
    if (!firebaseUid) return;
    const unsubDms = subscribeToDms(firebaseUid, (threads) => {
      setDms((prev) => {
        const msgMap = new Map(prev.map((d) => [d.id, d.messages]));
        const mergedRemote = threads.map((t) => ({
          ...t,
          messages: msgMap.get(t.id) || t.messages || [],
        }));
        const localGroups = prev.filter((d) => !d.isBot && d.id.startsWith('dm-grp-'));
        return mergeBotDm([...localGroups, ...mergedRemote], firebaseUid, user.displayName);
      });
    });

    const unsubNotifs = subscribeToNotifications(firebaseUid, (items) => {
      setNotifications(items);
    });

    const unsubFriendReqs = subscribeToFriendRequests(firebaseUid, (reqs) => {
      setFriendRequests(reqs);
    });

    const unsubSentReqs = subscribeToSentFriendRequests(firebaseUid, (sentUids) => {
      setSentFriendRequestUids(sentUids);
    });

    const unsubSentReqItems = subscribeToSentFriendRequestItems(firebaseUid, (items) => {
      setSentFriendRequestItems(items);
    });

    return () => {
      unsubDms();
      unsubNotifs();
      unsubFriendReqs();
      unsubSentReqs();
      unsubSentReqItems();
    };
  }, [firebaseUid]);

  // Periodically re-evaluate presence staleness (marks inactive/closed users offline after 2 min)
  useEffect(() => {
    const id = window.setInterval(() => {
      setPresenceTick((t) => t + 1);
    }, 30_000);
    return () => window.clearInterval(id);
  }, []);

  // Heartbeat & visibility/unload presence updater so online/offline reflects actual active tabs
  useEffect(() => {
    if (!firebaseUid || hydratedUidRef.current !== firebaseUid) return;
    const preferredStatus = user.status || 'online';

    const pushActivePresence = () => {
      if (document.visibilityState === 'visible') {
        void updateUserPresenceStatus(firebaseUid, preferredStatus);
      }
    };
    const pushOfflinePresence = () => {
      void updateUserPresenceStatus(firebaseUid, 'offline');
    };

    pushActivePresence();
    const heartbeat = window.setInterval(pushActivePresence, 45_000);

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        pushOfflinePresence();
      } else {
        pushActivePresence();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pagehide', pushOfflinePresence);
    window.addEventListener('beforeunload', pushOfflinePresence);

    return () => {
      window.clearInterval(heartbeat);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pagehide', pushOfflinePresence);
      window.removeEventListener('beforeunload', pushOfflinePresence);
    };
  }, [firebaseUid, user.status]);

  const mergedCuratedServers = useMemo<Server[]>(() => {
    return CURATED_PUBLIC_SERVERS.filter((s) => joinedCuratedIds.includes(s.id)).map((srv) => ({
      ...srv,
      channels: srv.channels.map((ch) => {
        const extraMsgs = curatedMessagesByChannel[ch.id] || [];
        const isCurrentVoice =
          voiceSession.active &&
          voiceSession.serverId === srv.id &&
          voiceSession.channelId === ch.id;
        return {
          ...ch,
          messages: extraMsgs.length > 0 ? extraMsgs : ch.messages,
          voiceParticipants:
            ch.type === 'voice' && isCurrentVoice
              ? [
                  ...(ch.voiceParticipants || []),
                  {
                    id: user.id,
                    name: user.displayName,
                    avatar: user.avatar,
                    speaking: !voiceSession.muted,
                  },
                ]
              : ch.voiceParticipants,
        };
      }),
    }));
  }, [
    joinedCuratedIds,
    curatedMessagesByChannel,
    voiceSession.active,
    voiceSession.serverId,
    voiceSession.channelId,
    voiceSession.muted,
    user.id,
    user.displayName,
    user.avatar,
  ]);

  const allServers = useMemo<Server[]>(() => {
    const out = [...servers];
    for (const cs of mergedCuratedServers) {
      if (!out.some((s) => s.id === cs.id)) {
        out.push(cs);
      }
    }
    return out;
  }, [servers, mergedCuratedServers]);

  const activeServer =
    activeContext.type === 'server'
      ? allServers.find((s) => s.id === activeContext.serverId)
      : undefined;
  const activeChannelObj = activeServer?.channels.find((c) => c.id === selectedChannelId);

  // Subscribe to live publicProfiles of DM/friend contacts, server members, and friend requests so status, avatars & name styles update live
  const watchedProfileUidsKey = useMemo(
    () =>
      Array.from(
        new Set([
          ...dms
            .filter((d) => !d.isGroup && d.otherUid && d.otherUid !== firebaseUid)
            .map((d) => d.otherUid as string),
          ...(activeServer?.members || [])
            .map((m) => m.uid)
            .filter((uid) => Boolean(uid) && uid !== firebaseUid),
          ...friendRequests
            .map((r) => r.fromUid)
            .filter((uid) => Boolean(uid) && uid !== firebaseUid),
          ...sentFriendRequestItems
            .map((s) => s.toUid)
            .filter((uid) => Boolean(uid) && uid !== firebaseUid),
        ])
      )
        .sort()
        .slice(0, 50)
        .join('|'),
    [dms, activeServer?.members, friendRequests, sentFriendRequestItems, firebaseUid]
  );

  useEffect(() => {
    if (!firebaseUid || !watchedProfileUidsKey) {
      setLiveProfilesByUid({});
      return;
    }
    const uids = watchedProfileUidsKey.split('|').filter(Boolean);
    return subscribeToPublicProfilesByIds(uids, (map) => {
      setLiveProfilesByUid(map);
    });
  }, [firebaseUid, watchedProfileUidsKey]);

  const livePublicProfilesMap = useMemo<Record<string, PublicUserProfile>>(() => {
    const nowMs = Date.now();
    const out: Record<string, PublicUserProfile> = {};
    for (const [uid, entry] of Object.entries(liveProfilesByUid)) {
      out[uid] = {
        ...entry.profile,
        status: resolveEffectivePresence(entry.rawStatus, entry.updatedAtMs, nowMs),
      };
    }
    return out;
  }, [liveProfilesByUid, presenceTick]);

  // Clean up sender-side pending records once the friendship DM thread exists
  useEffect(() => {
    if (!firebaseUid || sentFriendRequestItems.length === 0) return;
    for (const sent of sentFriendRequestItems) {
      if (dms.some((d) => !d.isGroup && d.otherUid === sent.toUid)) {
        void cancelSentFriendRequest(firebaseUid, sent.toUid).catch(() => undefined);
      }
    }
  }, [firebaseUid, sentFriendRequestItems, dms]);

  const liveDms = useMemo(() => {
    const nowMs = Date.now();
    return dms.map((d) => {
      if (d.isGroup || d.isBot || !d.otherUid) return d;
      const liveEntry = liveProfilesByUid[d.otherUid];
      if (!liveEntry) {
        return {
          ...d,
          status: resolveEffectivePresence(d.status, d.statusUpdatedAtMs, nowMs),
        };
      }
      const lp = liveEntry.profile;
      return {
        ...d,
        name: lp.displayName || d.name,
        username: lp.username || d.username,
        avatar: lp.avatar || d.avatar,
        customAvatarUrl: lp.customAvatarUrl ?? d.customAvatarUrl,
        decoration: lp.decoration ?? d.decoration,
        nameplate: lp.nameplate ?? d.nameplate,
        serverTag: lp.serverTag ?? d.serverTag,
        displayNameStyle: lp.displayNameStyle ?? d.displayNameStyle,
        displayNameColorPreset: lp.displayNameColorPreset ?? d.displayNameColorPreset,
        displayNameCustomColors: lp.displayNameCustomColors ?? d.displayNameCustomColors,
        displayNameGlow: lp.displayNameGlow ?? d.displayNameGlow,
        nitroTier: lp.nitroTier ?? d.nitroTier,
        status: resolveEffectivePresence(liveEntry.rawStatus, liveEntry.updatedAtMs, nowMs),
      };
    });
  }, [dms, liveProfilesByUid, presenceTick]);

  const activeDm = liveDms.find((d) => d.id === selectedDmId) || liveDms[0];

  const activeDmId = activeDm?.id;
  const activeDmIsReal = Boolean(
    firebaseUid &&
      activeContext.type === 'dm' &&
      activeDmId &&
      activeDmId !== PRIMORDIAL_BOT_DM_ID &&
      !activeDmId.startsWith('dm-grp-') &&
      activeDm?.participantIds?.includes(firebaseUid)
  );

  useEffect(() => {
    if (!activeDmIsReal || !activeDmId) return;
    const unsub = subscribeToDmMessages(activeDmId, (msgs) => {
      setDms((prev) => prev.map((d) => (d.id === activeDmId ? { ...d, messages: msgs } : d)));
    });
    return () => unsub();
  }, [activeDmIsReal, activeDmId]);

  const joinedServerIdsKey = joinedServerIds.join('|');
  useEffect(() => {
    if (!firebaseUid) return;
    const ids = joinedServerIds.filter(Boolean);
    if (ids.length === 0) {
      setServers([]);
      return;
    }

    const unsubs = ids.map((srvId) =>
      subscribeToServerDetail(srvId, (srvData) => {
        if (!srvData) {
          setServers((prev) => prev.filter((s) => s.id !== srvId));
          setJoinedServerIds((prev) => (prev.includes(srvId) ? prev.filter((id) => id !== srvId) : prev));
          return;
        }
        setServers((prev) => {
          const existing = prev.find((s) => s.id === srvId);
          const channelMsgMap = new Map(
            (existing?.channels || []).map((c) => [c.id, c.messages])
          );
          const mergedSrv: Server = {
            ...srvData,
            channels: srvData.channels.map((ch) => ({
              ...ch,
              messages: channelMsgMap.get(ch.id) || ch.messages || [],
            })),
          };
          const filtered = prev.filter((s) => ids.includes(s.id) && s.id !== srvId);
          const next = [...filtered, mergedSrv];
          next.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
          return next;
        });
      })
    );

    return () => {
      unsubs.forEach((u) => u());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firebaseUid, joinedServerIdsKey]);

  const activeServerId = activeContext.type === 'server' ? activeContext.serverId : null;
  useEffect(() => {
    if (!firebaseUid || !activeServerId || !selectedChannelId || isCuratedServerId(activeServerId)) {
      return;
    }
    const unsub = subscribeToChannelMessages(activeServerId, selectedChannelId, (msgs) => {
      setServers((prev) =>
        prev.map((s) =>
          s.id === activeServerId
            ? {
                ...s,
                channels: s.channels.map((c) =>
                  c.id === selectedChannelId ? { ...c, messages: msgs } : c
                ),
              }
            : s
        )
      );
    });
    return () => unsub();
  }, [firebaseUid, activeServerId, selectedChannelId]);

  useEffect(() => {
    if (activeContext.type !== 'server') return;
    const srv = allServers.find((s) => s.id === activeContext.serverId);
    if (!srv || srv.channels.length === 0) return;
    const exists = selectedChannelId && srv.channels.some((c) => c.id === selectedChannelId);
    if (!exists) {
      const firstText =
        srv.channels.find((c) => !c.isPrivate && c.type !== 'voice') || srv.channels[0];
      if (firstText) setSelectedChannelId(firstText.id);
    }
  }, [activeContext, allServers, selectedChannelId]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          user,
          dms,
          servers,
          quests,
          wishlistIds,
          ownedBundleIds,
          theme,
        })
      );
    } catch {
      /* ignore */
    }
  }, [user, dms, servers, quests, wishlistIds, ownedBundleIds, theme]);

  useEffect(() => {
    if (!activeAccountId) return;
    setAccounts((prev) => {
      const idx = prev.findIndex((a) => a.id === activeAccountId);
      if (idx === -1) return prev;
      const updated = [...prev];
      updated[idx] = {
        ...updated[idx],
        user,
        ownedBundleIds,
        wishlistIds,
      };
      try {
        localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(updated));
      } catch {
        /* ignore */
      }
      return updated;
    });
  }, [activeAccountId, user, ownedBundleIds, wishlistIds]);

  useEffect(() => {
    try {
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
    } catch {
      /* ignore */
    }
  }, [accounts]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme !== 'light');
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = appPreferences.language || 'es';
  }, [appPreferences.language]);

  const tApp = useCallback(
    (key: TranslationKey) => translateAppText(appPreferences.language || 'es', key),
    [appPreferences.language]
  );

  useEffect(() => {
    if (!voiceSession.active) return;
    const t = setInterval(() => {
      setVoiceSession((prev) => ({ ...prev, connectedSeconds: prev.connectedSeconds + 1 }));
    }, 1000);
    return () => clearInterval(t);
  }, [voiceSession.active]);

  useEffect(() => {
    try {
      localStorage.setItem(APP_PREFS_KEY, JSON.stringify(appPreferences));
    } catch {
      /* ignore */
    }
  }, [appPreferences]);

  useEffect(() => {
    try {
      localStorage.setItem(SERVER_ORDER_KEY, JSON.stringify(customServerOrder));
    } catch {
      /* ignore */
    }
  }, [customServerOrder]);

  const handleUpdateAppPreferences = (patch: Partial<AppPreferences>) => {
    setAppPreferences((prev) => ({ ...prev, ...patch }));
  };

  const orderedServers = useMemo(() => {
    if (customServerOrder.length === 0) return allServers;
    const rank = new Map(customServerOrder.map((id, idx) => [id, idx]));
    return [...allServers].sort((a, b) => {
      const ra = rank.get(a.id);
      const rb = rank.get(b.id);
      if (ra !== undefined && rb !== undefined) return ra - rb;
      if (ra !== undefined) return -1;
      if (rb !== undefined) return 1;
      return 0;
    });
  }, [allServers, customServerOrder]);

  const handleMoveServer = (serverId: string, direction: 'up' | 'down') => {
    const ids = orderedServers.map((s) => s.id);
    const idx = ids.indexOf(serverId);
    if (idx === -1) return;
    const swap = direction === 'up' ? idx - 1 : idx + 1;
    if (swap < 0 || swap >= ids.length) return;
    [ids[idx], ids[swap]] = [ids[swap], ids[idx]];
    setCustomServerOrder(ids);
    triggerHaptic(10);
  };

  const showToastMsg = (msg: string) => {
    setToast(msg);
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, 2800);
  };

  const ownedCosmetics = useMemo(
    () =>
      getOwnedCosmetics(
        isOwner ? INITIAL_SHOP_BUNDLES.map((b) => b.id) : ownedBundleIds,
        INITIAL_SHOP_BUNDLES
      ),
    [ownedBundleIds, isOwner]
  );

  const rewardActivityOrbs = useCallback(
    (
      kind: 'chat' | 'note' | 'voice' | 'invite' | 'discover',
      amount: number,
      reason: string,
      cooldownMs = 60_000
    ) => {
      try {
        const key = `${ACTIVITY_ORBS_KEY_PREFIX}${activeAccountId || 'guest'}`;
        const raw = localStorage.getItem(key);
        const parsed: Record<string, number> = raw ? JSON.parse(raw) : {};
        const last = parsed[kind] || 0;
        const now = Date.now();
        if (now - last < cooldownMs) return false;
        parsed[kind] = now;
        localStorage.setItem(key, JSON.stringify(parsed));
      } catch {
        /* ignore */
      }
      setUser((prev) => {
        const nextUser: UserProfile = {
          ...prev,
          orbs: normalizeOrbs(prev.orbs + amount),
        };
        flushCloudAccountSync({ user: nextUser });
        return nextUser;
      });
      showToastMsg(`+${amount} Orbs · ${reason}`);
      return true;
    },
    [activeAccountId, flushCloudAccountSync]
  );

  useEffect(() => {
    if (!user.ephemeralNoteExpiresAt) return;
    if (Date.now() >= user.ephemeralNoteExpiresAt) {
      saveLocalPrefsForAccount(activeAccountId, {
        voiceEntryEffect: user.voiceEntryEffect,
        ephemeralNoteExpiresAt: undefined,
      });
      setUser((prev) => {
        const nextUser = { ...prev, customStatus: '', ephemeralNoteExpiresAt: undefined };
        flushCloudAccountSync({ user: nextUser });
        return nextUser;
      });
    }
  }, [presenceTick, user.ephemeralNoteExpiresAt, user.voiceEntryEffect, activeAccountId, flushCloudAccountSync]);

  const unreadTotal = useMemo(() => {
    const serverSum = allServers.reduce((acc, s) => acc + (s.badgeCount || 0), 0);
    return serverSum + notifications.filter((n) => n.unread).length;
  }, [allServers, notifications]);

  const unreadNotificationsCount = notifications.filter((n) => n.unread).length;
  const hasUnclaimedQuests = quests.some((q) => !q.claimed);

  const themeClass = theme !== 'onyx' ? `theme-${theme}` : '';


  const handleInspectUser = (
    userId: string,
    fallback?: Partial<PublicUserProfile>,
    roles?: ServerRole[]
  ) => {
    if (userId === 'me' || userId === user.id) {
      setInspectedUser({
        profile: {
          id: user.id,
          displayName: user.displayName,
          username: user.username,
          pronouns: user.pronouns,
          displayNameStyle: user.displayNameStyle,
          displayNameColorPreset: user.displayNameColorPreset,
          displayNameCustomColors: user.displayNameCustomColors,
          displayNameGlow: user.displayNameGlow,
          avatar: user.avatar,
          customAvatarUrl: user.customAvatarUrl,
          status: user.status,
          customStatus: user.customStatus,
          bio: user.bio,
          bannerColor: user.bannerColor,
          bannerImage: user.bannerImage,
          decoration: user.decoration,
          profileEffect: user.profileEffect,
          profileFrame: user.profileFrame,
          nameplate: user.nameplate,
          serverTag: user.serverTag,
          nitroTier: isOwner && user.nitroTier === 'none' ? 'nitro' : user.nitroTier,
          badgeIds: user.equippedBadgeIds,
          memberSince: user.memberSince,
          mutualServers: servers.map((s) => s.name),
        },
        roles,
      });
      return;
    }

    const baseProfile = resolvePublicUserProfile(userId, fallback);
    const matchingDm = liveDms.find(
      (d) =>
        d.id === userId ||
        d.otherUid === userId ||
        d.id === `dm-${userId}` ||
        d.id.replace(/^dm-/, '') === userId
    );
    const targetLiveUid = matchingDm?.otherUid || userId;
    const liveEntry = liveProfilesByUid[targetLiveUid];
    const resolvedStatus = liveEntry
      ? resolveEffectivePresence(liveEntry.rawStatus, liveEntry.updatedAtMs)
      : matchingDm?.status || baseProfile.status;
    const matchingMember = activeServer?.members?.find((m) => m.uid === userId);
    const giftedCosmetics: Partial<PublicUserProfile> = {};
    if (matchingDm?.giftedBundleIds?.length) {
      for (const bid of matchingDm.giftedBundleIds) {
        const b = INITIAL_SHOP_BUNDLES.find((item) => item.id === bid);
        if (!b) continue;
        const deco = b.items.find((i) => i.decorationId)?.decorationId;
        const plate = b.items.find((i) => i.nameplateId)?.nameplateId;
        const banner = b.items.find((i) => i.bannerUrl)?.bannerUrl;
        const fx = b.items.find((i) => i.profileEffectId)?.profileEffectId;
        if (deco) giftedCosmetics.decoration = deco;
        if (plate) giftedCosmetics.nameplate = plate;
        if (banner) giftedCosmetics.bannerImage = banner;
        if (fx) giftedCosmetics.profileEffect = fx;
      }
    }

    setInspectedUser({
      profile: {
        ...baseProfile,
        ...(liveEntry?.profile || {}),
        ...giftedCosmetics,
        status: resolvedStatus,
        displayName: liveEntry?.profile.displayName || matchingMember?.displayName || baseProfile.displayName,
        username: liveEntry?.profile.username || matchingMember?.username || baseProfile.username,
        displayNameStyle:
          liveEntry?.profile.displayNameStyle ??
          matchingDm?.displayNameStyle ??
          baseProfile.displayNameStyle,
        displayNameColorPreset:
          liveEntry?.profile.displayNameColorPreset ??
          matchingDm?.displayNameColorPreset ??
          baseProfile.displayNameColorPreset,
        displayNameCustomColors:
          liveEntry?.profile.displayNameCustomColors ??
          matchingDm?.displayNameCustomColors ??
          baseProfile.displayNameCustomColors,
        displayNameGlow:
          liveEntry?.profile.displayNameGlow ??
          matchingDm?.displayNameGlow ??
          baseProfile.displayNameGlow,
        nitroTier:
          liveEntry?.profile.nitroTier ??
          matchingDm?.nitroTier ??
          baseProfile.nitroTier,
        avatar: liveEntry?.profile.avatar || matchingMember?.avatar || baseProfile.avatar,
        customAvatarUrl:
          liveEntry?.profile.customAvatarUrl ||
          matchingMember?.customAvatarUrl ||
          matchingDm?.customAvatarUrl ||
          baseProfile.customAvatarUrl,
        decoration: matchingDm?.decoration || liveEntry?.profile.decoration || giftedCosmetics.decoration || baseProfile.decoration,
        nameplate: matchingDm?.nameplate || liveEntry?.profile.nameplate || giftedCosmetics.nameplate || baseProfile.nameplate,
      },
      roles,
    });

    if (
      firebaseUid &&
      !liveEntry &&
      targetLiveUid &&
      targetLiveUid !== 'me' &&
      !targetLiveUid.startsWith('bot-') &&
      !baseProfile.isBot
    ) {
      void fetchPublicProfileById(targetLiveUid)
        .then((fresh) => {
          if (!fresh) return;
          setInspectedUser((prev) => {
            if (!prev) return prev;
            if (prev.profile.id !== targetLiveUid && prev.profile.id !== userId) {
              return prev;
            }
            return {
              ...prev,
              profile: {
                ...prev.profile,
                ...fresh,
                ...giftedCosmetics,
                mutualServers: prev.profile.mutualServers,
              },
            };
          });
        })
        .catch(() => undefined);
    }
  };

  const handleSelectDm = (dmId: string) => {
    setSelectedDmId(dmId);
    setSelectedChannelId(null);
    setActiveContext({ type: 'dm' });
    setScreen('inicio');
    setMobileChatOpen(true);
    setDms((prev) =>
      prev.map((d) => (d.id === dmId ? { ...d, unread: false, unreadCount: 0 } : d))
    );
    if (firebaseUid && dmId !== PRIMORDIAL_BOT_DM_ID && !dmId.startsWith('dm-grp-')) {
      void markDmThreadRead(dmId, firebaseUid).catch(() => undefined);
    }
  };

  const handleSelectServer = (serverId: string) => {
    const srv = allServers.find((s) => s.id === serverId);
    const firstText =
      srv?.channels.find((c) => !c.isPrivate && c.type !== 'voice' && c.name.toLowerCase().includes('general')) ||
      srv?.channels.find((c) => !c.isPrivate && c.type !== 'voice') ||
      srv?.channels.find((c) => c.type !== 'voice') ||
      srv?.channels[0];
    setActiveContext({ type: 'server', serverId });
    setSelectedChannelId(firstText?.id || null);
    setScreen('inicio');
    setMobileChatOpen(false);
    setServers((prev) =>
      prev.map((s) => (s.id === serverId ? { ...s, badgeCount: 0, hasUnread: false } : s))
    );
  };

  const handleSelectChannel = (serverId: string, channelId: string) => {
    setActiveContext({ type: 'server', serverId });
    setSelectedChannelId(channelId);
    setScreen('inicio');
    setMobileChatOpen(true);
    setServers((prev) =>
      prev.map((s) =>
        s.id === serverId
          ? {
              ...s,
              channels: s.channels.map((c) =>
                c.id === channelId ? { ...c, unreadCount: 0 } : c
              ),
            }
          : s
      )
    );
  };

  const formatMessagePreview = (payload: {
    content?: string;
    imageUrl?: string;
    sticker?: ChatMessage['sticker'];
    audioNote?: ChatMessage['audioNote'];
    poll?: ChatMessage['poll'];
  }) => {
    if (payload.poll) return `📊 Encuesta: ${payload.poll.question}`;
    if (payload.audioNote) return `🎤 Nota de voz (${payload.audioNote.durationSec}s)`;
    if (payload.sticker) return `🏷️ Sticker: ${payload.sticker.name}`;
    if (payload.imageUrl && !payload.content) return '📷 Foto enviada';
    return payload.content || '';
  };

  const getActiveMessagesCollectionPath = (): string | null => {
    if (activeContext.type === 'server' && activeServer && selectedChannelId) {
      if (isCuratedServerId(activeServer.id)) return null;
      return `servers/${activeServer.id}/channels/${selectedChannelId}/messages`;
    }
    if (activeDm && activeDm.id !== PRIMORDIAL_BOT_DM_ID && !activeDm.id.startsWith('dm-grp-')) {
      return `dms/${activeDm.id}/messages`;
    }
    return null;
  };

  const getActiveMessagesList = (): ChatMessage[] => {
    if (activeContext.type === 'server' && activeServer && selectedChannelId) {
      return activeServer.channels.find((c) => c.id === selectedChannelId)?.messages || [];
    }
    return activeDm?.messages || [];
  };

  const sendToWelcomeBot = (rawText: string) => {
    const preview = rawText.trim() || 'Mensaje';
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      authorId: user.id || 'me',
      authorName: user.displayName,
      authorAvatar: user.avatar,
      timestamp: 'Ahora',
      content: rawText,
      reactions: [],
    };
    setDms((prev) => {
      const next = prev.map((d) => {
        if (d.id !== PRIMORDIAL_BOT_DM_ID) return d;
        const updated: DirectMessageThread = {
          ...d,
          lastMessagePreview: `Tú: ${preview}`,
          lastTimestamp: 'Ahora',
          unread: false,
          unreadCount: 0,
          messages: [...d.messages, userMsg],
        };
        saveBotDmForAccount(activeAccountId, updated);
        return updated;
      });
      return next;
    });
    setTypingMap((prev) => ({
      ...prev,
      [PRIMORDIAL_BOT_DM_ID]: 'Primordial Bot está escribiendo...',
    }));
    window.setTimeout(() => {
      const botMsg = generateBotReply(rawText, user, theme);
      setTypingMap((prev) => ({ ...prev, [PRIMORDIAL_BOT_DM_ID]: null }));
      playUiSound('receive', appPreferences.soundsEnabled);
      setDms((prev) =>
        prev.map((d) => {
          if (d.id !== PRIMORDIAL_BOT_DM_ID) return d;
          const updated: DirectMessageThread = {
            ...d,
            lastMessagePreview: botMsg.content.replace(/\*\*/g, '').slice(0, 72),
            lastTimestamp: botMsg.timestamp,
            messages: [...d.messages, botMsg],
          };
          saveBotDmForAccount(activeAccountId, updated);
          return updated;
        })
      );
    }, 360);
    rewardActivityOrbs('chat', 15, 'Chat con Primordial Bot', 120_000);
  };

  const handleSendRichMessage = (payload: RichMessagePayload) => {
    const hasEveryone = Boolean(
      payload.mentionEveryone || /(^|\s)[@/]everyone(\s|$|[.,!?:;])/i.test(payload.content || '')
    );
    playUiSound(hasEveryone ? 'ping' : 'send', appPreferences.soundsEnabled);
    triggerHaptic(8);

    if (activeContext.type === 'server' && activeServer && selectedChannelId) {
      const targetServerId = activeServer.id;
      const targetChannelId = selectedChannelId;
      setTypingMap((prev) => ({ ...prev, [targetChannelId]: null }));

      if (isCuratedServerId(targetServerId)) {
        const localMsg: ChatMessage = {
          id: `msg-${Date.now()}`,
          authorId: user.id || 'me',
          authorName: user.displayName,
          authorAvatar: user.avatar,
          timestamp: 'Ahora',
          content: payload.content,
          mentionEveryone: hasEveryone,
          replyTo: payload.replyTo,
          imageUrl: payload.imageUrl,
          sticker: payload.sticker,
          audioNote: payload.audioNote,
          poll: payload.poll,
          reactions: [],
        };
        setCuratedMessagesByChannel((prev) => {
          const base =
            prev[targetChannelId] ||
            activeServer.channels.find((c) => c.id === targetChannelId)?.messages ||
            [];
          const next = { ...prev, [targetChannelId]: [...base, localMsg] };
          saveCuratedMessages(activeAccountId, next);
          return next;
        });
        rewardActivityOrbs('chat', 15, 'Actividad en comunidad', 60_000);
        return;
      }

      if (firebaseUid) {
        void sendChannelMessage({
          serverId: targetServerId,
          serverName: activeServer.name,
          channelId: targetChannelId,
          channelName: activeChannelObj?.name || 'general',
          currentUser: user,
          memberUids: (activeServer.members || []).map((m) => m.uid),
          content: payload.content,
          mentionEveryone: hasEveryone,
          replyTo: payload.replyTo,
          imageUrl: payload.imageUrl,
          sticker: payload.sticker,
          audioNote: payload.audioNote,
          poll: payload.poll,
        }).catch(() => {
          showToastMsg('No se pudo enviar el mensaje. Inténtalo de nuevo.');
        });
        rewardActivityOrbs('chat', 15, 'Actividad en servidor', 60_000);
        if (hasEveryone) {
          showToastMsg('Mención @everyone enviada a todos los miembros del servidor');
        }
        return;
      }

      const localMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        authorId: user.id || 'me',
        authorName: user.displayName,
        authorAvatar: user.avatar,
        timestamp: 'Ahora',
        content: payload.content,
        mentionEveryone: hasEveryone,
        replyTo: payload.replyTo,
        imageUrl: payload.imageUrl,
        sticker: payload.sticker,
        audioNote: payload.audioNote,
        poll: payload.poll,
        reactions: [],
      };
      setServers((prev) =>
        prev.map((s) =>
          s.id === targetServerId
            ? {
                ...s,
                channels: s.channels.map((c) =>
                  c.id === targetChannelId ? { ...c, messages: [...c.messages, localMsg] } : c
                ),
              }
            : s
        )
      );
      rewardActivityOrbs('chat', 15, 'Actividad en servidor', 60_000);
      return;
    }

    if (activeDm) {
      const targetId = activeDm.id;
      setTypingMap((prev) => ({ ...prev, [targetId]: null }));

      if (targetId === PRIMORDIAL_BOT_DM_ID) {
        sendToWelcomeBot(payload.content || formatMessagePreview(payload));
        return;
      }

      if (firebaseUid && !targetId.startsWith('dm-grp-')) {
        const recipients = activeDm.participantIds || (activeDm.otherUid ? [activeDm.otherUid] : []);
        void sendDmMessage({
          dmId: targetId,
          currentUser: user,
          recipientUids: recipients,
          content: payload.content,
          replyTo: payload.replyTo,
          imageUrl: payload.imageUrl,
          sticker: payload.sticker,
          audioNote: payload.audioNote,
          poll: payload.poll,
        }).catch(() => {
          showToastMsg('No se pudo enviar el mensaje directo.');
        });
        rewardActivityOrbs('chat', 15, 'Mensaje enviado', 60_000);
        return;
      }

      const preview = formatMessagePreview(payload);
      const localMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        authorId: user.id || 'me',
        authorName: user.displayName,
        authorAvatar: user.avatar,
        timestamp: 'Ahora',
        content: payload.content,
        replyTo: payload.replyTo,
        imageUrl: payload.imageUrl,
        sticker: payload.sticker,
        audioNote: payload.audioNote,
        poll: payload.poll,
        reactions: [],
      };
      setDms((prev) =>
        prev.map((d) =>
          d.id === targetId
            ? {
                ...d,
                lastMessagePreview: `Tú: ${preview}`,
                lastTimestamp: 'Ahora',
                unread: false,
                unreadCount: 0,
                messages: [...d.messages, localMsg],
              }
            : d
        )
      );
      rewardActivityOrbs('chat', 15, 'Actividad en chat', 60_000);
    }
  };

  const handleSendMessage = (
    text: string,
    replyTo?: { authorName: string; content: string },
    imageUrl?: string
  ) => {
    handleSendRichMessage({ content: text, replyTo, imageUrl });
  };

  const mapActiveMessages = (
    updater: (msgs: ChatMessage[]) => ChatMessage[],
    dmPreviewUpdater?: (msgs: ChatMessage[]) => Partial<DirectMessageThread>
  ) => {
    if (activeContext.type === 'server' && activeServer && selectedChannelId) {
      if (isCuratedServerId(activeServer.id)) {
        setCuratedMessagesByChannel((prev) => {
          const base =
            prev[selectedChannelId] ||
            activeServer.channels.find((c) => c.id === selectedChannelId)?.messages ||
            [];
          const next = { ...prev, [selectedChannelId]: updater(base) };
          saveCuratedMessages(activeAccountId, next);
          return next;
        });
        return;
      }
      setServers((prev) =>
        prev.map((s) =>
          s.id === activeServer.id
            ? {
                ...s,
                channels: s.channels.map((c) =>
                  c.id === selectedChannelId ? { ...c, messages: updater(c.messages) } : c
                ),
              }
            : s
        )
      );
    } else if (activeDm) {
      setDms((prev) =>
        prev.map((d) => {
          if (d.id !== activeDm.id) return d;
          const nextMsgs = updater(d.messages);
          const extra = dmPreviewUpdater ? dmPreviewUpdater(nextMsgs) : {};
          const updated = { ...d, messages: nextMsgs, ...extra };
          if (d.id === PRIMORDIAL_BOT_DM_ID) {
            saveBotDmForAccount(activeAccountId, updated);
          }
          return updated;
        })
      );
    }
  };

  const handleEditMessage = (messageId: string, newContent: string) => {
    const targetMsg = getActiveMessagesList().find((m) => m.id === messageId);
    if (!targetMsg) return;
    if (targetMsg.authorId !== user.id && targetMsg.authorId !== 'me') {
      showToastMsg('Solo puedes editar tus propios mensajes');
      return;
    }

    const collPath = getActiveMessagesCollectionPath();
    if (firebaseUid && collPath) {
      void updateFirestoreMessage({
        collectionPath: collPath,
        messageId,
        patch: { content: newContent, edited: true, editedAt: 'Ahora' },
      }).catch(() => showToastMsg('No se pudo editar el mensaje'));
    }

    mapActiveMessages(
      (msgs) =>
        msgs.map((m) =>
          m.id === messageId ? { ...m, content: newContent, edited: true, editedAt: 'Ahora' } : m
        ),
      (nextMsgs) => {
        const last = nextMsgs[nextMsgs.length - 1];
        if (!last) return {};
        return {
          lastMessagePreview:
            last.authorId === user.id || last.authorId === 'me'
              ? `Tú: ${formatMessagePreview(last)}`
              : `${last.authorName}: ${formatMessagePreview(last)}`,
        };
      }
    );
    showToastMsg('Mensaje editado');
  };

  const handleDeleteMessage = (messageId: string) => {
    const targetMsg = getActiveMessagesList().find((m) => m.id === messageId);
    if (!targetMsg) return;
    const isAuthor = targetMsg.authorId === user.id || targetMsg.authorId === 'me';
    const canDelete =
      isAuthor || (activeContext.type === 'server' && canManageServer(activeServer, user.id));
    if (!canDelete) {
      showToastMsg('Solo el autor o un administrador puede eliminar este mensaje');
      return;
    }

    const collPath = getActiveMessagesCollectionPath();
    if (firebaseUid && collPath) {
      void deleteFirestoreMessage(collPath, messageId).catch(() =>
        showToastMsg('No se pudo eliminar el mensaje')
      );
    }

    mapActiveMessages(
      (msgs) => msgs.filter((m) => m.id !== messageId),
      (nextMsgs) => {
        const last = nextMsgs[nextMsgs.length - 1];
        if (!last) {
          return { lastMessagePreview: 'Sin mensajes recientes', lastTimestamp: '' };
        }
        return {
          lastMessagePreview:
            last.authorId === user.id || last.authorId === 'me'
              ? `Tú: ${formatMessagePreview(last)}`
              : `${last.authorName}: ${formatMessagePreview(last)}`,
          lastTimestamp: last.timestamp,
        };
      }
    );
    showToastMsg('Mensaje eliminado');
  };

  const handleTogglePinMessage = (messageId: string) => {
    const targetMsg = getActiveMessagesList().find((m) => m.id === messageId);
    if (!targetMsg) return;
    const isAuthor = targetMsg.authorId === user.id || targetMsg.authorId === 'me';
    const { canPinMessages } = getServerPermissions(activeServer, user.id);
    if (activeContext.type === 'server' && !isAuthor && !canPinMessages) {
      showToastMsg('Necesitas permiso de fijar mensajes o administrador para fijar mensajes ajenos');
      return;
    }
    const nextPinned = !targetMsg.pinned;
    const collPath = getActiveMessagesCollectionPath();
    if (firebaseUid && collPath) {
      void updateFirestoreMessage({
        collectionPath: collPath,
        messageId,
        patch: { pinned: nextPinned },
      }).catch(() => showToastMsg('No se pudo fijar el mensaje'));
    }

    mapActiveMessages((msgs) =>
      msgs.map((m) => (m.id === messageId ? { ...m, pinned: nextPinned } : m))
    );
    showToastMsg(nextPinned ? 'Mensaje fijado en el chat' : 'Mensaje desfijado');
  };

  const handleVotePoll = (messageId: string, optionId: string) => {
    const voterId = user.id || 'me';
    const targetMsg = getActiveMessagesList().find((m) => m.id === messageId);
    if (!targetMsg?.poll) return;

    const alreadyVotedThis = targetMsg.poll.options
      .find((o) => o.id === optionId)
      ?.votes.some((v) => v === voterId || v === 'me');

    const nextPoll = {
      ...targetMsg.poll,
      options: targetMsg.poll.options.map((o) => {
        const withoutMe = o.votes.filter((v) => v !== voterId && v !== 'me');
        if (o.id === optionId && !alreadyVotedThis) {
          return { ...o, votes: [...withoutMe, voterId] };
        }
        return { ...o, votes: withoutMe };
      }),
    };

    const collPath = getActiveMessagesCollectionPath();
    if (firebaseUid && collPath) {
      void updateFirestoreMessage({
        collectionPath: collPath,
        messageId,
        patch: { poll: nextPoll },
      }).catch(() => undefined);
    }

    mapActiveMessages((msgs) =>
      msgs.map((m) => (m.id === messageId ? { ...m, poll: nextPoll } : m))
    );
  };

  const handleForwardMessage = (
    msg: ChatMessage,
    target: { type: 'dm' | 'channel'; id: string; serverId?: string; label: string }
  ) => {
    const originLabel =
      activeContext.type === 'server' && activeServer
        ? `${activeServer.name}`
        : activeDm?.name || 'Chat';
    const forwardedContent = msg.content
      ? `↪ Reenviado de ${msg.authorName} (${originLabel}): ${msg.content}`
      : `↪ Mensaje reenviado de ${msg.authorName}`;

    if (firebaseUid) {
      if (target.type === 'dm' && !target.id.startsWith('dm-grp-')) {
        const targetDm = dms.find((d) => d.id === target.id);
        const recipients = targetDm?.participantIds || (targetDm?.otherUid ? [targetDm.otherUid] : []);
        void sendDmMessage({
          dmId: target.id,
          currentUser: user,
          recipientUids: recipients,
          content: forwardedContent,
          imageUrl: msg.imageUrl,
          sticker: msg.sticker,
        }).catch(() => undefined);
      } else if (target.type === 'channel' && target.serverId) {
        const targetSrv = servers.find((s) => s.id === target.serverId);
        const targetCh = targetSrv?.channels.find((c) => c.id === target.id);
        void sendChannelMessage({
          serverId: target.serverId,
          serverName: targetSrv?.name || 'Servidor',
          channelId: target.id,
          channelName: targetCh?.name || 'general',
          currentUser: user,
          memberUids: (targetSrv?.members || []).map((m) => m.uid),
          content: forwardedContent,
          imageUrl: msg.imageUrl,
          sticker: msg.sticker,
        }).catch(() => undefined);
      }
      showToastMsg(`Mensaje reenviado a ${target.label}`);
      return;
    }

    const forwardedMsg: ChatMessage = {
      id: `fwd-${Date.now()}`,
      authorId: user.id || 'me',
      authorName: user.displayName,
      authorAvatar: user.avatar,
      timestamp: 'Ahora',
      content: msg.content,
      imageUrl: msg.imageUrl,
      sticker: msg.sticker,
      forwardedFrom: {
        authorName: msg.authorName,
        originLabel,
        content: msg.content,
      },
      reactions: [],
    };
    const preview = formatMessagePreview(forwardedMsg) || 'Mensaje reenviado';

    if (target.type === 'dm') {
      setDms((prev) =>
        prev.map((d) =>
          d.id === target.id
            ? {
                ...d,
                lastMessagePreview: `Tú: ↪ ${preview}`,
                lastTimestamp: 'Ahora',
                messages: [...d.messages, forwardedMsg],
              }
            : d
        )
      );
    } else if (target.type === 'channel' && target.serverId) {
      setServers((prev) =>
        prev.map((s) =>
          s.id === target.serverId
            ? {
                ...s,
                channels: s.channels.map((c) =>
                  c.id === target.id ? { ...c, messages: [...c.messages, forwardedMsg] } : c
                ),
              }
            : s
        )
      );
    }
    showToastMsg(`Mensaje reenviado a ${target.label}`);
  };

  const handleToggleDmPin = (dmId: string) => {
    setDms((prev) => prev.map((d) => (d.id === dmId ? { ...d, pinned: !d.pinned } : d)));
  };

  const handleToggleDmMute = (dmId: string) => {
    setDms((prev) => prev.map((d) => (d.id === dmId ? { ...d, muted: !d.muted } : d)));
  };

  const handleToggleDmUnread = (dmId: string) => {
    setDms((prev) =>
      prev.map((d) =>
        d.id === dmId
          ? { ...d, unread: !d.unread, unreadCount: !d.unread ? Math.max(1, d.unreadCount || 1) : 0 }
          : d
      )
    );
  };

  const handleToggleDmFavorite = (dmId: string) => {
    setDms((prev) => prev.map((d) => (d.id === dmId ? { ...d, favorite: !d.favorite } : d)));
  };

  const handleCloseDm = (dmId: string) => {
    if (dmId === PRIMORDIAL_BOT_DM_ID) {
      showToastMsg('Primordial Bot siempre permanece fijado como tu guía.');
      return;
    }
    setDms((prev) => {
      const next = prev.filter((d) => d.id !== dmId);
      if (selectedDmId === dmId) {
        setSelectedDmId(next[0]?.id || null);
      }
      return next;
    });
    showToastMsg('Conversación cerrada');
  };

  const handleToggleReaction = (messageId: string, emoji: string) => {
    const targetMsg = getActiveMessagesList().find((m) => m.id === messageId);
    const collPath = getActiveMessagesCollectionPath();
    if (targetMsg && firebaseUid && collPath) {
      const existing = targetMsg.reactions.find((r) => r.emoji === emoji);
      const nextReactions = existing
        ? existing.count - (existing.reacted ? 1 : -1) <= 0
          ? targetMsg.reactions.filter((r) => r.emoji !== emoji)
          : targetMsg.reactions.map((r) =>
              r.emoji === emoji
                ? {
                    ...r,
                    count: existing.reacted ? r.count - 1 : r.count + 1,
                    reacted: !r.reacted,
                  }
                : r
            )
        : [...targetMsg.reactions, { emoji, count: 1, reacted: true }];

      void updateFirestoreMessage({
        collectionPath: collPath,
        messageId,
        patch: { reactions: nextReactions },
      }).catch(() => undefined);
    }

    const toggleInList = (msgs: DirectMessageThread['messages']) =>
      msgs.map((m) => {
        if (m.id !== messageId) return m;
        const existing = m.reactions.find((r) => r.emoji === emoji);
        if (existing) {
          const nextCount = existing.reacted ? existing.count - 1 : existing.count + 1;
          return {
            ...m,
            reactions:
              nextCount <= 0
                ? m.reactions.filter((r) => r.emoji !== emoji)
                : m.reactions.map((r) =>
                    r.emoji === emoji ? { ...r, count: nextCount, reacted: !r.reacted } : r
                  ),
          };
        }
        return { ...m, reactions: [...m.reactions, { emoji, count: 1, reacted: true }] };
      });

    mapActiveMessages((msgs) => toggleInList(msgs));
  };

  const unlockBadgeHelper = (
    prev: UserProfile,
    badgeId: BadgeId
  ): Pick<UserProfile, 'unlockedBadgeIds' | 'equippedBadgeIds'> => {
    const unlocked = prev.unlockedBadgeIds.includes(badgeId)
      ? prev.unlockedBadgeIds
      : [...prev.unlockedBadgeIds, badgeId];
    const equipped = prev.equippedBadgeIds.includes(badgeId)
      ? prev.equippedBadgeIds
      : [...prev.equippedBadgeIds, badgeId];
    return { unlockedBadgeIds: unlocked, equippedBadgeIds: equipped };
  };

  const handleClaimQuest = (questId: string) => {
    const q = quests.find((item) => item.id === questId);
    if (!q || q.claimed) return;
    const rawBonus = user.nitroTier === 'nitro' ? Math.round(q.rewardOrbs * 1.2) : q.rewardOrbs;
    const bonus = q.isLimitedTime ? Math.min(300, rawBonus) : rawBonus;
    const nextClaimed = claimedQuestIds.includes(questId)
      ? claimedQuestIds
      : [...claimedQuestIds, questId];
    const nextUser: UserProfile = {
      ...user,
      orbs: user.orbs + bonus,
      ...unlockBadgeHelper(user, 'orbs'),
    };
    setClaimedQuestIds(nextClaimed);
    setQuests((prev) => prev.map((item) => (item.id === questId ? { ...item, claimed: true } : item)));
    setUser(nextUser);
    flushCloudAccountSync({ user: nextUser, claimedQuestIds: nextClaimed });
    showToastMsg(`¡Conseguiste +${bonus} Orbs y la insignia Aprendiz de Orbs!`);
  };

  const handleBoostServer = (serverId: string, amount: number, orbCost: number) => {
    if (user.orbs < orbCost) {
      showToastMsg('No tienes suficientes Orbs para esta mejora');
      return;
    }
    const target = servers.find((s) => s.id === serverId);
    if (!target) return;
    const nextBoosts = (target.boostCount ?? 0) + amount;
    const nextLevel = nextBoosts >= 14 ? 3 : nextBoosts >= 5 ? 2 : nextBoosts >= 1 ? 1 : 0;

    if (firebaseUid) {
      void updateFirestoreServer(serverId, {
        boostCount: nextBoosts,
        boostLevel: nextLevel,
      }).catch(() => undefined);
    }
    setServers((prev) =>
      prev.map((s) =>
        s.id === serverId ? { ...s, boostCount: nextBoosts, boostLevel: nextLevel } : s
      )
    );
    setUser((prev) => ({
      ...prev,
      orbs: prev.orbs - orbCost,
      boostsGiven: prev.boostsGiven + amount,
      boostStreakMonths: Math.max(1, prev.boostStreakMonths + amount),
      ...unlockBadgeHelper(prev, 'mejora'),
    }));
    showToastMsg(
      `¡Mejoraste ${target.name} (+${amount})! Banner desbloqueado · Nivel ${nextLevel}`
    );
  };

  const assertServerAdmin = (serverId: string): Server | null => {
    const target = servers.find((s) => s.id === serverId);
    if (!target) return null;
    if (!canManageServer(target, user.id)) {
      showToastMsg('No tienes permiso de administrador para modificar este servidor');
      return null;
    }
    return target;
  };

  const handleUpdateServer = (serverId: string, patch: Partial<Server>) => {
    const localOnlyKeys = new Set(['muted', 'badgeCount', 'hasUnread']);
    const patchKeys = Object.keys(patch).filter((k) => patch[k as keyof Server] !== undefined);
    const isLocalOnlyPatch = patchKeys.length > 0 && patchKeys.every((k) => localOnlyKeys.has(k));

    if (!isLocalOnlyPatch && !assertServerAdmin(serverId)) return;
    setServers((prev) => prev.map((s) => (s.id === serverId ? { ...s, ...patch } : s)));
    if (firebaseUid && !isLocalOnlyPatch) {
      void updateFirestoreServer(serverId, patch).catch(() =>
        showToastMsg('No se pudieron guardar algunos cambios en el servidor')
      );
    }
  };

  const handleToggleMemberAdmin = (serverId: string, targetUid: string, makeAdmin: boolean) => {
    const srv = servers.find((s) => s.id === serverId);
    if (!srv || !isServerOwner(srv, user.id)) {
      showToastMsg('Solo el dueño del servidor puede otorgar o revocar permisos de administrador');
      return;
    }
    if (targetUid === srv.ownerId) return;

    setServers((prev) =>
      prev.map((s) => {
        if (s.id !== serverId) return s;
        const nextAdmins = makeAdmin
          ? Array.from(new Set([...(s.adminIds || []), targetUid]))
          : (s.adminIds || []).filter((id) => id !== targetUid);
        return {
          ...s,
          adminIds: nextAdmins,
          members: (s.members || []).map((m) =>
            m.uid === targetUid ? { ...m, isAdmin: makeAdmin } : m
          ),
        };
      })
    );

    if (firebaseUid) {
      void toggleServerMemberAdmin({ serverId, targetUid, makeAdmin }).catch(() =>
        showToastMsg('Error actualizando permisos de administrador')
      );
    }
    showToastMsg(makeAdmin ? 'Permisos de administrador otorgados' : 'Permisos de administrador revocados');
  };

  const handleUpdateMemberRoles = (serverId: string, targetUid: string, roleIds: string[]) => {
    const srv = servers.find((s) => s.id === serverId);
    if (!srv) return;
    const { canManageServer: canManageSrv, canManageRoles } = getServerPermissions(srv, user.id);
    if (!canManageSrv && !canManageRoles) {
      showToastMsg('No tienes permiso para gestionar roles en este servidor');
      return;
    }
    const hasAdminRole = srv.roles?.some(
      (r) => roleIds.includes(r.id) && r.permissions.includes('Administrador')
    );
    const memberIsAdmin = Boolean(
      targetUid === srv.ownerId || srv.adminIds?.includes(targetUid) || hasAdminRole
    );

    setServers((prev) =>
      prev.map((s) =>
        s.id === serverId
          ? {
              ...s,
              memberRoleIds: { ...(s.memberRoleIds || {}), [targetUid]: roleIds },
              members: (s.members || []).map((m) =>
                m.uid === targetUid ? { ...m, roleIds, isAdmin: memberIsAdmin } : m
              ),
            }
          : s
      )
    );

    if (firebaseUid) {
      void updateServerMemberRolesInFirestore({
        serverId,
        targetUid,
        roleIds,
        isAdmin: memberIsAdmin,
      }).catch(() => showToastMsg('Error al actualizar roles del miembro'));
    }
  };

  const handleKickMember = (serverId: string, targetUid: string, memberName: string) => {
    const srv = servers.find((s) => s.id === serverId);
    if (!srv) return;
    const { canKickMembers } = getServerPermissions(srv, user.id);
    if (!canKickMembers) {
      showToastMsg('No tienes permiso para expulsar miembros en este servidor');
      return;
    }
    if (targetUid === srv.ownerId || targetUid === user.id) {
      showToastMsg('No puedes expulsar al dueño ni a ti mismo');
      return;
    }

    setServers((prev) =>
      prev.map((s) => {
        if (s.id !== serverId) return s;
        const nextRoleMap = { ...(s.memberRoleIds || {}) };
        delete nextRoleMap[targetUid];
        return {
          ...s,
          adminIds: (s.adminIds || []).filter((id) => id !== targetUid),
          members: (s.members || []).filter((m) => m.uid !== targetUid),
          memberRoleIds: nextRoleMap,
          memberCount: Math.max(1, (s.memberCount || 1) - 1),
        };
      })
    );

    if (firebaseUid) {
      void kickFirestoreServerMember(serverId, targetUid).catch(() =>
        showToastMsg('No se pudo expulsar al miembro en la nube')
      );
    }
    showToastMsg(`${memberName} fue expulsado de ${srv.name}`);
  };

  const handleOpenServerSettings = (
    serverId: string,
    section: ServerSettingsSection = 'menu'
  ) => {
    setServerSettingsTarget({ serverId, section });
    setScreen('servidor-ajustes');
  };

  const handleMarkServerRead = (serverId: string) => {
    setServers((prev) =>
      prev.map((s) =>
        s.id === serverId
          ? {
              ...s,
              badgeCount: 0,
              hasUnread: false,
              channels: s.channels.map((c) => ({ ...c, unreadCount: 0 })),
            }
          : s
      )
    );
    showToastMsg('Todo marcado como leído');
  };

  const handleAddChannel = (
    serverId: string,
    data: { name: string; type: Channel['type']; category: string; isPrivate?: boolean }
  ) => {
    const srv = assertServerAdmin(serverId);
    if (!srv) return;
    const cats = srv.categoriesOrder || Array.from(new Set(['', ...srv.channels.map((c) => c.category)]));
    const nextCats = cats.includes(data.category) ? cats : [...cats, data.category];

    if (firebaseUid) {
      void createFirestoreChannel({
        serverId,
        name: data.name,
        type: data.type,
        category: data.category || 'Canales de texto',
        isPrivate: data.isPrivate,
        topic: `Canal ${data.name}`,
        position: srv.channels.length,
      }).catch(() => showToastMsg('No se pudo crear el canal'));
      if (!cats.includes(data.category)) {
        void updateFirestoreServer(serverId, { categoriesOrder: nextCats }).catch(() => undefined);
      }
      showToastMsg(`Canal #${data.name} creado`);
      return;
    }

    const newCh: Channel = {
      id: `ch-${Date.now()}`,
      name: data.name,
      type: data.type,
      category: data.category,
      isPrivate: data.isPrivate,
      topic: `Canal ${data.name}`,
      voiceParticipants: data.type === 'voice' ? [] : undefined,
      messages: [],
    };
    setServers((prev) =>
      prev.map((s) =>
        s.id === serverId ? { ...s, categoriesOrder: nextCats, channels: [...s.channels, newCh] } : s
      )
    );
    showToastMsg(`Canal #${data.name} creado`);
  };

  const handleUpdateChannel = (serverId: string, channelId: string, patch: Partial<Channel>) => {
    if (!assertServerAdmin(serverId)) return;
    if (firebaseUid) {
      void updateFirestoreChannel({
        serverId,
        channelId,
        patch: {
          name: patch.name,
          category: patch.category,
          isPrivate: patch.isPrivate,
          topic: patch.topic,
        },
      }).catch(() => showToastMsg('Error actualizando el canal'));
    }
    setServers((prev) =>
      prev.map((s) =>
        s.id === serverId
          ? {
              ...s,
              channels: s.channels.map((c) => (c.id === channelId ? { ...c, ...patch } : c)),
            }
          : s
      )
    );
    showToastMsg('Canal actualizado');
  };

  const handleDeleteChannel = (serverId: string, channelId: string) => {
    if (!assertServerAdmin(serverId)) return;
    if (firebaseUid) {
      void deleteFirestoreChannel(serverId, channelId).catch(() =>
        showToastMsg('No se pudo eliminar el canal')
      );
    }
    setServers((prev) =>
      prev.map((s) =>
        s.id === serverId
          ? { ...s, channels: s.channels.filter((c) => c.id !== channelId) }
          : s
      )
    );
    if (selectedChannelId === channelId) {
      const srv = servers.find((s) => s.id === serverId);
      const next = srv?.channels.find((c) => c.id !== channelId && c.type !== 'voice');
      setSelectedChannelId(next?.id || null);
    }
    showToastMsg('Canal eliminado');
  };

  const handleMoveChannel = (serverId: string, channelId: string, direction: -1 | 1) => {
    const srv = assertServerAdmin(serverId);
    if (!srv) return;
    const target = srv.channels.find((c) => c.id === channelId);
    if (!target) return;
    const sameCatIndices = srv.channels
      .map((c, idx) => (c.category === target.category ? idx : -1))
      .filter((idx) => idx !== -1);
    const pos = sameCatIndices.indexOf(srv.channels.findIndex((c) => c.id === channelId));
    const swapPos = pos + direction;
    if (swapPos < 0 || swapPos >= sameCatIndices.length) return;
    const a = sameCatIndices[pos];
    const b = sameCatIndices[swapPos];
    const nextChannels = [...srv.channels];
    [nextChannels[a], nextChannels[b]] = [nextChannels[b], nextChannels[a]];

    setServers((prev) =>
      prev.map((s) => (s.id === serverId ? { ...s, channels: nextChannels } : s))
    );
    if (firebaseUid) {
      void Promise.all([
        updateFirestoreChannel({ serverId, channelId: nextChannels[a].id, patch: { position: a } }),
        updateFirestoreChannel({ serverId, channelId: nextChannels[b].id, patch: { position: b } }),
      ]).catch(() => undefined);
    }
  };

  const handleAddCategory = (serverId: string, categoryName: string) => {
    const srv = assertServerAdmin(serverId);
    if (!srv) return;
    const cats = srv.categoriesOrder || Array.from(new Set(['', ...srv.channels.map((c) => c.category)]));
    if (cats.includes(categoryName)) return;
    const nextCats = [...cats, categoryName];
    setServers((prev) =>
      prev.map((s) => (s.id === serverId ? { ...s, categoriesOrder: nextCats } : s))
    );
    if (firebaseUid) {
      void updateFirestoreServer(serverId, { categoriesOrder: nextCats }).catch(() => undefined);
    }
    showToastMsg(`Categoría "${categoryName}" creada`);
  };

  const handleRenameCategory = (serverId: string, oldName: string, newName: string) => {
    const srv = assertServerAdmin(serverId);
    if (!srv) return;
    const nextCats = (srv.categoriesOrder || []).map((c) => (c === oldName ? newName : c));
    setServers((prev) =>
      prev.map((s) =>
        s.id === serverId
          ? {
              ...s,
              categoriesOrder: nextCats,
              channels: s.channels.map((ch) =>
                ch.category === oldName ? { ...ch, category: newName } : ch
              ),
            }
          : s
      )
    );
    if (firebaseUid) {
      void updateFirestoreServer(serverId, { categoriesOrder: nextCats }).catch(() => undefined);
      srv.channels
        .filter((ch) => ch.category === oldName)
        .forEach((ch) => {
          void updateFirestoreChannel({ serverId, channelId: ch.id, patch: { category: newName } }).catch(
            () => undefined
          );
        });
    }
    showToastMsg(`Categoría renombrada a "${newName}"`);
  };

  const handleDeleteCategory = (serverId: string, categoryName: string) => {
    const srv = assertServerAdmin(serverId);
    if (!srv) return;
    const nextCats = (srv.categoriesOrder || []).filter((c) => c !== categoryName);
    setServers((prev) =>
      prev.map((s) =>
        s.id === serverId
          ? {
              ...s,
              categoriesOrder: nextCats,
              channels: s.channels.map((ch) =>
                ch.category === categoryName ? { ...ch, category: '' } : ch
              ),
            }
          : s
      )
    );
    if (firebaseUid) {
      void updateFirestoreServer(serverId, { categoriesOrder: nextCats }).catch(() => undefined);
      srv.channels
        .filter((ch) => ch.category === categoryName)
        .forEach((ch) => {
          void updateFirestoreChannel({ serverId, channelId: ch.id, patch: { category: '' } }).catch(
            () => undefined
          );
        });
    }
    showToastMsg(`Categoría "${categoryName}" eliminada`);
  };

  const handleMoveCategory = (serverId: string, categoryName: string, direction: -1 | 1) => {
    const srv = assertServerAdmin(serverId);
    if (!srv) return;
    const cats = Array.from(
      new Set([...(srv.categoriesOrder || ['']), ...srv.channels.map((c) => c.category)])
    );
    const named = cats.filter((c) => c !== '');
    const idx = named.indexOf(categoryName);
    const swap = idx + direction;
    if (idx === -1 || swap < 0 || swap >= named.length) return;
    [named[idx], named[swap]] = [named[swap], named[idx]];
    const nextCats = cats.includes('') ? ['', ...named] : named;
    setServers((prev) =>
      prev.map((s) => (s.id === serverId ? { ...s, categoriesOrder: nextCats } : s))
    );
    if (firebaseUid) {
      void updateFirestoreServer(serverId, { categoriesOrder: nextCats }).catch(() => undefined);
    }
  };

  const handleUnlockServerPerk = (serverId: string, perkId: string, tagLabel?: string) => {
    const srv = assertServerAdmin(serverId);
    if (!srv) return;
    const current = srv.unlockedPerkIds || [];
    if (current.includes(perkId)) return;
    const nextPerks = [...current, perkId];
    setServers((prev) =>
      prev.map((s) =>
        s.id === serverId
          ? {
              ...s,
              unlockedPerkIds: nextPerks,
              ...(tagLabel ? { activeServerTag: tagLabel } : {}),
            }
          : s
      )
    );
    if (firebaseUid) {
      void updateFirestoreServer(serverId, {
        unlockedPerkIds: nextPerks,
        ...(tagLabel ? { activeServerTag: tagLabel } : {}),
      }).catch(() => undefined);
    }
    if (tagLabel) {
      setUser((prev) => ({ ...prev, serverTag: tagLabel }));
    }
    showToastMsg('¡Ventaja de servidor activada!');
  };

  const handleGiftBundle = (bundle: ShopBundle, recipientId: string, recipientName: string) => {
    if (user.orbs < bundle.priceOrbs) {
      showToastMsg('No tienes suficientes Orbs para enviar este regalo');
      return;
    }
    const giftedDeco = bundle.items.find((i) => i.decorationId)?.decorationId;
    const giftedPlate = bundle.items.find((i) => i.nameplateId)?.nameplateId;
    const giftMsg: ChatMessage = {
      id: `gift-${Date.now()}`,
      authorId: 'me',
      authorName: user.displayName,
      authorAvatar: user.avatar,
      timestamp: 'Ahora',
      content: `🎁 ¡Te envié un regalo de la Tienda: **${bundle.title}**!`,
      reactions: [{ emoji: '🎁', count: 1, reacted: true }],
    };
    setDms((prev) =>
      prev.map((d) => {
        if (d.id !== recipientId) return d;
        const currentGifts = d.giftedBundleIds || [];
        return {
          ...d,
          lastMessagePreview: `Tú: 🎁 ¡Te envié ${bundle.title}!`,
          lastTimestamp: 'Ahora',
          giftedBundleIds: currentGifts.includes(bundle.id)
            ? currentGifts
            : [...currentGifts, bundle.id],
          ...(giftedDeco ? { decoration: giftedDeco } : {}),
          ...(giftedPlate ? { nameplate: giftedPlate } : {}),
          messages: [...d.messages, giftMsg],
        };
      })
    );
    const nextUser: UserProfile = {
      ...user,
      orbs: user.orbs - bundle.priceOrbs,
      giftsSent: user.giftsSent + 1,
      ...unlockBadgeHelper(user, 'regalos'),
    };
    setUser(nextUser);
    flushCloudAccountSync({ user: nextUser });
    showToastMsg(`¡Regalo enviado a ${recipientName}! Ya lo luce en su perfil`);
  };

  const handleLogStreamHour = () => {
    const nextHours = user.streamHours + 1;
    const nextUser: UserProfile = {
      ...user,
      streamHours: nextHours,
      ...(nextHours >= 1 ? unlockBadgeHelper(user, 'transmision') : {}),
    };
    setUser(nextUser);
    flushCloudAccountSync({ user: nextUser });
    showToastMsg('¡+1 hora transmitida! Progreso de Transmisión actualizado');
  };

  const handleLogGamePlayed = (gameName: string) => {
    const nextGames = user.gamesPlayedCount + 1;
    const nextUser: UserProfile = {
      ...user,
      gamesPlayedCount: nextGames,
      ...(nextGames >= 2 ? unlockBadgeHelper(user, 'juegos') : {}),
    };
    setUser(nextUser);
    flushCloudAccountSync({ user: nextUser });
    showToastMsg(`¡Partida registrada en ${gameName}!`);
  };

  const handleAdvanceAccountYear = () => {
    const nextYears = (user.accountYears || 0) + 1;
    const nextUser: UserProfile = {
      ...user,
      accountYears: nextYears,
      ...(nextYears >= 1 ? unlockBadgeHelper(user, 'antiguedad') : {}),
    };
    setUser(nextUser);
    flushCloudAccountSync({ user: nextUser });
    const antiquityDef = BADGE_DEFINITIONS.find((b) => b.id === 'antiguedad');
    const reachedTier = antiquityDef?.tiers
      .slice()
      .reverse()
      .find((t) => nextYears >= t.threshold);
    showToastMsg(
      `¡Antigüedad avanzada a ${nextYears} ${nextYears === 1 ? 'año' : 'años'}${
        reachedTier ? ` (${reachedTier.name})` : ''
      }!`
    );
  };

  const handleLogBetaTest = () => {
    const nextTests = (user.betaTestsCount || 0) + 1;
    saveLocalPrefsForAccount(activeAccountId, { betaTestsCount: nextTests });
    const nextUser: UserProfile = {
      ...user,
      betaTestsCount: nextTests,
      ...unlockBadgeHelper(user, 'cazabugs'),
    };
    setUser(nextUser);
    flushCloudAccountSync({ user: nextUser });
    const betaDef = BADGE_DEFINITIONS.find((b) => b.id === 'cazabugs');
    const reachedTier = betaDef?.tiers
      .slice()
      .reverse()
      .find((t) => nextTests >= t.threshold);
    showToastMsg(
      `¡Prueba Beta #${nextTests} registrada${reachedTier ? ` · ${reachedTier.name}` : ''}!`
    );
  };

  const handleBuyBundle = (bundle: ShopBundle, useOrbs: boolean) => {
    if (ownedBundleIds.includes(bundle.id)) return;
    if (!useOrbs && !isOwner) {
      showToastMsg(
        `El pago en USD (${bundle.priceUsd}) requiere método verificado. Usa tus Orbs o gana más en Misiones.`
      );
      return;
    }
    if (!isOwner && user.orbs < bundle.priceOrbs) {
      showToastMsg('No tienes suficientes Orbs');
      return;
    }
    const nextOwned = [...ownedBundleIds, bundle.id];
    const deco = bundle.items.find((i) => i.decorationId)?.decorationId;
    const plate = bundle.items.find((i) => i.nameplateId)?.nameplateId;
    const banner = bundle.items.find((i) => i.bannerUrl)?.bannerUrl;
    const effect = bundle.items.find((i) => i.profileEffectId)?.profileEffectId;
    const frame = bundle.items.find((i) => i.profileFrameId)?.profileFrameId;
    const uiTheme = bundle.items.find((i) => i.uiThemeId)?.uiThemeId;
    const voiceEffect = bundle.items.find((i) => i.voiceEntryEffectId)?.voiceEntryEffectId;
    const exclusiveBadge = bundle.items.find((i) => i.exclusiveBadgeId)?.exclusiveBadgeId;
    const orbsCost = isOwner && !useOrbs ? 0 : isOwner && user.orbs < bundle.priceOrbs ? 0 : bundle.priceOrbs;
    const nextUser: UserProfile = {
      ...user,
      orbs: Math.max(0, user.orbs - orbsCost),
      ...(deco ? { decoration: deco } : {}),
      ...(plate ? { nameplate: plate } : {}),
      ...(banner ? { bannerImage: banner } : {}),
      ...(effect ? { profileEffect: effect } : {}),
      ...(frame ? { profileFrame: frame } : {}),
      ...(voiceEffect ? { voiceEntryEffect: voiceEffect } : {}),
      ...(exclusiveBadge ? unlockBadgeHelper(user, exclusiveBadge) : {}),
    };
    if (uiTheme) {
      setTheme(uiTheme);
    }
    if (voiceEffect) {
      saveLocalPrefsForAccount(activeAccountId, {
        voiceEntryEffect: voiceEffect,
        ephemeralNoteExpiresAt: nextUser.ephemeralNoteExpiresAt,
      });
      playVoiceEntryEffect(voiceEffect, appPreferences.soundsEnabled);
    }
    setOwnedBundleIds(nextOwned);
    setUser(nextUser);
    flushCloudAccountSync({ user: nextUser, ownedBundleIds: nextOwned });
    showToastMsg(`¡${bundle.title} adquirido y aplicado en tu perfil!`);
  };

  const handleEquipBundle = (bundle: ShopBundle) => {
    if (!ownedBundleIds.includes(bundle.id) && !isOwner) {
      showToastMsg('Compra este lote en la Tienda para equiparlo en tu perfil');
      return;
    }
    const deco = bundle.items.find((i) => i.decorationId)?.decorationId;
    const plate = bundle.items.find((i) => i.nameplateId)?.nameplateId;
    const banner = bundle.items.find((i) => i.bannerUrl)?.bannerUrl;
    const effect = bundle.items.find((i) => i.profileEffectId)?.profileEffectId;
    const frame = bundle.items.find((i) => i.profileFrameId)?.profileFrameId;
    const uiTheme = bundle.items.find((i) => i.uiThemeId)?.uiThemeId;
    const voiceEffect = bundle.items.find((i) => i.voiceEntryEffectId)?.voiceEntryEffectId;
    const exclusiveBadge = bundle.items.find((i) => i.exclusiveBadgeId)?.exclusiveBadgeId;

    if (uiTheme) {
      setTheme(uiTheme);
    }
    if (voiceEffect) {
      saveLocalPrefsForAccount(activeAccountId, {
        voiceEntryEffect: voiceEffect,
        ephemeralNoteExpiresAt: user.ephemeralNoteExpiresAt,
      });
      playVoiceEntryEffect(voiceEffect, appPreferences.soundsEnabled);
    }

    if (deco || plate || banner || effect || frame || uiTheme || voiceEffect || exclusiveBadge) {
      const nextUser: UserProfile = {
        ...user,
        ...(deco ? { decoration: deco } : {}),
        ...(plate ? { nameplate: plate } : {}),
        ...(banner ? { bannerImage: banner } : {}),
        ...(effect ? { profileEffect: effect } : {}),
        ...(frame ? { profileFrame: frame } : {}),
        ...(voiceEffect ? { voiceEntryEffect: voiceEffect } : {}),
        ...(exclusiveBadge ? unlockBadgeHelper(user, exclusiveBadge) : {}),
      };
      setUser(nextUser);
      flushCloudAccountSync({ user: nextUser });
      showToastMsg(`${bundle.title} aplicado correctamente`);
    }
  };

  const handleLoginAccount = (account: StoredAccount) => {
    const owned = account.ownedBundleIds || [];
    const resolvedOwner = isOwnerIdentity({
      username: account.user.username,
      email: account.user.email || account.contact,
      isOwnerAccount: account.isOwnerAccount,
    });
    const safeUser = sanitizeUserShopCosmetics(
      {
        ...INITIAL_USER,
        ...account.user,
        orbs: normalizeOrbs(account.user.orbs),
      },
      owned,
      INITIAL_SHOP_BUNDLES,
      resolvedOwner
    );
    autoCloudAttemptedRef.current = account.id;
    setActiveAccountId(account.id);
    setUser(safeUser);
    setOwnedBundleIds(owned);
    setWishlistIds(account.wishlistIds || []);
    setScreen('inicio');
    setMobileChatOpen(false);
    try {
      localStorage.setItem(SESSION_KEY, account.id);
    } catch {
      /* ignore */
    }
    showToastMsg(`¡Sesión iniciada como ${safeUser.displayName}!`);
    void syncAppAccountToCloud({
      accountId: account.id,
      localUser: safeUser,
      email: safeUser.email || (account.contact.includes('@') ? account.contact : undefined),
      password: account.password,
      ownedBundleIds: owned,
      wishlistIds: account.wishlistIds || [],
      claimedQuestIds,
      joinedServerIds,
      isOwnerAccount: Boolean(account.isOwnerAccount),
      createIfMissing: false,
    });
  };

  const handleCloudLogin = async (
    identifier: string,
    password: string,
    extraEmails: string[] = []
  ): Promise<CloudLoginResult> => {
    claimingCloudRef.current = true;
    try {
      const res = await signInCloudAccountWithCredentials(identifier, password, extraEmails);
      if (res.authProviderDisabled) {
        setAuthProviderNeedsSetup(true);
        showToastMsg('Activa Correo/Anónimo en Firebase Auth para iniciar sesión desde otro dispositivo');
        return {
          ok: false,
          errorReason: 'provider-disabled',
          errorMessage:
            'El acceso en la nube con correo/contraseña está desactivado en Firebase Auth. Crea una cuenta nueva o usa una cuenta guardada.',
        };
      }
      if (!res.uid) {
        if (res.errorReason === 'wrong-password') {
          showToastMsg('Contraseña incorrecta para esta cuenta en la nube');
          return {
            ok: false,
            errorReason: 'wrong-password',
            errorMessage: 'Contraseña incorrecta.',
          };
        }
        if (res.errorReason === 'too-many-requests') {
          return {
            ok: false,
            errorReason: 'too-many-requests',
            errorMessage: 'Demasiados intentos seguidos en Firebase. Espera un minuto y vuelve a probar.',
          };
        }
        if (res.errorReason === 'network') {
          return {
            ok: false,
            errorReason: 'network',
            errorMessage: 'Sin conexión estable con el servidor de autenticación. Reintenta en un momento.',
          };
        }
        if (res.errorReason === 'invalid-credential') {
          return {
            ok: false,
            errorReason: 'invalid-credential',
            errorMessage:
              'No encontramos una cuenta con esos datos o la contraseña no coincide. Verifica tu usuario, correo o teléfono.',
          };
        }
        return {
          ok: false,
          errorReason: res.errorReason || 'not-found',
          errorMessage: 'No encontramos esa cuenta en la nube ni en este dispositivo.',
        };
      }

      let bundle = await fetchUserAccountBundle(res.uid).catch(() => null);
      if (!bundle) {
        const emailPrefix = (res.email || identifier || 'usuario')
          .split('@')[0]
          .replace(/[^a-zA-Z0-9_.-]/g, '')
          .slice(0, 24);
        const fallbackHandle =
          normalizeUsernameHandle(`${emailPrefix}_${res.uid.slice(0, 4)}`) ||
          `user_${res.uid.slice(0, 8).toLowerCase()}`;
        bundle = await claimProfileWithUsername({
          uid: res.uid,
          email: res.email,
          displayName: emailPrefix || 'Usuario',
          username: fallbackHandle,
          avatar: 'discord-blurple',
        }).catch(() => null);
      }

      if (!bundle) {
        return {
          ok: false,
          errorReason: 'unknown',
          errorMessage: 'Se verificó tu acceso, pero no se pudo cargar tu perfil desde la nube.',
        };
      }

      const realCloudEmail =
        res.email && !res.email.endsWith('@users.primordial.app') ? res.email : undefined;

      const resolvedOwner = isOwnerIdentity({
        username: bundle.user.username,
        email: res.email,
        isOwnerAccount: bundle.isOwnerAccount,
      });
      const safeCloudUser = sanitizeUserShopCosmetics(
        {
          ...INITIAL_USER,
          ...bundle.user,
          id: res.uid,
          ...(realCloudEmail ? { email: bundle.user.email || realCloudEmail } : {}),
        },
        bundle.ownedBundleIds,
        INITIAL_SHOP_BUNDLES,
        resolvedOwner
      );
      const newAcc: StoredAccount = {
        id: res.uid,
        contact: realCloudEmail || identifier.trim(),
        password,
        isOwnerAccount: resolvedOwner,
        user: safeCloudUser,
        ownedBundleIds: bundle.ownedBundleIds,
        wishlistIds: bundle.wishlistIds,
      };
      setAccounts((prev) => {
        const filtered = prev.filter((a) => a.id !== res.uid);
        const nextList = [...filtered, newAcc];
        try {
          localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(nextList));
        } catch {
          /* ignore */
        }
        return nextList;
      });
      hydratedUidRef.current = res.uid;
      setFirebaseUid(res.uid);
      setFirebaseEmail(res.email || null);
      setUser(safeCloudUser);
      setOwnedBundleIds(bundle.ownedBundleIds);
      setWishlistIds(bundle.wishlistIds);
      setClaimedQuestIds(bundle.claimedQuestIds);
      setQuests(
        INITIAL_QUESTS.map((q) => ({
          ...q,
          claimed: bundle.claimedQuestIds.includes(q.id),
        }))
      );
      setJoinedServerIds(bundle.joinedServerIds);
      setActiveAccountId(res.uid);
      setScreen('inicio');
      setMobileChatOpen(false);
      try {
        localStorage.setItem(SESSION_KEY, res.uid);
      } catch {
        /* ignore */
      }
      showToastMsg(
        `¡Bienvenido, ${safeCloudUser.displayName}! (${bundle.ownedBundleIds.length} compras sincronizadas)`
      );
      return { ok: true };
    } finally {
      claimingCloudRef.current = false;
    }
  };

  const handleRegisterAccount = (payload: {
    contact: string;
    contactType: 'phone' | 'email';
    displayName: string;
    username: string;
    password: string;
    avatar: AvatarKey;
    twoFactorEnabled?: boolean;
    backupCodes?: string[];
  }) => {
    const cleanHandle = normalizeUsernameHandle(payload.username) || `user${Date.now().toString().slice(-5)}`;
    const newId = `acc-${Date.now()}`;
    const newUser: UserProfile = {
      id: `me-${Date.now()}`,
      displayName: payload.displayName,
      username: cleanHandle,
      ...(payload.contactType === 'email' && !payload.contact.endsWith('@users.primordial.app')
        ? { email: payload.contact }
        : { phone: payload.contact }),
      pronouns: '',
      status: 'online',
      customStatus: '',
      bio: '¡Nuevo en Primordial!',
      bannerColor: '#5865F2',
      avatar: payload.avatar,
      decoration: 'none',
      profileEffect: 'none',
      profileFrame: 'none',
      nameplate: 'none',
      orbs: 1200,
      memberSince: 'Nov 2026',
      note: '',
      nitroTier: 'none',
      unlockedBadgeIds: ['hypesquad'],
      equippedBadgeIds: ['hypesquad'],
      boostsGiven: 0,
      boostStreakMonths: 0,
      giftsSent: 0,
      streamHours: 0,
      gamesPlayedCount: 0,
      accountYears: 0,
    };
    const hasExistingOwner = accounts.some((acc) =>
      isOwnerIdentity({
        username: acc.user.username,
        email: acc.user.email,
        contact: acc.contact,
        isOwnerAccount: acc.isOwnerAccount,
      })
    );
    const shouldPinOwner =
      !hasExistingOwner &&
      isOwnerIdentity({
        username: cleanHandle,
        email: payload.contactType === 'email' ? payload.contact : undefined,
      });

    const newAccount: StoredAccount = {
      id: newId,
      contact: payload.contact,
      password: payload.password,
      twoFactorEnabled: payload.twoFactorEnabled,
      backupCodes: payload.backupCodes,
      isOwnerAccount: shouldPinOwner,
      user: newUser,
      ownedBundleIds: [],
      wishlistIds: [],
    };
    autoCloudAttemptedRef.current = newId;
    hydratedUidRef.current = null;
    setFirebaseUid(null);
    setFirebaseEmail(null);
    setAccounts((prev) => normalizeSingleOwnerAccounts([...prev, newAccount]));
    setActiveAccountId(newId);
    setUser(newUser);
    setOwnedBundleIds([]);
    setWishlistIds([]);
    setClaimedQuestIds([]);
    setJoinedServerIds([]);
    setJoinedCuratedIds([]);
    setCuratedMessagesByChannel({});
    setServers([]);
    setDms(mergeBotDm([], newId, payload.displayName));
    setNotifications([]);
    setFriendRequests([]);
    setSentFriendRequestUids([]);
    setSentFriendRequestItems([]);
    setLiveProfilesByUid({});
    setAiCredits(100);
    setAiConversation(DEFAULT_AI_CONVERSATION);
    setActiveContext({ type: 'dm' });
    setSelectedDmId(null);
    setSelectedChannelId(null);
    setScreen('inicio');
    setMobileChatOpen(false);
    setShowOwnerPanel(false);
    try {
      localStorage.setItem(SESSION_KEY, newId);
    } catch {
      /* ignore */
    }
    showToastMsg(`¡Bienvenido a Primordial, ${payload.displayName}! (+1.200 Orbs)`);
    void syncAppAccountToCloud({
      accountId: newId,
      localUser: newUser,
      email: payload.contactType === 'email' ? payload.contact : undefined,
      password: payload.password,
      ownedBundleIds: [],
      wishlistIds: [],
      claimedQuestIds: [],
      joinedServerIds: [],
      isOwnerAccount: shouldPinOwner,
      createIfMissing: true,
    });
  };

  const handleResetAccountPassword = (accountId: string, newPassword: string) => {
    setAccounts((prev) => {
      const updated = prev.map((acc) =>
        acc.id === accountId ? { ...acc, password: newPassword } : acc
      );
      try {
        localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(updated));
      } catch {
        /* ignore */
      }
      return updated;
    });
    showToastMsg('Contraseña actualizada de forma segura');
  };

  const handleOwnerUpdateProfile = (patch: Partial<UserProfile>, ensureBundleIds?: string[]) => {
    if (!isOwner) return;
    const nextOwned =
      ensureBundleIds && ensureBundleIds.length > 0
        ? Array.from(new Set([...ownedBundleIds, ...ensureBundleIds]))
        : ownedBundleIds;
    if (nextOwned.length !== ownedBundleIds.length) {
      setOwnedBundleIds(nextOwned);
    }
    const nextUser = sanitizeUserShopCosmetics(
      { ...user, ...patch },
      nextOwned,
      INITIAL_SHOP_BUNDLES,
      true
    );
    setUser(nextUser);
    flushCloudAccountSync({ user: nextUser, ownedBundleIds: nextOwned });
  };

  const handleOwnerUnlockAllShopBundles = () => {
    if (!isOwner) return;
    const allIds = INITIAL_SHOP_BUNDLES.map((b) => b.id);
    setOwnedBundleIds(allIds);
    flushCloudAccountSync({ ownedBundleIds: allIds });
    showToastMsg(`¡Todos los ${allIds.length} lotes de la Tienda desbloqueados!`);
  };

  const handleOwnerClearAllShopBundles = () => {
    if (!isOwner) return;
    setOwnedBundleIds([]);
    const nextUser = sanitizeUserShopCosmetics(user, [], INITIAL_SHOP_BUNDLES, true);
    setUser(nextUser);
    flushCloudAccountSync({ user: nextUser, ownedBundleIds: [] });
    showToastMsg('Inventario de tienda vaciado');
  };

  const handleOwnerUnlockAllBadges = () => {
    if (!isOwner) return;
    const allBadgeIds = BADGE_DEFINITIONS.map((b) => b.id);
    const maxBetaTests = Math.max(user.betaTestsCount || 0, 6);
    saveLocalPrefsForAccount(activeAccountId, { betaTestsCount: maxBetaTests });
    const nextUser: UserProfile = {
      ...user,
      nitroTier: user.nitroTier === 'none' ? 'nitro' : user.nitroTier,
      unlockedBadgeIds: allBadgeIds,
      equippedBadgeIds: allBadgeIds,
      boostsGiven: Math.max(user.boostsGiven || 0, 12),
      boostStreakMonths: Math.max(user.boostStreakMonths || 0, 24),
      giftsSent: Math.max(user.giftsSent || 0, 25),
      streamHours: Math.max(user.streamHours || 0, 250),
      gamesPlayedCount: Math.max(user.gamesPlayedCount || 0, 40),
      accountYears: Math.max(user.accountYears || 0, 9),
      betaTestsCount: maxBetaTests,
    };
    setUser(nextUser);
    flushCloudAccountSync({ user: nextUser });
    showToastMsg('¡Todas las insignias y logros desbloqueados al máximo!');
  };

  const handleOwnerUnlockAllEverything = () => {
    if (!isOwner) return;
    const allIds = INITIAL_SHOP_BUNDLES.map((b) => b.id);
    const allBadgeIds = BADGE_DEFINITIONS.map((b) => b.id);
    const maxBetaTests = Math.max(user.betaTestsCount || 0, 6);
    saveLocalPrefsForAccount(activeAccountId, { betaTestsCount: maxBetaTests });
    setOwnedBundleIds(allIds);
    const nextUser = sanitizeUserShopCosmetics(
      {
        ...user,
        orbs: 999_999_999_999_999,
        nitroTier: 'nitro',
        unlockedBadgeIds: allBadgeIds,
        equippedBadgeIds: allBadgeIds,
        boostsGiven: Math.max(user.boostsGiven || 0, 12),
        boostStreakMonths: Math.max(user.boostStreakMonths || 0, 24),
        giftsSent: Math.max(user.giftsSent || 0, 25),
        streamHours: Math.max(user.streamHours || 0, 250),
        gamesPlayedCount: Math.max(user.gamesPlayedCount || 0, 40),
        accountYears: Math.max(user.accountYears || 0, 9),
        betaTestsCount: maxBetaTests,
      },
      allIds,
      INITIAL_SHOP_BUNDLES,
      true
    );
    setUser(nextUser);
    flushCloudAccountSync({ user: nextUser, ownedBundleIds: allIds });
    showToastMsg('¡Todo desbloqueado al máximo para tu cuenta Owner!');
  };

  const handleLogout = () => {
    const signingOutUid = firebaseUid;
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignore */
    }
    hydratedUidRef.current = null;
    autoCloudAttemptedRef.current = null;
    claimingCloudRef.current = false;
    setShowOwnerPanel(false);
    setActiveAccountId(null);
    setJoinedServerIds([]);
    setJoinedCuratedIds([]);
    setCuratedMessagesByChannel({});
    setDms([]);
    setServers([]);
    setNotifications([]);
    setFriendRequests([]);
    setSentFriendRequestUids([]);
    setSentFriendRequestItems([]);
    setLiveProfilesByUid({});
    setIncomingCalls([]);
    setScreen('inicio');
    setMobileChatOpen(false);
    const doSignOut = async () => {
      if (signingOutUid) {
        await updateUserPresenceStatus(signingOutUid, 'offline').catch(() => undefined);
      }
      await signOut(auth).catch(() => undefined);
    };
    void doSignOut();
  };

  const handleAddServer = (nameOrConfig: string | CreateServerPayload) => {
    const config: CreateServerPayload =
      typeof nameOrConfig === 'string'
        ? {
            name: nameOrConfig,
            templateId: 'custom',
            audience: 'community',
            accentColor: '#5865F2',
            chatTheme: 'black',
            chatMessageStyle: 'classic',
            includeBots: false,
            includeStarterRoles: true,
            includeVoiceChannels: true,
          }
        : nameOrConfig;

    if (firebaseUid) {
      void createFirestoreServer({
        uid: firebaseUid,
        currentUser: user,
        payload: config,
      })
        .then((createdSrv) => {
          setServers((prev) =>
            prev.some((s) => s.id === createdSrv.id) ? prev : [...prev, createdSrv]
          );
          setJoinedServerIds((prev) =>
            prev.includes(createdSrv.id) ? prev : [...prev, createdSrv.id]
          );
          const firstCh =
            createdSrv.channels.find((c) => !c.isPrivate && c.type !== 'voice') ||
            createdSrv.channels[0];
          setActiveContext({ type: 'server', serverId: createdSrv.id });
          setSelectedChannelId(firstCh?.id || null);
          setScreen('inicio');
          setMobileChatOpen(false);
          showToastMsg(`Servidor "${createdSrv.name}" creado`);
        })
        .catch((err) => {
          console.error('Error creating server in Firestore:', err);
          showToastMsg('No se pudo crear el servidor en la nube. Inténtalo de nuevo.');
        });
      return;
    }

    const name = config.name;
    const communityVisual = {
      customIconUrl: config.customIconUrl,
      bannerImage: undefined,
      accentColor: config.accentColor || '#5865F2',
    };

    const shortCode = name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 3)
      .toUpperCase();

    const now = Date.now();
    const welcomeMessages: ChatMessage[] = [
      {
        id: `welcome-${now}`,
        authorId: user.id || 'me',
        authorName: user.displayName,
        authorAvatar: user.avatar,
        timestamp: 'Ahora',
        content: `¡Servidor **${name}** creado!`,
        reactions: [],
      },
    ];

    const makeTextChannel = (chName: string, topic: string, type: Channel['type'] = 'text'): Channel => ({
      id: `ch-${now}-${chName}`,
      name: chName,
      type,
      category: 'CANALES DE TEXTO',
      topic,
      messages: chName === 'general' ? welcomeMessages : [],
    });

    const templateTextChannels: Channel[] = (() => {
      switch (config.templateId) {
        case 'friends':
          return [
            makeTextChannel('general', `Charla diaria en ${name}`),
            makeTextChannel('memes-y-fotos', 'Comparte clips, capturas y memes'),
            makeTextChannel('off-topic', 'Cualquier tema libre'),
          ];
        case 'gaming':
          return [
            makeTextChannel('general', `Centro de operaciones de ${name}`),
            makeTextChannel('buscar-equipo', 'Arma tu squad y coordina horarios'),
            makeTextChannel('clips', 'Mejores jugadas y momentos'),
            makeTextChannel('estrategia', 'Guías, builds y tácticas'),
          ];
        case 'community':
          return [
            makeTextChannel('anuncios', 'Novedades oficiales del servidor', 'announcement'),
            makeTextChannel('reglas', 'Normas de convivencia de la comunidad'),
            makeTextChannel('general', `Chat principal de ${name}`),
            makeTextChannel('sugerencias', 'Ideas para mejorar el servidor'),
          ];
        case 'study':
          return [
            makeTextChannel('general', `Organización de ${name}`),
            makeTextChannel('apuntes', 'Comparte resúmenes y material'),
            makeTextChannel('dudas', 'Resuelve ejercicios con el grupo'),
          ];
        case 'art':
          return [
            makeTextChannel('general', `Bienvenidos a ${name}`),
            makeTextChannel('galeria-arte', 'Muestra tus ilustraciones y diseños'),
            makeTextChannel('feedback', 'Crítica constructiva y consejos'),
            makeTextChannel('recursos', 'Pinceles, paletas y referencias'),
          ];
        default:
          return [makeTextChannel('general', `Bienvenido a ${name}`)];
      }
    })();

    const voiceNames =
      config.templateId === 'gaming'
        ? ['Lobby 1', 'Competitivo']
        : config.templateId === 'friends'
        ? ['Sala Chill']
        : config.templateId === 'community'
        ? ['Escenario', 'Charla General']
        : config.templateId === 'study'
        ? ['Sala Pomodoro', 'Biblioteca']
        : config.templateId === 'art'
        ? ['Mesa de Dibujo']
        : ['General'];

    const voiceChannels: Channel[] = config.includeVoiceChannels
      ? voiceNames.map((vName, idx) => ({
          id: `ch-${now}-voz-${idx}`,
          name: vName,
          type: 'voice',
          category: 'CANALES DE VOZ',
          voiceParticipants: [],
          messages: [],
        }))
      : [];

    const roles: ServerRole[] =
      config.starterRoles && config.starterRoles.length > 0
        ? config.starterRoles
        : [
            {
              id: 'role-owner',
              name: '👑 Owner',
              color: '#f59e0b',
              hoist: true,
              permissions: ['Administrador'],
            },
            {
              id: 'role-everyone',
              name: '@everyone',
              color: '#b5bac1',
              hoist: false,
              permissions: ['Leer canales', 'Enviar mensajes'],
            },
          ];

    const ownerRoleId = roles[0]?.id || 'role-owner';
    const uidKey = user.id || 'me';

    const newSrv: Server = {
      id: `srv-${now}`,
      name,
      shortCode: shortCode || 'SR',
      ownerId: uidKey,
      adminIds: [uidKey],
      members: [
        {
          uid: uidKey,
          displayName: user.displayName,
          username: user.username,
          avatar: user.avatar,
          customAvatarUrl: user.customAvatarUrl,
          status: user.status,
          roleIds: [ownerRoleId],
          isAdmin: true,
        },
      ],
      hasUnread: false,
      iconStyle: 'custom',
      customIconUrl: communityVisual.customIconUrl,
      customEmoji: config.customEmoji,
      accentColor: communityVisual.accentColor,
      bannerColor: '#09090b',
      bannerImage: communityVisual.bannerImage,
      memberCount: 1,
      onlineCount: 1,
      boostLevel: 0,
      boostCount: 0,
      unlockedPerkIds: [],
      communityEnabled: config.audience === 'community',
      isDiscoverable: true,
      showAllChannels: true,
      chatTheme: config.chatTheme,
      chatMessageStyle: config.chatMessageStyle,
      chatAccentColor: communityVisual.accentColor,
      categoriesOrder: config.includeVoiceChannels
        ? ['', 'CANALES DE TEXTO', 'CANALES DE VOZ']
        : ['', 'CANALES DE TEXTO'],
      roles,
      memberRoleIds: { [uidKey]: [ownerRoleId] },
      customEmojis: [],
      stickers: [],
      channels: [...templateTextChannels, ...voiceChannels],
    };
    setServers((prev) => [...prev, newSrv]);
    const initialCh =
      newSrv.channels.find((c) => !c.isPrivate && c.type !== 'voice' && c.name.includes('general')) ||
      newSrv.channels.find((c) => c.type !== 'voice') ||
      newSrv.channels[0];
    setActiveContext({ type: 'server', serverId: newSrv.id });
    setSelectedChannelId(initialCh?.id || null);
    setScreen('inicio');
    setMobileChatOpen(false);
    showToastMsg(`Servidor "${name}" creado con ${newSrv.channels.length} canales`);
  };

  const handleInviteAiBotToServer = async (serverId: string): Promise<boolean> => {
    const srv = servers.find((s) => s.id === serverId);
    if (!srv) {
      showToastMsg('No se encontró el servidor seleccionado');
      return false;
    }
    const hasLegacyLocalOwner =
      srv.ownerId === 'me' || srv.ownerId === 'guest' || !srv.ownerId;
    if (!canManageServer(srv, user.id) && !hasLegacyLocalOwner) {
      showToastMsg('Necesitas permiso de administrador para invitar al Bot IA');
      return false;
    }
    if (srv.members?.some((m) => m.uid === AI_BUILDER_BOT_UID)) {
      return true;
    }

    const aiBotRole: ServerRole = {
      id: 'role-ai-bot',
      name: 'IA Arquitecto',
      color: '#a855f7',
      hoist: true,
      permissions: ['Administrador', 'Gestionar canales', 'Gestionar mensajes'],
    };
    const hasBotRole = (srv.roles || []).some((r) => r.id === 'role-ai-bot');
    const nextRoles = hasBotRole ? srv.roles || [] : [...(srv.roles || []), aiBotRole];

    const botMember: ServerMemberSummary = {
      uid: AI_BUILDER_BOT_UID,
      displayName: 'Primordial Architect AI',
      username: 'architect_ai',
      avatar: 'primordial-bot',
      status: 'online',
      roleIds: ['role-ai-bot'],
      isAdmin: true,
    };

    const firstTextChannel =
      srv.channels.find((c) => c.type !== 'voice' && !c.isPrivate) ||
      srv.channels.find((c) => c.type !== 'voice');

    const joinAnnouncement =
      'Primordial Architect AI se ha unido al servidor. Ya puedes usar el modo Construir para crear canales, categorías y roles automáticamente.';

    if (firebaseUid && !isCuratedServerId(serverId)) {
      try {
        await inviteAiBotToFirestoreServer({
          serverId,
          botUid: AI_BUILDER_BOT_UID,
          roleIds: ['role-ai-bot'],
        });
        if (!hasBotRole) {
          void updateFirestoreServer(serverId, { roles: nextRoles }).catch(() => undefined);
        }
        if (firstTextChannel) {
          void sendAiBotChannelMessage({
            serverId,
            channelId: firstTextChannel.id,
            senderUid: firebaseUid,
            content: joinAnnouncement,
          }).catch(() => undefined);
        }
      } catch (err) {
        console.error('Error inviting AI bot to Firestore server:', err);
        showToastMsg('No se pudo conectar el Bot IA al servidor en la nube');
        return false;
      }
    }

    const joinMsg: ChatMessage = {
      id: `ai-join-${Date.now()}`,
      authorId: AI_BUILDER_BOT_UID,
      authorName: 'Primordial Architect AI',
      authorAvatar: 'primordial-bot',
      authorTag: 'IA BOT',
      timestamp: 'Ahora',
      createdAtMs: Date.now(),
      content: joinAnnouncement,
      reactions: [],
    };

    setServers((prev) =>
      prev.map((s) => {
        if (s.id !== serverId) return s;
        return {
          ...s,
          roles: nextRoles,
          members: [...(s.members || []), botMember],
          memberRoleIds: {
            ...(s.memberRoleIds || {}),
            [AI_BUILDER_BOT_UID]: ['role-ai-bot'],
          },
          memberCount: (s.memberCount || 1) + 1,
          onlineCount: (s.onlineCount || 1) + 1,
          channels: firstTextChannel
            ? s.channels.map((ch) =>
                ch.id === firstTextChannel.id
                  ? { ...ch, messages: [...ch.messages, joinMsg] }
                  : ch
              )
            : s.channels,
        };
      })
    );

    showToastMsg(`Primordial Architect AI entró a ${srv.name}`);
    return true;
  };

  const handleDeleteServer = (serverId: string) => {
    const targetSrv = servers.find((s) => s.id === serverId);
    if (!targetSrv) return;
    const hasLegacyLocalOwner =
      targetSrv.ownerId === 'me' || targetSrv.ownerId === 'guest' || !targetSrv.ownerId;
    if (!isServerOwner(targetSrv, user.id) && !hasLegacyLocalOwner) {
      showToastMsg('Solo el dueño puede eliminar este servidor');
      return;
    }
    const targetName = targetSrv.name;
    if (firebaseUid && !isCuratedServerId(serverId)) {
      void deleteFirestoreServer(serverId, firebaseUid).catch(() =>
        showToastMsg('No se pudo eliminar el servidor en la nube')
      );
      setJoinedServerIds((prev) => prev.filter((id) => id !== serverId));
    }
    setServers((prev) => prev.filter((s) => s.id !== serverId));
    setServerSettingsTarget(null);
    setActiveContext({ type: 'dm' });
    setSelectedChannelId(null);
    setScreen('inicio');
    setMobileChatOpen(false);
    showToastMsg(`Servidor "${targetName}" eliminado`);
  };

  const handleApplyAiBuildToServer = async (
    targetServerId: string | null,
    plan: AiServerBuildPlan,
    originalPrompt: string
  ): Promise<{
    serverId: string;
    serverName: string;
    channelsCreated: number;
    channelsUpdated?: number;
    rolesCreated: number;
    rolesUpdated?: number;
    channelNames: string[];
    updatedChannelNames?: string[];
    roleNames: string[];
    updatedRoleNames?: string[];
  }> => {
    const now = Date.now();
    const aiBotRole: ServerRole = {
      id: 'role-ai-bot',
      name: 'IA Arquitecto',
      color: '#23a55a',
      hoist: true,
      permissions: ['Administrador', 'Gestionar canales', 'Gestionar mensajes'],
    };
    const botMember: ServerMemberSummary = {
      uid: AI_BUILDER_BOT_UID,
      displayName: 'Primordial Architect AI',
      username: 'architect_ai',
      avatar: 'primordial-bot',
      status: 'online',
      roleIds: ['role-ai-bot'],
      isAdmin: true,
    };

    const incomingRoles: ServerRole[] = (plan.roles || []).map((r, idx) => ({
      id: `role-ai-${now}-${idx}`,
      name: r.name,
      color: r.color || '#23a55a',
      hoist: Boolean(r.hoist),
      permissions:
        r.permissions && r.permissions.length > 0
          ? r.permissions
          : ['Enviar mensajes', 'Leer canales'],
    }));

    // Case A: Create a brand new server with the AI Bot inside
    if (!targetServerId) {
      const serverName = (plan.serverName || 'Servidor IA').trim().slice(0, 80);
      const accent = plan.accentColor || '#23a55a';

      if (firebaseUid) {
        const createdSrv = await createFirestoreServer({
          uid: firebaseUid,
          currentUser: user,
          payload: {
            name: serverName,
            templateId: 'custom',
            audience: 'community',
            accentColor: accent,
            chatTheme: 'onyx',
            chatMessageStyle: 'classic',
            includeBots: true,
            includeStarterRoles: true,
            includeVoiceChannels: false,
          },
        });

        await inviteAiBotToFirestoreServer({
          serverId: createdSrv.id,
          botUid: AI_BUILDER_BOT_UID,
          roleIds: ['role-ai-bot'],
        });

        const existingRoleNames = new Set(
          (createdSrv.roles || []).map((r) => r.name.toLowerCase())
        );
        const filteredNewRoles = incomingRoles.filter(
          (r) => !existingRoleNames.has(r.name.toLowerCase())
        );
        const mergedRoles: ServerRole[] = [
          ...(createdSrv.roles || []),
          ...(existingRoleNames.has('ia arquitecto') ? [] : [aiBotRole]),
          ...filteredNewRoles,
        ];

        const mergedCategories = Array.from(
          new Set([
            ...(plan.categoriesOrder || []),
            ...(plan.channels || []).map((c) => c.category || 'Canales de texto'),
            ...(createdSrv.categoriesOrder || []),
          ].filter(Boolean))
        );

        await updateFirestoreServer(createdSrv.id, {
          description: plan.serverDescription || plan.summary || `Servidor construido con IA`,
          accentColor: accent,
          bannerColor: accent,
          categoriesOrder: mergedCategories,
          roles: mergedRoles,
        });

        const finalChannels: Channel[] = [...createdSrv.channels];
        const createdNames: string[] = [];

        for (let i = 0; i < (plan.channels || []).length; i++) {
          const spec = plan.channels[i];
          const existingMatch = finalChannels.find(
            (c) =>
              c.name.toLowerCase() === spec.name.toLowerCase() && c.type === spec.type
          );

          if (existingMatch) {
            existingMatch.category = spec.category || existingMatch.category;
            existingMatch.topic = spec.topic || existingMatch.topic;
            await updateFirestoreChannel({
              serverId: createdSrv.id,
              channelId: existingMatch.id,
              patch: {
                category: existingMatch.category,
                topic: existingMatch.topic,
              },
            }).catch(() => undefined);

            if (spec.starterMessage) {
              await sendAiBotChannelMessage({
                serverId: createdSrv.id,
                channelId: existingMatch.id,
                senderUid: firebaseUid,
                content: spec.starterMessage,
              }).catch(() => undefined);
              existingMatch.messages = [
                ...existingMatch.messages,
                {
                  id: `ai-start-${now}-${i}`,
                  authorId: AI_BUILDER_BOT_UID,
                  authorName: 'Primordial Architect AI',
                  authorAvatar: 'primordial-bot',
                  authorTag: 'IA BOT',
                  timestamp: 'Ahora',
                  createdAtMs: Date.now(),
                  content: spec.starterMessage,
                  reactions: [],
                },
              ];
            }
          } else {
            const chId = await createFirestoreChannel({
              serverId: createdSrv.id,
              name: spec.name,
              type: spec.type,
              category: spec.category || 'Canales de texto',
              topic: spec.topic,
              position: finalChannels.length,
            });
            createdNames.push(spec.name);
            const starterMsgs: ChatMessage[] = [];
            if (spec.starterMessage && spec.type !== 'voice') {
              await sendAiBotChannelMessage({
                serverId: createdSrv.id,
                channelId: chId,
                senderUid: firebaseUid,
                content: spec.starterMessage,
              }).catch(() => undefined);
              starterMsgs.push({
                id: `ai-start-${now}-${i}`,
                authorId: AI_BUILDER_BOT_UID,
                authorName: 'Primordial Architect AI',
                authorAvatar: 'primordial-bot',
                authorTag: 'IA BOT',
                timestamp: 'Ahora',
                createdAtMs: Date.now(),
                content: spec.starterMessage,
                reactions: [],
              });
            }
            finalChannels.push({
              id: chId,
              name: spec.name,
              type: spec.type,
              category: spec.category || 'Canales de texto',
              isPrivate: false,
              topic: spec.topic,
              voiceParticipants: spec.type === 'voice' ? [] : undefined,
              messages: starterMsgs,
            });
          }
        }

        const enrichedServer: Server = {
          ...createdSrv,
          description: plan.serverDescription || plan.summary || createdSrv.description,
          accentColor: accent,
          bannerColor: accent,
          categoriesOrder: mergedCategories,
          roles: mergedRoles,
          members: [...(createdSrv.members || []), botMember],
          memberRoleIds: {
            ...(createdSrv.memberRoleIds || {}),
            [AI_BUILDER_BOT_UID]: ['role-ai-bot'],
          },
          memberCount: (createdSrv.memberCount || 1) + 1,
          onlineCount: (createdSrv.onlineCount || 1) + 1,
          channels: finalChannels,
        };

        setServers((prev) =>
          prev.some((s) => s.id === enrichedServer.id)
            ? prev.map((s) => (s.id === enrichedServer.id ? enrichedServer : s))
            : [...prev, enrichedServer]
        );
        setJoinedServerIds((prev) =>
          prev.includes(enrichedServer.id) ? prev : [...prev, enrichedServer.id]
        );

        showToastMsg(`Servidor "${serverName}" construido con IA`);
        return {
          serverId: enrichedServer.id,
          serverName,
          channelsCreated: finalChannels.length,
          rolesCreated: filteredNewRoles.length,
          channelNames: finalChannels.map((c) => c.name),
          roleNames: filteredNewRoles.map((r) => r.name),
        };
      }

      // Offline / local new server creation
      const shortCode =
        serverName
          .split(/\s+/)
          .map((w) => w.replace(/[^a-zA-Z0-9]/g, '')[0] || '')
          .join('')
          .slice(0, 3)
          .toUpperCase() || 'IA';

      const baseRoles: ServerRole[] = [
        {
          id: 'role-owner',
          name: '👑 Owner',
          color: '#f59e0b',
          hoist: true,
          permissions: ['Administrador'],
        },
        aiBotRole,
        ...incomingRoles,
        {
          id: 'role-everyone',
          name: '@everyone',
          color: '#b5bac1',
          hoist: false,
          permissions: ['Leer canales', 'Enviar mensajes', 'Conectar a voz'],
        },
      ];

      const localChannels: Channel[] = (plan.channels || []).map((spec, idx) => ({
        id: `ch-ai-${now}-${idx}`,
        name: spec.name,
        type: spec.type,
        category: spec.category || 'Canales de texto',
        topic: spec.topic,
        voiceParticipants: spec.type === 'voice' ? [] : undefined,
        messages:
          spec.starterMessage && spec.type !== 'voice'
            ? [
                {
                  id: `ai-msg-${now}-${idx}`,
                  authorId: AI_BUILDER_BOT_UID,
                  authorName: 'Primordial Architect AI',
                  authorAvatar: 'primordial-bot',
                  authorTag: 'IA BOT',
                  timestamp: 'Ahora',
                  createdAtMs: now + idx,
                  content: spec.starterMessage,
                  reactions: [],
                },
              ]
            : [],
      }));

      if (localChannels.length === 0) {
        localChannels.push({
          id: `ch-ai-${now}-general`,
          name: 'general',
          type: 'text',
          category: 'Canales de texto',
          topic: `Construido para: ${originalPrompt.slice(0, 80)}`,
          messages: [],
        });
      }

      const categoriesOrder = Array.from(
        new Set([
          ...(plan.categoriesOrder || []),
          ...localChannels.map((c) => c.category),
        ].filter(Boolean))
      );

      const uidKey = user.id || 'me';
      const newLocalSrv: Server = {
        id: `srv-ai-${now}`,
        name: serverName,
        shortCode,
        ownerId: uidKey,
        adminIds: [uidKey],
        members: [
          {
            uid: uidKey,
            displayName: user.displayName,
            username: user.username,
            avatar: user.avatar,
            customAvatarUrl: user.customAvatarUrl,
            status: user.status,
            roleIds: ['role-owner'],
            isAdmin: true,
          },
          botMember,
        ],
        hasUnread: false,
        iconStyle: 'custom',
        accentColor: accent,
        bannerColor: accent,
        description: plan.serverDescription || plan.summary,
        memberCount: 2,
        onlineCount: 2,
        boostLevel: 0,
        boostCount: 0,
        unlockedPerkIds: [],
        communityEnabled: true,
        isDiscoverable: true,
        showAllChannels: true,
        chatTheme: 'onyx',
        chatMessageStyle: 'classic',
        chatAccentColor: accent,
        categoriesOrder,
        roles: baseRoles,
        memberRoleIds: {
          [uidKey]: ['role-owner'],
          [AI_BUILDER_BOT_UID]: ['role-ai-bot'],
        },
        customEmojis: [],
        stickers: [],
        channels: localChannels,
      };

      setServers((prev) => [...prev, newLocalSrv]);
      showToastMsg(`Servidor "${serverName}" construido con IA`);
      return {
        serverId: newLocalSrv.id,
        serverName,
        channelsCreated: localChannels.length,
        rolesCreated: incomingRoles.length,
        channelNames: localChannels.map((c) => c.name),
        roleNames: incomingRoles.map((r) => r.name),
      };
    }

    // Case B: Build/Update inside an existing server (Bot must be present)
    const srv = servers.find((s) => s.id === targetServerId);
    if (!srv) {
      throw new Error('No se encontró el servidor destino.');
    }
    const hasLegacyLocalOwner =
      srv.ownerId === 'me' || srv.ownerId === 'guest' || !srv.ownerId;
    if (!canManageServer(srv, user.id) && !hasLegacyLocalOwner) {
      throw new Error('No tienes permisos de administrador en este servidor.');
    }

    const normalizeForChannelMatch = (val: string) =>
      val
        .replace(/^#+\s*/, '')
        .replace(/[^\p{L}\p{N}-]/gu, '')
        .toLowerCase();

    const updatedChannelIds = new Map<string, Partial<Channel>>();
    const updatedNames: string[] = [];

    for (const upd of plan.channelUpdates || []) {
      const targetKey = upd.currentName.trim().toLowerCase();
      const looseTargetKey = normalizeForChannelMatch(upd.currentName);
      const match =
        srv.channels.find((c) => c.name.toLowerCase() === targetKey) ||
        (looseTargetKey
          ? srv.channels.find(
              (c) => normalizeForChannelMatch(c.name) === looseTargetKey
            )
          : undefined);
      if (!match) continue;

      const chPatch: Partial<Channel> = {};
      if (upd.newName && upd.newName !== match.name) {
        chPatch.name = upd.newName;
      }
      if (upd.topic) {
        chPatch.topic = upd.topic;
      }
      if (upd.category) {
        chPatch.category = upd.category;
      }
      if (Object.keys(chPatch).length === 0) continue;

      updatedChannelIds.set(match.id, chPatch);
      updatedNames.push(chPatch.name || match.name);

      if (firebaseUid && !isCuratedServerId(srv.id)) {
        void updateFirestoreChannel({
          serverId: srv.id,
          channelId: match.id,
          patch: chPatch,
        }).catch(() => undefined);
      }
    }

    const existingChannelsWithUpdates = srv.channels.map((c) => {
      const patch = updatedChannelIds.get(c.id);
      return patch ? { ...c, ...patch } : c;
    });

    const existingKeys = new Set(
      existingChannelsWithUpdates.map((c) => `${c.type}:${c.name.toLowerCase()}`)
    );
    const addedChannels: Channel[] = [];

    for (let i = 0; i < (plan.channels || []).length; i++) {
      const spec = plan.channels[i];
      const key = `${spec.type}:${spec.name.toLowerCase()}`;
      if (existingKeys.has(key)) continue;
      existingKeys.add(key);

      let chId = `ch-ai-${now}-${i}`;
      if (firebaseUid && !isCuratedServerId(srv.id)) {
        chId = await createFirestoreChannel({
          serverId: srv.id,
          name: spec.name,
          type: spec.type,
          category: spec.category || 'Canales de texto',
          topic: spec.topic,
          position: existingChannelsWithUpdates.length + addedChannels.length,
        });
      }

      const starterMsgs: ChatMessage[] = [];
      if (spec.starterMessage && spec.type !== 'voice') {
        if (firebaseUid && !isCuratedServerId(srv.id)) {
          void sendAiBotChannelMessage({
            serverId: srv.id,
            channelId: chId,
            senderUid: firebaseUid,
            content: spec.starterMessage,
          }).catch(() => undefined);
        }
        starterMsgs.push({
          id: `ai-start-${now}-${i}`,
          authorId: AI_BUILDER_BOT_UID,
          authorName: 'Primordial Architect AI',
          authorAvatar: 'primordial-bot',
          authorTag: 'IA BOT',
          timestamp: 'Ahora',
          createdAtMs: now + i,
          content: spec.starterMessage,
          reactions: [],
        });
      }

      addedChannels.push({
        id: chId,
        name: spec.name,
        type: spec.type,
        category: spec.category || 'Canales de texto',
        isPrivate: false,
        topic: spec.topic,
        voiceParticipants: spec.type === 'voice' ? [] : undefined,
        messages: starterMsgs,
      });
    }

    const updatedRoleNames: string[] = [];
    const rolesAfterUpdates: ServerRole[] = (srv.roles || []).map((existingRole) => {
      const upd = (plan.roleUpdates || []).find(
        (ru) => ru.currentName.trim().toLowerCase() === existingRole.name.trim().toLowerCase()
      );
      if (!upd) return existingRole;
      const nextRole: ServerRole = {
        ...existingRole,
        ...(upd.newName ? { name: upd.newName } : {}),
        ...(upd.color ? { color: upd.color } : {}),
        ...(typeof upd.hoist === 'boolean' ? { hoist: upd.hoist } : {}),
        ...(upd.permissions && upd.permissions.length > 0
          ? { permissions: upd.permissions }
          : {}),
      };
      updatedRoleNames.push(nextRole.name);
      return nextRole;
    });

    const existingRoleNames = new Set(rolesAfterUpdates.map((r) => r.name.toLowerCase()));
    const addedRoles = incomingRoles.filter(
      (r) => !existingRoleNames.has(r.name.toLowerCase())
    );
    const mergedRoles = [...rolesAfterUpdates, ...addedRoles];

    const mergedCategories = Array.from(
      new Set([
        ...(srv.categoriesOrder || []),
        ...(plan.categoriesOrder || []),
        ...existingChannelsWithUpdates.map((c) => c.category),
        ...addedChannels.map((c) => c.category),
      ].filter(Boolean))
    );

    if (firebaseUid && !isCuratedServerId(srv.id)) {
      await updateFirestoreServer(srv.id, {
        categoriesOrder: mergedCategories,
        roles: mergedRoles,
        ...(plan.serverDescription ? { description: plan.serverDescription } : {}),
      });
    }

    const firstExistingText =
      existingChannelsWithUpdates.find((c) => c.type !== 'voice' && !c.isPrivate) ||
      addedChannels.find((c) => c.type !== 'voice');

    const buildLogContent = `Construcción completada (${addedChannels.length} canales nuevos, ${updatedNames.length} canales editados, ${addedRoles.length} roles nuevos${updatedRoleNames.length > 0 ? `, ${updatedRoleNames.length} roles editados` : ''}): ${plan.summary || originalPrompt.slice(0, 140)}`;
    if (firstExistingText && firebaseUid && !isCuratedServerId(srv.id)) {
      void sendAiBotChannelMessage({
        serverId: srv.id,
        channelId: firstExistingText.id,
        senderUid: firebaseUid,
        content: buildLogContent,
      }).catch(() => undefined);
    }

    const logMsg: ChatMessage = {
      id: `ai-log-${now}`,
      authorId: AI_BUILDER_BOT_UID,
      authorName: 'Primordial Architect AI',
      authorAvatar: 'primordial-bot',
      authorTag: 'IA BOT',
      timestamp: 'Ahora',
      createdAtMs: now + 99,
      content: buildLogContent,
      reactions: [],
    };

    setServers((prev) =>
      prev.map((s) => {
        if (s.id !== srv.id) return s;
        const baseChannels = s.channels.map((c) => {
          const patch = updatedChannelIds.get(c.id);
          return patch ? { ...c, ...patch } : c;
        });
        const allChs = [...baseChannels, ...addedChannels];
        return {
          ...s,
          description: plan.serverDescription || s.description,
          categoriesOrder: mergedCategories,
          roles: mergedRoles,
          channels: firstExistingText
            ? allChs.map((c) =>
                c.id === firstExistingText.id ? { ...c, messages: [...c.messages, logMsg] } : c
              )
            : allChs,
        };
      })
    );

    showToastMsg(
      addedChannels.length === 0 && updatedNames.length === 0
        ? `${addedRoles.length + updatedRoleNames.length} roles aplicados con IA en ${srv.name}`
        : updatedNames.length > 0 && addedChannels.length === 0
          ? `${updatedNames.length} canales actualizados con IA en ${srv.name}`
          : `Construcción aplicada en ${srv.name}: +${addedChannels.length} canales, +${addedRoles.length} roles`
    );

    return {
      serverId: srv.id,
      serverName: srv.name,
      channelsCreated: addedChannels.length,
      channelsUpdated: updatedNames.length,
      rolesCreated: addedRoles.length,
      rolesUpdated: updatedRoleNames.length,
      channelNames: addedChannels.map((c) => c.name),
      updatedChannelNames: updatedNames,
      roleNames: addedRoles.map((r) => r.name),
      updatedRoleNames,
    };
  };

  const handleLoadDiscoverableServers = useCallback(async (): Promise<Server[]> => {
    if (!firebaseUid) return [];
    const list = await fetchDiscoverableServers();
    setDiscoverableServers(list);
    return list;
  }, [firebaseUid]);

  const handleJoinCuratedServer = useCallback(
    (serverId: string) => {
      const target = CURATED_PUBLIC_SERVERS.find((s) => s.id === serverId);
      if (!target) return false;
      setJoinedCuratedIds((prev) => {
        if (prev.includes(serverId)) return prev;
        const next = [...prev, serverId];
        saveCuratedJoinedIds(activeAccountId, next);
        return next;
      });
      const firstText =
        target.channels.find((c) => c.type !== 'voice') || target.channels[0];
      setActiveContext({ type: 'server', serverId });
      setSelectedChannelId(firstText?.id || null);
      setScreen('inicio');
      setMobileChatOpen(false);
      const earned = rewardActivityOrbs('discover', 30, `Unido a ${target.name}`, 180_000);
      if (!earned) {
        showToastMsg(`¡Bienvenido a ${target.name}!`);
      }
      return true;
    },
    [activeAccountId, rewardActivityOrbs]
  );

  const handleJoinServerById = async (serverIdOrInvite: string): Promise<boolean> => {
    const cleanId = serverIdOrInvite
      .trim()
      .replace(/^https?:\/\/[^/]+\//i, '')
      .replace(/^primordial\.gg\//i, '');
    if (!cleanId) return false;
    if (isCuratedServerId(cleanId)) {
      return handleJoinCuratedServer(cleanId);
    }
    if (!firebaseUid) {
      showToastMsg(
        authProviderNeedsSetup
          ? 'Activa Correo/Anónimo en Firebase Auth para unirte a servidores en la nube'
          : 'Conectando con la nube... Intenta de nuevo en unos segundos'
      );
      return false;
    }
    try {
      const ok = await joinFirestoreServer(firebaseUid, user, cleanId);
      if (!ok) return false;
      setJoinedServerIds((prev) => (prev.includes(cleanId) ? prev : [...prev, cleanId]));
      setActiveContext({ type: 'server', serverId: cleanId });
      setSelectedChannelId(null);
      setScreen('inicio');
      setMobileChatOpen(false);
      rewardActivityOrbs('discover', 30, 'Te uniste a una comunidad', 180_000);
      return true;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    if (!activeAccountId || !pendingJoinServerRef.current) return;
    const srvToJoin = pendingJoinServerRef.current;
    pendingJoinServerRef.current = null;
    void handleJoinServerById(srvToJoin);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeAccountId, firebaseUid]);

  const handleSearchUsers = async (q: string): Promise<PublicUserProfile[]> => {
    if (!firebaseUid) return [];
    return await searchRealUsers(q, firebaseUid);
  };

  const handleAddRealUser = async (profile: PublicUserProfile): Promise<void> => {
    const existing = dms.find(
      (d) =>
        d.otherUid === profile.id ||
        (d.username && profile.username && d.username.toLowerCase() === profile.username.toLowerCase())
    );
    if (existing) {
      handleSelectDm(existing.id);
      return;
    }
    if (!firebaseUid) {
      const errMsg = authProviderNeedsSetup
        ? 'Activa Correo/Anónimo en Firebase Auth para chatear en la nube'
        : 'Conectando con la nube... Intenta de nuevo en unos segundos';
      showToastMsg(errMsg);
      throw new Error(errMsg);
    }
    try {
      const dmId = await getOrCreateDmThread(user, profile);
      handleSelectDm(dmId);
      showToastMsg(`Chat abierto con @${profile.username || profile.displayName}`);
    } catch (err) {
      const msg =
        err instanceof Error && !err.message.startsWith('{')
          ? err.message
          : 'No se pudo abrir el chat con este usuario. Verifica tu conexión.';
      showToastMsg(msg);
      throw new Error(msg);
    }
  };

  const handleSendFriendRequest = async (profile: PublicUserProfile): Promise<void> => {
    if (!firebaseUid) {
      const msg = 'Conectando tu sesión con la nube... Intenta de nuevo en unos segundos';
      showToastMsg(msg);
      throw new Error(msg);
    }
    if (!profile.id || profile.id === firebaseUid) return;
    try {
      const status = await sendFriendRequest({
        fromUser: user,
        toUid: profile.id,
        targetProfile: profile,
      });
      if (status === 'auto-accepted') {
        setFriendRequests((prev) => prev.filter((item) => item.fromUid !== profile.id));
        const dmId = await getOrCreateDmThread(user, profile);
        showToastMsg(`¡Solicitud mutua aceptada! Ahora tú y @${profile.username || profile.displayName} son amigos`);
        handleSelectDm(dmId);
        return;
      }
      setSentFriendRequestUids((prev) =>
        prev.includes(profile.id) ? prev : [...prev, profile.id]
      );
      if (status === 'already-friends') {
        showToastMsg(`@${profile.username || profile.displayName} ya está en tu lista de amigos`);
      } else if (status === 'already-pending') {
        showToastMsg(`Ya hay una solicitud pendiente para @${profile.username || profile.displayName}`);
      } else {
        showToastMsg(`Solicitud de amistad enviada a @${profile.username || profile.displayName}`);
      }
    } catch (err) {
      const msg =
        err instanceof Error && !err.message.startsWith('{')
          ? err.message
          : 'No se pudo enviar la solicitud de amistad';
      showToastMsg(msg);
      throw new Error(msg);
    }
  };

  const handleCancelSentRequest = async (toUid: string): Promise<void> => {
    if (!firebaseUid) return;
    try {
      await cancelSentFriendRequest(firebaseUid, toUid);
      setSentFriendRequestUids((prev) => prev.filter((id) => id !== toUid));
      setSentFriendRequestItems((prev) => prev.filter((item) => item.toUid !== toUid));
      showToastMsg('Solicitud cancelada');
    } catch {
      showToastMsg('No se pudo cancelar la solicitud');
    }
  };

  const handleRespondFriendRequest = async (
    req: FriendRequestItem,
    accept: boolean
  ): Promise<void> => {
    if (!firebaseUid) return;
    try {
      await respondFriendRequest({ uid: firebaseUid, fromUid: req.fromUid, accept });
      setFriendRequests((prev) => prev.filter((item) => item.fromUid !== req.fromUid));
      if (accept) {
        const senderLiveProfile = await fetchPublicProfileById(req.fromUid).catch(() => null);
        const dmId = await getOrCreateDmThread(
          user,
          senderLiveProfile || {
            id: req.fromUid,
            displayName: req.fromDisplayName,
            username: req.fromUsername,
            avatar: req.fromAvatar,
            customAvatarUrl: req.fromCustomAvatarUrl,
            status: 'offline',
            bio: '',
            bannerColor: '#5865F2',
            memberSince: 'Nov 2026',
          }
        );
        showToastMsg(`Ahora tú y @${req.fromUsername} son amigos`);
        handleSelectDm(dmId);
      } else {
        showToastMsg(`Solicitud de @${req.fromUsername} rechazada`);
      }
    } catch {
      showToastMsg('No se pudo actualizar la solicitud de amistad');
    }
  };

  const handleSendDmFromProfile = async (
    profile: PublicUserProfile,
    initialMessage?: string
  ): Promise<void> => {
    const text = initialMessage?.trim();
    if (!firebaseUid) {
      if (text) {
        showToastMsg(`Mensaje preparado para @${profile.username || profile.displayName}`);
      }
      handleAddFriend(profile.username || profile.displayName);
      return;
    }
    try {
      const dmId = await getOrCreateDmThread(user, profile);
      if (text) {
        await sendDmMessage({
          dmId,
          currentUser: user,
          recipientUids: [profile.id],
          content: text,
        });
        playUiSound('send', appPreferences.soundsEnabled);
      }
      handleSelectDm(dmId);
      showToastMsg(text ? `Mensaje enviado a @${profile.username}` : `Chat abierto con @${profile.username}`);
    } catch {
      showToastMsg('No se pudo enviar el mensaje directo');
    }
  };

  const handleUpdateNickname = (serverId: string, nickname: string) => {
    setUser((prev) => ({
      ...prev,
      perServerProfiles: {
        ...(prev.perServerProfiles || {}),
        [serverId]: {
          ...(prev.perServerProfiles?.[serverId] || {}),
          nickname,
        },
      },
    }));
    showToastMsg(nickname ? `Apodo cambiado a "${nickname}"` : 'Apodo restaurado');
  };

  const handleClearLocalChat = () => {
    if (firebaseUid && activeContext.type === 'server' && !isCuratedServerId(activeServer?.id)) {
      showToastMsg('Limpieza local disponible solo en chats temporales sin nube');
      return;
    }
    mapActiveMessages(() => []);
    showToastMsg('Historial visible limpiado');
  };

  const handleAddFriend = (username: string) => {
    const existing = dms.find(
      (d) =>
        d.name.toLowerCase() === username.toLowerCase() ||
        (d.username && d.username.toLowerCase() === username.toLowerCase())
    );
    if (existing) {
      handleSelectDm(existing.id);
      return;
    }
    setScreen('amigos');
    showToastMsg('Busca cuentas reales por su @usuario en la pestaña Amigos');
  };

  const stopStreamTracks = useCallback((stream: MediaStream | null) => {
    if (!stream) return;
    stream.getTracks().forEach((t) => {
      try {
        t.stop();
      } catch {
        /* ignore */
      }
    });
  }, []);

  const cleanupVoiceCall = useCallback(
    async (notifyRemote = true) => {
      const prevSession = voiceSessionRef.current;
      if (rtcControllerRef.current) {
        const ctrl = rtcControllerRef.current;
        rtcControllerRef.current = null;
        await ctrl.hangup(notifyRemote);
      }
      stopStreamTracks(localAudioStreamRef.current);
      stopStreamTracks(localVideoStreamRef.current);
      localAudioStreamRef.current = null;
      localVideoStreamRef.current = null;
      setLocalVideoStream(null);
      setRemoteVideoStream(null);
      setRemoteAudioStream(null);
      setShowScreenStudio(false);
      setScreenStudioNotice(null);

      if (prevSession.serverId && prevSession.channelId && firebaseUid) {
        void removeVoiceChannelPresence(prevSession.serverId, prevSession.channelId, firebaseUid);
      }

      setVoiceSession({
        active: false,
        channelName: '',
        contextName: '',
        muted: false,
        deafened: false,
        videoOn: false,
        screenSharing: false,
        connectedSeconds: 0,
        participants: [],
      });
    },
    [firebaseUid, stopStreamTracks]
  );

  const attachScreenEndedListener = useCallback(
    (stream: MediaStream) => {
      const track = stream.getVideoTracks()[0];
      if (!track) return;
      track.onended = () => {
        stopStreamTracks(localVideoStreamRef.current);
        localVideoStreamRef.current = null;
        setLocalVideoStream(null);
        setVoiceSession((v) => ({ ...v, screenSharing: false }));
        void rtcControllerRef.current?.setVideoTrack(null);
        void rtcControllerRef.current?.updateMediaFlags({ screenSharing: false });
      };
    },
    [stopStreamTracks]
  );

  const handleRemoteStreamUpdate = useCallback((stream: MediaStream | null) => {
    if (!stream) {
      setRemoteAudioStream(null);
      setRemoteVideoStream(null);
      return;
    }
    const audioTracks = stream.getAudioTracks();
    const videoTracks = stream.getVideoTracks();
    setRemoteAudioStream(audioTracks.length > 0 ? new MediaStream(audioTracks) : null);
    setRemoteVideoStream(videoTracks.length > 0 ? new MediaStream(videoTracks) : null);
  }, []);

  const startCallSession = useCallback(
    async (params: {
      dm?: DirectMessageThread;
      serverId?: string;
      channelId?: string;
      channelName?: string;
      contextName?: string;
      participantProfile?: PublicUserProfile;
      video: boolean;
      screen?: boolean;
    }) => {
      await cleanupVoiceCall(true);
      playUiSound('voiceJoin', appPreferences.soundsEnabled);
      triggerHaptic(14);

      const audioStream = await captureLocalAudio();
      localAudioStreamRef.current = audioStream;

      let videoStream: MediaStream | null = null;
      let screenActive = false;
      let cameraActive = false;
      let pendingStudioNotice: string | null = null;

      if (params.screen) {
        const screenRes = await captureLocalScreen();
        if (screenRes.ok) {
          videoStream = screenRes.stream;
          screenActive = true;
          attachScreenEndedListener(videoStream);
          handleLogStreamHour();
        } else if (screenRes.reason === 'cancelled') {
          showToastMsg('Captura cancelada. Puedes compartir pantalla o usar el Estudio desde la llamada.');
        } else {
          pendingStudioNotice = screenRes.message;
        }
      } else if (params.video) {
        videoStream = await captureLocalCamera();
        cameraActive = Boolean(videoStream);
        if (!videoStream) {
          showToastMsg('No se pudo acceder a la cámara; llamada iniciada solo con voz.');
        }
      }

      if (pendingStudioNotice) {
        setScreenStudioNotice(pendingStudioNotice);
        setShowScreenStudio(true);
      }

      localVideoStreamRef.current = videoStream;
      setLocalVideoStream(videoStream);

      const audioTrack = audioStream?.getAudioTracks()[0] || null;
      const videoTrack = videoStream?.getVideoTracks()[0] || null;

      if (params.serverId && params.channelId) {
        playVoiceEntryEffect(user.voiceEntryEffect, appPreferences.soundsEnabled);
        setVoiceSession({
          active: true,
          callNonce: Date.now(),
          serverId: params.serverId,
          channelId: params.channelId,
          callStatus: 'connected',
          channelName: params.channelName || 'Canal de voz',
          contextName: params.contextName || 'Servidor',
          muted: !audioTrack,
          deafened: false,
          videoOn: cameraActive,
          screenSharing: screenActive,
          connectedSeconds: 0,
          participants: [],
        });
        if (firebaseUid && !isCuratedServerId(params.serverId)) {
          void upsertVoiceChannelPresence({
            serverId: params.serverId,
            channelId: params.channelId,
            currentUser: user,
            muted: !audioTrack,
            videoOn: cameraActive,
            screenSharing: screenActive,
          });
        }
        rewardActivityOrbs('voice', 30, 'Sala de voz conectada', 180_000);
        return;
      }

      let targetDmId = params.dm && !params.dm.id.startsWith('dm-grp-') ? params.dm.id : undefined;
      if (!targetDmId && firebaseUid && params.participantProfile?.id) {
        try {
          targetDmId = await getOrCreateDmThread(user, params.participantProfile);
        } catch {
          targetDmId = undefined;
        }
      }

      const peerId = params.dm?.otherUid || params.participantProfile?.id || params.dm?.id || 'peer';
      const peerName = params.dm?.name || params.participantProfile?.displayName || 'Llamada';
      const peerAvatar = params.dm?.avatar || params.participantProfile?.avatar || 'madara';
      const peerCustomAvatar =
        params.dm?.customAvatarUrl || params.participantProfile?.customAvatarUrl;

      setVoiceSession({
        active: true,
        callNonce: Date.now(),
        dmId: targetDmId,
        callStatus: targetDmId && firebaseUid ? 'ringing' : 'connected',
        channelName: peerName,
        contextName: params.contextName || 'Mensaje directo',
        muted: !audioTrack,
        deafened: false,
        videoOn: cameraActive,
        screenSharing: screenActive,
        connectedSeconds: 0,
        participants: [
          {
            id: peerId,
            name: peerName,
            avatar: peerAvatar,
            customAvatarUrl: peerCustomAvatar,
            speaking: false,
            videoOn: false,
            screenSharing: false,
          },
        ],
      });

      if (targetDmId && firebaseUid) {
        const controller = new DmWebRtcController({
          dmId: targetDmId,
          myUid: firebaseUid,
          role: 'caller',
          callbacks: {
            onRemoteStream: handleRemoteStreamUpdate,
            onRemoteState: ({ status, remoteVideoOn, remoteScreenSharing }) => {
              setVoiceSession((prev) => ({
                ...prev,
                callStatus: status === 'ended' ? 'idle' : status,
                participants: prev.participants.map((p, idx) =>
                  idx === 0
                    ? {
                        ...p,
                        speaking: status === 'connected',
                        videoOn: remoteVideoOn,
                        screenSharing: remoteScreenSharing,
                      }
                    : p
                ),
              }));
            },
            onRemoteEnded: () => {
              showToastMsg('La llamada ha finalizado');
              void cleanupVoiceCall(false);
            },
          },
        });
        rtcControllerRef.current = controller;
        await controller
          .startAsCaller({
            currentUser: user,
            calleeUid: params.dm?.otherUid || params.participantProfile?.id,
            audioTrack,
            videoTrack,
            videoOn: cameraActive,
            screenSharing: screenActive,
          })
          .catch(() => {
            showToastMsg('No se pudo conectar la señalización WebRTC.');
          });
      }
    },
    [
      appPreferences.soundsEnabled,
      attachScreenEndedListener,
      cleanupVoiceCall,
      firebaseUid,
      handleRemoteStreamUpdate,
      rewardActivityOrbs,
      user,
    ]
  );

  const handleJoinDropInRoom = useCallback(
    async (room: DropInVoiceRoom) => {
      await cleanupVoiceCall(true);
      playUiSound('voiceJoin', appPreferences.soundsEnabled);
      playVoiceEntryEffect(user.voiceEntryEffect, appPreferences.soundsEnabled);
      triggerHaptic(14);

      const audioStream = await captureLocalAudio();
      localAudioStreamRef.current = audioStream;
      const audioTrack = audioStream?.getAudioTracks()[0] || null;

      setVoiceSession({
        active: true,
        callNonce: Date.now(),
        channelId: room.id,
        callStatus: 'connected',
        channelName: `${room.emoji} ${room.name}`,
        contextName: `Drop-in · ${room.category}`,
        muted: !audioTrack,
        deafened: false,
        videoOn: false,
        screenSharing: false,
        connectedSeconds: 0,
        participants: room.participants.map((p) => ({ ...p })),
      });
      const earned = rewardActivityOrbs('voice', 30, `Sala Drop-in: ${room.name}`, 180_000);
      if (!earned) {
        showToastMsg(`Conectado a ${room.emoji} ${room.name}`);
      }
    },
    [
      appPreferences.soundsEnabled,
      cleanupVoiceCall,
      rewardActivityOrbs,
      user.voiceEntryEffect,
    ]
  );

  const handleUpdateEphemeralStatus = useCallback(
    (status: string, expiresInHours = 4) => {
      const clean = status.trim().slice(0, 80);
      const expiresAt = clean ? Date.now() + expiresInHours * 3600_000 : undefined;
      saveLocalPrefsForAccount(activeAccountId, {
        voiceEntryEffect: user.voiceEntryEffect,
        ephemeralNoteExpiresAt: expiresAt,
      });
      setUser((prev) => {
        const nextUser: UserProfile = {
          ...prev,
          customStatus: clean,
          ephemeralNoteExpiresAt: expiresAt,
        };
        flushCloudAccountSync({ user: nextUser });
        return nextUser;
      });
      if (clean) {
        const earned = rewardActivityOrbs('note', 25, 'Nota rápida publicada', 120_000);
        if (!earned) {
          showToastMsg(`Nota publicada por ${expiresInHours}h`);
        }
      } else {
        showToastMsg('Nota rápida eliminada');
      }
    },
    [activeAccountId, flushCloudAccountSync, rewardActivityOrbs, user.voiceEntryEffect]
  );

  const handleChangeVoiceEffect = useCallback(
    (effectId: VoiceEntryEffectId) => {
      saveLocalPrefsForAccount(activeAccountId, {
        voiceEntryEffect: effectId,
        ephemeralNoteExpiresAt: user.ephemeralNoteExpiresAt,
      });
      setUser((prev) => {
        const nextUser = { ...prev, voiceEntryEffect: effectId };
        flushCloudAccountSync({ user: nextUser });
        return nextUser;
      });
      playVoiceEntryEffect(effectId, appPreferences.soundsEnabled);
      showToastMsg(
        effectId === 'none'
          ? 'Efecto de entrada en voz restaurado a estándar'
          : 'Efecto de entrada en voz actualizado'
      );
    },
    [
      activeAccountId,
      appPreferences.soundsEnabled,
      flushCloudAccountSync,
      user.ephemeralNoteExpiresAt,
    ]
  );

  const handleBotQuickAction = useCallback(
    (action: NonNullable<ChatMessage['quickReplies']>[number]) => {
      if (action.command) {
        sendToWelcomeBot(action.command);
        return;
      }
      if (action.navigateTo === 'tienda') {
        setScreen('tienda');
      } else if (action.navigateTo === 'tu') {
        setProfileViewTrigger((k) => k + 1);
        setScreen('tu');
      } else if (action.navigateTo === 'misiones') {
        setScreen('misiones');
      } else if (action.navigateTo === 'amigos') {
        setScreen('amigos');
      } else if (action.navigateTo === 'discover') {
        setShowDiscover(true);
      } else if (action.navigateTo === 'voice') {
        void handleJoinDropInRoom(dropInRooms[0]);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dropInRooms, handleJoinDropInRoom, theme, user]
  );

  const answerIncomingCall = useCallback(
    async (call: IncomingDmCall, mode: 'audio' | 'video') => {
      if (!firebaseUid) return;
      try {
        const snap = await getDoc(doc(db, 'dms', call.dmId, 'rtc', 'active'));
        if (!snap.exists()) {
          showToastMsg('La llamada ya expiró');
          return;
        }
        const d = snap.data();
        if (!d.active || !d.offer?.sdp) {
          showToastMsg('La llamada ya fue cancelada');
          return;
        }

        await cleanupVoiceCall(true);
        playUiSound('voiceJoin', appPreferences.soundsEnabled);
        triggerHaptic(16);

        const audioStream = await captureLocalAudio();
        localAudioStreamRef.current = audioStream;
        const videoStream = mode === 'video' ? await captureLocalCamera() : null;
        localVideoStreamRef.current = videoStream;
        setLocalVideoStream(videoStream);

        const dmThread = dms.find((item) => item.id === call.dmId);
        setVoiceSession({
          active: true,
          callNonce: Date.now(),
          dmId: call.dmId,
          callStatus: 'connected',
          channelName: dmThread?.name || call.callerName,
          contextName: 'Mensaje directo',
          muted: !audioStream,
          deafened: false,
          videoOn: Boolean(videoStream),
          screenSharing: false,
          connectedSeconds: 0,
          participants: [
            {
              id: call.callerUid,
              name: dmThread?.name || call.callerName,
              avatar: dmThread?.avatar || call.callerAvatar,
              customAvatarUrl: dmThread?.customAvatarUrl,
              speaking: true,
              videoOn: call.videoOn,
              screenSharing: call.screenSharing,
            },
          ],
        });

        const controller = new DmWebRtcController({
          dmId: call.dmId,
          myUid: firebaseUid,
          role: 'callee',
          callId: call.callId,
          callbacks: {
            onRemoteStream: handleRemoteStreamUpdate,
            onRemoteState: ({ status, remoteVideoOn, remoteScreenSharing }) => {
              setVoiceSession((prev) => ({
                ...prev,
                callStatus: status === 'ended' ? 'idle' : status,
                participants: prev.participants.map((p, idx) =>
                  idx === 0
                    ? {
                        ...p,
                        speaking: status === 'connected',
                        videoOn: remoteVideoOn,
                        screenSharing: remoteScreenSharing,
                      }
                    : p
                ),
              }));
            },
            onRemoteEnded: () => {
              showToastMsg('La llamada ha finalizado');
              void cleanupVoiceCall(false);
            },
          },
        });
        rtcControllerRef.current = controller;
        await controller.answerAsCallee({
          audioTrack: audioStream?.getAudioTracks()[0] || null,
          videoTrack: videoStream?.getVideoTracks()[0] || null,
          videoOn: Boolean(videoStream),
          screenSharing: false,
          offer: {
            type: d.offer.type,
            sdp: d.offer.sdp,
          },
        });
      } catch {
        showToastMsg('No se pudo contestar la llamada');
      }
    },
    [appPreferences.soundsEnabled, cleanupVoiceCall, dms, firebaseUid, handleRemoteStreamUpdate]
  );

  const handleToggleVoiceMute = useCallback(() => {
    setVoiceSession((v) => {
      const nextMuted = !v.muted;
      playUiSound(nextMuted ? 'mute' : 'unmute', appPreferences.soundsEnabled);
      triggerHaptic(10);
      localAudioStreamRef.current?.getAudioTracks().forEach((t) => {
        t.enabled = !nextMuted;
      });
      if (v.serverId && v.channelId && firebaseUid) {
        void upsertVoiceChannelPresence({
          serverId: v.serverId,
          channelId: v.channelId,
          currentUser: user,
          muted: nextMuted,
          videoOn: v.videoOn,
          screenSharing: v.screenSharing,
        });
      }
      return { ...v, muted: nextMuted };
    });
  }, [appPreferences.soundsEnabled, firebaseUid, user]);

  const handleToggleVoiceDeafen = useCallback(() => {
    setVoiceSession((v) => ({ ...v, deafened: !v.deafened }));
  }, []);

  const handleToggleVoiceVideo = useCallback(async () => {
    const current = voiceSessionRef.current;
    if (current.videoOn) {
      stopStreamTracks(localVideoStreamRef.current);
      localVideoStreamRef.current = null;
      setLocalVideoStream(null);
      setVoiceSession((v) => ({ ...v, videoOn: false }));
      await rtcControllerRef.current?.setVideoTrack(null);
      await rtcControllerRef.current?.updateMediaFlags({ videoOn: false });
      if (current.serverId && current.channelId && firebaseUid) {
        void upsertVoiceChannelPresence({
          serverId: current.serverId,
          channelId: current.channelId,
          currentUser: user,
          muted: current.muted,
          videoOn: false,
          screenSharing: current.screenSharing,
        });
      }
      return;
    }

    const camStream = await captureLocalCamera();
    if (!camStream) {
      showToastMsg('No se pudo acceder a la cámara en este dispositivo');
      return;
    }
    stopStreamTracks(localVideoStreamRef.current);
    localVideoStreamRef.current = camStream;
    setLocalVideoStream(camStream);
    setVoiceSession((v) => ({ ...v, videoOn: true, screenSharing: false }));
    const track = camStream.getVideoTracks()[0] || null;
    await rtcControllerRef.current?.setVideoTrack(track);
    await rtcControllerRef.current?.updateMediaFlags({ videoOn: true, screenSharing: false });
    if (current.serverId && current.channelId && firebaseUid) {
      void upsertVoiceChannelPresence({
        serverId: current.serverId,
        channelId: current.channelId,
        currentUser: user,
        muted: current.muted,
        videoOn: true,
        screenSharing: false,
      });
    }
  }, [firebaseUid, stopStreamTracks, user]);

  const applySharedVideoStream = useCallback(
    async (stream: MediaStream, label?: string) => {
      const current = voiceSessionRef.current;
      stopStreamTracks(localVideoStreamRef.current);
      localVideoStreamRef.current = stream;
      setLocalVideoStream(stream);
      attachScreenEndedListener(stream);
      handleLogStreamHour();
      setVoiceSession((v) => ({ ...v, screenSharing: true, videoOn: false }));
      const track = stream.getVideoTracks()[0] || null;
      await rtcControllerRef.current?.setVideoTrack(track, true);
      await rtcControllerRef.current?.updateMediaFlags({ screenSharing: true, videoOn: false });
      if (current.serverId && current.channelId && firebaseUid) {
        void upsertVoiceChannelPresence({
          serverId: current.serverId,
          channelId: current.channelId,
          currentUser: user,
          muted: current.muted,
          videoOn: false,
          screenSharing: true,
        });
      }
      if (label) {
        showToastMsg(`Compartiendo: ${label}`);
      }
    },
    [attachScreenEndedListener, firebaseUid, stopStreamTracks, user]
  );

  const handleToggleVoiceScreen = useCallback(async () => {
    const current = voiceSessionRef.current;
    if (current.screenSharing) {
      stopStreamTracks(localVideoStreamRef.current);
      localVideoStreamRef.current = null;
      setLocalVideoStream(null);
      setShowScreenStudio(false);
      setVoiceSession((v) => ({ ...v, screenSharing: false }));
      await rtcControllerRef.current?.setVideoTrack(null, false);
      await rtcControllerRef.current?.updateMediaFlags({ screenSharing: false });
      if (current.serverId && current.channelId && firebaseUid) {
        void upsertVoiceChannelPresence({
          serverId: current.serverId,
          channelId: current.channelId,
          currentUser: user,
          muted: current.muted,
          videoOn: current.videoOn,
          screenSharing: false,
        });
      }
      return;
    }

    const screenRes = await captureLocalScreen();
    if (screenRes.ok) {
      setScreenStudioNotice(null);
      await applySharedVideoStream(screenRes.stream, 'Pantalla en vivo');
      return;
    }

    if (screenRes.reason === 'cancelled') {
      showToastMsg(screenRes.message);
      return;
    }

    setScreenStudioNotice(screenRes.message);
    setShowScreenStudio(true);
  }, [applySharedVideoStream, firebaseUid, stopStreamTracks, user]);

  const handleTryNativeScreenFromStudio = useCallback(async () => {
    const screenRes = await captureLocalScreen();
    if (screenRes.ok) {
      setShowScreenStudio(false);
      setScreenStudioNotice(null);
      await applySharedVideoStream(screenRes.stream, 'Pantalla en vivo');
      return;
    }
    setScreenStudioNotice(screenRes.message);
    showToastMsg(screenRes.message);
  }, [applySharedVideoStream]);

  const handleDisconnectVoice = useCallback(() => {
    playUiSound('voiceLeave', appPreferences.soundsEnabled);
    triggerHaptic(12);
    void cleanupVoiceCall(true);
  }, [appPreferences.soundsEnabled, cleanupVoiceCall]);

  // Escucha llamadas entrantes en los DMs reales del usuario
  const realDmIdsKey = useMemo(
    () =>
      dms
        .filter((d) => d.id !== PRIMORDIAL_BOT_DM_ID && !d.id.startsWith('dm-grp-'))
        .map((d) => d.id)
        .join('|'),
    [dms]
  );

  useEffect(() => {
    if (!firebaseUid || !realDmIdsKey) {
      setIncomingCalls([]);
      return;
    }
    const ids = realDmIdsKey.split('|').filter(Boolean);
    return subscribeToIncomingDmCalls(ids, firebaseUid, (calls) => {
      setIncomingCalls(calls);
    });
  }, [firebaseUid, realDmIdsKey]);

  // Sincroniza participantes conectados en canales de voz del servidor
  useEffect(() => {
    if (
      !voiceSession.active ||
      !voiceSession.serverId ||
      !voiceSession.channelId ||
      !firebaseUid ||
      isCuratedServerId(voiceSession.serverId)
    ) {
      return;
    }
    const srvId = voiceSession.serverId;
    const chId = voiceSession.channelId;
    return subscribeToVoiceChannelPresence(srvId, chId, (participants) => {
      const others = participants.filter((p) => p.id !== firebaseUid);
      setVoiceSession((prev) => ({
        ...prev,
        participants: others.map((p) => ({
          id: p.id,
          name: p.name,
          avatar: p.avatar,
          customAvatarUrl: p.customAvatarUrl,
          speaking: !p.muted,
          muted: p.muted,
          videoOn: p.videoOn,
          screenSharing: p.screenSharing,
        })),
      }));
      setServers((prev) =>
        prev.map((s) =>
          s.id === srvId
            ? {
                ...s,
                channels: s.channels.map((c) =>
                  c.id === chId
                    ? {
                        ...c,
                        voiceParticipants: participants.map((p) => ({
                          id: p.id,
                          name: p.name,
                          avatar: p.avatar,
                          speaking: !p.muted,
                        })),
                      }
                    : c
                ),
              }
            : s
        )
      );
    });
  }, [voiceSession.active, voiceSession.serverId, voiceSession.channelId, firebaseUid]);

  const renderDesktopWorkspace = () => {
    if (screen === 'ia-asistente') {
      return (
        <AiServerAssistantView
          user={user}
          servers={servers}
          currentServerId={
            activeContext.type === 'server' ? activeContext.serverId : null
          }
          credits={aiCredits}
          isOwner={isOwner}
          conversation={aiConversation}
          onUpdateConversation={updateAiConversation}
          onBack={() => setScreen('inicio')}
          onInviteBotToServer={handleInviteAiBotToServer}
          onApplyBuildPlan={handleApplyAiBuildToServer}
          onDeductCredits={(amount) => updateAiCredits((prev) => prev - amount)}
          onGrantBonusCredits={
            isOwner
              ? (amount) => {
                  updateAiCredits((prev) => prev + amount);
                  showToastMsg(`+${amount} créditos agregados`);
                }
              : undefined
          }
          onNavigateToServer={(serverId) => {
            const target = servers.find((s) => s.id === serverId);
            const firstCh =
              target?.channels.find((c) => c.type !== 'voice' && !c.isPrivate) ||
              target?.channels[0];
            setActiveContext({ type: 'server', serverId });
            setSelectedChannelId(firstCh?.id || null);
            setScreen('inicio');
            setMobileChatOpen(false);
          }}
        />
      );
    }
    if (screen === 'tu') {
      return (
        <ProfileView
          user={user}
          servers={allServers}
          unreadTotal={unreadTotal}
          wishlistIds={wishlistIds}
          ownedBundleIds={ownedBundleIds}
          shopBundles={INITIAL_SHOP_BUNDLES}
          hasUnclaimedQuests={hasUnclaimedQuests}
          isOwner={isOwner}
          onOpenOwnerPanel={() => isOwner && setShowOwnerPanel(true)}
          profileViewTrigger={profileViewTrigger}
          initialEditorRequest={profileEditorRequest}
          onConsumeEditorRequest={() => setProfileEditorRequest(null)}
          onClose={() => setScreen('inicio')}
          onNavigate={(s) => setScreen(s)}
          onUpdateUser={(patch) => {
            const nextUser = sanitizeUserShopCosmetics(
              { ...user, ...patch },
              ownedBundleIds,
              INITIAL_SHOP_BUNDLES,
              isOwner
            );
            setUser(nextUser);
            flushCloudAccountSync({ user: nextUser });
          }}
          onQueueNitroNameStyle={(patch) => setPendingNitroNamePatch(patch)}
          onShowToast={showToastMsg}
          onOpenBundle={(b) => {
            setSelectedShopBundle(b);
            setScreen('tienda');
          }}
        />
      );
    }
    if (screen === 'misiones') {
      return (
        <QuestsView
          user={user}
          quests={quests}
          theme={theme}
          onBack={() => setScreen('inicio')}
          onClaimQuest={handleClaimQuest}
          onApplyPurpleTheme={() => {
            setTheme((t) => (t === 'purple' ? 'onyx' : 'purple'));
            showToastMsg(
              theme === 'purple' ? 'Tema Onyx restaurado' : 'Tema Morado aplicado'
            );
          }}
          onOpenNitro={() => setScreen('nitro')}
          onJoinDuneServer={() => handleAddServer('Dune: Arrakis Hub')}
        />
      );
    }
    if (screen === 'tienda') {
      return (
        <ShopView
          user={user}
          bundles={INITIAL_SHOP_BUNDLES}
          dms={liveDms}
          wishlistIds={wishlistIds}
          ownedBundleIds={ownedBundleIds}
          selectedBundle={selectedShopBundle}
          isOwner={isOwner}
          onOpenOwnerPanel={() => isOwner && setShowOwnerPanel(true)}
          onSelectBundle={setSelectedShopBundle}
          onToggleWishlist={(id) =>
            setWishlistIds((prev) =>
              prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
            )
          }
          onBuyBundle={handleBuyBundle}
          onEquipBundle={handleEquipBundle}
          onGiftBundle={handleGiftBundle}
          onBack={() => setScreen('inicio')}
        />
      );
    }
    if (screen === 'nitro') {
      return (
        <NitroView
          user={user}
          isOwner={isOwner}
          onOpenOwnerPanel={() => isOwner && setShowOwnerPanel(true)}
          onBack={() => setScreen('inicio')}
          onSubscribe={(tier) => {
            if (!isOwner) {
              showToastMsg(
                'Se requiere un método de pago USD verificado para activar Nitro.'
              );
              return;
            }
            const nextUser: UserProfile = {
              ...user,
              nitroTier: tier,
              ...(pendingNitroNamePatch || {}),
              ...unlockBadgeHelper(user, 'nitro'),
            };
            setUser(nextUser);
            flushCloudAccountSync({ user: nextUser });
            const appliedQueuedGlow = Boolean(pendingNitroNamePatch);
            setPendingNitroNamePatch(null);
            playUiSound('ping', appPreferences.soundsEnabled);
            showToastMsg(
              appliedQueuedGlow
                ? `¡Nitro activado por Owner y brillo aplicado a tu nombre!`
                : tier === 'nitro'
                ? '¡Primordial Nitro activado por Owner!'
                : '¡Primordial Nitro Basic activado por Owner!'
            );
            setScreen('tu');
          }}
        />
      );
    }
    if (screen === 'insignias') {
      return (
        <BadgesView
          user={user}
          onBack={() => setScreen('tu')}
          onUpdateUser={(patch) => setUser((prev) => ({ ...prev, ...patch }))}
          onOpenServerBoost={() => {
            setBoostTargetServerId(null);
            setScreen('mejoras');
          }}
          onOpenShop={() => setScreen('tienda')}
          onOpenNitro={() => setScreen('nitro')}
          onOpenQuests={() => setScreen('misiones')}
          onLogStreamHour={handleLogStreamHour}
          onLogGamePlayed={handleLogGamePlayed}
          onAdvanceAccountYear={handleAdvanceAccountYear}
          onLogBetaTest={handleLogBetaTest}
        />
      );
    }
    if (screen === 'mejoras') {
      return (
        <ServerBoostView
          servers={allServers}
          user={user}
          initialServerId={boostTargetServerId}
          onBack={() => {
            setBoostTargetServerId(null);
            setScreen('tu');
          }}
          onBoostServer={handleBoostServer}
          onUnlockServerPerk={handleUnlockServerPerk}
          onOpenNitro={() => setScreen('nitro')}
        />
      );
    }
    if (screen === 'ajustes') {
      return (
        <SettingsView
          user={user}
          theme={theme}
          appPreferences={appPreferences}
          isOwner={isOwner}
          ownedUiThemes={ownedCosmetics.uiThemes}
          ownedVoiceEffects={ownedCosmetics.voiceEntryEffects}
          onChangeVoiceEffect={handleChangeVoiceEffect}
          onOpenOwnerPanel={() => isOwner && setShowOwnerPanel(true)}
          onUpdateAppPreferences={handleUpdateAppPreferences}
          onChangeTheme={setTheme}
          onBack={() => setScreen('tu')}
          onOpenNitro={() => setScreen('nitro')}
          onOpenShop={() => setScreen('tienda')}
          onOpenQuests={() => setScreen('misiones')}
          onOpenServerBoost={() => {
            setBoostTargetServerId(null);
            setScreen('mejoras');
          }}
          onOpenBadges={() => setScreen('insignias')}
          onLogout={handleLogout}
          onNotify={showToastMsg}
        />
      );
    }
    if (screen === 'amigos') {
      return (
        <FriendsView
          dms={liveDms}
          liveProfilesByUid={livePublicProfilesMap}
          friendRequests={friendRequests}
          sentFriendRequestUids={sentFriendRequestUids}
          sentFriendRequestItems={sentFriendRequestItems}
          currentUsername={user.username}
          currentDisplayName={user.displayName}
          initialFriendQuery={initialFriendQuery}
          isCloudConnected={Boolean(firebaseUid)}
          authProviderNeedsSetup={authProviderNeedsSetup}
          onInviteLinkShared={() =>
            rewardActivityOrbs('invite', 100, 'Enlace de invitación compartido', 300_000)
          }
          onRetryCloudSync={() => {
            if (!activeAccountId) return;
            const savedAcc = accounts.find((a) => a.id === activeAccountId);
            autoCloudAttemptedRef.current = null;
            void syncAppAccountToCloud({
              accountId: activeAccountId,
              localUser: savedAcc?.user || user,
              email: savedAcc?.user.email,
              password: savedAcc?.password,
              ownedBundleIds,
              wishlistIds,
              claimedQuestIds,
              joinedServerIds,
              isOwnerAccount: Boolean(savedAcc?.isOwnerAccount),
              createIfMissing: true,
            }).then((ok) => {
              if (ok) {
                showToastMsg('¡Conectado a la nube! Ya puedes buscar amigos.');
              }
            });
          }}
          onBack={() => setScreen('inicio')}
          onOpenDm={handleSelectDm}
          onAddFriend={handleAddFriend}
          onSearchUsers={handleSearchUsers}
          onAddRealUser={handleAddRealUser}
          onSendFriendRequest={handleSendFriendRequest}
          onRespondFriendRequest={handleRespondFriendRequest}
          onCancelSentRequest={handleCancelSentRequest}
          onInspectUser={handleInspectUser}
        />
      );
    }
    if (screen === 'notificaciones') {
      return (
        <NotificationsView
          notifications={notifications}
          onMarkAllRead={() => {
            const unreadIds = notifications.filter((n) => n.unread).map((n) => n.id);
            setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
            if (firebaseUid && unreadIds.length > 0) {
              void markAllNotificationsReadInFirestore(firebaseUid, unreadIds).catch(
                () => undefined
              );
            }
          }}
          onClickNotification={(n) => {
            setNotifications((prev) =>
              prev.map((item) => (item.id === n.id ? { ...item, unread: false } : item))
            );
            if (firebaseUid) {
              void markNotificationReadInFirestore(firebaseUid, n.id).catch(() => undefined);
            }
            if (n.type === 'quest') {
              setScreen('misiones');
            } else if (n.type === 'system') {
              setScreen('nitro');
            } else if (n.targetServerId && n.targetChannelId) {
              handleSelectChannel(n.targetServerId, n.targetChannelId);
            } else if (n.targetDmId) {
              handleSelectDm(n.targetDmId);
            } else {
              setScreen('amigos');
            }
          }}
        />
      );
    }

    if (screen === 'servidor-ajustes' && serverSettingsTarget) {
      const srv = allServers.find((s) => s.id === serverSettingsTarget.serverId) || allServers[0];
      if (srv) {
        return (
          <ServerSettingsView
            key={`${srv.id}-${serverSettingsTarget.section}`}
            server={srv}
            user={user}
            initialSection={serverSettingsTarget.section}
            onBack={() => setScreen('inicio')}
            onUpdateServer={handleUpdateServer}
            onToggleMemberAdmin={handleToggleMemberAdmin}
            onUpdateMemberRoles={handleUpdateMemberRoles}
            onKickMember={handleKickMember}
            onAddChannel={handleAddChannel}
            onUpdateChannel={handleUpdateChannel}
            onDeleteChannel={handleDeleteChannel}
            onMoveChannel={handleMoveChannel}
            onAddCategory={handleAddCategory}
            onRenameCategory={handleRenameCategory}
            onDeleteCategory={handleDeleteCategory}
            onMoveCategory={handleMoveCategory}
            onOpenServerBoost={(serverId) => {
              setBoostTargetServerId(serverId);
              setScreen('mejoras');
            }}
            onLeaveServer={(serverId) => {
              if (isCuratedServerId(serverId)) {
                setJoinedCuratedIds((prev) => {
                  const next = prev.filter((id) => id !== serverId);
                  saveCuratedJoinedIds(activeAccountId, next);
                  return next;
                });
                setActiveContext({ type: 'dm' });
                setSelectedChannelId(null);
                setScreen('inicio');
                showToastMsg(`Has salido de ${srv.name}`);
                return;
              }
              const targetSrv = servers.find((s) => s.id === serverId);
              if (isServerOwner(targetSrv, user.id)) {
                showToastMsg('Eres el dueño de este servidor y no puedes abandonarlo');
                return;
              }
              const targetName = targetSrv?.name || 'el servidor';
              if (firebaseUid) {
                void leaveFirestoreServer(firebaseUid, serverId).catch(() =>
                  showToastMsg('No se pudo salir del servidor')
                );
                setJoinedServerIds((prev) => prev.filter((id) => id !== serverId));
              }
              setServers((prev) => prev.filter((s) => s.id !== serverId));
              setActiveContext({ type: 'dm' });
              setSelectedChannelId(null);
              setScreen('inicio');
              showToastMsg(`Has salido de ${targetName}`);
            }}
            onDeleteServer={handleDeleteServer}
            onInspectUser={(uid) => handleInspectUser(uid)}
            onInviteOfficialBot={handleInviteAiBotToServer}
            onNotify={showToastMsg}
          />
        );
      }
    }

    if (
      ((activeContext.type === 'dm' ||
        activeContext.type === 'favorites' ||
        activeContext.type === 'servidores') &&
        !activeDm) ||
      (activeContext.type === 'server' && !activeServer)
    ) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-[var(--dc-bg-chat)] text-[var(--dc-text-primary)]">
          <div className="max-w-md w-full space-y-5">
            <div className="flex justify-center">
              <PrimordialAppIcon className="w-20 h-20 rounded-3xl shadow-2xl border border-white/15" />
            </div>
            <div className="space-y-1.5">
              <h2 className="font-display font-extrabold text-2xl tracking-tight">
                Bienvenido a Primordial
              </h2>
              <p className="text-sm text-[var(--dc-text-secondary)]">
                Tu espacio empieza limpio: busca a tus amigos para chatear o crea y explora servidores a tu manera.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setScreen('amigos')}
                className="px-4 py-3 rounded-2xl dc-btn-primary text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
              >
                <Search className="w-4 h-4 shrink-0" />
                <span>Buscar amigos</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setCreateServerTemplate('friends');
                  setShowCreateServer(true);
                }}
                className="px-4 py-3 rounded-2xl dc-btn-secondary text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span>Crear servidor</span>
              </button>
              <button
                type="button"
                onClick={() => setShowDiscover(true)}
                className="px-4 py-3 rounded-2xl dc-btn-success text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
              >
                <Compass className="w-4 h-4 shrink-0" />
                <span>Buscar servidores</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    const activeTypingKey =
      activeContext.type === 'server'
        ? selectedChannelId || ''
        : activeDm?.id || '';

    return (
      <ChatView
        mode={activeContext.type === 'server' ? 'channel' : 'dm'}
        dm={activeDm}
        server={activeServer}
        channelId={selectedChannelId || undefined}
        currentUser={user}
        dms={liveDms}
        allServers={allServers}
        liveProfilesByUid={livePublicProfilesMap}
        typingLabel={activeTypingKey ? typingMap[activeTypingKey] || null : null}
        appPreferences={appPreferences}
        parentCollectionPath={getActiveMessagesCollectionPath() || undefined}
        onBackMobile={() => setMobileChatOpen(false)}
        onSendMessage={handleSendMessage}
        onSendRichMessage={handleSendRichMessage}
        onEditMessage={handleEditMessage}
        onDeleteMessage={handleDeleteMessage}
        onTogglePinMessage={handleTogglePinMessage}
        onVotePoll={handleVotePoll}
        onForwardMessage={handleForwardMessage}
        onToggleDmFavorite={() => activeDm && handleToggleDmFavorite(activeDm.id)}
        onToggleDmMute={() => activeDm && handleToggleDmMute(activeDm.id)}
        onToggleReaction={handleToggleReaction}
        onStartCall={(video, screen) => {
          if (
            screen &&
            voiceSession.active &&
            ((activeContext.type === 'dm' && activeDm && voiceSession.dmId === activeDm.id) ||
              (activeContext.type === 'server' &&
                activeChannelObj &&
                voiceSession.channelId === activeChannelObj.id))
          ) {
            void handleToggleVoiceScreen();
            return;
          }
          void startCallSession({
            dm: activeContext.type === 'dm' ? activeDm : undefined,
            serverId: activeContext.type === 'server' ? activeServer?.id : undefined,
            channelId: activeContext.type === 'server' ? activeChannelObj?.id : undefined,
            channelName:
              activeContext.type === 'server'
                ? activeChannelObj?.name || 'Canal de voz'
                : activeDm?.name || 'Llamada',
            contextName:
              activeContext.type === 'server' ? activeServer?.name || '' : 'Mensaje directo',
            video,
            screen,
          });
        }}
        onJoinInviteServer={(url) => {
          void handleJoinServerById(url);
        }}
        onOpenNitro={() => setScreen('nitro')}
        onOpenServerSettings={handleOpenServerSettings}
        onUpdateNickname={handleUpdateNickname}
        onClearLocalChat={handleClearLocalChat}
        onBotQuickAction={handleBotQuickAction}
        onInspectUser={handleInspectUser}
      />
    );
  };

  const isMobileOverlayScreen = [
    'tu',
    'misiones',
    'tienda',
    'nitro',
    'ajustes',
    'amigos',
    'insignias',
    'mejoras',
    'servidor-ajustes',
    'ia-asistente',
  ].includes(screen);

  return (
    <>
      {!activeAccountId ? (
        <AuthView
          accounts={accounts}
          onLoginAccount={handleLoginAccount}
          onCloudLogin={handleCloudLogin}
          onRegisterAccount={handleRegisterAccount}
          onResetPassword={handleResetAccountPassword}
        />
      ) : (
        <I18nProvider language={appPreferences.language || 'es'}>
        <MotionConfig reducedMotion="user">
        <div
          className={`w-screen h-screen flex flex-col bg-[var(--dc-bg-rail)] text-[var(--dc-text-primary)] overflow-hidden ${themeClass}`}
        >
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[70] px-4 py-2 rounded-full bg-[#23a55a] text-white text-xs font-bold shadow-2xl pointer-events-none">
          {toast}
        </div>
      )}

      {incomingCalls.filter((c) => c.dmId !== voiceSession.dmId).length > 0 && (() => {
        const ring = incomingCalls.filter((c) => c.dmId !== voiceSession.dmId)[0];
        const dmMatch = dms.find((d) => d.id === ring.dmId);
        return (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[75] w-[calc(100%-2rem)] max-w-md rounded-2xl bg-[#1c1d22]/95 backdrop-blur-md border border-[#23a55a]/50 p-3.5 shadow-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <UserAvatar
                avatar={dmMatch?.avatar || ring.callerAvatar}
                customAvatarUrl={dmMatch?.customAvatarUrl}
                status="online"
                size="md"
                borderColor="#1c1d22"
              />
              <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate">
                  {dmMatch?.name || ring.callerName}
                </p>
                <p className="text-[11.5px] font-semibold text-[#3dd67d] animate-pulse truncate">
                  {ring.screenSharing
                    ? 'Compartiendo pantalla · Llamada entrante'
                    : ring.videoOn
                    ? 'Videollamada entrante...'
                    : 'Llamada de voz entrante...'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => void answerIncomingCall(ring, 'audio')}
                title="Contestar con voz"
                className="w-10 h-10 rounded-full bg-[#23a55a] hover:bg-[#1e934e] text-white flex items-center justify-center cursor-pointer shadow-md"
              >
                <PhoneCall className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => void answerIncomingCall(ring, 'video')}
                title="Contestar con video"
                className="w-10 h-10 rounded-full bg-[#5865F2] hover:bg-[#4752c4] text-white flex items-center justify-center cursor-pointer shadow-md"
              >
                <Video className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => void rejectDmIncomingCall(ring.dmId)}
                title="Rechazar"
                className="w-10 h-10 rounded-full bg-[#f23f43] hover:bg-[#d83337] text-white flex items-center justify-center cursor-pointer shadow-md"
              >
                <PhoneOff className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })()}

      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left Server Rail + Sidebar */}
        <div
          className={`flex h-full min-h-0 shrink-0 ${
            isMobileOverlayScreen || mobileChatOpen
              ? 'hidden md:flex'
              : 'flex w-full md:w-[360px] lg:w-[376px]'
          }`}
        >
          <ServerRail
            servers={orderedServers}
            activeContext={activeContext}
            isAiAssistantActive={screen === 'ia-asistente'}
            onSelectDm={() => {
              setActiveContext({ type: 'dm' });
              setScreen('inicio');
              setMobileChatOpen(false);
            }}
            onSelectFavorites={() => {
              setActiveContext({ type: 'favorites' });
              setScreen('inicio');
              setMobileChatOpen(false);
            }}
            onSelectServer={handleSelectServer}
            onOpenBotDm={() => setScreen('amigos')}
            onOpenAddServer={() => {
              setCreateServerTemplate('friends');
              setShowCreateServer(true);
            }}
            onOpenDiscover={() => setShowDiscover(true)}
            onOpenAiAssistant={() => {
              if (
                activeContext.type === 'server' &&
                servers.some((s) => s.id === activeContext.serverId)
              ) {
                const openSrvId = activeContext.serverId;
                updateAiConversation((prev) => ({
                  ...prev,
                  selectedTargetId: openSrvId,
                }));
              }
              setScreen('ia-asistente');
              setMobileChatOpen(false);
            }}
            onMoveServer={handleMoveServer}
          />

          <div className="flex-1 flex flex-col min-w-0 min-h-0">
            <AnimatePresence mode="wait" initial={false}>
              {screen === 'notificaciones' ? (
                <motion.div
                  key="mobile-notifs"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.16, ease: 'easeOut' }}
                  className="flex-1 md:hidden flex flex-col min-h-0"
                >
                  <NotificationsView
                    notifications={notifications}
                    onMarkAllRead={() => {
                      const unreadIds = notifications.filter((n) => n.unread).map((n) => n.id);
                      setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
                      if (firebaseUid && unreadIds.length > 0) {
                        void markAllNotificationsReadInFirestore(firebaseUid, unreadIds).catch(
                          () => undefined
                        );
                      }
                    }}
                    onClickNotification={(n) => {
                      setNotifications((prev) =>
                        prev.map((item) => (item.id === n.id ? { ...item, unread: false } : item))
                      );
                      if (firebaseUid) {
                        void markNotificationReadInFirestore(firebaseUid, n.id).catch(
                          () => undefined
                        );
                      }
                      if (n.type === 'quest') {
                        setScreen('misiones');
                      } else if (n.type === 'system') {
                        setScreen('nitro');
                      } else if (n.targetServerId && n.targetChannelId) {
                        handleSelectChannel(n.targetServerId, n.targetChannelId);
                      } else if (n.targetDmId) {
                        handleSelectDm(n.targetDmId);
                      } else {
                        setScreen('amigos');
                      }
                    }}
                  />
                </motion.div>
              ) : null}
            </AnimatePresence>

            <div
              className={`flex-1 flex flex-col min-h-0 ${
                screen === 'notificaciones' ? 'hidden md:flex' : 'flex'
              }`}
            >
              <MessagesPanel
                dms={liveDms}
                activities={INITIAL_ACTIVITIES}
                servers={orderedServers}
                activeContext={activeContext}
                selectedDmId={selectedDmId}
                selectedChannelId={selectedChannelId}
                voiceSession={voiceSession}
                currentUser={user}
                typingDmIds={typingMap}
                pendingFriendRequestsCount={friendRequests.length}
                curatedServers={CURATED_PUBLIC_SERVERS}
                joinedCuratedIds={joinedCuratedIds}
                dropInRooms={dropInRooms}
                liveProfilesByUid={livePublicProfilesMap}
                onSelectDm={handleSelectDm}
                onSelectChannel={handleSelectChannel}
                onJoinVoice={(srvId, chId, chName, srvName) => {
                  void startCallSession({
                    serverId: srvId,
                    channelId: chId,
                    channelName: chName,
                    contextName: srvName,
                    video: false,
                  });
                }}
                onJoinDropInRoom={(room) => void handleJoinDropInRoom(room)}
                onUpdateEphemeralStatus={handleUpdateEphemeralStatus}
                onJoinCuratedServer={handleJoinCuratedServer}
                onOpenFriends={() => setScreen('amigos')}
                onOpenNewGroupDm={() => {
                  setGroupMemberIds([]);
                  setGroupTitle('');
                  setGroupEmoji('💬');
                  setGroupColor('#5865F2');
                  setGroupCustomIconUrl(undefined);
                  setShowNewGroupDm(true);
                }}
                onSelectActivity={(act) => handleAddFriend(act.displayName)}
                onOpenCreateServerModal={(tpl) => {
                  setCreateServerTemplate(tpl || 'friends');
                  setShowCreateServer(true);
                }}
                onJoinCommunity={(nameOrId) => {
                  void handleJoinServerById(nameOrId);
                }}
                onOpenDiscover={() => setShowDiscover(true)}
                onOpenServerBoost={(serverId) => {
                  setBoostTargetServerId(serverId);
                  setScreen('mejoras');
                }}
                onOpenServerSettings={handleOpenServerSettings}
                onMarkServerRead={handleMarkServerRead}
                onUpdateServer={handleUpdateServer}
                onOpenProfile={(serverId) => {
                  if (serverId) {
                    setProfileEditorRequest({ tab: 'servidor', serverId });
                  }
                  setProfileViewTrigger((k) => k + 1);
                  setScreen('tu');
                }}
                onInspectUser={handleInspectUser}
                onToggleDmPin={handleToggleDmPin}
                onToggleDmMute={handleToggleDmMute}
                onToggleDmUnread={handleToggleDmUnread}
                onToggleDmFavorite={handleToggleDmFavorite}
                onCloseDm={handleCloseDm}
                onNotify={showToastMsg}
              />
            </div>

            <VoiceOverlay
              voice={voiceSession}
              currentUser={user}
              soundsEnabled={appPreferences.soundsEnabled}
              localVideoStream={localVideoStream}
              remoteVideoStream={remoteVideoStream}
              remoteAudioStream={remoteAudioStream}
              onToggleMute={handleToggleVoiceMute}
              onToggleDeafen={handleToggleVoiceDeafen}
              onToggleVideo={() => void handleToggleVoiceVideo()}
              onToggleScreen={() => void handleToggleVoiceScreen()}
              onOpenScreenStudio={() => {
                setScreenStudioNotice(null);
                setShowScreenStudio(true);
              }}
              onDisconnect={handleDisconnectVoice}
            />
          </div>
        </div>

        {/* Right Desktop Workspace + Mobile Fullscreen Subviews */}
        <main
          className={`flex-1 flex flex-col min-w-0 min-h-0 ${
            isMobileOverlayScreen || mobileChatOpen ? 'flex' : 'hidden md:flex'
          }`}
        >
          {/* Desktop Top Architectural Navigation Bar */}
          <div className="hidden md:flex h-12 px-4 bg-[var(--dc-bg-rail)]/95 backdrop-blur-xl border-b border-[var(--dc-border)] items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
              {[
                { id: 'inicio' as const, label: tApp('nav.chat'), icon: Home },
                { id: 'notificaciones' as const, label: tApp('nav.notifications'), icon: Bell },
                { id: 'amigos' as const, label: tApp('nav.friends'), icon: UserPlus },
                { id: 'misiones' as const, label: tApp('nav.quests'), icon: LaurelQuestIcon },
                { id: 'tienda' as const, label: tApp('nav.shop'), icon: Store },
                { id: 'insignias' as const, label: tApp('nav.badges'), icon: Award },
                { id: 'mejoras' as const, label: tApp('nav.boosts'), icon: BoostGemIcon },
                { id: 'nitro' as const, label: tApp('nav.nitro'), icon: NitroWheelIcon },
                { id: 'ajustes' as const, label: tApp('nav.settings'), icon: Settings },
                { id: 'tu' as const, label: tApp('nav.myProfile'), icon: null },
              ].map((item) => {
                const Icon = item.icon;
                const active = screen === item.id;
                const isNitroBtn = item.id === 'nitro';
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.id === 'mejoras') setBoostTargetServerId(null);
                      if (item.id === 'tu') setProfileViewTrigger((k) => k + 1);
                      setScreen(item.id);
                    }}
                    className={`relative h-8 inline-flex items-center gap-1.5 px-3 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                      active
                        ? 'bg-[var(--dc-blurple)] text-white shadow-[0_4px_14px_-4px_rgba(88,101,242,0.55)]'
                        : isNitroBtn
                        ? 'bg-fuchsia-500/12 border border-fuchsia-400/25 text-fuchsia-200 hover:bg-fuchsia-500/20'
                        : 'text-[var(--dc-text-secondary)] hover:bg-black/5 dark:hover:bg-white/[0.07] hover:text-[var(--dc-text-primary)]'
                    }`}
                  >
                    {Icon && (
                      <Icon
                        className={`w-3.5 h-3.5 ${
                          isNitroBtn && !active ? 'text-fuchsia-300' : ''
                        }`}
                      />
                    )}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <PWAInstallButton variant="compact" />
              <button
                onClick={() =>
                  setTheme((t) =>
                    t === 'onyx' ? 'purple' : t === 'purple' ? 'light' : 'onyx'
                  )
                }
                title="Cambiar tema (Onyx / Morado / Claro)"
                className={`h-8 inline-flex items-center gap-1.5 px-3 rounded-xl text-xs font-semibold cursor-pointer border transition-colors ${
                  theme === 'purple'
                    ? 'bg-violet-500/15 border-violet-400/40 text-violet-300 hover:bg-violet-500/25'
                    : 'bg-[var(--dc-bg-card)] border-[var(--dc-border)] text-[var(--dc-text-primary)] hover:bg-[var(--dc-bg-elevated)]'
                }`}
              >
                {theme === 'light' ? (
                  <Sun className="w-3.5 h-3.5" />
                ) : theme === 'purple' ? (
                  <span className="w-2.5 h-2.5 rounded-full bg-violet-500 shadow-[0_0_8px_#8b5cf6]" />
                ) : (
                  <Moon className="w-3.5 h-3.5" />
                )}
                <span>
                  {theme === 'light'
                    ? tApp('theme.light')
                    : theme === 'purple'
                    ? tApp('theme.purple')
                    : theme === 'cyber'
                    ? 'Cyber'
                    : theme === 'emerald'
                    ? 'Esmeralda'
                    : theme === 'crimson'
                    ? 'Carmesí'
                    : tApp('theme.onyx')}
                </span>
              </button>
              <button
                onClick={() => setScreen('misiones')}
                className="h-8 inline-flex items-center gap-1.5 px-3 rounded-xl bg-[var(--dc-bg-card)] hover:bg-[var(--dc-bg-elevated)] border border-[var(--dc-border)] text-xs font-bold tabular-nums cursor-pointer transition-colors"
              >
                <OrbsCrystalIcon className="w-3.5 h-3.5 text-indigo-400" />
                <span>{user.orbs.toLocaleString('es-ES')}</span>
              </button>
            </div>
          </div>

          <div className="flex-1 flex min-h-0 overflow-hidden">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={`${screen}-${activeContext.type}-${activeContext.type === 'server' ? activeContext.serverId : ''}-${selectedDmId || ''}-${selectedChannelId || ''}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.16, ease: 'easeOut' }}
                className="flex-1 flex min-h-0 overflow-hidden"
              >
                {renderDesktopWorkspace()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Full-Width Frosted Obsidian Mobile Bottom Bar */}
      {!isMobileOverlayScreen && !mobileChatOpen && (
        <nav
          aria-label="Navegación principal móvil"
          className="md:hidden w-full bg-[var(--dc-bg-rail)]/95 backdrop-blur-2xl border-t border-white/[0.08] shadow-[0_-10px_30px_-8px_rgba(0,0,0,0.6)] pb-[env(safe-area-inset-bottom)] shrink-0 z-30"
        >
          <div className="grid grid-cols-5 w-full max-w-lg mx-auto h-[62px] px-1.5 items-center">
            <button
              type="button"
              onClick={() => {
                setScreen('inicio');
                setMobileChatOpen(false);
              }}
              className={`relative min-h-[48px] flex flex-col items-center justify-center gap-1 rounded-xl text-[10.5px] font-semibold transition-all active:scale-95 cursor-pointer ${
                screen === 'inicio'
                  ? 'text-[var(--dc-text-primary)]'
                  : 'text-[var(--dc-text-muted)] hover:text-[var(--dc-text-secondary)]'
              }`}
            >
              {screen === 'inicio' && (
                <span
                  aria-hidden="true"
                  className="absolute top-0.5 w-6 h-[2.5px] rounded-full bg-[var(--dc-blurple)]"
                />
              )}
              <div
                className={`w-10 h-6.5 rounded-xl flex items-center justify-center transition-colors ${
                  screen === 'inicio' ? 'bg-[var(--dc-blurple)]/15' : ''
                }`}
              >
                <Home
                  className={`w-[19px] h-[19px] ${
                    screen === 'inicio' ? 'text-[var(--dc-blurple)]' : ''
                  }`}
                />
              </div>
              <span className="leading-none">{tApp('nav.home')}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setScreen('amigos');
                setMobileChatOpen(false);
              }}
              className={`relative min-h-[48px] flex flex-col items-center justify-center gap-1 rounded-xl text-[10.5px] font-semibold transition-all active:scale-95 cursor-pointer ${
                screen === 'amigos'
                  ? 'text-[var(--dc-text-primary)]'
                  : 'text-[var(--dc-text-muted)] hover:text-[var(--dc-text-secondary)]'
              }`}
            >
              <div className="relative w-10 h-6.5 rounded-xl flex items-center justify-center">
                <UserPlus className="w-[19px] h-[19px]" />
                {friendRequests.length > 0 && (
                  <span className="absolute -top-0.5 right-0.5 min-w-[16px] h-[16px] px-1 rounded-full bg-[#da373c] text-white text-[9px] font-bold tabular-nums flex items-center justify-center border-2 border-[var(--dc-bg-rail)] leading-none">
                    {friendRequests.length}
                  </span>
                )}
              </div>
              <span className="leading-none">{tApp('nav.friends')}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setScreen('tienda');
                setMobileChatOpen(false);
              }}
              className="relative min-h-[48px] flex flex-col items-center justify-center gap-1 rounded-xl text-[10.5px] font-semibold text-violet-300 hover:text-violet-200 transition-all active:scale-95 cursor-pointer"
            >
              <div className="w-10 h-6.5 rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/15 border border-violet-400/25 flex items-center justify-center">
                <Store className="w-[18px] h-[18px] text-violet-400" />
              </div>
              <span className="leading-none">{tApp('nav.shop')}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setScreen('notificaciones');
                setMobileChatOpen(false);
              }}
              className={`relative min-h-[48px] flex flex-col items-center justify-center gap-1 rounded-xl text-[10.5px] font-semibold transition-all active:scale-95 cursor-pointer ${
                screen === 'notificaciones'
                  ? 'text-[var(--dc-text-primary)]'
                  : 'text-[var(--dc-text-muted)] hover:text-[var(--dc-text-secondary)]'
              }`}
            >
              {screen === 'notificaciones' && (
                <span
                  aria-hidden="true"
                  className="absolute top-0.5 w-6 h-[2.5px] rounded-full bg-[var(--dc-blurple)]"
                />
              )}
              <div
                className={`relative w-10 h-6.5 rounded-xl flex items-center justify-center transition-colors ${
                  screen === 'notificaciones' ? 'bg-[var(--dc-blurple)]/15' : ''
                }`}
              >
                <Bell
                  className={`w-[19px] h-[19px] ${
                    screen === 'notificaciones' ? 'text-[var(--dc-blurple)]' : ''
                  }`}
                />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-0.5 right-0.5 min-w-[16px] h-[16px] px-1 rounded-full bg-[#da373c] text-white text-[9px] font-bold tabular-nums flex items-center justify-center border-2 border-[var(--dc-bg-rail)] leading-none">
                    {unreadNotificationsCount}
                  </span>
                )}
              </div>
              <span className="leading-none">{tApp('nav.notifications')}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setProfileViewTrigger((k) => k + 1);
                setScreen('tu');
              }}
              className={`relative min-h-[48px] flex flex-col items-center justify-center gap-1 rounded-xl text-[10.5px] font-semibold transition-all active:scale-95 cursor-pointer ${
                screen === 'tu'
                  ? 'text-[var(--dc-text-primary)]'
                  : 'text-[var(--dc-text-muted)] hover:text-[var(--dc-text-secondary)]'
              }`}
            >
              <div
                className={`rounded-full p-[1.5px] transition-all ${
                  screen === 'tu' ? 'ring-2 ring-[var(--dc-blurple)]' : ''
                }`}
              >
                <UserAvatar
                  avatar={user.avatar}
                  customAvatarUrl={user.customAvatarUrl}
                  status={user.status}
                  size="xs"
                  borderColor="var(--dc-bg-rail)"
                  showStatus={true}
                />
              </div>
              <span className="leading-none">{tApp('nav.you')}</span>
            </button>
          </div>
        </nav>
      )}

      <CreateServerModal
        open={showCreateServer}
        initialTemplate={createServerTemplate}
        onClose={() => setShowCreateServer(false)}
        onCreate={handleAddServer}
      />

      <DiscoverModal
        open={showDiscover}
        onClose={() => setShowDiscover(false)}
        discoverableServers={discoverableServers}
        joinedServerIds={[...joinedServerIds, ...joinedCuratedIds]}
        onLoadServers={handleLoadDiscoverableServers}
        onJoinServer={handleJoinServerById}
        onOpenCreateServer={() => {
          setCreateServerTemplate('friends');
          setShowCreateServer(true);
        }}
      />

      {showNewGroupDm && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowNewGroupDm(false);
          }}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl bg-[var(--dc-bg-sheet)] border border-[var(--dc-border)] p-5 space-y-3.5 max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            <input
              ref={groupIconFileRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => {
                e.stopPropagation();
                const f = e.target.files?.[0];
                if (f) {
                  const reader = new FileReader();
                  reader.onload = () => {
                    if (typeof reader.result === 'string') {
                      setGroupCustomIconUrl(reader.result);
                    }
                  };
                  reader.readAsDataURL(f);
                }
                e.target.value = '';
              }}
            />
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-lg text-[var(--dc-text-primary)]">
                  Nuevo mensaje o grupo
                </h3>
                <p className="text-[11px] text-[var(--dc-text-muted)]">
                  Toca 1 amigo para chatear o selecciona varios para crear un grupo con nombre e icono
                </p>
              </div>
              <button
                onClick={() => setShowNewGroupDm(false)}
                className="p-1 text-[var(--dc-text-muted)] hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Custom Group Name & Icon Editor */}
            <div className="rounded-2xl bg-[var(--dc-bg-card)] border border-[var(--dc-border)] p-3 space-y-2.5">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => groupIconFileRef.current?.click()}
                  title="Subir icono del grupo"
                  className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center text-xl border border-white/15 shrink-0 cursor-pointer relative group"
                  style={
                    groupCustomIconUrl
                      ? undefined
                      : { background: `linear-gradient(135deg, ${groupColor} 0%, #11121a 100%)` }
                  }
                >
                  {groupCustomIconUrl ? (
                    <img src={groupCustomIconUrl} alt="Icono grupo" className="w-full h-full object-cover" />
                  ) : (
                    <span>{groupEmoji}</span>
                  )}
                </button>
                <div className="flex-1 min-w-0 space-y-1.5">
                  <input
                    type="text"
                    value={groupTitle}
                    onChange={(e) => setGroupTitle(e.target.value)}
                    placeholder="Nombre del grupo (ej. Squad Dev)"
                    className="w-full bg-[var(--dc-bg-input)] border border-[var(--dc-border)] rounded-xl px-3 py-2 text-xs text-[var(--dc-text-primary)] focus:outline-none focus:border-[#5865F2]"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => groupIconFileRef.current?.click()}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#7b85ff] hover:text-white cursor-pointer"
                    >
                      <Upload className="w-3 h-3" />
                      <span>{groupCustomIconUrl ? 'Cambiar foto' : 'Subir icono'}</span>
                    </button>
                    {groupCustomIconUrl && (
                      <button
                        type="button"
                        onClick={() => setGroupCustomIconUrl(undefined)}
                        className="text-[11px] text-zinc-400 hover:text-white cursor-pointer"
                      >
                        Usar emoji
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {!groupCustomIconUrl && (
                <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
                  <div className="flex items-center gap-1.5">
                    {['#5865F2', '#23a55a', '#ec4899', '#f59e0b', '#06b6d4', '#9333ea'].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setGroupColor(c)}
                        className={`w-5 h-5 rounded-full cursor-pointer ${
                          groupColor === c ? 'ring-2 ring-white scale-110' : 'opacity-80'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-1">
                    {['💬', '🎮', '🔥', '⚡', '🚀', '👑', '🎧'].map((em) => (
                      <button
                        key={em}
                        type="button"
                        onClick={() => setGroupEmoji(em)}
                        className={`w-6 h-6 rounded-md text-xs flex items-center justify-center cursor-pointer ${
                          groupEmoji === em ? 'bg-[#5865F2] text-white' : 'hover:bg-white/10'
                        }`}
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1.5 max-h-56 overflow-y-auto">
              {dms.filter((d) => !d.isGroup).length === 0 ? (
                <div className="rounded-2xl bg-[var(--dc-bg-card)] border border-[var(--dc-border)] p-5 text-center space-y-2.5">
                  <p className="text-xs text-[var(--dc-text-secondary)]">
                    Primero busca y añade amigos para poder crear chats grupales.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewGroupDm(false);
                      setScreen('amigos');
                    }}
                    className="px-4 py-2 rounded-full dc-btn-primary text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Buscar amigos</span>
                  </button>
                </div>
              ) : (
                dms
                  .filter((d) => !d.isGroup)
                  .map((d) => {
                    const checked = groupMemberIds.includes(d.id);
                    return (
                      <div
                        key={d.id}
                        className={`w-full flex items-center justify-between gap-2 p-2 rounded-xl transition-colors ${
                          checked
                            ? 'bg-[#5865F2]/20 border border-[#5865F2]/50'
                            : 'hover:bg-black/5 dark:hover:bg-white/10'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            if (groupMemberIds.length === 0 && !groupTitle.trim() && !groupCustomIconUrl) {
                              handleSelectDm(d.id);
                              setShowNewGroupDm(false);
                            } else {
                              setGroupMemberIds((prev) =>
                                prev.includes(d.id)
                                  ? prev.filter((id) => id !== d.id)
                                  : [...prev, d.id]
                              );
                            }
                          }}
                          className="flex-1 flex items-center gap-3 text-left min-w-0 cursor-pointer"
                        >
                          <UserAvatar
                            avatar={d.avatar}
                            status={d.status}
                            size="sm"
                            borderColor="var(--dc-bg-sheet)"
                          />
                          <span className="text-sm font-semibold text-[var(--dc-text-primary)] truncate">
                            {d.name}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setGroupMemberIds((prev) =>
                              prev.includes(d.id)
                                ? prev.filter((id) => id !== d.id)
                                : [...prev, d.id]
                            )
                          }
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer ${
                            checked
                              ? 'bg-[#5865F2] text-white'
                              : 'bg-white/10 text-zinc-300 hover:bg-white/20'
                          }`}
                        >
                          {checked ? 'Añadido' : '+ Grupo'}
                        </button>
                      </div>
                    );
                  })
              )}
            </div>

            {groupMemberIds.length >= 1 && (
              <button
                type="button"
                onClick={() => {
                  const members = dms.filter((d) => groupMemberIds.includes(d.id));
                  if (members.length < 1) return;
                  const finalName =
                    groupTitle.trim() || members.map((m) => m.name).join(', ').slice(0, 32);
                  const newGroup: DirectMessageThread = {
                    id: `dm-grp-${Date.now()}`,
                    name: finalName,
                    avatar: members[0].avatar,
                    secondaryAvatar: members[1]?.avatar,
                    customIconUrl: groupCustomIconUrl,
                    groupEmoji: groupCustomIconUrl ? undefined : groupEmoji,
                    groupColor,
                    isGroup: true,
                    status: 'online',
                    lastMessagePreview: `Grupo creado con ${members.length} ${members.length === 1 ? 'persona' : 'personas'}`,
                    lastTimestamp: 'Ahora',
                    messages: [
                      {
                        id: `grp-init-${Date.now()}`,
                        authorId: 'me',
                        authorName: user.displayName,
                        authorAvatar: user.avatar,
                        timestamp: 'Ahora',
                        content: `Creaste el grupo **${finalName}** con ${members.map((m) => `@${m.name}`).join(', ')}.`,
                        reactions: [{ emoji: '🎉', count: 1, reacted: true }],
                      },
                    ],
                  };
                  setDms((prev) => [newGroup, ...prev]);
                  setShowNewGroupDm(false);
                  handleSelectDm(newGroup.id);
                  showToastMsg(`Grupo "${finalName}" creado`);
                }}
                className="w-full h-10 rounded-full dc-btn-primary text-xs font-bold cursor-pointer"
              >
                Crear grupo ({groupMemberIds.length}{' '}
                {groupMemberIds.length === 1 ? 'persona' : 'personas'})
              </button>
            )}
          </div>
        </div>
      )}

      {selectedActivity && (
        <div
          onClick={() => setSelectedActivity(null)}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-3xl bg-[var(--dc-bg-sheet)] border border-[var(--dc-border)] p-5 space-y-4"
          >
            <div className="flex items-center gap-3">
              <UserAvatar
                avatar={selectedActivity.avatar}
                status={selectedActivity.status}
                size="lg"
                borderColor="var(--dc-bg-sheet)"
              />
              <div>
                <h3 className="font-display font-bold text-lg text-[var(--dc-text-primary)]">
                  {selectedActivity.displayName}
                </h3>
                <p className="text-xs text-[#23a55a] font-semibold">
                  {selectedActivity.gameTitle
                    ? `Jugando a ${selectedActivity.gameTitle}`
                    : 'No molestar'}
                </p>
                {selectedActivity.elapsed && (
                  <p className="text-[11px] text-[var(--dc-text-muted)]">
                    Hace {selectedActivity.elapsed}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const name = selectedActivity.displayName;
                  setSelectedActivity(null);
                  handleAddFriend(name);
                }}
                className="flex-1 h-11 rounded-full dc-btn-primary text-sm font-bold cursor-pointer"
              >
                Enviar mensaje
              </button>
              <button
                onClick={() => setSelectedActivity(null)}
                className="px-5 h-11 rounded-full dc-btn-secondary text-sm font-semibold cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      <UserProfileModal
        profile={inspectedUser?.profile || null}
        currentUser={user}
        isSelf={
          inspectedUser?.profile.id === 'me' ||
          inspectedUser?.profile.id === user.id
        }
        isFriend={
          inspectedUser
            ? liveDms.some(
                (d) =>
                  d.id === inspectedUser.profile.id ||
                  d.otherUid === inspectedUser.profile.id ||
                  d.id === `dm-${inspectedUser.profile.id}` ||
                  (d.username &&
                    inspectedUser.profile.username &&
                    d.username.toLowerCase() === inspectedUser.profile.username.toLowerCase())
              )
            : false
        }
        requestSent={
          inspectedUser
            ? sentFriendRequestUids.includes(inspectedUser.profile.id)
            : false
        }
        hasIncomingRequest={
          inspectedUser
            ? friendRequests.some((r) => r.fromUid === inspectedUser.profile.id)
            : false
        }
        serverRoles={inspectedUser?.roles || []}
        onClose={() => setInspectedUser(null)}
        onOpenSelfFullProfile={() => {
          setProfileViewTrigger((k) => k + 1);
          setScreen('tu');
        }}
        onSendMessage={(prof, initialMsg) => {
          void handleSendDmFromProfile(prof, initialMsg);
        }}
        onStartCall={(prof, video) => {
          const matchingDm = liveDms.find(
            (d) =>
              d.otherUid === prof.id ||
              d.id === prof.id ||
              (d.username && prof.username && d.username.toLowerCase() === prof.username.toLowerCase())
          );
          void startCallSession({
            dm: matchingDm,
            participantProfile: prof,
            channelName: prof.displayName,
            contextName: 'Mensaje directo',
            video,
          });
        }}
        onAcceptFriendRequest={(prof) => {
          const req = friendRequests.find((r) => r.fromUid === prof.id);
          if (req) {
            void handleRespondFriendRequest(req, true);
          }
        }}
        onToggleFriend={(prof) => {
          const existing = liveDms.find(
            (d) =>
              d.id === prof.id ||
              d.otherUid === prof.id ||
              d.id === `dm-${prof.id}` ||
              (d.username && prof.username && d.username.toLowerCase() === prof.username.toLowerCase())
          );
          if (existing) {
            showToastMsg(`${prof.displayName} ya está en tu lista de amigos`);
          } else {
            void handleSendFriendRequest(prof).catch(() => undefined);
          }
        }}
      />
      {isOwner && showOwnerPanel && (
        <OwnerPanelModal
          isOpen={showOwnerPanel}
          user={user}
          ownedBundleIds={ownedBundleIds}
          shopBundles={INITIAL_SHOP_BUNDLES}
          onClose={() => setShowOwnerPanel(false)}
          onUpdateOwnerProfile={handleOwnerUpdateProfile}
          onUnlockAllEverything={handleOwnerUnlockAllEverything}
          onUnlockAllShopBundles={handleOwnerUnlockAllShopBundles}
          onClearAllShopBundles={handleOwnerClearAllShopBundles}
          onUnlockAllBadges={handleOwnerUnlockAllBadges}
          onNotify={showToastMsg}
        />
      )}
      {voiceSession.active && (
        <ScreenShareStudioModal
          isOpen={showScreenStudio}
          isSharing={voiceSession.screenSharing}
          notice={screenStudioNotice}
          onClose={() => setShowScreenStudio(false)}
          onTryNativeScreen={() => void handleTryNativeScreenFromStudio()}
          onStartStudioStream={async (stream, label) => {
            await applySharedVideoStream(stream, label);
          }}
          onStopSharing={() => {
            if (voiceSession.screenSharing) {
              void handleToggleVoiceScreen();
            } else {
              setShowScreenStudio(false);
            }
          }}
        />
      )}
      <OfflineIndicator />
    </div>
    </MotionConfig>
    </I18nProvider>
      )}
    </>
  );
}
