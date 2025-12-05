import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { routes } from '@/lib/routes';
import type { RoomUIModel } from '@/types/uimodel';
import type { RoomDTO } from '@/types/dto';
import { roomDTOToUIModel } from '@/lib/converters';

import { useTranslation } from '@/i18n/LanguageContext';
import { STORAGE_KEYS } from '@/lib/storage-constants';

export function useRoomList(username: string) {
  const router = useRouter();
  const { t } = useTranslation();
  const [myRooms, setMyRooms] = useState<RoomUIModel[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRooms = useCallback(async () => {
    if (!username) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${username}/rooms`);
      if (res.ok) {
        const data = await res.json();
        const roomDTOs: RoomDTO[] = data.rooms || [];
        
        // Convert DTO to UIModel
        const uiModels = roomDTOs.map(dto => {
          const uiModel = roomDTOToUIModel(dto);
          // Manually set isCreator since we only have username here
          uiModel.isCreator = dto.creator_username === username;
          return uiModel;
        });
        
        setMyRooms(uiModels);
      } else if (res.status === 404) {
        // User not found (Stale Session)
        console.warn('User not found in DB. Clearing stale session.');
        localStorage.removeItem(STORAGE_KEYS.USER);
        alert(t.common.sessionExpired); // Using native alert here as dialogService might not be available or needed for this critical path
        router.push(routes.auth.login());
        return;
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  }, [username, router]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const joinRoom = (roomId: string) => {
    router.push(routes.chat.room(roomId));
  };

  const deleteRoom = async (roomId: string) => {
    if (!confirm(t.dashboard.rooms.deleteConfirm)) return;

    try {
      const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
      if (!storedUser) return;
      
      const user = JSON.parse(storedUser);
      
      const res = await fetch(`/api/rooms/${roomId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': user.id
        }
      });

      if (res.ok) {
        setMyRooms(prev => prev.filter(room => room.id !== roomId));
      } else {
        const data = await res.json();
        alert(data.error || t.common.error);
      }
    } catch (error) {
      console.error('Error deleting room:', error);
      alert(t.common.error);
    }
  };

  return { myRooms, loading, fetchRooms, joinRoom, deleteRoom, setMyRooms };
}
