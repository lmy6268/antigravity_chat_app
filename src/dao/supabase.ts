/**
 * Supabase DAO Implementations
 * Entity 타입을 사용하여 DB와 통신합니다.
 */

import { supabase } from '../lib/supabase/client';
import type { PostgrestError } from '@supabase/supabase-js';
import { hashPassword } from '../lib/crypto';
import type {
  UserEntity,
  RoomEntity,
  MessageEntity,
  RoomParticipantEntity,
  FriendEntity,
  AdminEntity,
  ApiLogEntity,
} from '../types/entities';
import type {
  IUserDAO,
  IRoomDAO,
  IMessageDAO,
  IParticipantDAO,
  IFriendDAO,
  IAdminDAO,
  IApiLogDAO,
} from './interfaces';

// ============================================================================
// User DAO
// ============================================================================

export class UserDAO implements IUserDAO {
  async findByUsername(username: string): Promise<UserEntity | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (error) return null;
    return data;
  }

  async findById(id: string): Promise<UserEntity | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  }

  async searchByUsername(query: string): Promise<UserEntity[]> {
    if (!query || query.trim().length === 0) return [];

    const { data, error } = await supabase
      .from('users')
      .select('id, username, public_key, created_at, updated_at')
      .ilike('username', `%${query}%`)
      .limit(10);

    if (error) return [];
    return data;
  }

  async create(
    user: Omit<UserEntity, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<UserEntity> {
    const { data, error } = await supabase
      .from('users')
      .insert([user])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async update(id: string, user: Partial<UserEntity>): Promise<UserEntity> {
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
// Room DAO
// ============================================================================

export class RoomDAO implements IRoomDAO {
  async findById(roomId: string): Promise<RoomEntity | null> {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', roomId)
      .single();

    if (error) return null;
    return data;
  }

  async findByCreatorId(creatorId: string): Promise<RoomEntity[]> {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('creator_id', creatorId)
      .order('created_at', { ascending: false });

    if (error) return [];
    return data;
  }

  async create(room: RoomEntity): Promise<RoomEntity> {
    // 비밀번호 해싱 (평문 저장 방지)
    let hashedPassword = room.password;
    if (room.password && room.salt) {
      hashedPassword = await hashPassword(room.password, room.salt);
    }

    const { data, error } = await supabase
      .from('rooms')
      .insert({ ...room, password: hashedPassword })
      .select()
      .single();

    if (error) {
      console.error('Error creating room in DAO:', error);
      throw error;
    }
    return data;
  }

  async update(roomId: string, room: Partial<RoomEntity>): Promise<RoomEntity> {
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
    const { error } = await supabase.from('rooms').delete().eq('id', roomId);

    if (error) throw error;
  }
}

// ============================================================================
// Message DAO
// ============================================================================

export class MessageDAO implements IMessageDAO {
  async findByRoomId(roomId: string): Promise<MessageEntity[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true });

    if (error) return [];
    return data;
  }

  async create(
    message: Omit<MessageEntity, 'id' | 'created_at'>,
  ): Promise<MessageEntity> {
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
// Participant DAO
// ============================================================================

export class ParticipantDAO implements IParticipantDAO {
  async findByRoomId(roomId: string): Promise<RoomParticipantEntity[]> {
    const { data, error } = await supabase
      .from('room_participants')
      .select('*')
      .eq('room_id', roomId);

    if (error) return [];
    return data;
  }

  async findByUserId(userId: string): Promise<RoomParticipantEntity[]> {
    const { data, error } = await supabase
      .from('room_participants')
      .select('*')
      .eq('user_id', userId);

    if (error) return [];
    return data;
  }

  async findRoomIdsByUserId(userId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('room_participants')
      .select('room_id')
      .eq('user_id', userId);

    if (error) return [];
    return data.map((p) => p.room_id);
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

  async upsert(
    participant: Omit<RoomParticipantEntity, 'joined_at'>,
  ): Promise<RoomParticipantEntity> {
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
// Friend DAO
// ============================================================================

export class FriendDAO implements IFriendDAO {
  async findByUserId(userId: string): Promise<FriendEntity[]> {
    const { data, error } = await supabase
      .from('friends')
      .select('*')
      .eq('user_id', userId);

    if (error) return [];
    return data;
  }

  async findByFriendId(friendId: string): Promise<FriendEntity[]> {
    const { data, error } = await supabase
      .from('friends')
      .select('*')
      .eq('friend_id', friendId);

    if (error) return [];
    return data;
  }

  async create(
    friend: Omit<FriendEntity, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<FriendEntity> {
    const { data, error } = await supabase
      .from('friends')
      .insert([friend])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateStatus(
    friendId: string,
    status: 'pending' | 'accepted',
  ): Promise<FriendEntity> {
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
// Admin DAO
// ============================================================================

export class AdminDAO implements IAdminDAO {
  async findByUsername(username: string): Promise<AdminEntity | null> {
    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .eq('username', username)
      .single();

    if (error) return null;
    return data;
  }

  async findById(id: string): Promise<AdminEntity | null> {
    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  }

  async create(
    admin: Omit<AdminEntity, 'id' | 'created_at'>,
  ): Promise<AdminEntity> {
    const { data, error } = await supabase
      .from('admins')
      .insert([admin])
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

// ============================================================================
// API Log DAO
// ============================================================================

export class ApiLogDAO implements IApiLogDAO {
  async create(
    log: Omit<ApiLogEntity, 'id' | 'created_at'>,
  ): Promise<ApiLogEntity> {
    const { data, error } = await supabase
      .from('api_logs')
      .insert([log])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async findRecent(limit: number): Promise<ApiLogEntity[]> {
    const { data, error } = await supabase
      .from('api_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) return [];
    return data;
  }

  async findByPath(path: string, limit: number): Promise<ApiLogEntity[]> {
    const { data, error } = await supabase
      .from('api_logs')
      .select('*')
      .eq('path', path)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) return [];
    return data;
  }

  async findByIp(ip: string, limit: number): Promise<ApiLogEntity[]> {
    const { data, error } = await supabase
      .from('api_logs')
      .select('*')
      .eq('ip_address', ip)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) return [];
    return data;
  }

  async countTotal(): Promise<number> {
    const { count, error } = await supabase
      .from('api_logs')
      .select('*', { count: 'exact', head: true });

    if (error) return 0;
    return count || 0;
  }
}

// ============================================================================
// DAO Factory - 싱글톤 인스턴스
// ============================================================================

export const dao = {
  user: new UserDAO(),
  room: new RoomDAO(),
  message: new MessageDAO(),
  participant: new ParticipantDAO(),
  friend: new FriendDAO(),
  admin: new AdminDAO(),
  apiLog: new ApiLogDAO(),
} as const;
