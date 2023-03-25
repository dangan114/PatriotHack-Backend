import express from 'express'
import cors from 'cors'
import db from './services/db.js'
import dotenv from 'dotenv'
import twilio from 'twilio'

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
    let results = await collection.findOne({ phone: phone });
    res.send(results).status(200)
})

app.post('/setup', async (req, res) => {
    const { current, max, phone } = req.body;
    let collection = db.collection("users");
    let count = await collection.countDocuments({ phone: phone }, { limit: 1 })
 
    if (!count) {
        let newDocument = {
            phone,
            current,
            max,
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
    const { phone, message, paymentList } = req.body;

    // const client = twilio(process.env.TWILIO_ACCOUNT_ID, process.env.TWILIO_AUTH_TOKEN);
    // console.log(client)
    // client.messages
    //     .create({
    //         from: '+18663483502',
    //         to: phone,
    //         body: message
    //     })
    //     .then(message => console.log(message))
    //     .done()

    const query = { phone: phone }
    const updates = {
        $set: { paymentList: paymentList }
    }

    let collection = db.collection("users");
    let result = await collection.updateOne(query, updates)

    res.send(result).status(200);
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})