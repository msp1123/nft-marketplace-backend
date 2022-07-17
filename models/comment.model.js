const mongoose = require('mongoose')
const Schema = mongoose.Schema
const mongoosePaginate = require('mongoose-paginate-v2')

const TokenCommentsSchema = new mongoose.Schema({
    token: {
        type: mongoose.Schema.ObjectId,
        ref: 'Token',
        required: true
    },
    userId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    active: {
        type: Boolean,
        default: true
    },
    comment: {
        type: String,
        required: true
    },
}, {
    timestamps: true
});

TokenCommentsSchema.plugin(mongoosePaginate)

const TokenComments = module.exports = mongoose.model('TokenComments', TokenCommentsSchema, 'comments');