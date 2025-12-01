# 종단간 암호화 (E2EE) 가이드

## 🔐 종단간 암호화란?

**종단간 암호화(End-to-End Encryption, E2EE)**는 송신자와 수신자만이 메시지를 읽을 수 있도록 하는 보안 방식입니다. 중간의 서버나 제3자는 암호화된 데이터만 볼 수 있습니다.

## 🆚 일반 암호화 vs 종단간 암호화

### 일반적인 HTTPS 통신
```
[사용자A] --암호화--> [서버] --복호화/재암호화--> [사용자B]
                        ⬆️
                   서버가 평문 확인 가능
```

### 종단간 암호화 (E2EE)
```
[사용자A] --암호화----------------------복호화--> [사용자B]
                  ⬇️
              [서버]
         (암호화된 데이터만 처리)
```

## 🎯 이 프로젝트의 암호화 구조

### 사용된 암호화 알고리즘

1. **PBKDF2** (Password-Based Key Derivation Function 2)
   - 비밀번호에서 암호화 키를 생성
   - 무차별 대입 공격 방어 (느린 해싱)

2. **AES-GCM** (Advanced Encryption Standard - Galois/Counter Mode)
   - 대칭키 암호화 알고리즘
   - 빠르고 안전함
   - 인증(Authentication) 기능 포함

### 암호화 흐름

```
1. 사용자 입력: "안녕하세요"
2. 방 비밀번호: "myPassword123"
   
3. PBKDF2로 키 유도:
   - 입력: "myPassword123"
   - Salt: "websocket-demo-salt" (고정)
   - Iterations: 100,000회
   - 출력: 256-bit 암호화 키
   
4. AES-GCM 암호화:
   - 평문: "안녕하세요"
   - 키: (3에서 생성된 키)
   - IV: (랜덤 12바이트)
   - 출력: { iv: [...], data: [...] }
   
5. 서버로 전송: { iv, data }
6. 서버는 DB에 저장 (암호화된 상태)
7. 서버가 다른 사용자들에게 브로드캐스트
8. 수신자가 같은 비밀번호로 키 유도
9. 복호화: "안녕하세요"
```

## 💻 코드 구현

### 1. 키 유도 (PBKDF2)

```typescript
async function deriveKey(password: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  
  // 1단계: 비밀번호를 키 재료로 변환
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  
  // 2단계: 고정 salt (실제 프로덕션에서는 사용자별 salt 권장)
  const salt = enc.encode("websocket-demo-salt");
  
  // 3단계: PBKDF2로 AES 키 유도
  return await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,  // 100,000회 반복
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },  // 256비트 AES 키
    false,
    ["encrypt", "decrypt"]
  );
}
```

**왜 PBKDF2를 사용하나요?**
- 사용자 비밀번호는 짧고 예측 가능할 수 있음
- PBKDF2는 많은 반복(100,000회)을 통해 무차별 대입 공격을 어렵게 만듦
- Salt를 사용하여 레인보우 테이블 공격 방어

### 2. 메시지 암호화 (AES-GCM)

```typescript
async function encryptMessage(
  text: string, 
  key: CryptoKey
): Promise<{ iv: number[], data: number[] }> {
  const enc = new TextEncoder();
  
  // 1. 랜덤 IV (Initialization Vector) 생성
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  
  // 2. AES-GCM으로 암호화
  const encrypted = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv  // 매번 다른 IV 사용 (중요!)
    },
    key,
    enc.encode(text)
  );
  
  // 3. 결과를 전송 가능한 형태로 변환
  return {
    iv: Array.from(iv),
    data: Array.from(new Uint8Array(encrypted))
  };
}
```

**IV (Initialization Vector)가 중요한 이유:**
- 같은 평문, 같은 키라도 매번 다른 암호문 생성
- 패턴 분석 공격 방어
- IV는 공개되어도 안전함 (암호문과 함께 전송)

### 3. 메시지 복호화

```typescript
async function decryptMessage(
  ivArr: number[], 
  dataArr: number[], 
  key: CryptoKey
): Promise<string> {
  // 1. 배열을 Uint8Array로 변환
  const iv = new Uint8Array(ivArr);
  const data = new Uint8Array(dataArr);
  
  // 2. AES-GCM으로 복호화
  const decrypted = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv
    },
    key,
    data
  );
  
  // 3. 바이트 배열을 문자열로 변환
  const dec = new TextDecoder();
  return dec.decode(decrypted);
}
```

## 🔍 보안 분석

### ✅ 장점

1. **서버 보안 침해에도 안전**
   - 서버가 해킹당해도 평문 메시지 노출 안 됨
   - DB에 저장된 데이터는 모두 암호화됨

2. **전송 중 안전**
   - HTTPS 위에 추가 암호화 레이어
   - 중간자 공격에도 메시지 내용 보호

3. **브라우저 네이티브 API 사용**
   - Web Crypto API는 브라우저에 내장
   - 별도 라이브러리 불필요
   - 하드웨어 가속 지원 (빠름)

### ⚠️ 현재 구현의 한계

1. **고정 Salt**
   ```typescript
   const salt = enc.encode("websocket-demo-salt");
   ```
   - 모든 사용자가 같은 salt 사용
   - **개선**: 방마다 다른 salt 사용 권장

2. **비밀번호 공유 방식**
   - 방 비밀번호를 알면 누구나 복호화 가능
   - **개선**: 공개키 암호화(RSA)로 키 교환 고려

3. **메타데이터 노출**
   - 누가 언제 메시지를 보냈는지는 서버가 알 수 있음
   - **개선**: 완전한 익명성 원하면 Tor 등 사용

## 🛡️ 보안 Best Practices

### 1. HTTPS는 필수

```typescript
if (!window.crypto.subtle) {
  if (protocol === 'http:' && hostname !== 'localhost') {
    throw new Error('HTTPS 필요!');
  }
}
```

Web Crypto API는 HTTPS 환경에서만 사용 가능 (보안상 이유)

### 2. 키를 메모리에만 보관

```typescript
// ❌ 나쁜 예
localStorage.setItem('cryptoKey', key);  // 절대 하지 마세요!

// ✅ 좋은 예
const [cryptoKey, setCryptoKey] = useState<CryptoKey | null>(null);
// 메모리에만 보관, 세션 종료 시 자동 삭제
```

### 3. 비밀번호 강도 검증

```typescript
function validatePassword(password: string): boolean {
  // 최소 8자, 대/소문자, 숫자, 특수문자 포함
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return regex.test(password);
}
```

### 4. 암호화 실패 시 예외 처리

```typescript
try {
  const encrypted = await encryptMessage(text, key);
  socket.emit('message', encrypted);
} catch (error) {
  console.error('암호화 실패:', error);
  // 사용자에게 알림
  alert('메시지 암호화 중 오류가 발생했습니다.');
}
```

## 📊 성능 고려사항

### 1. 비동기 처리

암호화/복호화는 비동기 작업입니다:

```typescript
// ❌ 잘못된 사용
const encrypted = encryptMessage(text, key);  // Promise 반환
socket.emit('message', encrypted);  // Promise 전송됨!

// ✅ 올바른 사용
const encrypted = await encryptMessage(text, key);
socket.emit('message', encrypted);
```

### 2. 대용량 데이터

텍스트 메시지는 빠르지만, 파일은 청크 단위로 처리 권장:

```typescript
async function encryptFile(file: File, key: CryptoKey) {
  const chunkSize = 64 * 1024;  // 64KB 청크
  const chunks = [];
  
  for (let offset = 0; offset < file.size; offset += chunkSize) {
    const chunk = file.slice(offset, offset + chunkSize);
    const encrypted = await encryptMessage(await chunk.text(), key);
    chunks.push(encrypted);
  }
  
  return chunks;
}
```

## 🧪 테스트 예제

### 암호화/복호화 테스트

```typescript
async function testEncryption() {
  const password = "testPassword123";
  const message = "Hello, World!";
  
  // 1. 키 생성
  const key = await deriveKey(password);
  
  // 2. 암호화
  const encrypted = await encryptMessage(message, key);
  console.log("암호화됨:", encrypted);
  // { iv: [123, 45, ...], data: [67, 89, ...] }
  
  // 3. 복호화
  const decrypted = await decryptMessage(
    encrypted.iv, 
    encrypted.data, 
    key
  );
  console.log("복호화됨:", decrypted);
  // "Hello, World!"
  
  // 4. 검증
  console.assert(message === decrypted, "실패!");
}
```

### 잘못된 키로 복호화 시도

```typescript
async function testWrongPassword() {
  const rightPassword = "correct123";
  const wrongPassword = "wrong456";
  const message = "Secret Message";
  
  const rightKey = await deriveKey(rightPassword);
  const wrongKey = await deriveKey(wrongPassword);
  
  const encrypted = await encryptMessage(message, rightKey);
  
  try {
    const decrypted = await decryptMessage(
      encrypted.iv, 
      encrypted.data, 
      wrongKey
    );
    console.log("복호화 성공?!", decrypted);  // 실행되지 않음
  } catch (error) {
    console.log("복호화 실패 (정상):", error);
    // The operation failed for an operation-specific reason
  }
}
```

## 🎓 핵심 개념 정리

### 대칭키 vs 비대칭키

**대칭키 암호화 (이 프로젝트에서 사용)**
- 암호화 키 = 복호화 키
- 빠름
- 키 공유 문제 (어떻게 안전하게 전달?)

**비대칭키 암호화 (RSA 등)**
- 공개키로 암호화, 개인키로 복호화
- 느림
- 키 공유 불필요

### Salt의 역할

```typescript
// Salt 없이
hash("password123")  → "abc123xyz..."

// Salt 사용
hash("password123" + "randomSalt1")  → "def456uvw..."
hash("password123" + "randomSalt2")  → "ghi789rst..."
```

- 같은 비밀번호라도 다른 해시 생성
- 레인보우 테이블 공격 방어

### IV (Initialization Vector)

```typescript
// 같은 평문, 같은 키
encrypt("Hello", key, iv1)  → "Xk7p9..."
encrypt("Hello", key, iv2)  → "Zm3q2..."
```

- 패턴 분석 방지
- 매번 랜덤 생성
- 암호화 강도 향상

## 📚 추가 학습 자료

- [Web Crypto API MDN 문서](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [PBKDF2 설명](https://en.wikipedia.org/wiki/PBKDF2)
- [AES-GCM 설명](https://en.wikipedia.org/wiki/Galois/Counter_Mode)
- [OWASP 암호화 가이드](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)

## 💡 핵심 요약

1. **E2EE**: 송신자와 수신자만 메시지 읽을 수 있음
2. **PBKDF2**: 비밀번호 → 안전한 암호화 키
3. **AES-GCM**: 빠르고 안전한 대칭키 암호화
4. **IV**: 매번 달라야 함 (패턴 분석 방어)
5. **Web Crypto API**: 브라우저 네이티브, HTTPS 필수
6. **메타데이터**: 서버는 누가 언제 보냈는지는 알 수 있음
7. **키 관리**: 메모리에만 보관, 절대 저장하지 않음
