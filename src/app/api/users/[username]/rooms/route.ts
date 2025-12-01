import { NextResponse } from 'next/server';
import { supabase } from '../../../../../../lib/supabase';
import { TABLES, MESSAGES, HTTP_STATUS } from '../../../../../../lib/constants';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;

    // Get rooms created by the user
    const { data: rooms, error } = await supabase
      .from(TABLES.ROOMS)
      .select('id, name, creator_username')
      .eq('creator_username', username);
    
    if (error || !rooms || rooms.length === 0) {
      return NextResponse.json(
        { error: 'No rooms found for this user or failed to fetch' },
        { status: HTTP_STATUS.NOT_FOUND }
      );
    }

    // Get rooms where user is a participant
    const { data: participants, error: participantsError } = await supabase
      .from('room_participants')
      .select('room_id, rooms(id, name, creator_username)')
      .eq('username', username);

    if (participantsError) {
      console.error('Error fetching user rooms:', participantsError);
      return NextResponse.json(
        { error: 'Failed to fetch rooms' },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    // Map to the expected format
    const userRooms = (participants || []).map((p: any) => ({
      id: p.rooms.id,
      name: p.rooms.name,
      creator: p.rooms.creator_username
    }));

    return NextResponse.json({ rooms }, { status: HTTP_STATUS.OK });
  } catch (error) {
    console.error('Error fetching user rooms:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user rooms' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}
