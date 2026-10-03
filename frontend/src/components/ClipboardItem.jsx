import { useState } from 'react';
import { writeClipboard } from '../services/clipboard.js';

export default function ClipboardItem({ entry, onRemove }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await writeClipboard(entry.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <li>
      <div className="content">
        {entry.kind === 'link'
          ? <a href={entry.content} target="_blank" rel="noopener noreferrer">{entry.content}</a>
          : <span>{entry.content}</span>}
      </div>
      <div className="meta">
        <span className="muted">{entry.deviceName} --- {new Date(entry.createdAt).toLocaleTimeString()}</span>
        <span className="row">
          <button onClick={copy}>{copied ? 'Copied' : 'Copy'}</button>
          <button className="danger" onClick={() => onRemove(entry.id)}>Delete</button>
        </span>
      </div>
    </li>
  );
}