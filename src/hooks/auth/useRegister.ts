'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { generateKeyPair, exportKey } from '@/lib/crypto';
import { savePrivateKey } from '@/lib/key-storage';
import { routes } from '@/lib/routes';

import { useTranslation } from '@/i18n/LanguageContext';
import { STORAGE_KEYS } from '@/lib/storage-constants';

/**
 * useRegister Hook (ViewModel)
 * 
 * 책임:
 * - 회원가입 폼 상태 관리
 * - 키 생성 처리
 * - 회원가입 로직 처리
 * - 이미 로그인된 경우 자동 리다이렉트
 */
export function useRegister() {
  const router = useRouter();
  const { t } = useTranslation();
  
  // 상태
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 효과 - 이미 로그인된 경우 자동 리다이렉트
  useEffect(() => {
    const storedUser = localStorage.getItem('chat_user');
    if (storedUser) {
      router.push(routes.dashboard());
    }
  }, [router]);

  // 액션
  const register = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');

    // 유효성 검사
    const usernameRegex = /^(?=.*[a-zA-Z])[a-zA-Z0-9]{6,}$/;
    if (!usernameRegex.test(username)) {
      setError(t.auth.validation.username);
      return;
    }

    const passwordRegex = /^[a-zA-Z0-9@!#$]{8,}$/;
    if (!passwordRegex.test(password)) {
      setError(t.auth.validation.password);
      return;
    }

    setIsLoading(true);

    try {
      // 1. RSA 키 쌍 생성
      const keyPair = await generateKeyPair();
      
      // 2. Public Key를 JWK 문자열로 내보내기
      const publicKeyJwk = await exportKey(keyPair.publicKey);
      const publicKeyString = JSON.stringify(publicKeyJwk);

      // 3. Private Key를 IndexedDB에 저장
      await savePrivateKey(keyPair.privateKey);

      // 4. username, password, public key로 회원가입
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username, 
          password,
          publicKey: publicKeyString
        }),
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));
        router.push(routes.dashboard());
      } else {
        const data = await res.json();
        setError(data.error || t.common.registrationFailed);
      }
    } catch (err) {
      console.error(err);
      setError(t.common.errorDuringRegistration);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  return {
    // 상태 (읽기 전용)
    username,
    password,
    showPassword,
    error,
    isLoading,
    
    // 액션
    setUsername,
    setPassword,
    togglePasswordVisibility,
    register,
  };
}
