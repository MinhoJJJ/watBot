// 채팅 관련 함수 분기
function getChatRecordFuntion(msg,KV,room) {

    // 채팅랭킹
    if (msg.startsWith(".채팅랭킹")) {
        let topList = getTopChatters(KV,null,room);
        if (topList.length === 0) {
            return "오늘 채팅 기록이 없습니다.";
        } else {
            let replyText = "오늘 최다 채팅자:\n";
            topList.forEach(([user, count], index) => {
                replyText += `${index+1}. ${user} - ${count}회\n`;
            });
            return replyText;
        }    
    }       
    // 월간 채팅 랭킹
    else if (msg.startsWith(".채팅월랭킹")) {
        let topList = getMonthlyTopChatters(KV,null,room);
        if (topList.length === 0) {
            return "이번 달 채팅 기록이 없습니다.";
        } else {
            let replyText = "이번 달 최대 채팅자 :\n";
            topList.forEach(([user, count], index) => {
                replyText += `${index+1}. ${user} - ${count}회\n`;
            });
            return replyText;
        }
    }
}


function addChatCount(sender, KV, room) {
    let today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    let chatLog = KV.get("chatCount") || {};

    if (!chatLog[today]) {
        chatLog[today] = {};
    }
    if (!chatLog[today][room]) {
        chatLog[today][room] = {};
    }

    if (!chatLog[today][room][sender]) {
        chatLog[today][room][sender] = 0;
    }

    chatLog[today][room][sender] += 1;

    KV.put("chatCount", chatLog);
    return today+","+room+","+sender;
}

function getTopChatters(KV, date = null, room) {
    let chatLog = KV.get("chatCount") || {};
    if (!date) {
        date = new Date().toISOString().split("T")[0];
    }

    let todayLog = chatLog[date] || {};
    let roomLog = todayLog[room] || {}; // room 기준으로 접근

    let sorted = Object.entries(roomLog).sort((a, b) => b[1] - a[1]);

    return sorted; 
}

function getMonthlyTopChatters(KV, year = null, month = null, room) {
    let chatLog = KV.get("chatCount") || {};
    if (!year || !month) {
        let today = new Date();
        year = today.getFullYear();
        month = today.getMonth() + 1; // 월은 0~11이므로 +1
    }
    if (month < 10) month = "0" + month; // 01, 02 형식 유지

    let userCounts = {};

    for (let date in chatLog) {
        if (date.startsWith(`${year}-${month}`)) {
            let dailyLog = chatLog[date];

            if (!dailyLog[room]) continue; // 해당 room이 없으면 건너뜀
            let roomLog = dailyLog[room];

            for (let user in roomLog) {
                if (!userCounts[user]) userCounts[user] = 0;
                userCounts[user] += roomLog[user];
            }
        }
    }

    let sorted = Object.entries(userCounts).sort((a, b) => b[1] - a[1]);
    return sorted.slice(0, 20); // 최대 20명
}

// export 데이터
exports.addChatCount = addChatCount;
exports.getChatRecordFuntion = getChatRecordFuntion;
