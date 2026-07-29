import { collection, addDoc, getDocs, query, orderBy, limit, deleteDoc, doc } from 'firebase/firestore';
import { db } from './firebase';

export interface ErrorLogEntry {
  id?: string;
  timestamp: string;
  message: string;
  stack?: string;
  userId?: string;
  userRole?: string;
  currentTab?: string;
  currentSubTab?: string;
  userAgent?: string;
}

/**
 * Lightweight error logging utility for writing component crashes and system exceptions to Firestore 'error_logs'.
 * Safe execution guarantee: never throws exceptions if Firestore write fails.
 */
export async function logErrorToFirestore(params: {
  message: string;
  stack?: string;
  userId?: string;
  userRole?: string;
  currentTab?: string;
  currentSubTab?: string;
  extraContext?: string;
}): Promise<void> {
  const timestamp = new Date().toISOString();
  const truncatedStack = params.stack ? params.stack.slice(0, 1500) : undefined;
  const truncatedMessage = params.message ? params.message.slice(0, 500) : 'Unknown Error';

  const logEntry: ErrorLogEntry = {
    timestamp,
    message: truncatedMessage,
    stack: truncatedStack,
    userId: params.userId || 'anonymous',
    userRole: params.userRole || 'unknown',
    currentTab: params.currentTab || (params.extraContext ? `Context: ${params.extraContext}` : ''),
    currentSubTab: params.currentSubTab || '',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 200) : 'unknown',
  };

  // Always output to developer console
  console.error('[ErrorLogger Captured]', logEntry);

  try {
    if (db) {
      await addDoc(collection(db, 'error_logs'), logEntry);
    }
  } catch (e) {
    // Fail-safe fallback so error logging never causes secondary crashes
    console.error('Failed to write error log entry to Firestore:', e);
  }
}

/**
 * Fetch recent error log entries from Firestore for Administrator inspection.
 */
export async function fetchErrorLogsFromFirestore(): Promise<ErrorLogEntry[]> {
  if (!db) return [];
  try {
    const q = query(collection(db, 'error_logs'), orderBy('timestamp', 'desc'), limit(50));
    const querySnapshot = await getDocs(q);
    const logs: ErrorLogEntry[] = [];
    querySnapshot.forEach((docSnap) => {
      logs.push({ id: docSnap.id, ...(docSnap.data() as Omit<ErrorLogEntry, 'id'>) });
    });
    return logs;
  } catch (e) {
    console.error('Failed to fetch error logs from Firestore:', e);
    return [];
  }
}

/**
 * Delete all error logs from Firestore.
 */
export async function clearErrorLogsFromFirestore(): Promise<void> {
  if (!db) return;
  try {
    const logs = await fetchErrorLogsFromFirestore();
    const deletePromises = logs.map((l) => (l.id ? deleteDoc(doc(db, 'error_logs', l.id)) : Promise.resolve()));
    await Promise.all(deletePromises);
  } catch (e) {
    console.error('Failed to clear error logs:', e);
  }
}
