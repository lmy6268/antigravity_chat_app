import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { routes } from '@/lib/routes';
import type { RoomUIModel } from '@/types/uimodel';
import { RoomDTO } from '@/types/dto';
import { roomDTOToUIModel } from '@/lib/converters';
import { dialogService } from '@/lib/dialog';
import { useTranslation } from '@/i18n/LanguageContext';
import { STORAGE_KEYS } from '@/lib/constants/storage';
import { clearUserSession, loadUserProfile } from '@/lib/key-storage';

export function useRoomList(username: string) {
  const router = useRouter();
  const { t } = useTranslation();
  const [myRooms, setMyRooms] = useState<RoomUIModel[]>([]);
  const [loading, setLoading] = useState(false);

  // Initialize from Storage
  useEffect(() => {
    // Initial user status is checked via props or subsequent fetch
  }, []);

  const fetchRooms = useCallback(async () => {
    if (!username) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${username}/rooms`);
      if (res.ok) {
        const data = await res.json();
        const roomDTOs: RoomDTO[] = data.rooms || [];

        // Convert DTO to UIModel
        const uiModels = roomDTOs.map((dto) => {
          const uiModel = roomDTOToUIModel(dto, undefined, {
            participantCount: dto.participantCount,
            lastMessageAt: dto.lastMessageAt,
            lastMessagePreview: dto.lastMessagePreview,
          });
          // Manually set isCreator since we only have username here
          uiModel.isCreator = dto.creator_username === username;
          return uiModel;
        });

        setMyRooms(uiModels);
        return;
      }

      if (res.status === 404) {
        const data = await res.json().catch(() => ({}));
        // 사용자 없을 때만 세션 정리, 방이 없을 때는 빈 배열로 처리
        if (data?.error === 'User not found') {
          console.warn('User not found in DB. Clearing stale session.');
          await clearUserSession();
          dialogService.alert(t.common.sessionExpired);
          router.push(routes.auth.login());
          return;
        }

        // 기타 404는 빈 목록으로 취급
        setMyRooms([]);
        return;
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  }, [username, router, t]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const joinRoom = (roomId: string) => {
    router.push(routes.chat.room(roomId));
  };

  const deleteRoom = useCallback(
    async (roomId: string) => {
      if (!dialogService.confirm(t.dashboard.rooms.deleteConfirm)) return;

      try {
        const user = await loadUserProfile();
        if (!user) return;

        const res = await fetch(`/api/rooms/${roomId}`, {
          method: 'DELETE',
          headers: {
            'x-user-id': user.id,
          },
        });

        if (res.ok) {
          setMyRooms((prev) => prev.filter((room) => room.id !== roomId));
        } else {
          const data = await res.json();
          dialogService.alert(data.error || t.common.error);
        }
      } catch (error) {
        console.error('Error deleting room:', error);
        dialogService.alert(t.common.error);
      }
    },
    [t],
  );

  return { myRooms, loading, fetchRooms, joinRoom, deleteRoom, setMyRooms };
}
