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

# PR 템플릿 읽기
TEMPLATE_PATH=".github/pull_request_template.md"
if [ -f "$TEMPLATE_PATH" ]; then
  PR_TEMPLATE=$(cat "$TEMPLATE_PATH")
else
  echo "⚠️ PR 템플릿을 찾을 수 없습니다. 기본 형식을 사용합니다."
  PR_TEMPLATE=""
fi

# 임시 파일에 프롬프트 작성
TEMP_PROMPT=$(mktemp)
trap 'rm -f "$TEMP_PROMPT"' EXIT
cat > "$TEMP_PROMPT" <<EOF
다음 코드 변경사항을 분석해서 Pull Request 제목과 설명을 작성해줘.

**중요: 반드시 아래 형식을 정확히 따라야 함**

첫 줄: TITLE: [타입] 제목
둘째 줄: --- (구분선)
셋째 줄부터: PR 템플릿 형식에 맞춘 상세 설명

**제목 작성 규칙**:
- 형식: [타입] 제목
- 타입: Feature, Fix, Refactor, Style, Docs, Test, Chore, Perf, Security 중 하나
- 한글로 작성
- 커밋의 핵심 내용을 한 줄로 요약
- 50자 이내로 간결하게

**본문 작성 규칙**:
- 아래 PR 템플릿 구조를 **반드시** 따를 것
- 체크박스는 적절히 체크 ([x])
- 주석(<!-- -->)은 제거하고 실제 내용으로 채울 것
- 마크다운 형식 사용
- 한글로 작성
- 구체적이고 명확하게 작성

**PR 템플릿 구조**:
\`\`\`markdown
$PR_TEMPLATE
\`\`\`

**분석할 변경사항**:

커밋 목록:
$COMMITS

변경 파일 통계:
$DIFF_STATS

상세 변경 내용:
$DIFF_CONTENT

**작성 예시**:
\`\`\`
TITLE: [Feature] 사용자 인증 기능 추가
---

## PR 타입

- [x] Feature: 새로운 기능 추가
- [ ] Fix: 버그 수정
- [ ] Refactor: 코드 리팩토링 (기능 변경 없음)

## 변경사항 요약

### 주요 변경사항

- JWT 기반 사용자 인증 시스템 구현
- 로그인/로그아웃 API 엔드포인트 추가
- 인증 미들웨어 구현

### 변경 이유

기존에는 인증 없이 모든 API에 접근 가능했으나, 보안을 강화하기 위해 JWT 기반 인증 시스템을 도입했습니다.

## 테스트

- [x] 로컬에서 테스트 완료
- [x] 빌드 오류 없음
- [x] 기존 기능에 영향 없음
- [x] 새로운 기능이 정상 작동함

### 테스트 방법

1. 로그인 API로 토큰 발급 확인
2. 보호된 엔드포인트에 토큰 없이 접근 시 401 반환 확인
3. 유효한 토큰으로 접근 시 정상 응답 확인

## 체크리스트

- [x] PR 제목이 \`[타입] 제목\` 형식을 따름
- [x] 코드 스타일 가이드를 준수함
- [x] 커밋 메시지가 컨벤션을 따름
\`\`\`

이 예시처럼 템플릿 구조를 따라 작성하되, 실제 커밋 내용을 분석하여 구체적으로 작성해주세요.
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