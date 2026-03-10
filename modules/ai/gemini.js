/**
 * Gemini AI 메인 컨트롤러 모듈
 * 
 * 이 모듈은 사용자의 입력을 분석하고, 필요한 외부 데이터(금융, 부동산, 법률 등)를 수집하여
 * 구글 제미나이(Gemini) API에 전달하고 답변을 받아오는 핵심 엔진 역할을 합니다.
 */

// --- 설정 및 전역 변수 ---
var CHAT_HISTORY_LIMIT = 5; // 이전 대화를 기억할 개수 (사용자+모델 한 쌍 기준)
var chatHistory = {};       // 사용자별 대화 기록 저장소 (메모리 상에 유지)
var MODEL_NAME = "gemini-2.5-flash"; // 사용할 제미나이 모델명
var API_URL = "https://generativelanguage.googleapis.com/v1/models/" + MODEL_NAME + ":generateContent?key=";
var KNOWLEDGE_PATH = "/sdcard/msgbot/Bots/watBot/knowledge/"; // 로컬 지식 베이스 파일 경로

/**
 * 로컬 지식 파일(.txt)을 읽어오는 함수
 * @param {string} fileName 파일 이름
 * @returns {string} 파일 내용
 */
function readKnowledgeFile(fileName) {
    try {
        var file = new java.io.File(KNOWLEDGE_PATH + fileName);
        if (!file.exists()) return "";
        // UTF-8 인코딩으로 파일 읽기
        var reader = new java.io.BufferedReader(new java.io.InputStreamReader(new java.io.FileInputStream(file), "UTF-8"));
        var content = ""; var line;
        while ((line = reader.readLine()) != null) { content += line + "\n"; }
        reader.close();
        return content;
    } catch (e) { return ""; }
}

/**
 * 메인 답변 생성 함수
 * @param {string} sender 발신자 이름
 * @param {string} msg 메시지 전체 내용
 * @param {string} apiKey Gemini API 키
 * @param {object} KV RhinoKV 데이터베이스 객체
 * @param {object} allModules 통합 관리되는 모든 모듈 객체
 */
function getAIResponse(sender, msg, apiKey, KV, allModules) {
    // 1. 입력 데이터 전처리: ".챗 " 접두어 제거 및 공백 정리
    var text = msg.replace(/^\.챗\s*/, "").trim();
    if (!text) return "질문을 입력해주세요.";

    // 2. 현재 날짜 정보 생성 (AI에게 시간적 배경 제공)
    var now = new Date();
    var dateContext = "현재 일시: " + now.getFullYear() + "년 " + (now.getMonth() + 1) + "월 " + now.getDate() + "일";

    // 3. 실시간 도구(Tool) 데이터 수집 섹션
    var liveToolData = "";   // AI에게 전달할 실시간 정보 문자열
    var priceHeader = "";    // 답변 상단에 노출할 현재가 요약

    // [금융 분석] 주식/코인 관련 질문인지 확인하고 데이터 수집
    var financeRes = allModules.ai.finance.handleFinance(text, allModules);
    if (financeRes.isFinanceQuery) { 
        priceHeader = financeRes.priceHeader; 
        liveToolData += financeRes.liveToolData; 
    }

    // [부동산 분석] 부동산 실거래가 관련 데이터 수집
    var estateRes = allModules.ai.estate.handleEstate(text, allModules);
    if (estateRes.isEstateQuery) { 
        liveToolData += estateRes.liveToolData; 
    }

    // [행정/법률] 법률 관련 키워드가 있는지 확인하고 가이드 준비
    var legalRes = allModules.ai.legal.handleLegal(text, allModules);
    if (legalRes.isLegalQuery) { 
        liveToolData += legalRes.liveToolData; 
    }

    // 특정 키워드 포함 시 추가 실시간 정보 호출 (환율, 날씨 등)
    if (text.indexOf("환율") !== -1) { 
        try { liveToolData += "【환율】\n" + allModules.rate.getRate(allModules.apiKey.getApiKey("rate")) + "\n\n"; } catch (e) {} 
    }
    if (text.indexOf("날씨") !== -1) { 
        try { liveToolData += "【날씨】\n" + allModules.weather.getWeatherFromNaver(text) + "\n\n"; } catch (e) {} 
    }

    // 4. 지식 베이스(RAG) 및 메모리 조회
    var globalMemos = KV.get("global_memos") || "기록 없음"; // DB에서 관리자 메모 읽기
    var retrievedKnowledge = "";
    try {
        // knowledge 폴더 내의 텍스트 파일 중 질문 키워드와 일치하는 내용 찾기
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

    // 5. 페르소나(전문성) 및 시스템 지침 설정
    var pInfo = allModules.ai.persona.getPersonaInfo(text, financeRes.isFinanceQuery, estateRes.isEstateQuery, legalRes.isLegalQuery);
    
    // AI에게 부여할 성격과 필수 규칙 정의
    var systemInstruction = pInfo.persona + "\n" +
                           "[현재 시점]: " + dateContext + "\n\n" +
                           "【필수 지침】\n" +
                           "1. 아래 [실시간 연동 데이터] 섹션에 데이터가 있다면, 반드시 해당 수치를 바탕으로 분석하세요.\n" +
                           "2. 데이터가 '조회 실패'이거나 없는 경우에만 데이터 부재에 대해 언급하세요.\n" +
                           (pInfo.specificInstruction || "3. 질문에 대해 논리적이고 친절하게 답변하세요.\n") +
                           "5. 사용자를 부를 때는 반드시 '" + sender + "님'이라고 부르세요.\n" +
                           "6. 답변 하단에는 반드시 해당 정보에 대해 '면책 조항'을 포함하세요.\n\n" +
                           "[봇의 메모]\n" + globalMemos;

    // 6. 최종 프롬프트 구성
    var finalPrompt = "[시스템 지침]\n" + systemInstruction + "\n\n" +
                      "[실시간 연동 데이터]\n" + (liveToolData || "데이터 없음") + "\n\n" +
                      (retrievedKnowledge ? "[세고 데이터]\n" + retrievedKnowledge + "\n\n" : "") +
                      "[사용자 질문]\n" + text;

    // 7. 대화 기록 관리 (멀티턴 대화 유지)
    if (!chatHistory[sender]) chatHistory[sender] = [];
    // 새로운 사용자 질문 추가 (프롬프트 전체 포함)
    chatHistory[sender].push({ role: "user", parts: [{ text: finalPrompt }] });

    // 8. Gemini API 호출 데이터 준비
    var data = { 
        contents: chatHistory[sender], 
        generationConfig: { 
            temperature: 0.2, // 창의성 낮춤 (정확도 우선)
            maxOutputTokens: 2000 
        } 
    };

    try {
        // 9. HTTP POST 요청 실행 (Jsoup 사용)
        var response = org.jsoup.Jsoup.connect(API_URL + apiKey)
            .header("Content-Type", "application/json")
            .requestBody(JSON.stringify(data))
            .ignoreContentType(true)
            .ignoreHttpErrors(true)
            .timeout(60000)
            .method(org.jsoup.Connection.Method.POST)
            .execute();

        // 10. 응답 분석 및 대화 기록 업데이트
        var json = JSON.parse(response.body());
        if (json.candidates && json.candidates[0]) {
            var aiMessage = json.candidates[0].content.parts[0].text.trim();
            
            // 프롬프트가 너무 길어 기록을 망치지 않게 원본 질문으로 교체 저장
            chatHistory[sender][chatHistory[sender].length - 1].parts[0].text = text;
            // AI의 답변을 기록에 추가
            chatHistory[sender].push({ role: "model", parts: [{ text: aiMessage }] });
            
            // 기록 개수 제한 (성능 및 토큰 관리)
            if (chatHistory[sender].length > CHAT_HISTORY_LIMIT * 2) {
                chatHistory[sender] = chatHistory[sender].slice(chatHistory[sender].length - CHAT_HISTORY_LIMIT * 2);
            }
            
            // 최종 답변 반환 (헤더 + 가격요약 + AI 답변)
            return pInfo.headerPrefix + priceHeader + aiMessage;
        }
        return "⚠️ 답변 생성 실패";
    } catch (e) { 
        return "❌ 오류: " + e.message; 
    }
}

// 외부에서 사용 가능하도록 익스포트
module.exports = { getAIResponse: getAIResponse };
