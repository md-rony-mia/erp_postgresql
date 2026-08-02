import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Provide a minimal localStorage-backed Storage before the module under test runs,
// since dataClient reads a stored auth token via localStorage.
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

import {
  saveDocToFirestore,
  fetchCollectionFromFirestore,
  syncCollectionToFirestore,
  handleFirestoreError,
  OperationType,
} from '../lib/dataClient';

function jsonResponse(body: unknown, ok = true, status = 200) {
  return Promise.resolve({
    ok,
    status,
    json: () => Promise.resolve(body),
  } as Response);
}

describe('dataClient (Postgres API wrapper)', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    storageMock.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('saveDocToFirestore', () => {
    it('should POST the document to /api/data/:collection/doc', async () => {
      mockFetch.mockReturnValueOnce(jsonResponse({ item: { id: 'prod1', name: 'Product 1' } }));
      const data = { id: 'prod1', name: 'Product 1' };

      await saveDocToFirestore('products', data);

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/data/products/doc',
        expect.objectContaining({ method: 'POST', body: JSON.stringify(data) })
      );
    });

    it('should not throw when the request fails (fire-and-forget with local cache fallback)', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      const data = { id: 'prod1', name: 'Product 1' };

      await expect(saveDocToFirestore('products', data)).resolves.not.toThrow();
    });
  });

  describe('fetchCollectionFromFirestore', () => {
    it('should GET /api/data/:collection and return the items array', async () => {
      mockFetch.mockReturnValueOnce(
        jsonResponse({
          items: [
            { id: '1', name: 'Item 1' },
            { id: '2', name: 'Item 2' },
          ],
        })
      );

      const result = await fetchCollectionFromFirestore<{ id: string; name: string }>('products');

      expect(mockFetch).toHaveBeenCalledWith('/api/data/products', expect.any(Object));
      expect(result).toEqual([
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' },
      ]);
    });

    it('should fall back to an empty array (or cached copy) when the request fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      const result = await fetchCollectionFromFirestore('products');
      expect(result).toEqual([]);
    });
  });

  describe('syncCollectionToFirestore', () => {
    it('should POST the full item list to /api/data/:collection/sync', async () => {
      mockFetch.mockReturnValueOnce(jsonResponse({ items: [] }));

      const currentItems = [
        { id: 'item-stay', name: 'Stay Item Updated' },
        { id: 'item-new', name: 'New Item' },
      ];

      await syncCollectionToFirestore('products', currentItems);

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/data/products/sync',
        expect.objectContaining({ method: 'POST', body: JSON.stringify({ items: currentItems }) })
      );
    });
  });

  describe('handleFirestoreError', () => {
    it('should log and re-throw the original error', () => {
      expect(() => {
        handleFirestoreError(new Error('Permission denied'), OperationType.WRITE, 'products/prod1');
      }).toThrow(/Permission denied/);
    });
  });
});
