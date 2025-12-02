import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { TABLES, HTTP_STATUS } from '@/lib/constants';

export async function POST(request: Request) {
  try {
    const { id, name, password, creator, salt, encryptedKey } = await request.json();

    if (!id || !name || !password || !creator || !salt || !encryptedKey) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // 1. Insert new room with Open Chat data
    const { data: room, error: roomError } = await supabase
      .from(TABLES.ROOMS)
      .insert({
        id,
        name,
        creator_username: creator,
        password,
        salt,
        encrypted_key: encryptedKey
      })
      .select()
      .single();

    if (roomError) {
      console.error('Error creating room:', roomError);
      return NextResponse.json(
        { error: 'Failed to create room' },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    // 2. Add creator to participants with encrypted key
    // First get user ID
    const { data: user } = await supabase
      .from(TABLES.USERS)
      .select('id')
      .eq('username', creator)
      .single();

    if (user) {
      await supabase
        .from(TABLES.ROOM_PARTICIPANTS)
        .insert({
          room_id: id,
          user_id: user.id,
          username: creator
          // encrypted_key is now on the room table for Open Chat
        });
    }

    return NextResponse.json({ 
      room: {
        id: room.id,
        name: room.name,
        creator: room.creator_username,
        password: room.password,
        createdAt: room.created_at
      }
    }, { status: HTTP_STATUS.CREATED });
  } catch (error) {
    console.error('Error creating room:', error);
    return NextResponse.json(
      { error: 'Failed to create room' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}
