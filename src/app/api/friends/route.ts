import { NextResponse } from 'next/server';
import { HTTP_STATUS } from '@/lib/constants';
import { userModel } from '@/models/UserModel';
import { dao } from '@/dao/supabase';

// Friends는 Model이 없으므로 DAO를 직접 사용
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json({ error: 'Username required' }, { status: HTTP_STATUS.BAD_REQUEST });
    }

    const userDTO = await userModel.findByUsername(username);
    if (!userDTO) {
      return NextResponse.json({ error: 'User not found' }, { status: HTTP_STATUS.NOT_FOUND });
    }

    // Use DAO directly for friends
    const friendEntities = await dao.friend.findByUserId(userDTO.id);

    // Format response - simplified (full implementation would need join with users table)
    const formattedFriends = friendEntities.map(f => ({
      id: f.id,
      status: f.status,
      friendId: f.friend_id
    }));

    return NextResponse.json({ friends: formattedFriends });
  } catch (error) {
    console.error('Error fetching friends:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR });
  }
}

export async function POST(request: Request) {
  try {
    const { username, targetUsername } = await request.json();

    if (!username || !targetUsername) {
      return NextResponse.json({ error: 'Missing fields' }, { status: HTTP_STATUS.BAD_REQUEST });
    }

    if (username === targetUsername) {
      return NextResponse.json({ error: 'Cannot add yourself' }, { status: HTTP_STATUS.BAD_REQUEST });
    }

    // Get users
    const senderDTO = await userModel.findByUsername(username);
    const targetDTO = await userModel.findByUsername(targetUsername);

    if (!senderDTO || !targetDTO) {
      return NextResponse.json({ error: 'User not found' }, { status: HTTP_STATUS.NOT_FOUND });
    }

    // Create friend request using DAO
    await dao.friend.create({
      user_id: senderDTO.id,
      friend_id: targetDTO.id,
      status: 'pending'
    });

    return NextResponse.json({ message: 'Friend request sent' });
  } catch (error) {
    console.error('Error sending friend request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR });
  }
}
