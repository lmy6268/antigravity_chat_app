'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { generateKeyPair, exportKey } from '@/lib/crypto';
import { savePrivateKey } from '@/lib/key-storage';

import { useTranslation } from '@/i18n/LanguageContext';

/**
 * useRegister Hook (ViewModel)
 * 
 * Responsibilities:
 * - Manage registration form state
 * - Handle key generation
 * - Handle registration logic
 * - Auto-redirect if already logged in
 */
export function useRegister() {
  const router = useRouter();
  const { t } = useTranslation();
  
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
  const register = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');

    // Validation
    const usernameRegex = /^(?=.*[a-zA-Z])[a-zA-Z0-9]{6,}$/;
    if (!usernameRegex.test(username)) {
      setError(t('auth.validation.username'));
      return;
    }

    const passwordRegex = /^[a-zA-Z0-9@!#$]{8,}$/;
    if (!passwordRegex.test(password)) {
      setError(t('auth.validation.password'));
      return;
    }

    setIsLoading(true);

    try {
      // 1. Generate RSA Key Pair
      const keyPair = await generateKeyPair();
      
      // 2. Export Public Key to JWK string
      const publicKeyJwk = await exportKey(keyPair.publicKey);
      const publicKeyString = JSON.stringify(publicKeyJwk);

      // 3. Save Private Key to IndexedDB
      await savePrivateKey(keyPair.privateKey);

      // 4. Register with username, password, and public key
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
        // Redirect directly to login without alert
        router.push('/login');
      } else {
        const data = await res.json();
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred during registration');
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
    register,
  };
}
