#!/bin/bash

# 기존 open PR에 새로운 커밋 요약을 코멘트로 추가하는 스크립트

set -e

PR_NUMBER=$1
BRANCH_NAME=$2

if [ -z "$PR_NUMBER" ] || [ -z "$BRANCH_NAME" ]; then
  echo "❌ 사용법: $0 <PR_NUMBER> <BRANCH_NAME>"
  exit 1
fi

echo "📝 PR #$PR_NUMBER에 새로운 커밋 요약 추가 중..."

# 마지막 커밋 정보 가져오기
LAST_COMMIT_HASH=$(git rev-parse HEAD)
LAST_COMMIT_MESSAGE=$(git log -1 --pretty=format:'%s')
LAST_COMMIT_AUTHOR=$(git log -1 --pretty=format:'%an')

# 최근 5개 커밋 분석
RECENT_COMMITS=$(git log -5 --pretty=format:'{"hash":"%H","message":"%s","author":"%an","date":"%ai"}' | jq -s '.')
COMMIT_COUNT=$(echo "$RECENT_COMMITS" | jq 'length')

# 마지막 커밋의 변경사항 분석
git diff HEAD~1 HEAD --numstat > /tmp/last_commit_stats.txt

LINES_ADDED=$(awk '{sum+=$1} END {print sum+0}' /tmp/last_commit_stats.txt)
LINES_DELETED=$(awk '{sum+=$2} END {print sum+0}' /tmp/last_commit_stats.txt)
FILES_CHANGED=$(awk '{print $3}' /tmp/last_commit_stats.txt | wc -l | tr -d ' ')

# 변경된 파일 목록
CHANGED_FILES=$(awk '{print "- `"$3"`: +"$1" -"$2}' /tmp/last_commit_stats.txt | head -10)

# Gemini CLI가 설치되어 있는지 확인
if ! command -v gemini &> /dev/null; then
  echo "⚠️ Gemini CLI가 설치되어 있지 않습니다. 기본 요약을 사용합니다."
  
  # 기본 코멘트 생성
  COMMENT="## 🔄 새로운 커밋 추가됨

**최근 커밋**: \`${LAST_COMMIT_HASH:0:7}\`
> $LAST_COMMIT_MESSAGE

**📊 변경 통계**
- 변경된 파일: ${FILES_CHANGED}개
- 추가된 줄: +${LINES_ADDED}
- 삭제된 줄: -${LINES_DELETED}

**📁 변경된 파일**
$CHANGED_FILES

---
_🤖 자동 생성된 커밋 요약 ($(date +'%Y-%m-%d %H:%M:%S KST'))_"
else
  # AI로 커밋 요약 생성
  PROMPT="다음은 Pull Request에 새로 추가된 커밋 정보입니다.
이 커밋의 변경사항을 간결하게 요약해주세요.

**최근 커밋 메시지**:
$LAST_COMMIT_MESSAGE

**변경 통계**:
- 변경된 파일: ${FILES_CHANGED}개
- 추가된 줄: +${LINES_ADDED}
- 삭제된 줄: -${LINES_DELETED}

**변경된 파일 목록**:
$CHANGED_FILES

**요구사항**:
1. 2-3문장으로 간결하게 요약
2. 주요 변경사항 강조
3. 기술적 세부사항보다는 '무엇을 했는지'에 집중
4. 마크다운 형식 사용 (볼드, 코드블록 등)

예시:
이번 커밋에서는 **사용자 인증 로직을 개선**했습니다. \`AuthService\`에서 토큰 갱신 로직을 추가하고, 만료된 토큰 처리를 개선했습니다. 또한 관련 테스트 케이스 3개를 추가했습니다."

  AI_SUMMARY=$(gemini -m gemini-2.5-flash -p "$PROMPT" 2>/dev/null || echo "커밋 요약을 생성할 수 없습니다.")

  # AI 요약이 포함된 코멘트 생성
  COMMENT="## 🔄 새로운 커밋 추가됨

**최근 커밋**: \`${LAST_COMMIT_HASH:0:7}\`
> $LAST_COMMIT_MESSAGE

### 📝 변경사항 요약

$AI_SUMMARY

### 📊 변경 통계
- 변경된 파일: ${FILES_CHANGED}개
- 추가된 줄: +${LINES_ADDED}
- 삭제된 줄: -${LINES_DELETED}

<details>
<summary>📁 변경된 파일 목록</summary>

$CHANGED_FILES

</details>

---
_🤖 AI로 자동 생성된 커밋 요약 ($(date +'%Y-%m-%d %H:%M:%S KST'))_"
fi

# PR에 코멘트 추가
echo "$COMMENT" | gh pr comment $PR_NUMBER --body-file -

echo "✅ PR #$PR_NUMBER에 커밋 요약 코멘트 추가 완료"
