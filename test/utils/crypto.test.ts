import {
  deriveKeyFromPassword as deriveKey,
  encryptMessage,
  decryptMessage,
} from '../../src/lib/crypto';

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
      const salt = 'bW9ja1NhbHQ='; // base64 'mockSalt'
      const key = await deriveKey(password, salt);

      expect(mockSubtle.importKey).toHaveBeenCalledWith(
        'raw',
        expect.anything(), // Uint8Array or Buffer
        'PBKDF2',
        false,
        ['deriveKey'],
      );

      expect(mockSubtle.deriveKey).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'PBKDF2', iterations: 100000 }),
        'mockKeyMaterial',
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt', 'wrapKey', 'unwrapKey'],
      );

      expect(key).toBe('mockDerivedKey');
    });
  });

  describe('encryptMessage', () => {
    it('should encrypt message using AES-GCM and include compression flag', async () => {
      (mockSubtle.encrypt as jest.Mock).mockResolvedValue(new ArrayBuffer(10));

      const text =
        'Hello world! This is a test message to see if it encrypts correctly.';
      const key = 'mockKey' as any;

      const result = await encryptMessage(text, key);

      expect(mockSubtle.encrypt).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'AES-GCM', iv: expect.anything() }),
        key,
        expect.any(Uint8Array),
      );

      // Verify the payload sent to encrypt had the flag
      const lastCallArgs = (mockSubtle.encrypt as jest.Mock).mock.calls.slice(
        -1,
      )[0];
      const payload = lastCallArgs[2] as Uint8Array;
      expect(payload[0]).toBeLessThanOrEqual(1); // 0 or 1 flag

      expect(result).toHaveProperty('iv');
      expect(result).toHaveProperty('data');
      expect(result.iv).toHaveLength(12); // IV size
    });
  });

  describe('decryptMessage', () => {
    it('should decrypt raw message (flag 0x00)', async () => {
      // Create a raw message with 0x00 flag
      const rawText = 'Decrypted Text';
      const encodedText = new TextEncoder().encode(rawText);
      const payload = new Uint8Array(1 + encodedText.length);
      payload[0] = 0x00;
      payload.set(encodedText, 1);

      (mockSubtle.decrypt as jest.Mock).mockResolvedValue(payload.buffer);

      const iv = Array.from(new Uint8Array(12));
      const data = Array.from(new Uint8Array(10));
      const key = 'mockKey' as any;

      const result = await decryptMessage(iv, data, key);

      expect(result).toBe(rawText);
    });

    it('should decrypt legacy message (no flag)', async () => {
      // Legacy message starts with '{' (0x7B) normally
      const legacyText = '{"text": "legacy"}';
      const mockDecryptedBuffer = new TextEncoder().encode(legacyText).buffer;
      (mockSubtle.decrypt as jest.Mock).mockResolvedValue(mockDecryptedBuffer);

      const iv = Array.from(new Uint8Array(12));
      const data = Array.from(new Uint8Array(10));
      const key = 'mockKey' as any;

      const result = await decryptMessage(iv, data, key);
      expect(result).toBe(legacyText);
    });
  });
});
