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

    // 1. Get user ID for the creator
    const { data: user, error: userError } = await supabase
      .from(TABLES.USERS)
      .select('id')
      .eq('username', creator)
      .single();

    if (userError || !user) {
      console.error('Error finding user:', userError);
      return NextResponse.json(
        { error: 'User not found' },
        { status: HTTP_STATUS.NOT_FOUND }
      );
    }

    // 2. Insert new room with creator_id and creator_username
    const { data: room, error: roomError } = await supabase
      .from(TABLES.ROOMS)
      .insert({
        id,
        name,
        creator_id: user.id,
        creator_username: creator,
        password,
        salt,
        encrypted_key: encryptedKey
      })
      .select()
      .single();

    if (roomError) {
      console.error('Error creating room:', roomError);
      console.error('Room data attempted:', { id, name, creator, password, salt, encryptedKey });
      return NextResponse.json(
        { error: 'Failed to create room', details: roomError },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    // 3. Add creator to participants with user_id
    const { error: participantError } = await supabase
      .from(TABLES.ROOM_PARTICIPANTS)
      .insert({
        room_id: id,
        user_id: user.id,
        username: creator
        // encrypted_key is now on the room table for Open Chat
      });

    if (participantError) {
      console.error('Error adding creator to participants:', participantError);
      // Non-fatal, room is created, just log the error
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
