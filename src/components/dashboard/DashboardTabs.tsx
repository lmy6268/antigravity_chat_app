import { useTranslation } from '@/i18n/LanguageContext';
import { DASHBOARD_TABS, DashboardTab } from '@/lib/constants/dashboard';

interface DashboardTabsProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
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
        onClick={() => onTabChange(DASHBOARD_TABS.ROOMS)}
        style={{
          padding: '10px 20px',
          background: 'none',
          border: 'none',
          color: activeTab === DASHBOARD_TABS.ROOMS ? '#007acc' : '#aaa',
          borderBottom:
            activeTab === DASHBOARD_TABS.ROOMS ? '2px solid #007acc' : 'none',
          cursor: 'pointer',
          fontSize: '16px',
        }}
      >
        {t.dashboard.tabs.rooms}
      </button>
      <button
        onClick={() => onTabChange(DASHBOARD_TABS.FRIENDS)}
        style={{
          padding: '10px 20px',
          background: 'none',
          border: 'none',
          color: activeTab === DASHBOARD_TABS.FRIENDS ? '#007acc' : '#aaa',
          borderBottom:
            activeTab === DASHBOARD_TABS.FRIENDS ? '2px solid #007acc' : 'none',
          cursor: 'pointer',
          fontSize: '16px',
        }}
      >
        {t.dashboard.tabs.friends}
      </button>
      <button
        onClick={() => onTabChange(DASHBOARD_TABS.SETTINGS)}
        style={{
          padding: '10px 20px',
          background: 'none',
          border: 'none',
          color: activeTab === DASHBOARD_TABS.SETTINGS ? '#007acc' : '#aaa',
          borderBottom:
            activeTab === DASHBOARD_TABS.SETTINGS
              ? '2px solid #007acc'
              : 'none',
          cursor: 'pointer',
          fontSize: '16px',
        }}
      >
        {t.dashboard.tabs.settings}
      </button>
    </div>
  );
}
