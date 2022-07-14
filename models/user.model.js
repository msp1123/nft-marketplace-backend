const mongoose = require('mongoose')
const Schema = mongoose.Schema
const mongoosePaginate = require('mongoose-paginate-v2')

const UserSchema = new mongoose.Schema({
    active: {
        type: Boolean,
        default: false
    },
    address: {
        type: String,
        required: true
    },
    imageUrl: {
        type: String,
        default: "None"
    },
    userName: {
        type: String,
        default: "None"
    },
    bio: {
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
    social: {
        type: Array,
        schema: [{
            type: Object,
            schema: {
                type: {
                    type: String
                },
                userName: {
                    type: String
                },
            }
        }]
    }
}, {
    timestamps: true
});

UserSchema.plugin(mongoosePaginate)

const Users = module.exports = mongoose.model('User', UserSchema, 'users')
