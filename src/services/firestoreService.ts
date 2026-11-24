import {
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Unsubscribe,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  AvatarKey,
  BadgeId,
  Channel,
  ChatMessage,
  ChatPoll,
  ChatReaction,
  CreateServerPayload,
  DirectMessageThread,
  FriendRequestItem,
  NotificationItem,
  PresenceStatus,
  PublicUserProfile,
  Server,
  ServerMemberSummary,
  ServerRole,
  ThreadMessage,
  UserProfile,
} from '../types/discord';
import { DESIGNATED_OWNER_EMAIL } from '../utils/ownerAccess';
import { sanitizeMediaUrl } from '../utils/urlSafety';

function clampStr(val: string | undefined | null, maxLen: number): string {
  if (!val) return '';
  return val.trim().slice(0, maxLen);
}

function safeMedia200k(url: string | undefined | null): string | undefined {
  const safe = sanitizeMediaUrl(url);
  if (!safe || safe.length > 195000) return undefined;
  return safe;
}

function makeSafeId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${Date.now()}-${rand}`.replace(/[^a-zA-Z0-9_.-]/g, '').slice(0, 120);
}

export function normalizeUsernameHandle(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^@+/, '')
    .replace(/[^a-z0-9_.-]/g, '')
    .slice(0, 32);
}

function stripUndefined<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) {
      out[k] = v;
    }
  }
  return out as T;
}

function formatShortTime(): string {
  return new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

export interface UserAccountBundle {
  user: UserProfile;
  ownedBundleIds: string[];
  wishlistIds: string[];
  claimedQuestIds: string[];
  joinedServerIds: string[];
  isOwnerAccount: boolean;
}

export async function fetchUserAccountBundle(uid: string): Promise<UserAccountBundle | null> {
  const pubPath = `publicProfiles/${uid}`;
  const privPath = `users/${uid}/private/account`;
  try {
    const pubSnap = await getDoc(doc(db, 'publicProfiles', uid));
    if (!pubSnap.exists()) return null;
    const pub = pubSnap.data();

    let priv: Record<string, unknown> = {};
    try {
      const privSnap = await getDoc(doc(db, 'users', uid, 'private', 'account'));
      if (privSnap.exists()) {
        priv = privSnap.data();
      }
    } catch (privErr) {
      handleFirestoreError(privErr, OperationType.GET, privPath);
    }

    const user: UserProfile = {
      id: uid,
      displayName: String(pub.displayName || 'Usuario'),
      username: String(pub.username || uid.slice(0, 10)),
      displayNameStyle: pub.displayNameStyle || 'default',
      displayNameColorPreset: pub.displayNameColorPreset || 'none',
      displayNameCustomColors: Array.isArray(pub.displayNameCustomColors)
        ? (pub.displayNameCustomColors as [string, string])
        : undefined,
      displayNameGlow: Boolean(pub.displayNameGlow),
      status: (pub.status as PresenceStatus) || 'online',
      customStatus: String(pub.customStatus || ''),
      bio: String(pub.bio || ''),
      bannerColor: String(pub.bannerColor || '#5865F2'),
      bannerImage: sanitizeMediaUrl(pub.bannerImage as string | undefined),
      avatar: (pub.avatar as AvatarKey) || 'madara',
      customAvatarUrl: sanitizeMediaUrl(pub.customAvatarUrl as string | undefined),
      decoration: pub.decoration || 'none',
      profileEffect: pub.profileEffect || 'none',
      profileFrame: pub.profileFrame || 'none',
      nameplate: pub.nameplate || 'none',
      orbs: typeof priv.orbs === 'number' ? priv.orbs : 1200,
      memberSince: String(pub.memberSince || 'Noviembre 2026'),
      note: '',
      nitroTier: (priv.nitroTier as UserProfile['nitroTier']) || (pub.nitroTier as UserProfile['nitroTier']) || 'none',
      serverTag: pub.serverTag ? String(pub.serverTag) : '',
      unlockedBadgeIds: Array.isArray(priv.unlockedBadgeIds)
        ? (priv.unlockedBadgeIds as BadgeId[])
        : ['hypesquad'],
      equippedBadgeIds: Array.isArray(priv.equippedBadgeIds)
        ? (priv.equippedBadgeIds as BadgeId[])
        : Array.isArray(pub.badgeIds)
          ? (pub.badgeIds as BadgeId[])
          : ['hypesquad'],
      boostsGiven: typeof priv.boostsGiven === 'number' ? priv.boostsGiven : 0,
      boostStreakMonths: typeof priv.boostStreakMonths === 'number' ? priv.boostStreakMonths : 0,
      giftsSent: typeof priv.giftsSent === 'number' ? priv.giftsSent : 0,
      streamHours: typeof priv.streamHours === 'number' ? priv.streamHours : 0,
      gamesPlayedCount: typeof priv.gamesPlayedCount === 'number' ? priv.gamesPlayedCount : 0,
      accountYears: typeof priv.accountYears === 'number' ? priv.accountYears : 0,
      perServerProfiles: (priv.perServerProfiles as UserProfile['perServerProfiles']) || {},
    };

    return {
      user,
      ownedBundleIds: Array.isArray(priv.ownedBundleIds) ? (priv.ownedBundleIds as string[]) : [],
      wishlistIds: Array.isArray(priv.wishlistIds) ? (priv.wishlistIds as string[]) : [],
      claimedQuestIds: Array.isArray(priv.claimedQuestIds) ? (priv.claimedQuestIds as string[]) : [],
      joinedServerIds: Array.isArray(priv.joinedServerIds) ? (priv.joinedServerIds as string[]) : [],
      isOwnerAccount: Boolean(priv.isOwnerAccount),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, pubPath);
  }
}

export async function isUsernameAvailable(rawUsername: string): Promise<boolean> {
  const lower = normalizeUsernameHandle(rawUsername);
  if (lower.length < 2) return false;
  const path = `usernames/${lower}`;
  try {
    const snap = await getDoc(doc(db, 'usernames', lower));
    return !snap.exists();
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function claimProfileWithUsername(params: {
  uid: string;
  email: string | null | undefined;
  displayName: string;
  username: string;
  avatar: AvatarKey;
  customAvatarUrl?: string;
}): Promise<UserAccountBundle> {
  const { uid, email, displayName, username, avatar, customAvatarUrl } = params;
  const cleanHandle = normalizeUsernameHandle(username);
  if (cleanHandle.length < 2) {
    throw new Error('El nombre de usuario debe tener al menos 2 caracteres válidos (letras, números, . _ -).');
  }

  const isOwner = Boolean(email && email.trim().toLowerCase() === DESIGNATED_OWNER_EMAIL);
  const safeDisplayName = clampStr(displayName, 40) || cleanHandle;
  const safeCustomAvatar = sanitizeMediaUrl(customAvatarUrl);
  const memberSince = new Date().toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const batch = writeBatch(db);
  const usernameRef = doc(db, 'usernames', cleanHandle);
  const pubRef = doc(db, 'publicProfiles', uid);
  const privRef = doc(db, 'users', uid, 'private', 'account');

  batch.set(usernameRef, {
    uid,
    username: cleanHandle,
    displayName: safeDisplayName,
    createdAt: serverTimestamp(),
  });

  const publicData = stripUndefined({
    uid,
    displayName: safeDisplayName,
    username: cleanHandle,
    usernameLower: cleanHandle,
    avatar: clampStr(avatar, 32) || 'madara',
    customAvatarUrl: safeCustomAvatar ? clampStr(safeCustomAvatar, 200000) : undefined,
    status: 'online',
    customStatus: '',
    bio: isOwner ? '¡Owner Primordial!' : 'Miembro de Primordial.',
    bannerColor: isOwner ? '#C41212' : '#5865F2',
    decoration: 'none',
    profileEffect: 'none',
    profileFrame: 'none',
    nameplate: 'none',
    serverTag: '',
    nitroTier: 'none',
    displayNameStyle: 'default',
    displayNameColorPreset: 'none',
    displayNameGlow: false,
    badgeIds: ['hypesquad'],
    memberSince,
    updatedAt: serverTimestamp(),
  });

  batch.set(pubRef, publicData);

  const startingOrbs = isOwner ? 1000000000 : 1200;
  batch.set(privRef, {
    uid,
    orbs: startingOrbs,
    nitroTier: 'none',
    ownedBundleIds: [],
    wishlistIds: [],
    unlockedBadgeIds: ['hypesquad'],
    equippedBadgeIds: ['hypesquad'],
    claimedQuestIds: [],
    boostsGiven: 0,
    boostStreakMonths: 0,
    giftsSent: 0,
    streamHours: 0,
    gamesPlayedCount: 0,
    accountYears: 0,
    perServerProfiles: {},
    joinedServerIds: [],
    isOwnerAccount: isOwner,
    updatedAt: serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `publicProfiles/${uid}`);
  }

  return {
    user: {
      id: uid,
      displayName: safeDisplayName,
      username: cleanHandle,
      displayNameStyle: 'default',
      displayNameColorPreset: 'none',
      displayNameGlow: false,
      status: 'online',
      customStatus: '',
      bio: isOwner ? '¡Owner Primordial!' : 'Miembro de Primordial.',
      bannerColor: isOwner ? '#C41212' : '#5865F2',
      avatar,
      customAvatarUrl: safeCustomAvatar,
      decoration: 'none',
      profileEffect: 'none',
      profileFrame: 'none',
      nameplate: 'none',
      orbs: startingOrbs,
      memberSince,
      note: '',
      nitroTier: 'none',
      serverTag: '',
      unlockedBadgeIds: ['hypesquad'],
      equippedBadgeIds: ['hypesquad'],
      boostsGiven: 0,
      boostStreakMonths: 0,
      giftsSent: 0,
      streamHours: 0,
      gamesPlayedCount: 0,
      accountYears: 0,
      perServerProfiles: {},
    },
    ownedBundleIds: [],
    wishlistIds: [],
    claimedQuestIds: [],
    joinedServerIds: [],
    isOwnerAccount: isOwner,
  };
}

const syncedUsernameHandles = new Set<string>();

function docToPublicProfile(id: string, d: Record<string, unknown>): PublicUserProfile {
  return {
    id,
    displayName: String(d.displayName || d.username || 'Usuario'),
    username: String(d.username || ''),
    displayNameStyle: d.displayNameStyle as PublicUserProfile['displayNameStyle'],
    displayNameColorPreset: d.displayNameColorPreset as PublicUserProfile['displayNameColorPreset'],
    displayNameCustomColors: Array.isArray(d.displayNameCustomColors)
      ? (d.displayNameCustomColors as [string, string])
      : undefined,
    displayNameGlow: Boolean(d.displayNameGlow),
    avatar: (d.avatar as AvatarKey) || 'madara',
    customAvatarUrl: sanitizeMediaUrl(d.customAvatarUrl as string | undefined),
    status: (d.status as PresenceStatus) || 'online',
    customStatus: d.customStatus ? String(d.customStatus) : undefined,
    bio: String(d.bio || 'Miembro real de Primordial.'),
    bannerColor: String(d.bannerColor || '#5865F2'),
    bannerImage: sanitizeMediaUrl(d.bannerImage as string | undefined),
    decoration: d.decoration as PublicUserProfile['decoration'],
    profileEffect: d.profileEffect as PublicUserProfile['profileEffect'],
    profileFrame: d.profileFrame as PublicUserProfile['profileFrame'],
    nameplate: d.nameplate as PublicUserProfile['nameplate'],
    serverTag: d.serverTag ? String(d.serverTag) : undefined,
    nitroTier: d.nitroTier as PublicUserProfile['nitroTier'],
    badgeIds: Array.isArray(d.badgeIds) ? (d.badgeIds as BadgeId[]) : [],
    memberSince: String(d.memberSince || 'Noviembre 2026'),
    isBot: false,
    mutualServers: [],
  };
}

export async function syncUserAccountToFirestore(
  uid: string,
  user: UserProfile,
  extras: {
    ownedBundleIds: string[];
    wishlistIds: string[];
    claimedQuestIds: string[];
    joinedServerIds: string[];
    isOwnerAccount: boolean;
  }
): Promise<void> {
  const cleanHandle = normalizeUsernameHandle(user.username) || uid.slice(0, 12).toLowerCase();
  const safeCustomAvatar = safeMedia200k(user.customAvatarUrl);
  const safeBanner = safeMedia200k(user.bannerImage);
  const safeDisplayName = clampStr(user.displayName, 40) || cleanHandle;

  const pubPayload = stripUndefined({
    uid,
    displayName: safeDisplayName,
    username: cleanHandle,
    usernameLower: cleanHandle,
    avatar: clampStr(user.avatar, 32) || 'madara',
    customAvatarUrl: safeCustomAvatar,
    status: user.status || 'online',
    customStatus: clampStr(user.customStatus, 120),
    bio: clampStr(user.bio, 400),
    bannerColor: clampStr(user.bannerColor, 24) || '#5865F2',
    bannerImage: safeBanner,
    decoration: user.decoration || 'none',
    profileEffect: user.profileEffect || 'none',
    profileFrame: user.profileFrame || 'none',
    nameplate: user.nameplate || 'none',
    serverTag: clampStr(user.serverTag, 12),
    nitroTier: user.nitroTier || 'none',
    displayNameStyle: user.displayNameStyle || 'default',
    displayNameColorPreset: user.displayNameColorPreset || 'none',
    displayNameCustomColors: user.displayNameCustomColors,
    displayNameGlow: Boolean(user.displayNameGlow),
    badgeIds: (user.equippedBadgeIds || []).slice(0, 16),
    memberSince: clampStr(user.memberSince, 32) || 'Noviembre 2026',
    updatedAt: serverTimestamp(),
  });

  const verifiedCloudOwner = Boolean(
    extras.isOwnerAccount &&
      auth.currentUser?.emailVerified &&
      auth.currentUser?.email?.toLowerCase() === DESIGNATED_OWNER_EMAIL
  );

  const privPayload = stripUndefined({
    uid,
    orbs: Math.max(0, Math.min(999999999999999, Math.floor(user.orbs || 0))),
    nitroTier: user.nitroTier || 'none',
    ownedBundleIds: extras.ownedBundleIds.slice(0, 500),
    wishlistIds: extras.wishlistIds.slice(0, 500),
    unlockedBadgeIds: (user.unlockedBadgeIds || []).slice(0, 20),
    equippedBadgeIds: (user.equippedBadgeIds || []).slice(0, 20),
    claimedQuestIds: extras.claimedQuestIds.slice(0, 100),
    boostsGiven: user.boostsGiven || 0,
    boostStreakMonths: user.boostStreakMonths || 0,
    giftsSent: user.giftsSent || 0,
    streamHours: user.streamHours || 0,
    gamesPlayedCount: user.gamesPlayedCount || 0,
    accountYears: user.accountYears || 0,
    perServerProfiles: user.perServerProfiles || {},
    joinedServerIds: extras.joinedServerIds.slice(0, 100),
    isOwnerAccount: verifiedCloudOwner,
    updatedAt: serverTimestamp(),
  });

  const batch = writeBatch(db);
  batch.set(doc(db, 'publicProfiles', uid), pubPayload);
  batch.set(doc(db, 'users', uid, 'private', 'account'), privPayload);
  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${uid}/private/account`);
  }

  // Ensure /usernames/{cleanHandle} index exists so exact handle lookups always find this user
  if (cleanHandle.length >= 2 && !syncedUsernameHandles.has(cleanHandle)) {
    try {
      const unameRef = doc(db, 'usernames', cleanHandle);
      const unameSnap = await getDoc(unameRef);
      if (!unameSnap.exists()) {
        await setDoc(unameRef, {
          uid,
          username: cleanHandle,
          displayName: safeDisplayName,
          createdAt: serverTimestamp(),
        });
      }
      syncedUsernameHandles.add(cleanHandle);
    } catch {
      /* ignore handle backfill conflicts */
    }
  }
}

export async function searchRealUsers(
  rawQuery: string,
  excludeUid?: string
): Promise<PublicUserProfile[]> {
  const path = 'publicProfiles';
  const rawTrimmed = rawQuery.trim().replace(/^@+/, '');
  const rawLower = rawTrimmed.toLowerCase();
  const normalizedHandle = normalizeUsernameHandle(rawQuery);
  const byId = new Map<string, PublicUserProfile>();
  const errors: unknown[] = [];

  const tasks: Promise<void>[] = [];

  // 1. Direct exact handle lookup via /usernames/{handle} -> /publicProfiles/{uid}
  const exactHandleCandidates = Array.from(
    new Set(
      [normalizedHandle, rawLower].filter(
        (h) => h.length >= 2 && h.length <= 32 && /^[a-z0-9_.-]+$/.test(h)
      )
    )
  );
  for (const handle of exactHandleCandidates) {
    tasks.push(
      (async () => {
        const unameSnap = await getDoc(doc(db, 'usernames', handle));
        if (!unameSnap.exists()) return;
        const unameData = unameSnap.data();
        const targetUid = String(unameData.uid || '').trim();
        if (!targetUid || (excludeUid && targetUid === excludeUid)) return;
        if (/^[a-zA-Z0-9_.-]{1,128}$/.test(targetUid)) {
          const profSnap = await getDoc(doc(db, path, targetUid));
          if (profSnap.exists()) {
            byId.set(profSnap.id, docToPublicProfile(profSnap.id, profSnap.data()));
            return;
          }
        }
        byId.set(targetUid, {
          id: targetUid,
          displayName: String(unameData.displayName || unameData.username || handle),
          username: String(unameData.username || handle),
          avatar: 'madara',
          status: 'online',
          bio: 'Miembro real de Primordial.',
          bannerColor: '#5865F2',
          memberSince: 'Noviembre 2026',
          isBot: false,
          mutualServers: [],
        });
      })()
    );
  }

  // 2. Direct UID lookup when user pastes a full user ID
  if (/^[a-zA-Z0-9_.-]{16,128}$/.test(rawTrimmed) && rawTrimmed !== excludeUid) {
    tasks.push(
      (async () => {
        const profSnap = await getDoc(doc(db, path, rawTrimmed));
        if (profSnap.exists()) {
          byId.set(profSnap.id, docToPublicProfile(profSnap.id, profSnap.data()));
        }
      })()
    );
  }

  // 3. Indexed usernameLower prefix range query (bypasses global alphabetical 50-doc cutoff)
  if (normalizedHandle.length >= 1) {
    tasks.push(
      (async () => {
        const prefixQ = query(
          collection(db, path),
          where('usernameLower', '>=', normalizedHandle),
          where('usernameLower', '<=', `${normalizedHandle}\uf8ff`),
          limit(50)
        );
        const snap = await getDocs(prefixQ);
        snap.forEach((docSnap) => {
          if (excludeUid && docSnap.id === excludeUid) return;
          byId.set(docSnap.id, docToPublicProfile(docSnap.id, docSnap.data()));
        });
      })()
    );
  }

  // 4. Expanded directory scan to support displayName & substring searches
  const rawTokens = rawLower.split(/\s+/).filter(Boolean);
  const matchesQuery = (usernameLower: string, displayLower: string) => {
    if (!rawLower) return true;
    if (
      usernameLower.includes(rawLower) ||
      (normalizedHandle && usernameLower.includes(normalizedHandle)) ||
      displayLower.includes(rawLower)
    ) {
      return true;
    }
    if (rawTokens.length > 1) {
      return rawTokens.every(
        (tok) => displayLower.includes(tok) || usernameLower.includes(tok)
      );
    }
    return false;
  };

  tasks.push(
    (async () => {
      const scanQ = query(collection(db, path), orderBy('usernameLower'), limit(300));
      const snap = await getDocs(scanQ);
      snap.forEach((docSnap) => {
        if (excludeUid && docSnap.id === excludeUid) return;
        if (byId.has(docSnap.id)) return;
        const d = docSnap.data();
        const usernameLower = String(d.usernameLower || d.username || '').toLowerCase();
        const displayLower = String(d.displayName || '').toLowerCase();
        if (matchesQuery(usernameLower, displayLower)) {
          byId.set(docSnap.id, docToPublicProfile(docSnap.id, d));
        }
      });
    })()
  );

  // 5. Fallback scan without orderBy so older profiles lacking usernameLower remain discoverable
  tasks.push(
    (async () => {
      const fallbackQ = query(collection(db, path), limit(200));
      const snap = await getDocs(fallbackQ);
      snap.forEach((docSnap) => {
        if (excludeUid && docSnap.id === excludeUid) return;
        if (byId.has(docSnap.id)) return;
        const d = docSnap.data();
        const usernameLower = String(d.usernameLower || d.username || '').toLowerCase();
        const displayLower = String(d.displayName || '').toLowerCase();
        if (matchesQuery(usernameLower, displayLower)) {
          byId.set(docSnap.id, docToPublicProfile(docSnap.id, d));
        }
      });
    })()
  );

  const settled = await Promise.allSettled(tasks);
  let successCount = 0;
  for (const outcome of settled) {
    if (outcome.status === 'fulfilled') {
      successCount += 1;
    } else {
      errors.push(outcome.reason);
    }
  }

  if (successCount === 0 && errors.length > 0) {
    handleFirestoreError(errors[0], OperationType.LIST, path);
  }

  const results = Array.from(byId.values()).filter((p) => {
    if (!rawLower) return true;
    const u = p.username.toLowerCase();
    const dn = p.displayName.toLowerCase();
    return p.id === rawTrimmed || matchesQuery(u, dn);
  });

  if (rawLower) {
    const scoreProfile = (p: PublicUserProfile) => {
      const u = p.username.toLowerCase();
      const dn = p.displayName.toLowerCase();
      if (u === normalizedHandle || u === rawLower || p.id === rawTrimmed) return 4;
      if (dn === rawLower) return 3;
      if (u.startsWith(normalizedHandle || rawLower) || dn.startsWith(rawLower)) return 2;
      return 1;
    };
    results.sort((a, b) => scoreProfile(b) - scoreProfile(a));
  }

  return results;
}

export async function getOrCreateDmThread(
  currentUser: UserProfile,
  target: PublicUserProfile
): Promise<string> {
  const myUid = auth.currentUser?.uid || currentUser.id;
  const targetUid = (target.id || '').trim();
  if (!myUid || !targetUid || myUid === targetUid) {
    throw new Error('Usuario de destino inválido para abrir un chat directo.');
  }
  const participantIds = [myUid, targetUid].sort();
  const dmId = participantIds.join('__');
  const dmPath = `dms/${dmId}`;
  try {
    const dmRef = doc(db, 'dms', dmId);
    const existing = await getDoc(dmRef);
    const participantProfiles = {
      [myUid]: stripUndefined({
        displayName:
          clampStr(currentUser.displayName, 40) ||
          clampStr(currentUser.username, 40) ||
          'Usuario',
        username: clampStr(currentUser.username, 32) || myUid.slice(0, 12),
        avatar: clampStr(currentUser.avatar, 32) || 'madara',
        customAvatarUrl: safeMedia200k(currentUser.customAvatarUrl),
        status: currentUser.status || 'online',
        decoration: currentUser.decoration || 'none',
        nameplate: currentUser.nameplate || 'none',
        serverTag: clampStr(currentUser.serverTag, 12),
      }),
      [targetUid]: stripUndefined({
        displayName:
          clampStr(target.displayName, 40) ||
          clampStr(target.username, 40) ||
          'Usuario',
        username: clampStr(target.username, 32) || targetUid.slice(0, 12),
        avatar: clampStr(target.avatar, 32) || 'madara',
        customAvatarUrl: safeMedia200k(target.customAvatarUrl),
        status: target.status || 'online',
        decoration: target.decoration || 'none',
        nameplate: target.nameplate || 'none',
        serverTag: clampStr(target.serverTag, 12),
      }),
    };

    if (!existing.exists()) {
      await setDoc(dmRef, {
        id: dmId,
        participantIds,
        isGroup: false,
        participantProfiles,
        lastMessagePreview: 'Conversación iniciada · Di hola',
        lastTimestamp: formatShortTime(),
        lastSenderId: myUid,
        unreadBy: [],
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(dmRef, {
        participantProfiles,
        updatedAt: serverTimestamp(),
      }).catch(() => undefined);
    }
    return dmId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, dmPath);
  }
}

export function subscribeToDms(
  uid: string,
  onData: (threads: DirectMessageThread[]) => void
): Unsubscribe {
  const path = 'dms';
  const q = query(collection(db, path), where('participantIds', 'array-contains', uid));
  return onSnapshot(
    q,
    (snapshot) => {
      const next: DirectMessageThread[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        const participantIds: string[] = Array.isArray(d.participantIds) ? d.participantIds : [];
        const otherUid = participantIds.find((p) => p !== uid) || uid;
        const profiles = (d.participantProfiles || {}) as Record<
          string,
          {
            displayName?: string;
            username?: string;
            avatar?: AvatarKey;
            customAvatarUrl?: string;
            status?: PresenceStatus;
            decoration?: UserProfile['decoration'];
            nameplate?: UserProfile['nameplate'];
            serverTag?: string;
          }
        >;
        const otherProfile = profiles[otherUid] || {};
        const unreadBy: string[] = Array.isArray(d.unreadBy) ? d.unreadBy : [];
        const isUnread = unreadBy.includes(uid);

        next.push({
          id: docSnap.id,
          name: d.isGroup
            ? String(d.groupTitle || 'Grupo')
            : String(otherProfile.displayName || otherProfile.username || 'Usuario'),
          username: d.isGroup ? undefined : otherProfile.username,
          avatar: (otherProfile.avatar as AvatarKey) || 'madara',
          customAvatarUrl: d.isGroup
            ? undefined
            : sanitizeMediaUrl(otherProfile.customAvatarUrl),
          isGroup: Boolean(d.isGroup),
          isBot: false,
          status: (otherProfile.status as PresenceStatus) || 'online',
          lastMessagePreview: String(d.lastMessagePreview || ''),
          lastTimestamp: String(d.lastTimestamp || 'Ahora'),
          unread: isUnread,
          unreadCount: isUnread ? 1 : 0,
          decoration: otherProfile.decoration || 'none',
          nameplate: otherProfile.nameplate || 'none',
          serverTag: otherProfile.serverTag,
          groupEmoji: d.groupEmoji,
          groupColor: d.groupColor,
          participantIds,
          otherUid,
          messages: [],
        });
      });
      onData(next);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

function docToChatMessage(docId: string, d: Record<string, unknown>): ChatMessage {
  const createdAtObj = d.createdAt as { toMillis?: () => number } | undefined;
  const createdAtMs =
    typeof d.createdAtMs === 'number'
      ? d.createdAtMs
      : createdAtObj && typeof createdAtObj.toMillis === 'function'
        ? createdAtObj.toMillis()
        : undefined;
  return {
    id: docId,
    authorId: String(d.authorId || ''),
    authorName: String(d.authorName || 'Usuario'),
    authorAvatar: (d.authorAvatar as AvatarKey) || 'madara',
    authorIsBot: false,
    authorTag: d.authorTag ? String(d.authorTag) : undefined,
    timestamp: String(d.timestamp || 'Ahora'),
    createdAtMs,
    content: String(d.content || ''),
    edited: Boolean(d.edited),
    editedAt: d.editedAt ? String(d.editedAt) : undefined,
    pinned: Boolean(d.pinned),
    mentionEveryone: Boolean(d.mentionEveryone),
    threadCount: typeof d.threadCount === 'number' ? d.threadCount : 0,
    replyTo: d.replyTo as ChatMessage['replyTo'],
    forwardedFrom: d.forwardedFrom as ChatMessage['forwardedFrom'],
    imageUrl: sanitizeMediaUrl(d.imageUrl as string | undefined),
    sticker: d.sticker as ChatMessage['sticker'],
    audioNote: d.audioNote as ChatMessage['audioNote'],
    poll: d.poll as ChatMessage['poll'],
    reactions: Array.isArray(d.reactions) ? (d.reactions as ChatReaction[]) : [],
  };
}

export function subscribeToDmMessages(
  dmId: string,
  onData: (messages: ChatMessage[]) => void
): Unsubscribe {
  const path = `dms/${dmId}/messages`;
  const q = query(collection(db, 'dms', dmId, 'messages'), orderBy('createdAt', 'desc'), limit(150));
  return onSnapshot(
    q,
    (snapshot) => {
      const msgs: ChatMessage[] = [];
      snapshot.forEach((docSnap) => {
        msgs.push(docToChatMessage(docSnap.id, docSnap.data()));
      });
      msgs.reverse();
      msgs.sort((a, b) => (a.createdAtMs ?? 0) - (b.createdAtMs ?? 0));
      onData(msgs);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function markDmThreadRead(dmId: string, uid: string): Promise<void> {
  const path = `dms/${dmId}`;
  try {
    await updateDoc(doc(db, 'dms', dmId), {
      unreadBy: arrayRemove(uid),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function sendDmMessage(params: {
  dmId: string;
  currentUser: UserProfile;
  recipientUids: string[];
  content: string;
  replyTo?: ChatMessage['replyTo'];
  imageUrl?: string;
  sticker?: ChatMessage['sticker'];
  audioNote?: ChatMessage['audioNote'];
  poll?: ChatPoll;
}): Promise<void> {
  const { dmId, currentUser, recipientUids, content, replyTo, imageUrl, sticker, audioNote, poll } = params;
  const myUid = auth.currentUser?.uid || currentUser.id;
  const msgId = makeSafeId('msg');
  const nowLabel = formatShortTime();
  const safeImageUrl = safeMedia200k(imageUrl);
  const safeContent = clampStr(content, 2000);
  const preview = safeContent
    ? clampStr(safeContent, 160)
    : sticker
      ? `${sticker.emoji} ${sticker.name}`
      : safeImageUrl
        ? '📷 Imagen'
        : poll
          ? `📊 ${clampStr(poll.question, 100)}`
          : audioNote
            ? '🎤 Mensaje de voz'
            : 'Mensaje';

  const batch = writeBatch(db);
  const msgRef = doc(db, 'dms', dmId, 'messages', msgId);
  batch.set(
    msgRef,
    stripUndefined({
      id: msgId,
      authorId: myUid,
      authorName: clampStr(currentUser.displayName, 40) || clampStr(currentUser.username, 40) || 'Usuario',
      authorAvatar: clampStr(currentUser.avatar, 32) || 'madara',
      authorTag: currentUser.serverTag ? clampStr(currentUser.serverTag, 12) : undefined,
      content: safeContent,
      timestamp: nowLabel,
      createdAtMs: Date.now(),
      edited: false,
      pinned: false,
      mentionEveryone: false,
      threadCount: 0,
      replyTo,
      imageUrl: safeImageUrl,
      sticker,
      audioNote,
      poll,
      reactions: [],
      createdAt: serverTimestamp(),
    })
  );

  const others = recipientUids.filter((id) => id && id !== myUid);
  batch.update(doc(db, 'dms', dmId), {
    lastMessagePreview: preview,
    lastTimestamp: nowLabel,
    lastSenderId: myUid,
    unreadBy: others.slice(0, 10),
    updatedAt: serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `dms/${dmId}/messages/${msgId}`);
  }

  // Deliver notifications best-effort so notification edge cases never block DM delivery
  if (others.length > 0) {
    const notifBatch = writeBatch(db);
    for (const recipientUid of others.slice(0, 5)) {
      const notifId = makeSafeId('notif');
      notifBatch.set(doc(db, 'users', recipientUid, 'notifications', notifId), {
        id: notifId,
        recipientUid,
        senderUid: myUid,
        type: 'reply',
        title: clampStr(`Mensaje de ${currentUser.displayName || currentUser.username || 'Usuario'}`, 120),
        body: clampStr(preview, 500) || 'Te envió un mensaje directo',
        timestamp: 'Ahora',
        unread: true,
        avatar: clampStr(currentUser.avatar, 32) || 'madara',
        targetDmId: dmId,
        createdAt: serverTimestamp(),
      });
    }
    void notifBatch.commit().catch(() => undefined);
  }
}

export async function updateFirestoreMessage(params: {
  collectionPath: string;
  messageId: string;
  patch: Partial<{
    content: string;
    edited: boolean;
    editedAt: string;
    pinned: boolean;
    reactions: ChatReaction[];
    poll: ChatPoll;
    threadCount: number;
  }>;
}): Promise<void> {
  const { collectionPath, messageId, patch } = params;
  const fullPath = `${collectionPath}/${messageId}`;
  try {
    const cleanPatch = stripUndefined({
      ...patch,
      content: patch.content !== undefined ? clampStr(patch.content, 2000) : undefined,
    });
    await updateDoc(doc(db, collectionPath, messageId), cleanPatch);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, fullPath);
  }
}

export async function deleteFirestoreMessage(collectionPath: string, messageId: string): Promise<void> {
  const fullPath = `${collectionPath}/${messageId}`;
  try {
    await deleteDoc(doc(db, collectionPath, messageId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, fullPath);
  }
}

export function subscribeToMessageThreads(
  parentMessagePath: string,
  onData: (replies: ThreadMessage[]) => void
): Unsubscribe {
  const path = `${parentMessagePath}/threads`;
  const q = query(collection(db, path), orderBy('createdAt', 'asc'), limit(120));
  return onSnapshot(
    q,
    (snapshot) => {
      const replies: ThreadMessage[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        const createdAtObj = d.createdAt as { toMillis?: () => number } | undefined;
        replies.push({
          id: docSnap.id,
          authorId: String(d.authorId || ''),
          authorName: String(d.authorName || 'Usuario'),
          authorAvatar: (d.authorAvatar as AvatarKey) || 'madara',
          authorTag: d.authorTag ? String(d.authorTag) : undefined,
          timestamp: String(d.timestamp || 'Ahora'),
          createdAtMs:
            typeof d.createdAtMs === 'number'
              ? d.createdAtMs
              : createdAtObj && typeof createdAtObj.toMillis === 'function'
                ? createdAtObj.toMillis()
                : undefined,
          content: String(d.content || ''),
        });
      });
      onData(replies);
    },
    (error) => {
      console.warn(`Unable to subscribe to threads ${path}:`, error?.message || error);
    }
  );
}

export async function sendThreadReply(params: {
  parentMessagePath: string;
  currentUser: UserProfile;
  content: string;
  nextThreadCount: number;
}): Promise<void> {
  const { parentMessagePath, currentUser, content, nextThreadCount } = params;
  const replyId = makeSafeId('thr');
  const safeContent = clampStr(content, 2000);
  if (!safeContent) return;
  const path = `${parentMessagePath}/threads/${replyId}`;

  const batch = writeBatch(db);
  batch.set(
    doc(db, parentMessagePath, 'threads', replyId),
    stripUndefined({
      id: replyId,
      authorId: currentUser.id,
      authorName: clampStr(currentUser.displayName, 40) || currentUser.username,
      authorAvatar: clampStr(currentUser.avatar, 32) || 'madara',
      authorTag: currentUser.serverTag ? clampStr(currentUser.serverTag, 12) : undefined,
      content: safeContent,
      timestamp: formatShortTime(),
      createdAtMs: Date.now(),
      createdAt: serverTimestamp(),
    })
  );
  batch.update(doc(db, parentMessagePath), {
    threadCount: Math.max(1, Math.min(10000, Math.floor(nextThreadCount))),
  });

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// ============================================================================
// Servers, Members, Channels, Roles & /everyone Notifications
// ============================================================================

export async function createFirestoreServer(params: {
  uid: string;
  currentUser: UserProfile;
  payload: CreateServerPayload;
}): Promise<Server> {
  const { uid, currentUser, payload } = params;
  const serverId = makeSafeId('srv');
  const cleanName = clampStr(payload.name, 80) || 'Nuevo Servidor';
  const rawLetters = cleanName
    .split(/\s+/)
    .map((w) => w.replace(/[^a-zA-Z0-9]/g, '')[0] || '')
    .join('')
    .slice(0, 4)
    .toUpperCase();
  const shortCode = clampStr(rawLetters || cleanName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2).toUpperCase() || 'SR', 6) || 'SR';

  const roles: ServerRole[] = payload.includeStarterRoles
    ? payload.starterRoles && payload.starterRoles.length > 0
      ? payload.starterRoles
      : [
          {
            id: 'role-owner',
            name: '👑 Owner',
            color: '#f59e0b',
            hoist: true,
            permissions: ['Administrador', 'Gestionar canales', 'Gestionar mensajes', 'Expulsar miembros'],
          },
          {
            id: 'role-everyone',
            name: '@everyone',
            color: '#b5bac1',
            hoist: false,
            permissions: ['Enviar mensajes', 'Leer historial', 'Conectar a voz'],
          },
        ]
    : [
        {
          id: 'role-admin',
          name: 'Administrador',
          color: '#e11d48',
          hoist: true,
          permissions: ['Administrador', 'Gestionar canales', 'Gestionar mensajes'],
        },
      ];

  const ownerRoleId =
    roles.find((r) => r.permissions.includes('Administrador'))?.id || roles[0]?.id || 'role-owner';

  const safeIcon = safeMedia200k(payload.customIconUrl);
  const safeCustomAvatar = safeMedia200k(currentUser.customAvatarUrl);
  const safeMemberUsername =
    clampStr(currentUser.username, 32) || clampStr(currentUser.displayName, 32) || uid.slice(0, 12);
  const safeMemberDisplayName = clampStr(currentUser.displayName, 40) || safeMemberUsername;
  const safeMemberAvatar = clampStr(currentUser.avatar, 32) || 'madara';
  const accentColor = clampStr(payload.accentColor, 24) || '#5865F2';
  const categoriesOrder = payload.includeVoiceChannels
    ? ['Canales de texto', 'Canales de voz']
    : ['Canales de texto'];
  const description = `Servidor creado por ${safeMemberDisplayName}.`;

  const privRef = doc(db, 'users', uid, 'private', 'account');
  let privExists = true;
  try {
    const privSnap = await getDoc(privRef);
    privExists = privSnap.exists();
  } catch {
    privExists = true;
  }

  const batch = writeBatch(db);

  batch.set(
    doc(db, 'servers', serverId),
    stripUndefined({
      id: serverId,
      name: cleanName,
      shortCode,
      ownerId: uid,
      adminIds: [uid],
      iconStyle: 'custom',
      accentColor,
      bannerColor: accentColor,
      customIconUrl: safeIcon,
      customEmoji: !safeIcon && payload.customEmoji ? clampStr(payload.customEmoji, 12) : undefined,
      description,
      memberCount: 1,
      onlineCount: 1,
      boostLevel: 0,
      boostCount: 0,
      unlockedPerkIds: [],
      categoriesOrder,
      roles,
      customEmojis: [],
      stickers: [],
      chatTheme: payload.chatTheme || 'onyx',
      chatMessageStyle: payload.chatMessageStyle || 'classic',
      showAllChannels: true,
      communityEnabled: payload.audience === 'community',
      isDiscoverable: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  );

  batch.set(
    doc(db, 'servers', serverId, 'members', uid),
    stripUndefined({
      uid,
      displayName: safeMemberDisplayName,
      username: safeMemberUsername,
      avatar: safeMemberAvatar,
      customAvatarUrl: safeCustomAvatar,
      status: currentUser.status || 'online',
      roleIds: [ownerRoleId],
      isAdmin: true,
      joinedAt: serverTimestamp(),
    })
  );

  const chGeneral = makeSafeId('ch');
  const chAnuncios = makeSafeId('ch');
  const createdChannels: Channel[] = [
    {
      id: chGeneral,
      name: 'general',
      type: 'text',
      category: 'Canales de texto',
      isPrivate: false,
      topic: `Chat principal de ${cleanName}`,
      messages: [],
    },
    {
      id: chAnuncios,
      name: 'anuncios',
      type: 'announcement',
      category: 'Canales de texto',
      isPrivate: false,
      topic: 'Avisos oficiales y menciones @everyone',
      messages: [],
    },
  ];

  batch.set(doc(db, 'servers', serverId, 'channels', chGeneral), {
    id: chGeneral,
    name: 'general',
    type: 'text',
    category: 'Canales de texto',
    isPrivate: false,
    topic: clampStr(`Chat principal de ${cleanName}`, 200),
    position: 0,
    createdAt: serverTimestamp(),
  });
  batch.set(doc(db, 'servers', serverId, 'channels', chAnuncios), {
    id: chAnuncios,
    name: 'anuncios',
    type: 'announcement',
    category: 'Canales de texto',
    isPrivate: false,
    topic: 'Avisos oficiales y menciones @everyone',
    position: 1,
    createdAt: serverTimestamp(),
  });

  if (payload.includeVoiceChannels) {
    const chVoice = makeSafeId('ch');
    batch.set(doc(db, 'servers', serverId, 'channels', chVoice), {
      id: chVoice,
      name: 'Sala General',
      type: 'voice',
      category: 'Canales de voz',
      isPrivate: false,
      topic: 'Canal de voz',
      position: 2,
      createdAt: serverTimestamp(),
    });
    createdChannels.push({
      id: chVoice,
      name: 'Sala General',
      type: 'voice',
      category: 'Canales de voz',
      isPrivate: false,
      topic: 'Canal de voz',
      voiceParticipants: [],
      messages: [],
    });
  }

  if (privExists) {
    batch.update(privRef, {
      joinedServerIds: arrayUnion(serverId),
      updatedAt: serverTimestamp(),
    });
  } else {
    batch.set(privRef, {
      uid,
      orbs: Math.max(0, Math.floor(currentUser.orbs || 1200)),
      nitroTier: currentUser.nitroTier || 'none',
      ownedBundleIds: [],
      wishlistIds: [],
      unlockedBadgeIds: currentUser.unlockedBadgeIds || ['hypesquad'],
      equippedBadgeIds: currentUser.equippedBadgeIds || ['hypesquad'],
      claimedQuestIds: [],
      boostsGiven: currentUser.boostsGiven || 0,
      boostStreakMonths: currentUser.boostStreakMonths || 0,
      giftsSent: currentUser.giftsSent || 0,
      streamHours: currentUser.streamHours || 0,
      gamesPlayedCount: currentUser.gamesPlayedCount || 0,
      accountYears: currentUser.accountYears || 0,
      perServerProfiles: currentUser.perServerProfiles || {},
      joinedServerIds: [serverId],
      isOwnerAccount: false,
      updatedAt: serverTimestamp(),
    });
  }

  try {
    await batch.commit();
    return {
      id: serverId,
      name: cleanName,
      shortCode,
      ownerId: uid,
      adminIds: [uid],
      members: [
        {
          uid,
          displayName: safeMemberDisplayName,
          username: safeMemberUsername,
          avatar: safeMemberAvatar as AvatarKey,
          customAvatarUrl: safeCustomAvatar,
          status: currentUser.status || 'online',
          roleIds: [ownerRoleId],
          isAdmin: true,
        },
      ],
      isDiscoverable: true,
      iconStyle: 'custom',
      accentColor,
      bannerColor: accentColor,
      customIconUrl: safeIcon,
      customEmoji: !safeIcon && payload.customEmoji ? clampStr(payload.customEmoji, 12) : undefined,
      description,
      memberCount: 1,
      onlineCount: 1,
      boostLevel: 0,
      boostCount: 0,
      unlockedPerkIds: [],
      categoriesOrder,
      roles,
      memberRoleIds: { [uid]: [ownerRoleId] },
      customEmojis: [],
      stickers: [],
      chatTheme: payload.chatTheme || 'onyx',
      chatMessageStyle: payload.chatMessageStyle || 'classic',
      showAllChannels: true,
      communityEnabled: payload.audience === 'community',
      channels: createdChannels,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `servers/${serverId}`);
  }
}

export async function joinFirestoreServer(
  uid: string,
  currentUser: UserProfile,
  serverId: string
): Promise<boolean> {
  const cleanServerId = serverId.trim().replace(/^https?:\/\/[^/]+\//i, '').replace(/^primordial\.gg\//i, '');
  if (!cleanServerId) return false;
  const serverPath = `servers/${cleanServerId}`;
  try {
    const srvSnap = await getDoc(doc(db, 'servers', cleanServerId));
    if (!srvSnap.exists()) return false;
    const srvData = srvSnap.data();
    const isOwnerOrAdmin =
      srvData.ownerId === uid ||
      (Array.isArray(srvData.adminIds) && srvData.adminIds.includes(uid));

    const memberRef = doc(db, 'servers', cleanServerId, 'members', uid);
    const memberSnap = await getDoc(memberRef);
    const privRef = doc(db, 'users', uid, 'private', 'account');
    const privSnap = await getDoc(privRef);

    const safeUsername =
      clampStr(currentUser.username, 32) || clampStr(currentUser.displayName, 32) || uid.slice(0, 12);
    const safeDisplayName = clampStr(currentUser.displayName, 40) || safeUsername;

    const batch = writeBatch(db);
    if (!memberSnap.exists()) {
      batch.set(
        memberRef,
        stripUndefined({
          uid,
          displayName: safeDisplayName,
          username: safeUsername,
          avatar: clampStr(currentUser.avatar, 32) || 'madara',
          customAvatarUrl: safeMedia200k(currentUser.customAvatarUrl),
          status: currentUser.status || 'online',
          roleIds: [],
          isAdmin: isOwnerOrAdmin,
          joinedAt: serverTimestamp(),
        })
      );
    }

    if (privSnap.exists()) {
      batch.update(privRef, {
        joinedServerIds: arrayUnion(cleanServerId),
        updatedAt: serverTimestamp(),
      });
    } else {
      batch.set(privRef, {
        uid,
        orbs: Math.max(0, Math.floor(currentUser.orbs || 1200)),
        nitroTier: currentUser.nitroTier || 'none',
        ownedBundleIds: [],
        wishlistIds: [],
        unlockedBadgeIds: currentUser.unlockedBadgeIds || ['hypesquad'],
        equippedBadgeIds: currentUser.equippedBadgeIds || ['hypesquad'],
        claimedQuestIds: [],
        boostsGiven: currentUser.boostsGiven || 0,
        boostStreakMonths: currentUser.boostStreakMonths || 0,
        giftsSent: currentUser.giftsSent || 0,
        streamHours: currentUser.streamHours || 0,
        gamesPlayedCount: currentUser.gamesPlayedCount || 0,
        accountYears: currentUser.accountYears || 0,
        perServerProfiles: currentUser.perServerProfiles || {},
        joinedServerIds: [cleanServerId],
        isOwnerAccount: false,
        updatedAt: serverTimestamp(),
      });
    }

    await batch.commit();
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, serverPath);
  }
}

export async function leaveFirestoreServer(uid: string, serverId: string): Promise<void> {
  const path = `servers/${serverId}/members/${uid}`;
  try {
    const batch = writeBatch(db);
    batch.delete(doc(db, 'servers', serverId, 'members', uid));
    batch.update(doc(db, 'users', uid, 'private', 'account'), {
      joinedServerIds: arrayRemove(serverId),
      updatedAt: serverTimestamp(),
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function fetchDiscoverableServers(): Promise<Server[]> {
  const path = 'servers';
  try {
    const q = query(collection(db, 'servers'), where('isDiscoverable', '==', true), limit(40));
    const snap = await getDocs(q);
    const list: Server[] = [];
    snap.forEach((docSnap) => {
      const d = docSnap.data();
      list.push(docToServerShell(docSnap.id, d, [], []));
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

function docToServerShell(
  serverId: string,
  d: Record<string, unknown>,
  channels: Channel[],
  members: ServerMemberSummary[]
): Server {
  const memberRoleIds: Record<string, string[]> = {};
  for (const m of members) {
    memberRoleIds[m.uid] = m.roleIds;
  }
  const onlineCount = Math.max(
    1,
    members.filter((m) => m.status !== 'offline').length || Number(d.onlineCount || 1)
  );
  return {
    id: serverId,
    name: String(d.name || 'Servidor'),
    shortCode: String(d.shortCode || 'SR'),
    ownerId: d.ownerId ? String(d.ownerId) : undefined,
    adminIds: Array.isArray(d.adminIds) ? (d.adminIds as string[]) : [],
    members,
    isDiscoverable: Boolean(d.isDiscoverable),
    iconStyle: (d.iconStyle as Server['iconStyle']) || 'custom',
    accentColor: String(d.accentColor || '#5865F2'),
    bannerColor: String(d.bannerColor || '#5865F2'),
    bannerImage: sanitizeMediaUrl(d.bannerImage as string | undefined),
    customIconUrl: sanitizeMediaUrl(d.customIconUrl as string | undefined),
    customEmoji: d.customEmoji ? String(d.customEmoji) : undefined,
    description: d.description ? String(d.description) : undefined,
    memberCount: Math.max(1, members.length || Number(d.memberCount || 1)),
    onlineCount,
    boostLevel: Number(d.boostLevel || 0),
    boostCount: Number(d.boostCount || 0),
    unlockedPerkIds: Array.isArray(d.unlockedPerkIds) ? (d.unlockedPerkIds as string[]) : [],
    activeServerTag: d.activeServerTag ? String(d.activeServerTag) : undefined,
    categoriesOrder: Array.isArray(d.categoriesOrder) ? (d.categoriesOrder as string[]) : undefined,
    roles: Array.isArray(d.roles) ? (d.roles as ServerRole[]) : [],
    memberRoleIds,
    customEmojis: Array.isArray(d.customEmojis) ? d.customEmojis : [],
    stickers: Array.isArray(d.stickers) ? d.stickers : [],
    chatTheme: d.chatTheme as Server['chatTheme'],
    chatWallpaperUrl: sanitizeMediaUrl(d.chatWallpaperUrl as string | undefined),
    chatMessageStyle: d.chatMessageStyle as Server['chatMessageStyle'],
    chatAccentColor: d.chatAccentColor ? String(d.chatAccentColor) : undefined,
    showAllChannels: d.showAllChannels !== false,
    communityEnabled: Boolean(d.communityEnabled),
    channels,
  };
}

export function subscribeToServerDetail(
  serverId: string,
  onUpdate: (server: Server | null) => void
): Unsubscribe {
  let serverDocData: Record<string, unknown> | null = null;
  let channels: Channel[] = [];
  let members: ServerMemberSummary[] = [];
  let hasServerDoc = false;
  let unsubMembers: Unsubscribe | null = null;
  let unsubChannels: Unsubscribe | null = null;
  let disposed = false;

  const emit = () => {
    if (disposed) return;
    if (!hasServerDoc || !serverDocData) {
      onUpdate(null);
      return;
    }
    onUpdate(docToServerShell(serverId, serverDocData, channels, members));
  };

  const stopSubcollections = () => {
    if (unsubMembers) {
      unsubMembers();
      unsubMembers = null;
    }
    if (unsubChannels) {
      unsubChannels();
      unsubChannels = null;
    }
    members = [];
    channels = [];
  };

  const startSubcollections = () => {
    if (disposed || unsubMembers || unsubChannels) return;
    unsubMembers = onSnapshot(
      query(collection(db, 'servers', serverId, 'members'), limit(200)),
      (snap) => {
        const nextMembers: ServerMemberSummary[] = [];
        snap.forEach((docSnap) => {
          const d = docSnap.data();
          nextMembers.push({
            uid: String(d.uid || docSnap.id),
            displayName: String(d.displayName || 'Usuario'),
            username: String(d.username || ''),
            avatar: (d.avatar as AvatarKey) || 'madara',
            customAvatarUrl: sanitizeMediaUrl(d.customAvatarUrl as string | undefined),
            status: (d.status as PresenceStatus) || 'online',
            roleIds: Array.isArray(d.roleIds) ? (d.roleIds as string[]) : [],
            isAdmin: Boolean(d.isAdmin),
          });
        });
        members = nextMembers;
        emit();
      },
      (error) => {
        console.warn(`Unable to read members for server ${serverId}:`, error?.message || error);
      }
    );

    unsubChannels = onSnapshot(
      query(collection(db, 'servers', serverId, 'channels'), orderBy('position', 'asc')),
      (snap) => {
        const nextChannels: Channel[] = [];
        snap.forEach((docSnap) => {
          const d = docSnap.data();
          nextChannels.push({
            id: docSnap.id,
            name: String(d.name || 'general'),
            type: (d.type as Channel['type']) || 'text',
            category: String(d.category || 'Canales de texto'),
            isPrivate: Boolean(d.isPrivate),
            topic: d.topic ? String(d.topic) : undefined,
            messages: [],
          });
        });
        channels = nextChannels;
        emit();
      },
      (error) => {
        console.warn(`Unable to read channels for server ${serverId}:`, error?.message || error);
      }
    );
  };

  const unsubServer = onSnapshot(
    doc(db, 'servers', serverId),
    (snap) => {
      if (!snap.exists()) {
        hasServerDoc = false;
        serverDocData = null;
        stopSubcollections();
      } else {
        hasServerDoc = true;
        serverDocData = snap.data();
        startSubcollections();
      }
      emit();
    },
    (error) => {
      console.warn(`Unable to read server ${serverId}:`, error?.message || error);
      hasServerDoc = false;
      serverDocData = null;
      stopSubcollections();
      emit();
    }
  );

  return () => {
    disposed = true;
    unsubServer();
    stopSubcollections();
  };
}

export async function updateFirestoreServer(
  serverId: string,
  patch: Partial<Server>
): Promise<void> {
  const path = `servers/${serverId}`;
  try {
    const clean = stripUndefined({
      name: patch.name !== undefined ? clampStr(patch.name, 80) || undefined : undefined,
      shortCode: patch.shortCode !== undefined ? clampStr(patch.shortCode, 6) || undefined : undefined,
      iconStyle: patch.iconStyle,
      accentColor: patch.accentColor,
      bannerColor: patch.bannerColor,
      bannerImage: patch.bannerImage !== undefined ? safeMedia200k(patch.bannerImage) || '' : undefined,
      customIconUrl: patch.customIconUrl !== undefined ? safeMedia200k(patch.customIconUrl) || '' : undefined,
      customEmoji: patch.customEmoji,
      description: patch.description !== undefined ? clampStr(patch.description, 400) : undefined,
      boostLevel: patch.boostLevel,
      boostCount: patch.boostCount,
      unlockedPerkIds: patch.unlockedPerkIds,
      activeServerTag: patch.activeServerTag,
      categoriesOrder: patch.categoriesOrder,
      roles: patch.roles,
      customEmojis: patch.customEmojis,
      stickers: patch.stickers,
      chatTheme: patch.chatTheme,
      chatWallpaperUrl:
        patch.chatWallpaperUrl !== undefined ? safeMedia200k(patch.chatWallpaperUrl) || '' : undefined,
      chatMessageStyle: patch.chatMessageStyle,
      chatAccentColor: patch.chatAccentColor,
      showAllChannels: patch.showAllChannels,
      communityEnabled: patch.communityEnabled,
      isDiscoverable: patch.isDiscoverable,
      updatedAt: serverTimestamp(),
    });
    if (Object.keys(clean).length <= 1) return;
    await updateDoc(doc(db, 'servers', serverId), clean);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function toggleServerMemberAdmin(params: {
  serverId: string;
  targetUid: string;
  makeAdmin: boolean;
}): Promise<void> {
  const { serverId, targetUid, makeAdmin } = params;
  const path = `servers/${serverId}/members/${targetUid}`;
  try {
    const batch = writeBatch(db);
    batch.update(doc(db, 'servers', serverId), {
      adminIds: makeAdmin ? arrayUnion(targetUid) : arrayRemove(targetUid),
      updatedAt: serverTimestamp(),
    });
    batch.update(doc(db, 'servers', serverId, 'members', targetUid), {
      isAdmin: makeAdmin,
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateServerMemberRolesInFirestore(params: {
  serverId: string;
  targetUid: string;
  roleIds: string[];
  isAdmin: boolean;
}): Promise<void> {
  const { serverId, targetUid, roleIds, isAdmin } = params;
  const path = `servers/${serverId}/members/${targetUid}`;
  try {
    await updateDoc(doc(db, 'servers', serverId, 'members', targetUid), {
      roleIds: roleIds.slice(0, 20),
      isAdmin,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function kickFirestoreServerMember(serverId: string, targetUid: string): Promise<void> {
  const path = `servers/${serverId}/members/${targetUid}`;
  try {
    await deleteDoc(doc(db, 'servers', serverId, 'members', targetUid));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function createFirestoreChannel(params: {
  serverId: string;
  name: string;
  type: Channel['type'];
  category: string;
  isPrivate?: boolean;
  topic?: string;
  position: number;
}): Promise<string> {
  const { serverId, name, type, category, isPrivate, topic, position } = params;
  const channelId = makeSafeId('ch');
  const path = `servers/${serverId}/channels/${channelId}`;
  try {
    await setDoc(
      doc(db, 'servers', serverId, 'channels', channelId),
      stripUndefined({
        id: channelId,
        name: clampStr(name, 60) || 'nuevo-canal',
        type,
        category: clampStr(category, 60) || 'Canales de texto',
        isPrivate: Boolean(isPrivate),
        topic: topic ? clampStr(topic, 200) : undefined,
        position: Math.max(0, Math.min(500, Math.floor(position))),
        createdAt: serverTimestamp(),
      })
    );
    return channelId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateFirestoreChannel(params: {
  serverId: string;
  channelId: string;
  patch: Partial<{ name: string; category: string; isPrivate: boolean; topic: string; position: number }>;
}): Promise<void> {
  const { serverId, channelId, patch } = params;
  const path = `servers/${serverId}/channels/${channelId}`;
  try {
    await updateDoc(
      doc(db, 'servers', serverId, 'channels', channelId),
      stripUndefined({
        name: patch.name !== undefined ? clampStr(patch.name, 60) : undefined,
        category: patch.category !== undefined ? clampStr(patch.category, 60) : undefined,
        isPrivate: patch.isPrivate,
        topic: patch.topic !== undefined ? clampStr(patch.topic, 200) : undefined,
        position: patch.position,
      })
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteFirestoreChannel(serverId: string, channelId: string): Promise<void> {
  const path = `servers/${serverId}/channels/${channelId}`;
  try {
    await deleteDoc(doc(db, 'servers', serverId, 'channels', channelId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeToChannelMessages(
  serverId: string,
  channelId: string,
  onData: (messages: ChatMessage[]) => void
): Unsubscribe {
  const path = `servers/${serverId}/channels/${channelId}/messages`;
  const q = query(
    collection(db, 'servers', serverId, 'channels', channelId, 'messages'),
    orderBy('createdAt', 'desc'),
    limit(150)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const msgs: ChatMessage[] = [];
      snapshot.forEach((docSnap) => {
        msgs.push(docToChatMessage(docSnap.id, docSnap.data()));
      });
      msgs.reverse();
      msgs.sort((a, b) => (a.createdAtMs ?? 0) - (b.createdAtMs ?? 0));
      onData(msgs);
    },
    (error) => {
      console.warn(`Unable to subscribe to ${path}:`, error?.message || error);
    }
  );
}

export async function sendChannelMessage(params: {
  serverId: string;
  serverName: string;
  channelId: string;
  channelName: string;
  currentUser: UserProfile;
  memberUids: string[];
  content: string;
  mentionEveryone?: boolean;
  replyTo?: ChatMessage['replyTo'];
  imageUrl?: string;
  sticker?: ChatMessage['sticker'];
  audioNote?: ChatMessage['audioNote'];
  poll?: ChatPoll;
}): Promise<void> {
  const {
    serverId,
    serverName,
    channelId,
    channelName,
    currentUser,
    memberUids,
    content,
    mentionEveryone,
    replyTo,
    imageUrl,
    sticker,
    audioNote,
    poll,
  } = params;

  const msgId = makeSafeId('msg');
  const safeContent = clampStr(content, 2000);
  const safeImageUrl = safeMedia200k(imageUrl);
  const hasEveryone = Boolean(
    mentionEveryone || /(^|\s)[@/]everyone(\s|$|[.,!?:;])/i.test(safeContent)
  );

  let liveMemberIds = memberUids;
  if (hasEveryone) {
    try {
      const memSnap = await getDocs(query(collection(db, 'servers', serverId, 'members'), limit(200)));
      const fetchedIds: string[] = [];
      memSnap.forEach((d) => fetchedIds.push(d.id));
      if (fetchedIds.length > 0) {
        liveMemberIds = fetchedIds;
      }
    } catch {
      // Fallback to provided memberUids if list read fails
    }
  }

  const batch = writeBatch(db);
  batch.set(
    doc(db, 'servers', serverId, 'channels', channelId, 'messages', msgId),
    stripUndefined({
      id: msgId,
      authorId: currentUser.id,
      authorName: clampStr(currentUser.displayName, 40) || currentUser.username,
      authorAvatar: clampStr(currentUser.avatar, 32) || 'madara',
      authorTag: currentUser.serverTag ? clampStr(currentUser.serverTag, 12) : undefined,
      content: safeContent,
      timestamp: formatShortTime(),
      createdAtMs: Date.now(),
      edited: false,
      pinned: false,
      mentionEveryone: hasEveryone,
      threadCount: 0,
      replyTo,
      imageUrl: safeImageUrl,
      sticker,
      audioNote,
      poll,
      reactions: [],
      createdAt: serverTimestamp(),
    })
  );

  if (hasEveryone) {
    const uniqueRecipients = Array.from(new Set(liveMemberIds)).filter(
      (id) => id && id !== currentUser.id
    );
    const notifBody = safeContent
      ? clampStr(`${currentUser.displayName}: ${safeContent}`, 500)
      : `${currentUser.displayName} mencionó a @everyone en #${channelName}`;

    for (const recipientUid of uniqueRecipients.slice(0, 50)) {
      const notifId = makeSafeId('notif');
      batch.set(doc(db, 'users', recipientUid, 'notifications', notifId), {
        id: notifId,
        recipientUid,
        senderUid: currentUser.id,
        type: 'mention',
        title: clampStr(`@everyone en ${serverName} · #${channelName}`, 120),
        body: notifBody,
        timestamp: 'Ahora',
        unread: true,
        avatar: clampStr(currentUser.avatar, 32) || 'madara',
        serverName: clampStr(serverName, 80),
        targetServerId: serverId,
        targetChannelId: channelId,
        createdAt: serverTimestamp(),
      });
    }
  }

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(
      error,
      OperationType.WRITE,
      `servers/${serverId}/channels/${channelId}/messages/${msgId}`
    );
  }
}

export function subscribeToNotifications(
  uid: string,
  onData: (items: NotificationItem[]) => void
): Unsubscribe {
  const path = `users/${uid}/notifications`;
  const q = query(collection(db, 'users', uid, 'notifications'), orderBy('createdAt', 'desc'), limit(60));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: NotificationItem[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        items.push({
          id: docSnap.id,
          type: (d.type as NotificationItem['type']) || 'system',
          title: String(d.title || ''),
          body: String(d.body || ''),
          timestamp: String(d.timestamp || 'Ahora'),
          unread: Boolean(d.unread),
          avatar: (d.avatar as AvatarKey) || 'madara',
          senderUid: d.senderUid ? String(d.senderUid) : undefined,
          serverName: d.serverName ? String(d.serverName) : undefined,
          targetDmId: d.targetDmId ? String(d.targetDmId) : undefined,
          targetServerId: d.targetServerId ? String(d.targetServerId) : undefined,
          targetChannelId: d.targetChannelId ? String(d.targetChannelId) : undefined,
        });
      });
      onData(items);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, path)
  );
}

export async function markNotificationReadInFirestore(uid: string, notifId: string): Promise<void> {
  const path = `users/${uid}/notifications/${notifId}`;
  try {
    await updateDoc(doc(db, 'users', uid, 'notifications', notifId), { unread: false });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function markAllNotificationsReadInFirestore(
  uid: string,
  notifIds: string[]
): Promise<void> {
  if (notifIds.length === 0) return;
  const path = `users/${uid}/notifications`;
  try {
    const batch = writeBatch(db);
    for (const id of notifIds.slice(0, 50)) {
      batch.update(doc(db, 'users', uid, 'notifications', id), { unread: false });
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function clearNotificationsInFirestore(uid: string, notifIds: string[]): Promise<void> {
  if (notifIds.length === 0) return;
  const path = `users/${uid}/notifications`;
  try {
    const batch = writeBatch(db);
    for (const id of notifIds.slice(0, 50)) {
      batch.delete(doc(db, 'users', uid, 'notifications', id));
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeToFriendRequests(
  uid: string,
  onData: (requests: FriendRequestItem[]) => void
): Unsubscribe {
  const path = `users/${uid}/friendRequests`;
  const q = query(collection(db, path), orderBy('createdAt', 'desc'), limit(60));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: FriendRequestItem[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        if (d.status === 'pending') {
          list.push({
            fromUid: String(d.fromUid || docSnap.id),
            toUid: String(d.toUid || uid),
            fromDisplayName: String(d.fromDisplayName || 'Usuario'),
            fromUsername: String(d.fromUsername || ''),
            fromAvatar: (d.fromAvatar as AvatarKey) || 'madara',
            fromCustomAvatarUrl: sanitizeMediaUrl(d.fromCustomAvatarUrl as string | undefined),
            status: 'pending',
          });
        }
      });
      onData(list);
    },
    (error) => {
      console.warn(`Unable to subscribe to friendRequests ${path}:`, error?.message || error);
    }
  );
}

export function subscribeToSentFriendRequests(
  uid: string,
  onData: (sentUids: string[]) => void
): Unsubscribe {
  const path = `users/${uid}/sentFriendRequests`;
  return onSnapshot(
    collection(db, 'users', uid, 'sentFriendRequests'),
    (snapshot) => {
      const uids: string[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        if (d.status === 'pending') {
          uids.push(String(d.toUid || docSnap.id));
        }
      });
      onData(uids);
    },
    (error) => {
      console.warn(`Unable to subscribe to sentFriendRequests ${path}:`, error?.message || error);
    }
  );
}

export async function sendFriendRequest(params: {
  fromUser: UserProfile;
  toUid: string;
  targetProfile?: Partial<PublicUserProfile>;
}): Promise<'sent' | 'already-pending' | 'already-friends'> {
  const { fromUser, toUid, targetProfile } = params;
  const myUid = auth.currentUser?.uid || fromUser.id;
  if (!myUid || !toUid || toUid === myUid) return 'already-pending';
  const path = `users/${toUid}/friendRequests/${myUid}`;
  const reqRef = doc(db, 'users', toUid, 'friendRequests', myUid);
  const sentRef = doc(db, 'users', myUid, 'sentFriendRequests', toUid);
  try {
    const existing = await getDoc(reqRef);
    if (existing.exists()) {
      const currentStatus = String(existing.data()?.status || 'pending');
      if (currentStatus === 'pending') return 'already-pending';
      if (currentStatus === 'accepted') return 'already-friends';
      if (currentStatus === 'declined') {
        await deleteDoc(reqRef).catch(() => undefined);
      }
    }

    await setDoc(
      reqRef,
      stripUndefined({
        fromUid: myUid,
        toUid,
        fromDisplayName: clampStr(fromUser.displayName, 40) || clampStr(fromUser.username, 40) || 'Usuario',
        fromUsername: clampStr(fromUser.username, 32) || myUid.slice(0, 12),
        fromAvatar: clampStr(fromUser.avatar, 32) || 'madara',
        fromCustomAvatarUrl: safeMedia200k(fromUser.customAvatarUrl),
        status: 'pending',
        createdAt: serverTimestamp(),
      })
    );

    // Record outgoing sent request on sender's profile so it persists across devices
    await setDoc(sentRef, {
      fromUid: myUid,
      toUid,
      toDisplayName:
        clampStr(targetProfile?.displayName, 40) ||
        clampStr(targetProfile?.username, 40) ||
        'Usuario',
      toUsername: clampStr(targetProfile?.username, 32) || toUid.slice(0, 12),
      toAvatar: clampStr(targetProfile?.avatar, 32) || 'madara',
      status: 'pending',
      createdAt: serverTimestamp(),
    }).catch(() => undefined);

    return 'sent';
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function respondFriendRequest(params: {
  uid: string;
  fromUid: string;
  accept: boolean;
}): Promise<void> {
  const { uid, fromUid, accept } = params;
  const myUid = auth.currentUser?.uid || uid;
  const path = `users/${myUid}/friendRequests/${fromUid}`;
  const reqRef = doc(db, 'users', myUid, 'friendRequests', fromUid);
  try {
    await updateDoc(reqRef, {
      status: accept ? 'accepted' : 'declined',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    // Fallback cleanly if legacy friend request doc lacks strict schema fields
    try {
      await deleteDoc(reqRef);
    } catch {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }
}

export async function ensureRealConnectionByUsername(params: {
  currentUser: UserProfile;
  targetHandle: string;
}): Promise<string | null> {
  const { currentUser, targetHandle } = params;
  const cleanTarget = normalizeUsernameHandle(targetHandle);
  if (!cleanTarget || !currentUser.id) return null;
  if (normalizeUsernameHandle(currentUser.username) === cleanTarget) return null;

  try {
    const matches = await searchRealUsers(cleanTarget, currentUser.id);
    const exact =
      matches.find(
        (m) =>
          normalizeUsernameHandle(m.username) === cleanTarget ||
          m.displayName.trim().toLowerCase() === cleanTarget
      ) || matches[0];
    if (!exact || exact.id === currentUser.id) return null;

    const dmId = await getOrCreateDmThread(currentUser, exact);
    await sendFriendRequest({ fromUser: currentUser, toUid: exact.id }).catch(() => undefined);
    return dmId;
  } catch {
    return null;
  }
}

export async function upsertVoiceChannelPresence(params: {
  serverId: string;
  channelId: string;
  currentUser: UserProfile;
  muted: boolean;
  videoOn: boolean;
  screenSharing: boolean;
}): Promise<void> {
  const { serverId, channelId, currentUser, muted, videoOn, screenSharing } = params;
  if (!serverId || !channelId || !currentUser.id) return;
  try {
    await setDoc(
      doc(db, 'servers', serverId, 'channels', channelId, 'rtc', currentUser.id),
      stripUndefined({
        uid: currentUser.id,
        displayName: clampStr(currentUser.displayName, 40) || currentUser.username || 'Usuario',
        avatar: clampStr(currentUser.avatar, 32) || 'madara',
        customAvatarUrl: safeMedia200k(currentUser.customAvatarUrl),
        muted,
        videoOn,
        screenSharing,
        updatedAt: serverTimestamp(),
      })
    );
  } catch {
    /* ignore transient voice presence sync errors */
  }
}

export async function removeVoiceChannelPresence(
  serverId: string,
  channelId: string,
  uid: string
): Promise<void> {
  if (!serverId || !channelId || !uid) return;
  try {
    await deleteDoc(doc(db, 'servers', serverId, 'channels', channelId, 'rtc', uid));
  } catch {
    /* ignore */
  }
}

export function subscribeToVoiceChannelPresence(
  serverId: string,
  channelId: string,
  onData: (
    participants: {
      id: string;
      name: string;
      avatar: AvatarKey;
      customAvatarUrl?: string;
      muted: boolean;
      videoOn: boolean;
      screenSharing: boolean;
    }[]
  ) => void
): Unsubscribe {
  return onSnapshot(
    query(collection(db, 'servers', serverId, 'channels', channelId, 'rtc'), limit(50)),
    (snap) => {
      const list: {
        id: string;
        name: string;
        avatar: AvatarKey;
        customAvatarUrl?: string;
        muted: boolean;
        videoOn: boolean;
        screenSharing: boolean;
      }[] = [];
      snap.forEach((docSnap) => {
        const d = docSnap.data();
        list.push({
          id: String(d.uid || docSnap.id),
          name: String(d.displayName || 'Usuario'),
          avatar: (d.avatar as AvatarKey) || 'madara',
          customAvatarUrl: sanitizeMediaUrl(d.customAvatarUrl as string | undefined),
          muted: Boolean(d.muted),
          videoOn: Boolean(d.videoOn),
          screenSharing: Boolean(d.screenSharing),
        });
      });
      onData(list);
    },
    () => undefined
  );
}

