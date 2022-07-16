const mongoose = require('mongoose')
const Schema = mongoose.Schema
const mongoosePaginate = require('mongoose-paginate-v2')

const AdminSchema = new mongoose.Schema({
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
    password: {
        type: String,
        required: true
    },
    imageUrl: {
        type: String,
        default: "None"
    },
    firstName: {
        type: String,
        default: "None"
    },
    lastName: {
        type: String,
        default: "None"
    },
    bio: {
        type: String
    },
    verificationCode: {
        type: Number
    },
    emailVerified: {
        type: Boolean,
        default: false
    },
}, {
    timestamps: true
});

AdminSchema.plugin(mongoosePaginate)

const Admin = module.exports = mongoose.model('Admin', AdminSchema, 'admins')
