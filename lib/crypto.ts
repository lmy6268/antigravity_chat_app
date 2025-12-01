/**
 * Web Crypto API를 사용한 암호화 유틸리티 함수들
 * AES-GCM + PBKDF2 기반 종단간 암호화
 */

/**
 * 비밀번호로부터 암호화 키 유도
 * @param password - 방 비밀번호
 * @returns CryptoKey - AES-GCM 암호화에 사용할 키
 */
export async function deriveKey(password: string): Promise<CryptoKey> {
  // crypto.subtle이 있는 브라우저 환경인지 확인
  if (typeof window === 'undefined') {
    throw new Error('Not running in browser environment');
  }
  
  if (!window.crypto) {
    throw new Error('window.crypto is not available');
  }
  
  if (!window.crypto.subtle) {
    // HTTP 대신 HTTPS를 사용하고 있는지 확인
    const protocol = window.location.protocol;
    if (protocol === 'http:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      throw new Error('Web Crypto API requires HTTPS or localhost');
    }
    throw new Error('crypto.subtle is not available in this browser');
  }
  
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  const salt = enc.encode("websocket-demo-salt"); 
  return window.crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * 메시지 암호화
 * @param text - 암호화할 평문 메시지
 * @param key - 암호화 키
 * @returns 암호화된 데이터 ({ iv, data })
 */
export async function encryptMessage(
  text: string, 
  key: CryptoKey
): Promise<{ iv: number[], data: number[] }> {
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    throw new Error('Web Crypto API not available');
  }
  
  const enc = new TextEncoder();
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    enc.encode(text)
  );
  return {
    iv: Array.from(iv),
    data: Array.from(new Uint8Array(encrypted))
  };
}

/**
 * 메시지 복호화
 * @param ivArr - Initialization Vector 배열
 * @param dataArr - 암호화된 데이터 배열
 * @param key - 복호화 키
 * @returns 복호화된 평문 메시지
 */
export async function decryptMessage(
  ivArr: number[], 
  dataArr: number[], 
  key: CryptoKey
): Promise<string> {
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    throw new Error('Web Crypto API not available');
  }
  
  const iv = new Uint8Array(ivArr);
  const data = new Uint8Array(dataArr);
  const decrypted = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv },
    key,
    data
  );
  const dec = new TextDecoder();
  return dec.decode(decrypted);
}
