import { initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  signInAnonymously,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { doc, getDocFromServer, getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export interface CloudSessionResult {
  uid: string | null;
  email: string | null;
  authProviderDisabled: boolean;
  errorReason?: 'wrong-password' | 'not-found' | 'provider-disabled' | 'unknown';
}

function getFirebaseErrorCode(err: unknown): string {
  if (err && typeof err === 'object' && 'code' in err) {
    return String((err as { code?: unknown }).code || '');
  }
  return err instanceof Error ? err.message : String(err || '');
}

function isProviderDisabledError(err: unknown): boolean {
  const code = getFirebaseErrorCode(err).toLowerCase();
  return (
    code.includes('operation-not-allowed') ||
    code.includes('admin-restricted-operation') ||
    code.includes('auth/configuration-not-found')
  );
}

export function deriveCloudAuthEmail(email?: string | null, username?: string | null): string {
  const trimmedEmail = (email || '').trim().toLowerCase();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    return trimmedEmail;
  }
  const safeHandle =
    (username || 'user')
      .trim()
      .toLowerCase()
      .replace(/^@+/, '')
      .replace(/[^a-z0-9._-]/g, '')
      .slice(0, 32) || 'user';
  return `${safeHandle}@users.primordial.app`;
}

export function deriveCloudAuthPassword(password?: string | null, username?: string | null): string {
  const raw = (password || '').trim();
  if (raw.length >= 6) return raw;
  const seed =
    raw ||
    (username || 'user')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '') ||
    'user';
  return `${seed}_prm01`.slice(0, 64);
}

export async function ensureFirebaseSessionForAppAccount(params: {
  email?: string | null;
  username?: string | null;
  password?: string | null;
  createIfMissing?: boolean;
}): Promise<CloudSessionResult> {
  const targetEmail = deriveCloudAuthEmail(params.email, params.username);
  const targetPassword = deriveCloudAuthPassword(params.password, params.username);
  const hasExplicitCreds = Boolean((params.email || '').trim() || (params.username || '').trim());

  if (
    auth.currentUser &&
    !auth.currentUser.isAnonymous &&
    (!hasExplicitCreds || auth.currentUser.email?.toLowerCase() === targetEmail)
  ) {
    return {
      uid: auth.currentUser.uid,
      email: auth.currentUser.email,
      authProviderDisabled: false,
    };
  }

  try {
    if (params.createIfMissing) {
      try {
        const cred = await createUserWithEmailAndPassword(auth, targetEmail, targetPassword);
        return { uid: cred.user.uid, email: cred.user.email, authProviderDisabled: false };
      } catch (createErr) {
        const code = getFirebaseErrorCode(createErr);
        if (code.includes('email-already-in-use')) {
          try {
            const signInCred = await signInWithEmailAndPassword(auth, targetEmail, targetPassword);
            return { uid: signInCred.user.uid, email: signInCred.user.email, authProviderDisabled: false };
          } catch {
            // Fall through to current/anonymous session so device still connects cleanly
          }
        }
      }
    } else if (hasExplicitCreds) {
      try {
        const cred = await signInWithEmailAndPassword(auth, targetEmail, targetPassword);
        return { uid: cred.user.uid, email: cred.user.email, authProviderDisabled: false };
      } catch (signErr) {
        const code = getFirebaseErrorCode(signErr);
        if (
          code.includes('user-not-found') ||
          code.includes('invalid-credential') ||
          code.includes('invalid-login-credentials')
        ) {
          try {
            const created = await createUserWithEmailAndPassword(auth, targetEmail, targetPassword);
            return { uid: created.user.uid, email: created.user.email, authProviderDisabled: false };
          } catch {
            // Fall through to current/anonymous auth
          }
        }
      }
    }

    if (auth.currentUser) {
      return {
        uid: auth.currentUser.uid,
        email: auth.currentUser.email,
        authProviderDisabled: false,
      };
    }

    const anonCred = await signInAnonymously(auth);
    return { uid: anonCred.user.uid, email: anonCred.user.email, authProviderDisabled: false };
  } catch (fallbackErr) {
    return {
      uid: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      authProviderDisabled: isProviderDisabledError(fallbackErr),
    };
  }
}

export async function signInCloudAccountWithCredentials(
  identifier: string,
  password: string
): Promise<CloudSessionResult> {
  const cleanId = identifier.trim().toLowerCase().replace(/^@+/, '');
  if (!cleanId || !password.trim()) {
    return { uid: null, email: null, authProviderDisabled: false, errorReason: 'not-found' };
  }

  const emailCandidates = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanId)
    ? [cleanId]
    : [deriveCloudAuthEmail(null, cleanId)];
  const pwd = deriveCloudAuthPassword(password, cleanId);
  let lastErrorReason: CloudSessionResult['errorReason'] = 'not-found';

  for (const candidateEmail of emailCandidates) {
    try {
      const cred = await signInWithEmailAndPassword(auth, candidateEmail, pwd);
      return { uid: cred.user.uid, email: cred.user.email, authProviderDisabled: false };
    } catch (err) {
      if (isProviderDisabledError(err)) {
        return {
          uid: null,
          email: null,
          authProviderDisabled: true,
          errorReason: 'provider-disabled',
        };
      }
      const code = getFirebaseErrorCode(err).toLowerCase();
      if (code.includes('wrong-password')) {
        lastErrorReason = 'wrong-password';
      } else if (code.includes('invalid-credential') || code.includes('invalid-login-credentials')) {
        lastErrorReason = 'wrong-password';
      } else if (code.includes('user-not-found')) {
        lastErrorReason = 'not-found';
      } else {
        lastErrorReason = 'unknown';
      }
    }
  }

  return { uid: null, email: null, authProviderDisabled: false, errorReason: lastErrorReason };
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo: {
      providerId?: string | null;
      displayName?: string | null;
      email?: string | null;
      photoUrl?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          displayName: provider.displayName,
          email: provider.email,
          photoUrl: provider.photoURL,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

let connectionTested = false;

export async function testConnection(): Promise<void> {
  if (connectionTested) return;
  connectionTested = true;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

void testConnection();
