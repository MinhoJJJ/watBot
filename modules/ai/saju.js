/**
 * 사주 분석 보조 모듈
 * 
 * 사용자의 생년월일을 입력받아 제미나이에게 전달할 사주 특화 프롬프트를 구성합니다.
 */

function handleSaju(text) {
    // ".사주 " 또는 ".오늘의사주 " 접두어 제거
    var isToday = text.startsWith(".오늘의사주");
    var input = text.replace(/^\.오늘의사주\s*/, "").replace(/^\.사주\s*/, "").trim();
    
    // 생년월일 형식 확인 (YYYYMMDD)
    var dateRegex = /^(\d{4})(\d{2})(\d{2})$/;
    var match = input.match(dateRegex);
    
    if (!match) {
        var cmd = isToday ? ".오늘의사주" : ".사주";
        return {
            isSajuQuery: false,
            error: "❌ 생년월일을 YYYYMMDD 형식으로 입력해주세요.\n예) " + cmd + " 19900101"
        };
    }

    var year = match[1];
    var month = match[2];
    var day = match[3];

    // 간단한 날짜 유효성 검사
    var m = parseInt(month, 10);
    var d = parseInt(day, 10);
    if (m < 1 || m > 12 || d < 1 || d > 31) {
        return {
            isSajuQuery: false,
            error: "❌ 올바른 날짜를 입력해주세요. (월: 01~12, 일: 01~31)"
        };
    }

    var sajuContext = "【사용자 생년월일 정보】\n" +
                      "- 양력: " + year + "년 " + month + "월 " + day + "일\n\n";

    if (isToday) {
        sajuContext += "위 정보를 바탕으로 '오늘의 운세'를 집중적으로 분석해주세요.\n" +
                       "오늘 하루의 전반적인 흐름, 유의해야 할 시간대, 행운의 아이템(색상, 숫자 등)을 포함하여 상세히 풀이해주세요.";
    } else {
        sajuContext += "위 정보를 바탕으로 전통 사주명리학과 관상을 분석하여 평생운과 전반적인 기운을 풀이해주세요.";
    }

    return {
        isSajuQuery: true,
        isTodaySajuQuery: isToday,
        sajuContext: sajuContext,
        birthDate: input
    };
}

module.exports = {
    handleSaju: handleSaju
};
