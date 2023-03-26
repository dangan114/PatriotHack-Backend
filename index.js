import express from 'express'
import cors from 'cors'
import db from './services/db.js'
import dotenv from 'dotenv'
import twilio from 'twilio'
import getMessage from './services/message.js'
import getDateRange from './services/dateRange.js'
import bodyParser from 'body-parser'

const app = express()
const port = 3000

if (process.env.NODE_ENV !== 'production') {
    dotenv.config();
}

const client = twilio(process.env.TWILIO_ACCOUNT_ID, process.env.TWILIO_AUTH_TOKEN);

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

app.post('/login', async (req, res) => {
  
    const { phone } = req.body;  
    client.verify.v2.services(process.env.TWILIO_SERVICE_ID)
    .verifications
    .create({to: '+1' + phone, channel: 'sms'})
    .then(verification => res.send(verification.status).status(200));
})

app.post('/verify', async (req, res) => {
    const { phone, code } = req.body
    const collection = db.collection("users");
    const data = collection.find({ phone: phone })
   
    client.verify.v2.services(process.env.TWILIO_SERVICE_ID)
    .verificationChecks
    .create({to: '+1' + phone, code: code })
    .then(async (verification_check) => {
        if (verification_check.valid) {
            if (verification_check.status == 'approved') {
                let result = null;
                try {
                    result = await collection.updateOne({ phone: phone }, { $set: { phone: phone }}, { upsert: true })
                    if (data.length > 0) {
                        res.send({
                            status: 1,
                            message: 'Exising data',
                            payload: data
                        }).status(200)
                    }
                    else {
                        res.send({
                            status: 2,
                            message: 'New data'
                        }).status(200)
                    }
                    
                } catch (e) {
                    res.status(502)
                }
            }
            else {
                res.status(400)
            }
        }  
        else {
            res.status(400)
        }   
    });
})

app.post('/setup', async (req, res) => {
    const { creditLimit, creditScore, phone, lastCycleDate, creditUtilization } = req.body;
    let collection = db.collection("users");

    let result = null;
    try {
        result = await collection.updateOne({ phone: phone }, { $set: { 
            phone: phone,
            creditScore: creditScore,
            creditLimit: creditLimit,
            creditUtilization: creditUtilization,
            lastCycleDate: lastCycleDate,
            createdAt: new Date(),
        }}, { upsert: true })
        res.send({
            status: 200,
            message: 'success'
        }).status(200)
    } catch (e) {
        res.status(502)
    }
})

app.post('/sms', async (req, res) => {
    let collection = db.collection("users");
    const query = { phone: req.body.phone }

    let data = await collection.findOne(query)
    const { creditLimit, creditUtilization, lastCycleDate, createdAt } = data
    const paymentList = req.body.paymentList

    let { limit, minDate, maxDate } = getDateRange(lastCycleDate, createdAt, creditUtilization)
    let resultList = paymentList.filter(e => (new Date(e.paymentDate) > minDate && (new Date(e.paymentDate) < maxDate)))
    let { status, message } = getMessage(resultList, limit, creditLimit)

    const updates = {
        $set: { 
            paymentList: paymentList,
            creditUtilization: limit
        }
    }

    let result = null;
    try {
        result = await collection.updateOne(query, updates)
    } catch (e) {
        res.status(502)
    }

    client.messages
      .create({body: message, from: process.env.PHONE_NUMBER, to: '+1' + req.body.phone })
      .then(message => res.send({
        status: status,
        message: message.body
      }).status(200))
})
app.use(bodyParser.urlencoded({ extended: false }));

app.post('/response', async (req, res) => {
    // Working code, just don't have the verification
    // const MessageResponse = twilio.twiml.MessagingResponse;
    // const twiml = new MessageResponse()
    // twiml.message('The Robots are coming! Head for the hills!');
    // res.type('application/xml').send(twiml.toString());
    let collection = db.collection("users");
    //console.log(req.body.Body)

    const v = req.body.Body.split(':');
    const phone = v[0];
    const amount = v[1];

    const data = await collection.findOne({ phone: phone })

    if (data) {
        let newPayment = {
            paymentAmount: amount,
            paymentDate: new Date().toISOString()
        }
    
        data.paymentList.push(newPayment)

        const { creditLimit, creditUtilization, lastCycleDate, createdAt, paymentList } = data
        console.log(data)
        let { limit, minDate, maxDate } = getDateRange(lastCycleDate, createdAt, creditUtilization)
        let resultList = paymentList.filter(e => (new Date(e.paymentDate) > minDate && (new Date(e.paymentDate) < maxDate)))
        let { status, message } = getMessage(resultList, limit, creditLimit)
        const result = await collection.updateOne({ phone: phone}, { $set: { paymentList: data.paymentList }})
        
        client.messages
        .create({body: message, from: '+18665253308', to: `+1${phone}`})
        .then(messageParam => res.send({
            status: status,
            message: message
        }).status(200))
    }
    else {
        client.messages
        .create({body: "Account does not exit.", from: '+18665253308', to: `+1${phone}`})
        .then(message => res.send({
            message: "Account does not exit."
        }).status(404))
    }   
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})