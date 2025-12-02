interface Message {
    sender: string;
    text: string;
    isSystem?: boolean;
}

interface ChatMessageProps {
    message: Message;
    nickname: string;
    roomCreator?: string;
}

export function ChatMessage({ message, nickname, roomCreator }: ChatMessageProps) {
    const isMe = message.sender === nickname;
    const isSystem = message.isSystem;

    if (isSystem) {
        return (
            <div style={{
                alignSelf: 'center',
                backgroundColor: '#333',
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '12px',
                color: '#aaa'
            }}>
                {message.text}
            </div>
        );
    }

    return (
        <div style={{
            alignSelf: isMe ? 'flex-end' : 'flex-start',
            maxWidth: '70%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: isMe ? 'flex-end' : 'flex-start'
        }}>
            <span style={{ fontSize: '12px', color: '#aaa', marginBottom: '4px', marginLeft: '4px' }}>
                {message.sender}
                {roomCreator && message.sender === roomCreator && (
                    <span style={{ color: '#ffd700', marginLeft: '6px', fontWeight: 'bold' }}>(Creator)</span>
                )}
            </span>
            <div style={{
                backgroundColor: isMe ? '#007acc' : '#2d2d2d',
                padding: '10px 15px',
                borderRadius: '12px',
                borderTopRightRadius: isMe ? '2px' : '12px',
                borderTopLeftRadius: isMe ? '12px' : '2px',
                color: 'white',
                wordBreak: 'break-word'
            }}>
                {message.text}
            </div>
        </div>
    );
}
