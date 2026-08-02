import { AppSettings } from '../types';

export type Unsubscribe = () => void;

// Always true now — the Postgres API is the one real backend (no more "demo mode" flag
// tied to a missing Firebase key). Kept exported so existing call sites that still check
// it keep compiling without edits.
export const isFirebaseConfigured = true;

const TOKEN_KEY = 'nexova_auth_token';

export interface AppUser {
  id?: string;
  uid: string;
  name: string;
  email: string;
  role: string;
  username?: string;
  status?: string;
  avatar?: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Token storage + a tiny Firebase-Auth-shaped compat object, since a couple of
// screens (e.g. BankingAndLoanView) read `auth.currentUser` as a simple truthy check.
// ---------------------------------------------------------------------------

export const auth: { currentUser: AppUser | null } = { currentUser: null };

function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

class ApiError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}

async function apiFetch(path: string, options: RequestInit = {}): Promise<any> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`/api${path}`, { ...options, headers });
  } catch (err) {
    throw new ApiError('Network error. Please check your internet connection.', 'auth/network-request-failed');
  }

  let body: any = null;
  try {
    body = await res.json();
  } catch {
    /* empty body */
  }

  if (!res.ok) {
    throw new ApiError(body?.error || `Request failed (${res.status})`, body?.code || 'api/error');
  }
  return body;
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export async function signIn(identifier: string, password: string): Promise<{ user: AppUser }> {
  const body = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier, password }),
  });
  setToken(body.token);
  auth.currentUser = body.user;
  return { user: body.user };
}

export async function signOutUser(): Promise<void> {
  setToken(null);
  auth.currentUser = null;
}

/**
 * Validates any stored session token once on load and reports the user (or null).
 * Unlike Firestore's onSnapshot-style listener this doesn't push further updates after
 * the initial check, since JWT sessions don't change server-side; call signIn/signOutUser
 * to change the session.
 */
export function onAuthStateChange(callback: (user: AppUser | null) => void): Unsubscribe {
  let cancelled = false;
  const token = getToken();
  if (!token) {
    callback(null);
    return () => {
      cancelled = true;
    };
  }
  apiFetch('/auth/me')
    .then((body) => {
      if (cancelled) return;
      auth.currentUser = body.user;
      callback(body.user);
    })
    .catch(() => {
      if (cancelled) return;
      setToken(null);
      auth.currentUser = null;
      callback(null);
    });
  return () => {
    cancelled = true;
  };
}

export async function createNewUserWithSecondaryApp(
  email: string,
  password: string,
  name: string,
  role: string,
  username: string
) {
  return apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, name, role, username }),
  });
}

export async function sendPasswordResetEmail(email: string): Promise<{ tempPassword: string }> {
  const body = await apiFetch('/auth/admin-reset-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
  return { tempPassword: body.tempPassword };
}

export async function updatePassword(newPassword: string): Promise<void> {
  await apiFetch('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ newPassword }),
  });
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  console.error('API Error:', { error: error instanceof Error ? error.message : String(error), operationType, path });
  throw error instanceof Error ? error : new Error(String(error));
}

// ---------------------------------------------------------------------------
// Generic collection helpers (same contract the app already relied on)
// ---------------------------------------------------------------------------

export async function saveDocToFirestore<T extends { id: string }>(collectionName: string, data: T): Promise<void> {
  try {
    localStorage.setItem(`nexova_doc_${collectionName}_${data.id}`, JSON.stringify(data));
  } catch {
    /* ignore quota errors */
  }
  try {
    await apiFetch(`/data/${collectionName}/doc`, { method: 'POST', body: JSON.stringify(data) });
  } catch (error) {
    console.warn(`API saveDoc error for [${collectionName}/${data.id}]:`, error);
  }
}

export async function saveSettingsToFirestore(settings: AppSettings): Promise<void> {
  try {
    localStorage.setItem('nexova_app_settings', JSON.stringify(settings));
  } catch {
    /* ignore */
  }
  try {
    await apiFetch('/data/settings/doc', { method: 'POST', body: JSON.stringify({ id: 'app', ...settings }) });
  } catch (error) {
    console.warn('API saveSettings error:', error);
  }
}

export async function fetchCollectionFromFirestore<T>(collectionName: string): Promise<T[]> {
  try {
    const body = await apiFetch(`/data/${collectionName}`);
    return body.items as T[];
  } catch (error) {
    console.warn(`API fetch for [${collectionName}] encountered error:`, error);
    const stored = localStorage.getItem(`nexova_col_${collectionName}`);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        /* ignore */
      }
    }
    return [];
  }
}

// ---------------------------------------------------------------------------
// Real-time subscriptions over a single shared WebSocket connection
// ---------------------------------------------------------------------------

type Listener = (items: any[]) => void;
const listeners = new Map<string, Set<Listener>>();
let socket: WebSocket | null = null;
let reconnectDelay = 1000;

function wsUrl(): string {
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${window.location.host}/ws`;
}

function ensureSocket() {
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) return;
  const token = getToken();
  if (!token) return;

  socket = new WebSocket(wsUrl());

  socket.onopen = () => {
    reconnectDelay = 1000;
    socket?.send(JSON.stringify({ type: 'auth', token }));
  };

  socket.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      if (msg.type === 'auth_result' && msg.ok) {
        // Re-subscribe to everything currently being watched (covers reconnects)
        for (const collectionName of listeners.keys()) {
          socket?.send(JSON.stringify({ type: 'subscribe', collection: collectionName }));
        }
        return;
      }
      if (msg.type === 'update' && typeof msg.collection === 'string') {
        try {
          localStorage.setItem(`nexova_col_${msg.collection}`, JSON.stringify(msg.items));
        } catch {
          /* ignore */
        }
        const set = listeners.get(msg.collection);
        if (set) set.forEach((cb) => cb(msg.items));
      }
    } catch {
      /* ignore malformed frame */
    }
  };

  socket.onclose = () => {
    socket = null;
    setTimeout(ensureSocket, reconnectDelay);
    reconnectDelay = Math.min(reconnectDelay * 2, 15000);
  };

  socket.onerror = () => {
    socket?.close();
  };
}

export function subscribeToCollection<T>(collectionName: string, onUpdate: (items: T[]) => void): Unsubscribe {
  // Deliver a first snapshot immediately (matches onSnapshot's initial fire) without
  // waiting on the socket round trip.
  fetchCollectionFromFirestore<T>(collectionName).then(onUpdate).catch(() => {});

  let set = listeners.get(collectionName);
  if (!set) {
    set = new Set();
    listeners.set(collectionName, set);
  }
  set.add(onUpdate as Listener);

  ensureSocket();
  if (socket?.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: 'subscribe', collection: collectionName }));
  }

  return () => {
    const s = listeners.get(collectionName);
    if (!s) return;
    s.delete(onUpdate as Listener);
    if (s.size === 0) {
      listeners.delete(collectionName);
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'unsubscribe', collection: collectionName }));
      }
    }
  };
}

export async function seedCollectionIfEmpty<T extends { id: string }>(
  collectionName: string,
  initialData: T[]
): Promise<T[]> {
  try {
    const body = await apiFetch(`/data/${collectionName}/seed`, {
      method: 'POST',
      body: JSON.stringify({ items: initialData }),
    });
    return body.items as T[];
  } catch (error) {
    console.warn(`API seed for [${collectionName}] encountered error:`, error);
    const stored = localStorage.getItem(`nexova_col_${collectionName}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.length > 0) return parsed;
      } catch {
        /* ignore */
      }
    }
    try {
      localStorage.setItem(`nexova_col_${collectionName}`, JSON.stringify(initialData));
    } catch {
      /* ignore */
    }
    return initialData;
  }
}

export async function syncCollectionToFirestore<T extends { id: string }>(
  collectionName: string,
  currentItems: T[]
): Promise<void> {
  try {
    localStorage.setItem(`nexova_col_${collectionName}`, JSON.stringify(currentItems));
  } catch {
    /* ignore */
  }
  try {
    await apiFetch(`/data/${collectionName}/sync`, {
      method: 'POST',
      body: JSON.stringify({ items: currentItems }),
    });
  } catch (error) {
    console.warn(`API sync error for [${collectionName}]:`, error);
  }
}

// ---------------------------------------------------------------------------
// Single-document helpers (for screens that manage one doc at a time, e.g. branches)
// ---------------------------------------------------------------------------

export async function getDocById<T>(collectionName: string, id: string): Promise<T | null> {
  try {
    const body = await apiFetch(`/data/${collectionName}/${id}`);
    return body.item as T;
  } catch {
    return null;
  }
}

export async function setDocById<T extends { id?: unknown }>(
  collectionName: string,
  id: string,
  data: T
): Promise<void> {
  await apiFetch(`/data/${collectionName}/doc`, {
    method: 'POST',
    body: JSON.stringify({ ...data, id }),
  });
}

export async function updateDocById(collectionName: string, id: string, partial: Record<string, unknown>): Promise<void> {
  const current = (await getDocById<Record<string, unknown>>(collectionName, id)) || { id };
  await setDocById(collectionName, id, { ...current, ...partial, id });
}

export async function deleteDocById(collectionName: string, id: string): Promise<void> {
  await apiFetch(`/data/${collectionName}/${id}`, { method: 'DELETE' });
}

export async function queryCollectionWhere<T>(collectionName: string, field: string, value: string): Promise<T[]> {
  try {
    const body = await apiFetch(`/data/${collectionName}/query/${field}/${encodeURIComponent(value)}`);
    return body.items as T[];
  } catch {
    return [];
  }
}
