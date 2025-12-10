import { RoomUIModel } from '@/types/uimodel';
import { useTranslation } from '@/i18n/LanguageContext';

interface RoomListProps {
  rooms: RoomUIModel[];
  onJoinRoom: (roomId: string, roomName: string) => void;
  onDeleteRoom: (roomId: string) => void;
  onCreateClick: () => void;
}

export function RoomList({ rooms, onJoinRoom, onDeleteRoom, onCreateClick }: RoomListProps) {
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

      {rooms.length === 0 ? (
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
            display: 'grid',
            gap: '15px',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
          }}
        >
          {rooms.map((room) => (
            <div
              key={room.id}
              onClick={() => onJoinRoom(room.id, room.name)}
              style={{
                backgroundColor: '#252526',
                padding: '20px',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                border: '1px solid #3e3e3e',
                position: 'relative',
              }}
            >
              <h3 style={{ margin: '0 0 8px 0' }}>
                {room.name}
                {typeof room.participantCount === 'number' && (
                  <span style={{ color: '#aaa', fontSize: '12px', marginLeft: '8px' }}>
                    ({room.participantCount}명)
                  </span>
                )}
              </h3>
              <div style={{ fontSize: '12px', color: '#bbb', marginTop: '4px' }}>
                최근 메시지 : {room.lastMessageAt ? room.lastMessageAt : '-'}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
