'use client';

import { useTranslation } from '@/i18n/LanguageContext';

export function LanguageToggle() {
  const { locale, setLocale } = useTranslation();

  const buttonStyle = (isActive: boolean) => ({
    padding: '6px 12px',
    borderRadius: '4px',
    border: '1px solid #555',
    backgroundColor: isActive ? '#007acc' : 'transparent',
    color: '#f0f0f0',
    cursor: 'pointer',
    fontSize: '13px',
    transition: 'all 0.2s',
  });

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '10px',
        marginTop: '20px',
      }}
    >
      <button
        onClick={() => setLocale('ko')}
        style={buttonStyle(locale === 'ko')}
      >
        한국어
      </button>
      <button
        onClick={() => setLocale('en')}
        style={buttonStyle(locale === 'en')}
      >
        English
      </button>
    </div>
  );
}
