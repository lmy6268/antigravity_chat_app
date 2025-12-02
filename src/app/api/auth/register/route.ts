import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabase } from '@/lib/supabase';
import { TABLES, HTTP_STATUS } from '@/lib/constants';

export async function POST(request: Request) {
  try {
    const { username, password, publicKey } = await request.json();

    if (!username || !password || !publicKey) {
      return NextResponse.json({ error: 'Username, password, and public key are required' }, { status: HTTP_STATUS.BAD_REQUEST });
    }

    // Validation
    const usernameRegex = /^(?=.*[a-zA-Z])[a-zA-Z0-9]{6,}$/;
    if (!usernameRegex.test(username)) {
      return NextResponse.json({ 
        error: 'Username must be at least 6 characters long and contain at least one letter (alphanumeric only).' 
      }, { status: HTTP_STATUS.BAD_REQUEST });
    }

    const passwordRegex = /^[a-zA-Z0-9@!#$]{8,}$/;
    if (!passwordRegex.test(password)) {
      return NextResponse.json({ 
        error: 'Password must be at least 8 characters long and contain only letters, numbers, and @ ! # $' 
      }, { status: HTTP_STATUS.BAD_REQUEST });
    }

    // Check if user already exists
    const { data: existingUsers } = await supabase
      .from(TABLES.USERS)
      .select('username')
      .eq('username', username)
      .single();

    if (existingUsers) {
      return NextResponse.json({ error: 'User already exists' }, { status: HTTP_STATUS.CONFLICT });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const { error } = await supabase
      .from(TABLES.USERS)
      .insert({
        username,
        password: hashedPassword,
        public_key: publicKey
      });

    if (error) {
      console.error('Error creating user:', error);
      return NextResponse.json({ error: 'Failed to create user' }, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR });
    }

    return NextResponse.json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR });
  }
}
