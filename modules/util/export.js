// 공항전철 스케줄
var station_time_data = require('../external_api/station.js');
exports.station_time_data = station_time_data;

// AI 제미나이
var ai_gemini_data = require('../ai/gemini.js');
exports.ai_gemini_data = ai_gemini_data;

// DEEPL 번역기
var deepL_data = require('../external_api/deepl.js');
exports.deepL_data = deepL_data;

// 지하철 데이터
const subway_data = require('../external_api/subway.js');
exports.subway_data = subway_data;

// 아동정보 데이터
var baby_data = require('../local_api/baby.js');
exports.baby_data = baby_data;

// 환율 데이터
var rate_data = require('../external_api/rate.js');
exports.rate_data = rate_data;

// 금지어 데이터
var ban_list = require('../local_api/ban.js');
exports.ban_list = ban_list;

// 채팅 기록 데이터
var chat_record = require('../local_api/chat.js');
exports.chat_record = chat_record;

// 명령어 데이터
var command_data = require('./command.js');
exports.command_data = command_data;

// 날씨 데이터
var weather_data = require('../external_api/weather.js');
exports.weather_data = weather_data;

// 버스 데이터
var bus_data = require('../external_api/bus.js');
exports.bus_data = bus_data;

// API 키
var api_key = require('./apiKey.js');
exports.api_key = api_key;
