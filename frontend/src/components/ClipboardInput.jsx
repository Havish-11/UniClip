import { useState } from 'react';
import { readClipboard } from '../services/clipboard.js';

const READ_ERRORS = {
  PERMISSION_DENIED: 'Clipboard permission was denied. Paste into the box below instead.',
  UNSUPPORTED: 'Clipboard reading is unavailable here. Paste into the box below instead.',
};

export default function ClipboardInput({ connected, onAdd }) {
  const [msg, setMsg] = useState('');
  const [manual, setManual] = useState(null); // string = fallback textarea visible

  const sync = async () => {
    try {
      const text = await readClipboard();
      if (!text.trim()) return setMsg('Your clipboard is empty.');
      setMsg(onAdd(text) ? '' : 'Not connected yet.');
    } catch (err) {
      setMsg(READ_ERRORS[err.message] ?? 'Could not read the clipboard. Paste into the box below instead.');
      setManual((m) => m ?? '');
    }
  };

  const submitManual = () => {
    if (manual.trim() && onAdd(manual)) setManual('');
  };

  return (
    <>
      <button className="primary big" onClick={sync} disabled={!connected}>Sync Clipboard</button>
      {msg && <p className="error">{msg}</p>}

      {manual !== null && (
        <div className="manual">
          <textarea
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            placeholder="Paste or type here"
            rows={3}
          />
          <button onClick={submitManual} disabled={!connected || !manual.trim()}>Send</button>
        </div>
      )}
    </>
  );
}