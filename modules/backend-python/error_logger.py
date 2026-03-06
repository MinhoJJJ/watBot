import os
import datetime
import traceback
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

SCOPES = ['https://www.googleapis.com/auth/spreadsheets']
SPREADSHEET_ID = '1UoOniGveYLZkFkXDRCHZpeh72QAV6n1usISAXpjmgsM'

def log_error_to_sheet(error_type, message, file_info):
    """에러를 구글 시트에 기록합니다."""
    creds = None
    # root 또는 backend-python 폴더 어디서든 token.json을 찾을 수 있도록 경로 조정
    token_path = 'token.json'
    if not os.path.exists(token_path):
        token_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'token.json')
    
    if os.path.exists(token_path):
        creds = Credentials.from_authorized_user_file(token_path, SCOPES)
    else:
        print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
        print("!!! [알림] token.json 파일이 없어 구글 시트 로깅을 건너뜁니다. !!!")
        print(f"!!! 예상 경로: {os.path.abspath(token_path)}")
        print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
        return # 토큰 없으면 무시

    try:
        service = build('sheets', 'v4', credentials=creds)
        now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        values = [[now, error_type, message, file_info, "대기 중"]]
        body = {'values': values}
        
        service.spreadsheets().values().append(
            spreadsheetId=SPREADSHEET_ID,
            range="Error Logs!A:E",
            valueInputOption='RAW',
            body=body
        ).execute()
    except Exception as e:
        print(f"Failed to log error to sheet: {e}")

def handle_exception(exc):
    """익셉션 객체를 받아 시트에 로깅합니다."""
    error_type = type(exc).__name__
    message = str(exc)
    
    # Python 3.11+ 대응: 트레이스백에서 실제 파일 정보가 있는 라인을 찾습니다.
    tb_lines = traceback.format_exc().splitlines()
    file_info = "Unknown"
    
    # 뒤에서부터 검색하여 "File "로 시작하는 라인을 찾습니다.
    # 보통 마지막에서 2~3번째 라인에 위치합니다 (3.11+에서는 ~~^~~ 라인이 추가됨)
    for i in range(len(tb_lines) - 1, -1, -1):
        line = tb_lines[i].strip()
        if line.startswith('File "'):
            file_info = line
            break
            
    log_error_to_sheet(error_type, message, file_info)
