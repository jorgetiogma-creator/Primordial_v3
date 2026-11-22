# Security Specification & Invariants — Primordial

## 1. Access Control Invariants
- **Verified Identity Gate**: Every authenticated read/write requires `request.auth != null && request.auth.token.email_verified == true` (excluding `/test/connection` health-check `get`).
- **PII & Wallet Isolation**: Sensitive data (`orbs`, `ownedBundleIds`, `wishlistIds`, `isOwnerAccount`) lives strictly under `/users/{uid}/private/account`, readable and writable only when `request.auth.uid == uid`.
- **Single Owner Privilege Lock**: `isOwnerAccount == true` on `/users/{uid}/private/account` is enforced in rules so ONLY the designated project owner email (`emaneriera@gmail.com`) may hold `isOwnerAccount: true`.
- **Server Ownership & Admin Enforcement**:
  - Creating a server requires `ownerId == request.auth.uid` and `request.auth.uid in adminIds`.
  - Updating/deleting a server or creating/updating/deleting channels requires `request.auth.uid == server.ownerId || request.auth.uid in server.adminIds`.
  - Non-admin users joining a server (`servers/{serverId}/members/{uid}`) MUST join with `isAdmin == false` and cannot escalate `isAdmin` or `roleIds`.
  - Only `ownerId` or an existing server admin can grant/revoke `isAdmin` or assign admin roles to another member, and `ownerId` is immutable.
- **Messaging & Notifications**:
  - DM threads and messages are gated by `request.auth.uid in participantIds` (`participantIds.size() <= 10`).
  - Channel messages require verified server membership (`exists(/databases/$(database)/documents/servers/$(serverId)/members/$(request.auth.uid))`).
  - `/everyone` server notifications can only be dispatched to `/users/{targetUid}/notifications/{notifId}` when BOTH `senderUid` and `targetUid` are members of `targetServerId` and `senderUid == request.auth.uid`.
- **Unbounded List Safety**: Server members live in `/servers/{serverId}/members/{uid}` subcollection rather than an unbounded array on `/servers/{serverId}`.

## 2. Adversarial Test Vectors ("Dirty Dozen")
1. **Unauthenticated read on `/publicProfiles` or `/dms`** -> DENIED.
2. **Privilege escalation on `/users/{uid}/private/account` setting `isOwnerAccount: true` by non-owner** -> DENIED.
3. **Cross-user read/write on `/users/{otherUid}/private/account` or `/users/{otherUid}/notifications`** -> DENIED.
4. **Non-admin joining another user's server with `isAdmin: true` in `members/{uid}`** -> DENIED.
5. **Non-admin member updating `/servers/{serverId}` name, icon, roles, or `adminIds`** -> DENIED.
6. **Non-admin member creating/deleting/reordering `/servers/{serverId}/channels/{channelId}`** -> DENIED.
7. **Admin trying to overwrite `ownerId` on `/servers/{serverId}`** -> DENIED (`ownerId` immutable).
8. **Spoofing `authorId` in DM or Channel message (`authorId != request.auth.uid`)** -> DENIED.
9. **Non-participant reading or writing `/dms/{dmId}/messages/{msgId}`** -> DENIED.
10. **Non-member sending `/everyone` notification to `/users/{victimUid}/notifications/{id}`** -> DENIED.
11. **Oversized payload injection (`content.size() > 2000`, `name.size() > 80`, or `bio.size() > 400`)** -> DENIED.
12. **Username hijacking (`usernames/{taken}` overwrite by non-owner)** -> DENIED.
