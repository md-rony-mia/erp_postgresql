import type { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { verifyToken } from './auth.ts';
import { listCollection } from './dataStore.ts';

interface ClientState {
  ws: WebSocket;
  subscriptions: Set<string>;
  authed: boolean;
}

const clients = new Set<ClientState>();

export function setupRealtime(httpServer: HttpServer) {
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws) => {
    const state: ClientState = { ws, subscriptions: new Set(), authed: false };
    clients.add(state);

    ws.on('message', async (raw) => {
      let msg: any;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        return;
      }

      if (msg.type === 'auth') {
        const payload = verifyToken(msg.token || '');
        state.authed = !!payload;
        ws.send(JSON.stringify({ type: 'auth_result', ok: state.authed }));
        return;
      }

      if (!state.authed) return; // ignore everything until authenticated

      if (msg.type === 'subscribe' && typeof msg.collection === 'string') {
        state.subscriptions.add(msg.collection);
        try {
          const items = await listCollection(msg.collection);
          ws.send(JSON.stringify({ type: 'update', collection: msg.collection, items }));
        } catch (err) {
          console.warn(`Realtime: initial fetch for [${msg.collection}] failed`, err);
        }
        return;
      }

      if (msg.type === 'unsubscribe' && typeof msg.collection === 'string') {
        state.subscriptions.delete(msg.collection);
        return;
      }
    });

    ws.on('close', () => {
      clients.delete(state);
    });
    ws.on('error', () => {
      clients.delete(state);
    });
  });

  console.log('Realtime WebSocket server attached at /ws');
}

/** Pushes the fresh contents of a collection to every subscribed, authenticated client. */
export async function broadcastCollection(collection: string) {
  const subscribed = Array.from(clients).filter((c) => c.authed && c.subscriptions.has(collection));
  if (subscribed.length === 0) return;
  try {
    const items = await listCollection(collection);
    const payload = JSON.stringify({ type: 'update', collection, items });
    for (const client of subscribed) {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(payload);
      }
    }
  } catch (err) {
    console.warn(`Realtime: broadcast for [${collection}] failed`, err);
  }
}
