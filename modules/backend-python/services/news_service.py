import random
import time
from datetime import datetime, timedelta
from typing import Dict, List, Tuple
from models import ChartData
import feedparser
import re
from concurrent.futures import ThreadPoolExecutor, as_completed

# RSS Feeds Configuration (Base URLs)
GOOGLE_RSS_BASE = "https://news.google.com/rss/search?q={query}&hl=ko&gl=KR&ceid=KR:ko"
GOOGLE_RSS_BASE_US = "https://news.google.com/rss/search?q={query}&hl=en-US&gl=US&ceid=US:en"
GOOGLE_RSS_BASE_JP = "https://news.google.com/rss/search?q={query}&hl=ja&gl=JP&ceid=JP:ja"

def clean_html(raw_html):
    """HTML 태그 제거"""
    cleanr = re.compile('<.*?>')
    cleantext = re.sub(cleanr, '', raw_html)
    return cleantext

def fetch_feed(url: str, tag: str = "") -> List[Dict[str, str]]:
    """단일 RSS 피드 가져오기"""
    headlines = []
    try:
        feed = feedparser.parse(url)
        # Google RSS usually returns up to 100 items. We take all for sentiment, filter later.
        for entry in feed.entries:
            try:
                title = clean_html(entry.title)
            except:
                continue
            
            link = entry.link
            date_str = datetime.now().strftime("%Y-%m-%d") # Default
            
            # Date Parsing
            try:
                if hasattr(entry, 'published_parsed') and entry.published_parsed:
                    dt_utc = datetime(*entry.published_parsed[:6])
                    dt_kst = dt_utc + timedelta(hours=9)
                    date_str = dt_kst.strftime("%Y-%m-%d")
                elif hasattr(entry, 'updated_parsed') and entry.updated_parsed:
                    dt_utc = datetime(*entry.updated_parsed[:6])
                    dt_kst = dt_utc + timedelta(hours=9)
                    date_str = dt_kst.strftime("%Y-%m-%d")
            except:
                pass

            headlines.append({
                "title": f"[{tag} {date_str}] {title}" if tag else title, 
                "link": link,
                "raw_date": date_str
            })
    except Exception as e:
        print(f"Feed fetch error ({url}): {e}")
        
    return headlines

def get_market_news(symbol: str) -> Tuple[List[Dict[str, str]], List[Dict[str, str]]]:
    """
    관련된 RSS 피드를 가져와서 (디스플레이용 뉴스, 감성 분석용 전체 뉴스 풀) 반환
    """
    # 1. Determine feeds to fetch
    feeds_to_fetch = []
    
    # (A) Symbol Specific Feed
    if "KOSPI" in symbol or "KS11" in symbol:
        feeds_to_fetch.append((GOOGLE_RSS_BASE.format(query="KOSPI"), symbol))
    elif "US500" in symbol or "SPX" in symbol:
        feeds_to_fetch.append((GOOGLE_RSS_BASE_US.format(query="S%26P%20500"), symbol))
    elif "BTC" in symbol:
        feeds_to_fetch.append((GOOGLE_RSS_BASE_US.format(query="Bitcoin"), symbol))
    elif "ETH" in symbol:
        feeds_to_fetch.append((GOOGLE_RSS_BASE_US.format(query="Ethereum"), symbol))
    elif "IXIC" in symbol or "NASDAQ" in symbol:
        feeds_to_fetch.append((GOOGLE_RSS_BASE_US.format(query="NASDAQ"), symbol))
    elif "SAMSUNG" in symbol or "005930" in symbol:
        feeds_to_fetch.append((GOOGLE_RSS_BASE.format(query="삼성전자"), symbol))
    elif "HYNIX" in symbol or "000660" in symbol:
        feeds_to_fetch.append((GOOGLE_RSS_BASE.format(query="SK하이닉스"), symbol))
    elif "GOLD" in symbol or "GC=F" in symbol:
        feeds_to_fetch.append((GOOGLE_RSS_BASE_US.format(query="Gold+Price"), symbol))
    elif "ANYANG" in symbol or "APT" in symbol:
        feeds_to_fetch.append((GOOGLE_RSS_BASE.format(query="안양+아파트"), symbol))
    else:
        # Default fallback
        feeds_to_fetch.append((GOOGLE_RSS_BASE_US.format(query=symbol), symbol))

    # (B) Broad Market Feeds (For Sentiment Pool - aiming for ~1000 items logic)
    # We add multiple general market feeds to increase sample size.
    broad_queries = [
        ("주식시장", "Market"), 
        ("경제뉴스", "Economy"), 
        ("KOSPI", "KOSPI"), 
        ("증시", "Stock"),
        ("환율", "Forex"),
        ("금리", "Rate"),
        ("국제유가", "Oil"),
        ("반도체", "Semi")
    ]
    
    # Randomly pick 5 to avoid too many requests but get good coverage
    selected_broad = random.sample(broad_queries, 5)
    for q, tag in selected_broad:
        feeds_to_fetch.append((GOOGLE_RSS_BASE.format(query=q), tag))
        
    # Also add some global context
    feeds_to_fetch.append((GOOGLE_RSS_BASE_US.format(query="Stock+Market"), "Global"))
    feeds_to_fetch.append((GOOGLE_RSS_BASE_JP.format(query="Nikkei"), "Japan"))

    # 2. Parallel Fetch using ThreadPool
    display_news = []
    sentiment_pool = []
    
    with ThreadPoolExecutor(max_workers=5) as executor:
        future_to_url = {executor.submit(fetch_feed, url, tag if tag != symbol else ""): (url, tag) for url, tag in feeds_to_fetch}
        
        for future in as_completed(future_to_url):
            url, tag = future_to_url[future]
            try:
                data = future.result()
                if tag == symbol or (tag == "" and symbol in url): # Primary Symbol News
                    display_news.extend(data)
                elif tag == symbol: # Fallback match
                    display_news.extend(data)
                
                # Add ALL to sentiment pool
                sentiment_pool.extend(data)
            except Exception as exc:
                print(f'{url} generated an exception: {exc}')

    # If display news is empty (rare), use the pool
    if not display_news:
        display_news = sentiment_pool[:30]

    # Ensure display news has the specific symbol Format
    # (Already handled in fetch_feed logic mostly, but let's refine)
    
    return display_news[:30], sentiment_pool

def analyze_sentiment(news_items: List[Dict[str, str]]) -> tuple[float, str, float, Dict[str, int]]:
    """
    키워드 기반 감성 분석 및 근거 생성
    Returns: (score, reason, positive_ratio, counts_dict)
    """
    score = 0
    pos_counts = 0
    neg_counts = 0
    neutral_counts = 0
    total = len(news_items)
    
    if total == 0:
        return 0, "뉴스 데이터 없음", 0.0, {"positive": 0, "negative": 0, "neutral": 0}

    # Positive Keywords (KR/EN)
    bullish_keywords = ['상승', '급등', '최고', 'bull', 'rise', 'soar', 'high', 'gain', 'jump', 'recovery', '호재', '개선', '돌파', 'buy', 'positive', '성장', '기대', '강세']
    # Negative Keywords (KR/EN)
    bearish_keywords = ['하락', '급락', '붕괴', 'bear', 'drop', 'fall', 'low', 'loss', 'crash', 'recession', '악재', '우려', '이탈', 'sell', 'negative', '약세', '공포', '침체']
    
    for item in news_items:
        title_lower = item['title'].lower()
        item_score = 0
        
        for k in bullish_keywords:
            if k in title_lower:
                item_score += 1
                
        for k in bearish_keywords:
            if k in title_lower:
                item_score -= 1
        
        # Assign sentiment field (only needed for display items, but we do it for all here for stats)
        if item_score > 0:
            score += 1 
            pos_counts += 1
            item['sentiment'] = 'positive'
        elif item_score < 0:
            score -= 1
            neg_counts += 1
            item['sentiment'] = 'negative'
        else:
            neutral_counts += 1
            item['sentiment'] = 'neutral'
            
    # Reasoning Generation
    sentiment_str = "중립적"
    if score > 0: sentiment_str = "긍정적 (상승 추세)"
    elif score < 0: sentiment_str = "부정적 (하락 위험)"
    
    pos_ratio = (pos_counts / total) * 100
    
    reason = f"최근 주식 뉴스 {total}건을 분석한 결과, 긍정 {pos_counts}건, 중립 {neutral_counts}건, 부정 {neg_counts}건이 감지되었습니다. 종합적인 시장 심리는 '{sentiment_str}'으로 평가됩니다."
    
    return score, reason, pos_ratio, {"positive": pos_counts, "negative": neg_counts, "neutral": neutral_counts, "total": total}

def generate_news_and_prediction(symbol: str, name: str, current_price: float) -> dict:
    # 1. RSS 뉴스 가져오기 (Display News + Sentiment Pool)
    display_news, sentiment_pool = get_market_news(symbol)
    
    if not display_news:
        display_news = [{"title": f"{name} 관련 최신 뉴스가 없습니다.", "link": "#"}]

    # 2. 감성 점수 계산 (Prediction Logic) - Use Pool for calculation
    sentiment_score, reasoning, pos_ratio, sentiment_counts = analyze_sentiment(sentiment_pool)
    
    # 3. Apply sentiment to display news (they are part of pool, so they have 'sentiment' field set)
    # But analyze_sentiment iterates over the list passed. We passed sentiment_pool.
    # display_news items might be different objects or same references?
    # fetch_feed creates new dicts.
    # We should run analyze_sentiment on display_news too to tag them correctly for UI.
    analyze_sentiment(display_news)

    # 4. 미래 3개월(90일) 예측 데이터 생성
    seed_value = f"{symbol}_{datetime.now().strftime('%Y-%m-%d')}"
    rng = random.Random(seed_value)
    
    prediction_data = []
    pred_price = current_price
    
    # sentiment_score (net score) needs normalization for trend
    # Pool size varies (e.g. 500-1000). Score could be +/- 100.
    # Normalize by total items in pool
    normalized_score = sentiment_score / len(sentiment_pool) if sentiment_pool else 0
    
    # Trend Factor: scaling
    trend_factor = 0.05 * normalized_score # e.g. 0.1 score -> 0.005 daily trend (0.5%)
    
    # Limit volatility
    trend_factor = max(min(trend_factor, 0.005), -0.005)
    
    for i in range(1, 91):
        future_date = datetime.now() + timedelta(days=i)
        
        if future_date.weekday() >= 5:
            continue
            
        daily_change = (rng.random() - 0.5) * 0.02 
        pred_price = pred_price * (1 + daily_change + trend_factor)
        
        prediction_data.append(ChartData(
            date=future_date.strftime("%Y-%m-%d"),
            open=round(pred_price, 2),
            high=round(pred_price * 1.01, 2),
            low=round(pred_price * 0.99, 2),
            close=round(pred_price, 2),
            volume=0 
        ))
        
    return {
        "news": display_news, 
        "prediction": prediction_data, 
        "reason": reasoning,
        "sentiment_ratio": pos_ratio,
        "sentiment_counts": sentiment_counts
    }
