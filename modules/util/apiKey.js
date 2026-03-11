var realApiKeys = null;
try {
    realApiKeys = require('../api_key_list.js');
} catch (e) {
}

var DEEPL_API_KEY = '';
var GPT_API_KEY = '';
var SUBWAY_API_KEY = '';
var RATE_API_KEY = '';
var GEMINI_API_KEY = '';
var ESTATE_API_KEY = '';

function getApiKey(msg){
    if (realApiKeys && typeof realApiKeys.getApiKey === 'function') {
        var key = realApiKeys.getApiKey(msg);
        if (key) return key;
    }

    var result = '';

    if(msg=='rate'){
        result=RATE_API_KEY;
    }else if(msg=='subway'){
        result=SUBWAY_API_KEY;
    }else if(msg=='gpt'){
        result=GPT_API_KEY;
    }else if(msg=='deepl'){
        result=DEEPL_API_KEY;
    }else if(msg=='gemini'){
        result=GEMINI_API_KEY;
    }else if(msg=='estate'){
        result=ESTATE_API_KEY;
    }

    return result;
}

exports.getApiKey = getApiKey;