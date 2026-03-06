from services.market_data_provider import fetch_market_data

def get_sp500_market_data():
    return fetch_market_data("SPX", "S&P 500", "US500", 6100.0)
