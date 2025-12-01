# Supabase 마이그레이션 설정 가이드

## 1단계: Supabase 프로젝트 생성

1. [https://supabase.com](https://supabase.com) 접속
2. "Start your project" 또는 "New Project" 클릭
3. 계정 생성 또는 로그인
4. "+ New Project" 클릭
5. 다음 정보 입력:
   - **이름**: `websocket-chat` (원하는 이름으로 변경 가능)
   - **데이터베이스 비밀번호**: 강력한 비밀번호 선택 (반드시 저장하세요!)
   - **지역**: 가장 가까운 지역 선택 (한국의 경우 Northeast Asia)
   - **요금제**: 개발용으로는 무료 티어가 완벽합니다

## 2단계: 데이터베이스 스키마 실행

1. Supabase 대시보드에서 **SQL Editor** 클릭 (왼쪽 사이드바)
2. "+ New Query" 클릭
3. `supabase-schema.sql`의 전체 내용 복사
4. SQL 편집기에 붙여넣기
5. "Run" 클릭 또는 Cmd+Enter 입력
6. "Success. No rows returned" 메시지 확인
7. **Table Editor**로 이동하여 테이블 생성 확인:
   - ✅ users
   - ✅ rooms
   - ✅ messages
   - ✅ room_participants

## 3단계: API 키 가져오기

1. **Project Settings** 클릭 (왼쪽 사이드바의 톱니바퀴 아이콘)
2. 설정 메뉴에서 **API** 클릭
3. 다음 값들을 복사:

   **Project URL:**
   ```
   https://xxxxxxxxxxxxx.supabase.co
   ```

   **Publishable API Key (formerly anon public key):**
   - 대시보드에서 `anon` 또는 `publishable`로 표시될 수 있습니다.
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

   **Secret API Key (formerly service_role key):** ("Reveal" 클릭하여 표시)
   - 대시보드에서 `service_role` 또는 `secret`으로 표시될 수 있습니다.
   - `sb_secret_...` 형식일 수 있습니다.
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

## 4단계: 환경 변수 설정

프로젝트 루트에 `.env.local` 파일 생성:

```bash
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key_here
SUPABASE_SECRET_KEY=your_secret_key_here
```

⚠️ **중요:** 
- 플레이스홀더 값을 실제 키로 교체하세요
- `.env.local`을 절대 git에 커밋하지 마세요 (이미 .gitignore에 포함됨)
- service role key는 절대 클라이언트에 노출되어서는 안 됩니다

## 5단계: 확인

환경 변수 설정 후 개발 서버를 재시작하세요:

```bash
npm run dev
```

서버가 오류 없이 시작되어야 합니다. 다음 메시지가 표시되면:
```
Missing Supabase environment variables!
```

`.env.local` 파일을 다시 확인하세요.

## 다음 단계

설정이 완료되면 JSON 파일 대신 Supabase를 사용하도록 코드가 리팩토링됩니다.

## 문제 해결

**"Missing Supabase environment variables" 오류**
- `.env.local`이 프로젝트 루트에 있는지 확인
- 변수 이름이 정확히 일치하는지 확인
- `.env.local` 생성 후 개발 서버 재시작

**스키마 실행 시 SQL 오류**
- `supabase-schema.sql` 전체 파일을 복사했는지 확인
- 새 프로젝트에서 실행 (또는 기존 테이블을 먼저 삭제)
- SQL 편집기의 오류 메시지 확인

**연결 오류**
- Project URL이 올바른지 확인
- API 키가 유효한지 확인
- 인터넷 연결이 안정적인지 확인
