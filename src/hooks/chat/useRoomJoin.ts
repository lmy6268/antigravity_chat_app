'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { decryptRoomKeyWithPassword } from '@/lib/crypto';
import { routes } from '@/lib/routes';

import { useTranslation } from '@/i18n/LanguageContext';
import { STORAGE_KEYS } from '@/lib/storage-constants';
import { dialogService } from '@/lib/dialog';

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
  
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // 로딩 중에는 화면 안 보임
  const [roomInfo, setRoomInfo] = useState<any>(null);
  const [cryptoKey, setCryptoKey] = useState<CryptoKey | null>(null);
  const [error, setError] = useState('');
  const [needsLogin, setNeedsLogin] = useState(false);
  const autoJoinAttemptedRef = useRef(false);

  // localStorage에서 nickname 불러오기
  // localStorage에서 nickname 불러오기
  useEffect(() => {
    const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
    if (!storedUser) {
      setNeedsLogin(true);
      setIsLoading(false);
      return;
    }
    const user = JSON.parse(storedUser);
    setNickname(user.username);
  }, []);

  // 로그인 필요 시 리다이렉트
  useEffect(() => {
    if (needsLogin) {
      const returnUrl = encodeURIComponent(routes.chat.room(roomId));
      router.push(routes.auth.login() + `?redirect=${returnUrl}`);
    }
  }, [needsLogin, roomId, roomName, router]);

  // API에서 룸 정보 가져오기
  useEffect(() => {
    const fetchRoomInfo = async () => {
      try {
        const res = await fetch(`/api/rooms/${roomId}`);
        if (res.ok) {
          const data = await res.json();
          setRoomInfo(data.room);
        } else if (res.status === 404) {
          dialogService.alert(t.dashboard.alerts.roomDeleted || t.dashboard.alerts.roomNotFound);
          router.push(routes.dashboard());
        }
      } catch (error) {
        console.error('Error fetching room info:', error);
      }
    };
    fetchRoomInfo();
  }, [roomId]);

  // 권한 체크 및 자동 입장 (creator 또는 participant인 경우)
  useEffect(() => {
    const attemptAutoJoin = async () => {
      // 이미 시도했거나 필요한 정보가 없으면 스킵
      if (autoJoinAttemptedRef.current || !roomInfo || !nickname) return;
      
      const isCreator = roomInfo.creator === nickname;
      const isParticipant = roomInfo.participants?.includes(nickname);
      
      if (isCreator || isParticipant) {
        autoJoinAttemptedRef.current = true;
        
        // roomInfo.password로 자동 입장 시도
        if (roomInfo.password) {
          try {
            const decryptedKey = await decryptRoomKeyWithPassword(
              roomInfo.encryptedKey,
              roomInfo.password,
              roomInfo.salt
            );
            setCryptoKey(decryptedKey);
            setIsJoined(true);
            setIsLoading(false);
            return;
          } catch (err) {
            console.error('Auto-join failed:', err);
          }
        }
      }
      
      // 권한이 없거나 자동 입장 실패 시 비밀번호 화면 표시
      setIsLoading(false);
    };
    
    attemptAutoJoin();
  }, [roomInfo, nickname]);

  // 수동 비밀번호 입력으로 입장
  const joinRoom = async (e?: React.FormEvent, manualPassword?: string) => {
    if (e) e.preventDefault();
    
    setError('');
    const pwdToUse = manualPassword || password;
    if (!pwdToUse || !roomInfo) return;

    try {
      const decryptedKey = await decryptRoomKeyWithPassword(
        roomInfo.encryptedKey,
        pwdToUse,
        roomInfo.salt
      );
      
      setCryptoKey(decryptedKey);

      // 참여자에 사용자 추가
      await fetch(`/api/rooms/${roomId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: nickname,
          encryptedKey: '' 
        })
      });

      setIsJoined(true);

    } catch (err) {
      if (e) {
        setError(t.dashboard.alerts.invalidPassword);
      }
    }
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const quitRoom = async () => {
    console.log('[useRoomJoin] quitRoom called', { nickname, roomId });
    if (nickname) {
      try {
        console.log('[useRoomJoin] Calling leave API');
        const res = await fetch(`/api/rooms/${roomId}/leave`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: nickname })
        });
        console.log('[useRoomJoin] Leave API response:', res.status);
      } catch (error) {
        console.error('Error leaving room:', error);
      }
    }
    console.log('[useRoomJoin] Navigating to dashboard');
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
    error
  };
}
