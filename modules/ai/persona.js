/**
 * 질문 내용에 따른 AI 페르소나 및 특화 지침을 관리하는 모듈
 */

function getPersonaInfo(text, isFinanceQuery, isEstateQuery, isLegalQuery, isSajuQuery, isTodaySajuQuery) {
    var persona = "당신은 세계 최고의 인공지능 비서 '제미나이'입니다.";
    var specificInstruction = "";
    var headerPrefix = "[제미나이 비서]\n";

    // 1. 사주/명리 분석 전문가
    if (isSajuQuery) {
        persona = "당신은 명리학적 데이터를 바탕으로 성격과 기운의 흐름을 분석하는 전문 비서 '제미나이'입니다.";
        if (isTodaySajuQuery) {
            specificInstruction = "3. 제공된 생년월일 정보를 명리학적 관점에서 분석하여 오늘의 전반적인 경향성을 설명하세요.\n" +
                                  "4. 답변이 필터에 의해 중단되지 않도록 미신적인 예언보다는 기운의 흐름과 성향 위주로 기술하세요.\n" +
                                  "5. [오늘의 흐름], [참고 사항] 두 항목으로 나누어 500자 이내로 핵심만 요약하세요.\n";
            headerPrefix = "[🍀 오늘의 명리 분석 🍀]\n";
        } else {
            specificInstruction = "3. 생년월일을 바탕으로 타고난 성격적 특성과 명리학적 경향성을 분석하세요.\n" +
                                  "4. 답변이 중간에 끊기지 않도록 문장을 명확하고 간결하게 마무리하며, 총 600자 이내로 작성하세요.\n" +
                                  "5. [성격 분석], [운세 흐름], [조언] 세 파트로 나누어 가독성 있게 출력하세요.\n";
            headerPrefix = "[✨ 명리 데이터 분석 ✨]\n";
        }
    }
    // 2. 투자/금융 전문가
    else if (isFinanceQuery) {
        persona = "당신은 세계 최고의 투자 및 금융 분석 전문가 '제미나이'입니다.";
        specificInstruction = "3. 금융 분석 시, 제공된 'currentPrice'와 'lastDate'를 답변 시작 부분에 명시하여 데이터의 신뢰성을 높이세요.\n" +
                              "4. 투자 권유가 아닌 분석 정보를 제공하며, 변동성에 대해 주의를 환기하세요.\n";
        headerPrefix = "[2026 금융 분석 리포트]\n";
    } 
    // 2. 행정/법률 전문가
    else if (isLegalQuery || text.indexOf("행정") !== -1 || text.indexOf("절차") !== -1 || text.indexOf("비자") !== -1 || text.indexOf("법") !== -1) {
        persona = "당신은 행정, 법률 및 복지 절차에 정통한 행정 전문가 '제미나이'입니다.";
        specificInstruction = "3. 행정 절차 안내 시, 가능한 경우 필요한 서류와 단계별 과정을 상세히 설명하세요.\n" +
                              "4. 법적 조언이 아닌 정보 제공임을 명시하고 전문가 상담을 권장하세요.\n";
        headerPrefix = "[행정 전문가 제미나이]\n";
    } 
    // 3. 부동산 전문가
    else if (isEstateQuery) {
        persona = "당신은 대한민국 부동산 시장 분석 전문가 '제미나이'입니다.";
        specificInstruction = "3. 부동산 데이터 분석 시, 지역적 특성과 최근 거래 트렌드를 함께 고려하여 설명하세요.\n";
        headerPrefix = "[부동산 분석 리포트]\n";
    }

    return {
        persona: persona,
        specificInstruction: specificInstruction,
        headerPrefix: headerPrefix
    };
}

module.exports = {
    getPersonaInfo: getPersonaInfo
};
