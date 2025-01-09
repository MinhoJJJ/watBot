// chat gpt AI API 키 설정
const key = "sk-CvO61AzyYuNdBai1CuqdT3BlbkFJFKvObIxXXxLiVD45eP4e"; // Open AI 사이트에서 발급받은 API 키입력

// AI 챗지피티
function getAIResponse(msg) {

    let text=msg.substr(3);

    let result;
    const data = {
        "model": "gpt-3.5-turbo",
        "messages": [{

            "role": "system",
            "content": "친절하다"}
            ,{"role":"assistant","content":"친절하다"}
            ,{"role":"user","content":text}
        ],

        "temperature": 0,
        "max_tokens": 300,
        "top_p": 0.4,
        "frequency_penalty": 0.2,
        "presence_penalty": 0.6,
    };

    try {
        const response = org.jsoup.Jsoup.connect("https://api.openai.com/v1/chat/completions")
            .header("Content-Type", "application/json")
            .header("Authorization", "Bearer " + key)
            .requestBody(JSON.stringify(data))
            .ignoreContentType(true)
            .ignoreHttpErrors(true)
            .timeout(20000)
            .post();
            const result1 = JSON.parse(response.text());

        if (result1.choices && result1.choices.length > 0 && result1.choices[0].message && result1.choices[0].message.content) {
            result = "[AI봇] \n" + result1.choices[0].message.content;
        } else {
            throw new Error("대화 결과를 가져올 수 없습니다.");
        }
    } catch(e) {
        result = "오류가 발생했습니다: " + e.message;
    }
    return result;
}

exports.getAIResponse = getAIResponse;

/* 명령어 설명
1. temperature (0~2):
    값이 0: 매우 일관된, 예측 가능한 응답을 생성
    값이 1~2: 더 창의적이고 다양한 응답을 생성
    귀하의 코드는 0으로 설정되어 있어서 매우 일관되고 정확한 응답을 선호합니다

2. max_tokens (500):
    응답의 최대 길이를 제한
    500 tokens은 대략 영어로 375단어, 한글로 250단어 정도
    토큰이 부족하면 응답이 중간에 잘릴 수 있습니다

3. top_p (1):
    nucleus sampling이라고도 함
    1은 모든 가능한 응답을 고려
    낮은 값(예: 0.1)은 더 집중된, 보수적인 응답을 생성
    temperature와 비슷한 역할이지만 다른 방식으로 작동

4. frequency_penalty (0.2):
    양수값: 같은 단어나 구문의 반복을 줄임
    음수값: 반복을 더 허용
    0.2는 약간의 반복 방지 효과가 있음

5. presence_penalty (0.6):
    양수값: 새로운 주제를 더 많이 다루도록 유도
    음수값: 같은 주제에 더 집중
    0.6은 새로운 주제를 적당히 섞어서 다루도록 설정됨
    현재 설정은 다음과 같은 특징의 응답을 생성합니다:

현재 설정
    매우 일관되고 안정적인 응답 (temperature = 0)
    중간 길이의 답변 (max_tokens = 500)
    모든 가능성을 고려 (top_p = 1)
    약간의 반복 방지 (frequency_penalty = 0.2)
    적당한 주제 다양성 (presence_penalty = 0.6)
이 설정을 수정하면 다음과 같은 효과를 얻을 수 있습니다:

// 더 창의적인 응답을 원할 경우
"temperature": 0.8,

// 더 긴 응답을 원할 경우
    "max_tokens": 1000,

// 더 집중된 응답을 원할 경우
    "top_p": 0.5,

// 반복을 더 강하게 방지하고 싶을 경우
    "frequency_penalty": 0.8,

*/