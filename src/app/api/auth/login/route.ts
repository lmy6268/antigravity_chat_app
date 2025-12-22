import { NextResponse } from 'next/server';
import { userModel } from '@/models/UserModel';
import { HTTP_STATUS } from '@/lib/api-constants';
import type { LoginRequestDTO } from '@/types/dto';

export async function POST(request: Request) {
  try {
    const body: LoginRequestDTO = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: HTTP_STATUS.BAD_REQUEST },
      );
    }

    const authResponse = await userModel.authenticate(username, password);

    if (!authResponse) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: HTTP_STATUS.UNAUTHORIZED },
      );
    }

    // Return DTO
    return NextResponse.json(authResponse);
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
