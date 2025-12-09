#!/bin/bash

# 일일 커밋 분석 스크립트
# 전날 00:00 ~ 23:59 사이의 커밋을 분석하여 JSON 형식으로 출력

set -e

# 날짜 설정 (기본값: 어제)
if [ -z "$BLOG_DATE" ]; then
  # 어제 날짜 계산
  YESTERDAY=$(date -u -d '1 day ago' +%Y-%m-%d 2>/dev/null || date -u -v-1d +%Y-%m-%d)
else
  YESTERDAY=$BLOG_DATE
fi

echo "📅 분석 날짜: $YESTERDAY"

# 시작/종료 시간
START_TIME="${YESTERDAY} 00:00:00"
END_TIME="${YESTERDAY} 23:59:59"

# 커밋 수집
COMMITS_JSON=$(git log --since="$START_TIME" --until="$END_TIME" \
  --pretty=format:'{"hash":"%H","message":"%s","author":"%an","date":"%ai"}' \
  | jq -s '.')

# 총 커밋 수
TOTAL_COMMITS=$(echo "$COMMITS_JSON" | jq 'length')

if [ "$TOTAL_COMMITS" -eq 0 ]; then
  echo "❌ $YESTERDAY 에 커밋이 없습니다."
  echo '{"date":"'$YESTERDAY'","commits":[],"summary":{"total_commits":0},"files":[]}' > commits_data.json
  exit 0
fi

echo "✅ 총 $TOTAL_COMMITS 개의 커밋 발견"

# 변경된 파일 통계
git log --since="$START_TIME" --until="$END_TIME" --numstat --pretty=format:'' \
  | awk 'NF' > /tmp/git_stats.txt

# 총 추가/삭제 라인 수 계산
LINES_ADDED=$(awk '{sum+=$1} END {print sum+0}' /tmp/git_stats.txt)
LINES_DELETED=$(awk '{sum+=$2} END {print sum+0}' /tmp/git_stats.txt)

# 변경된 파일 목록
FILES_CHANGED=$(awk '{print $3}' /tmp/git_stats.txt | sort -u | jq -R . | jq -s .)
FILES_COUNT=$(echo "$FILES_CHANGED" | jq 'length')

# diff 샘플 추출 (최대 500줄)
DIFF_SAMPLE=$(git log --since="$START_TIME" --until="$END_TIME" -p --unified=3 | head -500)

# JSON 출력
cat > commits_data.json <<EOF
{
  "date": "$YESTERDAY",
  "commits": $COMMITS_JSON,
  "summary": {
    "total_commits": $TOTAL_COMMITS,
    "files_changed": $FILES_COUNT,
    "lines_added": $LINES_ADDED,
    "lines_deleted": $LINES_DELETED
  },
  "files": $FILES_CHANGED,
  "diff_sample": $(echo "$DIFF_SAMPLE" | jq -Rs .)
}
EOF

echo "✅ 커밋 분석 완료: commits_data.json"
echo "📊 요약:"
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
