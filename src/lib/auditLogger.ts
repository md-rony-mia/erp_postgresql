import { collection, addDoc, getDocs, query, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db, auth } from './firebase';

export interface AuditLogEntry {
  id?: string;
  timestamp: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'EXPORT' | 'IMPORT' | 'SETTINGS_CHANGE';
  collectionName: string;
  documentId: string;
  userId: string;
  userEmail: string | null;
  userRole: string;
  changes?: Record<string, { old: any; new: any }>;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Lightweight audit logging utility for compliance and traceability.
 * Safe execution guarantee: never throws exceptions if Firestore write fails.
 */
export async function logAuditEvent(params: Omit<AuditLogEntry, 'id' | 'timestamp' | 'userId' | 'userEmail'>): Promise<void> {
  const timestamp = new Date().toISOString();
  const userId = auth?.currentUser?.uid || 'anonymous';
  const userEmail = auth?.currentUser?.email || null;

  const logEntry: AuditLogEntry = {
    timestamp,
    userId,
    userEmail,
    ...params,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 200) : 'unknown',
  };

  // Always output to developer console in development
  if (process.env.NODE_ENV !== 'production') {
    console.log('[AuditLog]', logEntry);
  }

  try {
    if (db) {
      await addDoc(collection(db, 'audit_logs'), logEntry);
    }
  } catch (e) {
    // Fail-safe: audit logging must never cause secondary crashes
    console.error('Failed to write audit log entry to Firestore:', e);
  }
}

/**
 * Log a document creation event
 */
export async function logCreate(collectionName: string, documentId: string, data: Record<string, any>, metadata?: Record<string, any>) {
  return logAuditEvent({
    action: 'CREATE',
    collectionName,
    documentId,
    userRole: metadata?.userRole || 'unknown',
    metadata: { ...metadata, createdData: data },
  });
}

/**
 * Log a document update event with change tracking
 */
export async function logUpdate(
  collectionName: string,
  documentId: string,
  oldData: Record<string, any>,
  newData: Record<string, any>,
  metadata?: Record<string, any>
) {
  const changes: Record<string, { old: any; new: any }> = {};
  const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);

  for (const key of allKeys) {
    if (JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
      changes[key] = { old: oldData[key], new: newData[key] };
    }
  }

  return logAuditEvent({
    action: 'UPDATE',
    collectionName,
    documentId,
    userRole: metadata?.userRole || 'unknown',
    changes: Object.keys(changes).length > 0 ? changes : undefined,
    metadata,
  });
}

/**
 * Log a document deletion event
 */
export async function logDelete(collectionName: string, documentId: string, deletedData: Record<string, any>, metadata?: Record<string, any>) {
  return logAuditEvent({
    action: 'DELETE',
    collectionName,
    documentId,
    userRole: metadata?.userRole || 'unknown',
    metadata: { ...metadata, deletedData },
  });
}

/**
 * Fetch recent audit log entries for Administrator inspection.
 */
export async function fetchAuditLogs(limitCount: number = 50): Promise<AuditLogEntry[]> {
  if (!db) return [];
  try {
    const q = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(limitCount));
    const querySnapshot = await getDocs(q);
    const logs: AuditLogEntry[] = [];
    querySnapshot.forEach((docSnap) => {
      logs.push({ id: docSnap.id, ...(docSnap.data() as Omit<AuditLogEntry, 'id'>) });
    });
    return logs;
  } catch (e) {
    console.error('Failed to fetch audit logs from Firestore:', e);
    return [];
  }
}
