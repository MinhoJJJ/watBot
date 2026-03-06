from fastapi import APIRouter, HTTPException
from typing import Optional
from models import MarketResponse
from services.market_data_provider import fetch_market_data, fetch_upbit_data
from services.samsung_service import get_samsung_market_data
from services.hynix_service import get_hynix_market_data

router = APIRouter()

@router.get("/kospi", response_model=MarketResponse)
def get_kospi():
    return fetch_market_data("KOSPI", "코스피", "KS11", 2600.0)

@router.get("/kosdaq", response_model=MarketResponse)
def get_kosdaq():
    return fetch_market_data("KOSDAQ", "코스닥", "KQ11", 850.0)

@router.get("/us500", response_model=MarketResponse)
def get_us500():
    return fetch_market_data("US500", "S&P 500", "US500", 5000.0)

@router.get("/nasdaq", response_model=MarketResponse)
def get_nasdaq():
    return fetch_market_data("NASDAQ", "나스닥", "IXIC", 16000.0)

@router.get("/samsung", response_model=MarketResponse)
def get_samsung():
    return get_samsung_market_data()

@router.get("/hynix", response_model=MarketResponse)
def get_hynix():
    return get_hynix_market_data()

@router.get("/bitcoin", response_model=MarketResponse)
def get_bitcoin():
    return fetch_upbit_data("BTC", "비트코인", "KRW-BTC", 100000000.0)

@router.get("/ethereum", response_model=MarketResponse)
def get_ethereum():
    return fetch_upbit_data("ETH", "이더리움", "KRW-ETH", 4000000.0)

@router.get("/gold", response_model=MarketResponse)
def get_gold():
    return fetch_market_data("GOLD", "금 선물", "GC=F", 2000.0)
