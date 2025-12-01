import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabase } from '@/../../lib/supabase';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    // Check if user already exists
    const { data: existingUsers } = await supabase
      .from('users')
      .select('username')
      .eq('username', username)
      .single();

    if (existingUsers) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const { error } = await supabase
      .from('users')
      .insert({
        username,
        password: hashedPassword
      });

    if (error) {
      console.error('Error creating user:', error);
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }

    return NextResponse.json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
