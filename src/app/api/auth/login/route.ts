import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabase } from '@/../../lib/supabase';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    // Find user by username
    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, password')
      .eq('username', username)
      .single();

    if (error || !user) {
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
