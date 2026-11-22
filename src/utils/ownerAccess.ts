import { Server, StoredAccount, UserProfile } from '../types/discord';

export const RESERVED_OWNER_USERNAME = 'owner';
export const DESIGNATED_OWNER_EMAIL = 'emaneriera@gmail.com';

/**
 * Resolves the ONE AND ONLY private Owner account ID.
 * - Once pinned with `isOwnerAccount: true`, ONLY that single account ID is ever recognized.
 * - On first migration before pinning, matches the user's exact `Owner` (`Owen`) account.
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

export function canManageServer(server: Server | undefined, userId?: string | null): boolean {
  if (!server || !userId) return false;
  if (server.ownerId === userId) return true;
  if (server.adminIds && server.adminIds.includes(userId)) return true;
  const memberRecord = server.members?.find((m) => m.uid === userId);
  if (memberRecord?.isAdmin) return true;
  const roleIds = server.memberRoleIds?.[userId] ?? memberRecord?.roleIds ?? [];
  if (roleIds.length > 0 && server.roles) {
    const hasAdminRole = server.roles.some(
      (role) => roleIds.includes(role.id) && role.permissions.includes('Administrador')
    );
    if (hasAdminRole) return true;
  }
  return false;
}
