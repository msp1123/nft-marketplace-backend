const cors = require('cors')
const logger = require('morgan')
const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')

const models = require('./models')
const CONFIG = require('./configs/global.configs')

const app = express()
const PORT = CONFIG.api_port

app.use(cors())
app.use(bodyParser.json())
app.use(logger('combined'))

app.get('/', (req, res) => {
    return res.json({
        message: 'Hello! Welcome to NFT Marketplace API.',
    })
})

const v1 = require('./routes/v1')
app.use('/v1', v1)

app.listen(PORT, () => {
    console.log('Server started on port', PORT)
})
