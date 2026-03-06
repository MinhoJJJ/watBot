// 부동산 실거래가 조회 모듈 ( estate_data.js )
var legal_code_data = require('./legal_code_data.js');

var API_KEY = "1v9uST3OBb8sOj8SVhlCSHT8CM3ypAZrVBD2TwzHwlR67Ll7pDLzzKYme02cE5IX6eLdi9gYkc0y0sdChn0B4w%3D%3D";
var BASE_URL = "https://apis.data.go.kr/1613000/RTMSDataSvcAptTrade/getRTMSDataSvcAptTrade";

/**
 * 실거래가 데이터 가져오기
 * @param {string} regionName "안양시 동안구"
 * @param {number} pyeong 24
 */
function getRealEstatePrice(regionName, pyeong) {
    // 1. 전국 법정동 코드 검색
    var lawdCd = legal_code_data.findLawdCd(regionName);

    if (!lawdCd) return "❌ 지원하지 않는 지역이거나 정확한 시/군/구 단위까지 입력해주세요. (예: 안양시 동안구, 평택시 등)";

    // 2. 평수 -> 전용면적 근사치 계산 (±10m² 범위 검색)
    var targetArea = pyeong * 2.5; 
    if (pyeong == 24 || pyeong == 25) targetArea = 59;
    if (pyeong == 33 || pyeong == 34) targetArea = 84;

    var now = new Date();
    var dealYmd = now.getFullYear() + ("0" + (now.getMonth() + 1)).slice(-2);

    try {
        var url = BASE_URL + "?serviceKey=" + API_KEY + "&LAWD_CD=" + lawdCd + "&DEAL_YMD=" + dealYmd + "&numOfRows=100";
        
        var response = org.jsoup.Jsoup.connect(url)
            .ignoreContentType(true)
            .ignoreHttpErrors(true)
            .timeout(10000)
            .get();

        var items = response.select("item");
        if (items.size() == 0) {
            // 이번 달 데이터가 없으면 저번 달 데이터 시도
            var lastMonth = new Date();
            lastMonth.setMonth(now.getMonth() - 1);
            dealYmd = lastMonth.getFullYear() + ("0" + (lastMonth.getMonth() + 1)).slice(-2);
            url = BASE_URL + "?serviceKey=" + API_KEY + "&LAWD_CD=" + lawdCd + "&DEAL_YMD=" + dealYmd + "&numOfRows=100";
            response = org.jsoup.Jsoup.connect(url).ignoreContentType(true).ignoreHttpErrors(true).get();
            items = response.select("item");
        }

        if (items.size() == 0) return "🏠 " + regionName + " 인근의 최근 실거래 데이터가 아직 없습니다.";

        var result = "🏠 [" + regionName + " " + pyeong + "평형 실거래가]\n";
        var count = 0;

        for (var i = 0; i < items.size(); i++) {
            var item = items.get(i);
            var area = parseFloat(item.select("excluUseAr").text());
            
            if (Math.abs(area - targetArea) <= 10) {
                var name = item.select("aptNm").text();
                var price = item.select("dealAmount").text().trim();
                var day = item.select("dealDay").text();
                var floor = item.select("floor").text();
                
                result += "• " + name + "(" + floor + "층): " + price + "만원 (" + day + "일)\n";
                count++;
            }
            if (count >= 10) break;
        }

        if (count == 0) return "🏠 " + regionName + " " + pyeong + "평형과 유사한 면적의 최근 거래 데이터가 없습니다.";
        
        return result.trim();

    } catch (e) {
        return "❌ 부동산 API 오류: " + e.message;
    }
}

exports.getRealEstatePrice = getRealEstatePrice;
