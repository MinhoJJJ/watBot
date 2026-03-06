from services.market_data_provider import fetch_market_data

def get_gold_market_data():
    # GC=F is Gold Futures on Yahoo Finance
    return fetch_market_data("GOLD", "금 선물", "GC=F", 2000.0)
