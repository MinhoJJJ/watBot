/**
 * 제미나이 AI - 금융(주식/코인) 분석 모듈
 */

function handleFinance(text, allModules) {
    var result = {
        isFinanceQuery: false,
        priceHeader: "",
        liveToolData: ""
    };

    var financeKeywords = ["주식", "비트코인", "이더리움", "삼성전자", "삼전", "하이닉스", "나스닥", "코스피", "전망", "예측", "분석", "BTC", "ETH"];
    var hasFinanceKW = false;
    for(var i=0; i<financeKeywords.length; i++) { 
        if(text.indexOf(financeKeywords[i]) !== -1) { hasFinanceKW = true; break; } 
    }

    if (hasFinanceKW) {
        result.isFinanceQuery = true;
        try { 
            var fRes = allModules.finance_data.analyzeMarket(text);
            if (fRes) {
                if (typeof fRes === "object" && fRes.currentPrice) {
                    result.priceHeader = "💰 [" + fRes.name + " 현재가]: " + fRes.currentPrice + "원 (" + fRes.lastDate + " 기준)\n\n";
                    result.liveToolData += fRes.fullText + "\n\n";
                } else if (typeof fRes === "string") {
                    result.liveToolData += fRes + "\n\n";
                }
            } else {
                result.liveToolData += "⚠️ 해당 종목의 실시간 데이터를 찾을 수 없습니다.\n\n";
            }
        } catch (e) {
            result.liveToolData += "⚠️ 금융 데이터 조회 중 오류 발생: " + e.message + "\n\n";
        }
    }

    return result;
}

module.exports = {
    handleFinance: handleFinance
};
