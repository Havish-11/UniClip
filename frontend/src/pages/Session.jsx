import { useUniClip } from '../hooks/useUniClip.js';
import Header from '../components/Header.jsx';
import PairingCode from '../components/PairingCode.jsx';
import ConnectionStatus from '../components/ConnectionStatus.jsx';
import DeviceList from '../components/DeviceList.jsx';
import ClipboardInput from '../components/ClipboardInput.jsx';
import ClipboardList from '../components/ClipboardList.jsx';

export default function Session({ code, onLeave }) {
  const { status, entries, devices, error, notice, device, add, remove, clear } = useUniClip(code);

  if (status === 'ended') {
    return (
      <main className="card narrow">
        <h1>Session ended</h1>
        <p className="error">{error}</p>
        <button className="primary" onClick={onLeave}>Back</button>
      </main>
    );
  }

  return (
    <main className="card">
      <Header onLeave={onLeave} />
      <PairingCode code={code} />
      <div className="row wrap">
        <ConnectionStatus status={status} />
        <DeviceList devices={devices} selfId={device.id} />
      </div>
      <ClipboardInput connected={status === 'open'} onAdd={add} />
      {notice && <p className="error">{notice}</p>}
      <ClipboardList entries={entries} onRemove={remove} onClear={clear} />
    </main>
  );
}