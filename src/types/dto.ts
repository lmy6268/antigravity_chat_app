/**
 * DTO Types - API 전송용 객체
 * 클라이언트-서버 간 데이터 전송에 사용됩니다.
 * 보안을 위해 비밀번호 등 민감정보는 제외합니다.
 */

// ============================================================================
// Auth DTOs
// ============================================================================

export interface LoginRequestDTO {
  username: string;
  password: string;
}

export interface RegisterRequestDTO {
  username: string;
  password: string;
  publicKey?: string;
}

export interface AuthResponseDTO {
  user: UserDTO;
}

// ============================================================================
// User DTOs
// ============================================================================

export interface UserDTO {
  id: string;
  username: string;
  public_key?: string;
}

// ============================================================================
// Room DTOs
// ============================================================================

export interface CreateRoomRequestDTO {
  name: string;
  password: string;
  salt?: string;
  encrypted_key?: string;
}

export interface RoomDTO {
  id: string;
  name: string;
  creator_id: string;
  creator_username: string;
  password: string; // 필요시 클라이언트에서 암호화 키 복호화에 사용
  salt?: string;
  encrypted_key?: string;
  created_at: string;
  participantCount?: number;
  lastMessageAt?: string | null;
}

export interface JoinRoomRequestDTO {
  password: string;
}

// ============================================================================
// Message DTOs
// ============================================================================

export interface MessageDTO {
  id: number;
  room_id: string;
  iv: number[];
  data: number[];
  created_at: string;
}

export interface SendMessageRequestDTO {
  roomId: string;
  iv: number[];
  data: number[];
}

// ============================================================================
// Friend DTOs
// ============================================================================

export interface FriendDTO {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted';
}
