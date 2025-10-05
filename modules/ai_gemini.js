// Gemini 챗봇
function getAIResponse(sender, msg, apiKey) {

    let text = msg.substr(3); // ".챗 " 명령어 이후 텍스트
    let result;
    let aiMessage = ""; // ✅ 스코프 밖에 선언해서 어디서든 접근 가능

const MODEL_NAME = "gemini-2.5-flash-latest";
const API_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=" + apiKey;

    const data = {
        contents: [
            {
                parts: [{ text: text }]
            }
        ]
    };

    try {
        // ✅ Jsoup으로 간단히 요청
        const response = org.jsoup.Jsoup.connect(API_URL)
            .header("Content-Type", "application/json")
            .requestBody(JSON.stringify(data))
            .ignoreContentType(true)
            .ignoreHttpErrors(true)
            .timeout(60000)
            .method(org.jsoup.Connection.Method.POST)
            .execute();

        const statusCode = response.statusCode();
        const responseText = response.body();

        // 🔹 상태코드별 에러 처리
        if (statusCode === 400) {
            return "⚠️ 요청 형식이 올바르지 않습니다.";
        } else if (statusCode === 401) {
            return "🔑 API 키가 잘못되었거나 만료되었습니다.";
        } else if (statusCode === 429) {
            return "🚫 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.";
        } else if (statusCode >= 500) {
            return "⚙️ Gemini 서버 오류입니다. 잠시 후 다시 시도해주세요.";
        }

        const json = JSON.parse(responseText);

        // ✅ 안전하게 단계별로 접근
        if (json.candidates && json.candidates.length > 0) {
            const candidate = json.candidates[0];
            if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
                let parts = candidate.content.parts;
                let texts = [];
                for (let i = 0; i < parts.length; i++) {
                    if (parts[i].text) texts.push(parts[i].text);
                }
                aiMessage = texts.join("\n");
            } else if (candidate.outputText) {
                aiMessage = candidate.outputText;
            } else if (candidate.message) {
                aiMessage = candidate.message;
            }
        }

        if (!aiMessage || aiMessage.trim() === "") {
            // JSON을 로그로 찍어보고 싶을 때 (테스트용)
            return "응답 구조 확인 필요:\n" + responseText;
        }

        result = "[제미나이]\n" + aiMessage;

    } catch (e) {
        result = "오류가 발생했습니다: " + e.message;
    }

    return result;
}

exports.getAIResponse = getAIResponse;
