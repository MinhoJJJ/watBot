from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from services.realestate_service import get_realestate_data
from models import MarketResponse

router = APIRouter()

@router.get("/realestate", response_model=MarketResponse)
def get_realestate(
    lawd_cd: str = "41173", 
    region_name: str = "안양시 동안구",
    min_area: int = 80,
    max_area: int = 87,
    pyeong_name: str = "24평"
):
    try:
        print(f"🔍 [백엔드 요청 수신] 지역: {region_name}, 코드: {lawd_cd}, 평형: {pyeong_name}")
        # Pydantic validation error if frontend sends [object Object]
        # But we can sanitize here if needed, or fix frontend.
        # Let's fix backend robustness too just in case.
        if "object" in str(lawd_cd): lawd_cd = "41173"
        
        result = get_realestate_data(lawd_cd, region_name, min_area, max_area, pyeong_name)
        
        # 마지막으로 데이터 하나만 찍어서 'dong'이 있는지 확인
        if result['data'] and len(result['data']) > 0:
            first_item = result['data'][0]
            print(f"📊 [최종 검증] 첫 번째 아이템 동 정보: {first_item.get('dong')}")
            
        print(f"✅ [응답 준비 완료] 수집된 데이터 수: {len(result['data'])}개")
        return result
    except Exception as e:
        print(f"Error fetching real estate data: {e}")
        raise HTTPException(status_code=500, detail=str(e))
