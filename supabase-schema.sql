-- Supabase Database Schema for WebSocket Chat Application (Hybrid Encryption)
-- Run this in Supabase SQL Editor: https://app.supabase.com/project/_/sql

-- 1. Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  public_key TEXT, -- RSA Public Key (PEM format or JWK string)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_username ON users(username);

-- 2. Rooms Table
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  creator_username TEXT NOT NULL REFERENCES users(username) ON DELETE CASCADE,
  password TEXT NOT NULL, -- Used to derive KEK
  salt TEXT, -- Random salt for KDF
  encrypted_key TEXT, -- Room Key encrypted with KEK (derived from password + salt)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rooms_creator ON rooms(creator_username);
CREATE INDEX idx_rooms_created_at ON rooms(created_at DESC);

-- 3. Messages Table
CREATE TABLE messages (
  id BIGSERIAL PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  iv JSONB NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_room_id ON messages(room_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

-- 4. Room Participants Table (Junction Table)
CREATE TABLE room_participants (
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  username TEXT NOT NULL REFERENCES users(username) ON DELETE CASCADE,
  encrypted_key TEXT, -- Room Key encrypted with User's Public Key (Base64)
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (room_id, username)
);

CREATE INDEX idx_room_participants_username ON room_participants(username);

-- 5. Friends Table
CREATE TABLE friends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

CREATE INDEX idx_friends_user_id ON friends(user_id);
CREATE INDEX idx_friends_friend_id ON friends(friend_id);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;

-- Allow service role to bypass all policies
CREATE POLICY "Service role bypass" ON users FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role bypass" ON rooms FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role bypass" ON messages FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role bypass" ON room_participants FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role bypass" ON friends FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 6. Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. Triggers to auto-update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON rooms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
