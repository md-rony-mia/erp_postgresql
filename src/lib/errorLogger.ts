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
 * Lightweight error logging utility for writing component crashes and system exceptions
 * to the 'error_logs' collection via the API. Safe execution guarantee: never throws.
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

  console.error('[ErrorLogger Captured]', logEntry);

  try {
    await fetch('/api/error-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logEntry),
    });
  } catch (e) {
    console.error('Failed to write error log entry:', e);
  }
}

/**
 * Fetch recent error log entries for Administrator inspection.
 */
export async function fetchErrorLogsFromFirestore(): Promise<ErrorLogEntry[]> {
  try {
    const token = localStorage.getItem('nexova_auth_token');
    const res = await fetch('/api/error-logs', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) return [];
    const body = await res.json();
    return body.items || [];
  } catch (e) {
    console.error('Failed to fetch error logs:', e);
    return [];
  }
}

/**
 * Delete all error logs.
 */
export async function clearErrorLogsFromFirestore(): Promise<void> {
  try {
    const token = localStorage.getItem('nexova_auth_token');
    await fetch('/api/error-logs', {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  } catch (e) {
    console.error('Failed to clear error logs:', e);
  }
}
