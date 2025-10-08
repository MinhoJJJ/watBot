const bot = BotManager.getCurrentBot();
const modules = require('total_modules.js');

// DB 객체 생성
let KV = new modules.RhinoKV();
KV.open('/sdcard/msgbot/db/watBot/watBotDB.db');

// 봇 세팅
bot.setCommandPrefix(".");
bot.addListener(Event.COMMAND, onCommand);
bot.addListener(Event.MESSAGE, onMessage);

let isRunning = false; // 중복 실행 방지

function onCommand(msg) {
    if (isRunning) {
        msg.reply("봇이 이미 실행중에 있습니다.");
        return;
    }

    isRunning = true;

    const command = msg.command;
    const args = msg.args;
    const content = msg.content;
    const sender = msg.author.name;

    try {
        if (command.startsWith("채팅")) {
            msg.reply(modules.chat_record.getChatRecordFuntion(content, KV, msg.room));
        }
        else if (command.startsWith("금지어")) {
            msg.reply(modules.ban_list.getBanListFuntion(content, KV,sender));
        }
        else if (command === "챗") {
            msg.reply(modules.ai_gemini_data.getAIResponse(sender, content, modules.api_key.getApiKey("gemini")));
        }
        else if (command === "번역" || command === "84") {
            msg.reply(modules.deepL_data.getTransResponse(content, modules.api_key.getApiKey("deepl")));
        }
        else if (command === "간사이" || command === "나리타") {
            msg.reply(modules.station_time_data.getUpcomingTrains(content));
        }
        else if (command === "역") {
            msg.reply(modules.subway_data.getKoreaSubwayInfo(content, modules.api_key.getApiKey("subway")));
        }
        else if (command === "환율") {
            msg.reply(modules.rate_data.getRate(modules.api_key.getApiKey("rate")));
        }
        else if (command === "버스") {
            msg.reply(modules.bus_data.getBusInfo(content));
        }
        else if (command === "명령어") {
            msg.reply(modules.command_data.getCommandData(content));
        }
        else if (command === "날씨") {
            msg.reply(modules.weather_data.getWeatherFromNaver(content));
        }
        else if (command === "환전") {
            msg.reply(modules.rate_data.getChangMoney(content));
        }
        else {
            msg.reply(modules.command_data.getCommandData(content));
        }
    } catch (e) {
        msg.reply("오류 발생: "+e);
    } finally {
        isRunning = false; // 실행 완료 후 초기화
    }
}

function onMessage(msg) {

    const content = msg.content;
    const sender = msg.author.name;

    if (!content.startsWith(".")) {
        modules.chat_record.addChatCount(sender, KV, msg.room);

        if (modules.ban_list.containsForbiddenWord(content, KV, "19")) {
            msg.reply(modules.ban_list.addBanCount(sender, KV, "19"));
        }

        if (modules.ban_list.containsForbiddenWord(content, KV, null)) {
            msg.reply(modules.ban_list.addBanCount(sender, KV, null));
        }
    }
}


function onCreate(savedInstanceState, activity) {
    var textView = new android.widget.TextView(activity);
    textView.setText("Hello, World!");
    textView.setTextColor(android.graphics.Color.DKGRAY);
    activity.setContentView(textView);
}

function onStart(activity) {}
function onResume(activity) {}
function onPause(activity) {}
function onStop(activity) {}
function onRestart(activity) {}
function onDestroy(activity) {}
function onBackPressed(activity) {}

bot.addListener(Event.Activity.CREATE, onCreate);
bot.addListener(Event.Activity.START, onStart);
bot.addListener(Event.Activity.RESUME, onResume);
bot.addListener(Event.Activity.PAUSE, onPause);
bot.addListener(Event.Activity.STOP, onStop);
bot.addListener(Event.Activity.RESTART, onRestart);
bot.addListener(Event.Activity.DESTROY, onDestroy);
bot.addListener(Event.Activity.BACK_PRESSED, onBackPressed);
