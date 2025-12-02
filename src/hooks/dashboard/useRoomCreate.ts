import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { generateRoomKey, generateSalt, encryptRoomKeyWithPassword } from '@/lib/crypto';
import { Room } from './useRoomList';

export function useRoomCreate(nickname: string, onRoomCreated: (room: Room) => void) {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  const createRoom = async (name: string, password: string) => {
    if (!name || !password) return;
    setIsCreating(true);
    setError('');

    const roomId = crypto.randomUUID();
    
    try {
      // 1. Generate AES Room Key
      const roomKey = await generateRoomKey();

      // 2. Generate Salt
      const salt = generateSalt();

      // 3. Encrypt Room Key with Password
      const encryptedKey = await encryptRoomKeyWithPassword(roomKey, password, salt);

      // 4. Call API to create room on server
      const res = await fetch('/api/rooms/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: roomId,
          name: name,
          password: password,
          creator: nickname,
          salt: salt,
          encryptedKey: encryptedKey
        })
      });

      if (!res.ok) throw new Error('Failed to create room');

      const newRoom: Room = {
        id: roomId,
        name: name,
        password: password
      };

      onRoomCreated(newRoom);
      
      // Navigate to the new room
      router.push(`/chat/${newRoom.id}?name=${encodeURIComponent(newRoom.name)}`);
    } catch (error: any) {
      console.error('Error creating room:', error);
      setError(error.message || 'Failed to create room');
    } finally {
      setIsCreating(false);
    }
  };

  return { createRoom, isCreating, error };
}
