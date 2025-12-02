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
  const [error, setError] = useState('');

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
    
    setError(''); // Clear previous errors
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

      // Call join API to add user to participants
      await fetch(`/api/rooms/${roomId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: nickname,
          // We don't strictly need to send encryptedKey here since we use shared key, 
          // but keeping it for schema compatibility if needed
          encryptedKey: '' 
        })
      });

      setIsJoined(true);

    } catch (err) {
      // Only show error if it was a manual attempt
      if (e) {
        setError(t.dashboard.alerts.invalidPassword);
      }
    }
  };

  // Trigger auto-join for creator only (they know the password)
  useEffect(() => {
    if (roomInfo && nickname && !isJoined) {
      const isCreator = roomInfo.creator === nickname;
      
      // Auto-join disabled - users must always enter password manually
      // This ensures security and prevents unauthorized access
    }
  }, [roomInfo, nickname, isJoined]);

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
    error
  };
}
