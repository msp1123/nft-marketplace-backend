const mongoose = require('mongoose')
const Schema = mongoose.Schema
const mongoosePaginate = require('mongoose-paginate-v2')
const appConfigs = require('../configs/app.config')

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        index: true,
        sparse: true
    },
    active: {
        type: Boolean,
        default: false
    },
    address: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    imageUrl: {
        type: String,
        default: appConfigs.userImageUrl
    },
    firstName: {
        type: String,
        default: "None"
    },
    lastName: {
        type: String,
        default: "None"
    },
    about: {
        type: String
    },
    gender: {
        type: String
    },
    followers: {
        type: Number,
        default: 0
    },
    followings: {
        type: Number,
        default: 0
    },
    popularity: {
        type: Number,
        default: 0
    },
    verificationCode: {
        type: Number
    },
    emailVerified: {
        type: Boolean,
        default: false
    },
    private: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

UserSchema.plugin(mongoosePaginate)

const Users = module.exports = mongoose.model('User', UserSchema)
