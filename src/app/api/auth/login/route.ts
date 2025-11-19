import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const USERS_FILE = path.join(process.cwd(), 'data', 'users.json');

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    const fileData = fs.readFileSync(USERS_FILE, 'utf8');
    const users = JSON.parse(fileData);

    const user = users.find((u: any) => u.username === username);

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Return user info. In a real app, return a JWT or session cookie.
    // For this demo, the client will store this in localStorage.
    return NextResponse.json({ 
      user: { 
        id: user.id, 
        username: user.username 
      } 
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
