from services.market_data_provider import fetch_market_data

def get_nasdaq_market_data():
    return fetch_market_data("NASDAQ", "나스닥 종합", "IXIC", 19000.0)
