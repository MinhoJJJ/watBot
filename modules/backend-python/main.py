# Import Models and Services
# Java의 Service/Repository 패턴처럼 분리된 모듈을 import 합니다.
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import sys
import traceback
from error_logger import handle_exception
from models import MarketResponse
from services.nasdaq_service import get_nasdaq_market_data
from services.kospi_service import get_kospi_market_data
from services.sp500_service import get_sp500_market_data
from services.bitcoin_service import get_bitcoin_market_data
from services.ethereum_service import get_ethereum_market_data
from services.samsung_service import get_samsung_market_data
from services.hynix_service import get_hynix_market_data
from services.gold_service import get_gold_market_data
from services.realestate_service import get_realestate_data

app = FastAPI(title="Stock Chart API", version="1.0.0")

# 글로벌 에러 핸들러
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    handle_exception(exc) # 구글 시트로 전송
    return JSONResponse(
        status_code=500,
        content={"message": "Internal Server Error", "detail": str(exc)},
    )

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API 엔드포인트 - Controller 역할
@app.get("/")
def read_root():
    return {
        "message": "Stock Chart API - Powered by FinanceDataReader & Upbit", 
        "status": "running",
        "sources": ["Naver Finance", "Investing.com", "KRX", "Upbit"]
    }

@app.get("/api/market/nasdaq", response_model=MarketResponse)
def get_nasdaq():
    """나스닥 종합지수 (Investing.com or Naver)"""
    return get_nasdaq_market_data()

@app.get("/api/market/kospi", response_model=MarketResponse)
def get_kospi():
    """코스피 지수 (KRX/Naver)"""
    return get_kospi_market_data()

@app.get("/api/market/sp500", response_model=MarketResponse)
def get_sp500():
    """S&P 500 지수 (Get from Investing.com via US500)"""
    return get_sp500_market_data()

@app.get("/api/market/bitcoin", response_model=MarketResponse)
def get_bitcoin():
    """비트코인 (KRW - Upbit)"""
    return get_bitcoin_market_data()

@app.get("/api/market/ethereum", response_model=MarketResponse)
def get_ethereum():
    """이더리움 (KRW - Upbit)"""
    return get_ethereum_market_data()

@app.get("/api/market/samsung", response_model=MarketResponse)
def get_samsung():
    """삼성전자 (KRX)"""
    return get_samsung_market_data()

@app.get("/api/market/hynix", response_model=MarketResponse)
def get_hynix():
    """SK하이닉스 (KRX)"""
    return get_hynix_market_data()

@app.get("/api/market/gold", response_model=MarketResponse)
def get_gold():
    """금 선물 (Investing.com/Yahoo)"""
    return get_gold_market_data()

@app.get("/api/market/realestate", response_model=MarketResponse)
def get_realestate(
    request: Request,
    lawd_cd: str = "41173", 
    region_name: str = "안양시 동안구",
    min_area: str = "80", # int에서 str로 변경하여 validation 에러 방지
    max_area: str = "87", # int에서 str로 변경하여 validation 에러 방지
    pyeong_name: str = "24평"
):
    """지역별/면적별 부동산 데이터"""
    try:
        # 1. 원본 쿼리 파라미터 로깅 (Validation 전 확인용)
        print(f"\n📥 [API 호출됨] /api/market/realestate")
        print(f"📝 [DEBUG] Raw Params: {dict(request.query_params)}")
        
        # 2. 파라미터 전처리 및 타입 변환
        # [object Object] 방어 코드
        if "[object" in str(lawd_cd): lawd_cd = "41173"
        
        # 면적 값 변환 (safe convert)
        try:
            min_a = int(float(str(min_area)))
            max_a = int(float(str(max_area)))
        except (ValueError, TypeError):
            print(f"⚠️ 면적 값이 올바르지 않아 기본값으로 대체합니다. (min:{min_area}, max:{max_area})")
            min_a, max_a = 59, 60 # 기본값 (24평)

        print(f"🔍 [전처리 결과] 지역: {region_name}, 코드: {lawd_cd}, 범위: {min_a}~{max_a}, 평형: {pyeong_name}")
        
        # 3. 데이터 수집 서비스 호출
        result = get_realestate_data(lawd_cd, region_name, min_a, max_a, pyeong_name)
        
        # 4. 최종 결과 확인 로깅
        data_count = len(result['data'])
        if result['data']:
            first_item = result['data'][0]
            print(f"📊 [최종 검증] 첫 번째 아이템: {first_item.get('name')} | 동: {first_item.get('dong')}")
            
        print(f"✅ [응답 완료] {region_name} 데이터 {data_count}개 반환")
        return result
    except Exception as e:
        print(f"❌ 부동산 데이터 엔드포인트 치명적 에러: {e}")
        traceback.print_exc()
        # 에러 시에도 빈 데이터 형식은 맞춰서 반환
        return {
            "name": region_name,
            "symbol": f"ERROR-{lawd_cd}",
            "data": [],
            "extra_info": {"error": str(e)}
        }

@app.get("/api/analyze")
def analyze_stock(symbol: str):
    """
    다중 에이전트(뉴스, 펀더멘털, 경쟁사) 기반 종합 분석
    """
    from agents.manager import agent_manager
    result = agent_manager.analyze_symbol(symbol)
    return result

@app.get("/api/test-error")
def trigger_error():
    """테스트용 에러 발생 엔드포인트"""
    raise ValueError("구글 시트 로깅 테스트용 에러입니다.")

if __name__ == "__main__":
    import uvicorn
    import subprocess
    
    # Windows 이모지 출력 설정
    if sys.platform == "win32":
        sys.stdout.reconfigure(encoding='utf-8')

    # 포트 8989 정리
    def kill_port_8989():
        try:
            if sys.platform == "win32":
                result = subprocess.run(["netstat", "-ano"], capture_output=True, text=True)
                for line in result.stdout.split('\n'):
                    if ':8989' in line and 'LISTENING' in line:
                        pid = line.split()[-1]
                        subprocess.run(["taskkill", "/F", "/PID", pid], capture_output=True)
                        print(f"♻️  기존 프로세스(PID {pid}) 종료됨")
        except:
            pass
    
    kill_port_8989()
    
    print("\n" + "="*50)
    print("🚀 Stock Chart API (Refactored Ver)")
    print("✅ 구조 분리 완료: Controller(main.py) + Services(market, news)")
    print("📡 서버 주소: http://localhost:8989")
    print("="*50 + "\n")
    
    uvicorn.run("main:app", host="0.0.0.0", port=8989, reload=True)
