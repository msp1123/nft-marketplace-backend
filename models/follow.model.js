const mongoose = require('mongoose')
const Schema = mongoose.Schema
const mongoosePaginate = require('mongoose-paginate-v2')

const FollowSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    followId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    active: {
        type: Boolean,
        default: true
    },
    message: {
        type: String
    },
}, {
    timestamps: true
});

FollowSchema.plugin(mongoosePaginate)

const Follows = module.exports =  mongoose.model('Follow', FollowSchema);