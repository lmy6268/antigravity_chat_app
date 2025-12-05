'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { routes } from '@/lib/routes';
import { useTranslation } from '@/i18n/LanguageContext';

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
  const redirectUrl = searchParams.get('redirect') || routes.dashboard();
  
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
  const login = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('chat_user', JSON.stringify(data.user));
        localStorage.setItem('chat_nickname', data.user.username);
        router.push(redirectUrl);
      } else {
        const data = await res.json();
        setError(data.error || t.common.loginFailed);
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
    login,
  };
}
