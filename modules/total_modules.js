var modules = {};

modules.station = require('./external_api/station.js');
modules.deepl = require('./external_api/deepl.js');
modules.subway = require('./external_api/subway.js');
modules.rate = require('./external_api/rate.js');
modules.bus = require('./external_api/bus.js');
modules.weather = require('./external_api/weather.js');
modules.estate = require('./external_api/estate.js');
modules.finance = require('./external_api/finance.js');
modules.legal = require('./external_api/legal.js');

modules.baby = require('./local_api/baby.js');
modules.ban = require('./local_api/ban.js');
modules.chat = require('./local_api/chat.js');
modules.data = require('./local_api/data.js');

modules.api_key = require('./util/apiKey.js');
modules.apiKey = modules.api_key;
modules.command = require('./util/command.js');
modules.RhinoKV = require('./util/rhinokv.js');
modules.export = require('./util/export.js');

modules.ai = {};
modules.ai.gemini = require('./ai/gemini.js');
modules.ai.finance = require('./ai/finance.js');
modules.ai.estate = require('./ai/estate.js');
modules.ai.legal = require('./ai/legal.js');
modules.ai.persona = require('./ai/persona.js');

modules.ai_gemini_data = modules.ai.gemini;
modules.deepL_data = modules.deepl;
modules.station_time_data = modules.station;
modules.subway_data = modules.subway;
modules.rate_data = modules.rate;
modules.bus_data = modules.bus;
modules.command_data = modules.command;
modules.weather_data = modules.weather;
modules.ban_list = modules.ban;
modules.chat_record = modules.chat;

module.exports = modules;