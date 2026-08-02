import { pgTable, text, jsonb, timestamp, primaryKey, index } from 'drizzle-orm/pg-core';

/**
 * Generic document store — mirrors the Firestore data model (collection / docId / data)
 * that the whole app was originally built against. Every "collection" the frontend used
 * with Firestore (products, customers, invoices, users, branches, settings, workflows,
 * documents, projects, manufacturing_orders, services, integrations, error_logs, ...)
 * lives here as rows, keyed by (collection, doc_id).
 *
 * Why generic instead of one strict table per entity: the app has 20+ Firestore
 * collections and several are schema-less/free-form (settings, workflows, dynamic
 * report configs). A generic JSONB store is the faithful, low-risk equivalent of what
 * Firestore was already doing, and the whole app keeps working without enumerating
 * every field of every module. Hot paths that need real relational columns/joins later
 * (e.g. invoices, products) can be migrated to dedicated typed tables incrementally —
 * this table does not block that.
 */
export const documents = pgTable(
  'documents',
  {
    collection: text('collection').notNull(),
    docId: text('doc_id').notNull(),
    data: jsonb('data').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.collection, table.docId] }),
    collectionIdx: index('documents_collection_idx').on(table.collection),
  })
);
