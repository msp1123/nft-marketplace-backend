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
    previewImage: {
        type: String,
        required: true
    },
    externalUrl: {
        type: String
    },
    txHash: {
        type: String,
        unique: true
    },
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
    attachments: [
        {
            fileType: {
                type: String,
                enum: ["Image", "Video", "Audio", "Mp3"]
            },
            url: {
                type: String
            },
            height: {
                type: Number
            },
            width: {
                type: Number
            }
        }
    ],
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
