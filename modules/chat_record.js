function addChatCount(sender, KV) {
    let today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    let chatLog = KV.get("chatCount") || {};

    if (!chatLog[today]) {
        chatLog[today] = {};
    }
    if (!chatLog[today][sender]) {
        chatLog[today][sender] = 0;
    }

    chatLog[today][sender] += 1;
    KV.put("chatCount", chatLog);
}

function getTopChatters(KV, date = null) {
    let chatLog = KV.get("chatCount") || {};
    if (!date) {
        date = new Date().toISOString().split("T")[0];
    }

    let todayLog = chatLog[date] || {};
    let sorted = Object.entries(todayLog).sort((a, b) => b[1] - a[1]);

    return sorted; // [["user1", 10], ["user2", 5], ...]
}

function getMonthlyTopChatters(KV, year = null, month = null) {
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
            for (let user in dailyLog) {
                if (!userCounts[user]) userCounts[user] = 0;
                userCounts[user] += dailyLog[user];
            }
        }
    }

    let sorted = Object.entries(userCounts).sort((a, b) => b[1] - a[1]);
    return sorted.slice(0, 20); // 최대 20명
}

// export 데이터
exports.addChatCount = addChatCount;
exports.getTopChatters = getTopChatters;
exports.getMonthlyTopChatters = getMonthlyTopChatters;