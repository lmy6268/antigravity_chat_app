import { NextResponse } from 'next/server';
import { HTTP_STATUS } from '@/lib/constants/api';
import { dao } from '@/dao/supabase';
import bcrypt from 'bcryptjs';

/**
 * POST /api/admin/auth
 * 관리자 로그인
 */
export async function POST(request: Request) {
    try {
        const { username, password } = await request.json();

        if (!username || !password) {
            return NextResponse.json(
                { error: 'Username and password required' },
                { status: HTTP_STATUS.BAD_REQUEST },
            );
        }

        // 관리자 계정 조회
        const admin = await dao.admin.findByUsername(username);
        if (!admin) {
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: HTTP_STATUS.UNAUTHORIZED },
            );
        }

        // 비밀번호 검증
        const isValid = await bcrypt.compare(password, admin.password);
        if (!isValid) {
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: HTTP_STATUS.UNAUTHORIZED },
            );
        }

        // 비밀번호를 제외한 정보 반환
        const { password: _, ...adminData } = admin;

        return NextResponse.json({
            admin: adminData,
            message: 'Login successful',
        });
    } catch (error) {
        console.error('Admin auth error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
        );
    }
}
