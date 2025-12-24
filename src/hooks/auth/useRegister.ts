'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  generateKeyPair,
  exportKey,
  importKey,
  generateSalt,
  encryptDataWithPassword,
  exportPrivateKeyToString,
} from '@/lib/crypto';
import {
  savePrivateKey,
  saveUserProfile,
  loadUserProfile,
  deleteOldDatabase,
} from '@/lib/key-storage';
import { routes } from '@/lib/routes';

import { useTranslation } from '@/i18n/LanguageContext';
import { STORAGE_KEYS } from '@/lib/constants/storage';

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
  const searchParams = useSearchParams();
  const { t } = useTranslation();

  // 상태
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 효과 - 이미 로그인된 경우 자동 리다이렉트
  useEffect(() => {
    const checkUser = async () => {
      // Clear legacy storage and old IndexedDB
      await deleteOldDatabase();

      const storedUser = await loadUserProfile();
      if (storedUser) {
        const redirectUrl = searchParams.get('redirect');
        if (redirectUrl) {
          router.push(decodeURIComponent(redirectUrl));
        } else {
          router.push(routes.dashboard());
        }
      }
    };
    checkUser();
  }, [router, searchParams]);

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

      // 3. identity private key를 '추출 불가능(non-extractable)'하게 다시 가져와서 저장 (보안 강화)
      const privateKeyJwk = await exportKey(keyPair.privateKey);
      const hardenedPrivateKey = await importKey(
        privateKeyJwk,
        { name: 'RSA-OAEP', hash: 'SHA-256' },
        ['decrypt', 'unwrapKey'],
        false, // extractable: false 설정
      );
      await savePrivateKey(hardenedPrivateKey);

      // 4. [NEW] Private Key Backup (Encrypt with Password)
      // Format: "SALT_BASE64:IV_CIPHERTEXT_BASE64"
      const backupSalt = generateSalt();
      const privateKeyString = await exportPrivateKeyToString(
        keyPair.privateKey,
      );
      const encryptedBackup = await encryptDataWithPassword(
        privateKeyString,
        password,
        backupSalt,
      );
      const encryptedPrivateKeyPayload = `${backupSalt}:${encryptedBackup}`;

      // 5. username, password, public key로 회원가입
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          publicKey: publicKeyString,
          encryptedPrivateKey: encryptedPrivateKeyPayload,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        // 6. User Profile을 IndexedDB에 저장
        await saveUserProfile(data.user);

        const redirectUrl = searchParams.get('redirect');
        if (redirectUrl) {
          router.push(decodeURIComponent(redirectUrl));
        } else {
          router.push(routes.dashboard());
        }
      } else {
        const data = await res.json();
        if (data.error === 'User already exists') {
          // Fallback to literal if key is missing
          setError(t.auth.userAlreadyExists || '이미 존재하는 사용자입니다');
        } else {
          setError(data.error || t.common.registrationFailed);
        }
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
