import { useEffect, useState } from 'react';
import Home from './pages/Home.jsx';
import Session from './pages/Session.jsx';

// The pairing code lives in the URL hash, so refresh rejoins and links are shareable.
const readCode = () => location.hash.slice(1).toUpperCase();

export default function App() {
  const [code, setCode] = useState(readCode);

  useEffect(() => {
    const onHash = () => setCode(readCode());
    addEventListener('hashchange', onHash);
    return () => removeEventListener('hashchange', onHash);
  }, []);

  const leave = () => {
    history.pushState(null, '', location.pathname);
    setCode('');
  };

  return code ? <Session key={code} code={code} onLeave={leave} /> : <Home onJoin={(c) => (location.hash = c)} />;
}