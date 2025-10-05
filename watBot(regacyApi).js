let nows ='0';

// require 한번에
const modules = require('total_modules.js');

// DB 객체 생성
KV = new modules.RhinoKV(); 
KV.open('/sdcard/msgbot/db/watBot/watBotDB.db');

function response(room, msg, sender, isGroupChat, replier, imageDB, packageName) {

    replier.reply("gd");
    // 채팅 이력 저장
    if (!msg.startsWith(".")) { modules.chat_record.addChatCount(sender, KV, room);}

    // 19금 단어 카운팅
    if (modules.ban_list.containsForbiddenWord(msg, KV, "19") && !msg.startsWith(".")) { replier.reply(modules.ban_list.addBanCount(sender, KV, "19"));}

    // 금지어 단어 카운팅
    if (modules.ban_list.containsForbiddenWord(msg, KV, null) && !msg.startsWith(".")) { replier.reply(modules.ban_list.addBanCount(sender, KV, null));}

    // 중복실행 방지
    if (msg.startsWith(".") && nows == '0') {
        nows = '1';

        if (msg.startsWith(".채팅")) {
            replier.reply(modules.chat_record.getChatRecordFuntion(msg, KV, room));
        }
        else if (msg.startsWith(".금지어")) {
            replier.reply(modules.ban_list.getBanListFuntion(msg, KV));
        }
        else if (msg.startsWith(".챗 ")) {
           // replier.reply(modules.ai_gpt_data.getAIResponse(sender,msg, modules.api_key.getApiKey("gpt")));
            replier.reply(modules.ai_gemini_data.getAIResponse(sender,msg, modules.api_key.getApiKey("gemini")));
        }
        else if ((msg.startsWith(".번역 ") || msg.startsWith(".84 "))) {
            replier.reply(modules.deepL_data.getTransResponse(msg, modules.api_key.getApiKey("deepl")));
        }
        else if ((msg.startsWith(".간사이") || msg.startsWith(".나리타"))) {
            replier.reply(modules.station_time_data.getUpcomingTrains(msg));
        }
        else if (msg.startsWith(".역 ")) {
            replier.reply(modules.subway_data.getKoreaSubwayInfo(msg, modules.api_key.getApiKey("subway")));
        }
        else if (msg.startsWith(".환율")) {
            replier.reply(modules.rate_data.getRate(modules.api_key.getApiKey("rate")));
        }
        else if ((msg.startsWith(".버스"))) {
            replier.reply(modules.bus_data.getBusInfo(msg));
        }
        else if ((msg.startsWith(".명령어"))) {
            replier.reply(modules.command_data.getCommandData(msg));
        }
        else if (msg.startsWith(".날씨")) {
            replier.reply(modules.weather_data.getWeatherFromNaver(msg));
        }
        else if (msg.startsWith(".환전")) {
            replier.reply(modules.rate_data.getChangMoney(msg));
        }
        else {
            replier.reply(modules.command_data.getCommandData(msg));
        }

        // 중복실행 방지 변수
        nows ='0';
    }else if(msg.startsWith(".") && nows =='1'){
        replier.reply("봇이 이미 실행중에 있습니다.");
    }
}

