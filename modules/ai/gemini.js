/**
 * Gemini AI Main Controller
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
        var content = ""; var line;
        while ((line = reader.readLine()) != null) { content += line + "\n"; }
        reader.close();
        return content;
    } catch (e) { return ""; }
}

function getAIResponse(sender, msg, apiKey, KV, allModules) {
    var text = msg.replace(/^\.\ucd23\s*/, "").trim();
    if (!text) return "\uc9c8\ubb38\uc744 \uc785\ub825\ud574\uc8fc\uc138\uc694.";

    var now = new Date();
    var dateContext = "\ud604\uc7ac \uc77c\uc2dc: " + now.getFullYear() + "\ub144 " + (now.getMonth() + 1) + "\uc6d4 " + now.getDate() + "\uc77c";

    var liveToolData = ""; var priceHeader = "";
    var financeRes = allModules.ai.finance.handleFinance(text, allModules);
    if (financeRes.isFinanceQuery) { priceHeader = financeRes.priceHeader; liveToolData += financeRes.liveToolData; }
    var estateRes = allModules.ai.estate.handleEstate(text, allModules);
    if (estateRes.isEstateQuery) { liveToolData += estateRes.liveToolData; }
    var legalRes = allModules.ai.legal.handleLegal(text, allModules);
    if (legalRes.isLegalQuery) { liveToolData += legalRes.liveToolData; }

    if (text.indexOf("\ud658\uc728") !== -1) { try { liveToolData += "\u3010\ud658\uc728\u3011\n" + allModules.rate.getRate(allModules.apiKey.getApiKey("rate")) + "\n\n"; } catch (e) {} }
    if (text.indexOf("\ub0a0\uc528") !== -1) { try { liveToolData += "\u3010\ub0a0\uc528\u3011\n" + allModules.weather.getWeatherFromNaver(text) + "\n\n"; } catch (e) {} }

    var globalMemos = KV.get("global_memos") || "\uae30\ub85d \uc5c6\uc74c";
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

    var pInfo = allModules.ai.persona.getPersonaInfo(text, financeRes.isFinanceQuery, estateRes.isEstateQuery, legalRes.isLegalQuery);
    var systemInstruction = pInfo.persona + "\n" +
                           "[\ud604\uc7ac \uc2dc\uc12c]: " + dateContext + "\n\n" +
                           "\u3010\ud544\uc218 \uc9c0\ucc68\u3011\n" +
                           "1. \uc544\ub798 [\uc2e4\uc2dc\uac04 \uc5f0\ub3d9 \ub370\uc774\ud130] \uc1bc\uc158\uc5d0 \ub370\uc774\ud130\uac00 \uc788\ub2e4\uba74, \ubc18\ub4dc\uc2dc \uacbd \uc218\uce58\ub97c \ubc14\ud0d5\uc73c\ub85c \ubd84\uc11d\ud558\uc138\uc694.\n" +
                           "2. \ub370\uc774\ud130\uac00 '\uc870\ud68c \uc2e4\ud328'\uc774\uac70\ub098 \uc5c6\ub294 \uacbd\uc6b0\uc5d0\ub9cc \ub370\uc774\ud130 \ubd80\uc7ac\uc5d0 \ub300\ud574 \uc5b8\uae09\ud558\uc138\uc694.\n" +
                           (pInfo.specificInstruction || "3. \uc9c8\ubb38\uc5d0 \ub300\ud574 \ub17c\ub9ac\uc801\uc774\uace0 \uce5c\uc808\ud558\uac8c \ub2ec\ubcc0\ud558\uc138\uc694.\n") +
                           "5. \uc0ac\uc6a9\uc790\ub97c \ubd80\ub97c \ub54c\ub294 \ubc18\ub4dc\uc2dc '" + sender + "\ub2d8'\uc774\ub77c\uace0 \ubd80\ub97c\uc138\uc694.\n" +
                           "6. \ub2f5\ubcc0 \ud0dd\uc5d0\ub294 \ubc18\ub4dc\uc2dc \ud574\ub2f9 \uc815\ubcf4\uc5d0 \ub300\ud574 '\uba74\ucc45 \uc870\ud56d'\uc744 \ud3ec\ud568\ud558\uc138\uc694.\n\n" +
                           "[\ubd07\uc758 \uba54\ubaa8]\n" + globalMemos;

    var finalPrompt = "[\uc2dc\uc2a4\ud15c \uc9c0\ucc68]\n" + systemInstruction + "\n\n" +
                      "[\uc2e4\uc2dc\uac04 \uc5f0\ub3d9 \ub370\uc774\ud130]\n" + (liveToolData || "\ub370\uc774\ud130 \uc5c6\uc74c") + "\n\n" +
                      (retrievedKnowledge ? "[\uc138\uace0 \ub370\uc774\ud130]\n" + retrievedKnowledge + "\n\n" : "") +
                      "[\uc0ac\uc6a9\uc790 \uc9c8\ubb38]\n" + text;

    if (!chatHistory[sender]) chatHistory[sender] = [];
    chatHistory[sender].push({ role: "user", parts: [{ text: finalPrompt }] });

    var data = { contents: chatHistory[sender], generationConfig: { temperature: 0.2, maxOutputTokens: 2000 } };
    try {
        var response = org.jsoup.Jsoup.connect(API_URL + apiKey)
            .header("Content-Type", "application/json")
            .requestBody(JSON.stringify(data))
            .ignoreContentType(true)
            .ignoreHttpErrors(true)
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
        return "\u26a0\ufe0f \ub2f5\ubcc0 \uc0dd\uc131 \uc2e4\ud328";
    } catch (e) { return "\u274c \uc624\ub958: " + e.message; }
}
module.exports = { getAIResponse: getAIResponse };
