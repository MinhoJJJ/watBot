/**
 * 제미나이 AI - 법률 및 행정 분석 모듈
 */

function handleLegal(text, allModules) {
    var result = {
        isLegalQuery: false,
        liveToolData: ""
    };

    var legalKeywords = ["법", "행정", "절차", "비자", "소송", "조례", "규정", "신고", "허가"];
    var hasLegalKW = false;
    for(var i=0; i<legalKeywords.length; i++) { 
        if(text.indexOf(legalKeywords[i]) !== -1) { hasLegalKW = true; break; } 
    }

    if (hasLegalKW) {
        result.isLegalQuery = true;
        // 필요 시 legal_code_data 등을 활용한 로직 추가 가능
        // 현재는 페르소나 전환을 위한 플래그 역할 및 기본 안내 멘트 준비
        result.liveToolData += "【행정/법률 가이드】\n사용자의 질문에 맞는 관련 법령 및 행정 절차를 분석합니다.\n\n";
    }

    return result;
}

module.exports = {
    handleLegal: handleLegal
};
