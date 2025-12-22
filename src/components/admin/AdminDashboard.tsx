'use client';

import { useState } from 'react';
import { useAdminAuth } from '@/hooks/admin/useAdminAuth';
import MetricsPanel from './MetricsPanel';
import StatsPanel from './StatsPanel';
import ApiLogsPanel from './ApiLogsPanel';
import styles from './AdminDashboard.module.css';

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState<'metrics' | 'stats' | 'logs'>('metrics');
    const { admin, logout } = useAdminAuth();

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Admin Dashboard</h1>
                <div className={styles.userInfo}>
                    <span>Welcome, {admin?.username}</span>
                    <button onClick={logout} className={styles.logoutBtn}>
                        Logout
                    </button>
                </div>
            </header>

            <nav className={styles.tabs}>
                <button
                    className={`${styles.tab} ${activeTab === 'metrics' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('metrics')}
                >
                    📊 Server Metrics
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'stats' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('stats')}
                >
                    📈 Statistics
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'logs' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('logs')}
                >
                    📝 API Logs
                </button>
            </nav>

            <main className={styles.content}>
                {activeTab === 'metrics' && <MetricsPanel />}
                {activeTab === 'stats' && <StatsPanel />}
                {activeTab === 'logs' && <ApiLogsPanel />}
            </main>
        </div>
    );
}
