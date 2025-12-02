'use client';

import Link from 'next/link';
import { useRegister } from '@/hooks/auth/useRegister';
import { useTranslation } from '@/i18n/LanguageContext';

/**
 * RegisterForm Component (Pure View)
 */
export default function RegisterForm() {
  const { username, password, error, isLoading, setUsername, setPassword, register } = useRegister();
  const { t } = useTranslation();

  return (
    <div style={{
      backgroundColor: '#252526', padding: 'clamp(20px, 5vw, 40px)', borderRadius: '12px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.3)', width: '100%', maxWidth: '400px',
      display: 'flex', flexDirection: 'column', gap: '20px'
    }}>
      <h2 style={{ margin: 0, textAlign: 'center', color: '#f0f0f0', fontSize: 'clamp(1.5rem, 5vw, 2rem)' }}>
        {t('auth.register')}
      </h2>

      {error && (
        <div style={{
          backgroundColor: 'rgba(217, 83, 79, 0.1)', color: '#d9534f', padding: '10px',
          borderRadius: '6px', fontSize: '14px', textAlign: 'center'
        }}>
          {error}
        </div>
      )}

      <form onSubmit={register} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input
          type="text"
          placeholder={t('auth.username')}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={isLoading}
          style={{
            padding: '12px', borderRadius: '6px', border: '1px solid #3e3e3e',
            backgroundColor: '#1e1e1e', color: 'white', fontSize: '16px'
          }}
        />
        <input
          type="password"
          placeholder={t('auth.password')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
          style={{
            padding: '12px', borderRadius: '6px', border: '1px solid #3e3e3e',
            backgroundColor: '#1e1e1e', color: 'white', fontSize: '16px'
          }}
        />
        <button
          type="submit"
          disabled={isLoading}
          style={{
            padding: '14px', borderRadius: '6px', border: 'none',
            backgroundColor: '#28a745', color: 'white', fontSize: '16px', fontWeight: 'bold',
            cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.7 : 1
          }}
        >
          {isLoading ? t('common.loading') : t('auth.register')}
        </button>
      </form>

      <div style={{ textAlign: 'center', fontSize: '14px', color: '#aaa' }}>
        Already have an account? <Link href="/login" style={{ color: '#007acc' }}>{t('auth.login')}</Link>
      </div>
    </div>
  );
}
