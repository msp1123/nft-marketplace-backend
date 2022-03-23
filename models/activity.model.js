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
        enum: ['SUBMITTED', 'FAILED', 'MINTED', 'ONSALE', 'BOUGHT', 'BURNT', 'TRANSFERD', 'PRICEUPDATED', 'SOLD'],
        default: 'SUBMITTED'
    },
    nftId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Nft',
        required: true
    },
    userId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    assetType: {
        type: String,
        required: true
    },
    tokenId: {
        type: Number,
        required: true
    },
    tokenPrice: {
        type: Number
    },
    itemId: {
        type: Number,
        default: 0
    },
    txHash: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

ActivitySchema.plugin(mongoosePaginate)

const Activity = module.exports = mongoose.model('Activity', ActivitySchema);