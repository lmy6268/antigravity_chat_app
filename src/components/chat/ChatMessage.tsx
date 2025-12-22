import type { MessageUIModel } from '@/types/uimodel';

interface ChatMessageProps {
  message: MessageUIModel;
  nickname: string;
  roomCreator?: string;
}

export function ChatMessage({
  message,
  nickname,
  roomCreator,
}: ChatMessageProps) {
  // isMine is available in MessageUIModel, but fallback to comparison just in case
  const isMe = message.isMine ?? message.sender === nickname;
  const isSystem = message.isSystem;

  if (isSystem) {
    return (
      <div
        style={{
          alignSelf: 'center',
          backgroundColor: '#333',
          padding: '4px 12px',
          borderRadius: '12px',
          fontSize: '12px',
          color: '#aaa',
        }}
      >
        {message.text}
      </div>
    );
  }

  return (
    <div
      style={{
        alignSelf: isMe ? 'flex-end' : 'flex-start',
        maxWidth: '70%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: isMe ? 'flex-end' : 'flex-start',
      }}
    >
      {!isMe && (
        <span
          style={{
            fontSize: '12px',
            color: '#aaa',
            marginBottom: '4px',
            marginLeft: '4px',
          }}
        >
          {message.sender}
          {roomCreator && message.sender === roomCreator && (
            <span
              style={{
                color: '#ffd700',
                marginLeft: '6px',
                fontWeight: 'bold',
              }}
            >
              (Creator)
            </span>
          )}
        </span>
      )}
      <div
        style={{
          backgroundColor: isMe ? '#007acc' : '#2d2d2d',
          padding: '10px 15px',
          borderRadius: '12px',
          borderTopRightRadius: isMe ? '2px' : '12px',
          borderTopLeftRadius: isMe ? '12px' : '2px',
          color: 'white',
          wordBreak: 'break-word',
          whiteSpace: 'pre-wrap',
          position: 'relative',
        }}
      >
        {message.text}
        {message.timestamp && (
          <div
            style={{
              fontSize: '10px',
              color: 'rgba(255,255,255,0.6)',
              marginTop: '4px',
              textAlign: 'right',
            }}
          >
            {message.timestamp}
          </div>
        )}
      </div>
    </div>
  );
}
