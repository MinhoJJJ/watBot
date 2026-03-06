from services.market_data_provider import fetch_market_data

def get_samsung_market_data():
    base_response = fetch_market_data("SAMSUNG", "삼성전자", "005930", 70000.0)
    
    # Fundamental Data Injection
    try:
        from services.krx_service import get_krx_fundamentals, adjust_prediction_with_fundamentals
        # print("Fetching Samsung Fundamentals...") # Debug log
        fundamentals = get_krx_fundamentals("005930", "삼성전자")
        base_response.fundamentals = fundamentals
        
        # Prediction Enhancement
        if base_response.prediction:
             adjust_prediction_with_fundamentals(base_response.prediction, fundamentals)
             if fundamentals.summary:
                 base_response.prediction_reason += f" [펀더멘털: {fundamentals.summary}]"
    except Exception as e:
        print(f"Error enhancing Samsung data: {e}")
        
    return base_response
