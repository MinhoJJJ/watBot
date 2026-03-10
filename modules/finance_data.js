// 금융/주식/코인 데이터 및 뉴스 연동 모듈 (파이썬 백엔드 고도화 연동)

// ⚠️ 안드로이드 폰 환경에 맞게 PC 내부 IP 주소로 설정하세요.
var BACKEND_URL = "http://192.168.0.2:8989"; 

/**
 * 시장 분석 및 예측용 원천 데이터 가져오기 (문자열 반환 - 레거시/직접 출력용)
 * @param {string} query 사용자의 질문
 */
function getMarketPredictionData(query) {
    var data = analyzeMarket(query);
    if (!data) return "";
    if (typeof data === "string") return data; // 오류 메시지 등
    return data.fullText;
}

var LOG_FILE_PATH = "/sdcard/msgbot/Bots/watBot/log/log.txt";

/**
 * 로그 기록용 (java.io 사용)
 */
function appendLog(msg) {
    try {
        var file = new java.io.File(LOG_FILE_PATH);
        var fw = new java.io.FileWriter(file, true); // true for append
        var now = new java.util.Date();
        var timestamp = "[" + (now.getYear() + 1900) + "-" + (now.getMonth() + 1) + "-" + now.getDate() + " " + now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds() + "] ";
        fw.write(timestamp + msg + "\n");
        fw.close();
    } catch (e) {
        // 로그 기록 자체 실패는 무시
    }
}

/**
 * 네이버 검색/금융에서 직접 데이터 크롤링 (가장 안정적인 방식)
 * @param {string} assetName 자산 이름
 */
function crawlStockDirect(assetName) {
    var isCrypto = (assetName === "비트코인" || assetName === "이더리움");
    var date = new Date().toLocaleString();

    try {
        var url = "https://search.naver.com/search.naver?query=" + encodeURIComponent(assetName + " 주가");
        if (isCrypto) url = "https://search.naver.com/search.naver?query=" + encodeURIComponent(assetName + " 시세");

        var doc = org.jsoup.Jsoup.connect(url)
            .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36")
            .timeout(10000)
            .get();
        
        var price = "";
        var gap = "";

        if (isCrypto) {
            price = doc.select(".s_price strong").text() || doc.select(".price_info strong").text();
        } else {
            price = doc.select(".s_price strong").text() || doc.select(".price_info strong").text() || doc.select(".no_today .blind").text();
            gap = doc.select(".s_price .n_chg").text() || doc.select(".price_info .n_chg").text();
        }

        if (!price || price.length < 2) {
            var fullText = doc.text();
            var match = fullText.match(/현재가\s*([\d,]+)/) || fullText.match(/([\d,]+)원/);
            if (match) price = match[1];
        }

        if (price && price.length > 1) {
            appendLog("✅ [성공] " + assetName + " 크롤링 성공 (현재가: " + price + ")");
            var resText = "【" + assetName + " 실시간 시장 데이터】\n";
            resText += " - 현재가: " + price + "원" + (gap ? " (변동: " + gap + ")" : "") + "\n";
            resText += " - 기준일시: " + date + "\n";
            resText += " - 데이터 출처: 네이버 검색 (실시간 크롤링)\n";

            return {
                name: assetName,
                currentPrice: price,
                lastDate: date,
                fullText: resText
            };
        } else {
            appendLog("❌ [실패] " + assetName + " 주가 파싱 실패 (HTML 구조 변경 의심)");
            return {
                name: assetName,
                currentPrice: null,
                lastDate: date,
                fullText: "⚠️ " + assetName + " 주가 정보를 페이지에서 찾을 수 없습니다."
            };
        }
    } catch (e) {
        appendLog("🔥 [오류] " + assetName + " 크롤링 중 네트워크 에러: " + e.message);
        return {
            name: assetName,
            currentPrice: null,
            lastDate: date,
            fullText: "❌ " + assetName + " 크롤링 중 네트워크 오류 발생"
        };
    }
}

/**
 * AI 분석용 구조화된 데이터 가져오기
 * @param {string} query 사용자의 질문
 */
function analyzeMarket(query) {
    var endpoint = "";
    var assetName = "";

    if (query.indexOf("비트코인") !== -1 || query.toLowerCase().indexOf("btc") !== -1) { endpoint = "/api/market/bitcoin"; assetName = "비트코인"; }
    else if (query.indexOf("이더리움") !== -1 || query.toLowerCase().indexOf("eth") !== -1) { endpoint = "/api/market/ethereum"; assetName = "이더리움"; }
    else if (query.indexOf("삼성전자") !== -1 || query.indexOf("삼전") !== -1) { endpoint = "/api/market/samsung"; assetName = "삼성전자"; }
    else if (query.indexOf("하이닉스") !== -1) { endpoint = "/api/market/hynix"; assetName = "SK하이닉스"; }
    else if (query.indexOf("나스닥") !== -1) { endpoint = "/api/market/nasdaq"; assetName = "나스닥"; }
    else if (query.indexOf("코스피") !== -1) { endpoint = "/api/market/kospi"; assetName = "코스피"; }

    if (!endpoint) return null; 

    try {
        var url = BACKEND_URL + endpoint;
        var response = org.jsoup.Jsoup.connect(url)
            .ignoreContentType(true)
            .ignoreHttpErrors(true)
            .timeout(5000)
            .get();

        var json = JSON.parse(response.text());

        if (json.data && json.data.length > 0) {
            appendLog("✅ [백엔드] " + assetName + " 데이터 수신 성공");
            // ... (생략된 기존 성공 로직)
            var lastEntry = json.data[json.data.length - 1];
            var recentPrice = lastEntry.close;
            var lastDate = lastEntry.date || new Date().toISOString().split('T')[0];
            
            var result = "【" + json.name + " 투자 분석 원천 데이터】\n";
            result += " - 현재가: " + recentPrice + "\n";
            result += " - 기준일자: " + lastDate + "\n";
            
            var extraInfo = "";
            if (json.extra_info) {
                var extra = json.extra_info;
                extraInfo += " - 시장 심리: " + (extra.reason || "데이터 없음") + "\n";
                extraInfo += " - 긍정 뉴스 비율: " + (extra.sentiment_ratio ? extra.sentiment_ratio.toFixed(1) : 0) + "%\n\n";
                
                if (extra.news && extra.news.length > 0) {
                    extraInfo += "[최신 뉴스 헤드라인]\n";
                    var maxNews = Math.min(extra.news.length, 5);
                    for (var i = 0; i < maxNews; i++) {
                        var n = extra.news[i];
                        var sentimentEmoji = n.sentiment === "positive" ? "▲" : (n.sentiment === "negative" ? "▼" : "•");
                        extraInfo += sentimentEmoji + " " + n.title + "\n";
                    }
                }
            }
            
            return {
                name: json.name,
                currentPrice: recentPrice,
                lastDate: lastDate,
                fullText: result + extraInfo,
                rawJson: json
            };
        }
    } catch (e) {
        appendLog("⚠️ [백엔드 오프라인] " + assetName + " 직접 크롤링으로 전환 (사유: " + e.message + ")");
    }

    var crawlRes = crawlStockDirect(assetName);
    if (crawlRes) return crawlRes;

    appendLog("💣 [최종 실패] " + assetName + " 모든 수단 실패");
    return "⚠️ " + assetName + " 데이터를 불러오지 못했습니다. (백엔드 및 크롤링 모두 실패)";
}

exports.getMarketPredictionData = getMarketPredictionData;
exports.analyzeMarket = analyzeMarket;
