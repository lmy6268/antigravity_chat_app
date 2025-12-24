import { NextResponse } from 'next/server';
import { HTTP_STATUS } from '@/lib/constants/api';
import { roomModel } from '@/models/RoomModel';
import { userModel } from '@/models/UserModel';
import { dao } from '@/dao/supabase';
import { messageModel } from '@/models/MessageModel';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  try {
    const { username } = await params;

    // Get user first to ensure they exist
    const userDTO = await userModel.findByUsername(username);
    if (!userDTO) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: HTTP_STATUS.NOT_FOUND },
      );
    }

    // Get all rooms for this user (created or joined)
    const roomDTOs = await roomModel.findUserRooms(userDTO.id);

    // Transform to expected format (빈 배열 포함)
    const rooms = await Promise.all(
      (roomDTOs || []).map(async (room) => {
        const participants = await dao.participant.findByRoomId(room.id);
        const participantCount = participants.length;

        const messages = await messageModel.findByRoomId(room.id);
        const lastMessage = messages.length
          ? messages[messages.length - 1]
          : null;
        const lastMessageAt = lastMessage ? lastMessage.created_at : null;
        const lastMessagePreview = lastMessage ? '[encrypted]' : null; // 콘텐츠는 서버에 암호화되어 있음

        return {
          id: room.id,
          name: room.name,
          creator_id: room.creator_id,
          creator_username: room.creator_username,
          created_at: room.created_at,
          participantCount,
          lastMessageAt,
          lastMessagePreview,
        };
      }),
    );

    return NextResponse.json({ rooms }, { status: HTTP_STATUS.OK });
  } catch (error) {
    console.error('Error fetching user rooms:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user rooms' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
