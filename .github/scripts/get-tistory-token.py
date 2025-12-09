#!/usr/bin/env python3
"""
Tistory Access Token 발급 도우미
웹 브라우저를 자동으로 열고 인증 후 토큰을 발급받습니다.
"""

import sys
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import requests
import webbrowser

# 여기에 Tistory 앱 등록에서 받은 값을 입력하세요
CLIENT_ID = input("Client ID를 입력하세요: ").strip()
CLIENT_SECRET = input("Secret Key를 입력하세요: ").strip()

REDIRECT_URI = "http://localhost:5000/callback"

class CallbackHandler(BaseHTTPRequestHandler):
    """OAuth 콜백 처리"""
    
    def log_message(self, format, *args):
        """로그 출력 비활성화"""
        pass
    
    def do_GET(self):
        """GET 요청 처리"""
        query = parse_qs(urlparse(self.path).query)
        code = query.get('code', [None])[0]
        
        if code:
            print(f"\n✅ 인증 코드 받기 성공: {code[:20]}...")
            
            # Access Token 교환
            print("🔄 Access Token 교환 중...")
            token_url = (
                f"https://www.tistory.com/oauth/access_token"
                f"?client_id={CLIENT_ID}"
                f"&client_secret={CLIENT_SECRET}"
                f"&redirect_uri={REDIRECT_URI}"
                f"&code={code}"
                f"&grant_type=authorization_code"
            )
            
            try:
                response = requests.post(token_url)
                response.raise_for_status()
                
                # access_token 추출
                access_token = response.text.split('=')[1]
                
                # 성공 메시지
                self.send_response(200)
                self.send_header('Content-type', 'text/html; charset=utf-8')
                self.end_headers()
                
                html = f"""
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <title>인증 성공!</title>
                    <style>
                        body {{ font-family: Arial, sans-serif; text-align: center; padding: 50px; }}
                        .success {{ color: green; font-size: 24px; }}
                        .token {{ 
                            background: #f0f0f0; 
                            padding: 20px; 
                            margin: 20px;
                            border-radius: 5px;
                            word-break: break-all;
                            font-family: monospace;
                        }}
                    </style>
                </head>
                <body>
                    <div class="success">✅ 인증 성공!</div>
                    <h2>Access Token:</h2>
                    <div class="token">{access_token}</div>
                    <p>위 토큰을 복사하여 GitHub Secrets에 저장하세요.</p>
                    <p><strong>이 창을 닫고 터미널로 돌아가세요.</strong></p>
                </body>
                </html>
                """
                
                self.wfile.write(html.encode('utf-8'))
                
                print("\n" + "="*60)
                print("✅ ACCESS TOKEN 발급 성공!")
                print("="*60)
                print(f"\n{access_token}\n")
                print("="*60)
                print("\n📋 위 Access Token을 복사하여 GitHub Secrets에 저장하세요!")
                print("   Secret 이름: TISTORY_ACCESS_TOKEN")
                print("="*60 + "\n")
                
            except Exception as e:
                print(f"❌ 토큰 교환 실패: {e}")
                self.send_response(500)
                self.end_headers()
        else:
            self.send_response(400)
            self.end_headers()

def main():
    print("\n" + "="*60)
    print("🔑 Tistory Access Token 발급 도우미")
    print("="*60 + "\n")
    
    if not CLIENT_ID or not CLIENT_SECRET:
        print("❌ Client ID와 Secret Key를 입력해야 합니다.")
        sys.exit(1)
    
    # 인증 URL 생성
    auth_url = (
        f"https://www.tistory.com/oauth/authorize"
        f"?client_id={CLIENT_ID}"
        f"&redirect_uri={REDIRECT_URI}"
        f"&response_type=code"
    )
    
    print("📝 단계:")
    print("  1. 브라우저가 자동으로 열립니다")
    print("  2. Tistory 로그인 후 권한 승인")
    print("  3. Access Token이 자동으로 표시됩니다\n")
    
    input("준비되었으면 Enter를 누르세요...")
    
    # 브라우저 열기
    print("\n🌐 브라우저를 여는 중...")
    webbrowser.open(auth_url)
    
    # 로컬 서버 시작
    print("🔄 인증 대기 중... (브라우저에서 권한 승인해주세요)\n")
    
    try:
        server = HTTPServer(('localhost', 5000), CallbackHandler)
        server.handle_request()
        server.server_close()
    except KeyboardInterrupt:
        print("\n\n❌ 사용자가 중단했습니다.")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ 서버 오류: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
