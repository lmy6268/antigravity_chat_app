'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

/**
 * useLogin Hook (ViewModel)
 * 
 * Responsibilities:
 * - Manage login form state
 * - Handle login logic
 * - Auto-redirect if already logged in
 * 
 * Similar to Android ViewModel pattern
 */
export function useLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';
  
  // State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Effects - Auto-redirect if already logged in
  useEffect(() => {
    const storedUser = localStorage.getItem('chat_user');
    if (storedUser) {
      router.push('/');
    }
  }, [router]);

  // Actions
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
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  return {
    // State (readonly)
    username,
    password,
    showPassword,
    error,
    isLoading,
    
    // Actions
    setUsername,
    setPassword,
    togglePasswordVisibility,
    login,
  };
}
