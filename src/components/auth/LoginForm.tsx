'use client';

import Link from 'next/link';
import { useLogin } from '@/hooks/auth/useLogin';
import { useTranslation } from '@/i18n/LanguageContext';
import { routes } from '@/lib/routes';
import styles from '@/styles/auth-form.module.css';

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
    login,
  } = useLogin();
  const { t } = useTranslation();

  return (
    <div className={styles.formContainer}>
      <h2 className={styles.formTitle}>
        {t.auth.login}
      </h2>

      {error && (
        <div className={styles.errorMessage}>
          {error}
        </div>
      )}

      <form onSubmit={login} className={styles.form}>
        <input
          type="text"
          placeholder={t.auth.username}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={isLoading}
          className={styles.input}
        />
        <input
          type="password"
          placeholder={t.auth.password}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
          className={styles.input}
        />
        <button
          type="submit"
          disabled={isLoading}
          className={`${styles.submitButton} ${styles.login}`}
        >
          {isLoading ? t.common.loading : t.auth.login}
        </button>
      </form>

      <div className={styles.footer}>
        {t.auth.dontHaveAccount} <Link href={routes.auth.register()}
          className={styles.footerLink}>{t.auth.register}</Link>
      </div>
    </div>
  );
}
