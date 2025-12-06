/**
 * Entity Types - DB 테이블 구조
 * DAO 내부에서만 사용됩니다.
 * Supabase는 timestamps를 string으로 반환합니다.
 */

export interface UserEntity {
  id: string;
  username: string;
  password: string;
  public_key?: string;
  created_at: string; // Supabase returns ISO string
  updated_at: string;
}

export interface RoomEntity {
  id: string;
  name: string;
  creator_id: string;
  creator_username: string;
  password: string;
  salt?: string;
  encrypted_key?: string;
  created_at: string; // Supabase returns ISO string
  updated_at: string;
}

export interface MessageEntity {
  id: number;
  room_id: string;
  iv: number[];
  data: number[];
  created_at: string; // Supabase returns ISO string
}

export interface RoomParticipantEntity {
  room_id: string;
  user_id: string;
  username: string;
  encrypted_key?: string;
  joined_at: string; // Supabase returns ISO string
}

export interface FriendEntity {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted';
  created_at: string; // Supabase returns ISO string
  updated_at: string;
}
