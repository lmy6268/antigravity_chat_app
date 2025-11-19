import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const ROOMS_FILE = path.join(process.cwd(), 'data', 'rooms.json');

export async function POST(request: Request) {
  try {
    const { id, name, password, creator } = await request.json();

    if (!id || !name || !password || !creator) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Read existing rooms
    const roomsData = fs.readFileSync(ROOMS_FILE, 'utf8');
    const rooms = JSON.parse(roomsData);

    // Create new room
    rooms[id] = {
      id,
      name,
      creator,
      password, // Store plaintext for display
      createdAt: new Date().toISOString(),
      participants: [] // Will be populated by socket connections
    };

    // Save to file
    fs.writeFileSync(ROOMS_FILE, JSON.stringify(rooms, null, 2));

    return NextResponse.json({ room: rooms[id] }, { status: 201 });
  } catch (error) {
    console.error('Error creating room:', error);
    return NextResponse.json(
      { error: 'Failed to create room' },
      { status: 500 }
    );
  }
}
