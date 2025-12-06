import { NextResponse } from 'next/server';
import { HTTP_STATUS } from '@/lib/api-constants';
import { roomModel } from '@/models/RoomModel';
import { userModel } from '@/models/UserModel';
import type { CreateRoomRequestDTO } from '@/types/dto';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, name, password, creator, salt, encryptedKey } = body;

    if (!id || !name || !password || !creator || !salt || !encryptedKey) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // 1. Get user
    const userDTO = await userModel.findByUsername(creator);

    if (!userDTO) {
      return NextResponse.json({ error: 'User not found' }, { status: HTTP_STATUS.NOT_FOUND });
    }

    // 2. Create room (also adds creator as participant)
    const roomDTO = await roomModel.createRoom(
      id,
      name,
      userDTO.id,
      creator,
      password,
      salt,
      encryptedKey
    );

    return NextResponse.json(
      {
        room: {
          id: roomDTO.id,
          name: roomDTO.name,
          creator: roomDTO.creator_username,
          password: roomDTO.password,
          createdAt: roomDTO.created_at,
        },
      },
      { status: HTTP_STATUS.CREATED }
    );
  } catch (error) {
    console.error('Error creating room:', error);
    return NextResponse.json(
      { error: 'Failed to create room' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}
