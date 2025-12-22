import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { serverLogger } from '../lib/logger/server';

// Load environment variables early
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

export interface ServerConfig {
    dev: boolean;
    hostname: string;
    port: number;
    ssl?: {
        certPath: string;
        keyPath: string;
    };
}

const isDev = process.env.NODE_ENV !== 'production';

/**
 * 개발 환경 설정
 */
const devConfig: ServerConfig = {
    dev: true,
    hostname: '0.0.0.0', // 맥북 IP로 접속 가능하게 설정
    port: parseInt(process.env.PORT || '8080', 10),
    ssl: {
        certPath: process.env.SSL_CERT_PATH || path.resolve(process.cwd(), 'src/server/certs/server.crt'),
        keyPath: process.env.SSL_KEY_PATH || path.resolve(process.cwd(), 'src/server/certs/server.key'),
    },
};

/**
 * 운영 환경 설정
 */
const prodConfig: ServerConfig = {
    dev: false,
    hostname: '0.0.0.0', // 원격 서버에서 모든 IP 바인딩
    port: parseInt(process.env.PORT || '443', 10),
    // 운영 환경에서는 보통 Reverse Proxy(Nginx 등)가 SSL을 처리하므로 일단 비워둠
};

/**
 * 현재 환경에 맞는 설정을 반환
 */
export const config: ServerConfig = isDev ? devConfig : prodConfig;

/**
 * SSL 인증서가 유효한지 확인하고 옵션을 반환하는 유틸리티
 */
export function getHttpsOptions() {
    if (!config.ssl) return null;

    const { certPath, keyPath } = config.ssl;

    // 절대 경로로 변환하여 확인
    const resolvedCertPath = path.resolve(certPath);
    const resolvedKeyPath = path.resolve(keyPath);

    if (fs.existsSync(resolvedCertPath) && fs.existsSync(resolvedKeyPath)) {
        try {
            return {
                key: fs.readFileSync(resolvedKeyPath),
                cert: fs.readFileSync(resolvedCertPath),
            };
        } catch (error) {
            serverLogger.error(`SSL 파일을 읽는 중 오류 발생: ${error instanceof Error ? error.message : String(error)}`);
            return null;
        }
    } else {
        serverLogger.warn(`SSL 파일을 찾을 수 없습니다: \n  Cert: ${resolvedCertPath}\n  Key: ${resolvedKeyPath}`);
    }

    return null;
}

