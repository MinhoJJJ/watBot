const forbidden_words_list_19 = "forbidden_words_list_19";
const forbidden_words_sender_list_19 = "forbidden_words_sender_list_19";
const forbidden_words_list = "forbidden_words_list";
const forbidden_words_sender_list = "forbidden_words_sender_list";


// 금지어 관련 함수 분기
function getBanListFuntion(msg,KV,sender) {

   // sender 체크 — "나폴", "왓", "승겡" 중 하나 포함 여부
    const allowedSenders = ["나폴리탄", "WAT", "승겡","민호"];
    if (!allowedSenders.some(name => sender.includes(name))) {
        return "금지어 관련 명령어는 방장 및 부방장만 사용가능합니다."
    }else{
        // 19금지어 추가
        if (msg.startsWith(".금지어19추가 ")) {
            return addForbiddenWord(msg,KV,"19");
        }
        else if (msg.startsWith(".금지어추가 ")) {
            return addForbiddenWord(msg,KV,null);
        }         
        // 금지어 목록 보기
        else if (msg.startsWith(".금지어목록")) {
            return showForbiddenWords(KV,null);
        }
            //19금지어 목록 보기
        else if (msg.startsWith(".금지어19목록")) {
            return showForbiddenWords(KV,"19");
        }
        // 금지어 삭제
        else if (msg.startsWith(".금지어삭제 ")) {
            return removeForbiddenWord(msg,KV,"19");
        }
        // 19금지어 삭제
        else if (msg.startsWith(".금지어19삭제 ")) {
            return removeForbiddenWord(msg,KV,null);
        }
    }
}

// 금지어 목록 보기
function showForbiddenWords(KV,gubun) {
    let list = getForbiddenWords(KV,gubun);
    let name;
    if(gubun == "19"){
        name ="금지된 19금 단어목록"
    }else{
        name ="금지어 목록"
    }
    if (list.length === 0) {
        return "현재 "+name+"이 비어 있습니다.";
    } else {
        return "현재 "+name+" : " + list.join(", ");
    }
}

// 금지어 추가
function addForbiddenWord(msg,KV,gubun) {
    if(gubun == "19"){

        let word="";         // 채팅 내용
        word=msg.substr(9);  // 명령어 자르고 내용만 담는다.
        let list = getForbiddenWords(KV,gubun);

        if (list.indexOf(word) === -1) {
            list.push(word);
            KV.put(forbidden_words_list_19, list);
            return "금지어 추가 성공";
        }

        return "금지어 추가 실패";

    }else{

        let word="";         // 채팅 내용
        word=msg.substr(7);   // 명령어 자르고 내용만 담는다.
        let list = getForbiddenWords(KV,gubun);

        if (list.indexOf(word) === -1) {
            list.push(word);
            KV.put(forbidden_words_list, list);
            return "금지어 추가 성공";
        }

        return "금지어 추가 실패";
    }
}

// 금지어 삭제
function removeForbiddenWord(msg, KV, gubun) {
    if(gubun == "19"){
        let word = msg.substr(9); // ".금지어삭제 " 명령어 이후 내용만 추출
        let list = getForbiddenWords(KV,gubun);

        let index = list.indexOf(word);
        if (index !== -1) {
            list.splice(index, 1); // 해당 단어 삭제
            KV.put(forbidden_words_list_19, list);
            return "19 금지어 삭제 성공";
        }
        return "19 금지어 삭제 실패";
    }else{
        let word = msg.substr(7); // ".금지어삭제 " 명령어 이후 내용만 추출
        let list = getForbiddenWords(KV,gubun);

        let index = list.indexOf(word);
        if (index !== -1) {
            list.splice(index, 1); // 해당 단어 삭제
            KV.put(forbidden_words_list, list);
            return "금지어 삭제 성공";
        }
        return "금지어 삭제 실패";
    }
}

// 메시지에 19금 & 금지어 포함 여부 검사
function containsForbiddenWord(msg,KV,gubun) {
    let list = getForbiddenWords(KV,gubun);
    return list.some(word => msg.includes(word));
}

// 금지어 리스트 가져오기
function getForbiddenWords(KV,gubun) {
    let list;
    if(gubun == "19"){
        list = KV.get(forbidden_words_list_19);
    }else{
        list = KV.get(forbidden_words_list);
    }

    if (!list) {
        list = [];
        if(gubun == "19"){
            KV.put(forbidden_words_list_19, list);
        }else{
            KV.put(forbidden_words_list, list);
        }
    }
    return list;
}

// banList에 사용자(sender) 카운트 추가
function addBanCount(sender,KV,gubun) {

    if(gubun == "19"){
        let list = KV.get(forbidden_words_sender_list_19) || {}; // 현재 저장된 banList 가져오기
        
        if (!list[sender]) {
            list[sender] = 0; // 처음이면 0으로 초기화
        }
        
        list[sender] += 1; // 카운트 증가
        KV.put(forbidden_words_sender_list_19, list); // 저장

        return sender + "님 19금 단어 사용: "+list[sender]+"회";

    }else{

        let list = KV.get(forbidden_words_sender_list) || {}; // 현재 저장된 banList 가져오기
        if (!list[sender]) {
            list[sender] = 0; // 처음이면 0으로 초기화
        }
        
        list[sender] += 1; // 카운트 증가
        KV.put(forbidden_words_sender_list, list); // 저장

        return sender + "님 정치 단어 사용: "+list[sender]+"회";
    }
}


// export 데이터
exports.getBanListFuntion = getBanListFuntion;
exports.containsForbiddenWord = containsForbiddenWord;
exports.addBanCount = addBanCount;