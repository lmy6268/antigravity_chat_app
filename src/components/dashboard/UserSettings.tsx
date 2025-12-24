import { useTranslation } from '@/i18n/LanguageContext';

export function UserSettings() {
  const { t, locale, setLocale } = useTranslation();

  return (
    <div
      style={{
        backgroundColor: '#252526',
        padding: '16px',
        borderRadius: '8px',
        border: '1px solid #3e3e3e',
        marginBottom: '20px',
      }}
    >
      <h3 style={{ margin: '0 0 12px 0' }}>{t.settings.title}</h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ color: '#aaa', fontSize: '14px' }}>{t.settings.language}</span>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setLocale('ko')}
            style={{
              padding: '6px 10px',
              borderRadius: '4px',
              border: '1px solid #555',
              backgroundColor: locale === 'ko' ? '#007acc' : 'transparent',
              color: 'white',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            한국어
          </button>
          <button
            onClick={() => setLocale('en')}
            style={{
              padding: '6px 10px',
              borderRadius: '4px',
              border: '1px solid #555',
              backgroundColor: locale === 'en' ? '#007acc' : 'transparent',
              color: 'white',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            English
          </button>
        </div>
      </div>
    </div>
  );
}
