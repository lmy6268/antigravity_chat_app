import { ChatMessage } from './ChatMessage';
import type { MessageUIModel } from '@/types/uimodel';

interface ChatMessageListProps {
  messages: MessageUIModel[];
  nickname: string;
  roomCreator?: string;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export function ChatMessageList({
  messages,
  nickname,
  roomCreator,
  containerRef,
}: ChatMessageListProps) {
  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      {messages.map((msg) => (
        <ChatMessage key={msg.id} message={msg} nickname={nickname} roomCreator={roomCreator} />
      ))}
    </div>
  );
}
