import os
from typing import List
from dataclasses import dataclass
from services.news_service import get_market_news, analyze_sentiment
from services.krx_service import get_krx_fundamentals
import FinanceDataReader as fdr
import requests
import datetime
import random
import json
import re

# Google Gemini API 설정
GEMINI_API_KEY = "AIzaSyCgEjS5BC-pVOeMsHnXxOMgx_oBP2Jn0Vw"

@dataclass
class AgentOpinion:
    name: str  # 에이전트 이름 (ex: 펀더멘털 에이전트)
    score: float # -10 (강력 매도) ~ 10 (강력 매수)
    reason: str 
    details: List[str] # 근거 리스트
    recommendation: str # 매수 / 매도 / 보유

class BaseAgent:
    def analyze(self, symbol: str) -> AgentOpinion:
        return AgentOpinion("기본", 0, "분석 불가", [], "중립")

class NewsAgent(BaseAgent):
    """
    최신 뉴스 및 트렌드 분석 전문가 (Powered by Google Gemini AI)
    """
    def analyze(self, symbol: str) -> AgentOpinion:
        try:
            # 1. 뉴스 데이터 가져오기
            display_news, sentiment_pool = get_market_news(symbol)
            
            if not sentiment_pool:
                return AgentOpinion("뉴스 에이전트 (AI)", 0, "분석할 최신 뉴스가 충분하지 않습니다.", [], "중립 - 데이터 부족")

            # 2. 제미나이에게 보낼 프롬프트 작성
            # 뉴스 제목만 추출 (최대 15개)
            news_headlines = [f"- {news}" for news in sentiment_pool[:15]]
            news_text = "\n".join(news_headlines)
            
            prompt = f"""
            당신은 '월스트리트의 전설적인 투자 분석가' 페르소나를 가진 AI 에이전트입니다.
            아래는 '{symbol}' 주식에 대한 최근 뉴스 헤드라인입니다.
            이 뉴스들을 종합적으로 분석하여 향후 1주일~1개월 간의 주가 흐름을 예측해주세요.

            [최근 뉴스 헤드라인]
            {news_text}

            [분석 요청 사항]
            1. **점수**: -10(강력 매도/악재) ~ +10(강력 매수/호재) 사이의 점수를 주세요.
            2. **추천**: "강력 매수", "매수", "관망", "매도", "강력 매도" 중 하나를 선택하세요.
            3. **이유**: 점수를 부여한 결정적인 이유를 한 문장으로 요약해주세요.
            4. **상세 근거**: 3가지 핵심 포인트를 짧게 요약해주세요.

            응답 형식은 반드시 다음과 같이 JSON 형태로만 주세요 (마크다운 코드 블록 없이):
            {{
                "score": 점수(숫자),
                "recommendation": "추천결과",
                "reason": "핵심 이유 한 문장",
                "details": ["근거1", "근거2", "근거3"]
            }}
            """

            # 3. 모델 호출 (라이브러리 대신 직접 REST API 사용)
            # 사용자가 제공한 JS 코드 방식과 동일하게 직접 URL 호출
            # (gemini-2.5-flash는 아직 존재하지 않는 버전일 가능성이 높아 gemini-1.5-flash를 기본으로 사용합니다)
            # 3. 모델 호출 (Retry 로직 추가)
            model_name = "gemini-flash-latest"  
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={GEMINI_API_KEY}"
            
            headers = {'Content-Type': 'application/json'}
            payload = {
                "contents": [{
                    "parts": [{"text": prompt}]
                }]
            }
            
            max_retries = 3
            for attempt in range(max_retries):
                try:
                    # 타임아웃을 30초로 유지
                    response = requests.post(url, headers=headers, json=payload, timeout=30)
                    
                    try:
                        result = response.json()
                    except ValueError:
                        print(f"Gemini API Non-JSON: {response.text[:100]}...")
                        if attempt < max_retries - 1:
                            continue
                        return AgentOpinion("뉴스 에이전트 (AI)", 0, "AI 서버 응답 오류 (HTML/Non-JSON)", ["API 오류"], "중립")

                    if "candidates" in result and result["candidates"]:
                        result_text = result["candidates"][0]["content"]["parts"][0]["text"]
                        break # Success
                    elif "error" in result:
                        error_msg = result["error"].get("message", "Unknown")
                        print(f"Gemini API Error: {error_msg}")
                        # 쿼터 에러면 즉시 중단
                        if "Quota" in error_msg:
                            return AgentOpinion("뉴스 에이전트 (AI)", 0, f"AI 쿼터 초과: {error_msg}", ["API 쿼터 초과"], "중립")
                        if attempt < max_retries - 1:
                            import time
                            time.sleep(1) # 잠시 대기
                            continue
                        return AgentOpinion("뉴스 에이전트 (AI)", 0, f"AI 응답 오류: {error_msg}", ["API 에러"], "중립")
                    else:
                        if attempt < max_retries - 1: continue
                        return AgentOpinion("뉴스 에이전트 (AI)", 0, f"AI 응답 형식이 예상과 다릅니다.", ["응답 없음"], "중립")
                        
                except Exception as e:
                    print(f"Gemini Request Error (Attempt {attempt+1}): {e}")
                    if attempt < max_retries - 1:
                        import time
                        time.sleep(1)
                        continue
                    return AgentOpinion("뉴스 에이전트 (AI)", 0, f"네트워크 오류: {str(e)}", ["네트워크 연결 실패"], "중립")

            # 4. JSON 결과 파싱 (성공 시)
            try:
                # 마크다운 블록 제거 및 JSON 파싱
                clean_json = re.sub(r'```json\n?|\n?```', '', result_text).strip()
                data = json.loads(clean_json)
                
                return AgentOpinion(
                    name="뉴스 에이전트 (AI)",
                    score=float(data.get("score", 0)),
                    reason=data.get("reason", "분석 완료"),
                    details=data.get("details", []),
                    recommendation=data.get("recommendation", "중립")
                )
            except Exception as e:
                print(f"JSON Parsing Error: {e}")
                return AgentOpinion("뉴스 에이전트 (AI)", 0, f"AI 응답 분석 실패: {str(e)}", ["응답 형식 오류"], "중립")

        except Exception as e:
            print(f"Gemini API Error: {str(e)}")
            return AgentOpinion("뉴스 에이전트 (AI)", 0, f"AI 분석 중 오류가 발생했습니다: {str(e)}", ["API 연결 실패"], "중립")

class FundamentalAgent(BaseAgent):
    """재무제표 및 가치평가 전문가 (PER, PBR)"""
    def analyze(self, symbol: str) -> AgentOpinion:
        # 삼성전자, 하이닉스 코드 매핑
        code = "005930" if "SAMSUNG" in symbol else "000660"
        name = "삼성전자" if "SAMSUNG" in symbol else "SK하이닉스"
        
        fund = get_krx_fundamentals(code, name)
        
        # 점수 산정 (-10 ~ 10)
        score = 0
        details = []
        
        # PER
        if 0 < fund.per < 10:
            score += 4
            details.append(f"PER {fund.per}배로 저평가 상태입니다.")
        elif fund.per > 25:
            score -= 3
            details.append(f"PER {fund.per}배로 다소 고평가 부담이 있습니다.")
            
        # PBR
        if 0 < fund.pbr < 1.0:
            score += 3
            details.append(f"PBR {fund.pbr}배로 자산가치 대비 저평가입니다.")
            
        # ROE
        if fund.roe > 10:
            score += 3
            details.append(f"ROE {fund.roe}%로 수익성이 양호합니다.")
        elif fund.roe < 0:
            score -= 5
            details.append("적자 상태로 재무 리스크가 있습니다.")
            
        norm_score = max(min(score, 10), -10)
        
        rec = "보유"
        if norm_score > 3: rec = "매수"
        if norm_score < -3: rec = "매도"
        
        # fund.summary가 있는지 체크 (Optional)
        reason = getattr(fund, 'summary', "재무 데이터 분석 결과입니다.")
        if not reason:
            reason = "재무 데이터 분석 결과입니다."
        
        return AgentOpinion("펀더멘털 에이전트", norm_score, reason, details, rec)


class CompetitorAgent(BaseAgent):
    """글로벌 경쟁사(TSMC, 마이크론) 비교 분석"""
    def analyze(self, symbol: str) -> AgentOpinion:
        # 반도체 섹터가 아니면 스킵
        if "SAMSUNG" not in symbol and "HYNIX" not in symbol:
            return AgentOpinion("경쟁사 에이전트", 0, "해당 종목은 분석 대상이 아닙니다.", [], "중립")
            
        # TSMC (TSM), 마이크론 (MU) 주가 추이 (최근 7일)
        try:
            # 최근 10일치 데이터를 가져와서 안전하게 처리
            end_date = datetime.datetime.now()
            start_date = end_date - datetime.timedelta(days=10)
            
            tsm = fdr.DataReader('TSM', start_date)
            mu = fdr.DataReader('MU', start_date)
            
            if tsm.empty or mu.empty:
                 return AgentOpinion("경쟁사 에이전트", 0, "경쟁사 데이터를 불러올 수 없습니다.", [], "중립")

            # 최근 종가와 5일 전(또는 가능한 가장 오래된) 종가 비교
            tsm_latest = tsm['Close'].iloc[-1]
            tsm_prev = tsm['Close'].iloc[0]
            tsm_chg = (tsm_latest - tsm_prev) / tsm_prev * 100
            
            mu_latest = mu['Close'].iloc[-1]
            mu_prev = mu['Close'].iloc[0]
            mu_chg = (mu_latest - mu_prev) / mu_prev * 100
            
            score = 0
            details = []
            
            details.append(f"TSMC 최근 변동률: {tsm_chg:.1f}%")
            details.append(f"마이크론 최근 변동률: {mu_chg:.1f}%")
            
            avg_chg = (tsm_chg + mu_chg) / 2
            
            # 경쟁사가 오르면 같이 오를 가능성 높음 (커플링)
            if avg_chg > 2:
                score += 3
                reason = "글로벌 반도체 경쟁사들이 강세를 보이고 있어 긍정적입니다."
            elif avg_chg < -2:
                score -= 3
                reason = "글로벌 반도체 섹터가 약세를 보이고 있습니다."
            else:
                reason = "경쟁사 주가는 보합권입니다."
                
            return AgentOpinion("경쟁사 에이전트", score, reason, details, "매수" if score > 0 else "중립")
            
        except Exception as e:
            print(f"Competitor Agent Error: {e}")
            return AgentOpinion("경쟁사 에이전트", 0, f"경쟁사 데이터 조회 실패: {str(e)}", [], "중립 - 에러")
