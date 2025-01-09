// 환율 가져오기기
function getRate(apiKey){
    
    let result="";

    result+="[환율정보 "+new Date().toLocaleDateString()+"]\n\n";   // 오늘 날짜


    // AJAX 요청
    const response = org.jsoup.Jsoup.connect("https://www.koreaexim.go.kr/site/program/financial/exchangeJSON?authkey="+apiKey+"&data=AP01")
        .ignoreContentType(true)
        .ignoreHttpErrors(true)
        .get();

    const jsonData =JSON.parse(response.text());


    for(let i = 0; i < jsonData.length; i++) {
        if(jsonData[i].cur_nm.startsWith("일본")){
            result+="[★일본 엔: "+jsonData[i].kftc_bkpr+"★]\n";
        }
        if(!jsonData[i].cur_nm.startsWith("한국")&&!jsonData[i].cur_nm.startsWith("일본")){
            result+="["+jsonData[i].cur_nm+": "+jsonData[i].kftc_bkpr+"]\n";
        }
    }

    return result;
}

function getChangMoney(msg){

    let result="";
    let conutryCode=msg.split(" ")[1].toUpperCase();    // 화폐 코드
    let money=msg.split(" ")[2];                               // 원화 금액

    try {

        result += "[환전정보 " + new Date().toLocaleDateString() + "]\n";
        result += "[환전 화폐 코드: " + conutryCode + "]\n\n";

        // 환전하기
        const response1 = org.jsoup.Jsoup.connect("https://m.search.naver.com/p/csearch/content/qapirender.nhn?key=calculator&pkid=141&q=%ED%99%98%EC%9C%A8&where=m&u1=keb&u6=standardUnit&u7=0&u3=KRW&u4=" + conutryCode + "&u8=down&u2=" + money)
            .ignoreContentType(true)
            .ignoreHttpErrors(true)
            .get();

        // 환율 비율 계산
        const response2 = org.jsoup.Jsoup.connect("https://m.search.naver.com/p/csearch/content/qapirender.nhn?key=calculator&pkid=141&q=%ED%99%98%EC%9C%A8&where=m&u1=keb&u6=standardUnit&u7=0&u3=KRW&u4=" + conutryCode + "&u8=down&u2=100")
            .ignoreContentType(true)
            .ignoreHttpErrors(true)
            .get();


        // 환전 데이터
        const jsonData1 = JSON.parse(response1.text());
        
        // 환율 계산데이터
        const jsonData2 = JSON.parse(response2.text());

        // 환율 계산할 금액
        let changedMoney = jsonData2.country[1].value;

        // 환율 비율 계산
        let exchangeRate = (100 / changedMoney).toFixed(2);

        // 일본,베트남 원환율 비율 계산
        let ratePer100 = ((100 / changedMoney)*100).toFixed(2);

        if (jsonData1 != null) {
            result += "[입력 금액: " + jsonData1.country[0].subValue + " ]\n";
            result += "[환전된 금액: " + jsonData1.country[1].subValue + " ]\n";
            if(conutryCode=="JPY" || conutryCode=="VND" || conutryCode=="jpy" || conutryCode=="vnd"){
                result += "[사용된 환율: " + ratePer100 + " ]\n";
            }else{
                result += "[사용된 환율: " + exchangeRate + " ]\n";
            }

        }

    }catch(e){
        result += "오류가 발생했습니다.\n 오류코드: "+e;
    }

    return result;
}


// export 데이터
exports.getRate = getRate;
exports.getChangMoney = getChangMoney;

