import { RoomUIModel } from '@/types/uimodel';
import { useTranslation } from '@/i18n/LanguageContext';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import Image from 'next/image';

interface RoomListProps {
  rooms: RoomUIModel[];
  onJoinRoom: (roomId: string, roomName: string) => void;
  onDeleteRoom: (roomId: string) => void;
  onCreateClick: () => void;
  loading?: boolean;
}

/**
 * 상대 시간을 짧은 형식으로 변환 (예: "21분 전" → "21m")
 */
function formatShortTime(relativeTime: string | null | undefined): string {
  if (!relativeTime) return '';

  // "21분 전" → "21m"
  const minutesMatch = relativeTime.match(/(\d+)분 전/);
  if (minutesMatch) {
    return `${minutesMatch[1]}m`;
  }

  // "2시간 전" → "2h"
  const hoursMatch = relativeTime.match(/(\d+)시간 전/);
  if (hoursMatch) {
    return `${hoursMatch[1]}h`;
  }

  // "1일 전" → "1d"
  const daysMatch = relativeTime.match(/(\d+)일 전/);
  if (daysMatch) {
    return `${daysMatch[1]}d`;
  }

  // "방금 전" → "방금"
  if (relativeTime === '방금 전') {
    return '방금';
  }

  // 날짜 형식은 그대로 반환
  return relativeTime;
}

export function RoomList({
  rooms,
  onJoinRoom,
  onDeleteRoom,
  onCreateClick,
  loading,
}: RoomListProps) {
  const { t } = useTranslation();

  return (
    <>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}
      >
        <h2>{t.dashboard.rooms.title}</h2>
        <button
          onClick={onCreateClick}
          style={{
            padding: '10px 20px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: '#28a745',
            color: 'white',
            fontWeight: 'bold',
            cursor: 'pointer',
          }}
        >
          + {t.dashboard.rooms.create}
        </button>
      </div>

      {loading ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '200px',
            backgroundColor: '#252526',
            borderRadius: '8px',
          }}
        >
          <LoadingSpinner size={40} />
        </div>
      ) : rooms.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '40px',
            color: '#aaa',
            backgroundColor: '#252526',
            borderRadius: '8px',
          }}
        >
          {t.dashboard.rooms.noRooms}
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1px',
            backgroundColor: '#3e3e3e',
            borderRadius: '8px',
            overflow: 'hidden',
          }}
        >
          {rooms.map((room) => {
            const shortTime = formatShortTime(room.lastMessageAt);
            return (
              <div
                key={room.id}
                onClick={() => onJoinRoom(room.id, room.name)}
                style={{
                  backgroundColor: '#252526',
                  padding: '16px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#2d2d2d';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#252526';
                }}
              >
                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <h3
                    style={{
                      margin: 0,
                      fontSize: '16px',
                      fontWeight: '500',
                      color: '#f0f0f0',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {room.name}
                  </h3>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '12px',
                      color: '#888',
                    }}
                  >
                    {shortTime && (
                      <>
                        <span style={{ color: '#007acc', fontWeight: '500' }}>
                          {shortTime}
                        </span>
                        <span style={{ color: '#555' }}>|</span>
                      </>
                    )}
                    {typeof room.participantCount === 'number' && (
                      <span>{room.participantCount}명</span>
                    )}
                  </div>
                  {room.lastMessagePreview &&
                    room.lastMessagePreview !== '[encrypted]' && (
                      <div
                        style={{
                          fontSize: '13px',
                          color: '#aaa',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {room.lastMessagePreview}
                      </div>
                    )}
                </div>
                <div
                  style={{
                    marginLeft: '12px',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <Image
                    src="/icons/arrow-right.svg"
                    alt="arrow"
                    width={16}
                    height={16}
                    style={{
                      filter: 'brightness(0) invert(0.6)',
                      opacity: 0.7,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
