import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { TABLES, HTTP_STATUS } from '@/lib/constants';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json({ error: 'Username required' }, { status: HTTP_STATUS.BAD_REQUEST });
    }

    // Get user ID
    const { data: user } = await supabase
      .from(TABLES.USERS)
      .select('id')
      .eq('username', username)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: HTTP_STATUS.NOT_FOUND });
    }

    // Get friends (both sent and received)
    const { data: friends, error } = await supabase
      .from('friends')
      .select(`
        id,
        status,
        friend:users!friends_friend_id_fkey(username),
        user:users!friends_user_id_fkey(username)
      `)
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

    if (error) throw error;

    // Format response
    const formattedFriends = friends.map((f: any) => {
      const isSender = f.user.username === username;
      const friendUsername = isSender ? f.friend.username : f.user.username;
      return {
        id: f.id,
        username: friendUsername,
        status: f.status,
        isSender
      };
    });

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

    // Get IDs
    const { data: users } = await supabase
      .from(TABLES.USERS)
      .select('id, username')
      .in('username', [username, targetUsername]);

    const sender = users?.find(u => u.username === username);
    const target = users?.find(u => u.username === targetUsername);

    if (!sender || !target) {
      return NextResponse.json({ error: 'User not found' }, { status: HTTP_STATUS.NOT_FOUND });
    }

    // Check existing relationship
    const { data: existing } = await supabase
      .from('friends')
      .select('*')
      .or(`and(user_id.eq.${sender.id},friend_id.eq.${target.id}),and(user_id.eq.${target.id},friend_id.eq.${sender.id})`)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Relationship already exists' }, { status: HTTP_STATUS.CONFLICT });
    }

    // Create request
    const { error } = await supabase
      .from('friends')
      .insert({
        user_id: sender.id,
        friend_id: target.id,
        status: 'pending'
      });

    if (error) throw error;

    return NextResponse.json({ message: 'Friend request sent' });
  } catch (error) {
    console.error('Error sending friend request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR });
  }
}
