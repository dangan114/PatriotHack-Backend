function getMessage(paymentList, currentLimit, maxLimit) {
    let currentSum = paymentList.map(e => e.paymentAmount).reduce((a,b) => a + b, 0)
    currentSum = parseFloat(currentSum) + parseFloat(currentLimit)
    let rate = (currentSum / maxLimit).toFixed(2)
    let message = ''
    let status = 0

    if (rate < 0.3) {
        status = 5
        message = '*****You are good*****' 
    }
    else if (rate < 0.5) {
        status = 4
        message = '****You are okay****'
    }
    else if (rate < 0.7) {
        status = 3
        message = '***You are approaching the danger zone***'
    }
    else if (rate < 1) {
        status = 2
        message = '**You are hiting the limit**'
    }
    else {
        status = 1
        message = '*You are in debt*'
    }

    return {
        status,
        message
    }
}

export default getMessage;
