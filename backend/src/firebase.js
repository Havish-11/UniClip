import {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
} from "firebase-admin/app";
import { Timestamp, getFirestore } from "firebase-admin/firestore";
import { config } from "./config.js";

function resolveCredentials() {
  if (config.firebase.serviceAccountJson) {
    return cert(JSON.parse(config.firebase.serviceAccountJson));
  }

  // Uses GOOGLE_APPLICATION_CREDENTIALS or the platform's default identity.
  return applicationDefault();
}

const app =
  getApps()[0] ??
  initializeApp({
    credential: resolveCredentials(),
    projectId: config.firebase.projectId,
  });

export const db = getFirestore(app);
db.settings({ ignoreUndefinedProperties: true });

export { Timestamp };
