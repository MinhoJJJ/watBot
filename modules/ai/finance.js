/**
 * Gemini AI - Finance Module
 */
function handleFinance(text, allModules) {
    var result = { isFinanceQuery: false, priceHeader: "", liveToolData: "" };
    var kw = ["주식", "비트코인", "이더리움", "삼성전자", "삼전", "하이닉스", "나스닥", "코스피", "전망", "예측", "분석", "BTC", "ETH"];
    var hasKW = false;
    for (var i = 0; i < kw.length; i++) {
        if (text.indexOf(kw[i]) !== -1) {
            hasKW = true;
            break;
        }
    }

    if (hasKW) {
        result.isFinanceQuery = true;
        try {
            var fRes = allModules.finance.analyzeMarket(text);
            if (fRes) {
                if (typeof fRes === "object" && fRes.currentPrice) {
                    result.priceHeader = "💰 [" + fRes.name + " 현재가]: " + fRes.currentPrice + "원 (" + fRes.lastDate + " 기준)\n\n";
                    result.liveToolData += "【최근 시세】\n" + fRes.history + "\n";
                    result.liveToolData += "【관련 뉴스】\n" + fRes.news + "\n";
                } else {
                    result.liveToolData += fRes + "\n\n";
                }
            } else {
                result.liveToolData += "⚠️ 해당 종목의 실시간 데이터를 찾을 수 없습니다.\n\n";
            }
        } catch (e) {
            result.liveToolData += "⚠️ 금융 데이터 조회 중 오류: " + e.message + "\n\n";
        }
    }
    return result;
}

exports.handleFinance = handleFinance;
