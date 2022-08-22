const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')
const CONFIG = require('../configs/global.configs')

const TokenSchema = new mongoose.Schema({
    active: {
        type: Boolean,
        default: true
    },
    status: {
        type: String,
        enum: CONFIG.tokenStatus
    },
    collectionName: {
        type: String,
        required: true
    },
    collectionId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Collection'
    },
    nftAddress: {
        type: String,
        required: true
    },
    chainId: {
        type: Number,
        required: true
    },
    tokenId: {
        type: Number,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    creator: {
        type: String,
        required: true
    },
    royalty: {
        type: Number,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    image: {
        type: String,
        required: true
    },
    animation_url: {
        type: String
    },
    external_url: {
        type: String
    },
    txHash: {
        type: String,
        unique: true
    },
    notifications: [{
        type: String
    }],
    likes: {
        type: Number,
        default: 0
    },
    comments: {
        type: Number,
        default: 0
    },
    tokenPrice: {
        type: Number
    },
    timestamp: {
        type: Number
    },
    attributes: [
        {
            trait_type: {
                type: String
            },
            value: {
                type: String
            }
        }
    ]
}, {timestamps: true})

TokenSchema.plugin(mongoosePaginate)

let Token = module.exports = mongoose.model('Token', TokenSchema, 'tokens')
