// 지하철역 가져오기
function getKoreaSubwayInfo(msg){
    let arriveMessage="";

    let station=msg.substr(3);
    let result="역 정보: "+station+" \n\n";


    // AJAX 요청
    let stationUrl="http://swopenAPI.seoul.go.kr/api/subway/6861724e716d656e36354f78627451/json/realtimeStationArrival/0/5/"
    stationUrl+=station;

    const response = org.jsoup.Jsoup.connect(stationUrl)
        .ignoreContentType(true)
        .ignoreHttpErrors(true)
        .get();

    const jsonData =JSON.parse(response.text());

    if(jsonData.status!='500'){
        for(let i = 0; i < jsonData.realtimeArrivalList.length; i++) {

            result+="[도착정보("+(i+1)+")]\n["+jsonData.realtimeArrivalList[i].bstatnNm.toString()+" 방향 "+jsonData.realtimeArrivalList[i].btrainSttus+" 열차]"+"\n";
            result+="실시간위치: "+jsonData.realtimeArrivalList[i].arvlMsg2+"\n";

            if(jsonData.realtimeArrivalList[i].arvlCd=='99'){
                arriveMessage="운행중";
            }else if(jsonData.realtimeArrivalList[i].arvlCd=='0'){
                arriveMessage="진입";
            }else if(jsonData.realtimeArrivalList[i].arvlCd=='1'){
                arriveMessage="";
            }else if(jsonData.realtimeArrivalList[i].arvlCd=='2'){
                arriveMessage="출발";
            }else if(jsonData.realtimeArrivalList[i].arvlCd=='3'){
                arriveMessage="전역출발";
            }else if(jsonData.realtimeArrivalList[i].arvlCd=='4'){
                arriveMessage="전역진입";
            }else if(jsonData.realtimeArrivalList[i].arvlCd=='5'){
                arriveMessage="";
            }

            if(jsonData.realtimeArrivalList[i].arvlCd=='99'|| jsonData.realtimeArrivalList[i].arvlCd=='0' || jsonData.realtimeArrivalList[i].arvlCd=='1' || jsonData.realtimeArrivalList[i].arvlCd=='2'){
                result+="실시간 역 : "+jsonData.realtimeArrivalList[i].arvlMsg3+" "+arriveMessage+"\n\n";
            }else if(jsonData.realtimeArrivalList[i].arvlCd!='5'){
                result+="실시간 역 : "+jsonData.realtimeArrivalList[i].arvlMsg3+"\n";
                result+="실시간 상태 : "+arriveMessage+"\n\n";
            }else{
                result+="실시간 역 : "+jsonData.realtimeArrivalList[i].arvlMsg3+"\n\n";
            }

        }
    }else{
        result="실시간으로 도착정보가 없는 역입니다."
    }
    return result;
}
// else if(msg.startsWith(".번역 ") && nows == '1'){
//     replier.reply("[번역] \n" + "이미 실행중에 있습니다.");
// }
exports.getKoreaSubwayInfo = getKoreaSubwayInfo;
