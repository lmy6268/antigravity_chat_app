import { NextResponse } from 'next/server';
import { userModel } from '@/models/UserModel';
import { HTTP_STATUS } from '@/lib/api-constants';
import type { RegisterRequestDTO } from '@/types/dto';

export async function POST(request: Request) {
  try {
    const body: RegisterRequestDTO = await request.json();
    const { username, password, publicKey } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // Validation
    const usernameRegex = /^(?=.*[a-zA-Z])[a-zA-Z0-9]{6,}$/;
    if (!usernameRegex.test(username)) {
      return NextResponse.json(
        {
          error:
            'Username must be at least 6 characters long and contain at least one letter (alphanumeric only).',
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    const passwordRegex = /^[a-zA-Z0-9@!#$]{8,}$/;
    if (!passwordRegex.test(password)) {
      return NextResponse.json(
        {
          error:
            'Password must be at least 8 characters long and contain only letters, numbers, and @ ! # $',
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    try {
      const authResponse = await userModel.register(username, password, publicKey);
      return NextResponse.json({ message: 'User registered successfully', ...authResponse });
    } catch (error) {
      if ((error as Error).message === 'Username already exists') {
        return NextResponse.json(
          { error: 'User already exists' },
          { status: HTTP_STATUS.CONFLICT }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}
