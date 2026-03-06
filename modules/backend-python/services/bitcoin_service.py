from services.market_data_provider import fetch_upbit_data

def get_bitcoin_market_data():
    return fetch_upbit_data("BTC", "비트코인", "KRW-BTC", 140000000.0)
