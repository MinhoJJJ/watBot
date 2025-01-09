function getWeatherFromNaver(msg){
    let retMsg = '';

    let text="";         // 채팅 내용

    text=msg.substr(4);   // 명령어 자르고 내용만 담는다.


    try{
        var data = org.jsoup.Jsoup.connect("https://m.search.naver.com/search.naver?&query=" + text+"날씨").get();

        let feeling = '';         // 체감온도
        let humidity = '';        // 강수
        let wind = '';            // 습도
        let precipitation = '';   // 바람방향

        let fineDust = '';        // 미세먼지
        let ultraFineDust = '';   // 초 미세먼지
        let uvRays = '';          // 자외선
        let sunset = '';          // 일몰
        let today = '';
        let isOverseas ='N';
        let nowWeather =''         // 현재 날씨

        let temperature_info;             // 날씨 정보

        // 검색 지역
        let geo = data.select(".top_wrap").select(".select_txt").text();
        ///////////////////////////////////////////
        // 오늘 정보
        ///////////////////////////////////////////
        let todayWeatherInfo = data.select(".weather_info")[0];

        today = todayWeatherInfo.select("._today");
        if(today.length == 0 ){
            today=todayWeatherInfo.select("._today_weather");
            isOverseas="Y";
        }
        nowWeather=todayWeatherInfo.select(".weather_main").text();

        // 오늘 기온
        let today_temp = today.select(".temperature_text strong").text().slice(5);
        // 어제와 기온 차이
        let diff_temp = todayWeatherInfo.select(".temperature_info .temperature").text();
        // 오늘 오전 강수 확률
        let todayRaining1 = data.select(".list_box").select("li.week_item")[0].select("span.weather_inner").get(0).select(".rainfall").text();
        // 오늘 오후 강수 확률
        let todayRaining2 = data.select(".list_box").select("li.week_item")[0].select("span.weather_inner").get(1).select(".rainfall").text();


        // 날씨정보들 (국내)
        if(isOverseas =="N") {
            temperature_info = todayWeatherInfo.select(".temperature_info .sort");

            for (var i = 0; i < temperature_info.length; i++) {
                if (temperature_info[i].select(".term").text().trim().indexOf('체감') > -1) {
                    // 체감온도
                    feeling = temperature_info[i].select(".desc").text().trim();
                }
                if (temperature_info[i].select(".term").text().trim().indexOf('강수') > -1) {
                    // 강수
                    precipitation = temperature_info[i].select(".desc").text().trim();
                }
                if (temperature_info[i].select(".term").text().trim().indexOf('습도') > -1) {
                    // 습도
                    humidity = temperature_info[i].select(".desc").text().trim();
                }
                if (temperature_info[i].select(".term").text().trim().indexOf('풍') > -1) {
                    // 남동풍
                    wind = temperature_info[i].select(".desc").text().trim();
                }
            }

        // 날씨정보들 (해외)
        }else{
            temperature_info = todayWeatherInfo.select(".temperature_info .summary_list");

            for (var i = 0; i < temperature_info.length; i++) {
                feeling = today.select(".temperature_text").select(".summary .text em").text().trim();

                if (temperature_info[i].select(".term").text().trim().indexOf('강수') > -1) {
                    // 강수
                    precipitation = temperature_info[i].select(".desc").text().trim().split(" ")[0];
                }
                if (temperature_info[i].select(".term").text().trim().indexOf('습도') > -1) {
                    // 습도
                    humidity = temperature_info[i].select(".desc").text().trim().split(" ")[1];
                }
                if (temperature_info[i].select(".term").text().trim().indexOf('풍') > -1) {
                    // 남동풍
                    wind = temperature_info[i].select(".desc").text().trim().split(" ")[2];
                }
            }
        }

        // 오늘 리포트 카드
        let todayReports = todayWeatherInfo.select(".report_card_wrap").select("li.item_today");
        if (todayReports) {
            for (var i = 0; i < todayReports.length; i++) {
                if (todayReports[i].select(".title").text().trim() == '미세먼지') {
                    // 미세먼지
                    fineDust = todayReports[i].select(".txt").text().trim();
                }
                if (todayReports[i].select(".title").text().trim().indexOf('초미세먼지') > -1) {
                    // 초미세먼지
                    ultraFineDust = todayReports[i].select(".txt").text().trim();
                }
                if (todayReports[i].select(".title").text().trim().indexOf('자외선') > -1) {
                    // 자외선
                    uvRays = todayReports[i].select(".txt").text().trim();
                }
                if (todayReports[i].select(".title").text().trim().indexOf('일몰') > -1) {
                    // 일몰
                    sunset = todayReports[i].select(".txt").text().trim();
                }
            }
        }

        ///////////////////////////////////////////
        // 내일 정보
        ///////////////////////////////////////////
        let tomorrow = data.select(".weather_info")[1];
        if (tomorrow) {
            // 내일 오전 기온
            let tomorrowTemp_AM = tomorrow.select(".temperature_text").get(0).text().replace("예측 온도", "");
            // 내일 오후 기온
            let tomorrowTemp_PM = tomorrow.select(".temperature_text").get(1).text().replace("예측 온도", "");
            // 내일 오전 간략
            let tomorrowSummary_AM = tomorrow.select(".temperature_info").get(0).select(".summary").text();
            // 내일 오전 강수 확률
            let tomorrowRaining_AM = tomorrow.select(".temperature_info").get(0).select(".desc").text();
            // 내일 오후 간략
            let tomorrowSummary_PM = tomorrow.select(".temperature_info").get(1).select(".summary").text();
            // 내일 오후 강수 확률
            let tomorrowRaining_PM = tomorrow.select(".temperature_info").get(1).select(".desc").text();
            // 내일 오전 미세먼지
            let tomorrowFineDust_AM = tomorrow.select(".report_card_wrap").get(0).select("li.item_today").get(0).select(".txt").text();
            // 내일 오전 초 미세먼지
            let tomorrowUltraFineDust_AM = tomorrow.select(".report_card_wrap").get(0).select("li.item_today").get(1).select(".txt").text();
            // 내일 오후 미세먼지
            let tomorrowFineDust_PM = tomorrow.select(".report_card_wrap").get(1).select("li.item_today").get(0).select(".txt").text();
            // 내일 오후 초 미세먼지
            let tomorrowUltraFineDust_PM = tomorrow.select(".report_card_wrap").get(1).select("li.item_today").get(1).select(".txt").text();
        }


        retMsg += "━━━━━━━━━━━━━━\n  ";
        retMsg += "오늘 " + geo + " 날씨";
        retMsg += "\n━━━━━━━━━━━━━━";
        retMsg += "\n날씨 : " + nowWeather;
        if(isOverseas =="N"){
            retMsg += "\n온도 : " + today_temp + " (어제보다 " + diff_temp + ")";
        }else{
            retMsg += "\n온도 : " + today_temp;
        }
        retMsg += "\n강수확률 (오전/오후) : " + todayRaining1 + "/" + todayRaining2;
        if (precipitation != '') {
            retMsg += "\n강수량 : " + precipitation;
        }
        if (feeling != '') {
            retMsg += "\n체감온도 : " + feeling;
        }
        if (humidity != '') {
            retMsg += "\n습도 : " + humidity;
        }
        if (wind != '') {
            retMsg += "\n풍속 : " + wind;
        }
        if (fineDust != '') {
            retMsg += "\n미세먼지 : " + fineDust;
        }
        if (ultraFineDust != '') {
            retMsg += "\n초미세먼지 : " + ultraFineDust;
        }
        if (uvRays != '') {
            retMsg += "\n자외선 : " + uvRays;
        }
        if (sunset != '') {
            retMsg += "\n일몰 : " + sunset;
        }
        // retMsg += "\n\n━━━━━━━━━━━━━━\n  ";
        // retMsg += "내일 " + geo + " 날씨 예상";
        // retMsg += "\n━━━━━━━━━━━━━━";
        // retMsg += "\n - 오전";
        // retMsg += "\n  - " + tomorrowSummary_AM;
        // retMsg += "\n  - 온도 : " + tomorrowTemp_AM;
        // retMsg += "\n  - 강수확률 : " + tomorrowRaining_AM;
        // retMsg += "\n  - 미세먼지 : " + tomorrowFineDust_AM;
        // retMsg += "\n  - 초미세먼지 : " + tomorrowUltraFineDust_AM;
        // retMsg += "\n - 오후";
        // retMsg += "\n  - " + tomorrowSummary_PM;
        // retMsg += "\n  - 온도 : " + tomorrowTemp_PM;
        // retMsg += "\n  - 강수확률 : " + tomorrowRaining_PM;
        // retMsg += "\n  - 미세먼지 : " + tomorrowFineDust_PM;
        // retMsg += "\n  - 초미세먼지 : " + tomorrowUltraFineDust_PM;
        // retMsg += "\n\nBy Naver";
    }catch(e){
        retMsg = "날씨 정보를 가져오지 못했어요. 도시명: "+text +"\n오류내용: "+e;
        Log.e(e);
    }
    return retMsg;
}

exports.getWeatherFromNaver = getWeatherFromNaver;
