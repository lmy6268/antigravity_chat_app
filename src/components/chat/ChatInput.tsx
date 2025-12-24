import { useRef, useEffect } from 'react';
import { useTranslation } from '@/i18n/LanguageContext';

interface ChatInputProps {
  inputMessage: string;
  setInputMessage: (value: string) => void;
  sendMessage: (e?: React.FormEvent) => void;
  isConnected: boolean;
}

export function ChatInput({
  inputMessage,
  setInputMessage,
  sendMessage,
  isConnected,
}: ChatInputProps) {
  const { t } = useTranslation();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 자동 높이 조절 로직
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (inputMessage.trim()) {
        sendMessage();
      }
    }
  };

  return (
    <>
      <style jsx>{`
        /* 모바일 최적화 */
        @media (max-width: 600px) {
          .chat-form {
            padding: 10px !important;
          }
        }
      `}</style>
      <form
        className="chat-form"
        onSubmit={sendMessage}
        style={{
          padding: '20px',
          width: '100%',
          boxSizing: 'border-box',
          backgroundColor: '#252526',
          borderTop: '1px solid #3e3e3e',
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-end',
        }}
      >
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#1e1e1e',
            border: '1px solid #3e3e3e',
            borderRadius: '24px',
            padding: '8px 16px',
            transition: 'border-color 0.2s',
            minHeight: '44px',
            boxSizing: 'border-box',
          }}
        >
          <textarea
            ref={textareaRef}
            className="chat-input"
            placeholder={t.chat.placeholder}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!isConnected}
            rows={1}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: 'white',
              fontSize: '15px',
              padding: '2px 0',
              outline: 'none',
              minWidth: 0,
              resize: 'none',
              lineHeight: '1.5',
              height: 'auto',
              maxHeight: '20vh', // 최대 화면 높이의 20%까지 확장
              fontFamily: 'inherit',
              overflowY: 'auto',
            }}
          />
        </div>
        <button
          className="chat-button"
          type="submit"
          disabled={!isConnected || !inputMessage.trim()}
          style={{
            background:
              isConnected && inputMessage.trim() ? '#007acc' : '#3e3e3e',
            border: 'none',
            color: 'white',
            cursor: isConnected && inputMessage.trim() ? 'pointer' : 'default',
            padding: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
            borderRadius: '50%',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            flexShrink: 0,
            opacity: isConnected && inputMessage.trim() ? 1 : 0.5,
            marginBottom: '2px',
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ marginLeft: '-2px' }}
          >
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </form>
    </>
  );
}
