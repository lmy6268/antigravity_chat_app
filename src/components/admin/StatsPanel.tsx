'use client';

import { useAdminStats } from '@/hooks/admin/useAdminData';
import styles from './StatsPanel.module.css';

export default function StatsPanel() {
  const { stats, isLoading } = useAdminStats();

  if (isLoading)
    return <div className={styles.loading}>Loading statistics...</div>;
  if (!stats)
    return <div className={styles.error}>Failed to load statistics</div>;

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>System Statistics</h2>
      <p className={styles.subtitle}>Metadata only - no user data exposed</p>

      <div className={styles.grid}>
        <div className={styles.statCard}>
          <div className={styles.icon}>👥</div>
          <div className={styles.statValue}>{stats.totalUsers}</div>
          <div className={styles.statLabel}>Total Users</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.icon}>💬</div>
          <div className={styles.statValue}>{stats.totalRooms}</div>
          <div className={styles.statLabel}>Total Rooms</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.icon}>📨</div>
          <div className={styles.statValue}>{stats.totalMessages}</div>
          <div className={styles.statLabel}>Total Messages</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.icon}>🔌</div>
          <div className={styles.statValue}>{stats.totalApiCalls}</div>
          <div className={styles.statLabel}>API Calls</div>
        </div>
      </div>
    </div>
  );
}
