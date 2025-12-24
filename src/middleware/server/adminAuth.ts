/**
 * Admin Authentication Middleware
 * 관리자 API 엔드포인트 인증 미들웨어
 */

import { NextResponse } from 'next/server';
import { HTTP_STATUS } from '@/lib/constants/api';
import { dao } from '@/dao/supabase';
import type { AdminEntity } from '@/types/admin';
import { verifyAdminToken } from '@/lib/auth/adminToken';

/**
 * 관리자 인증 결과 타입
 */
export interface AdminAuthResult {
  success: boolean;
  admin?: AdminEntity;
  error?: string;
}

/**
 * 요청에서 관리자 인증 정보를 추출하고 검증
 * Authorization 헤더에서 Bearer JWT 토큰을 받아 검증합니다.
 */
export async function verifyAdminAuth(
  request: Request,
): Promise<AdminAuthResult> {
  try {
    // Authorization 헤더에서 Bearer 토큰 추출
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return {
        success: false,
        error: 'Authorization header is required',
      };
    }

    if (!authHeader.startsWith('Bearer ')) {
      return {
        success: false,
        error: 'Bearer token is required',
      };
    }

    const token = authHeader.substring(7).trim();

    if (!token) {
      return {
        success: false,
        error: 'Admin token is required',
      };
    }

    // JWT 토큰 검증
    const verification = verifyAdminToken(token);
    if (!verification.valid || !verification.adminId) {
      return {
        success: false,
        error: verification.error || 'Invalid admin token',
      };
    }

    // 관리자 존재 여부 확인
    const admin = await dao.admin.findById(verification.adminId);

    if (!admin) {
      return {
        success: false,
        error: 'Invalid admin credentials',
      };
    }

    return {
      success: true,
      admin,
    };
  } catch (error) {
    console.error('Admin auth verification error:', error);
    return {
      success: false,
      error: 'Authentication failed',
    };
  }
}

/**
 * 관리자 인증이 필요한 API 핸들러 래퍼
 * 인증 실패 시 401 응답을 반환합니다.
 */
export async function withAdminAuth<T>(
  request: Request,
  handler: (request: Request, admin: AdminEntity) => Promise<T>,
): Promise<NextResponse<T> | NextResponse<{ error: string }>> {
  const authResult = await verifyAdminAuth(request);

  if (!authResult.success || !authResult.admin) {
    return NextResponse.json(
      { error: authResult.error || 'Unauthorized' },
      { status: HTTP_STATUS.UNAUTHORIZED },
    );
  }

  try {
    const result = await handler(request, authResult.admin);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Handler error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}

