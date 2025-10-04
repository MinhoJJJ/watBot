// 금지어 관련 함수 분기
function getBanListFuntion(msg,KV) {

    // 금지어 추가
    if (msg.startsWith(".금지어추가 ")) {
        return addForbiddenWord(msg,KV);
    }       
    // 금지어 목록 보기
    else if (msg.startsWith(".금지어목록")) {
        return showForbiddenWords(KV);
    }

    // 금지어 삭제
    else if (msg.startsWith(".금지어삭제 ")) {
        return removeForbiddenWord(msg,KV);
    }
}

// 금지어 리스트 가져오기
function getForbiddenWords(KV) {
    let list = KV.get("banlagList");
    if (!list) {
        list = [];
        KV.put("banlagList", list);
    }
    return list;
}

// 금지어 목록 보기
function showForbiddenWords(KV) {
    let list = getForbiddenWords(KV);
    if (list.length === 0) {
        return "현재 금지어 목록이 비어 있습니다.";
    } else {
        return "현재 금지어 목록: " + list.join(", ");
    }
}

// 금지어 추가
function addForbiddenWord(msg,KV) {
    let word="";         // 채팅 내용
    word=msg.substr(7);   // 명령어 자르고 내용만 담는다.

    let list = getForbiddenWords(KV);
    if (list.indexOf(word) === -1) {
        list.push(word);
        KV.put("banlagList", list);
        return "금지어 추가 성공";
    }

    return "금지어 추가 실패";
}

// 금지어 삭제
function removeForbiddenWord(msg, KV) {
    let word = msg.substr(7); // ".금지어삭제 " 명령어 이후 내용만 추출
    let list = getForbiddenWords(KV);

    let index = list.indexOf(word);
    if (index !== -1) {
        list.splice(index, 1); // 해당 단어 삭제
        KV.put("banlagList", list);
        return "금지어 삭제 성공";
    }
    return "금지어 삭제 실패";
}

// 메시지에 금지어 포함 여부 검사
function containsForbiddenWord(msg,KV) {
    let list = getForbiddenWords(KV);
    return list.some(word => msg.includes(word));
}

// banList에 사용자(sender) 카운트 추가
function addBanCount(sender,KV) {
    let list = KV.get("banList") || {}; // 현재 저장된 banList 가져오기
    if (!list[sender]) {
        list[sender] = 0; // 처음이면 0으로 초기화
    }
    
    list[sender] += 1; // 카운트 증가
    KV.put("banList", list); // 저장

    return sender + "님 19금 단어 사용: "+list[sender]+"회";
}


// export 데이터
exports.getBanListFuntion = getBanListFuntion;
exports.containsForbiddenWord = containsForbiddenWord;
exports.addBanCount = addBanCount;