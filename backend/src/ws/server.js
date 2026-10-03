import { WebSocket, WebSocketServer } from 'ws';
import { config } from '../config.js';
import { AppError, Errors } from '../utils/errors.js';
import { isValidCode, normalizeCode } from '../utils/code.js';
import { getActiveSession, touchSession } from '../services/sessionService.js';
import { addEntry, clearEntries, deleteEntry, listEntries } from '../services/clipboardService.js';

const ID_RE = /^[A-Za-z0-9_-]{8,64}$/;

const send = (ws, message) => {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(message));
};

const sendError = (ws, err) => {
  if (!(err instanceof AppError)) console.error('[ws] unexpected error:', err);
  send(ws, {
    type: 'error',
    code: err instanceof AppError ? err.code : 'INTERNAL',
    message: err instanceof AppError ? err.message : 'Internal error',
  });
};

export function attachWebSocketServer(httpServer, hub) {
  const wss = new WebSocketServer({ noServer: true, maxPayload: config.ws.maxPayloadBytes });

  // ---- HTTP -> WS upgrade (path + origin checks) ----
  httpServer.on('upgrade', (req, socket, head) => {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname !== config.ws.path) return socket.destroy();

    const origin = req.headers.origin;
    const allowed = config.corsOrigins.includes('*') || !origin || config.corsOrigins.includes(origin);
    if (!allowed) {
      socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
      return socket.destroy();
    }

    wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, url));
  });

  // ---- Heartbeat: drop dead connections ----
  const heartbeat = setInterval(() => {
    for (const ws of wss.clients) {
      if (!ws.isAlive) {
        ws.terminate();
        continue;
      }
      ws.isAlive = false;
      ws.ping();
    }
  }, config.ws.heartbeatMs);
  heartbeat.unref();
  wss.on('close', () => clearInterval(heartbeat));

  // ---- Connections ----
  wss.on('connection', (ws, url) => {
    ws.isAlive = true;
    ws.on('pong', () => (ws.isAlive = true));
    ws.on('error', () => {});

    const ctx = {
      code: normalizeCode(url.searchParams.get('code')),
      deviceId: url.searchParams.get('deviceId') ?? '',
      deviceName: (url.searchParams.get('deviceName') ?? '').trim().slice(0, 40) || 'Device',
      joined: false,
      windowStart: Date.now(),
      count: 0,
    };

    // Join first, then process messages strictly in order.
    let queue = join(ws, ctx);
    ws.on('message', (raw) => {
      queue = queue.then(() => onMessage(ws, ctx, raw)).catch((err) => sendError(ws, err));
    });

    ws.on('close', () => {
      if (ctx.joined && hub.leave(ctx.code, ctx.deviceId, ws)) {
        hub.broadcast(ctx.code, { type: 'device:left', deviceId: ctx.deviceId });
      }
    });
  });

  async function join(ws, ctx) {
    try {
      if (!isValidCode(ctx.code, config.session.codeLength)) throw Errors.badRequest('Invalid pairing code');
      if (!ID_RE.test(ctx.deviceId)) throw Errors.badRequest('Invalid deviceId');

      const session = await getActiveSession(ctx.code, { allowExpired: hub.hasRoom(ctx.code) });
      if (!session) throw Errors.sessionNotFound();
      if (!hub.has(ctx.code, ctx.deviceId) && hub.size(ctx.code) >= config.session.maxDevices) {
        throw Errors.sessionFull();
      }

      const [entries, expiresAt] = await Promise.all([listEntries(ctx.code), touchSession(ctx.code)]);
      if (ws.readyState !== WebSocket.OPEN) return; // client left while we were loading

      const device = hub.join(ctx.code, { ws, deviceId: ctx.deviceId, deviceName: ctx.deviceName });
      ctx.joined = true;

      send(ws, {
        type: 'welcome',
        session: { code: ctx.code, expiresAt },
        device,
        devices: hub.devices(ctx.code),
        entries, // full snapshot (oldest -> newest); client replaces its list, keyed by id
      });
      hub.broadcast(ctx.code, { type: 'device:joined', device }, { exceptDeviceId: ctx.deviceId });
    } catch (err) {
      sendError(ws, err);
      ws.close(err instanceof AppError ? err.closeCode : 1011, err.code ?? 'INTERNAL');
    }
  }

  async function onMessage(ws, ctx, raw) {
    if (!ctx.joined) return;

    const now = Date.now();
    if (now - ctx.windowStart > config.ws.rateLimit.windowMs) {
      ctx.windowStart = now;
      ctx.count = 0;
    }
    if (++ctx.count > config.ws.rateLimit.max) throw Errors.rateLimited();

    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      throw Errors.badRequest('Message must be valid JSON');
    }

    switch (msg?.type) {
      case 'ping': //application level ping
        return send(ws, { type: 'pong' });

      case 'history:get':
        return send(ws, { type: 'history', entries: await listEntries(ctx.code) });

      case 'entry:add': {
        if (!ID_RE.test(msg.id ?? '')) throw Errors.badRequest('Invalid entry id');
        if (typeof msg.content !== 'string' || msg.content.trim() === '') {
          throw Errors.badRequest('Content must be a non-empty string');
        }
        if (msg.content.length > config.clipboard.maxContentLength) {
          throw Errors.badRequest(`Content exceeds ${config.clipboard.maxContentLength} characters`);
        }

        const { entry, created } = await addEntry(ctx.code, {
          id: msg.id,
          content: msg.content,
          deviceId: ctx.deviceId,
          deviceName: ctx.deviceName,
        });

        if (created) return hub.broadcast(ctx.code, { type: 'entry:added', entry });
        // Retry or duplicate content: tell only the sender so it can reconcile its optimistic entry.
        return send(ws, { type: 'entry:ack', id: msg.id, duplicate: true, entry });
      }

      case 'entry:delete': {
        if (!ID_RE.test(msg.id ?? '')) throw Errors.badRequest('Invalid entry id');
        await deleteEntry(ctx.code, msg.id);
        return hub.broadcast(ctx.code, { type: 'entry:deleted', id: msg.id });
      }

      case 'entry:clear':
        await clearEntries(ctx.code);
        return hub.broadcast(ctx.code, { type: 'entry:cleared' });

      default:
        throw Errors.badRequest('Unknown message type');
    }
  }

  return wss;
}