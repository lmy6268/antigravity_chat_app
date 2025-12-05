/**
 * User Model - 사용자 비즈니스 로직
 * DAO를 사용하여 DB에 접근하고, Entity ↔ DTO 변환을 수행합니다.
 */

import { dao } from '../dao/supabase';
import { userEntityToDTO } from '../lib/converters';
import type { IUserDAO } from '../dao/interfaces';
import type { UserDTO, AuthResponseDTO } from '../types/dto';
import bcrypt from 'bcryptjs';

export class UserModel {
  constructor(private userDAO: IUserDAO = dao.user) {}

  /**
   * 사용자 인증
   */
  async authenticate(username: string, password: string): Promise<AuthResponseDTO | null> {
    const userEntity = await this.userDAO.findByUsername(username);
    if (!userEntity) return null;

    const isValid = await bcrypt.compare(password, userEntity.password);
    if (!isValid) return null;

    return {
      user: userEntityToDTO(userEntity)
    };
  }

  /**
   * 사용자 등록
   */
  async register(username: string, password: string, publicKey?: string): Promise<AuthResponseDTO> {
    // 중복 확인
    const existing = await this.userDAO.findByUsername(username);
    if (existing) {
      throw new Error('Username already exists');
    }

    // 비밀번호 해시화
    const hashedPassword = await bcrypt.hash(password, 10);

    const userEntity = await this.userDAO.create({
      username,
      password: hashedPassword,
      public_key: publicKey
    });

    return {
      user: userEntityToDTO(userEntity)
    };
  }

  /**
   * 사용자 조회 (username)
   */
  async findByUsername(username: string): Promise<UserDTO | null> {
    const userEntity = await this.userDAO.findByUsername(username);
    if (!userEntity) return null;
    return userEntityToDTO(userEntity);
  }

  /**
   * 사용자 조회 (id)
   */
  async findById(id: string): Promise<UserDTO | null> {
    const userEntity = await this.userDAO.findById(id);
    if (!userEntity) return null;
    return userEntityToDTO(userEntity);
  }
}

// 싱글톤 인스턴스
export const userModel = new UserModel();
