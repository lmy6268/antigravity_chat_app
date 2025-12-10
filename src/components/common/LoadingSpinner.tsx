import React from 'react';
import styles from './loading-spinner.module.css';

interface LoadingSpinnerProps {
  size?: number;
  color?: string;
  className?: string; // 추가적인 스타일링을 위해
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 24,
  color = '#0070f3',
  className = '',
}) => {
  return (
    <div
      className={`${styles.spinner} ${className}`}
      style={{
        width: size,
        height: size,
        borderTopColor: color,
        borderRightColor: color,
        borderBottomColor: color,
        borderLeftColor: 'transparent', // 투명한 부분이 돌아가는 효과를 줌
        borderWidth: size * 0.1, // 크기에 비례하여 두께 조절
      }}
      role="status"
      aria-label="loading"
    />
  );
};
