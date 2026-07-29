import { vi, describe, it, expect, beforeEach } from 'vitest';

// Stub environment variables before importing firebase module so isFirebaseConfigured is true
vi.hoisted(() => {
  vi.stubEnv('VITE_FIREBASE_API_KEY', 'test-api-key-12345');
  vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'demo-project');
});

// Mock Firebase SDKs before importing our code
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({})),
  getApps: vi.fn(() => []),
}));

const mockDoc: any = vi.fn((_db, collection, id) => ({ collection, id }));
const mockSetDoc: any = vi.fn();
const mockGetDocs: any = vi.fn();
const mockCollection: any = vi.fn((_db, name) => name);
const mockDeleteDoc: any = vi.fn();
const mockOnSnapshot: any = vi.fn();

const mockBatch = {
  set: vi.fn(),
  commit: vi.fn().mockResolvedValue(undefined),
};
const mockWriteBatch = vi.fn(() => mockBatch);

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  doc: (a?: any, b?: any, c?: any) => {
    if (c !== undefined) return mockDoc(a, b, c);
    if (b !== undefined) return mockDoc(a, b);
    return mockDoc(a);
  },
  setDoc: (a?: any, b?: any, c?: any) => {
    if (c !== undefined) return mockSetDoc(a, b, c);
    return mockSetDoc(a, b);
  },
  getDocs: (a?: any) => mockGetDocs(a),
  collection: (a?: any, b?: any) => {
    if (b !== undefined) return mockCollection(a, b);
    return mockCollection(a);
  },
  deleteDoc: (a?: any) => mockDeleteDoc(a),
  writeBatch: () => mockWriteBatch(),
  onSnapshot: (a?: any, b?: any, c?: any) => mockOnSnapshot(a, b, c),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({
    currentUser: {
      uid: 'test-uid',
      email: 'test@example.com',
      emailVerified: true,
      isAnonymous: false,
      tenantId: null,
      providerData: [],
    },
  })),
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
}));

// Now import the functions to test
import {
  saveDocToFirestore,
  fetchCollectionFromFirestore,
  syncCollectionToFirestore,
  subscribeToCollection,
  handleFirestoreError,
  OperationType,
} from '../lib/firebase';

describe('Firestore Helper Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('saveDocToFirestore', () => {
    it('should save document successfully', async () => {
      mockSetDoc.mockResolvedValueOnce(undefined);
      const data = { id: 'prod1', name: 'Product 1' };

      await saveDocToFirestore('products', data);

      expect(mockDoc).toHaveBeenCalledWith(expect.any(Object), 'products', 'prod1');
      expect(mockSetDoc).toHaveBeenCalledWith({ collection: 'products', id: 'prod1' }, data);
    });

    it('should handle setDoc errors gracefully with fallback', async () => {
      mockSetDoc.mockRejectedValueOnce(new Error('Permission Denied'));
      const data = { id: 'prod1', name: 'Product 1' };

      await expect(saveDocToFirestore('products', data)).resolves.not.toThrow();
    });
  });

  describe('fetchCollectionFromFirestore', () => {
    it('should retrieve list of documents mapping doc ID and data', async () => {
      const mockDocs = [
        { id: '1', data: () => ({ name: 'Item 1' }) },
        { id: '2', data: () => ({ name: 'Item 2' }) },
      ];
      const mockQuerySnapshot = {
        forEach: (callback: any) => mockDocs.forEach((doc) => callback(doc)),
      };
      mockGetDocs.mockResolvedValueOnce(mockQuerySnapshot);

      const result = await fetchCollectionFromFirestore<{ id: string; name: string }>('products');

      expect(mockCollection).toHaveBeenCalledWith(expect.any(Object), 'products');
      expect(mockGetDocs).toHaveBeenCalledWith('products');
      expect(result).toEqual([
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' },
      ]);
    });

    it('should handle fetching errors gracefully', async () => {
      mockGetDocs.mockRejectedValueOnce(new Error('Network error'));
      const result = await fetchCollectionFromFirestore('products');
      expect(result).toEqual([]);
    });
  });

  describe('syncCollectionToFirestore', () => {
    it('should sync local array adding/updating active docs and deleting missing docs', async () => {
      const mockDocs = [
        { id: 'item-old', data: () => ({ name: 'Old Item' }) },
        { id: 'item-stay', data: () => ({ name: 'Stay Item' }) },
      ];
      const mockQuerySnapshot = {
        forEach: (callback: any) => mockDocs.forEach((doc) => callback(doc)),
      };
      mockGetDocs.mockResolvedValueOnce(mockQuerySnapshot);
      mockSetDoc.mockResolvedValue(undefined);
      mockDeleteDoc.mockResolvedValue(undefined);

      const currentItems = [
        { id: 'item-stay', name: 'Stay Item Updated' },
        { id: 'item-new', name: 'New Item' },
      ];

      await syncCollectionToFirestore('products', currentItems);

      expect(mockGetDocs).toHaveBeenCalled();
      expect(mockSetDoc).toHaveBeenCalledWith({ collection: 'products', id: 'item-stay' }, { id: 'item-stay', name: 'Stay Item Updated' });
      expect(mockSetDoc).toHaveBeenCalledWith({ collection: 'products', id: 'item-new' }, { id: 'item-new', name: 'New Item' });
      expect(mockDeleteDoc).toHaveBeenCalledWith({ collection: 'products', id: 'item-old' });
    });
  });

  describe('subscribeToCollection', () => {
    it('should subscribe to collection updates and invoke callback with snapshot items', () => {
      const mockUnsubscribe = vi.fn();
      mockOnSnapshot.mockImplementation((colRef: any, successCb: any) => {
        const mockDocs = [
          { id: 'sub1', data: () => ({ name: 'Sub Item 1' }) },
          { id: 'sub2', data: () => ({ name: 'Sub Item 2' }) },
        ];
        const mockQuerySnapshot = {
          forEach: (cb: any) => mockDocs.forEach((doc) => cb(doc)),
        };
        successCb(mockQuerySnapshot);
        return mockUnsubscribe;
      });

      const onUpdate = vi.fn();
      const unsub = subscribeToCollection('products', onUpdate);

      expect(mockCollection).toHaveBeenCalledWith(expect.any(Object), 'products');
      expect(mockOnSnapshot).toHaveBeenCalled();
      expect(onUpdate).toHaveBeenCalledWith([
        { id: 'sub1', name: 'Sub Item 1' },
        { id: 'sub2', name: 'Sub Item 2' },
      ]);

      unsub();
      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it('should handle subscription error callback gracefully', () => {
      mockOnSnapshot.mockImplementation((colRef: any, successCb: any, errorCb: any) => {
        errorCb(new Error('Subscription failed'));
        return vi.fn();
      });

      const onUpdate = vi.fn();
      subscribeToCollection('products', onUpdate);

      expect(mockOnSnapshot).toHaveBeenCalled();
    });
  });

  describe('handleFirestoreError', () => {
    it('should format error into JSON string and throw', () => {
      expect(() => {
        handleFirestoreError(new Error('Permission denied'), OperationType.WRITE, 'products/prod1');
      }).toThrow(/Permission denied/);
    });
  });
});
