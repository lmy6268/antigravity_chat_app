-- Supabase Database Schema for WebSocket Chat Application (Improved)
-- Run this in Supabase SQL Editor: https://app.supabase.com/project/_/sql

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  public_key TEXT, -- RSA Public Key (PEM format or JWK string)
  encrypted_private_key TEXT, -- Client-side encrypted RSA private key (Layer 2 Encryption by User Password)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- 2. Rooms Table (Using UUID for creator, storing username for display)
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  creator_username TEXT NOT NULL, -- Denormalized for easier querying
  password TEXT NOT NULL, -- Used to derive KEK
  salt TEXT, -- Random salt for KDF
  encrypted_key TEXT, -- Room Key encrypted with KEK (derived from password + salt)
  encrypted_password TEXT, -- Room Password encrypted with Room Master Key (Shared Vault)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rooms_creator_id ON rooms(creator_id);
CREATE INDEX IF NOT EXISTS idx_rooms_creator_username ON rooms(creator_username);
CREATE INDEX IF NOT EXISTS idx_rooms_created_at ON rooms(created_at DESC);

-- 3. Messages Table
CREATE TABLE IF NOT EXISTS messages (
  id BIGSERIAL PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  iv JSONB NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_room_id ON messages(room_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- 4. Room Participants Table (Junction Table with consistent UUID usage)
CREATE TABLE IF NOT EXISTS room_participants (
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  username TEXT NOT NULL, -- Denormalized for easier querying
  encrypted_key TEXT, -- Room Key encrypted with User's Public Key (Base64)
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (room_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_room_participants_user_id ON room_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_room_participants_username ON room_participants(username);

-- 5. Friends Table
CREATE TABLE IF NOT EXISTS friends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

CREATE INDEX IF NOT EXISTS idx_friends_user_id ON friends(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_friend_id ON friends(friend_id);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts on re-run)
DROP POLICY IF EXISTS "Service role bypass" ON users;
DROP POLICY IF EXISTS "Service role bypass" ON rooms;
DROP POLICY IF EXISTS "Service role bypass" ON messages;
DROP POLICY IF EXISTS "Service role bypass" ON room_participants;
DROP POLICY IF EXISTS "Service role bypass" ON friends;

-- Allow service role to bypass all policies
CREATE POLICY "Service role bypass" ON users FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role bypass" ON rooms FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role bypass" ON messages FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role bypass" ON room_participants FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role bypass" ON friends FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 7. Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. Triggers to auto-update updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_rooms_updated_at ON rooms;
CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON rooms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. Trigger to automatically delete room when creator leaves
CREATE OR REPLACE FUNCTION delete_room_if_creator_leaves()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the user leaving is the creator of the room
  IF EXISTS (
    SELECT 1 FROM rooms
    WHERE id = OLD.room_id AND creator_id = OLD.user_id
  ) THEN
    -- Delete the room (this will cascade to messages and other participants)
    DELETE FROM rooms WHERE id = OLD.room_id;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_participant_leave ON room_participants;
CREATE TRIGGER on_participant_leave
AFTER DELETE ON room_participants
FOR EACH ROW
EXECUTE FUNCTION delete_room_if_creator_leaves();
