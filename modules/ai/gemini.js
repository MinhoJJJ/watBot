/**
 * 제미나이 AI 메인 컨트롤러
 */

var CHAT_HISTORY_LIMIT = 5; 
var chatHistory = {}; 
var MODEL_NAME = "gemini-2.5-flash"; 
var API_URL = "https://generativelanguage.googleapis.com/v1/models/" + MODEL_NAME + ":generateContent?key=";
var KNOWLEDGE_PATH = "/sdcard/msgbot/Bots/watBot/knowledge/"; 

function readKnowledgeFile(fileName) {
    try {
        var file = new java.io.File(KNOWLEDGE_PATH + fileName);
        if (!file.exists()) return "";
        var reader = new java.io.BufferedReader(new java.io.InputStreamReader(new java.io.FileInputStream(file), "UTF-8"));
        var content = "";
        var line;
        while ((line = reader.readLine()) != null) { content += line + "\n"; }
        reader.close();
        return content;
    } catch (e) { return ""; }
}

function getAIResponse(sender, msg, apiKey, KV, allModules) {
    var text = msg.replace(/^\.챗\s*/, "").trim();
    if (!text) return "질문을 입력해주세요.";

    var now = new Date();
    var dateContext = "현재 일시: " + now.getFullYear() + "년 " + (now.getMonth() + 1) + "월 " + now.getDate() + "일";

    // 1. 하위 모듈을 통한 데이터 수집
    var liveToolData = "";
    var priceHeader = "";
    
    // 금융 데이터 처리
    var financeRes = allModules.ai.finance.handleFinance(text, allModules);
    if (financeRes.isFinanceQuery) {
        priceHeader = financeRes.priceHeader;
        liveToolData += financeRes.liveToolData;
    }

    // 부동산 데이터 처리
    var estateRes = allModules.ai.estate.handleEstate(text, allModules);
    if (estateRes.isEstateQuery) {
        liveToolData += estateRes.liveToolData;
    }

    // 법률/행정 데이터 처리
    var legalRes = allModules.ai.legal.handleLegal(text, allModules);
    if (legalRes.isLegalQuery) {
        liveToolData += legalRes.liveToolData;
    }

    // 환율/날씨 (기본 처리)
    if (text.indexOf("환율") !== -1) { try { liveToolData += "【환율】\n" + allModules.rate_data.getRate(allModules.api_key.getApiKey("rate")) + "\n\n"; } catch (e) {} }
    if (text.indexOf("날씨") !== -1) { try { liveToolData += "【날씨】\n" + allModules.weather_data.getWeatherFromNaver(text) + "\n\n"; } catch (e) {} }

    // 2. 지식 검색 (RAG)
    var globalMemos = KV.get("global_memos") || "기록 없음";
    var retrievedKnowledge = "";
    try {
        var folder = new java.io.File(KNOWLEDGE_PATH);
        var files = folder.listFiles();
        if (files != null) {
            for (var i = 0; i < files.length; i++) {
                var fname = files[i].getName();
                if (fname.indexOf(".txt") === -1) continue;
                if (text.indexOf(fname.replace(".txt", "")) !== -1) {
                    retrievedKnowledge += "--- [" + fname + "] ---\n" + readKnowledgeFile(fname) + "\n";
                }
            }
        }
    } catch (e) {}

    // 3. 시스템 지침 및 페르소나 설정
    var pInfo = allModules.ai.persona.getPersonaInfo(text, financeRes.isFinanceQuery, estateRes.isEstateQuery, legalRes.isLegalQuery);

    var systemInstruction = pInfo.persona + "\n" +
                           "[현재 시점]: " + dateContext + "\n\n" +
                           "【필수 지침】\n" +
                           "1. 아래 [실시간 연동 데이터] 섹션에 데이터가 있다면, 반드시 그 수치를 바탕으로 분석하세요.\n" +
                           "2. 데이터가 '조회 실패'이거나 없는 경우에만 데이터 부재에 대해 언급하세요. 데이터가 있는데도 없다고 말하는 것은 치명적인 오류입니다.\n" +
                           (pInfo.specificInstruction || "3. 질문에 대해 논리적이고 친절하게 답변하세요.\n") +
                           "5. 사용자를 부를 때는 반드시 '" + sender + "님'이라고 부르세요.\n" +
                           "6. 답변 끝에는 반드시 해당 정보에 대한 '면책 조항'을 포함하세요.\n\n" +
                           "[봇의 메모]\n" + globalMemos;

    var finalPrompt = "[시스템 지침]\n" + systemInstruction + "\n\n" +
                      "[실시간 연동 데이터]\n" + (liveToolData || "데이터 없음 (현재 분석 가능한 실시간 수치가 제공되지 않았습니다.)") + "\n\n" +
                      (retrievedKnowledge ? "[참고 데이터]\n" + retrievedKnowledge + "\n\n" : "") +
                      "[사용자 질문]\n" + text;

    if (!chatHistory[sender]) chatHistory[sender] = [];
    chatHistory[sender].push({ role: "user", parts: [{ text: finalPrompt }] });

    var data = {
        contents: chatHistory[sender],
        generationConfig: { temperature: 0.2, maxOutputTokens: 2000 },
        safetySettings: [{ "category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE" }, { "category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE" }, { "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE" }, { "category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE" }]
    };

    try {
        var response = org.jsoup.Jsoup.connect(API_URL + apiKey)
            .header("Content-Type", "application/json")
            .requestBody(JSON.stringify(data))
            .ignoreContentType(true)
            .ignoreHttpErrors(true)
            .maxBodySize(10 * 1024 * 1024) 
            .timeout(60000)
            .method(org.jsoup.Connection.Method.POST)
            .execute();

        var json = JSON.parse(response.body());
        if (json.candidates && json.candidates[0]) {
            var aiMessage = json.candidates[0].content.parts[0].text.trim();
            chatHistory[sender][chatHistory[sender].length - 1].parts[0].text = text;
            chatHistory[sender].push({ role: "model", parts: [{ text: aiMessage }] });

            if (chatHistory[sender].length > CHAT_HISTORY_LIMIT * 2) {
                chatHistory[sender] = chatHistory[sender].slice(chatHistory[sender].length - CHAT_HISTORY_LIMIT * 2);
            }
            
            return pInfo.headerPrefix + priceHeader + aiMessage;
        }
        return "⚠️ 답변 생성 실패";
    } catch (e) { return "❌ 오류: " + e.message; }
}

module.exports = {
    getAIResponse: getAIResponse
};
