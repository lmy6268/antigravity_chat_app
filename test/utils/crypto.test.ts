import { deriveKey, encryptMessage, decryptMessage } from '../../lib/crypto';

describe('Crypto Utils', () => {
  // Mock setup is handled in jest.setup.js
  const mockSubtle = window.crypto.subtle;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('deriveKey', () => {
    it('should call importKey and deriveKey with correct parameters', async () => {
      // Mock return values
      (mockSubtle.importKey as jest.Mock).mockResolvedValue('mockKeyMaterial');
      (mockSubtle.deriveKey as jest.Mock).mockResolvedValue('mockDerivedKey');

      const password = 'testPassword';
      const key = await deriveKey(password);

      expect(mockSubtle.importKey).toHaveBeenCalledWith(
        'raw',
        expect.anything(), // Uint8Array or Buffer
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
      );

      expect(mockSubtle.deriveKey).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'PBKDF2', iterations: 100000 }),
        'mockKeyMaterial',
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );

      expect(key).toBe('mockDerivedKey');
    });
  });

  describe('encryptMessage', () => {
    it('should encrypt message using AES-GCM', async () => {
      (mockSubtle.encrypt as jest.Mock).mockResolvedValue(new ArrayBuffer(10));
      
      const text = 'Hello';
      const key = 'mockKey' as any;
      
      const result = await encryptMessage(text, key);

      expect(mockSubtle.encrypt).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'AES-GCM', iv: expect.anything() }),
        key,
        expect.anything()
      );

      expect(result).toHaveProperty('iv');
      expect(result).toHaveProperty('data');
      expect(result.iv).toHaveLength(12); // IV size
    });
  });

  describe('decryptMessage', () => {
    it('should decrypt message using AES-GCM', async () => {
      const mockDecryptedBuffer = new TextEncoder().encode('Decrypted Text').buffer;
      (mockSubtle.decrypt as jest.Mock).mockResolvedValue(mockDecryptedBuffer);

      const iv = Array.from(new Uint8Array(12));
      const data = Array.from(new Uint8Array(10));
      const key = 'mockKey' as any;

      const result = await decryptMessage(iv, data, key);

      expect(mockSubtle.decrypt).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'AES-GCM', iv: expect.any(Uint8Array) }),
        key,
        expect.any(Uint8Array)
      );

      expect(result).toBe('Decrypted Text');
    });
  });
});

/**
 * 참고: 실제 암호화/복호화 테스트는 다음과 같이 작성할 수 있습니다:
 * (브라우저 환경 또는 적절한 polyfill 필요)
 * 
 * describe('E2E 암호화 테스트', () => {
 *   it('암호화 후 복호화하면 원본 메시지가 복원되어야 함', async () => {
 *     const password = 'testPassword123';
 *     const message = 'Hello, World!';
 *     
 *     const key = await deriveKey(password);
 *     const encrypted = await encryptMessage(message, key);
 *     const decrypted = await decryptMessage(encrypted.iv, encrypted.data, key);
 *     
 *     expect(decrypted).toBe(message);
 *   });
 *   
 *   it('잘못된 키로 복호화 시도 시 에러가 발생해야 함', async () => {
 *     const rightPassword = 'correct123';
 *     const wrongPassword = 'wrong456';
 *     const message = 'Secret';
 *     
 *     const rightKey = await deriveKey(rightPassword);
 *     const wrongKey = await deriveKey(wrongPassword);
 *     const encrypted = await encryptMessage(message, rightKey);
 *     
 *     await expect(
 *       decryptMessage(encrypted.iv, encrypted.data, wrongKey)
 *     ).rejects.toThrow();
 *   });
 * });
 */
