const SPECIAL_DAY = ["1-1", "20-1", "14-2", "8-3", "30-4", "1-5", "1-6", "2-9", "29-9", "20-10", "20-11", "25-12"]
const DAY_ENUM = require('../enums/PriceDayEnum')
const convertDepartureDateToDayForPrices = (departureDate) => {
    let day = DAY_ENUM.NORMAL

    const tourDepartureDate = new Date(departureDate)
    const dayOfWeek = tourDepartureDate.getDay()
    // 0 = Sunday & 6 = Saturday
    if (dayOfWeek === 0 || dayOfWeek === 6) {
        day = DAY_ENUM.WEEKEND
    }

    //Check if date is in SPECIAL_DAY array
    const date = tourDepartureDate.getDate()
    const month = tourDepartureDate.getMonth()
    const dateMonth = `${date}-${month}`
    if (SPECIAL_DAY.includes(dateMonth)) {
        day = DAY_ENUM.HOLIDAY
    }

    return day
}

module.exports = {convertDepartureDateToDayForPrices}