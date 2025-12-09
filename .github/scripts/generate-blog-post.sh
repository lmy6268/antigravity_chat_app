#!/bin/bash

# Gemini AI를 사용하여 블로그 글 생성
# commits_data.json을 읽어서 블로그 마크다운 생성

set -e

if [ ! -f "commits_data.json" ]; then
  echo "❌ commits_data.json 파일이 없습니다."
  exit 1
fi

# JSON 데이터 읽기
COMMIT_DATA=$(cat commits_data.json)
DATE=$(echo "$COMMIT_DATA" | jq -r '.date')
TOTAL_COMMITS=$(echo "$COMMIT_DATA" | jq -r '.summary.total_commits')
FILES_CHANGED=$(echo "$COMMIT_DATA" | jq -r '.summary.files_changed')
LINES_ADDED=$(echo "$COMMIT_DATA" | jq -r '.summary.lines_added')
LINES_DELETED=$(echo "$COMMIT_DATA" | jq -r '.summary.lines_deleted')

# 커밋이 없으면 종료
if [ "$TOTAL_COMMITS" -eq 0 ]; then
  echo "📭 커밋이 없어서 블로그 글을 생성하지 않습니다."
  exit 0
fi

echo "📝 블로그 글 생성 중..."

# 커밋 목록 포맷팅
COMMIT_LIST=$(echo "$COMMIT_DATA" | jq -r '.commits[] | "- \(.message) (by \(.author))"')

# 파일 목록 포맷팅  
FILE_LIST=$(echo "$COMMIT_DATA" | jq -r '.files[]' | head -10)

# Gemini AI 프롬프트 생성
PROMPT="당신은 개발 블로그 작가입니다. 오늘 진행한 개발 작업을 독자들이 이해하기 쉽게 블로그 글로 작성해주세요.

**작성 지침**:
1. 한국어로 작성
2. 친근하고 읽기 쉬운 문체 사용
3. 기술 용어에는 간단한 설명 추가
4. SEO 최적화된 제목 (이모지 포함)
5. 마크다운 형식 (H1 제목, H2/H3 부제목, 코드 블록, 리스트 포함)
6. 1000자 이상 작성
7. 적절한 이모지 활용으로 가독성 향상

**중요**: 첫 줄은 반드시 'TITLE: [제목]' 형식으로 작성하고, 둘째 줄은 '---' 구분선, 셋째 줄부터 본문을 작성하세요.

**오늘의 개발 작업 ($DATE)**:
- 📊 총 커밋 수: $TOTAL_COMMITS
- 📁 변경된 파일: $FILES_CHANGED개
- ➕ 추가된 줄: $LINES_ADDED줄
- ➖ 삭제된 줄: $LINES_DELETED줄

**주요 커밋 메시지**:
$COMMIT_LIST

**변경된 주요 파일** (최대 10개):
$FILE_LIST

**프로젝트 정보**:
- 프로젝트명: E2EE WebSocket 채팅 애플리케이션
- 기술 스택: Next.js 16, React 19, TypeScript, Socket.io, Supabase
- 주요 기능: 종단간 암호화, 실시간 채팅

이 정보를 바탕으로 오늘의 개발 일지를 블로그 글로 작성해주세요. 
독자들이 '오늘 어떤 작업을 했구나', '이런 기술을 사용했구나' 라고 이해할 수 있게 작성하되,
너무 기술적이지 않고 일상적인 개발 일지 느낌으로 작성해주세요."

# Gemini CLI로 블로그 글 생성 (gemini-2.5-flash 모델 사용)
BLOG_CONTENT=$(gemini -m gemini-2.5-flash -p "$PROMPT")

# 제목 추출
TITLE=$(echo "$BLOG_CONTENT" | grep "^TITLE:" | sed 's/^TITLE: //')

# 본문 추출 (TITLE과 --- 이후 내용)
BODY=$(echo "$BLOG_CONTENT" | sed '1,/^---$/d')

# 블로그 글 저장
cat > blog_post.md <<EOF
$BODY
EOF

echo "✅ 블로그 글 생성 완료: blog_post.md"
echo "📌 제목: $TITLE"

# GitHub Actions 출력
if [ -n "$GITHUB_OUTPUT" ]; then
  echo "title=$TITLE" >> "$GITHUB_OUTPUT"
  echo "date=$DATE" >> "$GITHUB_OUTPUT"
  echo "body_file=blog_post.md" >> "$GITHUB_OUTPUT"
fi
