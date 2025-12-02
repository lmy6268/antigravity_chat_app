import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { TABLES, HTTP_STATUS } from '@/lib/constants';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;

    const { data: room, error } = await supabase
      .from(TABLES.ROOMS)
      .select('id, name, salt, encrypted_key')
      .eq('id', roomId)
      .single();

    if (error || !room) {
      return NextResponse.json({ error: 'Room not found' }, { status: HTTP_STATUS.NOT_FOUND });
    }

    return NextResponse.json({
      room: {
        id: room.id,
        name: room.name,
        salt: room.salt,
        encryptedKey: room.encrypted_key
      }
    });
  } catch (error) {
    console.error('Error fetching room info:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const { username, encryptedKey } = await request.json();

    if (!username) {
      return NextResponse.json(
        { error: 'Missing username' },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // Check if room exists
    const { data: room, error: roomError } = await supabase
      .from(TABLES.ROOMS)
      .select('id')
      .eq('id', roomId)
      .single();

    if (roomError || !room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: HTTP_STATUS.NOT_FOUND }
      );
    }

    // Get user ID
    const { data: user, error: userError } = await supabase
      .from(TABLES.USERS)
      .select('id')
      .eq('username', username)
      .single();

    if (userError || !user) {
      console.error('Error finding user:', userError);
      return NextResponse.json(
        { error: 'User not found' },
        { status: HTTP_STATUS.NOT_FOUND }
      );
    }

    // Add user to participants
    const { error: joinError } = await supabase
      .from(TABLES.ROOM_PARTICIPANTS)
      .upsert({
        room_id: roomId,
        user_id: user.id,
        username: username,
        encrypted_key: encryptedKey // Optional, for future use if we switch back to per-user keys
      });

    if (joinError) {
      console.error('Error joining room:', joinError);
      console.error('Join data attempted:', { roomId, username, userId: user.id });
      return NextResponse.json(
        { error: 'Failed to join room', details: joinError },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    return NextResponse.json({ success: true }, { status: HTTP_STATUS.OK });

  } catch (error) {
    console.error('Error joining room:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}
