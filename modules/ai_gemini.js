// 미니 NotebookLM (자가 학습 + 부동산/도구 연동 버전)
var CHAT_HISTORY_LIMIT = 5; 
var chatHistory = {}; 

var MODEL_NAME = "gemini-2.5-flash"; 
var API_URL = "https://generativelanguage.googleapis.com/v1/models/" + MODEL_NAME + ":generateContent?key=";

var KNOWLEDGE_PATH = "/sdcard/msgbot/Bots/watBot/knowledge/"; 

function saveKnowledgeFile(fileName, content, isAppend) {
    try {
        var dir = new java.io.File(KNOWLEDGE_PATH);
        if (!dir.exists()) dir.mkdirs();
        var file = new java.io.File(KNOWLEDGE_PATH + fileName);
        var writer = new java.io.FileWriter(file, isAppend);
        writer.write(content);
        writer.close();
        return true;
    } catch (e) { return false; }
}

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

    // --- 1. 지식 자동 저장 기능 ---
    if (text.indexOf("지식에 저장해줘") !== -1 || text.indexOf("지식에 추가해줘") !== -1) {
        var isAppend = text.indexOf("추가해줘") !== -1;
        var cmd = isAppend ? "지식에 추가해줘" : "지식에 저장해줘";
        var parts = text.split(cmd);
        var rawContent = parts[0].trim();
        var contentParts = rawContent.split(" ");
        var fileName = contentParts.pop().trim();
        if (fileName.indexOf(".txt") === -1) fileName += ".txt";
        var finalContent = contentParts.join(" ").trim();
        if (saveKnowledgeFile(fileName, finalContent + "\n", isAppend)) {
            return "[지식 업데이트 완료] 📚\n파일명: " + fileName + "\n상태: " + (isAppend ? "내용 추가" : "새로 저장");
        } else { return "❌ 지식 저장 오류"; }
    }

    // --- 2. 실시간 외부 도구 연동 (부동산 추가) ---
    var liveToolData = "";
    if (allModules) {
        // 부동산 실거래가 연동
        if (text.indexOf("실거래가") !== -1 || text.indexOf("아파트") !== -1 || text.indexOf("부동산") !== -1) {
            try {
                var pyeongMatch = text.match(/(\d+)\s*평/);
                var pyeong = pyeongMatch ? parseInt(pyeongMatch[1]) : 24; // 기본 24평
                liveToolData += "【부동산 실거래가 정보】\n" + allModules.estate_data.getRealEstatePrice(text, pyeong) + "\n\n";
            } catch (e) { liveToolData += "【부동산】 데이터 조회 실패\n"; }
        }
        if (text.indexOf("환율") !== -1) {
            try { liveToolData += "【실시간 환율 정보】\n" + allModules.rate_data.getRate(allModules.api_key.getApiKey("rate")) + "\n\n"; } catch (e) {}
        }
        if (text.indexOf("날씨") !== -1) {
            try { liveToolData += "【실시간 날씨 정보】\n" + allModules.weather_data.getWeatherFromNaver(text) + "\n\n"; } catch (e) {}
        }
        if (text.indexOf("버스") !== -1) {
            try { liveToolData += "【실시간 버스 정보】\n" + allModules.bus_data.getBusInfo(text) + "\n\n"; } catch (e) {}
        }
        if (text.indexOf("역") !== -1 || text.indexOf("지하철") !== -1) {
            try { liveToolData += "【실시간 지하철 정보】\n" + allModules.subway_data.getKoreaSubwayInfo(text, allModules.api_key.getApiKey("subway")) + "\n\n"; } catch (e) {}
        }
    }

    // --- 3. 공용 메모 및 다중 지식 검색 ---
    var globalMemos = KV.get("global_memos") || "기록 없음";
    var retrievedKnowledge = "";
    var knowledgeTags = [];
    try {
        var folder = new java.io.File(KNOWLEDGE_PATH);
        var files = folder.listFiles();
        if (files != null) {
            for (var i = 0; i < files.length; i++) {
                var fname = files[i].getName();
                if (fname.indexOf(".txt") === -1) continue;
                var topic = fname.replace(".txt", "");
                if (text.indexOf(topic) !== -1) {
                    var fContent = readKnowledgeFile(fname);
                    if (fContent) {
                        retrievedKnowledge += "--- [" + topic + "] 지식 ---\n" + fContent + "\n";
                        knowledgeTags.push(topic);
                    }
                }
            }
        }
    } catch (e) {}

    // --- 4. 유연한 페르소나 및 호칭 지침 설정 ---
    var systemInstruction = "";
    if (retrievedKnowledge) {
        systemInstruction = "당신은 한일 비자 및 부동산 행정 전문 AI '제미나이'입니다. 사용자 '" + sender + "'님의 질문에 답변하세요.";
    } else {
        systemInstruction = "당신은 유능하고 친절한 AI 비서 '제미나이'입니다. 사용자 '" + sender + "'님의 질문에 답변하세요.";
    }

    systemInstruction += "\n\n[답변 원칙]\n" +
                         "1. 사용자를 부를 때는 반드시 '" + sender + "님'이라고만 부르세요.\n" +
                         "2. [실시간 연동 데이터]가 있다면 최신 정보를 바탕으로 결론부터 명확히 대답하세요.\n" +
                         "3. 부동산 정보의 경우, 실제 거래 가격과 날짜를 구체적으로 언급해 주세요.\n" +
                         "4. 가독성 있게 번호와 이모지를 사용하세요.\n\n" +
                         "[봇의 메모]\n" + globalMemos;

    var finalPrompt = "[시스템 지침]\n" + systemInstruction + "\n\n" +
                      (liveToolData ? "[실시간 연동 데이터]\n" + liveToolData + "\n" : "") +
                      (retrievedKnowledge ? "[참고 데이터]\n" + retrievedKnowledge + "\n\n" : "") +
                      "[사용자 질문]\n" + text;

    if (!chatHistory[sender]) chatHistory[sender] = [];
    chatHistory[sender].push({ role: "user", parts: [{ text: finalPrompt }] });

    var data = {
        contents: chatHistory[sender],
        generationConfig: { temperature: 0.3, maxOutputTokens: 2000 },
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
            var parts = json.candidates[0].content.parts;
            var aiMessage = "";
            for (var k = 0; k < parts.length; k++) { aiMessage += parts[k].text || ""; }
            aiMessage = aiMessage.trim();

            chatHistory[sender][chatHistory[sender].length - 1].parts[0].text = text;
            chatHistory[sender].push({ role: "model", parts: [{ text: aiMessage }] });

            if (chatHistory[sender].length > CHAT_HISTORY_LIMIT * 2) {
                chatHistory[sender] = chatHistory[sender].slice(chatHistory[sender].length - CHAT_HISTORY_LIMIT * 2);
            }
            var header = (liveToolData ? "[실시간 정보 봇]\n" : (knowledgeTags.length > 0 ? "[" + knowledgeTags.join("/") + " 전문 비서]\n" : "[제미나이 비서]\n"));
            return header + aiMessage;
        }
        return "⚠️ 답변 생성 실패";
    } catch (e) { return "❌ 오류: " + e.message; }
}

exports.getAIResponse = getAIResponse;
