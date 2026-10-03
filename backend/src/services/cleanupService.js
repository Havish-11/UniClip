import { db, Timestamp } from "../firebase.js";
import { config } from "../config.js";
import { sessionsCol } from "./sessionService.js";

export function startCleanupJob(hub) {
  const run = async () => {
    try {
      const snap = await sessionsCol()
        .where("expiresAt", "<", Timestamp.now())
        .limit(50)
        .get();

      for (const doc of snap.docs) {
        if (hub.hasRoom(doc.id)) continue;
        await db.recursiveDelete(doc.ref);
      }
    } catch (err) {
      console.error("[cleanup] failed:", err.message);
    }
  };

  const timer = setInterval(run, config.session.cleanupIntervalMs);
  timer.unref();
  return () => clearInterval(timer);
}
