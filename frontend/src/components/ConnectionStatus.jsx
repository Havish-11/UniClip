const LABELS = {open: 'Connected', connecting: 'Connecting...', reconnecting: "Reconnecting..."};

export default function ConnectionStatus({status}){
    return <span className = {`badge ${status}`}>{LABELS[status] ?? status}</span>;
}