import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { TABLES, HTTP_STATUS } from '@/lib/constants';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;

    //Read room from database with participants
    const { data: room, error } = await supabase
      .from(TABLES.ROOMS)
      .select(`
        *,
        participants:room_participants(username)
      `)
      .eq('id', roomId)
      .single();

    if (error || !room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: HTTP_STATUS.NOT_FOUND }
      );
    }

    // Transform participants data
    const participants = (room.participants as any[])?.map(p => p.username) || [];

    return NextResponse.json({ 
      room: {
        id: room.id,
        name: room.name,
        creator: room.creator_username,
        password: room.password,
        participants: participants,
        createdAt: room.created_at
      }
    }, { status: HTTP_STATUS.OK });
  } catch (error) {
    console.error('Error fetching room:', error);
    return NextResponse.json(
      { error: 'Failed to fetch room' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;

    // Delete room from database
    // CASCADE will automatically delete related messages and participants
    const { error } = await supabase
      .from(TABLES.ROOMS)
      .delete()
      .eq('id', roomId);

    if (error) {
      console.error('Error deleting room:', error);
      return NextResponse.json({ error: 'Room not found' }, { status: HTTP_STATUS.NOT_FOUND });
    }

    return NextResponse.json({ success: true }, { status: HTTP_STATUS.OK });
  } catch (error) {
    console.error('Error deleting room:', error);
    return NextResponse.json(
      { error: 'Failed to delete room' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}
