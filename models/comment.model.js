const mongoose = require('mongoose')
const Schema = mongoose.Schema
const mongoosePaginate = require('mongoose-paginate-v2')

const CommentsSchema = new mongoose.Schema({
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
    comment: {
        type: String,
        required: true
    },
}, {
    timestamps: true
});

CommentsSchema.plugin(mongoosePaginate)

const Comments = module.exports = mongoose.model('NftComment', CommentsSchema);