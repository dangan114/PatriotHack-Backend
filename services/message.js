function getMessage(paymentList, currentLimit, maxLimit) {
    let currentSum = paymentList.map(e => parseFloat(e.paymentAmount)).reduce((a,b) => a + b, 0)
    currentSum = parseFloat(currentSum) + parseFloat(currentLimit)
    let rate = (currentSum / maxLimit).toFixed(2)
    let message = ''
    let status = 0

    if (rate < 0.3) {
        status = 5
        message = 'Credit utilization less than 30%, will not lower credit score. 🙂 You are good 🙂' 
    }
    else if (rate < 0.5) {
        status = 4
        message = 'Credit utilization above 30% but below 50%, credit score might lower a bit. 🙂 You are okay 🙂'
    }
    else if (rate < 0.7) {
        status = 3
        message = 'Credit utilization above 50%, credit score will most likely lower. 🙁 You are approaching the danger zone 🙁'
    }
    else if (rate < 1) {
        status = 2
        message = 'Almost to max credit utilization, your credit score will lower. 🙁 You are hiting the limit 🙁'
    }
    else {
        status = 1
        message = 'Credit score will lower. 🙁 You are in debt 🙁'
    }

    return {
        status,
        message
    }
}

export default getMessage;
