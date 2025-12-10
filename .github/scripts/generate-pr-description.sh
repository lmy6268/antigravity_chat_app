#!/bin/bash
set -e
# pipefail은 broken pipe 에러를 발생시킬 수 있으므로 제거
# SIGPIPE를 무시하도록 설정
trap '' PIPE

# 인자로 받기
TARGET_BRANCH="$1"
SOURCE_BRANCH="$2"

# 동일 브랜치면 무의미
if [ "$TARGET_BRANCH" = "$SOURCE_BRANCH" ]; then
  echo "source and target branch are identical; skipping."
  exit 0
fi

# merge-base로 공통 조상 찾기
MERGE_BASE=$(git merge-base "origin/$TARGET_BRANCH" "origin/$SOURCE_BRANCH")

# 해당 범위의 커밋만 추출
COMMITS=$(git log "$MERGE_BASE..origin/$SOURCE_BRANCH" --oneline)

# diff도 같은 범위로
DIFF_CONTENT=$(git diff "$MERGE_BASE..origin/$SOURCE_BRANCH")
DIFF_STATS=$(git diff --stat "$MERGE_BASE..origin/$SOURCE_BRANCH")

# diff가 너무 크면 앞부분만 사용 (Argument list too long 방지)
DIFF_LINES=$(echo "$DIFF_CONTENT" | wc -l)
if [ "$DIFF_LINES" -gt 150 ]; then
  DIFF_CONTENT=$(echo "$DIFF_CONTENT" | head -n 150)
  DIFF_CONTENT="$DIFF_CONTENT

... (diff가 너무 길어 생략됨. 총 $DIFF_LINES 줄)"
fi

# 임시 파일에 프롬프트 작성
TEMP_PROMPT=$(mktemp)
trap 'rm -f "$TEMP_PROMPT"' EXIT
cat > "$TEMP_PROMPT" <<EOF
다음 코드 변경사항을 분석해서 Pull Request 제목과 설명을 작성해줘.

**중요: 반드시 아래 형식을 정확히 따라야 함**

첫 줄: TITLE: [PR 제목을 한 줄로]
둘째 줄: --- (구분선)
셋째 줄부터: 마크다운 형식의 상세 설명

제목 작성 규칙:
- 한글로 작성
- 커밋의 핵심 내용을 한 줄로 요약
- 50자 이내로 간결하게

본문 작성 규칙:
- 마크다운 형식
- 한글로 작성
- 📝 요약, ✨ 주요 변경사항 포함

커밋 목록:
$COMMITS

변경 파일 통계:
$DIFF_STATS

상세 변경 내용:
$DIFF_CONTENT
EOF

# stdin으로 프롬프트 전달 (모델 지정)
FULL_RESPONSE=$(cat "$TEMP_PROMPT" | gemini -m gemini-2.5-flash-lite)

# 임시 파일 삭제
rm -f "$TEMP_PROMPT"

# 제목과 본문 분리
PR_TITLE=$(echo "$FULL_RESPONSE" | grep "^TITLE:" | sed 's/^TITLE: //')
PR_BODY=$(echo "$FULL_RESPONSE" | sed '1,/^---$/d')

if [ -z "$PR_TITLE" ]; then
  echo "Error: Failed to parse PR title from AI response." >&2
  exit 1
fi

# GitHub Actions 환경변수로 출력
echo "title=$PR_TITLE" >> "$GITHUB_OUTPUT"
echo "body<<EOF" >> "$GITHUB_OUTPUT"
echo "$PR_BODY" >> "$GITHUB_OUTPUT"
echo "EOF" >> "$GITHUB_OUTPUT"