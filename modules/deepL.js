// DeepL API 키 설정
const DEEPL_API_KEY = 'faa1f51d-b626-481e-b08f-8588ae1b3e39:fx';
const DEEPL_API_URL = 'https://api-free.deepl.com/v2/translate';

// DEEPL 번역
function getTransResponse(msg) {

    let target_lang="";  // 변경할 언어
    let source_lang="";  // 채팅으로 나온 언어
    let text="";         // 채팅 내용

    // 한국어 -> 일본어 번역
    if(msg.startsWith(".번역 ")){
        target_lang="JA";
        source_lang="KO";

    // 일본어 -> 한국어 번역
    }else if(msg.startsWith(".84 ")){
        target_lang="KO";
        source_lang="JA";
    }

    text=msg.substr(3);   // 명령어 자르고 내용만 담는다.

    let result;

    try {
        // API 요청 본문 구성
        const requestBody = {
            text: [text],
            target_lang: target_lang,
            source_lang: source_lang
        };

        // API 호출
        const response = org.jsoup.Jsoup.connect("https://api-free.deepl.com/v2/translate")
            .header("Content-Type", "application/json")
            .header("Authorization", "DeepL-Auth-Key " + DEEPL_API_KEY)
            .requestBody(JSON.stringify(requestBody))
            .ignoreContentType(true)
            .ignoreHttpErrors(true)
            .timeout(3000)
            .post();

        // JSON으로 받은 데이터를 result1 에 담음
        const result1 = JSON.parse(response.text());

        // 번역 결과 처리
        if (result1 && result1.translations && result1.translations.length > 0) {
            result ="[번역] \n"+result1.translations[0].text;
        } else {
            result = "번역 실패:" +result1;
        }
    } catch(e) {
        result = "번역 실패: " + e.message;
    }
    return result
}

exports.getTransResponse = getTransResponse;
