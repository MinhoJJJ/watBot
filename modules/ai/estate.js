/**
 * 제미나이 AI - 부동산 분석 모듈
 */

function handleEstate(text, allModules) {
    var result = {
        isEstateQuery: false,
        liveToolData: ""
    };

    if (text.indexOf("실거래가") !== -1 || text.indexOf("부동산") !== -1) {
        result.isEstateQuery = true;
        try {
            var pMatch = text.match(/(\d+)\s*평/);
            var priceInfo = allModules.estate_data.getRealEstatePrice(text, pMatch ? parseInt(pMatch[1]) : 24);
            result.liveToolData += "【부동산 실거래가】\n" + priceInfo + "\n\n";
        } catch (e) {
            result.liveToolData += "⚠️ 부동산 데이터 조회 중 오류 발생: " + e.message + "\n\n";
        }
    }

    return result;
}

module.exports = {
    handleEstate: handleEstate
};
