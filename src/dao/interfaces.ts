/**
 * DAO Interfaces - 데이터베이스 접근 인터페이스
 * Entity를 다루며, DB 기술과 독립적입니다.
 */

import type {
  UserEntity,
  RoomEntity,
  MessageEntity,
  RoomParticipantEntity,
  FriendEntity,
  AdminEntity,
  ApiLogEntity,
} from '../types/entities';

// ============================================================================
// User DAO
// ============================================================================

export interface IUserDAO {
  findByUsername(username: string): Promise<UserEntity | null>;
  findById(id: string): Promise<UserEntity | null>;
  searchByUsername(query: string): Promise<UserEntity[]>;
  create(
    user: Omit<UserEntity, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<UserEntity>;
  update(id: string, user: Partial<UserEntity>): Promise<UserEntity>;
}

// ============================================================================
// Room DAO
// ============================================================================

export interface IRoomDAO {
  findById(roomId: string): Promise<RoomEntity | null>;
  findByCreatorId(creatorId: string): Promise<RoomEntity[]>;
  create(
    room: Omit<RoomEntity, 'created_at' | 'updated_at'>,
  ): Promise<RoomEntity>;
  update(roomId: string, room: Partial<RoomEntity>): Promise<RoomEntity>;
  delete(roomId: string): Promise<void>;
}

// ============================================================================
// Message DAO
// ============================================================================

export interface IMessageDAO {
  findByRoomId(roomId: string): Promise<MessageEntity[]>;
  create(
    message: Omit<MessageEntity, 'id' | 'created_at'>,
  ): Promise<MessageEntity>;
}

// ============================================================================
// Participant DAO
// ============================================================================

export interface IParticipantDAO {
  findByRoomId(roomId: string): Promise<RoomParticipantEntity[]>;
  findByUserId(userId: string): Promise<RoomParticipantEntity[]>;
  findRoomIdsByUserId(userId: string): Promise<string[]>;
  isParticipant(roomId: string, userId: string): Promise<boolean>;
  upsert(
    participant: Omit<RoomParticipantEntity, 'joined_at'>,
  ): Promise<RoomParticipantEntity>;
  remove(roomId: string, userId: string): Promise<void>;
}

// ============================================================================
// Friend DAO
// ============================================================================

export interface IFriendDAO {
  findByUserId(userId: string): Promise<FriendEntity[]>;
  findByFriendId(friendId: string): Promise<FriendEntity[]>;
  create(
    friend: Omit<FriendEntity, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<FriendEntity>;
  updateStatus(
    friendId: string,
    status: 'pending' | 'accepted',
  ): Promise<FriendEntity>;
  delete(friendId: string): Promise<void>;
}

// ============================================================================
// Admin DAO
// ============================================================================

export interface IAdminDAO {
  findByUsername(username: string): Promise<AdminEntity | null>;
  findById(id: string): Promise<AdminEntity | null>;
  create(admin: Omit<AdminEntity, 'id' | 'created_at'>): Promise<AdminEntity>;
}

// ============================================================================
// API Log DAO
// ============================================================================

export interface IApiLogDAO {
  create(log: Omit<ApiLogEntity, 'id' | 'created_at'>): Promise<ApiLogEntity>;
  findRecent(limit: number): Promise<ApiLogEntity[]>;
  findByPath(path: string, limit: number): Promise<ApiLogEntity[]>;
  findByIp(ip: string, limit: number): Promise<ApiLogEntity[]>;
  countTotal(): Promise<number>;
}
