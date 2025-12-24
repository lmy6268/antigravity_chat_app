#!/bin/bash
# DuckDNS 토큰은 환경 변수 또는 .env.local 파일에서 가져옵니다
# 1. 환경 변수 확인
# 2. 환경 변수가 없으면 프로젝트 루트의 .env.local 파일에서 읽기

# 스크립트 위치 기준으로 프로젝트 루트 찾기
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$PROJECT_ROOT/.env.local"

# 환경 변수가 없으면 .env.local 파일에서 읽기
if [ -z "$DUCKDNS_TOKEN" ] && [ -f "$ENV_FILE" ]; then
  # .env.local 파일에서 DUCKDNS_TOKEN 추출 (주석과 공백 제거)
  DUCKDNS_TOKEN=$(grep -E "^DUCKDNS_TOKEN=" "$ENV_FILE" | cut -d '=' -f2 | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | tr -d '"' | tr -d "'")
fi

if [ -z "$DUCKDNS_DOMAIN" ] && [ -f "$ENV_FILE" ]; then
  # .env.local 파일에서 DUCKDNS_DOMAIN 추출 (주석과 공백 제거)
  DUCKDNS_DOMAIN=$(grep -E "^DUCKDNS_DOMAIN=" "$ENV_FILE" | cut -d '=' -f2 | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | tr -d '"' | tr -d "'")
fi

# 최종 검증
if [ -z "$DUCKDNS_TOKEN" ]; then
  echo "Error: DUCKDNS_TOKEN is not set (check environment variable or .env.local file)" >&2
  exit 1
fi

if [ -z "$DUCKDNS_DOMAIN" ]; then
  echo "Error: DUCKDNS_DOMAIN is not set (check environment variable or .env.local file)" >&2
  exit 1
fi

# DuckDNS 업데이트 URL을 안전하게 구성
UPDATE_URL=$(printf "https://www.duckdns.org/update?domains=%s&token=%s&ip=" "$DUCKDNS_DOMAIN" "$DUCKDNS_TOKEN")

# SSL 인증서를 검증하며 요청을 전송 (-k/--insecure 사용 금지)
echo url="$UPDATE_URL" | curl -o "$SCRIPT_DIR/duck.log" -K -