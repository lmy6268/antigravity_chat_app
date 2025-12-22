/**
 * Friend Types - 친구 관련 타입 정의
 * API 응답 및 UI에서 사용됩니다.
 */

export interface Friend {
    id: string;
    friendId: string;
    username: string;
    publicKey?: string;
    status: 'pending' | 'accepted';
    createdAt: string;
    isSender: boolean
}
