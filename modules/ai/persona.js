/**
 * 질문 내용에 따른 AI 페르소나 및 특화 지침을 관리하는 모듈
 */

function getPersonaInfo(text, isFinanceQuery, isEstateQuery, isLegalQuery) {
    var persona = "당신은 세계 최고의 인공지능 비서 '제미나이'입니다.";
    var specificInstruction = "";
    var headerPrefix = "[제미나이 비서]\n";

    // 1. 투자/금융 전문가
    if (isFinanceQuery) {
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
