# Backend

## 개요
이 디렉토리는 WebSocket 통신을 담당하는 백엔드 서버 코드를 포함합니다.

## 주요 파일

### server.js
- **역할**: Socket.io 기반 WebSocket 서버
- **기능**:
  - Next.js 개발/프로덕션 서버 실행
  - Socket.io 실시간 통신 처리
  - 채팅방별 메시지 브로드캐스팅
  - E2E 암호화된 메시지 전달

## 실행 방법

### 개발 모드
```bash
npm run dev
```

### 프로덕션 모드
```bash
npm run build
npm start
```

## 기술 스택
- **Node.js**: JavaScript 런타임
- **Socket.io**: 실시간 양방향 통신
- **Next.js**: React 프레임워크 통합

## 향후 확장 가능성
- WebSocket 이벤트 핸들러 분리
- 채팅방 관리 로직 모듈화
- 인증/인가 미들웨어 추가
