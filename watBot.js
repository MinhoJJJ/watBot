let nows ='0';

// 공항전철 스케줄
const station_time_data = require('station_time_data.js');

// AI CHAT GPT
const ai_data = require('ai.js');

// DEEPL 번역기
const deepL_data = require('deepL.js');

// 지하철 데이터
const subway_data = require('subway_data.js');

// 아동정보 데이터
const baby_data = require('baby_data.js');

// 환율 데이터
const rate_data = require('rate_data.js');

// 버스 데이터
const bus_data = require('bus_data.js');

// 명령어 데이터
const command_data = require('command_data.js');

// 날씨 데이터
const weather_data = require('weather_data.js');

// 벤리스트 관리
const ban_list = require('ban_list.js');

// 채팅 이력 관리
const chat_record = require('chat_record.js');

// API 데이터
const apiKey = require('api_key_list.js');

// DB 객체 생성
const RhinoKV = require('RhinoKV');
KV = new RhinoKV(); 
KV.open('/sdcard/msgbot/db/watBot/watBotDB.db');

// 모든 응답 처리기
function response(room, msg, sender, isGroupChat, replier, imageDB, packageName) {

    // 채팅 이력 저장
    if(!msg.startsWith(".")){
        chat_record.addChatCount(sender,KV);
    }

    // 19금 단어 카운팅
    if(ban_list.containsForbiddenWord(msg,KV) && !msg.startsWith(".")){
        replier.reply( ban_list.addBanCount(sender,KV));
    }

    // 중복실행 방지
    if(msg.startsWith(".") && nows =='0'){

        // 중복실행 방지 변수
        nows ='1';

        // 금지어 추가하기
        if (msg.startsWith(".금지어추가 ")) {
            replier.reply(ban_list.addForbiddenWord(msg,KV));
        }

        // 채팅 랭킹
        else if (msg.startsWith(".채팅랭킹")) {
            let topList = chat_record.getTopChatters(KV);
            if (topList.length === 0) {
                replier.reply("오늘 채팅 기록이 없습니다.");
            } else {
                let replyText = "오늘 최다 채팅자:\n";
                topList.forEach(([user, count], index) => {
                    replyText += `${index+1}. ${user} - ${count}회\n`;
                });
                replier.reply(replyText);
            }
        }
        // 월간 채팅 랭킹
        else if (msg.startsWith(".월채팅랭킹")) {
            let topList = chat_record.getMonthlyTopChatters(KV);
            if (topList.length === 0) {
                replier.reply("이번 달 채팅 기록이 없습니다.");
            } else {
                let replyText = "이번 달 최대 채팅자 :\n";
                topList.forEach(([user, count], index) => {
                    replyText += `${index+1}. ${user} - ${count}회\n`;
                });
                replier.reply(replyText);
            }
        }       
        // 금지어 목록 보기
        else if (msg.startsWith(".금지어목록")) {
            replier.reply(ban_list.showForbiddenWords(KV));
        }

        // 금지어 삭제
        else if (msg.startsWith(".금지어삭제 ")) {
            replier.reply(ban_list.removeForbiddenWord(msg,KV));
        }
        // 왓봇 AI 응답
        else if (msg.startsWith(".챗 ")) {
            replier.reply(ai_data.getAIResponse(msg,apiKey.getApiKey("gpt")));
        }

        // 왓봇  번역 응답
        else if ((msg.startsWith(".번역 ") || msg.startsWith(".84 ") )) {
          //  replier.reply(deepL_data.getTransResponse(msg,api_data.getApiKey("deepl")));
        }

        // 공항 전철 시간표 안내
        else if ((msg.startsWith(".간사이") || msg.startsWith(".나리타"))) {
            replier.reply(station_time_data.getUpcomingTrains(msg));
        }

        // 베이비 데이터
        else if (msg.startsWith(".아동")) {
            replier.reply(baby_data.getbabyMsg(msg));
        }

        // 실시간 지하철
        else if (msg.startsWith(".역 ")) {
            //replier.reply(subway_data.getKoreaSubwayInfo(msg,api_data.getApiKey("subway")));
        }

        // 실시간 환율
        else if (msg.startsWith(".환율")) {
           // replier.reply(rate_data.getRate(api_data.getApiKey("rate")));
        }

        // 버스 노선 불러오기
        else if ((msg.startsWith(".버스")) ){
            replier.reply(bus_data.getBusInfo(msg));
        }

        // 사용가능한 명령어
        else if ((msg.startsWith(".명령어")) ){
            replier.reply(command_data.getCommandData(msg));
        }

        // 방장소환
        else if ((msg.startsWith(".왓")) || (msg.startsWith(".나폴")) || (msg.startsWith(".승겡")) ){
            replier.reply(command_data.getComeMaster(msg));
        }

        // 지우개
        else if ((msg.startsWith(".지우개")) ){
            for(let i = 0; i < 5; i++) {
                replier.reply(command_data.getComeMaster(msg));
            }
        }

        // 실시간 날씨
        else if (msg.startsWith(".날씨")) {
            replier.reply(weather_data.getWeatherFromNaver(msg));
        }

        // 실시간 환전
        else if (msg.startsWith(".환전")) {
            replier.reply(rate_data.getChangMoney(msg));
        }

        else{
            replier.reply(command_data.getCommandData(msg));
        }


        // 중복실행 방지 변수
        nows ='0';
    }else if(msg.startsWith(".") && nows =='1'){
        replier.reply("봇이 이미 실행중에 있습니다.");
    }
}

