import { Server, StoredAccount, UserProfile } from '../types/discord';

export const RESERVED_OWNER_USERNAME = 'snuf';
export const ADMIN_OWNER_USERNAMES = ['snuf'] as const;
export const VERIFIED_USERNAMES = ['carruyo'] as const;
export const DESIGNATED_OWNER_EMAIL = 'emaneriera@gmail.com';
export const DESIGNATED_OWNER_EMAILS = [
  'emaneriera@gmail.com',
  'jorgesantiagoensuprime@gmail.com',
] as const;

export function isVerifiedAccount(username?: string | null): boolean {
  if (!username) return false;
  const clean = username.trim().toLowerCase().replace(/^@+/, '');
  return (VERIFIED_USERNAMES as readonly string[]).includes(clean);
}

export function isDesignatedOwnerEmail(email?: string | null): boolean {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  return (DESIGNATED_OWNER_EMAILS as readonly string[]).includes(clean);
}

export function isOwnerUsername(username?: string | null): boolean {
  if (!username) return false;
  const clean = username.trim().toLowerCase().replace(/^@+/, '');
  return (ADMIN_OWNER_USERNAMES as readonly string[]).includes(clean);
}

export function isOwnerIdentity(params: {
  username?: string | null;
  email?: string | null;
  firebaseEmail?: string | null;
  contact?: string | null;
  isOwnerAccount?: boolean;
}): boolean {
  return Boolean(
    isOwnerUsername(params.username) ||
      isDesignatedOwnerEmail(params.email) ||
      isDesignatedOwnerEmail(params.firebaseEmail) ||
      isDesignatedOwnerEmail(params.contact)
  );
}

export interface ServerPermissions {
  isOwner: boolean;
  canManageServer: boolean;
  canManageChannels: boolean;
  canKickMembers: boolean;
  canManageRoles: boolean;
  canPinMessages: boolean;
}

/**
 * Resolves the authorized Owner account ID (@snuf or designated owner email).
 */
export function resolveSingleOwnerAccountId(accounts: StoredAccount[]): string | null {
  const ownerAcc = accounts.find((acc) =>
    isOwnerIdentity({
      username: acc.user.username,
      email: acc.user.email,
      contact: acc.contact,
    })
  );
  return ownerAcc ? ownerAcc.id : null;
}

/**
 * Ensures stored accounts pin Owner status strictly on verified owner identities only.
 */
export function normalizeSingleOwnerAccounts(accounts: StoredAccount[]): StoredAccount[] {
  let changed = false;
  const next = accounts.map((acc) => {
    const shouldBeOwner = isOwnerIdentity({
      username: acc.user.username,
      email: acc.user.email,
      contact: acc.contact,
    });
    if (Boolean(acc.isOwnerAccount) !== shouldBeOwner) {
      changed = true;
      return { ...acc, isOwnerAccount: shouldBeOwner };
    }
    return acc;
  });

  return changed ? next : accounts;
}

/**
 * Checks whether the currently active session belongs exclusively to an authorized Owner account.
 */
export function isActiveAccountOwner(
  activeAccountId: string | null,
  accounts: StoredAccount[],
  currentUser: UserProfile,
  firebaseEmail?: string | null
): boolean {
  if (
    isOwnerIdentity({
      username: currentUser.username,
      email: currentUser.email,
      firebaseEmail,
    })
  ) {
    return true;
  }
  if (!activeAccountId) return false;
  const activeAccount = accounts.find((acc) => acc.id === activeAccountId);
  return Boolean(
    activeAccount &&
      activeAccount.user.id === currentUser.id &&
      isOwnerIdentity({
        username: activeAccount.user.username,
        email: activeAccount.user.email,
        contact: activeAccount.contact,
        firebaseEmail,
      })
  );
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
