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

  // Join room
  const joinRoom = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!password || !roomInfo) return;

    try {
      // Decrypt room key
      const decryptedKey = await decryptRoomKeyWithPassword(
        roomInfo.encrypted_key_data,
        roomInfo.encrypted_key_iv,
        password
      );
      
      setCryptoKey(decryptedKey);
      setIsJoined(true);
    } catch (error) {
      alert(t('alerts.invalidPassword'));
    }
  };

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
