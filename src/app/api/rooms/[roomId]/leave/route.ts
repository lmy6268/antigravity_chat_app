import { NextRequest, NextResponse } from 'next/server';
import { dao } from '@/dao/supabase';
import { userModel } from '@/models/UserModel';
import { roomModel } from '@/models/RoomModel';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const { username } = await request.json();

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    const userDTO = await userModel.findByUsername(username);
    if (!userDTO) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is creator
    const roomDTO = await roomModel.findById(roomId);
    if (roomDTO && roomDTO.creator_id === userDTO.id) {
      // User is creator, delete the room
      await roomModel.deleteRoom(roomId, userDTO.id);
      return NextResponse.json({ success: true, action: 'room_deleted' });
    } else {
      // User is participant, remove from list
      await dao.participant.remove(roomId, userDTO.id);
      return NextResponse.json({ success: true, action: 'participant_removed' });
    }
  } catch (error) {
    console.error('Error leaving room:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
