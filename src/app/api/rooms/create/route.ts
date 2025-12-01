import { NextResponse } from 'next/server';
import { supabase } from '../../../../../lib/supabase';

export async function POST(request: Request) {
  try {
    const { id, name, password, creator } = await request.json();

    if (!id || !name || !password || !creator) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Insert new room into database
    const { data: room, error } = await supabase
      .from('rooms')
      .insert({
        id,
        name,
        creator_username: creator,
        password
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating room:', error);
      return NextResponse.json(
        { error: 'Failed to create room' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      room: {
        id: room.id,
        name: room.name,
        creator: room.creator_username,
        password: room.password,
        createdAt: room.created_at
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating room:', error);
    return NextResponse.json(
      { error: 'Failed to create room' },
      { status: 500 }
    );
  }
}
