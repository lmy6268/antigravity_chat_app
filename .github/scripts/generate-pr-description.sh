#!/bin/bash

# 인자로 받기
TARGET_BRANCH=$1
SOURCE_BRANCH=$2

# merge-base로 공통 조상 찾기
MERGE_BASE=$(git merge-base origin/$TARGET_BRANCH origin/$SOURCE_BRANCH)

# 해당 범위의 커밋만 추출
COMMITS=$(git log $MERGE_BASE..origin/$SOURCE_BRANCH --oneline)

# diff도 같은 범위로
DIFF_CONTENT=$(git diff $MERGE_BASE..origin/$SOURCE_BRANCH)
DIFF_STATS=$(git diff --stat $MERGE_BASE..origin/$SOURCE_BRANCH)

PROMPT="다음 코드 변경사항을 분석해서 Pull Request 제목과 설명을 작성해줘.

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
$DIFF_CONTENT"

FULL_RESPONSE=$(gemini -p "$PROMPT")

# 제목과 본문 분리
PR_TITLE=$(echo "$FULL_RESPONSE" | grep "^TITLE:" | sed 's/^TITLE: //')
PR_BODY=$(echo "$FULL_RESPONSE" | sed '1,/^---$/d')

# GitHub Actions 환경변수로 출력
echo "title=$PR_TITLE" >> "$GITHUB_OUTPUT"
echo "body<<EOF" >> "$GITHUB_OUTPUT"
echo "$PR_BODY" >> "$GITHUB_OUTPUT"
echo "EOF" >> "$GITHUB_OUTPUT"