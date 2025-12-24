import { NextResponse } from 'next/server';
import { userModel } from '@/models/UserModel';
import { HTTP_STATUS } from '@/lib/constants/api';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ users: [] });
    }

    const users = await userModel.searchUsers(query);

    // Remove sensitive data (password is already excluded in DTO but being extra safe)
    const sanitizedUsers = users.map((user) => ({
      id: user.id,
      username: user.username,
      public_key: user.public_key,
    }));

    return NextResponse.json({ users: sanitizedUsers });
  } catch (error) {
    console.error('User search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
