import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import {
  Award,
  Bell,
  Compass,
  Home,
  Moon,
  Plus,
  Search,
  Settings,
  Store,
  Sun,
  Upload,
  UserPlus,
  X,
} from 'lucide-react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from './lib/firebase';
import {
  claimProfileWithUsername,
  createFirestoreChannel,
  createFirestoreServer,
  deleteFirestoreChannel,
  deleteFirestoreMessage,
  fetchDiscoverableServers,
  fetchUserAccountBundle,
  getOrCreateDmThread,
  isUsernameAvailable,
  joinFirestoreServer,
  leaveFirestoreServer,
  markAllNotificationsReadInFirestore,
  markDmThreadRead,
  markNotificationReadInFirestore,
  normalizeUsernameHandle,
  searchRealUsers,
  sendChannelMessage,
  sendDmMessage,
  subscribeToChannelMessages,
  subscribeToDmMessages,
  subscribeToDms,
  subscribeToNotifications,
  subscribeToServerDetail,
  syncUserAccountToFirestore,
  toggleServerMemberAdmin,
  updateFirestoreChannel,
  updateFirestoreMessage,
  updateFirestoreServer,
  updateServerMemberRolesInFirestore,
} from './services/firestoreService';
import {
  BADGE_DEFINITIONS,
  INITIAL_ACTIVITIES,
  INITIAL_DMS,
  INITIAL_NOTIFICATIONS,
  INITIAL_QUESTS,
  INITIAL_SERVERS,
  INITIAL_SHOP_BUNDLES,
  INITIAL_USER,
  resolvePublicUserProfile,
} from './data/discordData';
import {
  AvatarKey,
  BadgeId,
  Channel,
  ChatMessage,
  CreateServerPayload,
  DirectMessageThread,
  FriendActivity,
  MainScreen,
  NotificationItem,
  PublicUserProfile,
  Quest,
  Server,
  ServerRole,
  ServerSettingsSection,
  ServerTemplateId,
  ShopBundle,
  StoredAccount,
  ThemeMode,
  UserProfile,
  VoiceSession,
} from './types/discord';
import {
  LaurelQuestIcon,
  NitroWheelIcon,
  OrbsCrystalIcon,
  PrimordialAppIcon,
  UserAvatar,
} from './components/DiscordArt';
import { AuthView } from './components/AuthView';
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
import { sanitizeUserShopCosmetics } from './utils/shopOwnership';
import {
  canManageServer,
  isActiveAccountOwner,
  isServerOwner,
  normalizeSingleOwnerAccounts,
  RESERVED_OWNER_USERNAME,
} from './utils/ownerAccess';
import {
  CreateServerModal,
  DiscoverModal,
  FriendsView,
  NotificationsView,
  SettingsView,
  VoiceOverlay,
} from './components/SettingsAndModals';
import { OfflineIndicator, PWAInstallButton } from './components/PWAPrompts';

const STORAGE_KEY = 'discord_full_app_state_v2';
const ACCOUNTS_KEY = 'discord_accounts_v1';
const SESSION_KEY = 'discord_auth_session_v1';
const ORBS_BUGFIX_KEY = 'discord_orbs_bugfix_v2';
const SHOP_OWNERSHIP_MIGRATION_KEY = 'discord_shop_ownership_v1';
const CLEAN_EMPTY_START_KEY = 'primordial_clean_empty_v1';

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
          const sanitized = parsed.map((acc) => {
            const owned = acc.ownedBundleIds || [];
            const mergedAccUser: UserProfile = {
              ...INITIAL_USER,
              ...acc.user,
              orbs: normalizeOrbs(acc.user?.orbs),
            };
            return {
              ...acc,
              ownedBundleIds: owned,
              user: sanitizeUserShopCosmetics(mergedAccUser, owned, INITIAL_SHOP_BUNDLES),
            };
          });
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
    try {
      localStorage.removeItem('discord_orbs_100m_granted_v1');
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const parsedUser = parsed.user;
        const owned: string[] = parsed.ownedBundleIds || [];
        if (parsedUser) {
          const merged: UserProfile = {
            ...INITIAL_USER,
            ...parsedUser,
            orbs: normalizeOrbs(parsedUser.orbs),
            unlockedBadgeIds: parsedUser.unlockedBadgeIds || INITIAL_USER.unlockedBadgeIds,
            equippedBadgeIds: parsedUser.equippedBadgeIds || INITIAL_USER.equippedBadgeIds,
            boostsGiven: parsedUser.boostsGiven ?? 0,
            boostStreakMonths: parsedUser.boostStreakMonths ?? 0,
            giftsSent: parsedUser.giftsSent ?? 0,
            streamHours: parsedUser.streamHours ?? 0,
            gamesPlayedCount: parsedUser.gamesPlayedCount ?? 0,
            accountYears: parsedUser.accountYears ?? 0,
          };
          return sanitizeUserShopCosmetics(merged, owned, INITIAL_SHOP_BUNDLES);
        }
      }
    } catch {
      /* ignore */
    }
    return DEFAULT_ACCOUNT.user;
  });

  const [dms, setDms] = useState<DirectMessageThread[]>(() => {
    try {
      if (!localStorage.getItem(CLEAN_EMPTY_START_KEY)) {
        return INITIAL_DMS;
      }
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const savedDms: DirectMessageThread[] | undefined = JSON.parse(raw).dms;
        if (Array.isArray(savedDms)) {
          return savedDms;
        }
      }
    } catch {
      /* ignore */
    }
    return INITIAL_DMS;
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
      if (raw) return JSON.parse(raw).theme || 'onyx';
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
  const [showOwnerPanel, setShowOwnerPanel] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const [firebaseUid, setFirebaseUid] = useState<string | null>(null);
  const [firebaseEmail, setFirebaseEmail] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [pendingGoogleUser, setPendingGoogleUser] = useState<{
    uid: string;
    email: string | null;
    displayName: string;
    photoURL?: string | null;
  } | null>(null);
  const [joinedServerIds, setJoinedServerIds] = useState<string[]>([]);
  const [claimedQuestIds, setClaimedQuestIds] = useState<string[]>([]);
  const [discoverableServers, setDiscoverableServers] = useState<Server[]>([]);
  const hydratedUidRef = useRef<string | null>(null);

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

  useEffect(() => {
    try {
      localStorage.setItem(CLEAN_EMPTY_START_KEY, '1');
      localStorage.setItem(SHOP_OWNERSHIP_MIGRATION_KEY, '1');
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        setFirebaseUid(null);
        setFirebaseEmail(null);
        setPendingGoogleUser(null);
        hydratedUidRef.current = null;
        return;
      }

      setFirebaseUid(fbUser.uid);
      setFirebaseEmail(fbUser.email || null);
      setGoogleError(null);

      try {
        const bundle = await fetchUserAccountBundle(fbUser.uid);
        if (bundle) {
          const safeUser = sanitizeUserShopCosmetics(
            { ...INITIAL_USER, ...bundle.user, id: fbUser.uid },
            bundle.ownedBundleIds,
            INITIAL_SHOP_BUNDLES
          );
          hydratedUidRef.current = fbUser.uid;
          setPendingGoogleUser(null);
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
        } else {
          hydratedUidRef.current = null;
          setPendingGoogleUser({
            uid: fbUser.uid,
            email: fbUser.email,
            displayName: fbUser.displayName || 'Usuario',
            photoURL: fbUser.photoURL,
          });
          setActiveAccountId(null);
        }
      } catch (err) {
        console.error('Error hydrating Firebase user:', err);
        setGoogleError('No se pudo cargar tu perfil desde la nube. Inténtalo de nuevo.');
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!firebaseUid || hydratedUidRef.current !== firebaseUid || pendingGoogleUser) return;
    const timer = window.setTimeout(() => {
      void syncUserAccountToFirestore(firebaseUid, user, {
        ownedBundleIds,
        wishlistIds,
        claimedQuestIds,
        joinedServerIds,
        isOwnerAccount: isOwner,
      }).catch((err) => console.error('Sync profile error:', err));
    }, 450);
    return () => window.clearTimeout(timer);
  }, [
    firebaseUid,
    pendingGoogleUser,
    user,
    ownedBundleIds,
    wishlistIds,
    claimedQuestIds,
    joinedServerIds,
    isOwner,
  ]);

  useEffect(() => {
    if (!firebaseUid || pendingGoogleUser) return;
    const unsubDms = subscribeToDms(firebaseUid, (threads) => {
      setDms((prev) => {
        const msgMap = new Map(prev.map((d) => [d.id, d.messages]));
        const mergedRemote = threads.map((t) => ({
          ...t,
          messages: msgMap.get(t.id) || t.messages || [],
        }));
        const localGroups = prev.filter((d) => d.id.startsWith('dm-grp-'));
        return [...localGroups, ...mergedRemote];
      });
    });

    const unsubNotifs = subscribeToNotifications(firebaseUid, (items) => {
      setNotifications(items);
    });

    return () => {
      unsubDms();
      unsubNotifs();
    };
  }, [firebaseUid, pendingGoogleUser]);

  const activeDm = dms.find((d) => d.id === selectedDmId) || dms[0];
  const activeServer =
    activeContext.type === 'server'
      ? servers.find((s) => s.id === activeContext.serverId)
      : undefined;
  const activeChannelObj = activeServer?.channels.find((c) => c.id === selectedChannelId);

  const activeDmId = activeDm?.id;
  const activeDmIsReal = Boolean(
    firebaseUid &&
      !pendingGoogleUser &&
      activeContext.type === 'dm' &&
      activeDmId &&
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
    if (!firebaseUid || pendingGoogleUser) return;
    const ids = joinedServerIds.filter(Boolean);
    if (ids.length === 0) {
      setServers([]);
      return;
    }

    const unsubs = ids.map((srvId) =>
      subscribeToServerDetail(srvId, (srvData) => {
        if (!srvData) {
          setServers((prev) => prev.filter((s) => s.id !== srvId));
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
  }, [firebaseUid, pendingGoogleUser, joinedServerIdsKey]);

  const activeServerId = activeContext.type === 'server' ? activeContext.serverId : null;
  useEffect(() => {
    if (!firebaseUid || pendingGoogleUser || !activeServerId || !selectedChannelId) return;
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
  }, [firebaseUid, pendingGoogleUser, activeServerId, selectedChannelId]);

  useEffect(() => {
    if (activeContext.type !== 'server') return;
    const srv = servers.find((s) => s.id === activeContext.serverId);
    if (!srv || srv.channels.length === 0) return;
    const exists = selectedChannelId && srv.channels.some((c) => c.id === selectedChannelId);
    if (!exists) {
      const firstText =
        srv.channels.find((c) => !c.isPrivate && c.type !== 'voice') || srv.channels[0];
      if (firstText) setSelectedChannelId(firstText.id);
    }
  }, [activeContext, servers, selectedChannelId]);

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
    if (!voiceSession.active) return;
    const t = setInterval(() => {
      setVoiceSession((prev) => ({ ...prev, connectedSeconds: prev.connectedSeconds + 1 }));
    }, 1000);
    return () => clearInterval(t);
  }, [voiceSession.active]);

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

  const unreadTotal = useMemo(() => {
    const serverSum = servers.reduce((acc, s) => acc + (s.badgeCount || 0), 0);
    return serverSum + notifications.filter((n) => n.unread).length;
  }, [servers, notifications]);

  const unreadNotificationsCount = notifications.filter((n) => n.unread).length;
  const hasUnclaimedQuests = quests.some((q) => !q.claimed);

  const themeClass =
    theme === 'vice-city'
      ? 'theme-vice-city'
      : theme === 'dark'
      ? 'theme-dark'
      : theme === 'light'
      ? 'theme-light'
      : '';


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
          nitroTier: user.nitroTier,
          badgeIds: user.equippedBadgeIds,
          memberSince: user.memberSince,
          mutualServers: servers.map((s) => s.name),
        },
        roles,
      });
      return;
    }

    const baseProfile = resolvePublicUserProfile(userId, fallback);
    const matchingDm = dms.find(
      (d) =>
        d.id === userId ||
        d.otherUid === userId ||
        d.id === `dm-${userId}` ||
        d.id.replace(/^dm-/, '') === userId
    );
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
        ...giftedCosmetics,
        displayName: matchingMember?.displayName || baseProfile.displayName,
        username: matchingMember?.username || baseProfile.username,
        avatar: matchingMember?.avatar || baseProfile.avatar,
        customAvatarUrl: matchingMember?.customAvatarUrl || baseProfile.customAvatarUrl,
        decoration: matchingDm?.decoration || giftedCosmetics.decoration || baseProfile.decoration,
        nameplate: matchingDm?.nameplate || giftedCosmetics.nameplate || baseProfile.nameplate,
      },
      roles,
    });
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
    if (firebaseUid && !dmId.startsWith('dm-grp-')) {
      void markDmThreadRead(dmId, firebaseUid).catch(() => undefined);
    }
  };

  const handleSelectServer = (serverId: string) => {
    const srv = servers.find((s) => s.id === serverId);
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
      return `servers/${activeServer.id}/channels/${selectedChannelId}/messages`;
    }
    if (activeDm && !activeDm.id.startsWith('dm-grp-')) {
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

  const handleSendRichMessage = (payload: RichMessagePayload) => {
    const hasEveryone = Boolean(
      payload.mentionEveryone || /(^|\s)[@/]everyone(\s|$|[.,!?:;])/i.test(payload.content || '')
    );

    if (activeContext.type === 'server' && activeServer && selectedChannelId) {
      const targetServerId = activeServer.id;
      const targetChannelId = selectedChannelId;
      setTypingMap((prev) => ({ ...prev, [targetChannelId]: null }));

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
      return;
    }

    if (activeDm) {
      const targetId = activeDm.id;
      setTypingMap((prev) => ({ ...prev, [targetId]: null }));

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
          return { ...d, messages: nextMsgs, ...extra };
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
    if (activeContext.type === 'server' && !isAuthor && !canManageServer(activeServer, user.id)) {
      showToastMsg('Necesitas permiso de administrador para fijar mensajes ajenos');
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
    if (targetMsg && firebaseUid) {
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

      const collPath = getActiveMessagesCollectionPath();
      if (collPath) {
        void updateFirestoreMessage({
          collectionPath: collPath,
          messageId,
          patch: { reactions: nextReactions },
        }).catch(() => undefined);
      }
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

    if (activeContext.type === 'server' && activeServer && selectedChannelId) {
      setServers((prev) =>
        prev.map((s) =>
          s.id === activeServer.id
            ? {
                ...s,
                channels: s.channels.map((c) =>
                  c.id === selectedChannelId ? { ...c, messages: toggleInList(c.messages) } : c
                ),
              }
            : s
        )
      );
    } else if (activeDm) {
      setDms((prev) =>
        prev.map((d) => (d.id === activeDm.id ? { ...d, messages: toggleInList(d.messages) } : d))
      );
    }
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
    setClaimedQuestIds((prev) => (prev.includes(questId) ? prev : [...prev, questId]));
    setQuests((prev) => prev.map((item) => (item.id === questId ? { ...item, claimed: true } : item)));
    setUser((prev) => ({
      ...prev,
      orbs: prev.orbs + bonus,
      ...unlockBadgeHelper(prev, 'orbs'),
    }));
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
    if (!assertServerAdmin(serverId)) return;
    setServers((prev) => prev.map((s) => (s.id === serverId ? { ...s, ...patch } : s)));
    if (firebaseUid) {
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
    const srv = assertServerAdmin(serverId);
    if (!srv) return;
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
    setUser((prev) => ({
      ...prev,
      orbs: prev.orbs - bundle.priceOrbs,
      giftsSent: prev.giftsSent + 1,
      ...unlockBadgeHelper(prev, 'regalos'),
    }));
    showToastMsg(`¡Regalo enviado a ${recipientName}! Ya lo luce en su perfil`);
  };

  const handleLogStreamHour = () => {
    setUser((prev) => {
      const nextHours = prev.streamHours + 1;
      return {
        ...prev,
        streamHours: nextHours,
        ...(nextHours >= 1 ? unlockBadgeHelper(prev, 'transmision') : {}),
      };
    });
    showToastMsg('¡+1 hora transmitida! Progreso de Transmisión actualizado');
  };

  const handleLogGamePlayed = (gameName: string) => {
    setUser((prev) => {
      const nextGames = prev.gamesPlayedCount + 1;
      return {
        ...prev,
        gamesPlayedCount: nextGames,
        ...(nextGames >= 2 ? unlockBadgeHelper(prev, 'juegos') : {}),
      };
    });
    showToastMsg(`¡Partida registrada en ${gameName}!`);
  };

  const handleAdvanceAccountYear = () => {
    setUser((prev) => {
      const nextYears = prev.accountYears + 1;
      return {
        ...prev,
        accountYears: nextYears,
        ...(nextYears >= 1 ? unlockBadgeHelper(prev, 'antiguedad') : {}),
      };
    });
    showToastMsg('¡Aniversario de cuenta avanzado (+1 año)!');
  };

  const handleBuyBundle = (bundle: ShopBundle, useOrbs: boolean) => {
    if (ownedBundleIds.includes(bundle.id)) return;
    if (useOrbs) {
      if (user.orbs < bundle.priceOrbs) {
        showToastMsg('No tienes suficientes Orbs');
        return;
      }
      setUser((prev) => ({ ...prev, orbs: prev.orbs - bundle.priceOrbs }));
    }
    setOwnedBundleIds((prev) => [...prev, bundle.id]);
    const deco = bundle.items.find((i) => i.decorationId)?.decorationId;
    const plate = bundle.items.find((i) => i.nameplateId)?.nameplateId;
    const banner = bundle.items.find((i) => i.bannerUrl)?.bannerUrl;
    const effect = bundle.items.find((i) => i.profileEffectId)?.profileEffectId;
    const frame = bundle.items.find((i) => i.profileFrameId)?.profileFrameId;
    if (deco || plate || banner || effect || frame) {
      setUser((prev) => ({
        ...prev,
        ...(deco ? { decoration: deco } : {}),
        ...(plate ? { nameplate: plate } : {}),
        ...(banner ? { bannerImage: banner } : {}),
        ...(effect ? { profileEffect: effect } : {}),
        ...(frame ? { profileFrame: frame } : {}),
      }));
    }
    showToastMsg(`¡${bundle.title} adquirido y equipado!`);
  };

  const handleEquipBundle = (bundle: ShopBundle) => {
    if (!ownedBundleIds.includes(bundle.id)) {
      showToastMsg('Compra este lote en la Tienda para equiparlo en tu perfil');
      return;
    }
    const deco = bundle.items.find((i) => i.decorationId)?.decorationId;
    const plate = bundle.items.find((i) => i.nameplateId)?.nameplateId;
    const banner = bundle.items.find((i) => i.bannerUrl)?.bannerUrl;
    const effect = bundle.items.find((i) => i.profileEffectId)?.profileEffectId;
    const frame = bundle.items.find((i) => i.profileFrameId)?.profileFrameId;
    if (deco || plate || banner || effect || frame) {
      setUser((prev) => ({
        ...prev,
        ...(deco ? { decoration: deco } : {}),
        ...(plate ? { nameplate: plate } : {}),
        ...(banner ? { bannerImage: banner } : {}),
        ...(effect ? { profileEffect: effect } : {}),
        ...(frame ? { profileFrame: frame } : {}),
      }));
      showToastMsg(`Estilo, marco y efectos de ${bundle.title} aplicados en tu perfil`);
    }
  };

  const handleLoginAccount = (account: StoredAccount) => {
    const owned = account.ownedBundleIds || [];
    const safeUser = sanitizeUserShopCosmetics(
      {
        ...INITIAL_USER,
        ...account.user,
        orbs: normalizeOrbs(account.user.orbs),
      },
      owned,
      INITIAL_SHOP_BUNDLES
    );
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
    const newId = `acc-${Date.now()}`;
    const newUser: UserProfile = {
      id: `me-${Date.now()}`,
      displayName: payload.displayName,
      username: payload.username,
      ...(payload.contactType === 'email'
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
    const hasExistingOwner = accounts.some(
      (acc) =>
        acc.isOwnerAccount === true ||
        acc.user.username.trim().toLowerCase() === RESERVED_OWNER_USERNAME
    );
    const shouldPinOwner =
      !hasExistingOwner &&
      payload.username.trim().toLowerCase() === RESERVED_OWNER_USERNAME &&
      payload.displayName.trim().toLowerCase() === 'owen';

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
    setAccounts((prev) => normalizeSingleOwnerAccounts([...prev, newAccount]));
    setActiveAccountId(newId);
    setUser(newUser);
    setOwnedBundleIds([]);
    setWishlistIds([]);
    setScreen('inicio');
    setMobileChatOpen(false);
    setShowOwnerPanel(false);
    try {
      localStorage.setItem(SESSION_KEY, newId);
    } catch {
      /* ignore */
    }
    showToastMsg(`¡Bienvenido a Primordial, ${payload.displayName}! (+1.200 Orbs)`);
  };

  const handleResetAccountPassword = (accountId: string, newPassword: string) => {
    setAccounts((prev) =>
      prev.map((acc) => (acc.id === accountId ? { ...acc, password: newPassword } : acc))
    );
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
    setUser((prev) =>
      sanitizeUserShopCosmetics({ ...prev, ...patch }, nextOwned, INITIAL_SHOP_BUNDLES)
    );
  };

  const handleOwnerUnlockAllShopBundles = () => {
    if (!isOwner) return;
    const allIds = INITIAL_SHOP_BUNDLES.map((b) => b.id);
    setOwnedBundleIds(allIds);
    showToastMsg(`¡Todos los ${allIds.length} lotes de la Tienda desbloqueados!`);
  };

  const handleOwnerClearAllShopBundles = () => {
    if (!isOwner) return;
    setOwnedBundleIds([]);
    setUser((prev) => sanitizeUserShopCosmetics(prev, [], INITIAL_SHOP_BUNDLES));
    showToastMsg('Inventario de tienda vaciado');
  };

  const handleOwnerUnlockAllBadges = () => {
    if (!isOwner) return;
    const allBadgeIds = BADGE_DEFINITIONS.map((b) => b.id);
    setUser((prev) => ({
      ...prev,
      nitroTier: prev.nitroTier === 'none' ? 'nitro' : prev.nitroTier,
      unlockedBadgeIds: allBadgeIds,
      equippedBadgeIds: allBadgeIds,
      boostsGiven: Math.max(prev.boostsGiven || 0, 12),
      boostStreakMonths: Math.max(prev.boostStreakMonths || 0, 24),
      giftsSent: Math.max(prev.giftsSent || 0, 25),
      streamHours: Math.max(prev.streamHours || 0, 250),
      gamesPlayedCount: Math.max(prev.gamesPlayedCount || 0, 40),
      accountYears: Math.max(prev.accountYears || 0, 9),
    }));
    showToastMsg('¡Todas las insignias y logros desbloqueados al máximo!');
  };

  const handleOwnerUnlockAllEverything = () => {
    if (!isOwner) return;
    const allIds = INITIAL_SHOP_BUNDLES.map((b) => b.id);
    const allBadgeIds = BADGE_DEFINITIONS.map((b) => b.id);
    setOwnedBundleIds(allIds);
    setUser((prev) =>
      sanitizeUserShopCosmetics(
        {
          ...prev,
          orbs: 999_999_999_999_999,
          nitroTier: 'nitro',
          unlockedBadgeIds: allBadgeIds,
          equippedBadgeIds: allBadgeIds,
          boostsGiven: Math.max(prev.boostsGiven || 0, 12),
          boostStreakMonths: Math.max(prev.boostStreakMonths || 0, 24),
          giftsSent: Math.max(prev.giftsSent || 0, 25),
          streamHours: Math.max(prev.streamHours || 0, 250),
          gamesPlayedCount: Math.max(prev.gamesPlayedCount || 0, 40),
          accountYears: Math.max(prev.accountYears || 0, 9),
        },
        allIds,
        INITIAL_SHOP_BUNDLES
      )
    );
    showToastMsg('¡Todo desbloqueado al máximo para tu cuenta Owner!');
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setGoogleError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.includes('popup-closed-by-user')) {
        setGoogleError('No se pudo completar el inicio con Google. Inténtalo de nuevo.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleCompleteGoogleProfile = async (payload: {
    displayName: string;
    username: string;
    avatar: AvatarKey;
  }): Promise<string | null> => {
    if (!pendingGoogleUser) return 'No hay una sesión de Google pendiente.';
    const cleanHandle = normalizeUsernameHandle(payload.username);
    if (cleanHandle.length < 2) {
      return 'Tu @usuario debe tener al menos 2 caracteres válidos (letras, números, . _ -).';
    }
    try {
      const available = await isUsernameAvailable(cleanHandle);
      if (!available) {
        return `El @usuario "${cleanHandle}" ya está ocupado por otra persona.`;
      }
      const bundle = await claimProfileWithUsername({
        uid: pendingGoogleUser.uid,
        email: pendingGoogleUser.email,
        displayName: payload.displayName,
        username: cleanHandle,
        avatar: payload.avatar,
        customAvatarUrl: pendingGoogleUser.photoURL || undefined,
      });
      hydratedUidRef.current = bundle.user.id;
      setPendingGoogleUser(null);
      setUser(bundle.user);
      setOwnedBundleIds([]);
      setWishlistIds([]);
      setClaimedQuestIds([]);
      setQuests(INITIAL_QUESTS);
      setJoinedServerIds([]);
      setDms([]);
      setServers([]);
      setNotifications([]);
      setActiveAccountId(bundle.user.id);
      try {
        localStorage.setItem(SESSION_KEY, bundle.user.id);
      } catch {
        /* ignore */
      }
      showToastMsg(`¡Bienvenido a Primordial, @${bundle.user.username}!`);
      return null;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.toLowerCase().includes('already') || msg.toLowerCase().includes('permission')) {
        return `No se pudo reservar @${cleanHandle}. Es posible que ya esté en uso.`;
      }
      return 'Ocurrió un error creando tu cuenta. Inténtalo de nuevo.';
    }
  };

  const handleCancelGoogleProfile = async () => {
    setPendingGoogleUser(null);
    await signOut(auth).catch(() => undefined);
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignore */
    }
    hydratedUidRef.current = null;
    setPendingGoogleUser(null);
    setShowOwnerPanel(false);
    setActiveAccountId(null);
    setJoinedServerIds([]);
    setDms([]);
    setServers([]);
    setNotifications([]);
    setScreen('inicio');
    setMobileChatOpen(false);
    void signOut(auth).catch(() => undefined);
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
        .then((newServerId) => {
          setJoinedServerIds((prev) =>
            prev.includes(newServerId) ? prev : [...prev, newServerId]
          );
          setActiveContext({ type: 'server', serverId: newServerId });
          setSelectedChannelId(null);
          setScreen('inicio');
          setMobileChatOpen(false);
          showToastMsg(`Servidor "${config.name}" creado`);
        })
        .catch(() => {
          showToastMsg('No se pudo crear el servidor en la nube.');
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

  const handleJoinServerById = async (serverIdOrInvite: string): Promise<boolean> => {
    const cleanId = serverIdOrInvite
      .trim()
      .replace(/^https?:\/\/[^/]+\//i, '')
      .replace(/^primordial\.gg\//i, '');
    if (!cleanId) return false;
    if (!firebaseUid) {
      showToastMsg('Inicia sesión con Google para unirte a servidores reales');
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
      showToastMsg('¡Te has unido al servidor!');
      return true;
    } catch {
      return false;
    }
  };

  const handleSearchUsers = async (q: string): Promise<PublicUserProfile[]> => {
    if (!firebaseUid) return [];
    try {
      return await searchRealUsers(q, firebaseUid);
    } catch {
      return [];
    }
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
      showToastMsg('Inicia sesión con Google para chatear con cuentas reales');
      return;
    }
    try {
      const dmId = await getOrCreateDmThread(user, profile);
      handleSelectDm(dmId);
      showToastMsg(`Chat abierto con @${profile.username || profile.displayName}`);
    } catch {
      showToastMsg('No se pudo abrir el chat con este usuario');
    }
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

  const renderDesktopWorkspace = () => {
    if (screen === 'tu') {
      return (
        <ProfileView
          user={user}
          servers={servers}
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
          onUpdateUser={(patch) =>
            setUser((prev) =>
              sanitizeUserShopCosmetics({ ...prev, ...patch }, ownedBundleIds, INITIAL_SHOP_BUNDLES)
            )
          }
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
          onApplyViceCityTheme={() => {
            setTheme((t) => (t === 'vice-city' ? 'onyx' : 'vice-city'));
            showToastMsg(
              theme === 'vice-city' ? 'Tema Onyx restaurado' : 'Tema Vice City aplicado'
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
          dms={dms}
          wishlistIds={wishlistIds}
          ownedBundleIds={ownedBundleIds}
          selectedBundle={selectedShopBundle}
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
          onBack={() => setScreen('inicio')}
          onSubscribe={(tier, costOrbs) => {
            setUser((prev) => ({
              ...prev,
              orbs: prev.nitroTier === tier ? prev.orbs : Math.max(0, prev.orbs - costOrbs),
              nitroTier: tier,
              ...unlockBadgeHelper(prev, 'nitro'),
            }));
            showToastMsg(
              tier === 'nitro'
                ? '¡Discord Nitro activado! Ya puedes usar diseños de nombre con brillo y cosméticos Nitro.'
                : '¡Discord Nitro Basic activado! Ya puedes usar diseños de nombre con brillo y cosméticos Nitro.'
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
        />
      );
    }
    if (screen === 'mejoras') {
      return (
        <ServerBoostView
          servers={servers}
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
        />
      );
    }
    if (screen === 'amigos') {
      return (
        <FriendsView
          dms={dms}
          onBack={() => setScreen('inicio')}
          onOpenDm={handleSelectDm}
          onAddFriend={handleAddFriend}
          onSearchUsers={handleSearchUsers}
          onAddRealUser={handleAddRealUser}
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
      const srv = servers.find((s) => s.id === serverSettingsTarget.serverId) || servers[0];
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
        dms={dms}
        allServers={servers}
        typingLabel={activeTypingKey ? typingMap[activeTypingKey] || null : null}
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
        onStartCall={(video) =>
          setVoiceSession({
            active: true,
            callNonce: Date.now(),
            channelName:
              activeContext.type === 'server'
                ? activeChannelObj?.name || 'Canal de voz'
                : activeDm?.name || 'Llamada',
            contextName:
              activeContext.type === 'server' ? activeServer?.name || '' : 'Mensaje directo',
            muted: false,
            deafened: false,
            videoOn: video,
            screenSharing: false,
            connectedSeconds: 0,
            participants: activeDm
              ? [{ id: activeDm.otherUid || activeDm.id, name: activeDm.name, avatar: activeDm.avatar, speaking: false }]
              : [],
          })
        }
        onJoinInviteServer={(url) => {
          void handleJoinServerById(url);
        }}
        onOpenNitro={() => setScreen('nitro')}
        onOpenServerSettings={handleOpenServerSettings}
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
  ].includes(screen);

  if (!activeAccountId) {
    return (
      <AuthView
        accounts={accounts}
        onLoginAccount={handleLoginAccount}
        onRegisterAccount={handleRegisterAccount}
        onResetPassword={handleResetAccountPassword}
        onGoogleSignIn={handleGoogleSignIn}
        googleLoading={googleLoading}
        googleError={googleError}
        pendingGoogleUser={pendingGoogleUser}
        onCompleteGoogleProfile={handleCompleteGoogleProfile}
        onCancelGoogleProfile={handleCancelGoogleProfile}
      />
    );
  }

  return (
    <MotionConfig reducedMotion="user">
    <div
      className={`w-screen h-screen flex flex-col bg-[var(--dc-bg-rail)] text-[var(--dc-text-primary)] overflow-hidden ${themeClass}`}
    >
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[70] px-4 py-2 rounded-full bg-[#23a55a] text-white text-xs font-bold shadow-2xl pointer-events-none">
          {toast}
        </div>
      )}

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
            servers={servers}
            activeContext={activeContext}
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
                dms={dms}
                activities={INITIAL_ACTIVITIES}
                servers={servers}
                activeContext={activeContext}
                selectedDmId={selectedDmId}
                selectedChannelId={selectedChannelId}
                voiceSession={voiceSession}
                currentUser={user}
                typingDmIds={typingMap}
                onSelectDm={handleSelectDm}
                onSelectChannel={handleSelectChannel}
                onJoinVoice={(_srvId, _chId, chName, srvName) => {
                  setVoiceSession({
                    active: true,
                    callNonce: Date.now(),
                    channelName: chName,
                    contextName: srvName,
                    muted: false,
                    deafened: false,
                    videoOn: false,
                    screenSharing: false,
                    connectedSeconds: 0,
                    participants: [],
                  });
                }}
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
              onToggleMute={() => setVoiceSession((v) => ({ ...v, muted: !v.muted }))}
              onToggleDeafen={() => setVoiceSession((v) => ({ ...v, deafened: !v.deafened }))}
              onToggleVideo={() => setVoiceSession((v) => ({ ...v, videoOn: !v.videoOn }))}
              onToggleScreen={() => {
                if (!voiceSession.screenSharing) {
                  handleLogStreamHour();
                }
                setVoiceSession((v) => ({ ...v, screenSharing: !v.screenSharing }));
              }}
              onDisconnect={() => setVoiceSession((v) => ({ ...v, active: false }))}
            />

            {/* Mobile Bottom Primary Tabs — 3 Clean Centered Tabs */}
            <nav
              aria-label="Navegación principal móvil"
              className="md:hidden bg-[var(--dc-bg-rail)] border-t border-[var(--dc-border)] h-[60px] shrink-0 flex items-center justify-center px-3"
            >
              <div className="grid grid-cols-3 w-full max-w-md mx-auto h-full">
                <button
                  onClick={() => {
                    setScreen('inicio');
                    setMobileChatOpen(false);
                  }}
                  className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition-colors cursor-pointer ${
                    screen === 'inicio'
                      ? 'text-[var(--dc-text-primary)]'
                      : 'text-[var(--dc-text-muted)] hover:text-[var(--dc-text-secondary)]'
                  }`}
                >
                  <Home className={`w-5 h-5 ${screen === 'inicio' ? 'text-[#5865F2]' : ''}`} />
                  <span>Inicio</span>
                </button>

                <button
                  onClick={() => {
                    setScreen('notificaciones');
                    setMobileChatOpen(false);
                  }}
                  className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition-colors cursor-pointer relative ${
                    screen === 'notificaciones'
                      ? 'text-[var(--dc-text-primary)]'
                      : 'text-[var(--dc-text-muted)] hover:text-[var(--dc-text-secondary)]'
                  }`}
                >
                  <div className="relative">
                    <Bell className={`w-5 h-5 ${screen === 'notificaciones' ? 'text-[#5865F2]' : ''}`} />
                    {unreadNotificationsCount > 0 && (
                      <span className="absolute -top-1 -right-1.5 min-w-[16px] h-[16px] px-1 rounded-full bg-[#da373c] text-white text-[9.5px] font-bold tabular-nums flex items-center justify-center border-2 border-[var(--dc-bg-rail)] leading-none">
                        {unreadNotificationsCount}
                      </span>
                    )}
                  </div>
                  <span>Notificaciones</span>
                </button>

                <button
                  onClick={() => {
                    setProfileViewTrigger((k) => k + 1);
                    setScreen('tu');
                  }}
                  className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition-colors cursor-pointer ${
                    screen === 'tu'
                      ? 'text-[var(--dc-text-primary)]'
                      : 'text-[var(--dc-text-muted)] hover:text-[var(--dc-text-secondary)]'
                  }`}
                >
                  <div
                    className={`rounded-full p-[1.5px] transition-all ${
                      screen === 'tu' ? 'ring-2 ring-[#5865F2]' : ''
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
                  <span>Tú</span>
                </button>
              </div>
            </nav>
          </div>
        </div>

        {/* Right Desktop Workspace + Mobile Fullscreen Subviews */}
        <main
          className={`flex-1 flex flex-col min-w-0 min-h-0 ${
            isMobileOverlayScreen || mobileChatOpen ? 'flex' : 'hidden md:flex'
          }`}
        >
          {/* Desktop Top Quick Switcher Bar */}
          <div className="hidden md:flex h-11 px-4 bg-[var(--dc-bg-rail)] border-b border-[var(--dc-border)] items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {[
                { id: 'inicio' as const, label: 'Chat', icon: Home },
                { id: 'notificaciones' as const, label: 'Notificaciones', icon: Bell },
                { id: 'amigos' as const, label: 'Amigos', icon: UserPlus },
                { id: 'misiones' as const, label: 'Misiones', icon: LaurelQuestIcon },
                { id: 'tienda' as const, label: 'Tienda', icon: Store },
                { id: 'insignias' as const, label: 'Insignias', icon: Award },
                { id: 'mejoras' as const, label: 'Mejoras', icon: BoostGemIcon },
                { id: 'nitro' as const, label: 'Nitro', icon: NitroWheelIcon },
                { id: 'ajustes' as const, label: 'Ajustes', icon: Settings },
                { id: 'tu' as const, label: 'Mi Perfil (Tú)', icon: null },
              ].map((item) => {
                const Icon = item.icon;
                const active = screen === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.id === 'mejoras') setBoostTargetServerId(null);
                      if (item.id === 'tu') setProfileViewTrigger((k) => k + 1);
                      setScreen(item.id);
                    }}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer ${
                      active
                        ? 'dc-btn-primary'
                        : 'text-[var(--dc-text-secondary)] hover:bg-black/5 dark:hover:bg-white/10 hover:text-[var(--dc-text-primary)] transition-colors'
                    }`}
                  >
                    {Icon && <Icon className="w-3.5 h-3.5" />}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <PWAInstallButton variant="compact" />
              <button
                onClick={() => setTheme((t) => (t === 'light' ? 'onyx' : 'light'))}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full dc-btn-secondary text-xs font-semibold cursor-pointer"
              >
                {theme === 'light' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
                <span>{theme === 'light' ? 'Onyx' : 'Claro'}</span>
              </button>
              <button
                onClick={() => setScreen('misiones')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full dc-btn-secondary text-xs font-bold tabular-nums cursor-pointer"
              >
                <OrbsCrystalIcon className="w-3.5 h-3.5 text-indigo-400" />
                <span>{user.orbs.toLocaleString('es-ES')} Orbs</span>
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
        joinedServerIds={joinedServerIds}
        onLoadServers={async () => {
          if (!firebaseUid) return [];
          const list = await fetchDiscoverableServers();
          setDiscoverableServers(list);
          return list;
        }}
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
        isSelf={
          inspectedUser?.profile.id === 'me' ||
          inspectedUser?.profile.id === user.id
        }
        isFriend={
          inspectedUser
            ? dms.some(
                (d) =>
                  d.id === inspectedUser.profile.id ||
                  d.otherUid === inspectedUser.profile.id ||
                  d.id === `dm-${inspectedUser.profile.id}` ||
                  d.name.toLowerCase() === inspectedUser.profile.displayName.toLowerCase()
              )
            : false
        }
        serverRoles={inspectedUser?.roles || []}
        onClose={() => setInspectedUser(null)}
        onOpenSelfFullProfile={() => {
          setProfileViewTrigger((k) => k + 1);
          setScreen('tu');
        }}
        onSendMessage={(prof) => {
          void handleAddRealUser(prof);
        }}
        onStartCall={(prof, video) =>
          setVoiceSession({
            active: true,
            callNonce: Date.now(),
            channelName: prof.displayName,
            contextName: 'Mensaje directo',
            muted: false,
            deafened: false,
            videoOn: video,
            screenSharing: false,
            connectedSeconds: 0,
            participants: [
              { id: prof.id, name: prof.displayName, avatar: prof.avatar, speaking: true },
            ],
          })
        }
        onToggleFriend={(prof) => {
          const existing = dms.find(
            (d) =>
              d.id === prof.id ||
              d.otherUid === prof.id ||
              d.id === `dm-${prof.id}` ||
              d.name.toLowerCase() === prof.displayName.toLowerCase()
          );
          if (existing) {
            showToastMsg(`${prof.displayName} ya está en tu lista de chats/amigos`);
          } else {
            void handleAddRealUser(prof);
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
      <OfflineIndicator />
    </div>
    </MotionConfig>
  );
}
