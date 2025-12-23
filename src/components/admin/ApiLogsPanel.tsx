'use client';

import { useApiLogs } from '@/hooks/admin/useAdminData';
import styles from './ApiLogsPanel.module.css';

export default function ApiLogsPanel() {
  const { logs, isLoading } = useApiLogs(50);

  if (isLoading)
    return <div className={styles.loading}>Loading API logs...</div>;

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>API Call Logs</h2>
      <p className={styles.subtitle}>Recent 50 API calls</p>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Time</th>
              <th>Method</th>
              <th>Path</th>
              <th>Status</th>
              <th>IP Address</th>
              <th>Response Time</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td>{new Date(log.created_at).toLocaleString()}</td>
                <td>
                  <span
                    className={`${styles.method} ${styles[log.method.toLowerCase()]}`}
                  >
                    {log.method}
                  </span>
                </td>
                <td className={styles.path}>{log.path}</td>
                <td>
                  <span
                    className={`${styles.status} ${
                      log.status_code && log.status_code < 400
                        ? styles.success
                        : styles.error
                    }`}
                  >
                    {log.status_code || 'N/A'}
                  </span>
                </td>
                <td className={styles.ip}>{log.ip_address || 'N/A'}</td>
                <td>
                  {log.response_time_ms ? `${log.response_time_ms}ms` : 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
