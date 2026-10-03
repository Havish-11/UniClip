export default function Header({onLeave}){
    return(
        <header className="top">
            <h1>UniClip</h1>
            <button onClick={onLeave}>Leave</button>
        </header>
    );
}