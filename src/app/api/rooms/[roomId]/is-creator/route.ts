import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const ROOMS_FILE = path.join(process.cwd(), 'data', 'rooms.json');

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
        { error: 'Username required' },
        { status: 400 }
      );
    }

    // Read rooms
    const roomsData = fs.readFileSync(ROOMS_FILE, 'utf8');
    const rooms = JSON.parse(roomsData);

    const room = rooms[roomId];

    if (!room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    const isCreator = room.creator === username;

    return NextResponse.json({ isCreator }, { status: 200 });
  } catch (error) {
    console.error('Error checking creator:', error);
    return NextResponse.json(
      { error: 'Failed to check creator' },
      { status: 500 }
    );
  }
}
