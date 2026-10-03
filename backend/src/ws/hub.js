import { WebSocket } from "ws";

export class Hub {
  /** @type {Map<string>, Map<string>, {ws: WebSocket, deviceId: string, deviceName: string, joinedAt: number}>>} */

  rooms = new Map();

  hasRoom(code) {
    return this.rooms.has(code);
  }

  has(code, deviceId) {
    return this.rooms.get(code)?.has(deviceId) ?? false;
  }

  size(code) {
    return this.rooms.get(code)?.size ?? 0;
  }

  // registering a device and if the same deviceId is already connected, the old socket is replaced

  join(code, { ws, deviceId, deviceName }) {
    let room = this.rooms.get(code);
    if (!room) this.rooms.set(code, (room = new Map()));

    const existing = room.get(deviceId);

    if (existing && existing.ws !== ws)
      existing.ws.close(4009, "Replaced by a newer connection");

    const device = { ws, deviceId, deviceName, joinedAt: Date.now() };
    room.set(deviceId, device);
    return this.#publicDevice(device);
  }

  leave(code, deviceId, ws) {
    const room = this.rooms.get(code);
    const device = room?.get(deviceId);
    if (!device || device.ws !== ws) return false;
    room.delete(deviceId);
    if (room.size === 0) this.rooms.delete(code);
    return true;
  }

  devices(code) {
    return [...(this.rooms.get(code)?.values() ?? [])].map((d) =>
      this.#publicDevice(d),
    );
  }

  broadcast(code, message, { exceptDeviceId } = {}) { // usefull when a device send something and you do not want to send it back to itself
    const payload = JSON.stringify(message);
    for (const device of this.rooms.get(code)?.values() ?? []) {
      if (device.deviceId === exceptDeviceId) continue;
      if (device.ws.readyState === WebSocket.OPEN) device.ws.send(payload);
    }
  }

  #publicDevice({ deviceId, deviceName, joinedAt }) {
    return { deviceId, deviceName, joinedAt };
  }
}
