import { Server, StoredAccount, UserProfile } from '../types/discord';

export const RESERVED_OWNER_USERNAME = 'owner';
export const DESIGNATED_OWNER_EMAIL = 'emaneriera@gmail.com';

export interface ServerPermissions {
  isOwner: boolean;
  canManageServer: boolean;
  canManageChannels: boolean;
  canKickMembers: boolean;
  canManageRoles: boolean;
  canPinMessages: boolean;
}

/**
 * Resolves the ONE AND ONLY private Owner account ID.
 */
export function resolveSingleOwnerAccountId(accounts: StoredAccount[]): string | null {
  const pinned = accounts.find((acc) => acc.isOwnerAccount === true);
  if (pinned) return pinned.id;

  const exactOwenOwner = accounts.find(
    (acc) =>
      acc.user.username.trim().toLowerCase() === RESERVED_OWNER_USERNAME &&
      acc.user.displayName.trim().toLowerCase() === 'owen'
  );
  if (exactOwenOwner) return exactOwenOwner.id;

  const usernameOwner = accounts.find(
    (acc) => acc.user.username.trim().toLowerCase() === RESERVED_OWNER_USERNAME
  );
  return usernameOwner ? usernameOwner.id : null;
}

/**
 * Ensures at most ONE StoredAccount in the list holds `isOwnerAccount: true`.
 */
export function normalizeSingleOwnerAccounts(accounts: StoredAccount[]): StoredAccount[] {
  const ownerId = resolveSingleOwnerAccountId(accounts);
  if (!ownerId) return accounts;

  let changed = false;
  const next = accounts.map((acc) => {
    const shouldBeOwner = acc.id === ownerId;
    if (Boolean(acc.isOwnerAccount) !== shouldBeOwner) {
      changed = true;
      return { ...acc, isOwnerAccount: shouldBeOwner };
    }
    return acc;
  });

  return changed ? next : accounts;
}

/**
 * Strictly checks whether the currently active session belongs to the single private Owner account.
 */
export function isActiveAccountOwner(
  activeAccountId: string | null,
  accounts: StoredAccount[],
  currentUser: UserProfile,
  firebaseEmail?: string | null
): boolean {
  if (firebaseEmail && firebaseEmail.trim().toLowerCase() === DESIGNATED_OWNER_EMAIL) {
    return true;
  }
  if (!activeAccountId) return false;
  const ownerId = resolveSingleOwnerAccountId(accounts);
  if (!ownerId || activeAccountId !== ownerId) return false;
  const ownerAccount = accounts.find((acc) => acc.id === ownerId);
  if (!ownerAccount) return false;
  return ownerAccount.id === activeAccountId && ownerAccount.user.id === currentUser.id;
}

export function isServerOwner(server: Server | undefined, userId?: string | null): boolean {
  if (!server || !userId) return false;
  if (!server.ownerId) return false;
  return server.ownerId === userId;
}

/**
 * Returns every server permission boolean explicitly initialized (safe defaults: false)
 * to eliminate any possibility of undefined permission ReferenceErrors.
 */
export function getServerPermissions(
  server: Server | undefined,
  userId?: string | null
): ServerPermissions {
  const defaults: ServerPermissions = {
    isOwner: false,
    canManageServer: false,
    canManageChannels: false,
    canKickMembers: false,
    canManageRoles: false,
    canPinMessages: false,
  };

  if (!server || !userId) return defaults;

  const isOwner = Boolean(server.ownerId && server.ownerId === userId);
  const memberRecord = server.members?.find((m) => m.uid === userId);
  const isListedAdmin = Boolean(
    (server.adminIds && server.adminIds.includes(userId)) || memberRecord?.isAdmin
  );

  const roleIds = server.memberRoleIds?.[userId] ?? memberRecord?.roleIds ?? [];
  const activeRoles = (server.roles ?? []).filter((role) => roleIds.includes(role.id));
  const hasPermission = (perm: string) =>
    activeRoles.some((role) => role.permissions?.includes(perm));

  const isAdmin = isOwner || isListedAdmin || hasPermission('Administrador');

  return {
    isOwner,
    canManageServer: isAdmin,
    canManageChannels: isAdmin || hasPermission('Gestionar canales'),
    canKickMembers: isAdmin || hasPermission('Expulsar miembros'),
    canManageRoles: isAdmin || hasPermission('Gestionar roles'),
    canPinMessages: isAdmin || hasPermission('Fijar mensajes'),
  };
}

export function canManageServer(server: Server | undefined, userId?: string | null): boolean {
  return getServerPermissions(server, userId).canManageServer;
}
