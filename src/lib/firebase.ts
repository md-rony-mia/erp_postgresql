import { initializeApp, getApps, deleteApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDocs, collection, writeBatch, deleteDoc, onSnapshot, query, limit, type Unsubscribe, type Firestore } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, createUserWithEmailAndPassword, type User as FirebaseUser, type Auth } from 'firebase/auth';
import { AppSettings } from '../types';

export type { Unsubscribe };

const rawApiKey = import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBuW_riXThjgxEciGOYoeUORji6lP_-F9A";

export const isFirebaseConfigured = typeof rawApiKey === 'string' &&
  rawApiKey.trim().length > 0 &&
  !rawApiKey.includes('MY_FIREBASE_API_KEY') &&
  !rawApiKey.includes('dummy') &&
  !rawApiKey.includes('placeholder');

if (!isFirebaseConfigured) {
  console.warn(
    '[NEXOVA SECURITY] Firebase is NOT configured. ' +
    'The application will run in LOCAL-ONLY demo mode. ' +
    'Data will NOT persist to the cloud. ' +
    'Set VITE_FIREBASE_API_KEY and related env vars to enable cloud sync.'
  );
}

const firebaseConfig = {
  apiKey: rawApiKey,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "gen-lang-client-0450547040",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "gen-lang-client-0450547040.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "gen-lang-client-0450547040.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1084420946916",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1084420946916:web:e473796d2be091d01425f1",
};

// Initialize Firebase safely
const apps = getApps();
const app: FirebaseApp = apps.length > 0 ? apps[0] : initializeApp(firebaseConfig);

// Initialize Firestore with custom databaseId safely
let firestoreInstance: Firestore | null = null;
try {
  if (isFirebaseConfigured) {
    const dbId = import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID;
    firestoreInstance = dbId ? getFirestore(app, dbId) : getFirestore(app);
  }
} catch (e) {
  console.error("[NEXOVA CRITICAL] Firestore initialization failed:", e);
}
export const db = firestoreInstance as unknown as Firestore;

// Initialize Auth safely
let authInstance: Auth | null = null;
try {
  if (isFirebaseConfigured) {
    authInstance = getAuth(app);
  }
} catch (e) {
  console.error("[NEXOVA CRITICAL] Firebase Auth initialization failed:", e);
}
export const auth = authInstance as unknown as Auth;

export function signIn(email: string, password: string) {
  if (!isFirebaseConfigured || !auth) {
    const mockUid = 'demo-user-' + (email ? Math.abs(email.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) : '1');
    return Promise.resolve({
      user: {
        uid: mockUid,
        email: email || 'admin@nexova.com',
        displayName: (email ? email.split('@')[0] : 'Admin'),
        emailVerified: true,
      }
    } as any);
  }
  return signInWithEmailAndPassword(auth, email, password);
}

export function signOutUser() {
  if (!isFirebaseConfigured || !auth) {
    return Promise.resolve();
  }
  return signOut(auth).catch((err) => {
    console.warn("Sign out warning:", err);
  });
}

export function onAuthStateChange(callback: (user: FirebaseUser | null) => void) {
  if (!isFirebaseConfigured || !auth) {
    const stored = localStorage.getItem('nexova_current_user');
    if (stored) {
      try {
        const u = JSON.parse(stored);
        callback({
          uid: u.uid || 'demo-user-1',
          email: u.email || 'admin@nexova.com',
          displayName: u.name || 'Admin',
        } as any);
      } catch (e) {
        callback(null);
      }
    } else {
      callback(null);
    }
    return () => {};
  }
  return onAuthStateChanged(
    auth,
    (user) => callback(user),
    (error) => {
      console.warn("Firebase auth state change error:", error);
      callback(null);
    }
  );
}

export async function createNewUserWithSecondaryApp(email: string, password: string, name: string, role: string, username: string) {
  if (!isFirebaseConfigured || !auth || !db) {
    const mockUid = 'user-' + Date.now();
    return { uid: mockUid, email, name, role };
  }
  let secondaryApp: FirebaseApp;
  const secondaryAppName = "SecondaryAppForUserCreation_" + Date.now();

  secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
  const secondaryAuth = getAuth(secondaryApp);

  try {
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    const newUser = userCredential.user;
    const uid = newUser.uid;

    await signOut(secondaryAuth);

    const userDocRef = doc(db, 'users', uid);
    await setDoc(userDocRef, {
      uid: uid,
      name: name,
      email: email,
      role: role,
      status: 'Active',
      username: username.toLowerCase().replace(/\s/g, '_'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: auth.currentUser?.uid || 'system',
    });

    return { uid, email, name, role };
  } finally {
    // Always clean up secondary app
    try {
      await deleteApp(secondaryApp);
    } catch (e) {
      // ignore cleanup errors
    }
  }
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
  timestamp: string;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
  }
}

export class NexovaFirestoreError extends Error {
  public info: FirestoreErrorInfo;
  constructor(info: FirestoreErrorInfo) {
    super(info.error);
    this.name = 'NexovaFirestoreError';
    this.info = info;
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null,
      tenantId: auth?.currentUser?.tenantId || null,
    },
    operationType,
    path,
    timestamp: new Date().toISOString(),
  };
  console.error('[NexovaFirestoreError]', JSON.stringify(errInfo));
  throw new NexovaFirestoreError(errInfo);
}

/**
 * Saves a single document to a collection in Firestore with audit fields
 */
export async function saveDocToFirestore<T extends { id: string }>(
  collectionName: string,
  data: T
) {
  const enrichedData = {
    ...data,
    updatedAt: new Date().toISOString(),
    updatedBy: auth?.currentUser?.uid || 'system',
  };

  if (!isFirebaseConfigured || !db) {
    try {
      localStorage.setItem(`nexova_doc_${collectionName}_${data.id}`, JSON.stringify(enrichedData));
    } catch (e) {
      console.warn('localStorage save failed:', e);
    }
    return;
  }
  try {
    const docRef = doc(db, collectionName, data.id);
    await setDoc(docRef, enrichedData, { merge: true });
  } catch (error) {
    console.warn(`Firestore saveDoc error for [${collectionName}/${data.id}]:`, error);
    try {
      localStorage.setItem(`nexova_doc_${collectionName}_${data.id}`, JSON.stringify(enrichedData));
    } catch (e) {}
  }
}

/**
 * Saves settings to a single document 'app' in settings collection
 */
export async function saveSettingsToFirestore(settings: AppSettings) {
  const enrichedSettings = {
    ...settings,
    updatedAt: new Date().toISOString(),
    updatedBy: auth?.currentUser?.uid || 'system',
  };

  if (!isFirebaseConfigured || !db) {
    try {
      localStorage.setItem('nexova_app_settings', JSON.stringify(enrichedSettings));
    } catch (e) {}
    return;
  }
  try {
    const docRef = doc(db, 'settings', 'app');
    await setDoc(docRef, enrichedSettings, { merge: true });
  } catch (error) {
    console.warn('Firestore saveSettings error:', error);
    try {
      localStorage.setItem('nexova_app_settings', JSON.stringify(enrichedSettings));
    } catch (e) {}
  }
}

/**
 * Fetches all documents from a collection
 */
export async function fetchCollectionFromFirestore<T extends { id: string }>(collectionName: string): Promise<T[]> {
  if (!isFirebaseConfigured || !db) {
    const stored = localStorage.getItem(`nexova_col_${collectionName}`);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {}
    }
    return [];
  }
  try {
    const querySnapshot = await getDocs(collection(db, collectionName));
    const items: T[] = [];
    querySnapshot.forEach((doc) => {
      items.push({ id: doc.id, ...doc.data() } as T);
    });
    return items;
  } catch (error) {
    console.warn(`Firestore fetch for [${collectionName}] encountered error:`, error);
    const stored = localStorage.getItem(`nexova_col_${collectionName}`);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {}
    }
    return [];
  }
}

/**
 * Subscribes to real-time updates for a collection in Firestore
 */
export function subscribeToCollection<T extends { id: string }>(
  collectionName: string,
  onUpdate: (items: T[]) => void,
  maxItems: number = 500
): Unsubscribe {
  if (!isFirebaseConfigured || !db) {
    const stored = localStorage.getItem(`nexova_col_${collectionName}`);
    if (stored) {
      try {
        onUpdate(JSON.parse(stored));
      } catch (e) {}
    }
    return () => {};
  }
  try {
    const colRef = collection(db, collectionName);
    const q = maxItems ? query(colRef, limit(maxItems)) : colRef;
    return onSnapshot(
      q,
      (querySnapshot) => {
        const items: T[] = [];
        querySnapshot.forEach((doc) => {
          items.push({ id: doc.id, ...doc.data() } as T);
        });
        onUpdate(items);
      },
      (error) => {
        console.warn(`Firestore subscription notice for [${collectionName}]:`, error);
        const stored = localStorage.getItem(`nexova_col_${collectionName}`);
        if (stored) {
          try {
            onUpdate(JSON.parse(stored));
          } catch (e) {}
        }
      }
    );
  } catch (err) {
    console.warn(`Firestore subscribe catch notice for [${collectionName}]:`, err);
    return () => {};
  }
}

/**
 * Seeds a collection in Firestore if it is empty
 */
export async function seedCollectionIfEmpty<T extends { id: string }>(
  collectionName: string,
  initialData: T[]
): Promise<T[]> {
  if (!isFirebaseConfigured || !db) {
    const stored = localStorage.getItem(`nexova_col_${collectionName}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    try {
      localStorage.setItem(`nexova_col_${collectionName}`, JSON.stringify(initialData));
    } catch (e) {}
    return initialData;
  }
  try {
    const existing = await fetchCollectionFromFirestore<T>(collectionName);
    if (existing && existing.length > 0) {
      return existing;
    }

    // Collection is empty, seed it using batch for atomicity
    const batch = writeBatch(db);
    const now = new Date().toISOString();
    initialData.forEach((item) => {
      const docRef = doc(db, collectionName, item.id);
      batch.set(docRef, {
        ...item,
        createdAt: now,
        updatedAt: now,
        createdBy: 'system_seed',
        updatedBy: 'system_seed',
      });
    });
    await batch.commit();
    return initialData;
  } catch (error) {
    console.warn(`Firestore seed for [${collectionName}] encountered error:`, error);
    try {
      localStorage.setItem(`nexova_col_${collectionName}`, JSON.stringify(initialData));
    } catch (e) {}
    return initialData;
  }
}

/**
 * Synchronizes an array of items with a Firestore collection atomically.
 * Uses writeBatch for all mutations to ensure consistency.
 */
export async function syncCollectionToFirestore<T extends { id: string }>(
  collectionName: string,
  currentItems: T[]
) {
  try {
    localStorage.setItem(`nexova_col_${collectionName}`, JSON.stringify(currentItems));
  } catch (e) {}

  if (!isFirebaseConfigured || !db) {
    return;
  }

  try {
    const querySnapshot = await getDocs(collection(db, collectionName));
    const firestoreIds = new Set<string>();
    querySnapshot.forEach((doc) => {
      firestoreIds.add(doc.id);
    });

    const batch = writeBatch(db);
    const now = new Date().toISOString();
    const userId = auth?.currentUser?.uid || 'system';

    // Save/update all current items
    for (const item of currentItems) {
      const docRef = doc(db, collectionName, item.id);
      batch.set(docRef, {
        ...item,
        updatedAt: now,
        updatedBy: userId,
      }, { merge: true });
      firestoreIds.delete(item.id);
    }

    // Delete items no longer in the list
    for (const idToDelete of firestoreIds) {
      const docRef = doc(db, collectionName, idToDelete);
      batch.delete(docRef);
    }

    await batch.commit();
  } catch (error) {
    console.warn(`Firestore sync error for [${collectionName}]:`, error);
  }
}
