from services.market_data_provider import fetch_upbit_data

def get_ethereum_market_data():
    return fetch_upbit_data("ETH", "이더리움", "KRW-ETH", 4000000.0)
