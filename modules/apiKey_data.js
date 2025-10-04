
// DEEPL
const DEEPL_API_KEY = '';

// 챗 GPT
const GPT_API_KEY = ""; // Open AI 사이트에서 발급받은 API 키입력

// 지하철
const SUBWAY_API_KEY="";

//환율
const RATE_API_KEY="";// API 키 입력

//제미나이
const GEMINI_API_KEY="";// API 키 입력

function getApiKey1(msg){

    let result;

    if(msg=="rate"){
        result=RATE_API_KEY;
    }else if(msg=="subway"){
        result=SUBWAY_API_KEY;
    }else if(msg=="gpt"){
        result=GPT_API_KEY;
    }else if(msg=="deepl"){
        result=DEEPL_API_KEY;
    }

    return result
}

// export 데이터
exports.getApiKey1 = getApiKey1;
