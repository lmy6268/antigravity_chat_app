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
