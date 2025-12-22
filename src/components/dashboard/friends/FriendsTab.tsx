import { Friend } from '@/types/friend';
import { AddFriendForm } from './AddFriendForm';
import { FriendsList } from './FriendsList';
import { FriendRequestsList } from './FriendRequestsList';

interface FriendsTabProps {
    friends: Friend[];
    onSendRequest: (targetUsername: string) => Promise<void>;
    onAccept: (friendId: string) => Promise<void>;
    onReject: (friendId: string) => Promise<void>;
    onRemove: (friendId: string) => Promise<void>;
    onCancel: (friendId: string) => Promise<void>;
}

export function FriendsTab({
    friends,
    onSendRequest,
    onAccept,
    onReject,
    onRemove,
    onCancel,
}: FriendsTabProps) {
    return (
        <>
            <AddFriendForm onSubmit={onSendRequest} />
            <div
                style={{
                    display: 'grid',
                    gap: '20px',
                    gridTemplateColumns: '1fr 1fr',
                }}
            >
                <FriendsList friends={friends} onRemove={onRemove} />
                <FriendRequestsList
                    requests={friends}
                    onAccept={onAccept}
                    onReject={onReject}
                    onCancel={onCancel}
                />
            </div>
        </>
    );
}
