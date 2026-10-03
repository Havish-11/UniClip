import {useState} from 'react';
import {writeClipboard} from '../services/clipboard.js';

export default function PairingCode({code}){
    const [copied,setCopied] = useState(false);

    const copyInvite = async() => {
        await writeClipboard(`${location.origin}${location.pathname}#${code}`);
        setCopied(true);
        setTimeout(() => setCopied(false),1500);
    };

    return (
    <div className="top">
      <div>
        <span className="muted">Pairing code</span>
        <div className="code">{code}</div>
      </div>
      <button onClick={copyInvite}>{copied ? 'Copied' : 'Copy invite link'}</button>
    </div>
  );
}