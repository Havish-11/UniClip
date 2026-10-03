import {db,Timestamp} from '../firebase.js';
import {config} from '../config.js';
import {generateCode, isValidCode, normalizeCode} from '../utils/code.js';

export const sessionsCol = () => db.collection('sessions');

const ALREADY_EXISTS = 6;  // gRPC status code

export async function createSession(){
    const {ttlMs, codeLength} = config.session;

    for(let attempt=0; attempt<5; attempt++){  // there might be a possibility that two sessions generate the same random code
        const code = generateCode(codeLength);
        const now = Date.now();

        try{
            await sessionsCol().doc(code).create({ //creates a new session
                createdAt: Timestamp.fromMillis(now),
                expiresAt: Timestamp.fromMillis(now+ttlMs),
                seq: 0,
            });

            return {code, expiresAt: now + ttlMs};
        }catch (err){
            if(err.code===ALREADY_EXISTS) continue;
            throw err;
        }
    }

    throw new Error('Could not allocate a pairing code');
}

// allow expired is used for sessions which are still active
export async function getActiveSession(rawCode, {allowExpired = false}={}){
    const code = normalizeCode(rawCode);
    if(!isValidCode(code, config.session.codeLength)) return null;

    const snap = await sessionsCol().doc(code).get();
    if(!snap.exists) return null;

    const expiresAt = snap.get('expiresAt').toMillis();
    if(!allowExpired && expiresAt <= Date.now()) return null;
    return { code, expiresAt };
}

export async function touchSession(code) {
  const expiresAt = Date.now() + config.session.ttlMs;
  await sessionsCol().doc(code).update({ expiresAt: Timestamp.fromMillis(expiresAt) });
  return expiresAt;
}