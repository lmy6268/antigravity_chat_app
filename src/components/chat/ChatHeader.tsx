interface ChatHeaderProps {
    roomName: string;
    nickname: string;
    isConnected: boolean;
    onBack: () => void;
    onSettings: () => void;
}

export function ChatHeader({ roomName, nickname, isConnected, onBack, onSettings }: ChatHeaderProps) {
    return (
        <div style={{
            padding: '15px',
            backgroundColor: '#252526',
            borderBottom: '1px solid #3e3e3e',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                    onClick={onBack}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: '#aaa',
                        cursor: 'pointer',
                        fontSize: 'clamp(1.125rem, 4vw, 1.25rem)'
                    }}
                >
                    ←
                </button>
                <h2 style={{
                    margin: 0,
                    fontSize: 'clamp(1rem, 4vw, 1.25rem)',
                    wordBreak: 'break-word'
                }}>
                    {roomName}
                </h2>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span style={{
                    color: isConnected ? '#5cb85c' : '#d9534f',
                    fontSize: '10px'
                }}>
                    ●
                </span>
                <span style={{
                    color: '#aaa',
                    fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)'
                }}>
                    {nickname}
                </span>
                <button
                    onClick={onSettings}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: '#f0f0f0',
                        cursor: 'pointer',
                        fontSize: 'clamp(1.125rem, 4vw, 1.25rem)'
                    }}
                >
                    ⚙️
                </button>
            </div>
        </div>
    );
}
