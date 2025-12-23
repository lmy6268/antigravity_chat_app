import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  generateRoomKey,
  generateSalt,
  encryptRoomKeyWithPassword,
  wrapKey,
  importKey,
} from '@/lib/crypto';
import { routes } from '@/lib/routes';
import { useTranslation } from '@/i18n/LanguageContext';
import { loadUserProfile } from '@/lib/key-storage';
import { STORAGE_KEYS } from '@/lib/constants/storage';
import type { RoomUIModel } from '@/types/uimodel';

export function useRoomCreate(
  nickname: string,
  onRoomCreated: (room: RoomUIModel) => void,
) {
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
      const encryptedKey = await encryptRoomKeyWithPassword(
        roomKey,
        password,
        salt,
      );

      // 3.1 자신의 Identity Public Key로 마스터 키를 다시 래핑 (E2EE)
      const user = await loadUserProfile();
      if (!user) throw new Error('User session not found');

      if (!user.public_key) throw new Error('Identity public key missing');

      const publicKeyJwk = JSON.parse(user.public_key);
      const identityPublicKey = await importKey(
        publicKeyJwk,
        { name: 'RSA-OAEP', hash: 'SHA-256' },
        ['wrapKey'],
      );

      const wrappedKeyForMe = await wrapKey(roomKey, identityPublicKey);

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
          encrypted_key: encryptedKey,
          participantEncryptedKey: wrappedKeyForMe,
        }),
      });

      if (!res.ok) throw new Error(t.common.failedToCreateRoom);

      const newRoom: RoomUIModel = {
        id: roomId,
        name: name,
        creatorName: nickname,
        createdAt: new Date().toLocaleString(),
        isCreator: true,
      };

      onRoomCreated(newRoom);

      // 성공 시 해당 방으로 이동 (이름 파라미터 제거)
      router.push(routes.chat.room(newRoom.id));
    } catch (error: unknown) {
      console.error('Error creating room:', error);
      const errorMessage =
        error instanceof Error ? error.message : t.common.failedToCreateRoom;
      setError(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  return { createRoom, isCreating, error };
}
