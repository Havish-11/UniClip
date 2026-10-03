import http from 'node:http';
import { config } from './config.js';
import { createApp } from './app.js';
import { Hub } from './ws/hub.js';
import { attachWebSocketServer } from './ws/server.js';
import { startCleanupJob } from './services/cleanupService.js';

const hub = new Hub();
const server = http.createServer(createApp(hub));
const wss = attachWebSocketServer(server, hub);
const stopCleanup = startCleanupJob(hub);

server.listen(config.port, () => {
  console.log(`UniClip backend running on :${config.port}`);
});

function shutdown(signal) {
  console.log(`${signal} received, shutting down...`);
  stopCleanup();
  for (const client of wss.clients) client.close(1001, 'Server shutting down');
  wss.close();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 5000).unref();
}
process.on('SIGINT', () => shutdown('SIGINT'));  // SIGINT is signal interrupt
process.on('SIGTERM', () => shutdown('SIGTERM')); // SIGTERM is signal terminate