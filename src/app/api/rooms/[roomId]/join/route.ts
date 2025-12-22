import { NextResponse } from 'next/server';
import { HTTP_STATUS } from '@/lib/constants/api';
import { roomModel } from '@/models/RoomModel';
import { userModel } from '@/models/UserModel';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ roomId: string }> },
) {
  try {
    const { roomId } = await params;

    const roomDTO = await roomModel.findById(roomId);

    if (!roomDTO) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: HTTP_STATUS.NOT_FOUND },
      );
    }

    return NextResponse.json({
      room: {
        id: roomDTO.id,
        name: roomDTO.name,
        salt: roomDTO.salt,
        encryptedKey: roomDTO.encrypted_key,
      },
    });
  } catch (error) {
    console.error('Error fetching room info:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> },
) {
  try {
    const { roomId } = await params;
    const { username, encryptedKey } = await request.json();

    if (!username) {
      return NextResponse.json(
        { error: 'Missing username' },
        { status: HTTP_STATUS.BAD_REQUEST },
      );
    }

    // Check if room exists
    const roomDTO = await roomModel.findById(roomId);
    if (!roomDTO) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: HTTP_STATUS.NOT_FOUND },
      );
    }

    // Get user
    const userDTO = await userModel.findByUsername(username);
    if (!userDTO) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: HTTP_STATUS.NOT_FOUND },
      );
    }

    // Add user to participants
    await roomModel.addParticipant(roomId, userDTO.id, username);

    return NextResponse.json({ success: true }, { status: HTTP_STATUS.OK });
  } catch (error) {
    console.error('Error joining room:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
