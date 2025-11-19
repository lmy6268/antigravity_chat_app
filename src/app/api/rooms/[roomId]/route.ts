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

    return NextResponse.json({ room }, { status: 200 });
  } catch (error) {
    console.error('Error fetching room:', error);
    return NextResponse.json(
      { error: 'Failed to fetch room' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const USERS_FILE = path.join(process.cwd(), 'data', 'users.json');
    const MESSAGES_FILE = path.join(process.cwd(), 'data', 'messages.json');

    // 1. Remove from rooms.json
    const roomsData = fs.readFileSync(ROOMS_FILE, 'utf8');
    const rooms = JSON.parse(roomsData);
    
    if (!rooms[roomId]) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }
    
    delete rooms[roomId];
    fs.writeFileSync(ROOMS_FILE, JSON.stringify(rooms, null, 2));

    // 2. Remove from users.json (activeRooms)
    if (fs.existsSync(USERS_FILE)) {
      const usersData = fs.readFileSync(USERS_FILE, 'utf8');
      const users = JSON.parse(usersData);
      
      const updatedUsers = users.map((user: any) => ({
        ...user,
        activeRooms: (user.activeRooms || []).filter((id: string) => id !== roomId)
      }));
      
      fs.writeFileSync(USERS_FILE, JSON.stringify(updatedUsers, null, 2));
    }

    // 3. Remove from messages.json
    if (fs.existsSync(MESSAGES_FILE)) {
      const messagesData = fs.readFileSync(MESSAGES_FILE, 'utf8');
      const allMessages = JSON.parse(messagesData);
      
      if (allMessages[roomId]) {
        delete allMessages[roomId];
        fs.writeFileSync(MESSAGES_FILE, JSON.stringify(allMessages, null, 2));
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error deleting room:', error);
    return NextResponse.json(
      { error: 'Failed to delete room' },
      { status: 500 }
    );
  }
}
