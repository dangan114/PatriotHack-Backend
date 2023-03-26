import express from 'express'
import cors from 'cors'
import db from './services/db.js'
import dotenv from 'dotenv'
import twilio from 'twilio'
import getMessage from './services/message.js'
import getDateRange from './services/dateRange.js'

const app = express()
const port = 3000

if (process.env.NODE_ENV !== 'production') {
    dotenv.config();
}

app.use(cors())

app.use(express.json())

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get('/user/:phone', async (req, res) => {
    const { phone } = req.params;
    let collection = db.collection('users')
    let results = null;

    try {
        results = await collection.findOne({ phone: phone });
    } catch (e) {
        res.send({
            status: 0,
            message: 'error with the server',
        }).status(502)
    }
    
    if (results) {
        res.send({
            status: 0,
            message: 'Result Found!',
            payload: results
        }).status(200)
    }
    else {
        res.send({
            status: 0,
            message: 'Result not Found!',
        }).status(200)
    }
    
})

app.post('/setup', async (req, res) => {
    const { currentLimit, maxLimit, phone, cycleStartDate } = req.body;
    let collection = db.collection("users");
    let count = await collection.countDocuments({ phone: phone }, { limit: 1 })
 
    if (!count) {
        let newDocument = {
            phone,
            currentLimit,
            maxLimit,
            cycleStartDate,
            paymentList: []
        }
        newDocument.createdAt = new Date();
        let result = await collection.insertOne(newDocument);
        res.send({
            status: 0,
            message: 'Phone Number Registered Successfully',
            result: result
        }).status(200);
    }
    else {
        res.send({
            status: 1,
            message: 'Phone number already exists'
        }).status(200)
    }
})

app.post('/sms', async (req, res) => {
    const { phone, maxLimit, currentLimit, paymentList, cycleStartDate, createdAt } = req.body;
    const client = twilio(process.env.TWILIO_ACCOUNT_ID, process.env.TWILIO_AUTH_TOKEN);
    
    let { limit, minDate, maxDate } = getDateRange(cycleStartDate, createdAt, currentLimit)
    let resultList = paymentList.filter(e => (new Date(e.paymentDate) > minDate && (new Date(e.paymentDate) < maxDate)))
    let { status, message } = getMessage(resultList, limit, maxLimit)

    const query = { phone: phone }
    const updates = {
        $set: { 
            paymentList: paymentList,
            currentLimit: limit
        }
    }

    let collection = db.collection("users");
   
    console.log(paymentList)
    
    let result = null;
    try {
        result = await collection.updateOne(query, updates)
    } catch (e) {
        res.status(502)
    }


    client.messages
      .create({body: message, from: '+15005550006', to: '+1' + phone })
      .then(message => res.send({
        status: status,
        message: message.body
      }).status(200))
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})