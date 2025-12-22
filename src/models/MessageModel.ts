/**
 * Message Model - 메시지 비즈니스 로직
 * DAO를 사용하여 DB에 접근하고, Entity ↔ DTO 변환을 수행합니다.
 */

import { dao } from '../dao/supabase';
import { messageEntityToDTO } from '../lib/converters';
import type { IMessageDAO } from '../dao/interfaces';
import type { MessageDTO } from '../types/dto';

export class MessageModel {
  constructor(private messageDAO: IMessageDAO = dao.message) {}

  /**
   * 방의 모든 메시지 조회
   */
  async findByRoomId(roomId: string): Promise<MessageDTO[]> {
    const entities = await this.messageDAO.findByRoomId(roomId);
    return entities.map(messageEntityToDTO);
  }

  /**
   * 메시지 생성
   */
  async createMessage(
    roomId: string,
    iv: number[],
    data: number[],
  ): Promise<MessageDTO> {
    const entity = await this.messageDAO.create({
      room_id: roomId,
      iv,
      data,
    });
    return messageEntityToDTO(entity);
  }
}

// 싱글톤 인스턴스
export const messageModel = new MessageModel();
