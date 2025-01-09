/*
카카오맵에서 버스 위치 뜯어오기
© 2022 Dark Tornado, All rights reserved.
라이선스 : CCL BY-NC 4.0 (저작자 표시 필수, 비영리 사용만 허용)
*/


// 버스 데이터 가져오기
function getBusInfo(msg){

    let busId=getBusId(msg.substr(3));
    let busNm=msg.substr(3);

    const url = 'https://m.map.kakao.com/actions/busDetailInfo?busId=' + busId + '&q=' + busNm;
    let data = Utils.parse(url);
    let data2 = Utils.parse(url);
    let data3 = Utils.parse(url);
    let datum;
    let nowBusStop;
    let cnt=0;
    let nCnt=0;

    let returnBusStop="";
    let lastBusStop="";

    // 실시간 버스위치
    data = data.select('ul.list_situation').select('span.screen_out');

    // 버스 회차 여부
    data2 = data2.select('ul.list_route').select('li.turning_busstop').select('strong.tit_route');
    data3 = data3.select('ul.list_route').select('strong.tit_route');

    if(data2.size()!=0){
        returnBusStop=data2.text().trim();
    }

    if(data3.size()!=0){
        lastBusStop=data3.get(data3.size()-1).text().trim();
    }

    let result="";

    if(data3.size()!=0){
        for (let n = 0; n < data3.size(); n++) {
            if(cnt<(data.size())){
                datum = data.get(cnt).text().split(':');
                nowBusStop=datum[1].split(', ')[0].trim();
            }

            let busStop= data3.get(n).text().trim();

            if(nowBusStop==busStop){
                if(cnt==0){
                    if(returnBusStop!=""){
                        result += "[버스 정보: "+busNm +" ]\n\n";
                        result += "┌[버스 방향: "+returnBusStop +" ]\n";

                    }else{
                        result += "[버스 정보: "+busNm +" ]\n\n";
                        result += "┌[버스 방향: "+lastBusStop +" ]\n";
                    }
                    result +="│ "+nowBusStop + '\n';

                }else if(cnt==(data.size()-1)){
                    result += "│ "+nowBusStop +'\n';
                }else{
                    result += "│ "+nowBusStop +'\n';
                }
                cnt++;
            }
            if(returnBusStop!=""&&returnBusStop==busStop&&nCnt==0){
                result += "\n┌[버스 방향: "+lastBusStop +" ]\n";
                nCnt++;
            }
        }

        // for (let n = 0; n < data3.size(); n++) {
        //     let datum = data.get(n).text().split(':');
        //     let busStop=datum[1].split(', ')[0].trim();
        //
        //     if(n==0){
        //         result += "[버스 정보: "+busNm +" ]\n\n"+"┌ "+busStop + '\n';
        //     }else if(n==(data.size()-1)){
        //         result += "└ "+busStop +'\n';
        //     }else{
        //         result += "│ "+busStop +'\n';
        //     }
        // }

        return result;
    }else{
        return "[버스 정보: "+busNm +" ]\n"+"찾으시는 버스 정보가 없습니다."

    }
}

// 버스 아이디 가져오기
function getBusId(bus) {
    const url = 'https://m.map.kakao.com/actions/searchView?q=' + encodeURI(bus + ' 버스');
    const data = Utils.parse(url);
    const busId = data.select('div.search_result_bus_body').select('li').attr('data-id');
    return busId;
}

// export 데이터
exports.getBusInfo = getBusInfo;

