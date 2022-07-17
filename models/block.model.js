const mongoose = require('mongoose')

let BlockSchema = new mongoose.Schema({
    
    processName: {
        type: String,
    },
    block: {
        type: Number,
        default : 0
    }
}, {timestamps: true})

let Block = module.exports = mongoose.model('Block', BlockSchema, 'blocks')
