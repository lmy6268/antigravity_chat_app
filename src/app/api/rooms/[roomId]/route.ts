import { NextResponse } from 'next/server';
import { HTTP_STATUS } from '@/lib/api-constants';
import { roomModel } from '@/models/RoomModel';
import { dao } from '@/dao/supabase';

export async function GET(_request: Request, { params }: { params: Promise<{ roomId: string }> }) {
  try {
    const { roomId } = await params;

    const roomDTO = await roomModel.findById(roomId);

    if (!roomDTO) {
      return NextResponse.json({ error: 'Room not found' }, { status: HTTP_STATUS.NOT_FOUND });
    }

    // Note: participants would need a separate DAO method
    // For now, returning room without participants

    // Fetch participants
    const participants = await dao.participant.findByRoomId(roomId);
    const participantUsernames = participants.map((p) => p.username || p.user_id);

    return NextResponse.json(
      {
        room: {
          id: roomDTO.id,
          name: roomDTO.name,
          creator: roomDTO.creator_username,
          password: roomDTO.password,
          participants: participantUsernames,
          createdAt: roomDTO.created_at,
          salt: roomDTO.salt,
          encryptedKey: roomDTO.encrypted_key,
        },
      },
      { status: HTTP_STATUS.OK }
    );
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

    // Get user ID from header (temporary auth)
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized: User ID required' },
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }

    // Verify room ownership
    const room = await roomModel.findById(roomId);
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: HTTP_STATUS.NOT_FOUND });
    }

    if (room.creator_id !== userId) {
      return NextResponse.json(
        { error: 'Forbidden: Only the creator can delete this room' },
        { status: HTTP_STATUS.FORBIDDEN }
      );
    }

    await roomModel.deleteRoom(roomId, userId);

    return NextResponse.json({ success: true }, { status: HTTP_STATUS.OK });
  } catch (error) {
    console.error('Error deleting room:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete room' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}
