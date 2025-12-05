/**
 * Supabase Implementation of Repository Interfaces
 * 
 * Supabase-specific 구현체입니다. 다른 DB로 교체하려면
 * 이 파일을 새로운 구현체로 대체하면 됩니다.
 */

import { supabase } from '../supabase';
import type {
  User,
  Room,
  Message,
  RoomParticipant,
  Friend,
  IUserRepository,
  IRoomRepository,
  IMessageRepository,
  IParticipantRepository,
  IFriendRepository
} from './interface';

// ============================================================================
// User Repository
// ============================================================================

export class SupabaseUserRepository implements IUserRepository {
  async findByUsername(username: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();
    
    if (error) return null;
    return data;
  }

  async findById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) return null;
    return data;
  }

  async create(user: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert([user])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async update(id: string, user: Partial<User>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update(user)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
}

// ============================================================================
// Room Repository
// ============================================================================

export class SupabaseRoomRepository implements IRoomRepository {
  async findById(roomId: string): Promise<Room | null> {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', roomId)
      .single();
    
    if (error) return null;
    return data;
  }

  async findByCreatorId(creatorId: string): Promise<Room[]> {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('creator_id', creatorId)
      .order('created_at', { ascending: false });
    
    if (error) return [];
    return data;
  }

  async findByParticipant(userId: string): Promise<Room[]> {
    const { data, error } = await supabase
      .from('room_participants')
      .select('room_id')
      .eq('user_id', userId);
    
    if (error || !data) return [];
    
    const roomIds = data.map(p => p.room_id);
    if (roomIds.length === 0) return [];
    
    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .select('*')
      .in('id', roomIds)
      .order('created_at', { ascending: false });
    
    if (roomsError) return [];
    return rooms;
  }

  async create(room: Omit<Room, 'created_at' | 'updated_at'>): Promise<Room> {
    const { data, error } = await supabase
      .from('rooms')
      .insert([room])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async update(roomId: string, room: Partial<Room>): Promise<Room> {
    const { data, error } = await supabase
      .from('rooms')
      .update(room)
      .eq('id', roomId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async delete(roomId: string): Promise<void> {
    const { error } = await supabase
      .from('rooms')
      .delete()
      .eq('id', roomId);
    
    if (error) throw error;
  }
}

// ============================================================================
// Message Repository
// ============================================================================

export class SupabaseMessageRepository implements IMessageRepository {
  async findByRoomId(roomId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true });
    
    if (error) return [];
    return data;
  }

  async create(message: Omit<Message, 'id' | 'created_at'>): Promise<Message> {
    const { data, error } = await supabase
      .from('messages')
      .insert([message])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
}

// ============================================================================
// Participant Repository
// ============================================================================

export class SupabaseParticipantRepository implements IParticipantRepository {
  async findByRoomId(roomId: string): Promise<RoomParticipant[]> {
    const { data, error } = await supabase
      .from('room_participants')
      .select('*')
      .eq('room_id', roomId);
    
    if (error) return [];
    return data;
  }

  async findByUserId(userId: string): Promise<RoomParticipant[]> {
    const { data, error } = await supabase
      .from('room_participants')
      .select('*')
      .eq('user_id', userId);
    
    if (error) return [];
    return data;
  }

  async isParticipant(roomId: string, userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('room_participants')
      .select('room_id')
      .eq('room_id', roomId)
      .eq('user_id', userId)
      .single();
    
    return !error && data !== null;
  }

  async upsert(participant: Omit<RoomParticipant, 'joined_at'>): Promise<RoomParticipant> {
    const { data, error } = await supabase
      .from('room_participants')
      .upsert([participant], { onConflict: 'room_id,user_id' })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async remove(roomId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('room_participants')
      .delete()
      .eq('room_id', roomId)
      .eq('user_id', userId);
    
    if (error) throw error;
  }
}

// ============================================================================
// Friend Repository
// ============================================================================

export class SupabaseFriendRepository implements IFriendRepository {
  async findByUserId(userId: string): Promise<Friend[]> {
    const { data, error } = await supabase
      .from('friends')
      .select('*')
      .eq('user_id', userId);
    
    if (error) return [];
    return data;
  }

  async create(friend: Omit<Friend, 'id' | 'created_at' | 'updated_at'>): Promise<Friend> {
    const { data, error } = await supabase
      .from('friends')
      .insert([friend])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateStatus(friendId: string, status: 'pending' | 'accepted'): Promise<Friend> {
    const { data, error } = await supabase
      .from('friends')
      .update({ status })
      .eq('id', friendId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async delete(friendId: string): Promise<void> {
    const { error } = await supabase
      .from('friends')
      .delete()
      .eq('id', friendId);
    
    if (error) throw error;
  }
}

// ============================================================================
// Factory - 싱글톤 인스턴스 생성
// ============================================================================

export const repositories = {
  user: new SupabaseUserRepository(),
  room: new SupabaseRoomRepository(),
  message: new SupabaseMessageRepository(),
  participant: new SupabaseParticipantRepository(),
  friend: new SupabaseFriendRepository()
};
