# WebSocket 채팅 앱 개발 작업 일지

**날짜**: 2025년 12월 2일  
**프로젝트**: Next.js WebSocket 채팅 애플리케이션

---

## 🔧 해결한 주요 문제

### 1. 환경 변수 로딩 문제
**문제**: 서버가 `.env.local` 파일을 찾지 못해 Supabase 환경 변수를 읽지 못함
- 에러 메시지: `Missing Supabase environment variables!`

**해결책**:
- `dotenv` 패키지 설치
- `server.js` 맨 위에 환경 변수 로딩 코드 추가:
  ```javascript
  require('dotenv').config({ path: '.env.local' });
  ```

**결과**: ✅ 서버가 `.env.local`에서 3개의 환경 변수를 성공적으로 로드

---

### 2. Import 경로 오류
**문제**: 6개의 API 라우트에서 Supabase 클라이언트 import 경로가 잘못됨
- 에러 메시지: `Module not found: Can't resolve '@/../../lib/supabase'`
- 잘못된 경로: `@/../../lib/supabase`

**영향받은 파일**:
- `src/app/api/auth/register/route.ts`
- `src/app/api/auth/login/route.ts`
- `src/app/api/rooms/create/route.ts`
- `src/app/api/rooms/[roomId]/route.ts`
- `src/app/api/rooms/[roomId]/is-creator/route.ts`
- `src/app/api/users/[username]/rooms/route.ts`

**해결책**:
- 모든 파일의 import 경로를 올바른 상대 경로로 수정
- 예: `import { supabase } from '../../../../../lib/supabase'`
- `.next` 빌드 캐시 삭제 후 재시작

**결과**: ✅ 모든 API 라우트가 정상적으로 컴파일됨

---

### 3. Web Crypto API 호환성 문제
**문제**: 아이폰에서 맥북의 로컬 IP 주소로 접속 시 Web Crypto API 사용 불가
- 에러 메시지: `Web Crypto API requires HTTPS or localhost`
- 원인: `window.crypto.subtle`은 HTTPS 또는 localhost에서만 사용 가능

**해결책**:
1. **SSL 인증서 생성** (`mkcert` 사용):
   ```bash
   mkcert localhost 127.0.0.1 192.168.0.3 ::1
   ```
   - 생성된 파일: `localhost+3.pem`, `localhost+3-key.pem`
   - 유효기간: 2028년 3월 2일까지

2. **서버 HTTPS 지원 추가**:
   - `server.js`에 HTTPS 서버 로직 추가
   - SSL 인증서가 있으면 HTTPS, 없으면 HTTP로 자동 전환
   - 개발 환경에서만 HTTPS 사용

3. **에러 처리 개선**:
   - `deriveKey`, `encryptMessage`, `decryptMessage` 함수에 브라우저 환경 체크 추가
   - 더 구체적인 에러 메시지 제공

**접속 주소**:
- 맥북에서: `https://localhost:3000`
- 아이폰에서: `https://192.168.0.3:3000`

**결과**: ✅ 모바일 기기에서도 암호화 기능이 정상 작동

---

### 4. 메시지 중복 표시 문제
**문제**: 
- 방장이 보낸 메시지가 화면에 두 번 나타남
- 다른 참가자들이 메시지를 받지 못함

**원인**: 
- 메시지 송신자가 자신의 UI에 메시지를 추가하지 않음
- 서버의 broadcast만 의존했기 때문에 송신자 본인도 중복으로 받음

**해결책**:
- `sendMessage` 함수 수정: 메시지를 보낸 직후 송신자의 UI에 즉시 추가
  ```typescript
  // Add message to own UI immediately
  setMessages((prev) => [...prev, { 
    sender: nickname, 
    text: inputMessage,
    isSystem: false
  }]);
  ```
- 서버는 `socket.broadcast.to(roomId)`로 다른 사람들에게만 전송

**결과**: ✅ 메시지 중복 제거 및 모든 참가자가 정상적으로 메시지 수신

---

## 📝 주요 코드 변경 사항

### `server.js`
```javascript
// HTTPS 지원 추가
const { createServer: createHttpsServer } = require('https');
const fs = require('fs');

// SSL 인증서 자동 감지
if (dev) {
  if (fs.existsSync('./localhost+3-key.pem') && fs.existsSync('./localhost+3.pem')) {
    useHttps = true;
    console.log('✅ SSL certificates found, starting HTTPS server');
  }
}
```

### `src/app/chat/[roomId]/page.tsx`
```typescript
// Web Crypto API 사용 전 환경 체크
if (typeof window === 'undefined') {
  throw new Error('Not running in browser environment');
}
if (!window.crypto.subtle) {
  const protocol = window.location.protocol;
  if (protocol === 'http:' && window.location.hostname !== 'localhost') {
    throw new Error('Web Crypto API requires HTTPS or localhost');
  }
}
```

---

## 🔐 보안 고려사항

### 환경 변수 (`.env.local`)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://***.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJhbG***
SUPABASE_SECRET_KEY=eyJhbG***
```
⚠️ **주의**: 
- `.env.local`은 절대 Git에 커밋하지 않음 (`.gitignore`에 포함됨)
- `SUPABASE_SECRET_KEY`는 서버 사이드에서만 사용
- SSL 인증서 파일(`*.pem`)도 `.gitignore`에 포함됨

---

## 🎯 테스트 결과

### ✅ 성공한 기능
- 환경 변수 로딩 및 Supabase 연결
- HTTPS 개발 서버 실행
- 크로스 플랫폼 테스트 (맥북 + 아이폰)
- 엔드투엔드 암호화 (AES-GCM, PBKDF2)
- 실시간 메시징 (Socket.io)
- 메시지 중복 방지

### 📱 지원 환경
- **데스크톱**: `https://localhost:3000`
- **모바일**: `https://[로컬IP]:3000`
- **브라우저**: Chrome, Safari, Firefox (Web Crypto API 지원 필요)

---

## 🚀 다음 단계

1. ~~메시지 전송 이슈 해결~~ ✅ 완료
2. 프로덕션 배포 준비 (Vercel/Railway)
3. 추가 테스트: 다중 사용자 동시 접속
4. UI/UX 개선 사항 검토

---

## 📚 기술 스택

- **프레임워크**: Next.js 16.0.3 (React 19.2.0)
- **백엔드**: Node.js + Socket.io 4.8.1
- **데이터베이스**: Supabase (PostgreSQL)
- **암호화**: Web Crypto API (AES-GCM + PBKDF2)
- **개발 도구**: TypeScript, dotenv, mkcert

---

## 💡 배운 점

1. **환경 변수 로딩**: 커스텀 Node.js 서버에서는 `dotenv`를 명시적으로 설정해야 함
2. **Web Crypto API 제약**: HTTPS 또는 localhost 환경이 필수
3. **Socket.io 메시지 흐름**: `broadcast`와 `emit`의 차이점 이해 중요
4. **Next.js 경로 별칭**: `@/*`는 `./src/*`를 가리키므로 프로젝트 루트의 파일은 상대 경로 사용
5. **HTTPS 로컬 개발**: `mkcert`로 신뢰할 수 있는 로컬 SSL 인증서 간편 생성 가능
