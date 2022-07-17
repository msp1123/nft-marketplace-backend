const mongoose = require('mongoose')

let QueueSchema = new mongoose.Schema({
    active: {
        type: Boolean,
        default: true
    },
    txHash: {
        type: String,
        required: true,
        unique: true
    }
}, {timestamps: true})

let Queue = module.exports = mongoose.model('Queue', QueueSchema, 'queues')
