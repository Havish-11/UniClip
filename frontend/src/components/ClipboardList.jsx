import ClipboardItem from './ClipboardItem.jsx';

export default function ClipboardList({ entries, onRemove, onClear }) {
  return (
    <>
      <div className="top">
        <h2>History</h2>
        {entries.length > 0 && <button className="danger" onClick={onClear}>Clear all</button>}
      </div>
      {entries.length === 0 && <p className="muted">Nothing synced yet.</p>}
      <ul className="list">
        {[...entries].reverse().map((e) => (
          <ClipboardItem key={e.id} entry={e} onRemove={onRemove} />
        ))}
      </ul>
    </>
  );
}