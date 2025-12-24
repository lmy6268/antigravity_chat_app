#!/bin/bash

# PR 커밋 분석 스크립트
# PR의 모든 커밋을 분석하여 JSON 형식으로 출력

set -e

# PR 정보 확인
if [ -z "$PR_NUMBER" ] || [ -z "$PR_BASE" ] || [ -z "$PR_HEAD" ]; then
  echo "❌ PR 정보가 없습니다."
  echo "필요한 환경변수: PR_NUMBER, PR_BASE, PR_HEAD"
  exit 1
fi

echo "📋 PR #$PR_NUMBER 분석 중..."
echo "📌 제목: $PR_TITLE"
echo "👤 작성자: $PR_AUTHOR"
echo "🌿 브랜치: $PR_BRANCH"

# PR의 커밋 범위 확인
echo "🔍 커밋 범위: $PR_BASE..$PR_HEAD"

# 커밋 수집
COMMITS_JSON=$(git log $PR_BASE..$PR_HEAD \
  --pretty=format:'{"hash":"%H","message":"%s","author":"%an","date":"%ai"}' \
  | jq -s '.')

# 총 커밋 수
TOTAL_COMMITS=$(echo "$COMMITS_JSON" | jq 'length')

if [ "$TOTAL_COMMITS" -eq 0 ]; then
  echo "❌ PR에 커밋이 없습니다."
  echo '{"pr_number":"'$PR_NUMBER'","pr_title":"'$PR_TITLE'","commits":[],"summary":{"total_commits":0},"files":[]}' > pr_data.json
  exit 0
fi

echo "✅ 총 $TOTAL_COMMITS 개의 커밋 발견"

# 변경된 파일 통계
git diff --numstat $PR_BASE..$PR_HEAD > /tmp/git_stats.txt

# 총 추가/삭제 라인 수 계산
LINES_ADDED=$(awk '{sum+=$1} END {print sum+0}' /tmp/git_stats.txt)
LINES_DELETED=$(awk '{sum+=$2} END {print sum+0}' /tmp/git_stats.txt)

# 변경된 파일 목록
FILES_CHANGED=$(awk '{print $3}' /tmp/git_stats.txt | sort -u | jq -R . | jq -s .)
FILES_COUNT=$(echo "$FILES_CHANGED" | jq 'length')

# 파일별 변경 통계
FILE_STATS=$(awk '{print "{\"file\":\""$3"\",\"added\":"$1",\"deleted\":"$2"}"}' /tmp/git_stats.txt | jq -s .)

# diff 샘플 추출 (최대 1000줄)
DIFF_SAMPLE=$(git diff $PR_BASE..$PR_HEAD --unified=3 | head -1000)

# PR 설명 가져오기 (GitHub API 사용)
PR_BODY=""
if command -v gh &> /dev/null; then
  PR_BODY=$(gh pr view $PR_NUMBER --json body --jq '.body' 2>/dev/null || echo "")
fi

# JSON 출력
cat > pr_data.json <<EOF
{
  "pr_number": "$PR_NUMBER",
  "pr_title": "$PR_TITLE",
  "pr_author": "$PR_AUTHOR",
  "pr_branch": "$PR_BRANCH",
  "pr_body": $(echo "$PR_BODY" | jq -Rs .),
  "commits": $COMMITS_JSON,
  "summary": {
    "total_commits": $TOTAL_COMMITS,
    "files_changed": $FILES_COUNT,
    "lines_added": $LINES_ADDED,
    "lines_deleted": $LINES_DELETED
  },
  "files": $FILES_CHANGED,
  "file_stats": $FILE_STATS,
  "diff_sample": $(echo "$DIFF_SAMPLE" | jq -Rs .)
}
EOF

echo "✅ PR 분석 완료: pr_data.json"
echo "📊 요약:"
echo "  - PR 번호: #$PR_NUMBER"
echo "  - 커밋 수: $TOTAL_COMMITS"
echo "  - 변경 파일: $FILES_COUNT"
echo "  - 추가 줄: $LINES_ADDED"
echo "  - 삭제 줄: $LINES_DELETED"

# GitHub Actions 출력
if [ -n "$GITHUB_OUTPUT" ]; then
  echo "commit_count=$TOTAL_COMMITS" >> "$GITHUB_OUTPUT"
  echo "files_changed=$FILES_COUNT" >> "$GITHUB_OUTPUT"
  echo "lines_added=$LINES_ADDED" >> "$GITHUB_OUTPUT"
  echo "lines_deleted=$LINES_DELETED" >> "$GITHUB_OUTPUT"
fi
