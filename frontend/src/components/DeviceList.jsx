export default function DeviceList({ devices, selfId }) {
  return (
    <>
      {devices.map((d) => (
        <span key={d.deviceId} className="chip">
          {d.deviceName}{d.deviceId === selfId && ' (you)'}
        </span>
      ))}
    </>
  );
}