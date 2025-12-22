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
  onClose: () => void;
  currentUser: string;
  isConnected: boolean;
  isClosing?: boolean;
}

export function ChatSettings({
  roomInfo,
  onCopyLink,
  onLeave,
  onClose,
  currentUser,
  isConnected,
  isClosing = false,
}: ChatSettingsProps) {
  const { t } = useTranslation();

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        height: '100vh',
        width: '320px',
        backgroundColor: '#333',
        padding: '20px',
        boxShadow: '-4px 0 16px rgba(0,0,0,0.6)',
        zIndex: 120,
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
        overflowY: 'auto',
        transform: isClosing ? 'translateX(100%)' : 'translateX(0)',
        opacity: isClosing ? 0 : 1,
        transition: 'transform 200ms ease, opacity 200ms ease',
        willChange: 'transform, opacity',
      }}
    >
      <h3
        style={{
          margin: '0 0 10px 0',
          borderBottom: '1px solid #555',
          paddingBottom: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {t.chat.settings}
        <button
          onClick={onClose}
          aria-label="Close settings"
          style={{
            background: 'transparent',
            border: 'none',
            color: '#bbb',
            cursor: 'pointer',
            width: 32,
            height: 32,
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <img
            src="/icons/close.png"
            alt="close"
            style={{ width: 24, height: 24, filter: 'brightness(0) invert(1)' }}
          />
        </button>
      </h3>

      {roomInfo && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            fontSize: '14px',
          }}
        >
          <div>
            <strong style={{ color: '#aaa' }}>{t.chat.participants}:</strong>
            <div
              style={{
                marginTop: '4px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              {roomInfo.participants && roomInfo.participants.length > 0 ? (
                roomInfo.participants.map(
                  (participant: string, idx: number) => {
                    const isCreator = participant === roomInfo.creator;
                    const isMe = participant === currentUser;
                    const dotColor = isMe && isConnected ? '#5cb85c' : '#888';
                    return (
                      <div
                        key={idx}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#252526',
                          borderRadius: '4px',
                          fontWeight: 'normal',
                          color: '#f0f0f0',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <span
                          style={{
                            display: 'inline-block',
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: dotColor,
                          }}
                        />
                        <span
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          {participant}
                          {isCreator && (
                            <span role="img" aria-label="creator">
                              👑
                            </span>
                          )}
                        </span>
                      </div>
                    );
                  },
                )
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
        onClick={onLeave}
        style={{
          padding: '8px',
          borderRadius: '4px',
          border: 'none',
          backgroundColor: '#d9534f',
          color: 'white',
          cursor: 'pointer',
        }}
      >
        {t.chat.leave}
      </button>
    </div>
  );
}
