
import requests
import re
from typing import List, Tuple, Optional
from models import FundamentalData, ChartData

HEADER = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}

def calculate_analysis_score(f: FundamentalData) -> Tuple[float, List[str]]:
    """
    펀더멘털 데이터를 기반으로 점수(0.1 = 10% 상승)와 근거 리스트를 반환합니다.
    """
    score = 0.0
    reasons = []

    # 1. PER 평가 (낮을수록 좋음)
    if 0 < f.per < 10:
        score += 0.08
        reasons.append(f"저PER({f.per}) 매력")
    elif 10 <= f.per < 20:
        score += 0.02
        reasons.append(f"적정 PER({f.per})")
    elif f.per > 30:
        score -= 0.05
        reasons.append(f"고PER({f.per}) 부담")

    # 2. PBR 평가 (1 미만은 자산가치 우수)
    if 0 < f.pbr < 1.0:
        score += 0.07
        reasons.append(f"PBR({f.pbr}) 저평가")
    elif f.pbr > 4.0:
        score -= 0.03
        reasons.append(f"PBR({f.pbr}) 고평가")

    # 3. ROE (수익성)
    if f.roe > 15:
        score += 0.05
        reasons.append(f"고수익성(ROE {f.roe}%)")
    elif f.roe < 0:
        score -= 0.05
        reasons.append("적자 지속")

    # 4. PEG (성장성)
    if 0 < f.peg < 1.0:
        score += 0.05
        reasons.append("성장성 우수(PEG<1)")

    # 5. EV/EBITDA
    if 0 < f.ev_ebitda < 5.0:
        score += 0.03
        reasons.append("현금창출력 우수")
        
    # 만약 특별한 강점이 없으면
    if score == 0:
        reasons.append("시장 평균 수준")

    return score, reasons

def get_krx_fundamentals(code: str, name: str) -> FundamentalData:
    """
    네이버 금융에서 PER, EPS, PBR, BPS 등 핵심 지표를 크롤링합니다.
    """
    url = f"https://finance.naver.com/item/main.nhn?code={code}"
    
    try:
        response = requests.get(url, headers=HEADER, timeout=3)
        html = response.content.decode('euc-kr', 'ignore')
        
        # HTML 구조 확인을 위한 로그 (필요시 주석 해제)
        # print(f"HTML Preview: {html[:500]}...")
        
        data = {}
        
        # 1. PER, EPS, PBR 추출
        for key, eid in [('per', '_per'), ('eps', '_eps'), ('pbr', '_pbr')]:
            match = re.search(f'<em id="{eid}">([\d\.,]+)</em>', html)
            if match:
                try:
                    data[key] = float(match.group(1).replace(',', ''))
                except:
                    data[key] = 0.0
            else:
                data[key] = 0.0

        # 2. ROE 추정
        if data.get('per', 0) > 0 and data.get('pbr', 0) > 0:
            data['roe'] = round((data['pbr'] / data['per']) * 100, 2)
        elif data.get('pbr', 0) > 0 and data.get('eps', 0) < 0:
            data['roe'] = -5.0
        else:
             data['roe'] = 0.0
             
        # 3. EV/EBITDA & PEG & 추가 재무 데이터 (Real-time Scraping)
        try:
            import pandas as pd
            # text attribute holds the decoded content, but read_html can take the raw html or url.
            # We already have 'html' string decoded.
            dfs = pd.read_html(html)
            
            # Debugging: Check what tables were found
            # print(f"Found {len(dfs)} tables in Naver Finance ({code})")
            
            fin_df = None
            for i, df in enumerate(dfs):
                # '매출액' or '영업이익' in the first column usually implies the financial table
                if len(df) > 0 and (df.iloc[:, 0].astype(str).str.contains('매출액', na=False).any() or '매출액' in str(df.columns)):
                   fin_df = df
                   # print(f"Identified Financial Table at index {i}")
                   break
            
            if fin_df is not None:
                # Set the first column as index to easily finding rows
                fin_df.set_index(fin_df.columns[0], inplace=True)
                
                # The columns usually are grouped by '최근 연간 실적' and '최근 분기 실적'.
                # read_html might produce MultiIndex columns.
                # simpler approach: look at the last column of the "Annual" section.
                # Usually columns are like: [('최근 연간 실적', '2021.12'), ('최근 연간 실적', '2022.12'), ...]
                
                # Let's target the most recent settled annual data or estimate.
                # We will just pick the last column among the annual data part (usually first 4 columns of data).
                # But read_html flattening might vary. 
                
                # Safest: Use the column that has the most recent 'YE' date string (e.g., '2023.12').
                # If MultiIndex, flatten it.
                if isinstance(fin_df.columns, pd.MultiIndex):
                     fin_df.columns = [c[1] if isinstance(c, tuple) else c for c in fin_df.columns]

                # Filter columns that look like dates (YYYY.MM) or estimates (YYYY.MM(E))
                date_cols = [c for c in fin_df.columns if re.match(r'\d{4}\.\d{2}', str(c))]
                
                # Assuming the first few are annual, later are quarterly.
                # Naver usually shows 4 annual, 6 quarterly. 
                # We want the LAST annual one (estimates or recent closed).
                # Let's take the 4th column if available, or the last one that is Annual.
                # Actually, simply taking the column corresponding to the current or last year is good.
                # Let's take the column with the latest year (e.g. 2024.12(E) or 2023.12).
                
                target_col = None
                prev_col = None
                
                if date_cols:
                    # Pick the last 2 annual columns roughly
                    # Identify annual vs quarterly. Annuals usually come first.
                    # We'll just take the 3rd or 4th data column as "Current/Next" and the one before as "Prev".
                    # Naver table structure: Index, Ann1, Ann2, Ann3, Ann4(E), Q1, Q2, Q3, Q4, Q5, Q6.
                    # We want Ann4 (Current/Estimate) and Ann3 (Previous).
                    
                    # Heuristic: Take the 4th column for 'current' (index 3 in 0-based data cols) if exists.
                    # Data cols start at index 0 because we set_index. So fin_df.columns are the data columns.
                    
                    target_col_idx = -1
                    prev_col_idx = -1
                    
                    if len(fin_df.columns) >= 4:
                         target_col_idx = 3
                         prev_col_idx = 2
                    elif len(fin_df.columns) >= 1:
                         target_col_idx = len(fin_df.columns) - 1
                             
                    if target_col_idx != -1:
                        def get_val(row_name, row_idx=None):
                            val = 0.0
                            # 1. Try name match
                            try:
                                # row_name matches contains
                                row = fin_df[fin_df.index.astype(str).str.contains(row_name)]
                                if len(row) > 0:
                                    v = row.iloc[0, target_col_idx]
                                    if not pd.isna(v) and str(v) != '-': 
                                        return float(v)
                            except:
                                pass
                            
                            # 2. Try index fallback if name match returned 0
                            if val == 0.0 and row_idx is not None and row_idx < len(fin_df):
                                try:
                                    v = fin_df.iloc[row_idx, target_col_idx]
                                    if not pd.isna(v) and str(v) != '-':
                                        return float(v)
                                except:
                                    pass
                            return val

                        def get_prev_val(row_name, row_idx=None):
                            val = 0.0
                            if prev_col_idx == -1: return 0.0
                            
                            # 1. Try name match
                            try:
                                row = fin_df[fin_df.index.astype(str).str.contains(row_name)]
                                if len(row) > 0:
                                    v = row.iloc[0, prev_col_idx]
                                    if not pd.isna(v) and str(v) != '-': 
                                        return float(v)
                            except:
                                pass

                            # 2. Fallback
                            if val == 0.0 and row_idx is not None and row_idx < len(fin_df):
                                try:
                                    v = fin_df.iloc[row_idx, prev_col_idx]
                                    if not pd.isna(v) and str(v) != '-':
                                        return float(v)
                                except:
                                    pass
                            return val

                        data['revenue'] = get_val('매출액', 0)
                        data['operating_profit'] = get_val('영업이익', 1)
                        data['net_income'] = get_val('당기순이익', 2)
                        data['operating_margin'] = get_val('영업이익률', 3)
                        data['net_margin'] = get_val('순이익률', 4)
                        data['roe'] = get_val('ROE', 5)
                        data['ev_ebitda'] = get_val('EV/EBITDA', 10)
                        
                        # Previous Data
                        data['prev_revenue'] = get_prev_val('매출액', 0)
                        data['prev_operating_profit'] = get_prev_val('영업이익', 1)
                        data['prev_net_income'] = get_prev_val('당기순이익', 2)
                        data['prev_operating_margin'] = get_prev_val('영업이익률', 3)
                        data['prev_net_margin'] = get_prev_val('순이익률', 4)
                        
                        # Revenue Growth
                        if data['prev_revenue'] > 0:
                            data['revenue_growth'] = round(((data['revenue'] - data['prev_revenue']) / data['prev_revenue']) * 100, 2)
                            
                            # Prev Revenue Growth
                            data['prev_revenue_growth'] = 0.0 

        except Exception as e:
             # print(f"Failed to scrape financial table: {e}")
             pass
             # Fallback to defaults (already 0)

        # 객체 생성
        f_obj = FundamentalData(
            per=data.get('per', 0.0),
            pbr=data.get('pbr', 0.0),
            eps=data.get('eps', 0.0),
            roe=data.get('roe', 0.0),
            ev_ebitda=data.get('ev_ebitda', 0.0),
            peg=data.get('peg', 0.0),
            revenue=data.get('revenue', 0.0),
            operating_profit=data.get('operating_profit', 0.0),
            net_income=data.get('net_income', 0.0),
            operating_margin=data.get('operating_margin', 0.0),
            net_margin=data.get('net_margin', 0.0),
            revenue_growth=data.get('revenue_growth', 0.0),
            prev_revenue=data.get('prev_revenue', 0.0),
            prev_operating_profit=data.get('prev_operating_profit', 0.0),
            prev_net_income=data.get('prev_net_income', 0.0),
            prev_operating_margin=data.get('prev_operating_margin', 0.0),
            prev_net_margin=data.get('prev_net_margin', 0.0),
            prev_revenue_growth=data.get('prev_revenue_growth', 0.0),
            summary=""
        )

        # 4. 점수 계산 및 설명 생성
        score, reasons = calculate_analysis_score(f_obj)
        expected_growth = score * 100
        
        reason_str = ", ".join(reasons)
        direction = "상승" if expected_growth > 0 else "조정"
        
        # 문장 자연스럽게 다듬기
        if expected_growth == 0:
             f_obj.summary = "현재 펀더멘털은 시장 평균 수준이며, 향후 3개월간 횡보가 예측됩니다."
        else:
            f_obj.summary = (
                f"펀더멘털 분석 결과 {reason_str} 등의 요인으로, "
                f"향후 3개월간 약 {expected_growth:+.1f}%의 {direction}이 예측됩니다."
            )

        return f_obj

    except Exception as e:
        # print(f"⚠️ {name} 펀더멘털 데이터 로드 실패: {str(e)[:100]}") # Too noisy if HTML
        return FundamentalData(
            per=0.0, pbr=0.0, eps=0.0, roe=0.0, ev_ebitda=0.0, peg=0.0,
            summary="데이터 로드 실패"
        )

def adjust_prediction_with_fundamentals(prediction_data: List[ChartData], fundamentals: FundamentalData):
    """
    펀더멘털 점수를 기반으로 예측 데이터를 조정합니다.
    """
    if not prediction_data or not fundamentals:
        return

    # 점수 재계산 (일관성 유지)
    score, _ = calculate_analysis_score(fundamentals)
    
    # 90일 동안 score만큼 변화하도록 복리 적용
    # score가 0.15면 (1+x)^90 = 1.15
    daily_adjustment = score / 90.0 
    
    # 변수명을 current_adjustment_factor로 명확하게
    current_factor = 1.0
    
    for candle in prediction_data:
        current_factor *= (1 + daily_adjustment)
        
        candle.open = round(candle.open * current_factor, 2)
        candle.high = round(candle.high * current_factor, 2)
        candle.low = round(candle.low * current_factor, 2)
        # 종가가 가장 중요
        candle.close = round(candle.close * current_factor, 2)
