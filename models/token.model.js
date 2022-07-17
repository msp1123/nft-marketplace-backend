const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')

const TokenSchema = new mongoose.Schema({
    active: {
        type: Boolean,
        default: true
    },
    tokenId: {
        type: Number,
        required: true
    },
    chainId: {
        type: Number,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    owner: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
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
