import { Router, type Request, type Response, type NextFunction } from 'express';
import {
  requireAuth,
  requireAdmin,
  signToken,
  hashPassword,
  comparePassword,
  generateRandomPassword,
  type AuthedRequest,
} from './auth.ts';
import {
  listCollection,
  getDocument,
  upsertDocument,
  updateDocument,
  deleteDocument,
  syncCollection,
  seedIfEmpty,
  findWhere,
  incrementBranchStock,
} from './dataStore.ts';
import { broadcastCollection } from './realtime.ts';

export const apiRouter = Router();

// Wraps an async route handler so a rejected promise (e.g. a dropped DB connection)
// is forwarded to Express's error handler instead of crashing the whole process with
// an unhandled rejection.
function ah(fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// ---------- Auth ----------

function sanitizeUser(u: Record<string, unknown>) {
  const { passwordHash, ...rest } = u as any;
  return rest;
}

apiRouter.get('/auth/bootstrap-status', ah(async (_req, res) => {
  const users = await listCollection('users');
  res.json({ hasUsers: users.length > 0 });
}));

// One-time: only works while the users collection is empty. Creates the first Administrator.
apiRouter.post('/auth/bootstrap', ah(async (req, res) => {
  const users = await listCollection('users');
  if (users.length > 0) {
    return res.status(409).json({ error: 'Setup already completed. Use /auth/login instead.', code: 'auth/already-bootstrapped' });
  }
  const { name, email, username, password } = req.body || {};
  if (!name || !email || !username || !password) {
    return res.status(400).json({ error: 'name, email, username and password are required', code: 'auth/invalid-input' });
  }
  if (String(password).length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters', code: 'auth/weak-password' });
  }
  const uid = 'user-' + Date.now();
  const passwordHash = await hashPassword(password);
  const initials = String(name).split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
  const userDoc = {
    id: uid,
    uid,
    name,
    email,
    username: String(username).toLowerCase().replace(/\s/g, '_'),
    role: 'Administrator',
    status: 'Active',
    avatar: initials || 'A',
    passwordHash,
  };
  await upsertDocument('users', uid, userDoc);
  await broadcastCollection('users');
  const token = signToken({ uid, email, role: 'Administrator' });
  res.json({ token, user: sanitizeUser(userDoc) });
}));

apiRouter.post('/auth/login', ah(async (req, res) => {
  const { identifier, password } = req.body || {};
  if (!identifier || !password) {
    return res.status(400).json({ error: 'identifier and password are required', code: 'auth/invalid-input' });
  }
  const users = await listCollection('users');
  const lower = String(identifier).toLowerCase();
  const user = users.find(
    (u: any) => (u.email || '').toLowerCase() === lower || (u.username || '').toLowerCase() === lower
  );
  if (!user) {
    return res.status(404).json({ error: 'No account found with this email or username', code: 'auth/user-not-found' });
  }
  const ok = await comparePassword(password, (user as any).passwordHash);
  if (!ok) {
    return res.status(401).json({ error: 'Incorrect password', code: 'auth/wrong-password' });
  }
  if ((user as any).status && (user as any).status !== 'Active') {
    return res.status(403).json({ error: 'Account is inactive', code: 'auth/user-disabled' });
  }
  const token = signToken({ uid: String(user.id), email: (user as any).email, role: (user as any).role });
  res.json({ token, user: sanitizeUser(user) });
}));

// Admin creates a new employee/user account
apiRouter.post('/auth/register', requireAuth, requireAdmin, ah(async (req: AuthedRequest, res) => {
  const { name, email, username, password, role } = req.body || {};
  if (!name || !email || !username || !password) {
    return res.status(400).json({ error: 'All fields including password are required', code: 'auth/invalid-input' });
  }
  if (String(password).length < 6) {
    return res.status(400).json({ error: 'Password is too weak', code: 'auth/weak-password' });
  }
  const users = await listCollection('users');
  const emailLower = String(email).toLowerCase();
  const existing = users.find((u: any) => (u.email || '').toLowerCase() === emailLower);
  if (existing) {
    return res.status(409).json({ error: 'This email is already registered', code: 'auth/email-already-in-use' });
  }
  const uid = 'user-' + Date.now();
  const passwordHash = await hashPassword(password);
  const initials = String(name).split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
  const userDoc = {
    id: uid,
    uid,
    name,
    email,
    username: String(username).toLowerCase().replace(/\s/g, '_'),
    role: role || 'Cashier',
    status: 'Active',
    avatar: initials || 'U',
    passwordHash,
  };
  await upsertDocument('users', uid, userDoc);
  await broadcastCollection('users');
  res.json({ uid, email, name, role: userDoc.role });
}));

apiRouter.get('/auth/me', requireAuth, ah(async (req: AuthedRequest, res) => {
  const user = await getDocument('users', req.authUser!.uid);
  if (!user) return res.status(404).json({ error: 'User not found', code: 'auth/user-not-found' });
  res.json({ user: sanitizeUser(user) });
}));

// Self-service: change your own password while logged in (no old-password check, matches
// prior Firebase updatePassword() behaviour used right after an authenticated session).
apiRouter.post('/auth/change-password', requireAuth, ah(async (req: AuthedRequest, res) => {
  const { newPassword } = req.body || {};
  if (!newPassword || String(newPassword).length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters', code: 'auth/weak-password' });
  }
  const passwordHash = await hashPassword(newPassword);
  await updateDocument('users', req.authUser!.uid, { passwordHash });
  res.json({ ok: true });
}));

// Admin-triggered reset: no SMTP is configured, so instead of emailing a link this
// generates a temporary password and returns it to the admin to relay manually.
apiRouter.post('/auth/admin-reset-password', requireAuth, requireAdmin, ah(async (req: AuthedRequest, res) => {
  const { email } = req.body || {};
  const users = await listCollection('users');
  const emailLower = String(email || '').toLowerCase();
  const user = users.find((u: any) => (u.email || '').toLowerCase() === emailLower);
  if (!user) return res.status(404).json({ error: 'No account found with this email', code: 'auth/user-not-found' });
  const tempPassword = generateRandomPassword();
  const passwordHash = await hashPassword(tempPassword);
  await updateDocument('users', String(user.id), { passwordHash });
  res.json({ ok: true, tempPassword });
}));

// ---------- Generic data (collections) ----------

const RESERVED = new Set(['auth', 'branch-stock', 'error-logs']);

apiRouter.use('/data/:collection', requireAuth, (req, res, next) => {
  if (RESERVED.has(req.params.collection)) {
    return res.status(400).json({ error: 'Reserved collection name' });
  }
  next();
});

apiRouter.get('/data/:collection', ah(async (req, res) => {
  const items = await listCollection(req.params.collection);
  res.json({ items });
}));

apiRouter.get('/data/:collection/:id', ah(async (req, res) => {
  const item = await getDocument(req.params.collection, req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json({ item });
}));

apiRouter.post('/data/:collection/doc', ah(async (req, res) => {
  const body = req.body || {};
  const id = body.id ? String(body.id) : `${req.params.collection}_${Date.now()}`;
  const saved = await upsertDocument(req.params.collection, id, body);
  await broadcastCollection(req.params.collection);
  res.json({ item: saved });
}));

apiRouter.post('/data/:collection/sync', ah(async (req, res) => {
  const items = Array.isArray(req.body?.items) ? req.body.items : [];
  const saved = await syncCollection(req.params.collection, items);
  await broadcastCollection(req.params.collection);
  res.json({ items: saved });
}));

apiRouter.post('/data/:collection/seed', ah(async (req, res) => {
  const items = Array.isArray(req.body?.items) ? req.body.items : [];
  const result = await seedIfEmpty(req.params.collection, items);
  await broadcastCollection(req.params.collection);
  res.json({ items: result });
}));

apiRouter.get('/data/:collection/query/:field/:value', ah(async (req, res) => {
  const results = await findWhere(req.params.collection, req.params.field, req.params.value);
  res.json({ items: results });
}));

apiRouter.delete('/data/:collection/:id', ah(async (req, res) => {
  await deleteDocument(req.params.collection, req.params.id);
  await broadcastCollection(req.params.collection);
  res.json({ ok: true });
}));

// ---------- Branch stock ----------

apiRouter.get('/branch-stock/:branchId', requireAuth, ah(async (req, res) => {
  const rows = await findWhere('branch_stocks', 'branchId', req.params.branchId);
  const map: Record<string, number> = {};
  for (const r of rows) {
    if ((r as any).productId) map[(r as any).productId as string] = Number((r as any).stock || 0);
  }
  res.json({ stocks: map });
}));

apiRouter.post('/branch-stock/update', requireAuth, ah(async (req, res) => {
  const { branchId, productId, qtyChange } = req.body || {};
  if (!branchId || !productId || typeof qtyChange !== 'number') {
    return res.status(400).json({ error: 'branchId, productId and numeric qtyChange are required' });
  }
  const newQty = await incrementBranchStock(branchId, productId, qtyChange);
  await broadcastCollection('branch_stocks');
  res.json({ stock: newQty });
}));

// ---------- Error logs ----------

apiRouter.get('/error-logs', requireAuth, ah(async (_req, res) => {
  const items = await listCollection('error_logs');
  const sorted = items.sort((a: any, b: any) => (b.timestamp || '').localeCompare(a.timestamp || '')).slice(0, 50);
  res.json({ items: sorted });
}));

apiRouter.post('/error-logs', ah(async (req, res) => {
  // Intentionally not gated behind requireAuth: crash reports can happen before login
  // resolves, mirroring the original fire-and-forget Firestore write.
  const id = `errlog_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  await upsertDocument('error_logs', id, { ...req.body, id });
  res.json({ ok: true });
}));

apiRouter.delete('/error-logs', requireAuth, requireAdmin, ah(async (_req, res) => {
  const items = await listCollection('error_logs');
  for (const item of items) {
    await deleteDocument('error_logs', String(item.id));
  }
  res.json({ ok: true });
}));

// Final safety net: any error forwarded via next(err) (including DB/connection failures)
// is reported as JSON instead of crashing the process.
apiRouter.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('API route error:', err);
  if (res.headersSent) return;
  res.status(500).json({ error: 'Internal server error. Please try again shortly.', code: 'api/internal-error' });
});
