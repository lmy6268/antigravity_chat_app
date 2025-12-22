'use client';

import { useServerMetrics } from '@/hooks/admin/useAdminData';
import styles from './MetricsPanel.module.css';

export default function MetricsPanel() {
    const { metrics, isLoading } = useServerMetrics(5000);

    if (isLoading) return <div className={styles.loading}>Loading metrics...</div>;
    if (!metrics) return <div className={styles.error}>Failed to load metrics</div>;

    const formatUptime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
    };

    return (
        <div className={styles.container}>
            <h2 className={styles.title}>Real-time Server Metrics</h2>
            <p className={styles.subtitle}>Auto-refreshes every 5 seconds</p>

            <div className={styles.grid}>
                <div className={styles.card}>
                    <h3 className={styles.cardTitle}>💾 Memory Usage</h3>
                    <div className={styles.metrics}>
                        <div className={styles.metric}>
                            <span className={styles.label}>RSS:</span>
                            <span className={styles.value}>{metrics.memoryUsage.rss} MB</span>
                        </div>
                        <div className={styles.metric}>
                            <span className={styles.label}>Heap Total:</span>
                            <span className={styles.value}>{metrics.memoryUsage.heapTotal} MB</span>
                        </div>
                        <div className={styles.metric}>
                            <span className={styles.label}>Heap Used:</span>
                            <span className={styles.value}>{metrics.memoryUsage.heapUsed} MB</span>
                        </div>
                        <div className={styles.metric}>
                            <span className={styles.label}>External:</span>
                            <span className={styles.value}>{metrics.memoryUsage.external} MB</span>
                        </div>
                    </div>
                </div>

                <div className={styles.card}>
                    <h3 className={styles.cardTitle}>⚡ CPU Usage</h3>
                    <div className={styles.metrics}>
                        <div className={styles.metric}>
                            <span className={styles.label}>User:</span>
                            <span className={styles.value}>{metrics.cpuUsage.user} ms</span>
                        </div>
                        <div className={styles.metric}>
                            <span className={styles.label}>System:</span>
                            <span className={styles.value}>{metrics.cpuUsage.system} ms</span>
                        </div>
                    </div>
                </div>

                <div className={styles.card}>
                    <h3 className={styles.cardTitle}>⏱️ Server Uptime</h3>
                    <div className={styles.bigValue}>{formatUptime(metrics.uptime)}</div>
                </div>
            </div>
        </div>
    );
}
