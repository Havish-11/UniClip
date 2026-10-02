import {db,Timestamp} from '../firebase.js';
import {config} from '../config.js';
import {sessionsCol} from './sessionService.js';
import {detectKind} from '../utils/link.js';
import {Errors} from '../utils/errors.js';

const entriesCol= (code) => sessionsCol().doc(code).collection('entries');

const toEntry=(snap)=>{
    const d = snap.data();
    return{
        id: d.id,
        content: d.content,
        kind: d.kind,
        deviceId: d.deviceId,
        deviceName: d.deviceName,
        seq: d.seq,
        createdAt: d.createdAt.toMillis(),
    };
};


export async function addEntry(code, {id, content, deviceId, deviceName }){
    const sessionRef = sessionsCol().doc(code);
    const entryRef = entriesCol(code).doc(id);
    const latestQuery = entriesCol(code).orderBy('seq', 'desc').limit(1);

    return db.runTransaction(async (tx) => {
        const [sessionSnap, entrySnap, latestSnap] = await Promise.all([
        tx.get(sessionRef),
        tx.get(entryRef),
        tx.get(latestQuery),
        ]);

        if (!sessionSnap.exists) throw Errors.sessionNotFound();
        if (entrySnap.exists) return { entry: toEntry(entrySnap), created: false };
        if (!latestSnap.empty && latestSnap.docs[0].get('content') === content) {
        return { entry: toEntry(latestSnap.docs[0]), created: false };
        }

        const now = Date.now();
        const seq = (sessionSnap.get('seq') ?? 0) + 1;
        const data = {
        id,
        content,
        kind: detectKind(content),
        deviceId,
        deviceName,
        seq,
        createdAt: Timestamp.fromMillis(now),
        };

        tx.set(entryRef, data);
        tx.update(sessionRef, {
        seq,
        expiresAt: Timestamp.fromMillis(now + config.session.ttlMs),
        });

        return { entry: { ...data, createdAt: now }, created: true };
    });
}

export async function listEntries(code, limit = config.clipboard.historyLimit) {  //used to get the most recent clipboard messages
  const snap = await entriesCol(code).orderBy('seq', 'desc').limit(limit).get();
  return snap.docs.map(toEntry).reverse();
}

export async function deleteEntry(code, id) {
  await entriesCol(code).doc(id).delete();
}

export async function clearEntries(code) {
  await db.recursiveDelete(entriesCol(code));

}

