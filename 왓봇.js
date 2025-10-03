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

// API 데이터
//const api_data = require('apiKey_data.js');

// DB 객체 생성
const RhinoKV = require('RhinoKV');
KV = new RhinoKV(); 
KV.open('/msgbot/watBot/watBotDB.db');

// 모든 응답 처리기
function response(room, msg, sender, isGroupChat, replier, imageDB, packageName) {

    // 중복실행 방지
    if(msg.startsWith(".") && nows =='0'){

        // 중복실행 방지 변수
        nows ='1';

        // 왓봇 AI 응답
        if (msg.startsWith(".저장 ㅎㅇ ")) {
            // 응답
            //KV.put("test","hi");
            //replier.reply(KV.get("test").value);
        }
        // 왓봇 AI 응답
        if (msg.startsWith(".챗 ")) {
            // 응답
           // replier.reply(ai_data.getAIResponse(msg,api_data.getApiKey("gpt")));
        }

        // 왓봇  번역 응답
        else if ((msg.startsWith(".번역 ") || msg.startsWith(".84 ") )) {
            // 응답
          //  replier.reply(deepL_data.getTransResponse(msg,api_data.getApiKey("deepl")));
        }

        // 공항 전철 시간표 안내
        else if ((msg.startsWith(".간사이") || msg.startsWith(".나리타"))) {
            // 응답
            replier.reply(station_time_data.getUpcomingTrains(msg));
        }

        // 베이비 데이터
        else if (msg.startsWith(".아동")) {
            // 응답
            replier.reply(baby_data.getbabyMsg(msg));
        }

        // 실시간 지하철
        else if (msg.startsWith(".역 ")) {
            // 응답
            replier.reply(subway_data.getKoreaSubwayInfo(msg,api_data.getApiKey("subway")));
        }

        // 실시간 환율
        else if (msg.startsWith(".환율")) {
            // 응답
           // replier.reply(rate_data.getRate(api_data.getApiKey("rate")));
        }

        // 버스 노선 불러오기
        else if ((msg.startsWith(".버스")) ){
            // 응답
            replier.reply(bus_data.getBusInfo(msg));
        }

        // 사용가능한 명령어
        else if ((msg.startsWith(".명령어")) ){
            // 응답
            replier.reply(command_data.getCommandData(msg));
        }

        // 방장소환
        else if ((msg.startsWith(".왓")) || (msg.startsWith(".나폴")) || (msg.startsWith(".승겡")) ){
            // 응답
            replier.reply(command_data.getComeMaster(msg));
        }

        // 지우개
        else if ((msg.startsWith(".지우개")) ){
            // 응답
            for(let i = 0; i < 5; i++) {
                replier.reply(command_data.getComeMaster(msg));
            }
        }

        // 실시간 날씨
        else if (msg.startsWith(".날씨")) {
            // 응답
            replier.reply(weather_data.getWeatherFromNaver(msg));
        }

        // 실시간 환전
        else if (msg.startsWith(".환전")) {
            // 응답
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

