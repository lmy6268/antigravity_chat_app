import { ChatMessage } from './ChatMessage';

interface Message {
    sender: string;
    text: string;
    isSystem?: boolean;
}

interface ChatMessageListProps {
    messages: Message[];
    nickname: string;
    roomCreator?: string;
    containerRef: React.RefObject<HTMLDivElement | null>;
}

export function ChatMessageList({ messages, nickname, roomCreator, containerRef }: ChatMessageListProps) {
    return (
        <div
            ref={containerRef}
            style={{
                flex: 1,
                overflowY: 'auto',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
            }}
        >
            {messages.map((msg, index) => (
                <ChatMessage
                    key={index}
                    message={msg}
                    nickname={nickname}
                    roomCreator={roomCreator}
                />
            ))}
        </div>
    );
}
