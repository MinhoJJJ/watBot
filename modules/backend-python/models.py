
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class ChartData(BaseModel):
    date: str
    open: float
    high: float
    low: float
    close: float
    volume: int
    name: str = ""
    dong: str = ""
    area: float = 0.0
    note: str = ""
    price: float = 0.0
    rsi: Optional[float] = None
    sentiment: Optional[float] = None

class FundamentalData(BaseModel):
    per: float = 0.0
    pbr: float = 0.0
    eps: float = 0.0
    roe: float = 0.0
    ev_ebitda: float = 0.0
    peg: float = 0.0
    # 추가 재무 지표
    revenue: float = 0.0  # 당기총매출 (억원)
    operating_profit: float = 0.0  # 당기영업이익 (억원)
    net_income: float = 0.0  # 당기순이익 (억원)
    operating_margin: float = 0.0  # 영업이익률 (%)
    net_margin: float = 0.0  # 순이익률 (%)
    revenue_growth: float = 0.0  # 매출성장률 (%)
    # 전기(前期) 데이터
    prev_revenue: float = 0.0  # 전기총매출
    prev_operating_profit: float = 0.0  # 전기영업이익
    prev_net_income: float = 0.0  # 전기순이익
    prev_operating_margin: float = 0.0  # 전기영업이익률
    prev_net_margin: float = 0.0  # 전기순이익률
    prev_revenue_growth: float = 0.0  # 전기매출성장률
    summary: str = "" # "저평가", "성장주", "고평가" 등

class MarketResponse(BaseModel):
    symbol: str
    name: str
    data: List[ChartData]
    news: List[Dict[str, str]] = []
    prediction: List[ChartData] = []
    prediction_reason: str = ""
    sentiment_ratio: float = 0.0  # Added for sentiment percentage from larger pool
    sentiment_counts: Optional[Dict[str, int]] = None
    extra_info: Dict[str, Any] = None
    fundamentals: Optional[FundamentalData] = None # New field
