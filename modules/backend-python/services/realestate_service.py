import requests
import xml.etree.ElementTree as ET
import urllib3
import logging
import traceback
from datetime import datetime, timedelta

# FastAPI 서버 로그에 기록하기 위한 설정
logger = logging.getLogger("uvicorn.error")
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

def fetch_molit_apt_trade(lawd_cd="41173", min_area=59, max_area=88):
    api_key = "1v9uST3OBb8sOj8SVhlCSHT8CM3ypAZrVBD2TwzHwlR67Ll7pDLzzKYme02cE5IX6eLdi9gYkc0y0sdChn0B4w%3D%3D"
    base_url = "https://apis.data.go.kr/1613000/RTMSDataSvcAptTrade/getRTMSDataSvcAptTrade"

    # 1. 조회 기간 설정 (최근 6개월)
    trade_months = []
    today = datetime.now()
    # 2026.02 기준 6개월
    for i in range(6):
        month_date = (today.replace(day=1) - timedelta(days=i*30)).replace(day=1)
        trade_months.append(month_date.strftime("%Y%m"))

    apt_list = []
    request_urls = []
    raw_responses = [] # 원본 XML 저장용

    for ymd in trade_months:
        params = {
            "serviceKey": api_key, # unquote 하지 않고 그대로 사용해보거나, requests가 인코딩하도록 함
            "LAWD_CD": lawd_cd,
            "DEAL_YMD": ymd,
            "numOfRows": "500"
        }
        
        try:
            print(f"[MOLIT API] 요청 시도: {ymd} (지역코드: {lawd_cd})")
            # 디버깅을 위해 실제 요청 URL 출력
            response = requests.get(base_url, params=params, verify=False, timeout=10)
            print(f"[MOLIT API] 요청 URL: {response.url}")
            
            print(f"[MOLIT API] 응답 수신 ({ymd}): Status {response.status_code}")
            
            # 사용자 요청: 모든 응답 전문을 로그에 기록
            print(f"[DEBUG] 응답내용 전문: {response.text}")

            if response.status_code == 200:
                # 응답이 XML이 아닐 수 있음 (에러 메시지가 HTML로 올 때가 있음)
                if "<" not in response.text:
                    print(f"⚠️ [WARN] {ymd}: 응답이 XML 형식이 아닙니다: {response.text}")
                    continue

                raw_xml = response.text
                raw_responses.append({
                    "ymd": ymd,
                    "full_xml": raw_xml,
                    "total_len": len(raw_xml)
                })
                
                try:
                    root = ET.fromstring(response.content)
                except ET.ParseError as e:
                    print(f"❌ [ERROR] XML 파싱 실패 ({ymd}): {e}")
                    continue

                res_code_elem = root.find('.//resultCode')
                res_msg_elem = root.find('.//resultMsg')
                res_code = res_code_elem.text if res_code_elem is not None else "Unknown"
                res_msg = res_msg_elem.text if res_msg_elem is not None else "Unknown"
                
                if res_code in ['00', '000']:
                    items = root.findall('.//item')
                    print(f"📊 [MOLIT] {ymd}: {len(items)}개의 거래 데이터 발견")
                    
                    if items and ymd == trade_months[0]:
                        # 모든 가능한 태그 확인용
                        all_tags = set()
                        for child in items[0]:
                            all_tags.add(child.tag)
                        print(f"🔍 [DEBUG] 사용 가능한 태그 목록: {list(all_tags)}")

                    area_stats = []
                    for item in items:
                        item_data = {}
                        for child in item:
                            item_data[child.tag.lower()] = child.text.strip() if child.text else ""
                        
                        # 면적 필드: 'excluusear', 'area', '전용면적' 등 대응
                        area_text = item_data.get('excluusear') or item_data.get('area') or item_data.get('전용면적')
                        if not area_text:
                            continue
                        
                        try:
                            area = float(area_text)
                        except ValueError:
                            continue

                        area_stats.append(area)

                        # 면적 필터링
                        if min_area <= area < (max_area + 1):
                            name = item_data.get('aptnm') or item_data.get('아파트') or "아파트명 없음"
                            price_str = item_data.get('dealamount') or item_data.get('거래금액') or "0"
                            day = (item_data.get('dealday') or item_data.get('일') or "01").strip().zfill(2)
                            build_year = item_data.get('buildyear') or item_data.get('건축년도') or ""
                            floor = item_data.get('floor') or item_data.get('층') or ""
                            
                            # 동(Dong) 정보: 'umdnm', '법정동', 'dong' 등 대응
                            dong = (item.findtext('umdNm') or item.findtext('법정동') or 
                                    item_data.get('umdnm') or item_data.get('법정동') or 
                                    item_data.get('dong') or "정보없음")
                            
                            # 가격 처리
                            try:
                                price = int(price_str.replace(',', '').strip()) * 10000
                            except:
                                price = 0
                            
                            suffix_parts = []
                            if build_year: suffix_parts.append(build_year)
                            if floor: suffix_parts.append(f"{floor}층")
                            name_suffix = f" ({' - '.join(suffix_parts)})" if suffix_parts else ""

                            apt_data = {
                                "date": f"{ymd[:4]}-{ymd[4:]}-{day}",
                                "name": name + name_suffix,
                                "original_name": name,
                                "dong": dong,
                                "build_year": build_year,
                                "price": price,
                                "area": area,
                                "close": price,
                                "open": price,
                                "high": price,
                                "low": price,
                                "volume": 1,
                                "note": ""
                            }
                            apt_list.append(apt_data)
                    
                    in_range_count = sum(1 for a in area_stats if min_area <= a < (max_area + 1))
                    print(f"✅ {ymd}: 필터링 전 {len(area_stats)}개 -> 필터링 후 {in_range_count}개")
                else:
                    print(f"❌ [MOLIT API ERROR] 코드: {res_code}, 메시지: {res_msg}")
            else:
                print(f"❌ [MOLIT API] HTTP 에러: {response.status_code}")

        except Exception as e:
            print(f"❌ [MOLIT API] 예외 발생: {str(e)}")
            traceback.print_exc()

    return apt_list, request_urls, raw_responses

def get_realestate_data(lawd_cd="41173", region_name="안양시 동안구", min_area=80, max_area=87, pyeong_name="24평"):
    # 데이터 수집 (사용자 선택 범위)
    apt_list, urls, raw_responses = fetch_molit_apt_trade(lawd_cd, min_area=min_area, max_area=max_area)
    
    # 지역 이름 및 평수 맵핑
    display_name = f"{region_name} ({min_area}~{max_area}m² / 약 {pyeong_name})"
    
    # 역세권 정보 데이터 확충
    station_info = "정보 없음"
    if "동안구" in region_name:
        station_info = "범계역/평촌역/인덕원역 인근"
    elif "만안구" in region_name:
        station_info = "안양역/명학역/석수역 인근"
    elif "장안구" in region_name:
        station_info = "북수원/성균관대역/화서역 인근"
    elif "권선구" in region_name:
        station_info = "수원역/고색역/오목천역 인근"
    elif "팔달구" in region_name:
        station_info = "수원역/화서역/매교역 인근"
    elif "영통구" in region_name:
        station_info = "광교중앙역/상현역/망포역 인근"
    elif "수정구" in region_name:
        station_info = "모란역/산성역/남위례역 인근"
    elif "중원구" in region_name:
        station_info = "모란역/단대오거리역 인근"
    elif "분당구" in region_name:
        station_info = "판교역/서현역/수내역 인근"
    elif "강남구" in region_name:
        station_info = "강남역/압구정역/선릉역 인근"
    elif "서초구" in region_name:
        station_info = "교대역/고속터미널역/방배역 인근"
    elif "송파구" in region_name:
        station_info = "잠실역/가락시장역/문정역 인근"
    elif "마포구" in region_name:
        station_info = "공덕역/망원역/상암역 인근"
    elif "용산구" in region_name:
        station_info = "용산역/신용산역/한남역 인근"
    elif "연수구" in region_name:
        station_info = "송도국제도시/원인재역 인근"
    elif "부평구" in region_name:
        station_info = "부평역/굴포천역 인근"

    if not apt_list:
        print(f"⚠️ 경고: {region_name} ({lawd_cd}) 에 대한 아파트 거래 데이터가 없습니다.")
        print(f"   면적 범위: {min_area} ~ {max_area}m²")

    if apt_list:


        # 1. 같은 아파트명 + 면적 조합은 가장 최신 날짜만 남기기 (주석 처리하여 모든 거래 표시)
        # from collections import defaultdict
        # apt_by_key = defaultdict(list)
        
        # # 아파트명+면적 조합으로 그룹화
        # for apt in apt_list:
        #     key = (apt['name'], apt['area'])
        #     apt_by_key[key].append(apt)
        
        # # 각 그룹에서 가장 최신 날짜만 선택
        # filtered_list = []
        # for key, apts in apt_by_key.items():
        #     # 날짜순으로 정렬 (최신이 먼저)
        #     apts.sort(key=lambda x: x['date'], reverse=True)
        #     filtered_list.append(apts[0])  # 가장 최신 것만
        
        # apt_list = filtered_list
        
        # 2. 최고가/최저가 계산
        # 가격순 정렬
        apt_list.sort(key=lambda x: x['price'], reverse=True)
        highest = apt_list[0]
        lowest = apt_list[-1]

        # 최고가/최저가 태그 추가
        max_price = highest['price']
        min_price = lowest['price']

        for item in apt_list:
            if item['price'] == max_price:
                item['note'] = '최고가'
            elif item['price'] == min_price:
                item['note'] = '최저가'
            else:
                item['note'] = ''
        
        # 3. 사용자 요청: 금액이 높은 순서대로 정렬 (차트에서 가격 분포 확인용)
        apt_list.sort(key=lambda x: x['price'], reverse=True)
        
    else:
        highest = {"name": "N/A", "price": 0, "area": 0, "date": ""}
        lowest = {"name": "N/A", "price": 0, "area": 0, "date": ""}

    # 3. FastAPI가 요구하는 'data' 필드와 'symbol' 필드를 반드시 포함
    # 'data' 필드에는 차트 렌더링을 위한 리스트가 들어가야 함
    return {
        "name": display_name,
        "symbol": f"APT-{lawd_cd}",
        "data": apt_list,  # 차트 데이터가 없다고 나오면 이 리스트가 비어있는 것임
        "extra_info": {
            "highest_apt": highest,
            "lowest_apt": lowest,
            "total_count": len(apt_list),
            "api_urls": urls,  # 여기에 어떤 URL을 쐈는지 담김
            "raw_xml_responses": raw_responses, # 국토부 API 원본 XML 프리뷰
            "station_distance": station_info,
            "fetch_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
    }