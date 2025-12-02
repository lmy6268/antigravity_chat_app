import { useTranslation } from '@/i18n/LanguageContext';

interface ChatInputProps {
    inputMessage: string;
    setInputMessage: (value: string) => void;
    sendMessage: (e: React.FormEvent) => void;
    isConnected: boolean;
}

export function ChatInput({ inputMessage, setInputMessage, sendMessage, isConnected }: ChatInputProps) {
    const { t } = useTranslation();

    return (
        <>
            <style jsx>{`
                @media (max-width: 600px) {
                    .chat-form {
                        flex-direction: column !important;
                    }
                    .chat-input, .chat-button {
                        width: 100% !important;
                        flex: none !important;
                    }
                }
            `}</style>
            <form className="chat-form" onSubmit={sendMessage} style={{
                padding: 'clamp(15px, 3vw, 20px)',
                backgroundColor: '#252526',
                display: 'flex',
                gap: '10px',
                flexWrap: 'wrap'
            }}>
                <input
                    className="chat-input"
                    type="text"
                    placeholder={t.chat.placeholder}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    disabled={!isConnected}
                    style={{
                        flex: '1 1 200px',
                        padding: '12px',
                        borderRadius: '6px',
                        border: '1px solid #3e3e3e',
                        backgroundColor: '#1e1e1e',
                        color: 'white',
                        fontSize: 'clamp(0.875rem, 3vw, 1rem)',
                        minWidth: '0',
                        opacity: isConnected ? 1 : 0.5
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
                        fontSize: 'clamp(0.875rem, 3vw, 1rem)',
                        opacity: isConnected ? 1 : 0.6
                    }}
                >
                    {t.chat.send}
                </button>
            </form>
        </>
    );
}
