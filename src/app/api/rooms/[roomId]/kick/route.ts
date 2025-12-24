import { NextRequest, NextResponse } from 'next/server';
import { HTTP_STATUS } from '@/lib/constants/api';
import { roomModel } from '@/models/RoomModel';
import { userModel } from '@/models/UserModel';
import { dao } from '@/dao/supabase';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> },
) {
  try {
    const { roomId } = await params;
    const { targetUsername } = await request.json();

    if (!targetUsername) {
      return NextResponse.json(
        { error: 'Target username is required' },
        { status: HTTP_STATUS.BAD_REQUEST },
      );
    }

    // Get current user from header
    const userIdHeader =
      request.headers.get('x-user-id') ||
      request.headers.get('X-User-ID') ||
      request.headers.get('X-USER-ID');
    const currentUserId = userIdHeader ? userIdHeader.trim().toLowerCase() : null;

    if (!currentUserId) {
      return NextResponse.json(
        { error: 'Unauthorized: User ID required' },
        { status: HTTP_STATUS.UNAUTHORIZED },
      );
    }

    // Get room info
    const roomDTO = await roomModel.findById(roomId);
    if (!roomDTO) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: HTTP_STATUS.NOT_FOUND },
      );
    }

    // Check if current user is the creator
    const isCreator =
      roomDTO.creator_id?.toLowerCase().trim() === currentUserId ||
      roomDTO.creator_username?.toLowerCase().trim() === currentUserId;

    if (!isCreator) {
      return NextResponse.json(
        { error: 'Forbidden: Only the creator can kick participants' },
        { status: HTTP_STATUS.FORBIDDEN },
      );
    }

    // Get target user
    const targetUser = await userModel.findByUsername(targetUsername);
    if (!targetUser) {
      return NextResponse.json(
        { error: 'Target user not found' },
        { status: HTTP_STATUS.NOT_FOUND },
      );
    }

    // Prevent kicking the creator
    if (targetUser.id === roomDTO.creator_id) {
      return NextResponse.json(
        { error: 'Cannot kick the room creator' },
        { status: HTTP_STATUS.BAD_REQUEST },
      );
    }

    // Remove participant
    await dao.participant.remove(roomId, targetUser.id);

    return NextResponse.json(
      { success: true, message: `${targetUsername} has been kicked` },
      { status: HTTP_STATUS.OK },
    );
  } catch (error) {
    console.error('Error kicking participant:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to kick participant',
      },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}

