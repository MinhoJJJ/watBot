/**
 * Gemini AI - Estate Module
 */
function handleEstate(text, allModules) {
    var result = { isEstateQuery: false, liveToolData: "" };
    if (text.indexOf("\uc2e4\uac70\ub798\uac00") !== -1 || text.indexOf("\ubd80\ub3d9\uc0b0") !== -1) {
        result.isEstateQuery = true;
        try {
            var pMatch = text.match(/(\d+)\s*\ud3c9/);
            var priceInfo = allModules.estate.getRealEstatePrice(text, pMatch ? parseInt(pMatch[1]) : 24); // estate_data -> estate
            result.liveToolData += "\u3010\ubd80\ub3d9\uc0b0 \uc2e4\uac70\ub798\uac00\u3011\n" + priceInfo + "\n\n";
        } catch (e) { result.liveToolData += "\u26a0\ufe0f \ubd80\ub3d9\uc0b0 \ub370\uc774\ud130 \uc870\ud68c \uc911 \uc624\ub958: " + e.message + "\n\n"; }
    }
    return result;
}
module.exports = { handleEstate: handleEstate };
