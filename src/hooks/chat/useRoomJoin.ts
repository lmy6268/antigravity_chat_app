'use client';

import { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  decryptRoomKeyWithPassword,
  decryptRoomPassword,
  unwrapKey,
  wrapKey,
  importKey,
} from '@/lib/crypto';
import { loadPrivateKey, loadUserProfile } from '@/lib/key-storage';
import { routes } from '@/lib/routes';

import { useTranslation } from '@/i18n/LanguageContext';
import { STORAGE_KEYS } from '@/lib/constants/storage';
import { dialogService } from '@/lib/dialog';
import type { RoomDTO, UserDTO } from '@/types/dto';

/**
 * useRoomJoin Hook (ViewModel)
 *
 * 책임:
 * - 룸 참여 로직 처리
 * - 비밀번호 입력 관리
 * - 룸 키 복호화 처리
 * - API에서 룸 정보 가져오기
 * - 권한 있는 사용자 자동 입장 (비밀번호 화면 스킵)
 */
export function useRoomJoin(roomId: string, roomName: string) {
  const router = useRouter();
  const { t } = useTranslation();

  const [user, setUser] = useState<UserDTO | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // 로딩 중에는 화면 안 보임
  const [roomInfo, setRoomInfo] = useState<any>(null);
  const [cryptoKey, setCryptoKey] = useState<CryptoKey | null>(null);
  const [error, setError] = useState('');

  const autoJoinAttemptedRef = useRef(false);
  const debugTrace = useRef<string[]>([]);
  const addTrace = (msg: string) => debugTrace.current.push(msg);

  // Load User from Storage
  useEffect(() => {
    const loadUser = async () => {
      const storedUser = await loadUserProfile();
      if (!storedUser) {
        console.warn(
          '[useRoomJoin] No user session found. Redirecting to login.',
        );
        const returnUrl = encodeURIComponent(routes.chat.room(roomId));
        router.push(routes.auth.login() + `?redirect=${returnUrl}`);
        return;
      }
      setUser(storedUser);
    };
    loadUser();
  }, [router, roomId]);

  const nickname = user?.username || '';
  const userId = user?.id || '';

  // API에서 룸 정보 가져오기
  useEffect(() => {
    const fetchRoomInfo = async () => {
      if (!userId) return; // Wait for userId to be loaded

      try {
        const res = await fetch(`/api/rooms/${roomId}`, {
          headers: {
            'x-user-id': userId,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setRoomInfo(data.room);
        } else if (res.status === 404) {
          dialogService.alert(
            t.dashboard.alerts.roomDeleted || t.dashboard.alerts.roomNotFound,
          );
          router.push(routes.dashboard());
        }
      } catch (error) {
        console.error('Error fetching room info:', error);
      }
    };
    fetchRoomInfo();
  }, [roomId, router, t, userId]);

  // 권한 체크 및 자동 입장 (creator 또는 participant인 경우)
  useEffect(() => {
    const attemptAutoJoin = async () => {
      // 이미 시도했거나 필요한 정보가 없으면 스킵
      if (autoJoinAttemptedRef.current || !roomInfo || !nickname || !userId)
        return;

      addTrace(`Start: userId=${userId} roomInfo=${!!roomInfo}`);

      // 1. 서버가 이미 매칭한 키가 있는지 확인 (가장 확실한 방법)
      const hasServerMatchKey = !!roomInfo.participantEncryptedKey;
      addTrace(`hasServerMatchKey=${hasServerMatchKey}`);

      console.log('[useRoomJoin] Auto-join check:', {
        hasServerMatchKey,
        userId,
        hasEncryptedKey: !!roomInfo.participantEncryptedKey,
        isCreator: roomInfo.isCreator,
      });

      // 서버에 내 키가 있으면 바로 시도
      if (hasServerMatchKey) {
        autoJoinAttemptedRef.current = true;
        addTrace('Entering hasServerMatchKey block');

        try {
          const privateKey = await loadPrivateKey();
          addTrace(`PrivateKey loaded: ${!!privateKey}`);

          if (privateKey) {
            addTrace('Attempting unwrap');
            const decryptedMK = await unwrapKey(
              roomInfo.participantEncryptedKey,
              privateKey,
            );
            addTrace('Unwrap success');
            console.log('[useRoomJoin] ✅ Auto-join success with private key');
            setCryptoKey(decryptedMK);

            // [NEW] Decrypt room password if available
            if (roomInfo.encrypted_password) {
              try {
                const decryptedPassword = await decryptRoomPassword(
                  roomInfo.encrypted_password,
                  decryptedMK,
                );
                setPassword(decryptedPassword);
                console.log(
                  '[useRoomJoin] ✅ Password restored from shared vault',
                );
              } catch (e) {
                console.warn('[useRoomJoin] Failed to decrypt password:', e);
              }
            }

            setIsJoined(true);
            setIsLoading(false);
            return;
          } else {
            addTrace('PrivateKey missing');
            console.warn('[useRoomJoin] ❌ Private key NOT found in storage.');
            setError('Private Key Missing in Storage');
          }
        } catch (err) {
          addTrace(`Error: ${String(err)}`);
          console.error(
            '[useRoomJoin] ❌ Identity-based auto-join error:',
            err,
          );
          setError(
            `Auto-join failed: ${err instanceof Error ? err.message : String(err)}`,
          );
        }
      } else if (roomInfo.isCreator) {
        addTrace('Creator but no key');
        // Creator but no key?
        setError('Creator but no encrypted key on server');
      }

      addTrace('Fell through');
      // 권한이 없거나 자동 입장 실패 시 (비밀번호 화면 표시)
      // 단, participant인데 키가 없는 경우도 여기로 떨어짐 (비밀번호 필요)
      setIsLoading(false);
    };

    attemptAutoJoin();
  }, [roomInfo, nickname, userId]);

  // 수동 비밀번호 입력으로 입장
  const joinRoom = async (e?: React.FormEvent, manualPassword?: string) => {
    if (e) e.preventDefault();

    setError('');
    const pwdToUse = manualPassword || password;
    if (!pwdToUse || !roomInfo || !user) return;

    try {
      // 1. 비밀번호로 방 마스터 키(MK) 복호화
      const masterKey = await decryptRoomKeyWithPassword(
        roomInfo.encryptedKey,
        pwdToUse,
        roomInfo.salt,
      );

      setCryptoKey(masterKey);

      // [NEW] Decrypt room password if available
      if (roomInfo.encrypted_password) {
        try {
          const decryptedPassword = await decryptRoomPassword(
            roomInfo.encrypted_password,
            masterKey,
          );
          setPassword(decryptedPassword);
          console.log(
            '[useRoomJoin] ✅ Password restored from shared vault (manual join)',
          );
        } catch (e) {
          console.warn('[useRoomJoin] Failed to decrypt password:', e);
        }
      }

      // 2. 자신의 Identity Public Key로 마스터 키를 다시 래핑 (E2EE)
      if (!user.public_key) throw new Error('Identity public key missing');

      const publicKeyJwk = JSON.parse(user.public_key);
      const identityPublicKey = await importKey(
        publicKeyJwk,
        { name: 'RSA-OAEP', hash: 'SHA-256' },
        ['wrapKey'],
      );

      const wrappedKeyForMe = await wrapKey(masterKey, identityPublicKey);

      // 3. 참여자에 사용자 추가 및 E2EE 키 등록
      await fetch(`/api/rooms/${roomId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({
          username: user.username,
          encryptedKey: wrappedKeyForMe,
        }),
      });

      setIsJoined(true);
    } catch (err) {
      console.error('[useRoomJoin] Join failed:', err);
      if (e) {
        setError(t.dashboard.alerts.invalidPassword);
      }
    }
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const quitRoom = async () => {
    if (nickname) {
      try {
        const res = await fetch(`/api/rooms/${roomId}/leave`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: nickname }),
        });
      } catch (error) {
        console.error('Error leaving room:', error);
      }
    }
    router.push(routes.dashboard());
  };

  const goBack = () => {
    router.push(routes.dashboard());
  };

  return {
    nickname,
    password,
    setPassword,
    showPassword,
    togglePasswordVisibility,
    isJoined,
    isLoading, // 로딩 상태 추가
    roomInfo,
    cryptoKey,
    joinRoom,
    quitRoom,
    goBack,
    error,
    debugInfo: roomInfo
      ? {
          ...roomInfo.debugInfo,
          clientError:
            error ||
            (autoJoinAttemptedRef.current && !isJoined && !isLoading
              ? 'Auto-join fell through'
              : null),
          executionTrace: debugTrace.current,
        }
      : null,
  };
}
