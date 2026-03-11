// 기존 하드코딩 데이터 (비상용 폴백)
const kansai_rapit_times = ['6:53', '7:30', '7:58', '8:35', '9:03', '9:34', '10:05', '10:36', '11:05', '11:35', '12:05', '12:35', '13:05', '13:35', '14:05', '14:35', '15:05', '15:35', '16:05', '16:35', '17:05', '17:35', '18:05', '18:36', '19:05', '19:36', '20:05', '20:36', '21:06', '21:35', '22:01', '22:35', '23:00'];
const kansai_times = ['5:45', '6:14', '6:37', '6:53', '6:57', '7:11', '7:24', '7:30', '7:47', '7:58', '8:02', '8:20', '8:27', '8:35', '8:43', '8:54', '9:03', '9:14', '9:27', '9:34', '9:44', '9:56', '10:05', '10:12', '10:26', '10:36', '10:39', '10:56', '11:05', '11:10', '11:26', '11:35', '11:39', '11:56', '12:05', '12:09', '12:26', '12:35', '12:39', '12:56', '13:05', '13:09', '13:26', '13:35', '13:39', '13:56', '14:05', '14:09', '14:26', '14:35', '14:39', '14:56', '15:05', '15:09', '15:26', '15:35', '15:39', '15:56', '16:05', '16:09', '16:26', '16:35', '16:39', '16:56', '17:05', '17:13', '17:27', '17:35', '17:39', '17:54', '18:05', '18:14', '18:36', '18:44', '18:55', '19:05', '19:22', '19:36', '19:43', '19:54', '20:05', '20:14', '20:26', '20:36', '20:43', '21:06', '21:14', '21:28', '21:35', '21:44', '21:54', '22:01', '22:13', '22:25', '22:35', '22:48', '23:00', '23:20', '23:55'];
const week_kansai_rapit_times = ['7:06', '7:31', '8:04', '8:35', '9:05', '9:35', '10:05', '10:35', '11:05', '11:35', '12:05', '12:35', '13:05', '13:35', '14:05', '14:35', '15:05', '15:35', '16:05', '16:35', '17:05', '17:35', '18:04', '18:34', '19:04', '19:35', '20:05', '20:35', '21:05', '21:34', '22:05', '22:32', '22:55'];
const week_kansai_times = ['5:47', '6:14', '6:44', '7:15', '7:38', '7:53', '8:22', '8:41', '8:54', '9:13', '9:43', '10:11', '10:24', '10:39', '10:53', '11:10', '11:26', '11:39', '11:56', '12:09', '12:26', '12:39', '12:56', '13:09', '13:26', '13:39', '13:56', '14:09', '14:26', '14:39', '14:56', '15:09', '15:26', '15:39', '15:56', '16:09', '16:26', '16:39', '16:56', '17:09', '17:27', '17:39', '17:56', '18:09', '18:26', '18:39', '18:56', '19:09', '19:26', '19:39', '19:56', '20:09', '20:26', '20:39', '20:56', '21:09', '21:27', '21:39', '21:56', '22:09', '22:23', '22:35', '23:00', '23:18', '23:55'];
const narita_times = ['7:23', '8:12', '9:07', '9:36', '9:53', '10:19', '10:33', '10:59', '11:13', '11:39', '11:59', '12:13', '12:39', '12:59', '13:13', '13:39', '13:59', '14:13', '14:39', '14:59', '15:13', '15:39', '15:59', '16:13', '16:39', '16:59', '17:19', '17:39', '17:59', '18:15', '18:40', '19:00', '19:20', '19:40', '20:00', '20:30', '21:00', '21:20', '21:40', '22:00', '22:20', '22:40', '23:00'];
const week_narita_times = ['7:30', '8:29', '9:19', '9:39', '9:53', '10:16', '10:33', '10:59', '11:13', '11:39', '11:59', '12:13', '12:39', '12:59', '13:13', '13:39', '13:59', '14:13', '14:39', '14:59', '15:13', '15:39', '15:59', '16:13', '16:39', '16:58', '17:15', '17:39', '17:59', '18:15', '18:39', '18:59', '19:19', '19:39', '20:00', '20:30', '21:00', '21:20', '21:40', '22:00', '22:20', '22:40', '23:00'];

/**
 * 난카이 전철 실시간 시간표 크롤링 (HTML 구조 반영)
 */
function fetchNankaiLiveTimetable(isWeekday) {
    try {
        var url = "https://www.nankai.co.jp/kr_railway/access-timetable";
        var doc = org.jsoup.Jsoup.connect(url).get();
        var tables = doc.select("table");
        
        if (tables.size() < 4) return { error: "테이블 구조를 읽을 수 없습니다." };

        // 데이터 분류 함수 (내부용)
        var parseTable = function(table) {
            var rapit = [];
            var express = [];
            var rows = table.select("tbody tr");
            for (var i = 0; i < rows.size(); i++) {
                var row = rows.get(i);
                var type = row.select("th").text(); // th에 열차 종류가 있음
                var time = row.select("td").first().text().trim(); // 첫 번째 td에 출발 시간이 있음
                
                if (time.match(/\d{1,2}:\d{2}/)) {
                    if (type.indexOf("라피트") !== -1) rapit.push(time);
                    else if (type.indexOf("급행") !== -1) express.push(time);
                }
            }
            return { rapit: rapit, express: express };
        };

        // 0:공항발(평), 1:공항발(주), 2:난바발(평), 3:난바발(주)
        var upIndex = isWeekday ? 0 : 1;
        var downIndex = isWeekday ? 2 : 3;

        return {
            up: parseTable(tables.get(upIndex)),
            down: parseTable(tables.get(downIndex))
        };
    } catch (e) {
        return { error: e.message };
    }
}

// 공항 전철 시간표 메인 함수
function getUpcomingTrains(msg) {
    let area;
    if(msg.startsWith(".간사이")) area="kansai";
    else if(msg.startsWith(".나리타")) area="narita";

    const currentTime = new Date();
    const now = currentTime.getHours().toString().padStart(2, '0') + ':' + currentTime.getMinutes().toString().padStart(2, '0');
    const oneHourLater = new Date(currentTime.getTime() + 60 * 60 * 1000);
    const maxTime = oneHourLater.getHours().toString().padStart(2, '0') + ':' + oneHourLater.getMinutes().toString().padStart(2, '0');

    const day = currentTime.getDay();
    const isWeekday = day !== 0 && day !== 6;
    const typeStr = isWeekday ? "평일" : "주말/공휴일";

    if (area == "kansai") {
        var liveData = fetchNankaiLiveTimetable(isWeekday);
        
        var result = "";
        if (liveData && !liveData.error) {
            result += "[실시간 데이터]\n[난카이선 " + typeStr + "] 현재: " + now + "\n";
            
            // 상행 (공항 -> 난바)
            result += "\n✈️ 간사이공항 -> 난바\n";
            let uExp = liveData.up.express.filter(time => time >= now && time <= maxTime);
            let uRap = liveData.up.rapit.filter(time => time >= now && time <= maxTime);
            result += "- 공항급행: " + (uExp.length > 0 ? uExp.join(", ") : "없음") + "\n";
            result += "- 라피트: " + (uRap.length > 0 ? uRap.join(", ") : "없음") + "\n";

            // 하행 (난바 -> 공항)
            result += "\n🏠 난바 -> 간사이공항\n";
            let dExp = liveData.down.express.filter(time => time >= now && time <= maxTime);
            let dRap = liveData.down.rapit.filter(time => time >= now && time <= maxTime);
            result += "- 공항급행: " + (dExp.length > 0 ? dExp.join(", ") : "없음") + "\n";
            result += "- 라피트: " + (dRap.length > 0 ? dRap.join(", ") : "없음");
        } else {
            // 실패 시 기존 DB 데이터 (상행 기준)
            let errorMsg = liveData ? liveData.error : "데이터 없음";
            let hNomal = isWeekday ? kansai_times : week_kansai_times;
            let hExpress = isWeekday ? kansai_rapit_times : week_kansai_rapit_times;
            let uExp = hNomal.filter(time => time >= now && time <= maxTime);
            let uRap = hExpress.filter(time => time >= now && time <= maxTime);
            
            result = "[기존 DB 데이터]\n⚠️ 실시간 로드 실패 (사유: " + errorMsg + ")\n\n" +
                     "✈️ 간사이공항 -> 난바\n" +
                     "- 공항급행: " + (uExp.length > 0 ? uExp.join(", ") : "없음") + "\n" +
                     "- 라피트: " + (uRap.length > 0 ? uRap.join(", ") : "없음");
        }
        return result;

    } else if (area == "narita") {
        let hNomal = isWeekday ? narita_times : week_narita_times;
        let uExp = hNomal.filter(time => time >= now && time <= maxTime);
        return "[기존 DB 데이터]\n[나리타공항 " + typeStr + "] 현재: " + now + "\n\n" +
               "✈️ 나리타 -> 도쿄\n" +
               "- 스카이라이너: " + (uExp.length > 0 ? uExp.join(", ") : "없음");
    }

    return "❌ 정보를 불러올 수 없습니다.";
}

exports.getUpcomingTrains = getUpcomingTrains;
