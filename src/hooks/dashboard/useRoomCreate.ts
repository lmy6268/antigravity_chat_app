import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { generateRoomKey, generateSalt, encryptRoomKeyWithPassword } from '@/lib/crypto';
import { routes } from '@/lib/routes';
import { Room } from './useRoomList';
import { useTranslation } from '@/i18n/LanguageContext';

export function useRoomCreate(nickname: string, onRoomCreated: (room: Room) => void) {
  const router = useRouter();
  const { t } = useTranslation();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  const createRoom = async (name: string, password: string) => {
    if (!name || !password) return;
    setIsCreating(true);
    setError('');

    const roomId = crypto.randomUUID();
    
    try {
      // 1. AES 룸 키 생성
      const roomKey = await generateRoomKey();

      // 2. Salt 생성
      const salt = generateSalt();

      // 3. 비밀번호로 룸 키 암호화
      const encryptedKey = await encryptRoomKeyWithPassword(roomKey, password, salt);

      // 4. 서버에 룸 생성 API 호출
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

      if (!res.ok) throw new Error(t.common.failedToCreateRoom);

      const newRoom: Room = {
        id: roomId,
        name: name,
        password: password
      };

      onRoomCreated(newRoom);
      
      // 새 룸으로 이동
      router.push(routes.chat.room(newRoom.id) + `?name=${encodeURIComponent(newRoom.name)}`);
    } catch (error: any) {
      console.error('Error creating room:', error);
      setError(error.message || t.common.failedToCreateRoom);
    } finally {
      setIsCreating(false);
    }
  };

  return { createRoom, isCreating, error };
}
