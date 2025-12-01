import { NextResponse } from 'next/server';
import { supabase } from '../../../../../../lib/supabase';
import { TABLES, MESSAGES, HTTP_STATUS } from '../../../../../../lib/constants';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // Check if user is the creator of the room
    const { data: room, error } = await supabase
      .from(TABLES.ROOMS)
      .select('creator_username')
      .eq('id', roomId)
      .single();

    if (error || !room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: HTTP_STATUS.NOT_FOUND }
      );
    }

    const isCreator = room.creator_username === username;

    return NextResponse.json({ isCreator }, { status: HTTP_STATUS.OK });
  } catch (error) {
    console.error('Error checking creator:', error);
    return NextResponse.json(
      { error: 'Failed to check creator status' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}
