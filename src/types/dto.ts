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
  encryptedPrivateKey?: string; // Backup for cross-device sync
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
  encrypted_private_key?: string; // Backup for cross-device sync
}

// ============================================================================
// Room DTOs
// ============================================================================

export interface CreateRoomRequestDTO {
  id?: string;
  name: string;
  password: string;
  creator: string;
  salt: string;
  encrypted_key: string; // Key wrapped with room password
  participantEncryptedKey: string; // Key wrapped with creator's identity public key
  encryptedPassword?: string; // Password encrypted with Room Master Key (Shared Vault)
}

export interface RoomDTO {
  id: string;
  name: string;
  creator_id: string;
  creator_username: string;
  password: string; // 필요시 클라이언트에서 암호화 키 복호화에 사용
  salt?: string;
  encrypted_key?: string;
  encrypted_password?: string; // Password encrypted with Room Master Key
  created_at: string;
  participantCount?: number;
  lastMessageAt?: string | null;
  lastMessagePreview?: string | null;
}

export interface JoinRoomRequestDTO {
  username: string;
  password?: string;
  encryptedKey: string; // Key wrapped with participant's identity public key
}

// ============================================================================
// Message DTOs
// ============================================================================

export interface MessageDTO {
  id: number;
  room_id: string;
  iv: string; // Base64
  data: string; // Base64
  created_at: string;
}

export interface SendMessageRequestDTO {
  roomId: string;
  iv: string; // Base64
  data: string; // Base64
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
