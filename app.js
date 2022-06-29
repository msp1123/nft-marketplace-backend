const express = require('express')
const logger = require('morgan')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const cors = require('cors')
const pe = require('parse-error')
const models = require('./models')
const CONFIG = require('./configs/global.configs')

const PORT = CONFIG.api_port
const app = express()

app.use(logger('combined'))
app.use(cors())
app.use(bodyParser.json())

app.get('/', (req, res) => {
    return res.json({
        message: 'Hello! Welcome to Metadata API.',
    })
})

const v1 = require('./routes/v1')
app.use('/v1', v1)

app.listen(PORT, () => {
    console.log('Server started on port', PORT)
})
