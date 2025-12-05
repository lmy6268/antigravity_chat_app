import { NextResponse } from 'next/server';
import { HTTP_STATUS } from '@/lib/api-constants';
import { roomModel } from '@/models/RoomModel';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // Get room to check creator
    const roomDTO = await roomModel.findById(roomId);

    if (!roomDTO) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: HTTP_STATUS.NOT_FOUND }
      );
    }

    const isCreator = roomDTO.creator_username === username;

    return NextResponse.json({ isCreator }, { status: HTTP_STATUS.OK });
  } catch (error) {
    console.error('Error checking creator:', error);
    return NextResponse.json(
      { error: 'Failed to check creator status' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}
