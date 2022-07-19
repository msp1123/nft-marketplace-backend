const mongoose = require('mongoose')
const Schema = mongoose.Schema
const mongoosePaginate = require('mongoose-paginate-v2')

const ActivitySchema = new mongoose.Schema({
    active: {
        type: String,
        default: true
    },
    status: {
        type: String,
        enum: ['MINTED', 'LISTED', 'BOUGHT', 'TRANSFERD', 'UPDATED', 'SOLD'],
        default: 'SUBMITTED'
    },
    address: {
        type: String,
        required: true
    },
    nftAddress: {
        type: String,
        required: true
    },
    chainId: {
        type: Number,
        required: true
    },
    itemId: {
        type: Number,
        default: 0
    },
    tokenId: {
        type: Number,
        required: true
    },
    token: {
        type: mongoose.Schema.ObjectId,
        ref: 'Token',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    standard: {
        type: Number,
        required: true
    },
    price: {
        type: Number
    },
    timestamp: {
        type: Number
    },
    txHash: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

ActivitySchema.plugin(mongoosePaginate)

const Activity = module.exports = mongoose.model('Activity', ActivitySchema, 'activities');