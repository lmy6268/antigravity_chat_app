// 암호화 관련 상수
export const CRYPTO = {
  ALGORITHM: 'AES-GCM',
  HASH: 'SHA-256',
  KDF: 'PBKDF2',
  SALT: 'websocket-demo-salt',
  ITERATIONS: 100000,
  KEY_LENGTH: 256,
  IV_LENGTH: 12,
} as const;

/**
 * RSA 키 쌍 생성 (Identity Key)
 * @returns CryptoKeyPair (publicKey, privateKey)
 */
export async function generateKeyPair(): Promise<CryptoKeyPair> {
  if (
    typeof globalThis.crypto === 'undefined' ||
    !globalThis.crypto.subtle
  ) {
    throw new Error('Web Crypto API not available');
  }

  return globalThis.crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['encrypt', 'decrypt', 'wrapKey', 'unwrapKey'],
  );
}

/**
 * 비밀번호 해싱 (SHA-256)
 * 서버 사이드에서 비밀번호 일치 여부 확인 시 사용 (평문 저장 방지)
 */
export async function hashPassword(
  password: string,
  salt: string,
): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(password + salt);
  const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', data);
  return arrayBufferToBase64(hashBuffer);
}

/**
 * AES 키 생성 (Room Key)
 * @returns CryptoKey
 */
export async function generateRoomKey(): Promise<CryptoKey> {
  if (
    typeof globalThis.crypto === 'undefined' ||
    !globalThis.crypto.subtle
  ) {
    throw new Error('Web Crypto API not available');
  }

  return globalThis.crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt'],
  );
}

/**
 * 키 내보내기 (JWK 포맷)
 * @param key - 내보낼 키
 * @returns JWK 객체
 */
export async function exportKey(key: CryptoKey): Promise<JsonWebKey> {
  return globalThis.crypto.subtle.exportKey('jwk', key);
}

/**
 * 키 가져오기 (JWK 포맷)
 * @param jwk - 가져올 JWK 객체
 * @param algorithm - 알고리즘 ("RSA-OAEP" 또는 "AES-GCM")
 * @param usage - 사용 용도 (["encrypt"] 등)
 * @returns CryptoKey
 */
export async function importKey(
  jwk: JsonWebKey,
  algorithm:
    | string
    | RsaHashedImportParams
    | EcKeyImportParams
    | HmacImportParams,
  usage: KeyUsage[],
  extractable: boolean = true,
): Promise<CryptoKey> {
  // JWK의 key_ops가 있으면 요청된 usage와 충돌할 수 있으므로, 
  // usage 매개변수가 우선하도록 key_ops를 제거하거나 무시합니다.
  const { key_ops, ...jwkWithoutOps } = jwk;
  return globalThis.crypto.subtle.importKey(
    'jwk',
    jwkWithoutOps,
    algorithm,
    extractable,
    usage,
  );
}

/**
 * 키 래핑 (Room Key를 Public Key로 암호화)
 * @param keyToWrap - 암호화할 키 (Room Key)
 * @param wrappingKey - 암호화에 사용할 키 (Public Key)
 * @returns 암호화된 키 (Base64 문자열)
 */
export async function wrapKey(
  keyToWrap: CryptoKey,
  wrappingKey: CryptoKey,
): Promise<string> {
  const wrapped = await globalThis.crypto.subtle.wrapKey(
    'raw',
    keyToWrap,
    wrappingKey,
    { name: 'RSA-OAEP' } as AlgorithmIdentifier,
  );
  return arrayBufferToBase64(wrapped);
}

/**
 * 키 언래핑 (암호화된 Room Key를 Private Key로 복호화)
 * @param wrappedKeyStr - 암호화된 키 (Base64 문자열)
 * @param unwrappingKey - 복호화에 사용할 키 (Private Key)
 * @returns 복호화된 Room Key
 */
export async function unwrapKey(
  wrappedKeyStr: string,
  unwrappingKey: CryptoKey,
): Promise<CryptoKey> {
  const wrappedKey = base64ToArrayBuffer(wrappedKeyStr);
  return globalThis.crypto.subtle.unwrapKey(
    'raw',
    wrappedKey,
    unwrappingKey,
    { name: 'RSA-OAEP' } as AlgorithmIdentifier,
    { name: 'AES-GCM', length: 256 } as AlgorithmIdentifier,
    true,
    ['encrypt', 'decrypt'],
  );
}

/**
 * 암호화된 메시지 형식
 */
export interface EncryptedMessage {
  iv: number[];
  data: number[];
}

/**
 * 메시지 압축 (gzip)
 */
async function compress(data: Uint8Array): Promise<Uint8Array> {
  try {
    const cs = new CompressionStream('gzip');
    // Uint8Array.buffer is ArrayBufferLike, we cast to ArrayBuffer to satisfy BlobPart
    const blob = new Blob([data.buffer as ArrayBuffer]);
    const stream = blob.stream().pipeThrough(cs);
    const arrayBuffer = await new Response(stream).arrayBuffer();
    return new Uint8Array(arrayBuffer);
  } catch (e) {
    console.warn('Compression failed, falling back to raw', e);
    return data;
  }
}

/**
 * 메시지 압축 해제 (gzip)
 */
async function decompress(data: Uint8Array): Promise<Uint8Array> {
  const ds = new DecompressionStream('gzip');
  const blob = new Blob([data.buffer as ArrayBuffer]);
  const stream = blob.stream().pipeThrough(ds);
  const arrayBuffer = await new Response(stream).arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

/**
 * 메시지 암호화 (AES-GCM)
 * 압축 여부를 나타내는 플래그(1바이트)를 데이터 앞에 추가하여 암호화합니다.
 */
export async function encryptMessage(
  text: string,
  key: CryptoKey,
): Promise<EncryptedMessage> {
  if (
    typeof globalThis.crypto === 'undefined' ||
    !globalThis.crypto.subtle
  ) {
    throw new Error('Web Crypto API not available');
  }

  const enc = new TextEncoder();
  const rawData = enc.encode(text);

  // 압축 시도
  const compressedData = await compress(rawData);

  // 플래그 추가: 0x01 (Compressed), 0x00 (Raw - fallback)
  const isCompressed = compressedData.length < rawData.length;
  const flag = isCompressed ? 0x01 : 0x00;
  const dataToEncrypt = isCompressed ? compressedData : rawData;

  const payload = new Uint8Array(1 + dataToEncrypt.length);
  payload[0] = flag;
  payload.set(dataToEncrypt, 1);

  const iv = globalThis.crypto.getRandomValues(new Uint8Array(CRYPTO.IV_LENGTH));
  const encrypted = await globalThis.crypto.subtle.encrypt(
    { name: CRYPTO.ALGORITHM, iv: iv } as AesGcmParams,
    key,
    payload,
  );

  return {
    iv: Array.from(iv),
    data: Array.from(new Uint8Array(encrypted)),
  };
}

/**
 * 메시지 복호화 (AES-GCM)
 * 복호화 후 첫 바이트 플래그를 확인하여 압축을 해제합니다.
 */
export async function decryptMessage(
  ivArr: number[],
  dataArr: number[],
  key: CryptoKey,
): Promise<string> {
  if (
    typeof globalThis.crypto === 'undefined' ||
    !globalThis.crypto.subtle
  ) {
    throw new Error('Web Crypto API not available');
  }

  const iv = new Uint8Array(ivArr);
  const data = new Uint8Array(dataArr);
  const decrypted = await globalThis.crypto.subtle.decrypt(
    { name: CRYPTO.ALGORITHM, iv: iv } as AesGcmParams,
    key,
    data,
  );

  const decryptedArray = new Uint8Array(decrypted);
  const flag = decryptedArray[0];

  // 플래그에 따른 처리 (하위 호환성: 플래그가 없으면 JSON 형식의 '{' (0x7B)일 가능성 고려)
  let finalData: Uint8Array;

  if (flag === 0x01) {
    // Compressed
    finalData = await decompress(decryptedArray.slice(1));
  } else if (flag === 0x00) {
    // Raw with flag
    finalData = decryptedArray.slice(1);
  } else {
    // Legacy Raw (no flag, e.g. starts with '{')
    finalData = decryptedArray;
  }

  const dec = new TextDecoder();
  return dec.decode(finalData);
}

/**
 * 솔트 생성 (Random Salt)
 * @returns Base64 문자열
 */
export function generateSalt(): string {
  const salt = globalThis.crypto.getRandomValues(new Uint8Array(16));
  return arrayBufferToBase64(salt.buffer);
}

/**
 * 비밀번호에서 키 파생 (PBKDF2)
 * @param password - 사용자 입력 비밀번호
 * @param saltBase64 - Base64 솔트
 * @returns CryptoKey (AES-GCM Key Encryption Key)
 */
export async function deriveKeyFromPassword(
  password: string,
  saltBase64: string,
): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const passwordKey = await globalThis.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  );

  const salt = base64ToArrayBuffer(saltBase64);

  return globalThis.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt', 'wrapKey', 'unwrapKey'],
  );
}

/**
 * Room Key를 비밀번호로 암호화 (Open Chat용)
 * @param roomKey - 암호화할 Room Key
 * @param password - 비밀번호
 * @param salt - 솔트
 * @returns 암호화된 Room Key (Base64)
 */
export async function encryptRoomKeyWithPassword(
  roomKey: CryptoKey,
  password: string,
  salt: string,
): Promise<string> {
  const kek = await deriveKeyFromPassword(password, salt);

  // Export room key to raw bytes
  const rawRoomKey = await globalThis.crypto.subtle.exportKey('raw', roomKey);

  // Encrypt raw room key with KEK
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await globalThis.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    kek,
    rawRoomKey,
  );

  // Combine IV and Encrypted Data
  const combined = new Uint8Array(iv.length + new Uint8Array(encrypted).length);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);

  return arrayBufferToBase64(combined.buffer);
}

/**
 * 비밀번호로 Room Key 복호화 (Open Chat용)
 * @param encryptedRoomKeyBase64 - 암호화된 Room Key (Base64)
 * @param password - 비밀번호
 * @param salt - 솔트
 * @returns 복호화된 Room Key
 */
export async function decryptRoomKeyWithPassword(
  encryptedRoomKeyBase64: string,
  password: string,
  salt: string,
): Promise<CryptoKey> {
  const kek = await deriveKeyFromPassword(password, salt);
  const combined = base64ToArrayBuffer(encryptedRoomKeyBase64);
  const combinedArray = new Uint8Array(combined);

  // Extract IV and Data
  const iv = combinedArray.slice(0, 12);
  const data = combinedArray.slice(12);

  const decryptedRaw = await globalThis.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    kek,
    data,
  );

  return globalThis.crypto.subtle.importKey('raw', decryptedRaw, 'AES-GCM', true, [
    'encrypt',
    'decrypt',
  ]);
}

// 유틸리티 함수
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary_string = atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}
