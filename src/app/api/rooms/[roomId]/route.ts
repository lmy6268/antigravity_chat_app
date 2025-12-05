import { NextResponse } from 'next/server';
import { HTTP_STATUS } from '@/lib/api-constants';
import { roomModel } from '@/models/RoomModel';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;

    const roomDTO = await roomModel.findById(roomId);
    
    if (!roomDTO) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: HTTP_STATUS.NOT_FOUND }
      );
    }

    // Note: participants would need a separate DAO method
    // For now, returning room without participants
    return NextResponse.json({ 
      room: {
        id: roomDTO.id,
        name: roomDTO.name,
        creator: roomDTO.creator_username,
        password: roomDTO.password,
        participants: [], // TODO: Add participants query
        createdAt: roomDTO.created_at,
        salt: roomDTO.salt,
        encryptedKey: roomDTO.encrypted_key
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
  _request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    
    // TODO: Add requester verification (only creator can delete)
    await roomModel.deleteRoom(roomId, 'user-id-placeholder');

    return NextResponse.json({ success: true }, { status: HTTP_STATUS.OK });
  } catch (error) {
    console.error('Error deleting room:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete room' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}
