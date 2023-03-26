function getDateRange(lastCycleDate, createdAt, currentLimit) {
    let currentDate = new Date()
    let year = currentDate.getFullYear()
    let searchMonth = currentDate.getDate() < (new Date(lastCycleDate)).getDate() ? currentDate.getMonth() - 1 : currentDate.getMonth() 
    let limit = (new Date(createdAt)).getMonth() == searchMonth ? currentLimit : 0
    return {
        limit: limit,
        minDate: (new Date(year, searchMonth, (new Date(lastCycleDate).getDate()))),
        maxDate: (new Date(year, searchMonth + 1, (new Date(lastCycleDate).getDate())))
    }
}

export default getDateRange;

