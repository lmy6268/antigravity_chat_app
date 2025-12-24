#!/bin/bash
# DuckDNS 토큰은 환경 변수에서 가져옵니다
# 환경 변수가 설정되지 않은 경우 에러를 출력하고 종료합니다
if [ -z "$DUCKDNS_TOKEN" ]; then
  echo "Error: DUCKDNS_TOKEN environment variable is not set" >&2
  exit 1
fi

if [ -z "$DUCKDNS_DOMAIN" ]; then
  echo "Error: DUCKDNS_DOMAIN environment variable is not set" >&2
  exit 1
fi

echo url="https://www.duckdns.org/update?domains=${DUCKDNS_DOMAIN}&token=${DUCKDNS_TOKEN}&ip=" | curl -k -o ./duck.log -K -