import { Friend } from '@/types/friend';
import { useTranslation } from '@/i18n/LanguageContext';

interface FriendRequestsListProps {
  requests: Friend[];
  onAccept: (friendId: string) => Promise<void>;
  onReject: (friendId: string) => Promise<void>;
  onCancel: (friendId: string) => Promise<void>;
}

export function FriendRequestsList({
  requests,
  onAccept,
  onReject,
  onCancel,
}: FriendRequestsListProps) {
  const { t } = useTranslation();

  const pendingRequests = requests.filter((f) => f.status === 'pending');

  return (
    <div>
      <h3>{t.dashboard.friends.requestsTitle}</h3>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        {pendingRequests.map((friend) => (
          <div
            key={friend.id}
            style={{
              padding: '15px',
              backgroundColor: '#252526',
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span>{friend.username}</span>
              <span style={{ fontSize: '12px', color: '#aaa' }}>
                {friend.isSender
                  ? t.dashboard.friends.sent
                  : t.dashboard.friends.received}
              </span>
            </div>
            {!friend.isSender && (
              <div style={{ display: 'flex', gap: '5px' }}>
                <button
                  onClick={() => onAccept(friend.id)}
                  style={{
                    flex: 1,
                    padding: '5px',
                    borderRadius: '4px',
                    border: 'none',
                    backgroundColor: '#28a745',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  {t.dashboard.friends.accept}
                </button>
                <button
                  onClick={() => onReject(friend.id)}
                  style={{
                    flex: 1,
                    padding: '5px',
                    borderRadius: '4px',
                    border: 'none',
                    backgroundColor: '#d9534f',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  {t.dashboard.friends.reject}
                </button>
              </div>
            )}
            {friend.isSender && (
              <button
                onClick={() => onCancel(friend.id)}
                style={{
                  width: '100%',
                  padding: '5px',
                  borderRadius: '4px',
                  border: 'none',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                {t.dashboard.friends.cancel}
              </button>
            )}
          </div>
        ))}
        {pendingRequests.length === 0 && (
          <div style={{ color: '#aaa', fontStyle: 'italic' }}>
            {t.dashboard.friends.noRequests}
          </div>
        )}
      </div>
    </div>
  );
}
