'use client';

import Link from 'next/link';
import { useRegister } from '@/hooks/auth/useRegister';
import { useTranslation } from '@/i18n/LanguageContext';
import { routes } from '@/lib/routes';
import styles from '@/styles/auth-form.module.css';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

/**
 * RegisterForm Component (Pure View)
 */
export default function RegisterForm() {
  const { username, password, error, isLoading, setUsername, setPassword, register } =
    useRegister();
  const { t } = useTranslation();

  return (
    <div className={styles.formContainer}>
      <h2 className={styles.formTitle}>{t.auth.register}</h2>

      {error && <div className={styles.errorMessage}>{error}</div>}

      <form onSubmit={register} className={styles.form}>
        <div className={styles.inputGroup}>
          <input
            type="text"
            placeholder={t.auth.username}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={isLoading}
            className={styles.input}
          />
          <span className={styles.helpText}>{t.auth.validation.usernameHelp}</span>
        </div>

        <div className={styles.inputGroup}>
          <input
            type="password"
            placeholder={t.auth.password}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            className={styles.input}
          />
          <span className={styles.helpText}>{t.auth.validation.passwordHelp}</span>
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className={`${styles.submitButton} ${styles.register}`}
        >
          {isLoading ? (
            <LoadingSpinner size={20} color="#ffffff" />
          ) : (
            t.auth.register
          )}
        </button>
      </form>

      <div className={styles.footer}>
        {t.auth.alreadyHaveAccount}{' '}
        <Link href={routes.auth.login()} className={styles.footerLink}>
          {t.auth.login}
        </Link>
      </div>
    </div>
  );
}
