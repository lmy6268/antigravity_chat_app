'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { routes } from '@/lib/routes';
import { useTranslation } from '@/i18n/LanguageContext';
import { STORAGE_KEYS } from '@/lib/storage-constants';

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
    const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
    if (storedUser) {
      const redirectUrl = searchParams.get('redirect');
      if (redirectUrl) {
        router.push(decodeURIComponent(redirectUrl));
      } else {
        router.push(routes.dashboard());
      }
    }
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
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));

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
