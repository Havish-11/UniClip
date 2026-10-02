import {randomInt} from 'node:crypto'; //Generates a cryptographically secure rand int

// No I,L,0,O,1 - easy to read and type on a phone

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function generateCode(length){
    let out = '';
    for(let i=0;i<length;i++) out+=ALPHABET[randomInt(ALPHABET.length)];
    return out;
}

export const normalizeCode = (raw) => String(raw??'').trim().toUpperCase();

export const isValidCode=(code,length) =>
    code.length === length && [...code].every((ch) => ALPHABET.includes(ch));