const mongoose = require('mongoose')
const Schema = mongoose.Schema
const mongoosePaginate = require('mongoose-paginate-v2')

const TokenLikesSchema = new mongoose.Schema({
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
    likes: {
        type: Number,
        default: 1
    },
}, {
    timestamps: true
});

TokenLikesSchema.plugin(mongoosePaginate)

const TokenLikes = module.exports = mongoose.model('TokenLikes', TokenLikesSchema, 'likes');