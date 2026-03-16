// 명령어 가이드북
function getCommandData(msg){

    let result="";
    result +="입력한 명령어: "+msg+"\n"
    
    if(msg.startsWith(".명령어")){
        result+= "[사용 가능한 명령어]\n\n";
    }else{
        result+= "잘못된 명령어입니다.\n\n";
        result+= "[사용 가능한 명령어]\n";
    }

    result+= "[.챗] : 챗지피티\n";
    result+= "[.사주 YYYYMMDD] : 사주 분석\n";
    result+= "[.오늘의사주 YYYYMMDD] : 오늘의 운세 분석\n";
    result+= "[.번역] : 일본어 번역\n";
    result+= "[.84] : 한국어 번역\n";
    result+= "[.간사이] : +1시간 난카이 스케줄\n";
    result+= "[.나리타] : +1시간 스카이라이너 스케줄\n";
    result+= "[.환율] : 실시간 환율데이터\n";
    result+= "[.역] : 실시간 한국 역 정보\n";
    result+= "[.버스 ex) 541] : 실시간 버스 정보\n";
    result+= "[.아동 (부모급여,첫만남이용권,아동수당,임신바우처,출산지원금)] : 아동, 출산관련 정보\n";
    result+= "[.지우개 ] : 지우개\n";
    result+= "[.날씨 지역이름] : 오늘 날씨정보를 보여줌\n";
    result+= "[.환전 JPY 1000] : 1000원을 해당 국가 환율로 변경\n";
    result+= "[.화폐코드] : 화폐코드를 보여줌\n";
    result+= "[.채팅랭킹] : 금일 채팅 랭킹 1~20위를 보여줌\n";
    //     "미국 달러: USD\n" +
    //     "유로: EUR\n" +
    //     "파운드스털링: GBP\n" +
    //     "엔: JPY\n" +
    //     "바트: THB\n" +
    //     "싱가포르 달러: SGD\n" +
    //     "러시아 루블: RUB\n" +
    //     "홍콩 달러: HKD\n" +
    //     "캐나다 달러: CAD\n" +
    //     "오스트레일리아 달러: AUD\n";
    // //result+="[.(승겡,나폴,왓)] : 방장 소환\n";


    return result;
}

// 명령어 가이드북
function getComeMaster(msg){

    let result;

    if(msg.startsWith(".왓")){
        result= "@WAT/한국/부부/🇰🇷";
    }else if(msg.startsWith(".나폴")){
        result= "@치즈나폴리탄/바다/부부/🇰🇷";
    }else if(msg.startsWith(".승겡")){
        result= "@승겡/용산/부부/🇰🇷";
    }else if(msg.startsWith(".지우개")){
        result= "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@";

    }

    return result;
}


// export 데이터
exports.getCommandData = getCommandData;
exports.getComeMaster = getComeMaster;

