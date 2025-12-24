'use client';

import Link from 'next/link';
import { useLogin } from '@/hooks/auth/useLogin';
import { useTranslation } from '@/i18n/LanguageContext';
import { routes } from '@/lib/routes';
import styles from '@/styles/auth-form.module.css';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { LanguageToggle } from '@/components/common/LanguageToggle';

/**
 * LoginForm Component (Pure View)
 */
export default function LoginForm() {
  const {
    username,
    password,
    error,
    isLoading,
    setUsername,
    setPassword,
    handleLogin,
  } = useLogin();
  const { t } = useTranslation();

  return (
    <div className={styles.formContainer}>
      <h2 className={styles.formTitle}>{t.auth.login}</h2>

      {error && <div className={styles.errorMessage}>{error}</div>}

      <form onSubmit={handleLogin} className={styles.form}>
        <input
          type="text"
          placeholder={t.auth.username}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={isLoading}
          className={styles.input}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          autoComplete="username"
        />
        <input
          type="password"
          placeholder={t.auth.password}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
          className={styles.input}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          autoComplete="current-password"
        />
        <button
          type="submit"
          disabled={isLoading}
          className={`${styles.submitButton} ${styles.login}`}
        >
          {isLoading ? (
            <LoadingSpinner size={20} color="#ffffff" />
          ) : (
            t.auth.login
          )}
        </button>
      </form>

      <div className={styles.footer}>
        {t.auth.dontHaveAccount}{' '}
        <Link href={routes.auth.register()} className={styles.footerLink}>
          {t.auth.register}
        </Link>
      </div>
      <LanguageToggle />
    </div>
  );
}
