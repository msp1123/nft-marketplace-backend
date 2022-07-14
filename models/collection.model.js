const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2')

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
    external_url: {
        type: String
    },
    seller_fee_basis_points: {
        type: String
    },
    fee_recipient: {
        type: String
    },
}, {timestamps: true})

CollectionSchema.plugin(mongoosePaginate)

let Collection = module.exports = mongoose.model('Collection', CollectionSchema, 'collections')
