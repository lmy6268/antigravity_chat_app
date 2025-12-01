import { NextResponse } from 'next/server';
import { supabase } from '@/../../lib/supabase';

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
        { error: 'Username required' },
        { status: 400 }
      );
    }

    // Query room from database
    const { data: room, error } = await supabase
      .from('rooms')
      .select('creator_username')
      .eq('id', roomId)
      .single();

    if (error || !room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    const isCreator = room.creator_username === username;

    return NextResponse.json({ isCreator }, { status: 200 });
  } catch (error) {
    console.error('Error checking creator:', error);
    return NextResponse.json(
      { error: 'Failed to check creator' },
      { status: 500 }
    );
  }
}
