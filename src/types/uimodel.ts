/**
 * UIModel Types - UI 표시용 객체
 * React 컴포넌트에서 직접 사용하는 UI 전용 모델입니다.
 */

// ============================================================================
// User UIModels
// ============================================================================

export interface UserUIModel {
  id: string;
  username: string;
  displayName: string; // @username 형식
}

// ============================================================================
// Room UIModels
// ============================================================================

export interface RoomUIModel {
  id: string;
  name: string;
  creatorName: string;
  createdAt: string; // 포맷된 날짜 (예: "2시간 전")
  isCreator: boolean; // 현재 사용자가 방장인지
  participantCount?: number;
  lastMessageAt?: string | null; // 상대 시각 포맷
  lastMessagePreview?: string | null;
}

export interface RoomListItemUIModel {
  id: string;
  name: string;
  creatorName: string;
}

// ============================================================================
// Message UIModels
// ============================================================================

export interface MessageUIModel {
  id: string;
  sender: string;
  text: string;
  isSystem: boolean;
  timestamp?: string; // 포맷된 시간
  isMine?: boolean; // 내가 보낸 메시지인지
}

// ============================================================================
// Friend UIModels
// ============================================================================

export interface FriendUIModel {
  id: string;
  username: string;
  displayName: string;
  status: 'pending' | 'accepted';
  statusText: string; // "친구 요청 대기 중" 등
}
