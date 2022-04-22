const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')

const TokenSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    tokenId: {
        type: String,
        required: true,
        unique: true
    },
    nft: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Nft',
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    external_url: {
        type: String,
        required: true,
        default: "https://opensea.io"
    },
    image: {
        type: String,
        required: true,
    },
    animation_url: {
        type: String,
    },
    attributes: [
        {
            trait_type: {
                type: String,
            },
            value: {
                type: Number,
            },
        }
    ],
    active: {
        type: Boolean,
        default: true,
    },
}, { timestamps: true })

TokenSchema.plugin(mongoosePaginate)

let Token = module.exports = mongoose.model('Token', TokenSchema)
