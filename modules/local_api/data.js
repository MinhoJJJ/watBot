/**
 * 데이터 검색 모듈
 * DB에서 키워드를 포함하는 데이터를 찾아 반환합니다.
 */

function searchDatabase(content, KV) {
    // 명령어 ".데이터 " 부분 제거
    var keyword = content.replace(/^\.데이터\s*/, "").trim();
    
    if (!keyword) {
        return "🔍 검색할 키워드를 입력해주세요.\n(예: .데이터 포츄리)";
    }

    try {
        // 1. 키(Key)에서 검색 (LIKE 검색)
        var allResults = KV.searchKey(keyword);
        
        if (!allResults || allResults.length === 0) {
            // 2. 키에서 없으면 값(Value)에서도 검색 시도
            allResults = KV.search(keyword);
        }

        // ✅ 'user_memo_'로 시작하는 키만 필터링
        var results = [];
        for (var k = 0; k < allResults.length; k++) {
            if (allResults[k].key.startsWith("user_memo_")) {
                results.push(allResults[k]);
            }
        }

        if (!results || results.length === 0) {
            return "❌ '" + keyword + "'와(과) 관련된 사용자 메모를 찾을 수 없습니다.";
        }

        var reply = "🔍 '" + keyword + "' 메모 검색 결과 (" + results.length + "건):\n\n";
        
        // 검색 결과를 따옴표로 감싸서 나열
        for (var i = 0; i < results.length; i++) {
            var val = results[i].value;
            // 'user_memo_' 접두사 제거하여 이름만 깔끔하게 표시
            var displayName = results[i].key.replace("user_memo_", "");
            
            // 값이 객체라면 문자열화, 아니면 그대로 사용
            var displayVal = (typeof val === 'object') ? JSON.stringify(val) : val;
            
            reply += (i + 1) + ". " + displayName + ": \"" + displayVal + "\"\n";
            
            // 너무 많은 결과가 나오면 도배 방지를 위해 제한 (최대 15건)
            if (i >= 14 && results.length > 15) {
                reply += "\n...외 " + (results.length - 15) + "건이 더 있습니다.";
                break;
            }
        }

        return reply.trim();

    } catch (e) {
        return "⚠️ 검색 중 오류 발생: " + e.message;
    }
}

module.exports = {
    searchDatabase: searchDatabase
};
