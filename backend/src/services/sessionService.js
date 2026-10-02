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
            await sessionsCol().doc(code).create({
                createdAt: Timestamp.fromMillis(now),
                expiredAt: Timestamp.fromMillis(now+ttlMs),
                seq: 0,
            });

        }
    }
}