from services.market_data_provider import fetch_market_data

def get_kospi_market_data():
    return fetch_market_data("KOSPI", "코스피", "KS11", 2600.0)
