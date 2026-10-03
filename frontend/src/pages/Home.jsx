import { useState } from 'react';
import { checkSession, createSession } from '../services/api.js';

export default function Home({ onJoin }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async (fn) => {
    setBusy(true);
    setError('');
    try {
      onJoin(await fn());
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const create = () => run(async () => (await createSession()).code);
  const join = (e) => {
    e.preventDefault(); //stoppping the browser from reloading
    const c = code.trim().toUpperCase();
    run(async () => (await checkSession(c), c));
  };

  return (
    <main className="card narrow">
      <h1>UniClip</h1>
      <p className="muted">Share text and links between your devices. No account needed.</p>

      <button className="primary" onClick={create} disabled={busy}>Start new session</button>
      <div className="divider">or join one</div>

      <form onSubmit={join} className="row">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Pairing code"
          maxLength={6}
          autoCapitalize="characters"
          autoComplete="off"
          className="code-input"
        />
        <button disabled={busy || code.trim().length !== 6}>Join</button>
      </form>

      {error && <p className="error">{error}</p>}
    </main>
  );
}