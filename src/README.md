# Src (Frontend)

## 개요
Next.js 기반 프론트엔드 애플리케이션의 모든 소스 코드를 포함하는 디렉토리입니다.

## 디렉토리 구조

### app/
Next.js App Router를 사용한 페이지 및 API 라우트를 관리합니다.

#### 주요 페이지
- **page.tsx**: 대시보드 (채팅방 생성/목록)
- **login/page.tsx**: 로그인 페이지
- **register/page.tsx**: 회원가입 페이지
- **chat/[roomId]/page.tsx**: 채팅방 페이지

#### API Routes (app/api/)
- **auth/**: 인증 관련 API (로그인, 회원가입)
- **rooms/**: 채팅방 관련 API (생성, 조회, 참여)
- **friends/**: 친구 관리 API
- **users/**: 사용자 정보 API

### lib/
재사용 가능한 유틸리티 함수와 헬퍼를 포함합니다.

- **crypto.ts**: E2E 암호화 관련 함수 (키 생성, 암호화/복호화)
- **key-storage.ts**: 개인키 로컬 저장소 관리
- **supabase.js**: Supabase 클라이언트 초기화
- **constants.ts**: 전역 상수 정의 (테이블명, 이벤트명, HTTP 상태 코드)

### components/
재사용 가능한 React 컴포넌트를 저장합니다. (향후 추가 예정)

### hooks/
커스텀 React hooks를 저장합니다. (향후 추가 예정)

## 기술 스택
- **Next.js 16**: React 기반 풀스택 프레임워크
- **TypeScript**: 타입 안정성
- **Socket.io Client**: 실시간 통신
- **Supabase**: 백엔드 데이터베이스
- **Web Crypto API**: E2E 암호화

## 주요 기능
1. **E2E 암호화**: 모든 메시지는 클라이언트 측에서 암호화
2. **실시간 채팅**: Socket.io를 통한 양방향 통신
3. **채팅방 관리**: 비밀번호 보호 기능 포함
4. **사용자 인증**: Supabase 기반 인증 시스템

## Import 사용법
TypeScript path alias를 사용하여 간편하게 import할 수 있습니다:

```typescript
// lib 디렉토리 import
import { encryptMessage } from '@/lib/crypto';
import { supabase } from '@/lib/supabase';

// components 디렉토리 import (향후)
import { Button } from '@/components/Button';
```
