interface ChatInputProps {
    inputMessage: string;
    setInputMessage: (value: string) => void;
    sendMessage: (e: React.FormEvent) => void;
    isConnected: boolean;
}

export function ChatInput({ inputMessage, setInputMessage, sendMessage, isConnected }: ChatInputProps) {
    return (
        <form onSubmit={sendMessage} style={{
            padding: 'clamp(15px, 3vw, 20px)',
            backgroundColor: '#252526',
            display: 'flex',
            gap: '10px',
            flexWrap: 'wrap'
        }}>
            <input
                type="text"
                placeholder="Type a message..."
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
                Send
            </button>
        </form>
    );
}
