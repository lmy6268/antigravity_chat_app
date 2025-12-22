import { useTranslation } from '@/i18n/LanguageContext';

interface DashboardTabsProps {
    activeTab: 'rooms' | 'friends';
    onTabChange: (tab: 'rooms' | 'friends') => void;
}

export function DashboardTabs({ activeTab, onTabChange }: DashboardTabsProps) {
    const { t } = useTranslation();

    return (
        <div
            style={{
                display: 'flex',
                gap: '20px',
                marginBottom: '20px',
                borderBottom: '1px solid #3e3e3e',
            }}
        >
            <button
                onClick={() => onTabChange('rooms')}
                style={{
                    padding: '10px 20px',
                    background: 'none',
                    border: 'none',
                    color: activeTab === 'rooms' ? '#007acc' : '#aaa',
                    borderBottom: activeTab === 'rooms' ? '2px solid #007acc' : 'none',
                    cursor: 'pointer',
                    fontSize: '16px',
                }}
            >
                {t.dashboard.tabs.rooms}
            </button>
            <button
                onClick={() => onTabChange('friends')}
                style={{
                    padding: '10px 20px',
                    background: 'none',
                    border: 'none',
                    color: activeTab === 'friends' ? '#007acc' : '#aaa',
                    borderBottom: activeTab === 'friends' ? '2px solid #007acc' : 'none',
                    cursor: 'pointer',
                    fontSize: '16px',
                }}
            >
                {t.dashboard.tabs.friends}
            </button>
        </div>
    );
}
