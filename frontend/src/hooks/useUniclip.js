import { useEffect, useRef, useState } from 'react';
import { connectSession } from '../services/websocket.js';

export const uid = () =>
  crypto.randomUUID?.() ?? `id${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;

const guessName = () => {
  const ua = navigator.userAgent;
  if (/iPhone|iPad/.test(ua)) return 'iPhone';
  if (/Android/.test(ua)) return 'Android';
  if (/Mac/.test(ua)) return 'Mac';
  if (/Windows/.test(ua)) return 'Windows PC';
  if (/Linux/.test(ua)) return 'Linux';
  return 'Device';
};

function getDevice() {
  let id = localStorage.getItem('uniclip:deviceId');
  if (!id) localStorage.setItem('uniclip:deviceId', (id = uid()));
  return { id, name: guessName() };
}

const upsert = (list, entry) =>
  [...list.filter((e) => e.id !== entry.id), entry].sort((a, b) => a.seq - b.seq);

export function useUniClip(code) {
  const [state, setState] = useState({ status: 'connecting', entries: [], devices: [], error: null, notice: null });
  const [device] = useState(getDevice);
  const connRef = useRef(null);

  useEffect(() => {
    const patch = (p) => setState((s) => ({ ...s, ...p }));

    const onMessage = (m) => {
      switch (m.type) {
        case 'welcome': 
          return patch({ status: 'open', entries: m.entries, devices: m.devices, error: null });
        case 'history':
          return patch({ entries: m.entries });
        case 'entry:added':
        case 'entry:ack':
          return setState((s) => ({ ...s, entries: upsert(s.entries, m.entry) }));
        case 'entry:deleted':
          return setState((s) => ({ ...s, entries: s.entries.filter((e) => e.id !== m.id) }));
        case 'entry:cleared':
          return patch({ entries: [] });
        case 'device:joined':
          return setState((s) => ({
            ...s,
            devices: [...s.devices.filter((d) => d.deviceId !== m.device.deviceId), m.device],
          }));
        case 'device:left':
          return setState((s) => ({ ...s, devices: s.devices.filter((d) => d.deviceId !== m.deviceId) }));
        case 'error':
          patch({ notice: m.message });
          return void setTimeout(() => patch({ notice: null }), 4000);
      }
    };

    const onStatus = (status, error = null) => patch({ status, error });

    connRef.current = connectSession({ code, deviceId: device.id, deviceName: device.name, onMessage, onStatus });
    return () => connRef.current?.close();
  }, [code, device]);

  const send = (msg) => connRef.current?.send(msg) ?? false;

  return {
    ...state,
    device,
    add: (content) => send({ type: 'entry:add', id: uid(), content }),
    remove: (id) => send({ type: 'entry:delete', id }),
    clear: () => send({ type: 'entry:clear' }),
  };
}