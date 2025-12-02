import { useTranslation } from '@/i18n/LanguageContext';

interface RoomInfo {
    creator: string;
    password: string;
    participants?: string[];
}

interface ChatSettingsProps {
    roomInfo: RoomInfo | null;
    onCopyLink: () => void;
    onLeave: () => void;
}

export function ChatSettings({ roomInfo, onCopyLink, onLeave }: ChatSettingsProps) {
    const { t } = useTranslation();

    return (
        <div style={{
            position: 'absolute',
            top: '60px',
            right: '20px',
            backgroundColor: '#333',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            gap: '15px',
            width: '280px'
        }}>
            <h3 style={{
                margin: '0 0 10px 0',
                borderBottom: '1px solid #555',
                paddingBottom: '10px'
            }}>
                {t.chat.settings}
            </h3>

            {roomInfo && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
                    <div>
                        <strong style={{ color: '#aaa' }}>{t.chat.creator}:</strong>
                        <div style={{ marginTop: '4px' }}>{roomInfo.creator}</div>
                    </div>
                    <div>
                        <strong style={{ color: '#aaa' }}>{t.auth.password}:</strong>
                        <div style={{
                            marginTop: '4px',
                            fontFamily: 'monospace',
                            backgroundColor: '#252526',
                            padding: '6px',
                            borderRadius: '4px'
                        }}>
                            {roomInfo.password}
                        </div>
                    </div>
                    <div>
                        <strong style={{ color: '#aaa' }}>{t.chat.participants}:</strong>
                        <div style={{
                            marginTop: '4px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px'
                        }}>
                            {roomInfo.participants && roomInfo.participants.length > 0 ? (
                                roomInfo.participants.map((participant: string, idx: number) => (
                                    <div
                                        key={idx}
                                        style={{
                                            padding: '4px 8px',
                                            backgroundColor: '#252526',
                                            borderRadius: '4px'
                                        }}
                                    >
                                        {participant}
                                    </div>
                                ))
                            ) : (
                                <div style={{ color: '#888', fontStyle: 'italic' }}>
                                    {t.chat.noParticipants}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <button
                onClick={onCopyLink}
                style={{
                    padding: '8px',
                    borderRadius: '4px',
                    border: 'none',
                    backgroundColor: '#007acc',
                    color: 'white',
                    cursor: 'pointer'
                }}
            >
                {t.chat.copyLink}
            </button>
            <button
                onClick={onLeave}
                style={{
                    padding: '8px',
                    borderRadius: '4px',
                    border: 'none',
                    backgroundColor: '#d9534f',
                    color: 'white',
                    cursor: 'pointer'
                }}
            >
                {t.chat.leave}
            </button>
        </div>
    );
}
