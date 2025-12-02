'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { decryptRoomKeyWithPassword } from '@/lib/crypto';

import { useTranslation } from '@/i18n/LanguageContext';

/**
 * useRoomJoin Hook (ViewModel)
 * 
 * Responsibilities:
 * - Handle room joining logic
 * - Manage password input
 * - Handle room key decryption
 * - Fetch room info from API
 */
export function useRoomJoin(roomId: string, roomName: string) {
  const router = useRouter();
  const { t } = useTranslation();
  
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [roomInfo, setRoomInfo] = useState<any>(null);
  const [cryptoKey, setCryptoKey] = useState<CryptoKey | null>(null);

  // Load nickname from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('chat_user');
    if (!storedUser) {
      const returnUrl = encodeURIComponent(`/chat/${roomId}?name=${encodeURIComponent(roomName)}`);
      router.push(`/login?redirect=${returnUrl}`);
      return;
    }
    const user = JSON.parse(storedUser);
    setNickname(user.username);
  }, [roomId, roomName, router]);

  // Fetch room info from API
  useEffect(() => {
    const fetchRoomInfo = async () => {
      try {
        const res = await fetch(`/api/rooms/${roomId}`);
        if (res.ok) {
          const data = await res.json();
          setRoomInfo(data.room);
        }
      } catch (error) {
        console.error('Error fetching room info:', error);
      }
    };
    fetchRoomInfo();
  }, [roomId]);

  // Modified joinRoom to accept password argument
  const joinRoom = async (e?: React.FormEvent, manualPassword?: string) => {
    if (e) e.preventDefault();
    
    const pwdToUse = manualPassword || password;
    if (!pwdToUse || !roomInfo) return;

    try {
      // Decrypt room key
      const decryptedKey = await decryptRoomKeyWithPassword(
        roomInfo.encrypted_key_data,
        roomInfo.encrypted_key_iv,
        pwdToUse
      );
      
      setCryptoKey(decryptedKey);
      setIsJoined(true);

      // Save password to localStorage on success
      const savedPasswords = JSON.parse(localStorage.getItem('chat_room_passwords') || '{}');
      savedPasswords[roomId] = pwdToUse;
      localStorage.setItem('chat_room_passwords', JSON.stringify(savedPasswords));

    } catch (error) {
      // Only show alert if it was a manual attempt
      if (e) alert(t('alerts.invalidPassword'));
    }
  };

  // Trigger auto-join
  useEffect(() => {
    if (roomInfo && nickname && !isJoined) {
      const savedPasswords = JSON.parse(localStorage.getItem('chat_room_passwords') || '{}');
      const savedPassword = savedPasswords[roomId];
      
      const isCreator = roomInfo.creator === nickname;
      const isParticipant = roomInfo.participants && roomInfo.participants.includes(nickname);

      if (savedPassword) {
        // If we have a saved password, pre-fill it for display
        setPassword(savedPassword);

        // If user is creator or participant, try to auto-join
        if (isCreator || isParticipant) {
          joinRoom(undefined, savedPassword);
        }
      }
    }
  }, [roomInfo, nickname, isJoined, roomId, joinRoom]); // Added joinRoom to deps, ensure it's stable if needed (e.g., with useCallback)

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  // Leave room
  const leaveRoom = () => {
    router.push('/');
  };

  return {
    nickname,
    password,
    setPassword,
    showPassword,
    togglePasswordVisibility,
    isJoined,
    roomInfo,
    cryptoKey,
    joinRoom,
    leaveRoom,
  };
}
