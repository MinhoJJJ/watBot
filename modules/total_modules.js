// total_modules.js - 모든 모듈을 통합 관리 (구조적 폴더 트리 반영)

var modules = {};

// 1. 외부 API 연동 모듈 (external_api/)
modules.station = require('./external_api/station.js');
modules.deepl = require('./external_api/deepl.js');
modules.subway = require('./external_api/subway.js');
modules.rate = require('./external_api/rate.js');
modules.bus = require('./external_api/bus.js');
modules.weather = require('./external_api/weather.js');
modules.estate = require('./external_api/estate.js');
modules.finance = require('./external_api/finance.js');
modules.legal = require('./external_api/legal.js');

// 2. 로컬 비즈니스 로직 모듈 (local_api/)
modules.baby = require('./local_api/baby.js');
modules.ban = require('./local_api/ban.js');
modules.chat = require('./local_api/chat.js');

// 3. 유틸리티 및 시스템 모듈 (util/)
modules.apiKey = require('./api_key_list.js');
modules.command = require('./util/command.js');
modules.RhinoKV = require('./util/rhinokv.js');
modules.export = require('./util/export.js');

// 4. AI 핵심 엔진 (ai/)
modules.ai = {};
modules.ai.gemini = require('./ai/gemini.js');
modules.ai.finance = require('./ai/finance.js');
modules.ai.estate = require('./ai/estate.js');
modules.ai.legal = require('./ai/legal.js');
modules.ai.persona = require('./ai/persona.js');

module.exports = modules;
