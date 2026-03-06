from datetime import datetime, timedelta
import random
import requests
import math
from typing import List, Optional

# models.py import (needs to be in python path)
# Assuming run from backend-python root
try:
    from models import ChartData, MarketResponse
    from services.news_service import generate_news_and_prediction
except ImportError:
    import sys
    import os
    sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from models import ChartData, MarketResponse
    from services.news_service import generate_news_and_prediction

# FinanceDataReader & Pandas
try:
    import FinanceDataReader as fdr
    import pandas as pd
    FDR_AVAILABLE = True
except ImportError:
    FDR_AVAILABLE = False
    print("⚠️  FinanceDataReader 또는 pandas 없음. pip install finance-datareader pandas")



def calculate_technical_indicators(data_list: List[ChartData]):
    """
    ChartData 리스트를 받아 RSI와 투자심리도를 계산하여 업데이트
    """
    if not FDR_AVAILABLE or len(data_list) < 15:
        return

    try:
        # DataFrame으로 변환
        df = pd.DataFrame([vars(d) for d in data_list])
        df['close'] = df['close'].astype(float)
        
        # 1. RSI (14일)
        delta = df['close'].diff()
        gain = (delta.where(delta > 0, 0)).fillna(0)
        loss = (-delta.where(delta < 0, 0)).fillna(0)
        
        avg_gain = gain.rolling(window=14, min_periods=14).mean()
        avg_loss = loss.rolling(window=14, min_periods=14).mean()
        
        # 0으로 나누기 방지
        rs = avg_gain / avg_loss.replace(0, 0.00001)
        df['rsi'] = 100 - (100 / (1 + rs))
        
        # 2. 투자심리도 (10일)
        # 10일간 상승일수 / 10 * 100
        is_up = (delta > 0).astype(int)
        df['sentiment'] = is_up.rolling(window=10, min_periods=10).sum() / 10 * 100
        
        # 결과 다시 data_list에 반영
        for i, row in df.iterrows():
            rsi_val = row['rsi']
            sent_val = row['sentiment']
            
            if not math.isnan(rsi_val):
                data_list[i].rsi = round(rsi_val, 2)
            if not math.isnan(sent_val):
                data_list[i].sentiment = round(sent_val, 2)
                
    except Exception as e:
        print(f"지표 계산 중 오류: {e}")

# 실제적인 모의 데이터 생성 함수 (Fallback)
def generate_realistic_mock_data(symbol: str, name: str, base_price: float) -> MarketResponse:
    """실제 시장 동향을 반영한 모의 데이터 생성"""
    data_list = []
    current_price = base_price
    
    # 200일치 모의 데이터 (120일 이평선 계산을 위해 충분한 기간 확보)
    for i in range(199, -1, -1):
        date = datetime.now() - timedelta(days=i)
        date_str = date.strftime("%Y-%m-%d")
        
        # 주말 제외
        if date.weekday() >= 5: 
            continue
        
        daily_change_pct = (random.random() - 0.5) * 0.04
        current_price = current_price * (1 + daily_change_pct)
        
        open_price = current_price * (1 + (random.random() - 0.5) * 0.01)
        close_price = current_price * (1 + (random.random() - 0.5) * 0.01)
        high_price = max(open_price, close_price) * (1 + random.random() * 0.01)
        low_price = min(open_price, close_price) * (1 - random.random() * 0.01)
        
        base_volume = 1000000 if "BTC" in symbol or "ETH" in symbol else 100000000
        volume = int(base_volume * (0.5 + random.random()))
        
        # Mock Indicators
        mock_rsi = 30 + random.random() * 40 # 30~70
        mock_sentiment = 20 + random.random() * 60 # 20~80
        
        data_list.append(ChartData(
            date=date_str,
            open=round(open_price, 2),
            high=round(high_price, 2),
            low=round(low_price, 2),
            close=round(close_price, 2),
            volume=volume,
            rsi=round(mock_rsi, 2),
            sentiment=round(mock_sentiment, 2)
        ))
    
    # 예측 및 뉴스 생성
    extra_info = generate_news_and_prediction(symbol, name, current_price)
    
    return MarketResponse(
        symbol=symbol, 
        name=name, 
        data=data_list,
        news=extra_info["news"],
        prediction=extra_info["prediction"],
        prediction_reason=extra_info.get("reason", ""),
        sentiment_ratio=extra_info.get("sentiment_ratio", 0.0),
        sentiment_counts=extra_info.get("sentiment_counts", None)
    )

# 통합 데이터 가져오기 (FinanceDataReader + Naver)
def fetch_market_data(symbol: str, name: str, code: str, base_price: float) -> MarketResponse:
    """
    FinanceDataReader를 사용하여 데이터 수집 (네이버 금융, Investing.com 등)
    """
    if not FDR_AVAILABLE:
        print(f"⚠️  {name} 라이브러리 미설치. 모의 데이터 사용.")
        return generate_realistic_mock_data(symbol, name, base_price)
    
    try:
        end_date = datetime.now()
        start_date = end_date - timedelta(days=200) # 120일 이평선을 위해 200일 확보
        
        # 데이터 가져오기
        # print(f"📥 {name} ({code}) 데이터 요청 중...") # Reduce noise
        df = fdr.DataReader(code, start_date, end_date)
        
        # 데이터가 이상하게 출력되는지 확인
        # if len(df) > 0:
        #     print(f"[{name}] Head:\n{df.head(2)}")
        
        if df.empty or len(df) == 0:
            print(f"⚠️  {name} 데이터 없음 (소스 반환값 0). 모의 데이터 사용.")
            return generate_realistic_mock_data(symbol, name, base_price)
        
        data_list = []
        last_close = base_price
        
        for index, row in df.iterrows():
            date_str = index.strftime("%Y-%m-%d")
            
            try:
                if 'Close' in row: close_val = float(str(row['Close']).replace(',', ''))
                elif 'Price' in row: close_val = float(str(row['Price']).replace(',', ''))
                else: continue

                open_val = float(str(row.get('Open', close_val)).replace(',', ''))
                high_val = float(str(row.get('High', close_val)).replace(',', ''))
                low_val = float(str(row.get('Low', close_val)).replace(',', ''))
                
                vol_val = 0
                if 'Volume' in row: vol_val = row['Volume']
                elif 'Vol.' in row: 
                    try: vol_val = float(str(row['Vol.']).replace('K','000').replace('M','000000').replace('B','000000000').replace(',',''))
                    except: vol_val = 0
                
                data_list.append(ChartData(
                    date=date_str,
                    open=round(open_val, 2),
                    high=round(high_val, 2),
                    low=round(low_val, 2),
                    close=round(close_val, 2),
                    volume=int(vol_val)
                ))
                last_close = close_val
            except:
                continue
                
        if len(data_list) < 5:
            return generate_realistic_mock_data(symbol, name, base_price)

        # last_close가 유효한지 확인
        if last_close is None or (isinstance(last_close, float) and math.isnan(last_close)) or last_close == 0:
            last_close = base_price

        # 기술적 지표 계산
        calculate_technical_indicators(data_list)

        # 예측 및 뉴스 생성
        extra_info = generate_news_and_prediction(symbol, name, last_close)

        # print(f"✅ {name} 데이터 {len(data_list)}개 로드 완료. (Source: FinanceDataReader)")
        return MarketResponse(
            symbol=symbol, 
            name=name, 
            data=data_list,
            news=extra_info["news"],
            prediction=extra_info["prediction"],
            prediction_reason=extra_info.get("reason", ""),
            sentiment_ratio=extra_info.get("sentiment_ratio", 0.0),
            sentiment_counts=extra_info.get("sentiment_counts", None)
        )
        
    except Exception as e:
        print(f"❌ {name} 데이터 가져오기 실패: {e}")
        return generate_realistic_mock_data(symbol, name, base_price)

# Upbit 데이터 가져오기 (requests 사용)
def fetch_upbit_data(symbol: str, name: str, market_code: str, base_price: float) -> MarketResponse:
    """Upbit API를 사용하여 암호화폐 데이터 수집"""
    try:
        url = "https://api.upbit.com/v1/candles/days"
        params = { "market": market_code, "count": 200 }
        headers = {"accept": "application/json"}
        
        # print(f"📥 {name} ({market_code}) Upbit 데이터 요청 중...")
        response = requests.get(url, params=params, headers=headers)
        
        if response.status_code != 200:
            return generate_realistic_mock_data(symbol, name, base_price)
            
        data = response.json()
        
        if not data or len(data) == 0:
            return generate_realistic_mock_data(symbol, name, base_price)
            
        data_list = []
        last_close = base_price
        
        for candle in reversed(data):
            c_price = float(candle['trade_price'])
            data_list.append(ChartData(
                date=candle['candle_date_time_kst'].split('T')[0],
                open=float(candle['opening_price']),
                high=float(candle['high_price']),
                low=float(candle['low_price']),
                close=c_price,
                volume=int(float(candle['candle_acc_trade_volume']))
            ))
            last_close = c_price
            
        # 기술적 지표 계산
        calculate_technical_indicators(data_list)
            
        # 예측 및 뉴스 생성
        extra_info = generate_news_and_prediction(symbol, name, last_close)
            
        # print(f"✅ {name} 데이터 {len(data_list)}개 로드 완료 (Source: Upbit)")
        return MarketResponse(
            symbol=symbol, 
            name=name, 
            data=data_list,
            news=extra_info["news"],
            prediction=extra_info["prediction"],
            prediction_reason=extra_info.get("reason", ""),
            sentiment_ratio=extra_info.get("sentiment_ratio", 0.0),
            sentiment_counts=extra_info.get("sentiment_counts", None)
        )
        
    except Exception as e:
        print(f"❌ {name} Upbit 데이터 가져오기 실패: {e}")
        return generate_realistic_mock_data(symbol, name, base_price)
