/**
 * Database Interface Definitions
 * 
 * 이 인터페이스들은 실제 DB 구현(Supabase, PostgreSQL 등)과 분리되어
 * 비즈니스 로직에서 사용할 수 있는 추상화 계층을 제공합니다.
 */

// ============================================================================
// Types
// ============================================================================

export interface User {
  id: string;
  username: string;
  password: string;
  public_key?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface Room {
  id: string;
  name: string;
  creator_id: string;
  creator_username: string;
  password: string;
  salt?: string;
  encrypted_key?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface Message {
  id: number;
  room_id: string;
  iv: number[];
  data: number[];
  created_at?: Date;
}

export interface RoomParticipant {
  room_id: string;
  user_id: string;
  username: string;
  encrypted_key?: string;
  joined_at?: Date;
}

export interface Friend {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted';
  created_at?: Date;
  updated_at?: Date;
}

// ============================================================================
// Repository Interfaces
// ============================================================================

export interface IUserRepository {
  findByUsername(username: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(user: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User>;
  update(id: string, user: Partial<User>): Promise<User>;
}

export interface IRoomRepository {
  findById(roomId: string): Promise<Room | null>;
  findByCreatorId(creatorId: string): Promise<Room[]>;
  findByParticipant(userId: string): Promise<Room[]>;
  create(room: Omit<Room, 'created_at' | 'updated_at'>): Promise<Room>;
  update(roomId: string, room: Partial<Room>): Promise<Room>;
  delete(roomId: string): Promise<void>;
}

export interface IMessageRepository {
  findByRoomId(roomId: string): Promise<Message[]>;
  create(message: Omit<Message, 'id' | 'created_at'>): Promise<Message>;
}

export interface IParticipantRepository {
  findByRoomId(roomId: string): Promise<RoomParticipant[]>;
  findByUserId(userId: string): Promise<RoomParticipant[]>;
  isParticipant(roomId: string, userId: string): Promise<boolean>;
  upsert(participant: Omit<RoomParticipant, 'joined_at'>): Promise<RoomParticipant>;
  remove(roomId: string, userId: string): Promise<void>;
}

export interface IFriendRepository {
  findByUserId(userId: string): Promise<Friend[]>;
  create(friend: Omit<Friend, 'id' | 'created_at' | 'updated_at'>): Promise<Friend>;
  updateStatus(friendId: string, status: 'pending' | 'accepted'): Promise<Friend>;
  delete(friendId: string): Promise<void>;
}
