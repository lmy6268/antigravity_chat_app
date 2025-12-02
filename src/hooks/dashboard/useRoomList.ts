import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export interface Room {
  id: string;
  name: string;
  password?: string;
}

export function useRoomList(username: string) {
  const router = useRouter();
  const [myRooms, setMyRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRooms = useCallback(async () => {
    if (!username) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${username}/rooms`);
      if (res.ok) {
        const data = await res.json();
        setMyRooms(data.rooms || []);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const joinRoom = (roomId: string, roomName: string) => {
    router.push(`/chat/${roomId}?name=${encodeURIComponent(roomName)}`);
  };

  return { myRooms, loading, fetchRooms, joinRoom, setMyRooms };
}
