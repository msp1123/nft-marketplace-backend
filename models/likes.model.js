const mongoose = require('mongoose')
const Schema = mongoose.Schema
const mongoosePaginate = require('mongoose-paginate-v2')

const LikesSchema = new mongoose.Schema({
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

LikesSchema.plugin(mongoosePaginate)

const Likes = module.exports = mongoose.model('NftLike', LikesSchema);