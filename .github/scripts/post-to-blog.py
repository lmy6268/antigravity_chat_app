#!/usr/bin/env python3
"""
Tistory 블로그 자동 포스팅 스크립트
생성된 마크다운 블로그 글을 Tistory API를 통해 자동으로 게시합니다.
"""

import os
import sys
import argparse
import requests
from datetime import datetime

def post_to_tistory(title, content_file, access_token, blog_name, category=None, visibility=3):
    """
    Tistory API를 사용하여 블로그 글을 게시합니다.
    
    Args:
        title: 블로그 글 제목
        content_file: 마크다운 파일 경로
        access_token: Tistory API access token
        blog_name: 블로그 이름 (예: mydevblog)
        category: 카테고리 ID (선택사항)
        visibility: 공개 설정 (0=비공개, 1=보호, 3=발행)
    
    Returns:
        포스팅 성공 시 post ID, 실패 시 None
    """
    
    # 마크다운 파일 읽기
    try:
        with open(content_file, 'r', encoding='utf-8') as f:
            content = f.read()
    except FileNotFoundError:
        print(f"❌ 파일을 찾을 수 없습니다: {content_file}")
        return None
    except Exception as e:
        print(f"❌ 파일 읽기 오류: {e}")
        return None
    
    # API 엔드포인트
    url = "https://www.tistory.com/apis/post/write"
    
    # 요청 데이터
    data = {
        "access_token": access_token,
        "output": "json",
        "blogName": blog_name,
        "title": title,
        "content": content,
        "visibility": visibility,
        "tag": "개발일지,블로그자동화,Gemini AI,GitHub Actions"
    }
    
    # 카테고리가 지정된 경우 추가
    if category:
        data["category"] = category
    
    # API 호출
    try:
        print(f"📤 Tistory에 포스팅 중...")
        print(f"   - 블로그: {blog_name}")
        print(f"   - 제목: {title}")
        print(f"   - 공개 설정: {'발행' if visibility == 3 else '비공개' if visibility == 0 else '보호'}")
        
        response = requests.post(url, data=data)
        response.raise_for_status()
        
        result = response.json()
        
        if result.get("tistory", {}).get("status") == "200":
            post_id = result["tistory"]["postId"]
            post_url = result["tistory"]["url"]
            
            print(f"✅ 포스팅 성공!")
            print(f"   - Post ID: {post_id}")
            print(f"   - URL: {post_url}")
            
            # GitHub Actions 환경변수로 출력
            if "GITHUB_OUTPUT" in os.environ:
                with open(os.environ["GITHUB_OUTPUT"], "a") as f:
                    f.write(f"post_id={post_id}\n")
                    f.write(f"post_url={post_url}\n")
            
            return post_id
        else:
            error_msg = result.get("tistory", {}).get("error_message", "알 수 없는 오류")
            print(f"❌ 포스팅 실패: {error_msg}")
            return None
            
    except requests.exceptions.RequestException as e:
        print(f"❌ API 호출 오류: {e}")
        return None
    except Exception as e:
        print(f"❌ 예상치 못한 오류: {e}")
        return None


def main():
    parser = argparse.ArgumentParser(description="Tistory 블로그 자동 포스팅")
    parser.add_argument("--title", required=True, help="블로그 글 제목")
    parser.add_argument("--content", required=True, help="마크다운 파일 경로")
    parser.add_argument("--visibility", type=int, default=3, choices=[0, 1, 3],
                       help="공개 설정 (0=비공개, 1=보호, 3=발행)")
    
    args = parser.parse_args()
    
    # 환경 변수에서 인증 정보 가져오기
    access_token = os.environ.get("TISTORY_ACCESS_TOKEN")
    blog_name = os.environ.get("TISTORY_BLOG_NAME")
    category = os.environ.get("BLOG_CATEGORY")
    
    if not access_token:
        print("❌ TISTORY_ACCESS_TOKEN 환경 변수가 설정되지 않았습니다.")
        sys.exit(1)
    
    if not blog_name:
        print("❌ TISTORY_BLOG_NAME 환경 변수가 설정되지 않았습니다.")
        sys.exit(1)
    
    # 포스팅 실행
    post_id = post_to_tistory(
        title=args.title,
        content_file=args.content,
        access_token=access_token,
        blog_name=blog_name,
        category=category,
        visibility=args.visibility
    )
    
    if post_id:
        sys.exit(0)
    else:
        sys.exit(1)


if __name__ == "__main__":
    main()
