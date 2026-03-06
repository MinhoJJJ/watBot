from fastapi import APIRouter
from services.news_service import get_market_news
from agents.manager import AgentManager

router = APIRouter()

@router.get("/analyze")
def analyze_market_sentiment(symbol: str = "KOSPI"):
    # 에이전트 매니저를 통해 종합 분석 수행
    manager = AgentManager(symbol)
    result = manager.analyze()
    return result
