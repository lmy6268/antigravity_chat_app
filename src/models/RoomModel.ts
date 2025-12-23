/**
 * Room Model - 방 비즈니스 로직
 * DAO를 사용하여 DB에 접근하고, Entity ↔ DTO 변환을 수행합니다.
 */

import { dao } from '../dao/supabase';
import { roomEntityToDTO } from '../lib/converters';
import type { IRoomDAO, IParticipantDAO } from '../dao/interfaces';
import type { RoomDTO } from '../types/dto';

export class RoomModel {
  constructor(
    private roomDAO: IRoomDAO = dao.room,
    private participantDAO: IParticipantDAO = dao.participant,
  ) { }

  /**
   * 방 생성 및 참가자 등록
   */
  async createRoom(
    id: string,
    name: string,
    creatorId: string,
    creatorUsername: string,
    password: string,
    salt: string,
    encryptedKey: string,
    participantEncryptedKey: string,
  ): Promise<RoomDTO> {
    const roomEntity = await this.roomDAO.create({
      id,
      name,
      creator_id: creatorId,
      creator_username: creatorUsername,
      password,
      salt,
      encrypted_key: encryptedKey,
    });

    // 방장을 참가자로 등록
    await this.participantDAO.upsert({
      room_id: roomEntity.id,
      user_id: creatorId,
      username: creatorUsername,
      encrypted_key: participantEncryptedKey,
    });

    return roomEntityToDTO(roomEntity);
  }

  /**
   * 방 조회
   */
  async findById(roomId: string): Promise<RoomDTO | null> {
    const roomEntity = await this.roomDAO.findById(roomId);
    if (!roomEntity) return null;
    return roomEntityToDTO(roomEntity);
  }

  /**
   * 사용자가 생성/참여한 모든 방 조회
   */
  async findUserRooms(userId: string): Promise<RoomDTO[]> {
    // 생성한 방
    const createdRooms = await this.roomDAO.findByCreatorId(userId);

    // 참여한 방
    const participantRoomIds =
      await this.participantDAO.findRoomIdsByUserId(userId);
    const participantRooms = await Promise.all(
      participantRoomIds.map((id) => this.roomDAO.findById(id)),
    );

    // 중복 제거 및 DTO 변환
    const roomMap = new Map<string, RoomDTO>();
    createdRooms.forEach((room) => roomMap.set(room.id, roomEntityToDTO(room)));
    participantRooms.forEach((room) => {
      if (room) roomMap.set(room.id, roomEntityToDTO(room));
    });

    return Array.from(roomMap.values());
  }

  /**
   * 방 삭제
   */
  async deleteRoom(roomId: string, requesterId: string): Promise<void> {
    const roomEntity = await this.roomDAO.findById(roomId);
    if (!roomEntity) throw new Error('Room not found');

    // 방장만 삭제 가능
    if (roomEntity.creator_id !== requesterId) {
      throw new Error('Only creator can delete room');
    }

    await this.roomDAO.delete(roomId);
  }

  /**
   * 사용자가 방에 참여 권한이 있는지 확인
   */
  async canJoinRoom(roomId: string, userId: string): Promise<boolean> {
    const roomEntity = await this.roomDAO.findById(roomId);
    if (!roomEntity) return false;

    // 방장이거나 이미 참가자인 경우
    if (roomEntity.creator_id === userId) return true;

    return this.participantDAO.isParticipant(roomId, userId);
  }

  /**
   * 방에 참가자 추가
   */
  async addParticipant(
    roomId: string,
    userId: string,
    username: string,
    encryptedKey: string,
  ): Promise<void> {
    await this.participantDAO.upsert({
      room_id: roomId,
      user_id: userId,
      username,
      encrypted_key: encryptedKey,
    });
  }
}

// 싱글톤 인스턴스
export const roomModel = new RoomModel();
