import { useState, useCallback } from 'react';
import { Friend } from '@/types/friend';

interface UseFriendsReturn {
    friends: Friend[];
    setFriends: React.Dispatch<React.SetStateAction<Friend[]>>;
    fetchFriends: (username: string) => Promise<void>;
    sendFriendRequest: (username: string, targetUsername: string) => Promise<void>;
    handleFriendAction: (friendId: string, action: 'accept' | 'reject' | 'delete') => Promise<void>;
}

export function useFriends(currentUsername: string): UseFriendsReturn {
    const [friends, setFriends] = useState<Friend[]>([]);

    const fetchFriends = useCallback(async (username: string) => {
        try {
            const res = await fetch(`/api/friends?username=${username}`);
            if (res.ok) {
                const data = await res.json();
                setFriends(data.friends || []);
            }
        } catch (error) {
            console.error('Error fetching friends:', error);
        }
    }, []);

    const sendFriendRequest = useCallback(async (username: string, targetUsername: string) => {
        const res = await fetch('/api/friends', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username,
                targetUsername,
            }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to send friend request');

        await fetchFriends(username);
    }, [fetchFriends]);

    const handleFriendAction = useCallback(async (
        friendId: string,
        action: 'accept' | 'reject' | 'delete',
    ) => {
        const method = action === 'delete' ? 'DELETE' : 'PUT';
        const body =
            action !== 'delete'
                ? JSON.stringify({
                    status: action === 'accept' ? 'accepted' : 'rejected',
                })
                : undefined;

        const res = await fetch(`/api/friends/${friendId}`, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body,
        });

        if (!res.ok) throw new Error('Action failed');

        await fetchFriends(currentUsername);
    }, [currentUsername, fetchFriends]);

    return {
        friends,
        setFriends,
        fetchFriends,
        sendFriendRequest,
        handleFriendAction,
    };
}
