import { NextResponse } from 'next/server';
import { HTTP_STATUS } from '@/lib/constants/api';
import { roomModel } from '@/models/RoomModel';
import { dao } from '@/dao/supabase';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> },
) {
  try {
    const { roomId } = await params;
    const userIdHeader =
      request.headers.get('x-user-id') ||
      request.headers.get('X-User-ID') ||
      request.headers.get('X-USER-ID');
    const userId = userIdHeader ? userIdHeader.trim().toLowerCase() : null;

    const roomDTO = await roomModel.findById(roomId);

    if (!roomDTO) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: HTTP_STATUS.NOT_FOUND },
      );
    }

    // Fetch participants
    const participants = await dao.participant.findByRoomId(roomId);
<<<<<<< HEAD

    const participantUsernames = participants.map(
      (p) => p.username || p.user_id,
    );

    // If requester is a participant, find their specific encrypted key
    let participantEncryptedKey = null;
    let MatchedParticipant = null;

    if (userId) {
      MatchedParticipant = participants.find((p) => {
        const pId = (p.user_id || '').trim().toLowerCase();
        const pUsername = (p.username || '').trim().toLowerCase();
        // Match against EITHER user_id (UUID) OR username
        return pId === userId || pUsername === userId;
      });

      if (MatchedParticipant) {
        participantEncryptedKey = MatchedParticipant.encrypted_key;
      }
    }

    const isCreator =
      roomDTO.creator_id?.toLowerCase().trim() === userId ||
      roomDTO.creator_username?.toLowerCase().trim() === userId;

    const debugInfo = {
      requestedUserId: userId,
      participantCount: participants.length,
      isParticipantMatch: !!MatchedParticipant,
      isCreatorMatch: isCreator,
      hasEncryptedKey: !!participantEncryptedKey,
      matchedAs: MatchedParticipant
        ? MatchedParticipant.user_id?.toLowerCase() === userId
          ? 'user_id'
          : 'username'
        : 'none',
      availableIds: participants.map((p) =>
        (p.user_id || '').trim().toLowerCase(),
      ),
      availableUsernames: participants.map((p) =>
        (p.username || '').trim().toLowerCase(),
      ),
    };
=======
    const participantUsernames = participants.map((p) => p.username || p.user_id);
>>>>>>> origin/develop

    return NextResponse.json(
      {
        room: {
          id: roomDTO.id,
          name: roomDTO.name,
          creator: roomDTO.creator_username,
          creatorId: roomDTO.creator_id,
          participants: participantUsernames,
          createdAt: roomDTO.created_at,
          salt: roomDTO.salt,
          encryptedKey: roomDTO.encrypted_key,
          encrypted_password: roomDTO.encrypted_password,
          participantEncryptedKey: participantEncryptedKey,
          isCreator: isCreator,
          debugInfo: debugInfo,
        },
      },
      { status: HTTP_STATUS.OK },
    );
  } catch (error) {
    console.error('Error fetching room:', error);
    return NextResponse.json(
      { error: 'Failed to fetch room' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> },
) {
  try {
    const { roomId } = await params;

    // Get user ID from header (temporary auth)
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized: User ID required' },
        { status: HTTP_STATUS.UNAUTHORIZED },
      );
    }

    // Verify room ownership
    const room = await roomModel.findById(roomId);
    if (!room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: HTTP_STATUS.NOT_FOUND },
      );
    }

    if (room.creator_id !== userId) {
      return NextResponse.json(
        { error: 'Forbidden: Only the creator can delete this room' },
        { status: HTTP_STATUS.FORBIDDEN },
      );
    }

    await roomModel.deleteRoom(roomId, userId);

    return NextResponse.json({ success: true }, { status: HTTP_STATUS.OK });
  } catch (error) {
    console.error('Error deleting room:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to delete room',
      },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
