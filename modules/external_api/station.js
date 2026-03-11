// 기존 하드코딩 데이터 (비상용 폴백)
const kansai_rapit_times = ['6:53', '7:30', '7:58', '8:35', '9:03', '9:34', '10:05', '10:36', '11:05', '11:35', '12:05', '12:35', '13:05', '13:35', '14:05', '14:35', '15:05', '15:35', '16:05', '16:35', '17:05', '17:35', '18:05', '18:36', '19:05', '19:36', '20:05', '20:36', '21:06', '21:35', '22:01', '22:35', '23:00'];
const kansai_times = ['5:45', '6:14', '6:37', '6:53', '6:57', '7:11', '7:24', '7:30', '7:47', '7:58', '8:02', '8:20', '8:27', '8:35', '8:43', '8:54', '9:03', '9:14', '9:27', '9:34', '9:44', '9:56', '10:05', '10:12', '10:26', '10:36', '10:39', '10:56', '11:05', '11:10', '11:26', '11:35', '11:39', '11:56', '12:05', '12:09', '12:26', '12:35', '12:39', '12:56', '13:05', '13:09', '13:26', '13:35', '13:39', '13:56', '14:05', '14:09', '14:26', '14:35', '14:39', '14:56', '15:05', '15:09', '15:26', '15:35', '15:39', '15:56', '16:05', '16:09', '16:26', '16:35', '16:39', '16:56', '17:05', '17:13', '17:27', '17:35', '17:39', '17:54', '18:05', '18:14', '18:36', '18:44', '18:55', '19:05', '19:22', '19:36', '19:43', '19:54', '20:05', '20:14', '20:26', '20:36', '20:43', '21:06', '21:14', '21:28', '21:35', '21:44', '21:54', '22:01', '22:13', '22:25', '22:35', '22:48', '23:00', '23:20', '23:55'];
const week_kansai_rapit_times = ['7:06', '7:31', '8:04', '8:35', '9:05', '9:35', '10:05', '10:35', '11:05', '11:35', '12:05', '12:35', '13:05', '13:35', '14:05', '14:35', '15:05', '15:35', '16:05', '16:35', '17:05', '17:35', '18:04', '18:34', '19:04', '19:35', '20:05', '20:35', '21:05', '21:34', '22:05', '22:32', '22:55'];
const week_kansai_times = ['5:47', '6:14', '6:44', '7:15', '7:38', '7:53', '8:22', '8:41', '8:54', '9:13', '9:43', '10:11', '10:24', '10:39', '10:53', '11:10', '11:26', '11:39', '11:56', '12:09', '12:26', '12:39', '12:56', '13:09', '13:26', '13:39', '13:56', '14:09', '14:26', '14:39', '14:56', '15:09', '15:26', '15:39', '15:56', '16:09', '16:26', '16:39', '16:56', '17:09', '17:27', '17:39', '17:56', '18:09', '18:26', '18:39', '18:56', '19:09', '19:26', '19:39', '19:56', '20:09', '20:26', '20:39', '20:56', '21:09', '21:27', '21:39', '21:56', '22:09', '22:23', '22:35', '23:00', '23:18', '23:55'];

/**
 * 시간을 분 단위로 변환 (비교용)
 */
function timeToMin(timeStr) {
    if (!timeStr || timeStr === "-") return 9999;
    var parts = timeStr.split(':');
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
}

/**
 * 난카이 전철 실시간 시간표 크롤링
 */
function fetchNankaiLiveTimetable(isWeekday) {
    try {
        var url = "https://www.nankai.co.jp/kr_railway/access-timetable";
        var doc = org.jsoup.Jsoup.connect(url).get();
        var tables = doc.select("table");
        if (tables.size() < 4) return { error: "테이블 구조를 읽을 수 없습니다." };

        var parseTable = function(table) {
            var rapit = [];
            var express = [];
            var rows = table.select("tbody tr");
            for (var i = 0; i < rows.size(); i++) {
                var row = rows.get(i);
                var type = row.select("th").text();
                var time = row.select("td").first().text().trim();
                if (time.match(/\d{1,2}:\d{2}/)) {
                    if (type.indexOf("라피트") !== -1) rapit.push(time);
                    else if (type.indexOf("급행") !== -1) express.push(time);
                }
            }
            return { rapit: rapit, express: express };
        };

        var upIndex = isWeekday ? 0 : 1;
        var downIndex = isWeekday ? 2 : 3;

        return { up: parseTable(tables.get(upIndex)), down: parseTable(tables.get(downIndex)) };
    } catch (e) {
        return { error: e.message };
    }
}

/**
 * 게이세이 스카이라이너 실시간 시간표 크롤링 (상세 역 포함)
 */
function fetchNaritaLiveTimetable(isWeekday) {
    try {
        var url = "https://www.keisei.co.jp/keisei/tetudou/skyliner/kr/traffic/skyliner.php";
        var doc = org.jsoup.Jsoup.connect(url).get();
        
        // 상행(공항->시내) 파싱
        var parseUp = function(tableIdx) {
            var results = [];
            var table = doc.select("div.timeAcdA table").get(tableIdx);
            var rows = table.select("tbody tr");
            for (var i = 0; i < rows.size(); i++) {
                var cells = rows.get(i).select("td");
                if (cells.size() >= 7) {
                    results.push({
                        t1: cells.get(1).text().trim(),
                        ueno: cells.get(6).text().trim()
                    });
                }
            }
            return results;
        };

        // 하행(시내->공항) 파싱
        var parseDown = function(tableIdx) {
            var results = [];
            var table = doc.select("div.timeAcdB table").get(tableIdx);
            var rows = table.select("tbody tr");
            for (var i = 0; i < rows.size(); i++) {
                var cells = rows.get(i).select("td");
                if (cells.size() >= 7) {
                    results.push({
                        ueno: cells.get(1).text().trim(),
                        nip: cells.get(2).text().trim(),
                        aoto: cells.get(3).text().trim(),
                        shin: cells.get(4).text().trim()
                    });
                }
            }
            return results;
        };

        var idx = isWeekday ? 0 : 1;
        return {
            up: parseUp(idx),
            down: parseDown(idx)
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
    const nowStr = currentTime.getHours().toString().padStart(2, '0') + ':' + currentTime.getMinutes().toString().padStart(2, '0');
    const nowMin = timeToMin(nowStr);
    
    const isWeekday = currentTime.getDay() !== 0 && currentTime.getDay() !== 6;
    const typeStr = isWeekday ? "평일" : "주말/공휴일";

    if (area == "kansai") {
        var liveData = fetchNankaiLiveTimetable(isWeekday);
        if (liveData && !liveData.error) {
            let result = "[실시간 데이터]\n[난카이선 " + typeStr + "] 현재: " + nowStr + "\n";
            result += "\n✈️ 간사이공항 -> 난바\n";
            let uExp = liveData.up.express.filter(t => timeToMin(t) >= nowMin).slice(0, 3);
            let uRap = liveData.up.rapit.filter(t => timeToMin(t) >= nowMin).slice(0, 3);
            result += "- 공항급행: " + (uExp.length > 0 ? uExp.join(", ") : "운행종료") + "\n";
            result += "- 라피트: " + (uRap.length > 0 ? uRap.join(", ") : "운행종료") + "\n";
            result += "\n🏠 난바 -> 간사이공항\n";
            let dExp = liveData.down.express.filter(t => timeToMin(t) >= nowMin).slice(0, 3);
            let dRap = liveData.down.rapit.filter(t => timeToMin(t) >= nowMin).slice(0, 3);
            result += "- 공항급행: " + (dExp.length > 0 ? dExp.join(", ") : "운행종료") + "\n";
            result += "- 라피트: " + (dRap.length > 0 ? dRap.join(", ") : "운행종료");
            return result;
        } else {
            return "[기존 DB 데이터]\n⚠️ 실시간 로드 실패: " + (liveData ? liveData.error : "데이터 없음");
        }
    } else if (area == "narita") {
        var liveData = fetchNaritaLiveTimetable(isWeekday);
        if (liveData && !liveData.error) {
            let result = "[실시간 데이터]\n[스카이라이너 " + typeStr + "] 현재: " + nowStr + "\n";
            
            // 상행 (공항 -> 시내)
            result += "\n✈️ 나리타공항 T1 -> 도쿄\n";
            let ups = liveData.up.filter(item => timeToMin(item.t1) >= nowMin).slice(0, 3);
            if (ups.length > 0) {
                ups.forEach(item => { result += "• " + item.t1 + " (우에노 " + item.ueno + "착)\n"; });
            } else { result += "- 운행종료\n"; }

            // 하행 (시내 -> 공항)
            result += "\n🏠 도쿄 -> 나리타공항 (출발시간)\n";
            let downs = liveData.down.filter(item => timeToMin(item.ueno) >= nowMin || timeToMin(item.nip) >= nowMin).slice(0, 3);
            if (downs.length > 0) {
                downs.forEach(item => {
                    result += "• 우에노 " + item.ueno + " / 닛포리 " + item.nip;
                    if (item.aoto !== "-") result += " / 아오토 " + item.aoto;
                    if (item.shin !== "-") result += " / 신카마가야 " + item.shin;
                    result += "\n";
                });
            } else { result += "- 운행종료"; }
            
            return result.trim();
        } else {
            return "[기존 DB 데이터]\n⚠️ 실시간 로드 실패: " + (liveData ? liveData.error : "데이터 없음");
        }
    }
    return "❌ 정보를 불러올 수 없습니다.";
}

exports.getUpcomingTrains = getUpcomingTrains;
