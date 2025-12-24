'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { routes } from '@/lib/routes';
import { useTranslation } from '@/i18n/LanguageContext';
import {
  saveUserProfile,
  loadUserProfile,
  deleteOldDatabase,
  savePrivateKey,
} from '@/lib/key-storage';
import { decryptDataWithPassword, importKey } from '@/lib/crypto';
import { STORAGE_KEYS } from '@/lib/constants/storage';
import { dialogService } from '@/lib/dialog';

/**
 * useLogin Hook (ViewModel)
 *
 * 책임:
 * - 로그인 폼 상태 관리
 * - 로그인 로직 처리
 * - 이미 로그인된 경우 자동 리다이렉트
 *
 * Android ViewModel 패턴과 유사
 */
export function useLogin() {
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
      // Clear old IndexedDB
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
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        const userData = data.user;

        // [NEW] Restore Private Key if available
        if (userData.encrypted_private_key) {
          try {
            const parts = userData.encrypted_private_key.split(':');
            if (parts.length === 2) {
              const [salt, encrypted] = parts;
              const privateKeyString = await decryptDataWithPassword(
                encrypted,
                password,
                salt,
              );
              const privateKeyJwk = JSON.parse(privateKeyString);
              const restoredKey = await importKey(
                privateKeyJwk,
                { name: 'RSA-OAEP', hash: 'SHA-256' },
                ['decrypt', 'unwrapKey'],
                false, // hardened
              );
              await savePrivateKey(restoredKey);
              console.log(
                '[useLogin] ✅ Private key restored from server backup',
              );
              // Optional: Notify success? No, it should be seamless.
            } else {
              console.warn('[useLogin] Invalid encrypted key format');
              // dialogService.alert('Warning: Key Backup format invalid. Auto-join may fail.');
            }
          } catch (e) {
            console.error('[useLogin] Failed to restore private key:', e);
            // CRITICAL DEBUGGING: Show error to user
            dialogService.alert(
              `⚠️ Key Restoration Failed: ${(e as Error).message}\n\nYou can still login, but auto-join will not work on this device.`,
            );
          }
        } else {
          console.log('[useLogin] No encrypted_private_key found in user data');
          // Optionally warn user if this is a new account?
          // dialogService.alert('⚠️ Note: No backup key found on server. Did you verify the SQL migration?');
        }

        // Save to IndexedDB (User Profile)
        await saveUserProfile(userData);

        // 리다이렉트 URL이 있으면 거기로, 없으면 대시보드로
        const redirectUrl = searchParams.get('redirect');
        if (redirectUrl) {
          router.push(decodeURIComponent(redirectUrl));
        } else {
          router.push(routes.dashboard());
        }
      } else {
        setError(data.message || t.common.loginFailed);
      }
    } catch (err) {
      setError(t.common.errorOccurred);
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
    handleLogin,
  };
}
