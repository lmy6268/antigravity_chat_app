import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const USERS_FILE = path.join(process.cwd(), 'data', 'users.json');
const ROOMS_FILE = path.join(process.cwd(), 'data', 'rooms.json');

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;

    // Read users to get activeRooms
    const usersData = fs.readFileSync(USERS_FILE, 'utf8');
    const users = JSON.parse(usersData);
    
    const user = users.find((u: any) => u.username === username);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get room details for each active room
    const roomsData = fs.readFileSync(ROOMS_FILE, 'utf8');
    const allRooms = JSON.parse(roomsData);
    
    const userRooms = (user.activeRooms || []).map((roomId: string) => {
      const room = allRooms[roomId];
      if (room) {
        return {
          id: room.id,
          name: room.name,
          creator: room.creator
        };
      }
      return null;
    }).filter(Boolean);

    return NextResponse.json({ rooms: userRooms }, { status: 200 });
  } catch (error) {
    console.error('Error fetching user rooms:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rooms' },
      { status: 500 }
    );
  }
}
