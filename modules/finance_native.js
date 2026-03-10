// 순수 자바스크립트 금융 분석 모듈 ( finance_native.js ) - 가격 노출 강화 버전

var USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

function getCryptoData(market) {
    try {
        var url = "https://api.upbit.com/v1/candles/days?market=" + market + "&count=10";
        var response = org.jsoup.Jsoup.connect(url).userAgent(USER_AGENT).ignoreContentType(true).get().text();
        var data = JSON.parse(response);
        var lastItem = data[0];
        var result = "【" + market + " 최근 10일 시세】\n";
        for (var i = 0; i < data.length; i++) {
            result += "• " + data[i].candle_date_time_kst.substring(0, 10) + ": " + data[i].trade_price.toLocaleString() + "원\n";
        }
        return { 
            name: market, 
            currentPrice: lastItem.trade_price, 
            lastDate: lastItem.candle_date_time_kst.substring(0, 10),
            history: result 
        };
    } catch (e) { return null; }
}

function getStockData(symbol, name) {
    try {
        var url = "https://fchart.naver.com/sise.nhn?symbol=" + symbol + "&timeframe=day&count=15&requestType=0";
        var response = org.jsoup.Jsoup.connect(url).userAgent(USER_AGENT).get().text();
        var lines = response.split("\n");
        var lastPrice = 0;
        var lastDate = "";
        var history = "【" + name + " 최근 10일 시세 현황】\n";
        var validCount = 0;
        
        for (var i = lines.length - 1; i >= 0; i--) {
            if (!lines[i] || lines[i].indexOf("|") === -1) continue;
            var cols = lines[i].split("|");
            var date = cols[0].replace(/"/g, "").trim();
            var formattedDate = date.substring(0,4) + "-" + date.substring(4,6) + "-" + date.substring(6,8);
            var close = parseInt(cols[4]);
            
            if (validCount === 0) {
                lastPrice = close;
                lastDate = formattedDate;
            }
            history += "• " + formattedDate + ": " + close.toLocaleString() + "원\n";
            validCount++;
            if (validCount >= 10) break;
        }
        return { name: name, currentPrice: lastPrice, lastDate: lastDate, history: history };
    } catch (e) { return null; }
}

function getNewsSentiment(query) {
    try {
        var url = "https://news.google.com/rss/search?q=" + encodeURIComponent(query) + "&hl=ko&gl=KR&ceid=KR:ko";
        var doc = org.jsoup.Jsoup.connect(url).userAgent(USER_AGENT).get();
        var items = doc.select("item");
        var newsText = "[관련 뉴스]\n";
        var score = 0;
        var count = Math.min(items.size(), 10);
        for (var i = 0; i < count; i++) {
            var title = items.get(i).select("title").text();
            newsText += "• " + title + "\n";
            if (title.match(/상승|급등|호재|돌파|매수/)) score++;
            if (title.match(/하락|급락|악재|우려|매도/)) score--;
        }
        return { news: newsText, score: score };
    } catch (e) { return { news: "", score: 0 }; }
}

function analyzeMarket(query) {
    var asset = null;
    var searchTag = "";
    if (query.indexOf("비트코인") !== -1 || query.indexOf("BTC") !== -1) { asset = getCryptoData("KRW-BTC"); searchTag = "비트코인"; }
    else if (query.indexOf("이더리움") !== -1 || query.indexOf("ETH") !== -1) { asset = getCryptoData("KRW-ETH"); searchTag = "이더리움"; }
    else if (query.indexOf("삼성전자") !== -1 || query.indexOf("삼전") !== -1) { asset = getStockData("005930", "삼성전자"); searchTag = "삼성전자"; }
    else if (query.indexOf("하이닉스") !== -1) { asset = getStockData("000660", "SK하이닉스"); searchTag = "SK하이닉스"; }
    else if (query.indexOf("나스닥") !== -1) { asset = getStockData("IXIC", "나스닥"); searchTag = "나스닥"; }
    else if (query.indexOf("코스피") !== -1) { asset = getStockData("KOSPI", "코스피"); searchTag = "코스피"; }

    if (!asset) return null;

    var newsData = getNewsSentiment(searchTag);
    
    // AI가 답변 상단에 배치하기 쉽도록 데이터 구조화
    return {
        name: asset.name,
        currentPrice: asset.currentPrice.toLocaleString(),
        lastDate: asset.lastDate,
        history: asset.history,
        news: newsData.news,
        score: newsData.score
    };
}

exports.analyzeMarket = analyzeMarket;
