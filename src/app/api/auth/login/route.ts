import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabase } from '@/lib/supabase';
import { TABLES, HTTP_STATUS } from '@/lib/constants';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: HTTP_STATUS.BAD_REQUEST });
    }

    // Find user by username
    const { data: user, error } = await supabase
      .from(TABLES.USERS)
      .select('id, username, password, public_key')
      .eq('username', username)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: HTTP_STATUS.UNAUTHORIZED });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: HTTP_STATUS.UNAUTHORIZED });
    }

    // Return user info. In a real app, return a JWT or session cookie.
    // For this demo, the client will store this in localStorage.
    return NextResponse.json({ 
      user: { 
        id: user.id, 
        username: user.username,
        publicKey: user.public_key
      } 
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR });
  }
}
