import { vi, describe, it, expect, beforeEach } from 'vitest';

const storageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (k: string) => (k in store ? store[k] : null),
    setItem: (k: string, v: string) => {
      store[k] = String(v);
    },
    removeItem: (k: string) => {
      delete store[k];
    },
    clear: () => {
      store = {};
    },
  };
})();
vi.stubGlobal('localStorage', storageMock);

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

function jsonResponse(body: unknown, ok = true) {
  return Promise.resolve({ ok, json: () => Promise.resolve(body) } as Response);
}

import { logErrorToFirestore, fetchErrorLogsFromFirestore, clearErrorLogsFromFirestore } from '../lib/errorLogger';

describe('ErrorLogger Subsystem', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    storageMock.clear();
  });

  it('should POST error logs to /api/error-logs', async () => {
    mockFetch.mockReturnValueOnce(jsonResponse({ ok: true }));

    await logErrorToFirestore({
      message: 'Uncaught TypeError in Sales Module',
      stack: 'TypeError: Cannot read properties of null',
      userId: 'usr-1',
      userRole: 'Administrator',
      currentTab: 'sales',
    });

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/error-logs',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('Uncaught TypeError in Sales Module'),
      })
    );
  });

  it('should fetch error log entries from the API', async () => {
    mockFetch.mockReturnValueOnce(
      jsonResponse({
        items: [
          { id: '1', timestamp: '2026-07-22T00:00:00Z', message: 'Error 1' },
          { id: '2', timestamp: '2026-07-22T01:00:00Z', message: 'Error 2' },
        ],
      })
    );

    const logs = await fetchErrorLogsFromFirestore();

    expect(mockFetch).toHaveBeenCalledWith('/api/error-logs', expect.any(Object));
    expect(logs).toHaveLength(2);
    expect(logs[0].id).toBe('1');
    expect(logs[0].message).toBe('Error 1');
  });

  it('should call DELETE /api/error-logs to clear all logs', async () => {
    mockFetch.mockReturnValueOnce(jsonResponse({ ok: true }));

    await clearErrorLogsFromFirestore();

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/error-logs',
      expect.objectContaining({ method: 'DELETE' })
    );
  });
});
