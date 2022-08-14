const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')
const CONFIG = require('../configs/global.configs')

const CollectionSchema = new mongoose.Schema({
    active: {
        type: Boolean,
        default: true
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
    category: {
        type: String,
        enum: CONFIG.nftCategories
    },
    name: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String
    },
    image: {
        type: String,
        required: true
    },
    external_url: {
        type: String
    },
    fee_recipient: {
        type: String
    },
}, {timestamps: true})

CollectionSchema.plugin(mongoosePaginate)

let Collection = module.exports = mongoose.model('Collection', CollectionSchema, 'collections')
