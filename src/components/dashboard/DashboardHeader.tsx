import { useTranslation } from '@/i18n/LanguageContext';

interface DashboardHeaderProps {
    nickname: string;
    onLogout: () => void;
}

export function DashboardHeader({ nickname, onLogout }: DashboardHeaderProps) {
    const { t, locale, setLocale } = useTranslation();

    return (
        <header style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px',
            paddingBottom: '15px', borderBottom: '1px solid #3e3e3e', flexWrap: 'wrap', gap: '10px'
        }}>
            <h1 style={{ margin: 0, fontSize: 'clamp(1.5rem, 5vw, 2rem)' }}>{t.dashboard.title}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
                {/* Language Switcher */}
                <div style={{ display: 'flex', gap: '5px' }}>
                    <button
                        onClick={() => setLocale('en')}
                        style={{
                            padding: '4px 8px', borderRadius: '4px', border: '1px solid #555',
                            backgroundColor: locale === 'en' ? '#007acc' : 'transparent',
                            color: 'white', cursor: 'pointer', fontSize: '12px'
                        }}
                    >
                        EN
                    </button>
                    <button
                        onClick={() => setLocale('ko')}
                        style={{
                            padding: '4px 8px', borderRadius: '4px', border: '1px solid #555',
                            backgroundColor: locale === 'ko' ? '#007acc' : 'transparent',
                            color: 'white', cursor: 'pointer', fontSize: '12px'
                        }}
                    >
                        KO
                    </button>
                </div>

                <span style={{ fontSize: 'clamp(0.875rem, 3vw, 1rem)' }}>
                    {t.dashboard.hello}, <strong>{nickname}</strong>
                </span>
                <button onClick={onLogout} style={{
                    padding: '6px 12px', borderRadius: '4px', border: '1px solid #d9534f',
                    backgroundColor: 'transparent', color: '#d9534f', cursor: 'pointer', fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)'
                }}>
                    {t.auth.logout}
                </button>
            </div>
        </header>
    );
}
