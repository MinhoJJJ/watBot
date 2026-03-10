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
    
    for (var i = 0; i < legalKeywords.length; i++) {
        if (text.indexOf(legalKeywords[i]) !== -1) {
            hasLegalKW = true;
            break;
        }
    }

    if (hasLegalKW) {
        result.isLegalQuery = true;
        result.liveToolData += "【행정/법률 가이드】\n";
        result.liveToolData += "사용자의 질문에 맞는 관련 법령 및 행정 절차를 분석합니다.\n\n";
    }

    return result;
}

exports.handleLegal = handleLegal;
