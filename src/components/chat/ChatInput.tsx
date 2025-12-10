import { useTranslation } from '@/i18n/LanguageContext';

interface ChatInputProps {
  inputMessage: string;
  setInputMessage: (value: string) => void;
  sendMessage: (e: React.FormEvent) => void;
  isConnected: boolean;
}

export function ChatInput({
  inputMessage,
  setInputMessage,
  sendMessage,
  isConnected,
}: ChatInputProps) {
  const { t } = useTranslation();

  return (
    <>
      <style jsx>{`
        @media (max-width: 600px) {
          .chat-form {
            flex-direction: column !important;
            gap: 8px !important;
          }
          .chat-input,
          .chat-button {
            width: 100% !important;
            flex: none !important;
            box-sizing: border-box !important;
          }
        }
      `}</style>
      <form
        className="chat-form"
        onSubmit={sendMessage}
        style={{
          padding: 'clamp(15px, 3vw, 20px)',
          width: '100%',
          boxSizing: 'border-box',
          backgroundColor: '#252526',
          display: 'flex',
          gap: '10px',
          flexWrap: 'wrap',
          WebkitTextSizeAdjust: '100%',
        }}
      >
        <input
          className="chat-input"
          type="text"
          placeholder={t.chat.placeholder}
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          disabled={!isConnected}
          style={{
            flex: '1 1 200px',
            width: '100%',
            maxWidth: '100%',
            padding: '12px',
            borderRadius: '6px',
            border: '1px solid #3e3e3e',
            backgroundColor: '#1e1e1e',
            color: 'white',
            fontSize: '16px', // iOS 줌 방지
            minWidth: '0',
            boxSizing: 'border-box',
            opacity: isConnected ? 1 : 0.5,
          }}
        />
        <button
          className="chat-button"
          type="submit"
          disabled={!isConnected}
          style={{
            padding: '12px 24px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: isConnected ? '#007acc' : '#555',
            color: 'white',
            fontWeight: 'bold',
            cursor: isConnected ? 'pointer' : 'not-allowed',
            fontSize: '16px', // iOS 줌 방지
            opacity: isConnected ? 1 : 0.6,
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box',
          }}
        >
          {t.chat.send}
        </button>
      </form>
    </>
  );
}
