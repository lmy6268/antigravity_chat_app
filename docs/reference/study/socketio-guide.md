# Socket.io 실시간 통신 가이드

## 📌 Socket.io란?

Socket.io는 실시간 양방향 통신을 위한 JavaScript 라이브러리입니다. WebSocket 기반이지만, WebSocket을 지원하지 않는 환경에서는 자동으로 롱 폴링(long polling) 등의 대체 방법으로 전환됩니다.

## 🔍 WebSocket vs HTTP

### HTTP (전통적인 방식)

```
클라이언트 → 요청 → 서버
클라이언트 ← 응답 ← 서버
```

- **단방향**: 클라이언트가 먼저 요청해야 함
- **비연결성**: 요청/응답 후 연결 종료
- **폴링 필요**: 실시간 업데이트를 위해 주기적으로 요청해야 함

### WebSocket (Socket.io)

```
클라이언트 ←→ 양방향 연결 ←→ 서버
```

- **양방향**: 서버도 클라이언트에게 먼저 데이터 전송 가능
- **지속 연결**: 한번 연결되면 유지
- **실시간**: 즉각적인 데이터 교환

## 🛠 프로젝트에서의 Socket.io 구현

### 1. 서버 설정 (server.js)

```javascript
// Socket.io 서버 생성
const io = new Server(server, {
  cors: {
    origin: '*', // CORS 허용
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'], // 연결 방식
  allowEIO3: true,
});

// 클라이언트 연결 이벤트
io.on('connection', (socket) => {
  console.log('새 연결:', socket.id);

  // 방 참가 이벤트 처리
  socket.on('join', async (data) => {
    const { roomId, username } = data;
    socket.join(roomId); // Socket.io 방에 참가
    // ... 사용자 DB 등록, 메시지 히스토리 전송
  });

  // 메시지 이벤트 처리
  socket.on('message', async (data) => {
    const { roomId, payload } = data;
    // DB에 저장
    // 발신자 제외 브로드캐스트
    socket.broadcast.to(roomId).emit('message', payload);
  });

  // 연결 해제 이벤트
  socket.on('disconnect', () => {
    console.log('연결 해제:', socket.id);
    // ... 참가자 목록에서 제거
  });
});
```

### 2. 클라이언트 설정 (React 컴포넌트)

```typescript
import { io } from 'socket.io-client';

// Socket.io 연결 생성
const socket = io(window.location.origin, {
  transports: ['websocket', 'polling'],
  reconnection: true, // 자동 재연결
  reconnectionDelay: 1000, // 재연결 대기 시간
  reconnectionAttempts: 5, // 최대 재연결 시도 횟수
});

// 연결 성공 이벤트
socket.on('connect', () => {
  console.log('연결됨!');
  socket.emit('join', { roomId, username });
});

// 메시지 수신 이벤트
socket.on('message', (payload) => {
  // 메시지 처리
  handleIncomingMessage(payload);
});

// 메시지 전송
socket.emit('message', {
  roomId,
  payload: encryptedData,
});

// 연결 해제
socket.disconnect();
```

## 🎯 주요 개념

### 1. 이벤트 기반 통신

Socket.io는 **이벤트**를 주고받는 방식입니다.

```javascript
// 이벤트 발송
socket.emit('eventName', data);

// 이벤트 수신
socket.on('eventName', (data) => {
  // 데이터 처리
});
```

### 2. 방(Room) 개념

여러 사용자를 그룹화하여 특정 그룹에만 메시지를 보낼 수 있습니다.

```javascript
// 방 참가
socket.join('room1');

// 방에 있는 모든 사람에게 전송
io.to('room1').emit('message', data);

// 방에서 나가기
socket.leave('room1');
```

### 3. Broadcast vs Emit

```javascript
// emit: 발신자 포함 모든 클라이언트
io.to(roomId).emit('message', data);

// broadcast: 발신자 제외
socket.broadcast.to(roomId).emit('message', data);
```

**이 프로젝트의 선택**: `broadcast` 사용

- 이유: 발신자는 이미 UI에 메시지를 추가했으므로, 다른 사람들에게만 전송
- 효과: 메시지 중복 방지

## 📊 메시지 흐름 다이어그램

```
[사용자 A]                [서버]                [사용자 B, C]
    |                        |                        |
    |------ join 이벤트 ---->|                        |
    |                        |------ DB에 사용자 등록 ------|
    |<--- 메시지 히스토리 ----|                        |
    |                        |                        |
    |                        |                        |
    |-- message 이벤트 ----->|                        |
    |   (암호화된 데이터)     |------ DB에 저장 ---------|
    |                        |                        |
    | UI에 즉시 표시          |-- broadcast.emit ----->|
    |                        |   (발신자 제외)         | 메시지 수신
    |                        |                        | 복호화 및 표시
```

## 🔐 Socket.io + 암호화 통합

### 1. 데이터 흐름

```typescript
// 송신
const messageText = '안녕하세요';
const encrypted = await encryptMessage(messageText, cryptoKey);
// encrypted = { iv: [...], data: [...] }

socket.emit('message', {
  roomId,
  payload: encrypted,
});

// 수신
socket.on('message', async (payload) => {
  const decrypted = await decryptMessage(payload.iv, payload.data, cryptoKey);
  // decrypted = "안녕하세요"
});
```

### 2. 서버는 암호화된 데이터만 처리

```javascript
// 서버는 평문을 볼 수 없음
socket.on('message', async (data) => {
  const { roomId, payload } = data;

  // payload = { iv: [...], data: [...] }
  // 서버는 이대로 DB에 저장하고 전송
  await supabase.from('messages').insert({
    room_id: roomId,
    iv: payload.iv,
    data: payload.data,
  });

  socket.broadcast.to(roomId).emit('message', payload);
});
```

## ⚡ 성능 최적화 팁

### 1. 연결 재사용

```typescript
// ❌ 나쁜 예: 매번 새 연결 생성
function sendMessage(msg) {
  const socket = io(url);
  socket.emit('message', msg);
  socket.disconnect();
}

// ✅ 좋은 예: 연결 유지
const socket = io(url);
function sendMessage(msg) {
  socket.emit('message', msg);
}
```

### 2. 불필요한 이벤트 구독 해제

```typescript
useEffect(() => {
  socket.on('message', handleMessage);

  // 컴포넌트 언마운트 시 구독 해제
  return () => {
    socket.off('message', handleMessage);
  };
}, []);
```

### 3. 데이터 압축

큰 데이터는 전송 전 압축을 고려하세요:

```typescript
// 예: JSON 문자열 대신 바이너리 데이터 전송
const buffer = new TextEncoder().encode(jsonString);
socket.emit('data', buffer);
```

## 🐛 일반적인 문제 해결

### 1. CORS 오류

```javascript
// 서버에서 CORS 설정
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:8080',
    methods: ['GET', 'POST'],
  },
});
```

### 2. 연결이 안 될 때

- 방화벽 확인
- 포트 번호 확인
- 서버가 실행 중인지 확인
- 브라우저 콘솔에서 에러 메시지 확인

### 3. 메시지 중복

- `emit` vs `broadcast` 사용 확인
- 이벤트 리스너가 중복 등록되지 않았는지 확인
- React의 경우 `useEffect`의 cleanup 함수 사용

## 📚 참고 자료

- [Socket.io 공식 문서](https://socket.io/docs/)
- [Socket.io 서버 API](https://socket.io/docs/v4/server-api/)
- [Socket.io 클라이언트 API](https://socket.io/docs/v4/client-api/)

## 💡 핵심 요약

1. **이벤트 기반**: `emit`과 `on`으로 통신
2. **방(Room)**: 그룹 메시징을 위한 개념
3. **자동 재연결**: 네트워크 끊김에도 자동으로 재연결
4. **양방향 통신**: 클라이언트와 서버 모두 먼저 메시지 전송 가능
5. **암호화 통합**: Socket.io는 전송 계층, 암호화는 애플리케이션 계층
