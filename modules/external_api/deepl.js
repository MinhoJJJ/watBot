function getTransResponse(msg, apiKey) {
    var target_lang = '';
    var source_lang = '';
    var text = '';

    if (msg.startsWith('.번역 ')) {
        target_lang = 'JA';
        source_lang = 'KO';
    } else if (msg.startsWith('.84 ')) {
        target_lang = 'KO';
        source_lang = 'JA';
    }

    text = msg.substr(3);

    var result;

    try {
        var requestBody = {
            text: [text],
            target_lang: target_lang,
            source_lang: source_lang
        };

        var response = org.jsoup.Jsoup.connect('https://api-free.deepl.com/v2/translate')
            .header('Content-Type', 'application/json')
            .header('Authorization', 'DeepL-Auth-Key ' + apiKey)
            .requestBody(JSON.stringify(requestBody))
            .ignoreContentType(true)
            .ignoreHttpErrors(true)
            .timeout(3000)
            .post();

        var result1 = JSON.parse(response.text());

        if (result1 && result1.translations && result1.translations.length > 0) {
            result = '[번역] \n' + result1.translations[0].text;
        } else {
            result = '번역 실패:' + JSON.stringify(result1);
        }
    } catch (e) {
        result = '번역 실패: ' + e.message;
    }
    return result;
}

exports.getTransResponse = getTransResponse;