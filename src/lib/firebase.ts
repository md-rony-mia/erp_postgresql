import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, setDoc, getDocs, collection, writeBatch, deleteDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, createUserWithEmailAndPassword, User as FirebaseUser } from 'firebase/auth';
import { AppSettings } from '../types';

export type { Unsubscribe };

const rawApiKey = import.meta.env.VITE_FIREBASE_API_KEY;

export const isFirebaseConfigured = typeof rawApiKey === 'string' &&
  rawApiKey.trim().length > 0 &&
  !rawApiKey.includes('MY_FIREBASE_API_KEY');

const firebaseConfig = {
  apiKey: isFirebaseConfigured ? rawApiKey : 'AIzaSyDummyKeyForLocalDevelopmentOnly1234',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'demo-project',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'demo-project.firebaseapp.com',
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

// Initialize Firebase safely
const apps = getApps();
const app = apps.length > 0 ? apps[0] : initializeApp(firebaseConfig);

// Initialize Firestore with custom databaseId safely
let firestoreInstance: ReturnType<typeof getFirestore>;
try {
  firestoreInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId);
} catch (e) {
  console.warn("Firestore initialization notice:", e);
  firestoreInstance = {} as any;
}
export const db = firestoreInstance;

// Initialize Auth safely
let authInstance: ReturnType<typeof getAuth>;
try {
  authInstance = getAuth(app);
} catch (e) {
  console.warn("Firebase Auth initialization notice:", e);
  authInstance = { currentUser: null } as any;
}
export const auth = authInstance;

export function signIn(email: string, password: string) {
  if (!isFirebaseConfigured) {
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
  if (!isFirebaseConfigured) {
    return Promise.resolve();
  }
  try {
    return signOut(auth);
  } catch (err) {
    console.warn("Sign out warning:", err);
    return Promise.resolve();
  }
}

export function onAuthStateChange(callback: (user: FirebaseUser | null) => void) {
  if (!isFirebaseConfigured) {
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
  try {
    return onAuthStateChanged(
      auth,
      (user) => callback(user),
      (error) => {
        console.warn("Firebase auth state change error:", error);
        callback(null);
      }
    );
  } catch (err) {
    console.warn("Firebase auth subscription failed:", err);
    callback(null);
    return () => {};
  }
}

export async function createNewUserWithSecondaryApp(email: string, password: string, name: string, role: string, username: string) {
  if (!isFirebaseConfigured) {
    const mockUid = 'user-' + Date.now();
    return { uid: mockUid, email, name, role };
  }
  let secondaryApp;
  const secondaryAppName = "SecondaryAppForUserCreation";
  const existingApps = getApps();
  const existingApp = existingApps.find(a => a.name === secondaryAppName);
  if (existingApp) {
    secondaryApp = existingApp;
  } else {
    secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
  }

  const secondaryAuth = getAuth(secondaryApp);
  
  // Create user
  const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
  const newUser = userCredential.user;
  const uid = newUser.uid;

  // Immediately sign out secondary auth so it doesn't leave active sessions
  await signOut(secondaryAuth);

  // Now create the Firestore document /users/{uid} using the primary db instance
  const userDocRef = doc(db, 'users', uid);
  await setDoc(userDocRef, {
    uid: uid,
    name: name,
    email: email,
    role: role,
    status: 'Active',
    username: username.toLowerCase().replace(/\s/g, '_'),
  });

  return { uid, email, name, role };
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
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  // Intentionally silent: re-thrown immediately so caller catch blocks/UIs handle it
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Saves a single document to a collection in Firestore
 */
export async function saveDocToFirestore<T extends { id: string }>(
  collectionName: string,
  data: T
) {
  if (!isFirebaseConfigured) {
    try {
      localStorage.setItem(`nexova_doc_${collectionName}_${data.id}`, JSON.stringify(data));
    } catch (e) {}
    return;
  }
  try {
    const docRef = doc(db, collectionName, data.id);
    await setDoc(docRef, data);
  } catch (error) {
    console.warn(`Firestore saveDoc error for [${collectionName}/${data.id}]:`, error);
    try {
      localStorage.setItem(`nexova_doc_${collectionName}_${data.id}`, JSON.stringify(data));
    } catch (e) {}
  }
}

/**
 * Saves settings to a single document 'app' in settings collection
 */
export async function saveSettingsToFirestore(settings: AppSettings) {
  if (!isFirebaseConfigured) {
    try {
      localStorage.setItem('nexova_app_settings', JSON.stringify(settings));
    } catch (e) {}
    return;
  }
  try {
    const docRef = doc(db, 'settings', 'app');
    await setDoc(docRef, settings);
  } catch (error) {
    console.warn('Firestore saveSettings error:', error);
    try {
      localStorage.setItem('nexova_app_settings', JSON.stringify(settings));
    } catch (e) {}
  }
}

/**
 * Fetches all documents from a collection
 */
export async function fetchCollectionFromFirestore<T>(collectionName: string): Promise<T[]> {
  if (!isFirebaseConfigured) {
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
export function subscribeToCollection<T>(
  collectionName: string,
  onUpdate: (items: T[]) => void
): Unsubscribe {
  if (!isFirebaseConfigured) {
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
    return onSnapshot(
      colRef,
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
  if (!isFirebaseConfigured) {
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

    // Collection is empty, seed it
    const batch = writeBatch(db);
    initialData.forEach((item) => {
      const docRef = doc(db, collectionName, item.id);
      batch.set(docRef, item);
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
 * Synchronizes an array of items with a Firestore collection, adding/updating active items and deleting inactive ones
 */
export async function syncCollectionToFirestore<T extends { id: string }>(
  collectionName: string,
  currentItems: T[]
) {
  try {
    localStorage.setItem(`nexova_col_${collectionName}`, JSON.stringify(currentItems));
  } catch (e) {}

  if (!isFirebaseConfigured) {
    return;
  }

  try {
    // 1. Fetch current IDs in Firestore
    const querySnapshot = await getDocs(collection(db, collectionName));
    const firestoreIds = new Set<string>();
    querySnapshot.forEach((doc) => {
      firestoreIds.add(doc.id);
    });

    // 2. Save/update all current items
    for (const item of currentItems) {
      const docRef = doc(db, collectionName, item.id);
      await setDoc(docRef, item);
      firestoreIds.delete(item.id);
    }

    // 3. Any leftover IDs in firestoreIds are deleted (since they are no longer in our list!)
    for (const idToDelete of firestoreIds) {
      const docRef = doc(db, collectionName, idToDelete);
      await deleteDoc(docRef);
    }
  } catch (error) {
    console.warn(`Firestore sync error for [${collectionName}]:`, error);
  }
}

