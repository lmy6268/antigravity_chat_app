import { NextResponse } from 'next/server';
import { supabase } from '../../../../../../lib/supabase';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;

    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('username')
      .eq('username', username)
      .single();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
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
        { status: 500 }
      );
    }

    // Map to the expected format
    const userRooms = (participants || []).map((p: any) => ({
      id: p.rooms.id,
      name: p.rooms.name,
      creator: p.rooms.creator_username
    }));

    return NextResponse.json({ rooms: userRooms }, { status: 200 });
  } catch (error) {
    console.error('Error fetching user rooms:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rooms' },
      { status: 500 }
    );
  }
}
