import { NextResponse } from 'next/server';
import { HTTP_STATUS } from '@/lib/api-constants';
import { roomModel } from '@/models/RoomModel';
import { userModel } from '@/models/UserModel';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;

    // Get user first to ensure they exist
    const userDTO = await userModel.findByUsername(username);
    if (!userDTO) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: HTTP_STATUS.NOT_FOUND }
      );
    }

    // Get all rooms for this user (created or joined)
    const roomDTOs = await roomModel.findUserRooms(userDTO.id);
    
    if (!roomDTOs || roomDTOs.length === 0) {
      return NextResponse.json(
        { error: 'No rooms found for this user' },
        { status: HTTP_STATUS.NOT_FOUND }
      );
    }

    // Transform to expected format
    const rooms = roomDTOs.map(room => ({
      id: room.id,
      name: room.name,
      creator_id: room.creator_id,
      creator_username: room.creator_username,
      created_at: room.created_at
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
