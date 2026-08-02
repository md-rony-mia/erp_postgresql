import { and, eq, sql } from 'drizzle-orm';
import { db } from '../db/index.ts';
import { documents } from '../db/schema.ts';

export interface DocRecord {
  id: string;
  [key: string]: unknown;
}

function toDoc(row: { docId: string; data: unknown }): DocRecord {
  const data = (row.data && typeof row.data === 'object') ? (row.data as Record<string, unknown>) : {};
  return { ...data, id: row.docId };
}

/** Returns every document in a collection as { id, ...fields } objects. */
export async function listCollection(collection: string): Promise<DocRecord[]> {
  const rows = await db
    .select({ docId: documents.docId, data: documents.data })
    .from(documents)
    .where(eq(documents.collection, collection));
  return rows.map(toDoc);
}

/** Returns a single document, or null if it doesn't exist. */
export async function getDocument(collection: string, docId: string): Promise<DocRecord | null> {
  const rows = await db
    .select({ docId: documents.docId, data: documents.data })
    .from(documents)
    .where(and(eq(documents.collection, collection), eq(documents.docId, docId)))
    .limit(1);
  if (rows.length === 0) return null;
  return toDoc(rows[0]);
}

/** Inserts or fully replaces a single document. */
export async function upsertDocument(collection: string, docId: string, data: Record<string, unknown>): Promise<DocRecord> {
  const { id: _ignored, ...rest } = data as any;
  await db
    .insert(documents)
    .values({ collection, docId, data: rest, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: [documents.collection, documents.docId],
      set: { data: rest, updatedAt: new Date() },
    });
  return { ...rest, id: docId };
}

/** Merges partial fields into an existing document (creates it if missing). */
export async function updateDocument(collection: string, docId: string, partial: Record<string, unknown>): Promise<DocRecord> {
  const existing = await getDocument(collection, docId);
  const merged = { ...(existing || { id: docId }), ...partial };
  return upsertDocument(collection, docId, merged);
}

export async function deleteDocument(collection: string, docId: string): Promise<void> {
  await db.delete(documents).where(and(eq(documents.collection, collection), eq(documents.docId, docId)));
}

/**
 * Full replace-sync of a collection: upserts every item passed in, and deletes any
 * existing rows in that collection whose id is not present in `items` — mirrors the
 * previous Firestore syncCollectionToFirestore semantics exactly.
 */
export async function syncCollection(collection: string, items: DocRecord[]): Promise<DocRecord[]> {
  const incomingIds = new Set(items.map((i) => String(i.id)));

  const existingRows = await db
    .select({ docId: documents.docId })
    .from(documents)
    .where(eq(documents.collection, collection));

  const toDelete = existingRows.map((r) => r.docId).filter((id) => !incomingIds.has(id));

  for (const item of items) {
    await upsertDocument(collection, String(item.id), item);
  }
  for (const id of toDelete) {
    await deleteDocument(collection, id);
  }
  return items;
}

/** Seeds a collection with initial data only if it is currently empty. */
export async function seedIfEmpty(collection: string, initialData: DocRecord[]): Promise<DocRecord[]> {
  const existing = await listCollection(collection);
  if (existing.length > 0) return existing;
  for (const item of initialData) {
    await upsertDocument(collection, String(item.id), item);
  }
  return initialData;
}

/** Finds documents in a collection where a top-level field equals a value (client-side style query). */
export async function findWhere(collection: string, field: string, value: unknown): Promise<DocRecord[]> {
  const rows = await db
    .select({ docId: documents.docId, data: documents.data })
    .from(documents)
    .where(and(eq(documents.collection, collection), sql`${documents.data} ->> ${field} = ${String(value)}`));
  return rows.map(toDoc);
}

/**
 * Atomically increments (or decrements, for negative deltas) a numeric `stock` field on a
 * branch_stocks document, creating it if it doesn't exist yet. Clamps at zero.
 */
export async function incrementBranchStock(branchId: string, productId: string, qtyChange: number): Promise<number> {
  const stockDocId = `${branchId}_${productId}`;
  return await db.transaction(async (tx) => {
    const rows = await tx
      .select({ data: documents.data })
      .from(documents)
      .where(and(eq(documents.collection, 'branch_stocks'), eq(documents.docId, stockDocId)))
      .for('update');

    const current = rows.length > 0 ? (rows[0].data as Record<string, unknown>) : null;
    const currentStock = current && typeof current.stock === 'number' ? current.stock : Number(current?.stock || 0);
    const newQty = Math.max(0, currentStock + qtyChange);

    const newData = {
      id: stockDocId,
      branchId,
      productId,
      stock: newQty,
      lastUpdated: new Date().toISOString(),
    };

    await tx
      .insert(documents)
      .values({ collection: 'branch_stocks', docId: stockDocId, data: newData, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: [documents.collection, documents.docId],
        set: { data: newData, updatedAt: new Date() },
      });

    return newQty;
  });
}
