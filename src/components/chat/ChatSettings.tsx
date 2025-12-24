import { useState } from 'react';
import { useTranslation } from '@/i18n/LanguageContext';
import Image from 'next/image';
import { ChatRoomInvite } from './ChatRoomInvite';
import type { UserDTO } from '@/types/dto';

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
  onKick?: (username: string) => Promise<void>;
  refreshRoomInfo?: () => Promise<void>;
}

export function ChatSettings({
  roomInfo,
  onCopyLink,
  onLeave,
  onClose,
  currentUser,
  isConnected,
  isClosing = false,
  onInvite,
  onKick,
  refreshRoomInfo,
}: ChatSettingsProps & { onInvite: (user: UserDTO) => Promise<boolean> }) {
  const { t } = useTranslation();
  const [kickingUser, setKickingUser] = useState<string | null>(null);

  const isCreator = roomInfo?.creator === currentUser;

  const handleKick = async (username: string) => {
    if (!onKick) return;
    if (!confirm(`${username}님을 내보내시겠습니까?`)) return;

    try {
      setKickingUser(username);
      await onKick(username);
      if (refreshRoomInfo) {
        await refreshRoomInfo();
      }
    } catch (error) {
      console.error('Error kicking user:', error);
      alert('사용자를 내보내는 중 오류가 발생했습니다.');
    } finally {
      setKickingUser(null);
    }
  };

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
          <Image
            src="/icons/close.png"
            alt="close"
            width={24}
            height={24}
            style={{ filter: 'brightness(0) invert(1)' }}
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
          {/* Invite Section */}
          <ChatRoomInvite
            onInvite={onInvite}
            currentParticipants={roomInfo.participants || []}
            currentUser={currentUser}
          />

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
                    const isParticipantCreator = participant === roomInfo.creator;
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
                          justifyContent: 'space-between',
                          gap: '6px',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            flex: 1,
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
                            {isParticipantCreator && (
                              <span role="img" aria-label="creator">
                                👑
                              </span>
                            )}
                          </span>
                        </div>
                        {isCreator &&
                          onKick &&
                          !isMe &&
                          !isParticipantCreator && (
                            <button
                              onClick={() => handleKick(participant)}
                              disabled={kickingUser === participant}
                              style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                border: 'none',
                                backgroundColor:
                                  kickingUser === participant
                                    ? '#555'
                                    : '#d9534f',
                                color: 'white',
                                cursor:
                                  kickingUser === participant
                                    ? 'not-allowed'
                                    : 'pointer',
                                fontSize: '11px',
                              }}
                            >
                              {kickingUser === participant ? '내보내는 중...' : '내보내기'}
                            </button>
                          )}
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
