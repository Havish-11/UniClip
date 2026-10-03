import { WS_URL } from './api.js';

// Close codes from the backend that mean "don't retry"
export const FATAL = {
  4001: 'Invalid session details',
  4004: 'Session not found or expired',
  4008: 'Session is full',
  4009: 'Opened in another tab or window',
};

/** Opens a session socket that reconnects with backoff. Returns { send, close }. */
export function connectSession({ code, deviceId, deviceName, onMessage, onStatus }) {
  let ws, timer, ping, retry = 0, stopped = false;

  const open = () => {
    const q = new URLSearchParams({ code, deviceId, deviceName });
    ws = new WebSocket(`${WS_URL}/ws?${q}`);

    ws.onopen = () => {
      retry = 0;
      ping = setInterval(() => ws.readyState === 1 && ws.send('{"type":"ping"}'), 25_000);
    };
    ws.onmessage = (ev) => onMessage(JSON.parse(ev.data));
    ws.onclose = (ev) => {
      clearInterval(ping);
      if (stopped) return;
      if (FATAL[ev.code]) return onStatus('ended', FATAL[ev.code]);
      onStatus('reconnecting');
      timer = setTimeout(open, Math.min(1000 * 2 ** retry++, 15_000));
    };
  };

  open();

  return {
    send(msg) {
      if (ws?.readyState !== 1) return false;
      ws.send(JSON.stringify(msg));
      return true;
    },
    close() {
      stopped = true;
      clearTimeout(timer);
      clearInterval(ping);
      ws?.close();
    },
  };
}