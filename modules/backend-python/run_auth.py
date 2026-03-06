from google_auth_oauthlib.flow import InstalledAppFlow
import os

# error_logger.py와 동일한 스코프를 사용합니다.
SCOPES = ['https://www.googleapis.com/auth/spreadsheets']
CREDENTIALS_FILE = 'credentials.json'
TOKEN_FILE = 'token.json' # 생성될 파일 이름

def run_authentication():
    """
    credentials.json을 사용하여 사용자 인증을 수행하고 token.json을 생성합니다.
    """
    if not os.path.exists(CREDENTIALS_FILE):
        print(f"!!! [오류] {CREDENTIALS_FILE} 파일을 찾을 수 없습니다.")
        print("!!! 구글 클라우드 콘솔에서 '데스크톱 앱'용 OAuth 2.0 클라이언트 ID를 다운로드하여 이 스크립트와 같은 폴더에 넣어주세요.")
        return

    print(">>> 구글 인증을 시작합니다...")
    print(">>> 잠시 후 웹 브라우저가 열립니다. 계정을 선택하고 권한을 허용해주세요.")
    
    try:
        # credentials.json 파일로부터 인증 흐름(flow)을 생성합니다.
        flow = InstalledAppFlow.from_client_secrets_file(CREDENTIALS_FILE, SCOPES)
        
        # 로컬 서버를 실행하여 사용자의 승인을 받습니다.
        # 이 과정에서 브라우저가 열리고, 사용자가 구글 계정으로 로그인하여 권한을 허용하게 됩니다.
        creds = flow.run_local_server(port=0)
        
        # 성공적으로 인증을 마치면, 발급받은 토큰(access_token, refresh_token 등)을
        # token.json 파일에 저장합니다.
        with open(TOKEN_FILE, 'w') as token:
            token.write(creds.to_json())
            
        print(f"
>>> ✅ 인증 성공! '{TOKEN_FILE}' 파일이 성공적으로 생성되었습니다.")
        print(">>> 이제 백엔드 서버를 실행하면 자동으로 구글 시트에 오류를 기록할 수 있습니다.")

    except Exception as e:
        print(f"!!! [오류] 인증 과정 중 문제가 발생했습니다: {e}")

if __name__ == '__main__':
    run_authentication()
