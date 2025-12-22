import { Friend } from '@/types/friend';
import { useTranslation } from '@/i18n/LanguageContext';

interface FriendsListProps {
    friends: Friend[];
    onRemove: (friendId: string) => Promise<void>;
}

export function FriendsList({ friends, onRemove }: FriendsListProps) {
    const { t } = useTranslation();

    const acceptedFriends = friends.filter((f) => f.status === 'accepted');

    return (
        <div>
            <h3>{t.dashboard.friends.listTitle}</h3>
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                }}
            >
                {acceptedFriends.map((friend) => (
                    <div
                        key={friend.id}
                        style={{
                            padding: '15px',
                            backgroundColor: '#252526',
                            borderRadius: '8px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '10px',
                        }}
                    >
                        <span style={{ fontSize: 'clamp(0.875rem, 3vw, 1rem)' }}>
                            {friend.username}
                        </span>
                        <button
                            onClick={() => onRemove(friend.id)}
                            style={{
                                padding: '5px 10px',
                                borderRadius: '4px',
                                border: 'none',
                                backgroundColor: '#d9534f',
                                color: 'white',
                                cursor: 'pointer',
                                fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)',
                            }}
                        >
                            {t.dashboard.friends.remove}
                        </button>
                    </div>
                ))}
                {acceptedFriends.length === 0 && (
                    <div
                        style={{
                            color: '#aaa',
                            fontStyle: 'italic',
                            fontSize: 'clamp(0.875rem, 3vw, 1rem)',
                        }}
                    >
                        {t.dashboard.friends.noFriends}
                    </div>
                )}
            </div>
        </div>
    );
}
