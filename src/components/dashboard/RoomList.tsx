import { Room } from '@/hooks/dashboard/useRoomList';
import { useTranslation } from '@/i18n/LanguageContext';

interface RoomListProps {
    rooms: Room[];
    onJoinRoom: (roomId: string, roomName: string) => void;
    onCreateClick: () => void;
}

export function RoomList({ rooms, onJoinRoom, onCreateClick }: RoomListProps) {
    const { t } = useTranslation();

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2>{t('dashboard.rooms.title')}</h2>
                <button onClick={onCreateClick} style={{
                    padding: '10px 20px', borderRadius: '6px', border: 'none',
                    backgroundColor: '#28a745', color: 'white', fontWeight: 'bold', cursor: 'pointer'
                }}>
                    + {t('dashboard.rooms.create')}
                </button>
            </div>

            {rooms.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#aaa', backgroundColor: '#252526', borderRadius: '8px' }}>
                    {t('dashboard.rooms.noRooms')}
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '15px', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>
                    {rooms.map((room) => (
                        <div key={room.id} onClick={() => onJoinRoom(room.id, room.name)} style={{
                            backgroundColor: '#252526', padding: '20px', borderRadius: '8px',
                            cursor: 'pointer', transition: 'transform 0.2s', border: '1px solid #3e3e3e'
                        }}>
                            <h3 style={{ margin: '0 0 10px 0' }}>{room.name}</h3>
                            <div style={{ fontSize: '12px', color: '#aaa' }}>{t('dashboard.rooms.id')}: {room.id.slice(0, 8)}...</div>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
}
