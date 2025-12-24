'use client';

import { useState } from 'react';
import { importKey, wrapKey } from '@/lib/crypto';
import type { UserDTO } from '@/types/dto';
import { dialogService } from '@/lib/dialog';
import { useTranslation } from '@/i18n/LanguageContext';

/**
 * useRoomInvite Hook
 *
 * 책임:
 * - 특정 사용자를 방에 초대 (E2EE 방식)
 * - 상대방의 공개키로 현재 방의 Master Key를 래핑하여 서버에 등록
 */
export function useRoomInvite(
  roomId: string,
  currentMasterKey: CryptoKey | null,
) {
  const [isInviting, setIsInviting] = useState(false);
  const { t } = useTranslation();

  const inviteUser = async (targetUser: UserDTO) => {
    if (!currentMasterKey) {
      console.error('[useRoomInvite] currentMasterKey is missing');
      return false;
    }

    if (!targetUser.public_key) {
      dialogService.alert(t.dashboard.alerts.noPublicKey);
      return false;
    }

    setIsInviting(true);
    try {
      // 1. 상대방의 공개키 임포트
      const publicKeyJwk = JSON.parse(targetUser.public_key);
      const targetPublicKey = await importKey(
        publicKeyJwk,
        { name: 'RSA-OAEP', hash: 'SHA-256' },
        ['wrapKey'],
      );

      // 2. 현재 방의 마스터 키를 상대방 공개키로 래핑
      const wrappedKeyForTarget = await wrapKey(
        currentMasterKey,
        targetPublicKey,
      );

      // 3. 서버에 참가자 등록 요청
      const res = await fetch(`/api/rooms/${roomId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: targetUser.username,
          encryptedKey: wrappedKeyForTarget,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to register participant on server');
      }

      dialogService.alert(
        t.dashboard.alerts.inviteSuccess ||
          `Successfully invited ${targetUser.username}`,
      );
      return true;
    } catch (error) {
      console.error('[useRoomInvite] Invite failed:', error);
      dialogService.alert(t.dashboard.alerts.inviteFailed);
      return false;
    } finally {
      setIsInviting(false);
    }
  };

  return {
    inviteUser,
    isInviting,
  };
}
