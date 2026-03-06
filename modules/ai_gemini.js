// 미니 NotebookLM (RAG + 공용 기억 저장소)
var CHAT_HISTORY_LIMIT = 5; 
var chatHistory = {}; 

var MODEL_NAME = "gemini-2.5-flash"; 
var API_URL = "https://generativelanguage.googleapis.com/v1/models/" + MODEL_NAME + ":generateContent?key=";

var KNOWLEDGE_PATH = "/sdcard/msgbot/Bots/watBot/knowledge/"; 

var KNOWLEDGE_INDEX = [
    { 
        keywords: ["비자", "일본", "입국", "체류", "배우자", "영주권", "결혼", "한국", "혼인", "신고", "구청", "대사관", "발급", "서류"], 
        fileName: "visa_info.txt" 
    }
];

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

function getAIResponse(sender, msg, apiKey, KV) {
    var text = msg.replace(/^\.챗\s*/, "").trim();
    if (!text) return "질문을 입력해주세요.";

    // 1. 공용 기억 저장 로직 (누구나 저장 가능)
    if (text.indexOf("기억해줘") !== -1) {
        var memo = text.replace("기억해줘", "").trim();
        var allMemos = KV.get("global_memos") || "";
        var updatedMemos = (allMemos ? allMemos + "\n" : "") + "• " + memo;
        KV.put("global_memos", updatedMemos);
        return "[공용 기억 완료] 📌 봇의 메모장에 기록되었습니다:\n\"" + memo + "\"";
    }

    // 2. 모든 유저의 공용 기억 불러오기
    var globalMemos = KV.get("global_memos") || "아직 기록된 공용 정보가 없습니다.";

    // 3. 지식 검색 (RAG)
    var retrievedKnowledge = "";
    var isKnowledgeFound = false;
    for (var i = 0; i < KNOWLEDGE_INDEX.length; i++) {
        var match = false;
        var keywords = KNOWLEDGE_INDEX[i].keywords;
        for (var j = 0; j < keywords.length; j++) {
            if (text.indexOf(keywords[j]) !== -1) {
                var fileContent = readKnowledgeFile(KNOWLEDGE_INDEX[i].fileName);
                if (fileContent) {
                    retrievedKnowledge += fileContent + "\n\n";
                    isKnowledgeFound = true;
                    break;
                }
            }
        }
    }

    // 4. 조건부 시스템 지침 (공용 기억 주입)
    var systemInstruction = "";
    if (isKnowledgeFound) {
        systemInstruction = "당신은 한일 비자 전문 행정사 제미나이입니다.\n" +
                           "[봇이 그동안 학습한 인물/정보 메모]\n" + globalMemos + "\n\n" +
                           "위 정보를 참고하여 대화에 활용하되, 비자 절차는 [참고 데이터]를 최우선으로 상세히 답변하세요.";
    } else {
        systemInstruction = "당신은 유능한 AI 비서 제미나이입니다.\n" +
                           "[봇이 그동안 학습한 인물/정보 메모]\n" + globalMemos + "\n\n" +
                           "위 메모 내용을 바탕으로 아는 척을 하며 사용자에게 친절하게 답변하세요.";
    }

    var finalPrompt = text;
    if (isKnowledgeFound) {
        finalPrompt = "[시스템 지침]\n" + systemInstruction + "\n\n[참고 데이터]\n" + retrievedKnowledge + "\n\n[사용자 질문]\n" + text;
    } else {
        finalPrompt = "[시스템 지침]\n" + systemInstruction + "\n\n[사용자 질문]\n" + text;
    }

    if (!chatHistory[sender]) chatHistory[sender] = [];
    chatHistory[sender].push({ role: "user", parts: [{ text: finalPrompt }] });

    var data = {
        contents: chatHistory[sender],
        generationConfig: { temperature: 0.2, maxOutputTokens: 1500 },
        safetySettings: [
            { "category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE" },
            { "category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE" },
            { "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE" },
            { "category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE" }
        ]
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
            return (isKnowledgeFound ? "[비자 봇]\n" : "[제미나이]\n") + aiMessage;
        }
        return "⚠️ 답변 생성 실패";
    } catch (e) { return "❌ 오류: " + e.message; }
}

exports.getAIResponse = getAIResponse;
