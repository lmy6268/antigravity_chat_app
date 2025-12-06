/**
 * Type Converters
 * Entity ↔ DTO ↔ UIModel 변환을 담당합니다.
 */

import type { UserEntity, RoomEntity, MessageEntity } from '../types/entities';
import type { UserDTO, RoomDTO, MessageDTO } from '../types/dto';
import type { UserUIModel, RoomUIModel, MessageUIModel } from '../types/uimodel';

// ============================================================================
// Entity → DTO Converters
// ============================================================================

export function userEntityToDTO(entity: UserEntity): UserDTO {
  return {
    id: entity.id,
    username: entity.username,
    public_key: entity.public_key,
    // password는 제외 (보안)
  };
}

export function roomEntityToDTO(entity: RoomEntity): RoomDTO {
  return {
    id: entity.id,
    name: entity.name,
    creator_id: entity.creator_id,
    creator_username: entity.creator_username,
    password: entity.password,
    salt: entity.salt,
    encrypted_key: entity.encrypted_key,
    created_at: entity.created_at, // Already a string from Supabase
  };
}

export function messageEntityToDTO(entity: MessageEntity): MessageDTO {
  return {
    id: entity.id,
    room_id: entity.room_id,
    iv: entity.iv,
    data: entity.data,
    created_at: entity.created_at, // Already a string from Supabase
  };
}

// ============================================================================
// DTO → UIModel Converters
// ============================================================================

export function userDTOToUIModel(dto: UserDTO): UserUIModel {
  return {
    id: dto.id,
    username: dto.username,
    displayName: `@${dto.username}`,
  };
}

export function roomDTOToUIModel(dto: RoomDTO, currentUserId?: string): RoomUIModel {
  return {
    id: dto.id,
    name: dto.name,
    creatorName: dto.creator_username,
    createdAt: formatRelativeTime(new Date(dto.created_at)),
    isCreator: currentUserId === dto.creator_id,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * 상대 시간 포맷팅 (예: "2시간 전", "방금 전")
 */
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days < 7) return `${days}일 전`;

  // 1주일 이상은 날짜 표시
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
