// 미니 NotebookLM (RAG 기반 지식 챗봇) - 끊김 방지 최종본
var CHAT_HISTORY_LIMIT = 5;
var chatHistory = {};

var MODEL_NAME = "gemini-2.5-flash";
var API_URL = "https://generativelanguage.googleapis.com/v1/models/" + MODEL_NAME + ":generateContent?key=";

// 안드로이드 봇 경로 고정
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
        if (!file.exists()) return "[에러: " + fileName + " 파일이 경로에 없습니다]";

        var reader = new java.io.BufferedReader(new java.io.InputStreamReader(new java.io.FileInputStream(file), "UTF-8"));
        var content = "";
        var line;
        while ((line = reader.readLine()) != null) { content += line + "\n"; }
        reader.close();
        return content;
    } catch (e) { return "[파일 읽기 에러: " + e.message + "]"; }
}

function getAIResponse(sender, msg, apiKey) {
    var text = msg.replace(/^\.챗\s*/, "").trim();
    if (!text) return "질문을 입력해주세요.";

    var retrievedKnowledge = "";
    var isKnowledgeFound = false;

    // 키워드 매칭
    for (var i = 0; i < KNOWLEDGE_INDEX.length; i++) {
        var keywords = KNOWLEDGE_INDEX[i].keywords;
        for (var j = 0; j < keywords.length; j++) {
            if (text.indexOf(keywords[j]) !== -1) {
                var fileContent = readKnowledgeFile(KNOWLEDGE_INDEX[i].fileName);
                if (fileContent && fileContent.indexOf("[에러") === -1) {
                    retrievedKnowledge += fileContent + "\n\n";
                    isKnowledgeFound = true;
                    break;
                }
            }
        }
    }

    var systemInstruction = "당신은 한일 커플 비자 전문 AI '제미나이'입니다.\n" +
        "• [참고 데이터]를 바탕으로 상세히 답변하세요.\n" +
        "• 답변이 절대 끊기지 않도록 문장을 완성하세요.\n" +
        "• 메신저 제한을 고려해 리스트(①, ②) 위주로 정리하세요.";

    var finalPrompt = text;
    if (isKnowledgeFound) {
        finalPrompt = "[시스템 지침]\n" + systemInstruction + "\n\n[참고 데이터]\n" + retrievedKnowledge + "\n\n[사용자 질문]\n" + text;
    } else {
        finalPrompt = "[시스템 지침] 친절한 AI 비서 '제미나이'입니다. 상세히 답변하세요.\n\n[사용자 질문]\n" + text;
    }

    if (!chatHistory[sender]) chatHistory[sender] = [];
    chatHistory[sender].push({ role: "user", parts: [{ text: finalPrompt }] });

    var data = {
        contents: chatHistory[sender],
        generationConfig: { temperature: 0.2, maxOutputTokens: 2048 },
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
            var candidate = json.candidates[0];
            var aiMessage = "";

            if (candidate.content && candidate.content.parts) {
                for (var k = 0; k < candidate.content.parts.length; k++) {
                    aiMessage += candidate.content.parts[k].text || "";
                }
            }
            aiMessage = aiMessage.trim();

            if (candidate.finishReason === "SAFETY") {
                aiMessage += "\n\n(⚠️ 안전 필터로 인해 답변이 일부 제한되었습니다.)";
            } else if (candidate.finishReason === "MAX_TOKENS") {
                // 토큰이 부족해서 끊긴 경우 (이 경우 답변 끝에 말줄임표나 안내 추가 가능)
                aiMessage += "\n\n(⚠️ 답변이 너무 길어 중간에 잘렸습니다.)";
            } else if (!aiMessage) {
                chatHistory[sender].pop();
                return "[비자 봇] ⚠️ 응답을 생성하지 못했습니다.";
            }

            if (!aiMessage) return "⚠️ 답변이 비어 있습니다. (사유: " + candidate.finishReason + ")";

            chatHistory[sender][chatHistory[sender].length - 1].parts[0].text = text;
            chatHistory[sender].push({ role: "model", parts: [{ text: aiMessage }] });

            if (chatHistory[sender].length > CHAT_HISTORY_LIMIT * 2) {
                chatHistory[sender] = chatHistory[sender].slice(chatHistory[sender].length - CHAT_HISTORY_LIMIT * 2);
            }
            return (isKnowledgeFound ? "[비자 봇]\n" : "[제미나이]\n") + aiMessage;
        }
        return "⚠️ 서버 응답 오류:\n" + response.body().substring(0, 100);
    } catch (e) { return "❌ 시스템 오류: " + e.message; }
}

exports.getAIResponse = getAIResponse;
