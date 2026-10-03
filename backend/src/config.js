import "dotenv/config";

const int = (value, fallback) => {
  // helper function to convert value to int
  const n = Number.parseInt(value ?? "", 10); // Here 10 is base 10
  return Number.isFinite(n) ? n : fallback;
};

export const config = {
  port: int(process.env.PORT, 8000), // Check if port is mentioned in env file or use 8000
  corsOrigins: (process.env.CORS_ORIGIN ?? "http://localhost:5173") // origin for react/vite frontend
    .split(",") // splits multiple origin
    .map((s) => s.trim()) // used to trim any waste spaces
    .filter(Boolean), // used to remove empty strings
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    serviceAccountJson: process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
  },
  session: {
    ttlMs: int(process.env.SESSION_TTL_MINUTES, 60) * 60_000,
    codeLength: 6,
    maxDevices: int(process.env.MAX_DEVICES_PER_SESSION, 5),
    cleanupIntervalMs: 10 * 60_000,
  },
  clipboard: {
    maxContentLength: 10_000,
    historyLimit: 50,
  },
  ws: {
    path: "/ws",
    heartbeatMs: 30_000,
    maxPayloadBytes: 64 * 1024,
    rateLimit: { max: 30, windowMs: 10_000 },
  },
};
